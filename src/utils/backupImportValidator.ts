import { db } from '../db';
import { type BackupPayload } from './dataBackupEngine';

/**
 * バックアップインポート・バリデーター (v2.1.0)
 * Export済みJSONの健全性を、実DBへの書き込みなしに検証する。
 */

export interface ValidationReport {
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    app_id: string;
    format_version: number;
    created_at: string;
    table_checks: Record<string, { summary: number; actual: number; match: boolean }>;
    duplicate_checks: Record<string, { count: number; samples: string[] }>;
    recovery_stats: {
        b1_count: number;
        b2_count: number;
    };
    db_comparison: Record<string, { current: number; backup: number; delta: number }>;
    errors: string[];
    warnings: string[];
}

/**
 * JSONテキストをパースしてDry-run検証を実施する
 */
export async function validateBackupPayloadDryRun(jsonText: string): Promise<ValidationReport> {
    const report: ValidationReport = {
        verdict: 'PASS',
        app_id: 'unknown',
        format_version: 0,
        created_at: '',
        table_checks: {},
        duplicate_checks: {},
        recovery_stats: { b1_count: 0, b2_count: 0 },
        db_comparison: {},
        errors: [],
        warnings: []
    };

    let payload: any;
    try {
        payload = JSON.parse(jsonText);
    } catch (e) {
        report.verdict = 'FAIL';
        report.errors.push(`JSON パース失敗: ${e instanceof Error ? e.message : '不明なエラー'}`);
        return report;
    }

    report.app_id = payload.app || 'undefined';
    report.format_version = payload.backup_format_version || 0;
    report.created_at = payload.created_at || 'undefined';

    // 1. 基本スキーマ検証
    if (payload.app !== 'takken-app') {
        report.verdict = 'FAIL';
        report.errors.push(`アプリ識別子不一致: 期待="takken-app", 実際="${payload.app}"`);
    }

    if (!payload.backup_format_version) {
        report.verdict = 'FAIL';
        report.errors.push('バックアップ形式バージョンが見つかりません');
    } else if (payload.backup_format_version > 1) {
        if (report.verdict !== 'FAIL') report.verdict = 'WARNING';
        report.warnings.push(`未知の将来バージョンです (${payload.backup_format_version})。一部のデータが正しく処理されない可能性があります。`);
    }

    const requiredFields = ['summary', 'tables', 'created_at'];
    requiredFields.forEach(f => {
        if (!(f in payload)) {
            report.verdict = 'FAIL';
            report.errors.push(`必須フィールド欠落: ${f}`);
        }
    });

    if (report.verdict === 'FAIL') return report;

    // 2. テーブル存在・整合性検証
    const requiredTables = [
        'metadata', 'knowledge_cards', 'understanding_cards', 
        'source_questions', 'source_choices', 'restoration_candidates', 'study_events'
    ];

    const typedPayload = payload as BackupPayload;

    for (const table of requiredTables) {
        const data = typedPayload.tables[table as keyof typeof typedPayload.tables];
        const summaryCount = typedPayload.summary[table as keyof typeof typedPayload.summary] || 0;
        
        if (!data) {
            report.verdict = 'FAIL';
            report.errors.push(`必須テーブルデータ欠落: ${table}`);
            continue;
        }

        const actualCount = Array.isArray(data) ? data.length : -1;
        const match = summaryCount === actualCount;
        
        report.table_checks[table] = {
            summary: summaryCount,
            actual: actualCount,
            match
        };

        if (actualCount === -1) {
            report.verdict = 'FAIL';
            report.errors.push(`テーブルデータ形式不正 (配列期待): ${table}`);
        } else if (!match) {
            if (report.verdict !== 'FAIL') report.verdict = 'WARNING';
            report.warnings.push(`件数不一致: ${table} (Summary=${summaryCount}, Actual=${actualCount})`);
        }
    }

    // 3. 復元統計の抽出
    if (Array.isArray(typedPayload.tables.restoration_candidates)) {
        const rc = typedPayload.tables.restoration_candidates;
        report.recovery_stats.b1_count = rc.filter((c: any) => String(c.restoration_id).startsWith('RES-B1-')).length;
        report.recovery_stats.b2_count = rc.filter((c: any) => String(c.restoration_id).startsWith('RES-B2-')).length;
    }

    // 4. 重複ID検出
    const idKeys: Record<string, string> = {
        knowledge_cards: 'card_id',
        understanding_cards: 'card_id',
        source_questions: 'id',
        source_choices: 'id',
        restoration_candidates: 'restoration_id',
        study_events: 'event_id'
    };

    for (const [table, idKey] of Object.entries(idKeys)) {
        const data = typedPayload.tables[table as keyof typeof typedPayload.tables];
        if (!Array.isArray(data)) continue;

        const ids = data.map((item: any) => item[idKey]);
        const seen = new Set();
        const dupes: string[] = [];
        ids.forEach(id => {
            if (id === undefined || id === null) return;
            if (seen.has(id)) dupes.push(String(id));
            else seen.add(id);
        });

        if (dupes.length > 0) {
            report.verdict = 'FAIL';
            report.duplicate_checks[table] = {
                count: dupes.length,
                samples: dupes.slice(0, 3)
            };
            report.errors.push(`重複ID検出: ${table} (${dupes.length}件の重複あり)`);
        }
    }

    // 5. 現在のDBとの比較 (Read-only)
    const tablesToCompare = ['source_questions', 'source_choices', 'restoration_candidates', 'study_events'];
    for (const table of tablesToCompare) {
        try {
            const currentCount = await db.table(table).count();
            const backupCount = report.table_checks[table]?.actual || 0;
            
            report.db_comparison[table] = {
                current: currentCount,
                backup: backupCount,
                delta: backupCount - currentCount
            };
        } catch (e) {
            console.warn(`Comparison failed for table ${table}:`, e);
        }
    }

    return report;
}
