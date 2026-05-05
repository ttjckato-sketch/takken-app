import { db, type QualityImprovementSuggestion, type StudyEvent, type RecoveredLearningAsset, type KnowledgeUnit } from '../db';

/**
 * 品質改善候補を抽出する（精密版）
 */
export async function extractQualityImprovementCandidates(): Promise<any[]> {
    const events = await db.study_events.toArray();
    const assets = await db.recovered_learning_assets.toArray();
    const units = await db.knowledge_units.toArray();
    const cardStats = new Map<string, any>();
    
    events.sort((a, b) => a.created_at - b.created_at).forEach(e => {
        if (!cardStats.has(e.card_id)) {
            cardStats.set(e.card_id, { total: 0, correct: 0, continuous_miss: 0, tags: e.tags || [], category: e.category, exam_type: e.exam_type });
        }
        const s = cardStats.get(e.card_id)!;
        s.total++;
        if (e.answered_correct) { s.correct++; s.continuous_miss = 0; }
        else { s.continuous_miss++; }
    });

    const candidates: any[] = [];
    for (const [id, s] of cardStats.entries()) {
        const accuracy = s.correct / s.total;
        let issueType: any = null;
        if (s.continuous_miss >= 2) issueType = 'misleading';
        else if (s.total >= 3 && accuracy <= 0.35) issueType = 'bad_answer';

        if (issueType) {
            const asset = assets.find(a => a.asset_id === id);
            const unit = units.find(u => u.unit_id === id);
            candidates.push({
                target_id: id,
                target_type: id.startsWith('RA-') ? 'recovered_asset' : 'knowledge_unit',
                exam_type: s.exam_type,
                category: s.category,
                tags: s.tags,
                question: asset?.question || unit?.statement || '',
                answer: asset?.answer || unit?.core_rule || '',
                mistake_count: s.total - s.correct,
                recent_accuracy: accuracy,
                issue_type: issueType
            });
        }
    }
    return candidates;
}

/**
 * 修正案を生成し、安全性を判定する
 */
export async function generateImprovementSuggestions(): Promise<any> {
    const candidates = await extractQualityImprovementCandidates();
    const suggestions: QualityImprovementSuggestion[] = [];
    const now = Date.now();

    for (const c of candidates) {
        let suggestedQ = c.question;
        let requiresReview = true;
        if (c.issue_type === 'misleading' || c.question.includes('結論は？')) {
            suggestedQ = c.question.replace('結論は？', `この状況における【権利義務関係】や【法的結論】はどうなるか？`);
            requiresReview = false;
        }

        suggestions.push({
            suggestion_id: `SUG-${c.target_id}-${now}`,
            target_id: c.target_id,
            target_type: c.target_type,
            issue_type: c.issue_type,
            before_question: c.question,
            before_answer: '',
            suggested_question: suggestedQ,
            suggested_answer: c.answer,
            reason: '運用ログに基づく自動改善案',
            confidence: requiresReview ? 'medium' : 'high',
            requires_human_review: requiresReview,
            is_applied: false,
            created_at: now
        });
    }
    await db.quality_improvement_suggestions.clear();
    if (suggestions.length > 0) await db.quality_improvement_suggestions.bulkPut(suggestions);
    return { candidates_count: candidates.length, suggestions_count: suggestions.length };
}

/**
 * 優先修正78件の最終確定 (旧priorityFixEngineから統合)
 */
export async function finalizePriorityFixes(): Promise<any> {
    const suggestions = await db.quality_improvement_suggestions.toArray();
    let applied = 0; let supplemental = 0; let humanReview = 0;

    for (const s of suggestions) {
        if (s.is_applied) continue;
        const card = await db.understanding_cards.get(s.target_id);
        if (!card) continue;

        if (!s.requires_human_review && s.confidence !== 'low') {
            await db.understanding_cards.update(s.target_id, {
                sample_question: s.suggested_question,
                personal_notes: [...(card.personal_notes || []), 'applied_priority_fix_v2']
            });
            await db.quality_improvement_suggestions.update(s.suggestion_id, { is_applied: true });
            applied++;
        } else if (s.issue_type === 'shallow_analogy') {
            await db.understanding_cards.update(s.target_id, {
                usable_in_learning: false,
                tags: [...card.tags, 'supplemental_only']
            });
            supplemental++;
        } else {
            await db.understanding_cards.update(s.target_id, {
                usable_in_learning: false,
                personal_notes: [...(card.personal_notes || []), 'kept_for_human_review']
            });
            humanReview++;
        }
    }
    return { applied, supplemental, human_review: humanReview };
}
