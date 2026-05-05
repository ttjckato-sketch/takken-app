import { db, type EnhancedExplanation, type EnhancedExplanationRecord } from '../db';

/**
 * 高品質構造化解説の生成 (Grounded v2: 根拠に基づく抽出)
 */
export async function enhanceExplanationV2(sourceId: string): Promise<EnhancedExplanationRecord | null> {
    const card = await db.understanding_cards.get(sourceId);
    if (!card) return null;

    const originalExplanation = card.core_knowledge.essence || '';
    const rule = card.core_knowledge.rule || '';
    const question = card.sample_question || '';

    // --- 根拠の抽出ロジック (Grounded) ---
    const evidence: any = {};
    
    // 1. 結論の根拠 (core_rule に結論が明示されているか)
    if (rule.length > 5) evidence.conclusion = rule;

    // 2. 本質の根拠 (essence に説明があるか)
    if (originalExplanation.length > 10) evidence.essence = originalExplanation;

    // 3. ひっかけの根拠 (misconceptions から抽出)
    const traps = card.misconceptions?.map(m => m.misconception).filter(t => t && t !== 'なし') || [];
    if (traps.length > 0) evidence.traps = traps;

    // 4. 要件の根拠 (step_decomposition から抽出)
    const requirements = card.step_decomposition?.map(s => s.content).filter(c => c && c !== '規定なし') || [];
    if (requirements.length > 0) evidence.requirements = requirements;

    // --- 構造化データの構築 ---
    const enhanced: EnhancedExplanation = {
        conclusion: evidence.conclusion ? `法的結論: ${card.is_statement_true ? '正しい' : '誤り'}。${evidence.conclusion}` : '',
        essence: evidence.essence || '',
        requirements: requirements,
        legal_effect: evidence.essence?.includes('義務') ? '法的義務が発生する。' : '',
        exceptions: rule.includes('ただし') ? [rule.split('ただし')[1]] : [],
        traps: traps,
        related_knowledge: card.tags,
        memorize_table: [],
        comparison_table: [],
        one_line_summary: evidence.conclusion?.slice(0, 50) || '',
        confidence: evidence.conclusion && evidence.essence ? 'high' : 'medium',
        requires_human_review: !evidence.conclusion || !evidence.essence,
        requires_human_review_reason: !evidence.conclusion ? 'source_missing' : undefined,
        evidence_spans: evidence
    };

    const record: EnhancedExplanationRecord = {
        explanation_id: `EE-V2-${sourceId}`,
        source_id: sourceId,
        source_type: 'knowledge_unit',
        exam_type: card.exam_type || 'takken',
        category: card.category,
        tags: card.tags,
        question: question,
        original_explanation: originalExplanation,
        enhanced: enhanced,
        quality_score: evidence.conclusion ? 90 : 40,
        issue_flags: !evidence.conclusion ? ['mismatch'] : [],
        usable_in_learning: !!evidence.conclusion,
        created_at: Date.now(),
        updated_at: Date.now()
    };

    await db.enhanced_explanations.put(record);
    return record;
}

/**
 * 50件の Grounded v2 修正テスト
 */
export async function runBulkEnhancementTestV2(limit: number = 50): Promise<any> {
    const cards = await db.understanding_cards.limit(limit).toArray();
    let count = 0;
    let autoFixed = 0;
    let humanReview = 0;
    
    for (const card of cards) {
        const res = await enhanceExplanationV2(card.card_id);
        if (res) {
            count++;
            if (res.enhanced.requires_human_review) humanReview++;
            else autoFixed++;
        }
    }
    return { targeted: limit, created: count, auto_fixed: autoFixed, human_review: humanReview };
}
