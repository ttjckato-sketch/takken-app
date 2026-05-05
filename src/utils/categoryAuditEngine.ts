import { db, type UnderstandingCard, type EnhancedExplanationRecord, type ImprovementCandidate } from '../db';

/**
 * カテゴリ別の解説UX監査を実行し、不備のあるものを隔離保存する
 */
export async function runCategoryUXAudit(): Promise<any> {
    const cards = await db.understanding_cards.toArray();
    const enhanced = await db.enhanced_explanations.toArray();
    
    const categoryRules = [
        { name: '宅建業法', target: 50 },
        { name: '権利関係', target: 40 },
        { name: '法令上の制限', target: 30 },
        { name: '税・その他', target: 20 },
        { name: '管理受託契約', target: 15 },
        { name: '維持保全', target: 15 },
        { name: '金銭管理', target: 10 },
        { name: '賃貸借契約', target: 10 },
        { name: '賃貸住宅管理業法・法令', target: 10 }
    ];

    const results: any = {
        sampled_total: 0,
        category_stats: {},
        issues: {
            mismatch: 0,
            contradiction: 0,
            missing_conclusion: 0,
            missing_core_rule: 0,
            bad_explanation: 0
        },
        candidates: []
    };

    const candidatesToSave: ImprovementCandidate[] = [];

    for (const rule of categoryRules) {
        const catCards = cards.filter(c => c.category.includes(rule.name)).sort(() => 0.5 - Math.random()).slice(0, rule.target);
        const stats = { sampled: catCards.length, ok: 0, score: 0 };
        
        for (const card of catCards) {
            results.sampled_total++;
            const ee = enhanced.find(e => e.source_id === card.card_id);
            let score = 100;
            let issueType: ImprovementCandidate['issue_type'] = 'other';
            let reason = '';

            // 1. 結論の欠落 (法的根拠が薄い)
            if (!card.core_knowledge.rule || card.core_knowledge.rule.length < 10) {
                score -= 40; results.issues.missing_conclusion++;
                issueType = 'missing_core_rule'; reason = '法的結論の具体的な記述が不足。';
            }
            // 2. 本質の欠落 (浅い例え)
            if (card.core_knowledge.essence.length < 20 || card.core_knowledge.essence.includes('イメージ')) {
                score -= 30; results.issues.bad_explanation++;
                issueType = 'shallow_analogy'; reason = '法的本質の説明がなく、日常の例えに寄りすぎている。';
            }
            // 3. 不整合 (キーワード不一致等)
            if (ee && ee.enhanced.requires_human_review_reason === 'source_missing') {
                score -= 50; results.issues.mismatch++;
                issueType = 'mismatch'; reason = '問題文と解説の論点が一致していない（再リンクの必要あり）。';
            }

            if (score >= 80) stats.ok++;
            stats.score += score;

            // 改善候補として保存
            if (score < 80) {
                candidatesToSave.push({
                    candidate_id: `CAN-${card.card_id}-${Date.now()}`,
                    card_id: card.card_id,
                    category: card.category,
                    issue_type: issueType,
                    current_question: card.sample_question || card.core_knowledge.rule,
                    current_explanation: card.core_knowledge.essence,
                    suggested_fix_type: score < 50 ? 'human_review' : 'question_rewrite',
                    human_review_required: score < 50,
                    reason: reason,
                    created_at: Date.now()
                });
            }
        }
        results.category_stats[rule.name] = {
            sampled: stats.sampled,
            ok: stats.ok,
            avg_score: Math.round(stats.score / (stats.sampled || 1)),
            main_issue: stats.ok === stats.sampled ? 'NONE' : 'Quality Gap Detected'
        };
    }

    // 物理保存
    await db.improvement_candidates.clear();
    if (candidatesToSave.length > 0) {
        await db.improvement_candidates.bulkPut(candidatesToSave);
    }
    results.candidates_count = candidatesToSave.length;

    return results;
}
