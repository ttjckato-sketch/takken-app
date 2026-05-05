import { db } from '../db';

/**
 * IndexedDB データエクスポートエンジン (v2.1.0)
 * ユーザーの学習履歴、復元データ、各種設定をJSONとして安全に書き出す。
 */

export interface BackupPayload {
    app: string;
    backup_format_version: number;
    created_at: string;
    source: {
        release: string;
        origin: string;
    };
    summary: {
        knowledge_cards: number;
        understanding_cards: number;
        source_questions: number;
        source_choices: number;
        restoration_candidates: number;
        study_events: number;
        recovered_batch_1: number;
        recovered_batch_2: number;
    };
    tables: {
        metadata: any[];
        knowledge_cards: any[];
        understanding_cards: any[];
        source_questions: any[];
        source_choices: any[];
        restoration_candidates: any[];
        study_events: any[];
    };
}

/**
 * 現在の IndexedDB 状態からバックアップペイロードを構築する
 */
export async function buildBackupPayload(): Promise<BackupPayload> {
    console.log('📦 Building backup payload...');

    const [
        meta, kc, uc, sq, sc, rc, se
    ] = await Promise.all([
        db.metadata.toArray(),
        db.knowledge_cards.toArray(),
        db.understanding_cards.toArray(),
        db.source_questions.toArray(),
        db.source_choices.toArray(),
        db.restoration_candidates.toArray(),
        db.study_events.toArray()
    ]);

    const payload: BackupPayload = {
        app: "takken-app",
        backup_format_version: 1,
        created_at: new Date().toISOString(),
        source: {
            release: "v2.0.2+", // 現在のベース
            origin: "local_browser_indexeddb"
        },
        summary: {
            knowledge_cards: kc.length,
            understanding_cards: uc.length,
            source_questions: sq.length,
            source_choices: sc.length,
            restoration_candidates: rc.length,
            study_events: se.length,
            recovered_batch_1: rc.filter(c => c.restoration_id.startsWith('RES-B1-')).length,
            recovered_batch_2: rc.filter(c => c.restoration_id.startsWith('RES-B2-')).length
        },
        tables: {
            metadata: meta,
            knowledge_cards: kc,
            understanding_cards: uc,
            source_questions: sq,
            source_choices: sc,
            restoration_candidates: rc,
            study_events: se
        }
    };

    return payload;
}

/**
 * ペイロードを JSON ファイルとしてダウンロードする
 */
export async function exportBackupAsJsonFile(): Promise<{ filename: string; size: number }> {
    const payload = await buildBackupPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `takken-app-backup-${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);

    return {
        filename,
        size: blob.size
    };
}

/**
 * インポート予定のJSONを検証する (Dry-run)
 */
export async function validateBackupJson(jsonText: string): Promise<{
    is_valid: boolean;
    summary?: BackupPayload['summary'];
    error?: string;
}> {
    try {
        const payload: BackupPayload = JSON.parse(jsonText);
        
        if (payload.app !== "takken-app") {
            return { is_valid: false, error: "異なるアプリのデータです" };
        }
        
        if (!payload.tables || !payload.summary) {
            return { is_valid: false, error: "データ構造が不完全です" };
        }

        return {
            is_valid: true,
            summary: payload.summary
        };
    } catch (e) {
        return { is_valid: false, error: "JSON のパースに失敗しました" };
    }
}
