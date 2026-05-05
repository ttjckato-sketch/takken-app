import { type UnderstandingCard, type RestorationCandidate } from '../db';
import { detectCategorySuspect, type CategorySuspectResult } from './categorySignalClassifier';

/**
 * カテゴリ修正提案の Sidecar ロジック (v2.1.0)
 */

export type SuggestionConfidence = 'high' | 'medium' | 'low';
export type SuggestionReviewStatus = 'suggested' | 'needs_human_review' | 'excluded';

export interface CategoryCorrectionSuggestion {
    id: string;
    source_card_id: string;
    original_category: string;
    suggested_category: string | null;
    reason: string;
    confidence: SuggestionConfidence;
    evidence_terms: string[];
    conflict_categories: string[];
    review_status: SuggestionReviewStatus;
    created_at: number;
}

/**
 * カード群からカテゴリ修正提案を生成する (In-memory)
 */
export function generateCategorySuggestions(
    cards: UnderstandingCard[],
    restorations: RestorationCandidate[]
): CategoryCorrectionSuggestion[] {
    const suggestions: CategoryCorrectionSuggestion[] = [];
    const now = Date.now();

    // restoration_candidates から card_id へのマップを作成
    const restorationMap = new Map<string, RestorationCandidate>();
    restorations.forEach(r => {
        const cardId = r.restoration_id.split('-').slice(2).join('-');
        if (cardId) restorationMap.set(cardId, r);
    });

    for (const card of cards) {
        const res = restorationMap.get(card.card_id);
        const text = (card.sample_question || '') + ' ' + (card.core_knowledge?.rule || '') + ' ' + (card.core_knowledge?.essence || '');
        
        const suspectResult = detectCategorySuspect(card.category, text);

        if (suspectResult.is_suspect) {
            const confidence = suspectResult.conflict_categories.length === 1 ? 'high' : 'medium';
            
            suggestions.push({
                id: `CAT-SUG-${card.card_id}`,
                source_card_id: card.card_id,
                original_category: card.category,
                suggested_category: suspectResult.suggested_category,
                reason: `別のカテゴリ「${suspectResult.conflict_categories.join(', ')}」のキーワードが多数検出されました。`,
                confidence: confidence,
                evidence_terms: suspectResult.detected_keywords,
                conflict_categories: suspectResult.conflict_categories,
                review_status: confidence === 'high' ? 'suggested' : 'needs_human_review',
                created_at: now
            });
        }
    }

    return suggestions;
}
