import { db, type KnowledgeUnit, type MemoryCard, type UnderstandingCard, type RecoveredLearningAsset } from '../db';
import { extractLegalLearningSignals } from './analytics';
import { improveMemoryCardText } from './knowledgeEngine';
import { 
    executeRestorationBatch1, syncRestoredBatch1ToSource, 
    executeRestorationBatch2, syncRestoredBatch2ToSource,
    executeRestorationBatch3, syncRestoredBatch3ToSource,
    executeRestorationBatch4, syncRestoredBatch4ToSource
} from './restorationCandidates';
import { generateCategorySuggestions } from './categorySidecarReview';

/**
 * 埋もれた高品質データを検出し、RecoveredLearningAssetとして回収する
 */
export async function processHiddenValueRecovery(options: {
    takkenPendingLimit?: number;
    chintaiLowConfLimit?: number;
    excludedLimit?: number;
    clusterDeltaLimit?: number;
    runBatch1Restoration?: boolean;
    runBatch2Restoration?: boolean;
    runBatch3Restoration?: boolean;
    runBatch4Restoration?: boolean;
} = {}): Promise<any> {
    console.log('🧙 埋もれたお宝データの精密回収を開始します...', options);

    let batch1Results = null;
    if (options.runBatch1Restoration) {
        batch1Results = await executeRestorationBatch1(100);
        const syncedCount = await syncRestoredBatch1ToSource();
        console.log(`✅ Batch-1 Restoration completed: ${batch1Results.recovered_count} items recovered, ${syncedCount} synced to Active Recall.`);
    }

    let batch2Results = null;
    if (options.runBatch2Restoration) {
        batch2Results = await executeRestorationBatch2(50);
        const syncedCount = await syncRestoredBatch2ToSource();
        console.log(`✅ Batch-2 Restoration completed: ${batch2Results.recovered_count} items recovered, ${syncedCount} synced to Active Recall.`);
    }

    let batch3Results = null;
    if (options.runBatch3Restoration) {
        batch3Results = await executeRestorationBatch3(50);
        const syncedCount = await syncRestoredBatch3ToSource();
        console.log(`✅ Batch-3 Restoration completed: ${batch3Results.recovered_count} items recovered, ${syncedCount} synced to Active Recall.`);
    }

    let batch4Results = null;
    if (options.runBatch4Restoration) {
        batch4Results = await executeRestorationBatch4(100);
        const syncedCount = await syncRestoredBatch4ToSource();
        console.log(`✅ Batch-4 Restoration completed: ${batch4Results.recovered_count} items recovered, ${syncedCount} synced to Active Recall.`);
    }
    
    const allCards = await db.understanding_cards.toArray();
    const existingUnitIds = new Set((await db.knowledge_units.toArray()).map(u => u.source_card_id));
    
    // カテゴリ別の未開拓データ抽出
    const pendingTakken = allCards.filter(c => c.exam_type === 'takken' && !existingUnitIds.has(c.card_id));
    const pendingChintai = allCards.filter(c => c.exam_type === 'chintai' && !existingUnitIds.has(c.card_id));
    
    // 今回のステップ実行用の対象選定
    let targets: UnderstandingCard[] = [];
    if (options.takkenPendingLimit) targets = [...targets, ...pendingTakken.slice(0, options.takkenPendingLimit)];
    if (options.chintaiLowConfLimit) targets = [...targets, ...pendingChintai.slice(0, options.chintaiLowConfLimit)];
    
    // 全件実行（オプションなし）の場合は全件を対象
    if (Object.keys(options).length === 0) {
        targets = allCards.filter(c => !existingUnitIds.has(c.card_id));
    }

    const recoveredAssets: RecoveredLearningAsset[] = [];
    const now = Date.now();

    for (const card of targets) {
        const rule = card.core_knowledge?.rule || '';
        const essence = card.core_knowledge?.essence || '';
        const patterns = card.question_patterns?.correct_patterns || [];
        const explanation = patterns.length > 0 ? (patterns[0].explanation?.full || '') : '';
        const combinedText = (rule + ' ' + essence + ' ' + explanation).toLowerCase();
        
        const signals = extractLegalLearningSignals(rule, explanation);
        
        // 救済可否判定
        const isRich = explanation.length > 50 || rule.length > 15;
        const hasNumbers = signals.numbers_to_memorize.length > 0;
        
        if (!isRich && !hasNumbers) continue;

        const assetType = hasNumbers ? 'number_card' : (combinedText.includes('ただし') ? 'trap_card' : 'memory_card');
        // プレースホルダや文字化けの最終チェック
        const isPlaceholder = combinedText.includes('（テキスト元データ不足）') || combinedText.includes('データ不足');
        const isLowQuality = isPlaceholder || combinedText.includes('不明') || combinedText.length < 10;

        const asset: RecoveredLearningAsset = {
            asset_id: `RA-${card.card_id.replace(/[^\w-]/g, '_')}`,
            source_id: card.card_id,
            source_type: card.exam_type === 'takken' ? 'takken_recovery_pending' : 'chintai_low_confidence',
            exam_type: card.exam_type || 'takken',
            category: card.category,
            tags: [...card.tags, 'recovered'],
            asset_type: assetType,
            source_text: rule,
            confidence: isLowQuality ? 'low' : 'medium',
            recovery_reason: hasNumbers ? '数字シグナル' : '充実した解説',
            contradiction_risk: isPlaceholder ? 'high' : 'none',
            usable_in_learning: !isLowQuality,
            created_at: now,
            question: '',
            answer: ''
        };

        // 問いと答えの生成
        if (assetType === 'memory_card') {
            asset.question = `【回収論点】\n状況: ${card.category}において「${card.sample_question || rule.slice(0, 40)}...」\nこの法的な結論は？`;
            asset.answer = rule;
        } else if (assetType === 'number_card') {
            asset.question = `【数字の確認】\n${card.category}：${rule.slice(0, 40)}...\nこの規定に関連する「数字」や「期間」は？`;
            asset.answer = signals.numbers_to_memorize.join(', ');
        } else if (assetType === 'trap_card') {
            asset.question = `【注意点】\n${card.category}：${rule.slice(0, 40)}...\n間違いやすいポイントや例外規定は？`;
            asset.answer = essence || explanation.slice(0, 100);
        }

        recoveredAssets.push(asset);
    }

    // 既存の救済資産を保持しつつ追加 (bulkPut)
    if (recoveredAssets.length > 0) {
        await db.recovered_learning_assets.bulkPut(recoveredAssets);
    }

    return {
        recovered_count: recoveredAssets.length,
        usable_count: recoveredAssets.filter(a => a.usable_in_learning).length
    };
}

export async function getCategorySidecarSummary() {
    const cards = await db.understanding_cards.toArray();
    const restorations = await db.restoration_candidates.toArray();
    const suggestions = generateCategorySuggestions(cards, restorations);
    
    return {
        total_suspect: suggestions.length,
        high_confidence: suggestions.filter(s => s.confidence === 'high').length,
        needs_review: suggestions.filter(s => s.confidence === 'medium').length,
        samples: suggestions.slice(0, 5)
    };
}
