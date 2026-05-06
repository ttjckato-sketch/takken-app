/**
 * 初期データ自動ローダー（強化版）
 * publicフォルダのデータを自動的にIndexedDBにロード
 * エラー耐性と進捗表示を強化し、metadataで管理
 */

import { db, type KnowledgeCard } from '../db';
import { buildIntegratedCard } from './dataIntegration';
import { importChintaiData } from './chintaiDataTransformer';
import { processChintaiOptimization } from './chintaiOptimizer';
import { integrateHighQualityData, isHighQualityDataLoaded } from './highQualityDataLoader';
import { logDatabaseStats } from './analytics';
import { convertTakkinToSourceData } from './takkenSourceTransformer';
import { resolvePublicAssetPath } from './publicAssetPath';

// グローバル進捗コールバック（オプション）
export type ImportProgressCallback = (current: number, total: number, message: string) => void;

let progressCallback: ImportProgressCallback | null = null;

export function setImportProgressCallback(callback: ImportProgressCallback | null) {
  progressCallback = callback;
}

function reportProgress(current: number, total: number, message: string) {
  console.log(`📊 ${message} (${current}/${total})`);
  if (progressCallback) {
    progressCallback(current, total, message);
  }
}

const IMPORT_VERSION = '1.0.0';
const EXPECTED_COUNTS = {
  understanding_cards: 4000,
  chintai_cards: 500,
  knowledge_cards: 4000
};

/**
 * データがロードされているか厳格に確認
 */
export async function isDataLoaded(): Promise<boolean> {
  try {
    // metadataチェック
    const importStatus = await db.metadata.get('import_status');
    const importVersion = await db.metadata.get('import_version');

    if (importStatus?.value !== 'success') {
      console.log('⚠️ import_status !== success');
      return false;
    }

    if (!importVersion?.value) {
      console.log('⚠️ import_version missing');
      return false;
    }

    // 件数チェック
    const understandingCount = await db.understanding_cards.count();
    const chintaiCount = await db.understanding_cards.where('exam_type').equals('chintai').count();
    const knowledgeCount = await db.knowledge_cards.count();

    const isLoaded =
      understandingCount >= EXPECTED_COUNTS.understanding_cards &&
      chintaiCount >= EXPECTED_COUNTS.chintai_cards &&
      knowledgeCount >= EXPECTED_COUNTS.knowledge_cards;

    console.log(`📊 Data check:`, {
      understanding: `${understandingCount}/${EXPECTED_COUNTS.understanding_cards}`,
      chintai: `${chintaiCount}/${EXPECTED_COUNTS.chintai_cards}`,
      knowledge: `${knowledgeCount}/${EXPECTED_COUNTS.knowledge_cards}`,
      loaded: isLoaded
    });

    return isLoaded;
  } catch (error) {
    console.error('❌ isDataLoaded error:', error);
    return false;
  }
}

export async function loadInitialData(forceReload: boolean = false): Promise<{ success: boolean; message: string }> {
  try {
    // すでにロード済みでforceReloadでない場合はスキップ
    if (!forceReload && await isDataLoaded()) {
      console.log('✓ データは既にロード済みです');
      await logDatabaseStats();
      return { success: true, message: 'データは既にロード済みです' };
    }

    // 既存データをクリア
    console.log('🔄 既存データをクリアします...');
    await db.knowledge_cards.clear();
    await db.understanding_cards.clear();
    await db.source_questions.clear();
    await db.source_choices.clear();
    console.log('✓ 既存データをクリアしました');

    // ULTIMATE_STUDY_DECK.jsonをロード
    reportProgress(0, 0, '宅建データファイルを読み込み中...');

    const timestamp = new Date().getTime();
    const deckUrl = resolvePublicAssetPath(`ULTIMATE_STUDY_DECK.json?v=${timestamp}`);
    const response = await fetch(deckUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('宅建データファイルの読み込みに失敗しました');
    }

    const data = await response.json();
    const deck: KnowledgeCard[] = data.ultimate_deck || [];
    const total = deck.length;

    if (total === 0) {
      await db.metadata.put({ key: 'import_status', value: 'failed' });
      return { success: false, message: '宅建データが空です' };
    }

    reportProgress(0, total, `合計${total}枚のカードをインポート開始...`);

    // バッチ処理でインポート
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < total; i += batchSize) {
      const batch = deck.slice(i, Math.min(i + batchSize, total));
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(total / batchSize);

      reportProgress(i, total, `バッチ${batchNum}/${totalBatches}を処理中...`);

      for (const card of batch) {
        try {
          if (!card || !card.card_id) {
            console.warn('⚠️ 無効なカードデータをスキップ:', card);
            errorCount++;
            continue;
          }

          // 統合理解カードを生成して保存（試験種別='takken'を付与）
          const understandingCard = buildIntegratedCard(card);
          understandingCard.exam_type = 'takken';

          await db.understanding_cards.put(understandingCard);
          successCount++;
        } catch (cardError) {
          const errorMsg = cardError instanceof Error ? cardError.message : '不明なエラー';
          console.warn(`⚠️ カード処理エラー (${card?.card_id || 'unknown'}):`, errorMsg);
          errors.push(`${card?.card_id || 'unknown'}: ${errorMsg}`);
          errorCount++;
        }
      }

      // knowledge_cardsへのバッチ保存
      try {
        await db.knowledge_cards.bulkPut(batch);
      } catch (bulkPutError) {
        console.warn('⚠️ knowledge_cards bulkPutでエラー発生。1件ずつの安全なインポートへ切り替えます', bulkPutError);

        for (const card of batch) {
          try {
            await db.knowledge_cards.put(card);
          } catch (singlePutError) {
            console.warn(`⚠️ カード ${card.card_id} の保存に失敗（スキップ）:`, singlePutError);
            errorCount++;
          }
        }
      }

      if (i + batchSize < total) {
        reportProgress(i + batchSize, total, `${successCount}枚成功、${errorCount}枚エラー`);
      }
    }

    reportProgress(total, total, `インポート完了: ${successCount}枚成功、${errorCount}枚エラー`);

    // エラー概要をログ
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length}件のエラーが発生しました:`);
      console.warn('エラー詳細（最初の10件）:', errors.slice(0, 10));
    }

    // 賃貸データをインポート
    reportProgress(0, 0, '賃貸データをインポート中...');
    const chintaiResult = await importChintaiData();
    if (!chintaiResult.success) {
      console.warn('賃貸データロード失敗:', chintaiResult.message);
      await db.metadata.put({ key: 'import_status', value: 'partial' });
      return {
        success: false,
        message: `賃貸データロード失敗: ${chintaiResult.message}`
      };
    }
    reportProgress(0, 0, `賃貸データインポート完了: ${chintaiResult.imported || 0}問`);

    // 賃貸データの最適化（知識ユニット化）を実行
    reportProgress(0, 0, '賃貸知識構造を最適化中...');
    try {
        const optResult = await processChintaiOptimization();
        console.log('✓ Chintai Optimization:', optResult);
    } catch (optError) {
        console.warn('⚠️ 賃貸最適化エラー:', optError);
    }

    // 高品質データ統合
    const highQualityLoaded = await isHighQualityDataLoaded();
    if (!highQualityLoaded) {
      reportProgress(0, 0, '高品質データを統合中...');
      const highQualityResult = await integrateHighQualityData();
      if (highQualityResult.success) {
        console.log('✓', highQualityResult.message);
        reportProgress(0, 0, '高品質データ統合完了');
      } else {
        console.warn('高品質データ統合失敗:', highQualityResult.message);
      }
    }

    // 最終件数チェック
    const finalUnderstanding = await db.understanding_cards.count();
    const finalChintai = await db.understanding_cards.where('exam_type').equals('chintai').count();
    const finalKnowledge = await db.knowledge_cards.count();

    const isCountsValid =
      finalUnderstanding >= EXPECTED_COUNTS.understanding_cards &&
      finalChintai >= EXPECTED_COUNTS.chintai_cards &&
      finalKnowledge >= EXPECTED_COUNTS.knowledge_cards;

    if (!isCountsValid) {
      console.error('❌ データ件数が不足しています:', {
        understanding: `${finalUnderstanding}/${EXPECTED_COUNTS.understanding_cards}`,
        chintai: `${finalChintai}/${EXPECTED_COUNTS.chintai_cards}`,
        knowledge: `${finalKnowledge}/${EXPECTED_COUNTS.knowledge_cards}`
      });
      await db.metadata.put({ key: 'import_status', value: 'failed' });
      await db.metadata.put({ key: 'import_error', value: 'Insufficient card count' });
      return {
        success: false,
        message: `データ件数不足: understanding=${finalUnderstanding}, chintai=${finalChintai}, knowledge=${finalKnowledge}`
      };
    }

    // 成功時にmetadataを保存
    await db.metadata.bulkPut([
      { key: 'import_status', value: 'success' },
      { key: 'import_version', value: IMPORT_VERSION },
      { key: 'import_date', value: new Date().toISOString() },
      { key: 'understanding_count', value: finalUnderstanding },
      { key: 'chintai_count', value: finalChintai },
      { key: 'knowledge_count', value: finalKnowledge }
    ]);

    console.log('✓ Import metadata saved');

    // DB統計を表示
    await logDatabaseStats();

    return {
      success: true,
      message: `データロード完了: 宅建${finalKnowledge}枚、賃貸${finalChintai}枚、統合${finalUnderstanding}枚`
    };

  } catch (error) {
    console.error('❌ 初期データロードエラー:', error);
    await db.metadata.put({ key: 'import_status', value: 'failed' });
    await db.metadata.put({ key: 'import_error', value: error instanceof Error ? error.message : 'Unknown error' });
    reportProgress(0, 0, `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    return {
      success: false,
      message: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

/**
 * データベースを完全にリセット（開発用）
 */
export async function resetDatabase(): Promise<void> {
  console.warn('⚠️ Resetting database...');
  await db.delete();
  console.log('✓ Database deleted. Reloading page...');
  window.location.reload();
}
