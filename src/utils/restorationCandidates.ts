import { db, type RestorationCandidate, type UnderstandingCard } from '../db';
import { classifyTakkenCard, validateStatementTextForActiveRecall } from './takkenSourceTransformer';
import { classifyExplanationSignal } from './explanationSignalClassifier';

/**
 * P26: 教材復元 Batch-1/2 抽出および復元ロジック (v2.1.0)
 * 2621件の除外カードから安全に復元可能な50-100件を抽出し、
 * 決定論的ルールに基づいて復元データを生成する。
 */

export interface RestorationResult {
    total_scanned: number;
    batch_size: number;
    recovered_count: number;
    validation_pass: number;
    validation_fail: number;
    duplicates_skipped: number;
    excluded_reasons: Record<string, number>;
}

/**
 * Batch-1: 決定論的ルールに基づく復元エンジンの実行
 */
export async function executeRestorationBatch1(limit: number = 100): Promise<RestorationResult> {
    console.log(`🚀 [V210-BATCH-1] Starting data recovery pipeline...`);

    const takkenCards = await db.understanding_cards.where('exam_type').equals('takken').toArray();
    const sourcedQuestions = await db.source_questions.where('exam_type').equals('takken').toArray();
    const sourcedCardIds = new Set(sourcedQuestions.map(q => q.source_card_id));

    // 除外カード（現在出題対象外のもの）を特定
    const excludedCards = takkenCards.filter(c => !sourcedCardIds.has(c.card_id));
    
    const results: RestorationResult = {
        total_scanned: excludedCards.length,
        batch_size: 0,
        recovered_count: 0,
        validation_pass: 0,
        validation_fail: 0,
        duplicates_skipped: 0,
        excluded_reasons: {}
    };

    const candidates: RestorationCandidate[] = [];
    const now = Date.now();

    for (const card of excludedCards) {
        if (candidates.length >= limit) break;

        const classification = classifyTakkenCard(card);
        
        // 1. 個数・組合せ問題は Batch-1 では厳格に除外
        if (classification.category === 'active_recall_excluded_count_combination') {
            results.excluded_reasons['combination_question'] = (results.excluded_reasons['combination_question'] || 0) + 1;
            continue;
        }

        // 2. 復元可能性の判定
        const recoveryData = attemptDeterministicRecovery(card);
        if (!recoveryData) {
            results.excluded_reasons['no_deterministic_rule'] = (results.excluded_reasons['no_deterministic_rule'] || 0) + 1;
            continue;
        }

        // 3. バリデーション
        const validation = validateStatementTextForActiveRecall(recoveryData.text, {
            cardId: card.card_id,
            explanation: recoveryData.explanation
        });

        if (!validation.ok) {
            results.validation_fail++;
            results.excluded_reasons[`validation_${validation.category}`] = (results.excluded_reasons[`validation_${validation.category}`] || 0) + 1;
            continue;
        }

        results.validation_pass++;

        const candidate: RestorationCandidate = {
            restoration_id: `RES-B1-${card.card_id}`,
            source_choice_id: `SC-B1-${card.card_id}`,
            source_question_id: `SQ-B1-${card.card_id}`,
            exam_type: 'takken',
            category: card.category,
            year: recoveryData.year,
            question_no: recoveryData.question_no,
            option_no: recoveryData.option_no,
            original_text: card.sample_question || '',
            original_explanation: '',
            original_is_statement_true: card.is_statement_true ?? null,
            restore_reason: classification.category === 'source_recovery_pending' ? 'null_statement' : 'placeholder_text_shortage',
            restored_text: recoveryData.text,
            restored_explanation: recoveryData.explanation,
            restored_is_statement_true: recoveryData.is_true,
            confidence: 'high',
            source_refs: [{ 
                source_type: 'internal_db', 
                title: 'Batch-1 Deterministic Recovery', 
                ref: `flashcard_trace_${card.card_id}`,
                checked_at: now 
            }],
            review_status: 'auto_ok',
            created_at: now,
            updated_at: now
        };

        candidates.push(candidate);
    }

    results.batch_size = candidates.length;

    if (candidates.length > 0) {
        await db.restoration_candidates.bulkPut(candidates);
        results.recovered_count = candidates.length;
    }

    return results;
}

/**
 * Batch-2: 解説文シグナルに基づく復元エンジンの実行
 */
export async function executeRestorationBatch2(limit: number = 50): Promise<RestorationResult> {
    console.log(`🚀 [V210-BATCH-2] Starting explanation signal recovery pipeline...`);

    const takkenCards = await db.understanding_cards.where('exam_type').equals('takken').toArray();
    const sourcedQuestions = await db.source_questions.where('exam_type').equals('takken').toArray();
    const sourcedCardIds = new Set(sourcedQuestions.map(q => q.source_card_id));
    
    // すでに復元済みのID（B1を含む）を取得
    const existingRestorationIds = new Set((await db.restoration_candidates.toArray()).map(c => c.restoration_id));

    // 除外カードのうち、まだ復元されていない null_statement 候補を抽出
    const excludedCards = takkenCards.filter(c => 
        !sourcedCardIds.has(c.card_id) && 
        !existingRestorationIds.has(`RES-B1-${c.card_id}`) &&
        !existingRestorationIds.has(`RES-B2-${c.card_id}`)
    );
    
    const results: RestorationResult = {
        total_scanned: excludedCards.length,
        batch_size: 0,
        recovered_count: 0,
        validation_pass: 0,
        validation_fail: 0,
        duplicates_skipped: 0,
        excluded_reasons: {}
    };

    const candidates: RestorationCandidate[] = [];
    const now = Date.now();

    for (const card of excludedCards) {
        if (candidates.length >= limit) break;

        // null_statement (判定不能) カードを主対象とする
        if (card.is_statement_true !== null) continue;

        const explanation = card.core_knowledge?.essence || '';
        const signal = classifyExplanationSignal(explanation);

        if (signal.confidence !== 'high' || signal.is_true === null) {
            results.excluded_reasons[`signal_${signal.polarity}`] = (results.excluded_reasons[`signal_${signal.polarity}`] || 0) + 1;
            continue;
        }

        const statement = card.core_knowledge?.rule || card.sample_question || '';
        const validation = validateStatementTextForActiveRecall(statement, {
            cardId: card.card_id,
            explanation: explanation
        });

        if (!validation.ok) {
            results.validation_fail++;
            results.excluded_reasons[`validation_${validation.category}`] = (results.excluded_reasons[`validation_${validation.category}`] || 0) + 1;
            continue;
        }

        results.validation_pass++;

        const candidate: RestorationCandidate = {
            restoration_id: `RES-B2-${card.card_id}`,
            source_choice_id: `SC-B2-${card.card_id}`,
            source_question_id: `SQ-B2-${card.card_id}`,
            exam_type: 'takken',
            category: card.category,
            year: 0,
            question_no: 0,
            option_no: 1,
            original_text: statement,
            original_explanation: explanation,
            original_is_statement_true: null,
            restore_reason: 'null_statement',
            restored_text: statement,
            restored_explanation: explanation,
            restored_is_statement_true: signal.is_true,
            confidence: 'high',
            source_refs: [{ 
                source_type: 'internal_db', 
                title: 'Batch-2 Signal Recovery', 
                ref: `explanation_signal_${card.card_id}`,
                checked_at: now 
            }],
            review_status: 'auto_ok',
            created_at: now,
            updated_at: now
        };

        candidates.push(candidate);
    }

    results.batch_size = candidates.length;

    if (candidates.length > 0) {
        await db.restoration_candidates.bulkPut(candidates);
        results.recovered_count = candidates.length;
    }

    return results;
}

/**
 * 決定論的ルールによるデータ復元試行
 */
function attemptDeterministicRecovery(card: UnderstandingCard): {
    text: string;
    explanation: string;
    is_true: boolean;
    year: number;
    question_no: number;
    option_no: number;
} | null {
    // ルール1: core_knowledge.rule が十分な長さを持つ場合
    if (card.core_knowledge?.rule && card.core_knowledge.rule.length > 20) {
        return {
            text: card.core_knowledge.rule,
            explanation: card.core_knowledge.essence || '法的根拠に基づく規定です。',
            is_true: true,
            year: 0,
            question_no: 0,
            option_no: 1
        };
    }
    
    return null;
}

/**
 * 復元済みカードを Active Recall 出題対象に同期する (汎用版)
 */
export async function syncRestoredBatchToSource(batchId: 'B1' | 'B2') {
    const restored = await db.restoration_candidates
        .where('review_status').equals('auto_ok')
        .and(c => c.restoration_id.startsWith(`RES-${batchId}-`))
        .toArray();

    let syncedCount = 0;

    for (const item of restored) {
        if (!item.restored_text || item.restored_is_statement_true === undefined) continue;

        // source_questions への登録
        await db.source_questions.put({
            id: item.source_question_id,
            exam_type: 'takken',
            year: item.year,
            question_no: item.question_no,
            question_text: item.restored_text,
            correct_option: item.option_no,
            question_type: 'true_false',
            polarity: 'select_true',
            category: item.category,
            source_card_id: item.source_question_id.replace(`SQ-${batchId}-`, '')
        });

        // source_choices への登録
        await db.source_choices.put({
            id: item.source_choice_id,
            question_id: item.source_question_id,
            option_no: item.option_no,
            text: item.restored_text,
            is_exam_correct_option: true,
            is_statement_true: item.restored_is_statement_true,
            explanation: item.restored_explanation || '',
            source_card_id: item.source_question_id.replace(`SQ-${batchId}-`, '')
        });

        syncedCount++;
    }

    return syncedCount;
}

export async function syncRestoredBatch1ToSource() { return syncRestoredBatchToSource('B1'); }
export async function syncRestoredBatch2ToSource() { return syncRestoredBatchToSource('B2'); }
