import { db, type UnderstandingCard, type SourceChoice, type EnhancedExplanationRecord } from '../db';
import { enhanceExplanationV2 } from './explanationEnhancer';

/**
 * リンク不全レコードの特定と修復
 */
export async function repairDataLinks(): Promise<any> {
    const cards = await db.understanding_cards.toArray();
    const choices = await db.source_choices.toArray();
    const results = {
        repaired: 0,
        human_review_required: 0,
        suspended: 0,
        contradiction_quarantined: 0
    };

    for (const card of cards) {
        let isMismatch = false;
        let isContradiction = false;

        // 1. ソースの特定 (source_choice_id または 属性一致)
        let matchedChoice = choices.find(c => c.id === card.source_choice_id);
        
        if (!matchedChoice) {
            // ID不一致の場合、属性一致を試みる (Year + QNo + LimbNo)
            matchedChoice = choices.find(c => {
                const idParts = card.card_id.split('_');
                const yearQ = idParts.find(p => p.includes('-'));
                return c.text.slice(0, 20) === card.core_knowledge.rule.slice(0, 20);
            });
            if (matchedChoice) isMismatch = true;
        }

        // 2. 矛盾の特定 (結論と解説の不一致)
        const explanation = matchedChoice?.explanation || '';
        const rule = card.core_knowledge.rule;
        if (explanation.includes('できない') && rule.includes('できる') && !explanation.includes('原則')) {
            isContradiction = true;
        }

        // 3. 修復と隔離
        if (isContradiction) {
            await db.understanding_cards.update(card.card_id, {
                is_statement_true: null, // 出題停止
                tags: [...card.tags, 'answer_explanation_contradiction']
            });
            results.contradiction_quarantined++;
            results.suspended++;
        } else if (matchedChoice) {
            // 正しい解説を再リンク (理解カードを更新)
            await db.understanding_cards.update(card.card_id, {
                source_choice_id: matchedChoice.id,
                // 解説不整合を修復するためのメタデータを付与
                personal_notes: [...(card.personal_notes || []), 'repaired_link_20260430']
            });
            
            // Grounded v2 を再生成
            await enhanceExplanationV2(card.card_id);
            results.repaired++;
        } else {
            results.human_review_required++;
        }
    }

    return results;
}
