/**
 * データ初期化ユーティリティ
 * 既存DB・Fresh DB両方で宅建source backfillを確実に実行
 */

import { loadInitialData, isDataLoaded } from './autoDataLoader';
import { ensureTakkenSourceTransformed } from './takkenSourceTransformer';
import { logDatabaseStats } from './analytics';

/**
 * アプリ起動時にデータ準備を完了させる
 * 既存DB・Fresh DBどちらでも確実に宅建source backfillが走る
 */
export async function ensureAllDataReady(): Promise<{
  success: boolean;
  message: string;
  steps: Array<{ step: string; status: string; result?: string }>;
}> {
  const steps: Array<{ step: string; status: string; result?: string }> = [];

  // P46: dev/test限定のシードスキップガード
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('skipAutoSeed') === '1') {
      console.warn('🧪 E2E Stability: Skipping auto seeding as requested by skipAutoSeed=1');
      return {
        success: true,
        message: '自動シードをスキップしました（デバッグ/テストモード）',
        steps: [{ step: 'シードスキップ', status: 'success', result: 'URLパラメータによりスキップ' }]
      };
    }
  }

  try {
    // Step 1: 基本データロード確認
    steps.push({ step: '基本データロード確認', status: 'running' });
    const loaded = await isDataLoaded();

    if (!loaded) {
      steps.push({ step: '基本データロード実行', status: 'running' });
      const loadResult = await loadInitialData();
      steps[1].status = loadResult.success ? 'success' : 'failed';
      steps[1].result = loadResult.message;

      if (!loadResult.success) {
        return {
          success: false,
          message: `基本データロード失敗: ${loadResult.message}`,
          steps
        };
      }
    } else {
      steps.push({ step: '基本データロード確認', status: 'success', result: '既にロード済み' });
    }

    // Step 2: 宅建source変換確認（既存DBでも必ず実行）
    steps.push({ step: '宅建source変換確認', status: 'running' });
    const transformResult = await ensureTakkenSourceTransformed();

    if (transformResult.success) {
      steps[2].status = 'success';
      steps[2].result = transformResult.message;

      // 統計情報を追加
      if (transformResult.stats) {
        steps[2].result += ` (Q: ${transformResult.stats.source_questions_count}, C: ${transformResult.stats.source_choices_count})`;
      }
    } else {
      steps[2].status = 'failed';
      steps[2].result = transformResult.message;
    }

    // Step 3: DB統計表示
    steps.push({ step: 'DB統計ログ', status: 'running' });
    await logDatabaseStats();
    steps[3].status = 'success';

    return {
      success: true,
      message: 'データ準備完了',
      steps
    };

  } catch (error) {
    steps.push({ step: 'データ初期化', status: 'failed', result: error instanceof Error ? error.message : '不明なエラー' });
    return {
      success: false,
      message: error instanceof Error ? error.message : '不明なエラー',
      steps
    };
  }
}
