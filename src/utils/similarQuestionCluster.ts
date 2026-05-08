import { db, type UnderstandingCard } from '../db';
import { decomposeQuestion } from './questionDecomposer';

export interface SimilarQuestionResult {
  card: UnderstandingCard;
  score: number;
  reasons: string[];
}

/**
 * Finds similar questions based on deep legal concept matching
 */
export async function findSimilarQuestions(card: UnderstandingCard, limit: number = 5): Promise<SimilarQuestionResult[]> {
  const allCards = await db.understanding_cards.toArray();
  const sourceBreakdown = decomposeQuestion(card.sample_question || card.core_knowledge?.rule || '', card.category);

  const scoredCards: SimilarQuestionResult[] = [];

  for (const c of allCards) {
    if (c.card_id === card.card_id) continue;

    let score = 0;
    const reasons: string[] = [];
    const targetBreakdown = decomposeQuestion(c.sample_question || c.core_knowledge?.rule || '', c.category);

    // Exam & Category Match
    if (c.exam_type !== card.exam_type) {
      score -= 30;
    } else {
      if (c.category === card.category) {
        score += 5;
        if ((c as any).knowledge_domain?.category_sample === (card as any).knowledge_domain?.category_sample) {
          score += 10;
          reasons.push('同じ詳細論点');
        }
      } else {
        score -= 20; // Same category is expected for most similar questions
      }
    }

    // Deep Concept Match
    if (sourceBreakdown.intent && targetBreakdown.intent === sourceBreakdown.intent) {
      score += 25;
      reasons.push(`同じ出題意図 (${targetBreakdown.intent})`);
    } else if (sourceBreakdown.intent && targetBreakdown.intent.includes(sourceBreakdown.intent.split('の')[0])) {
      score += 15;
      reasons.push('関連する出題意図');
    }

    // Object Match
    const commonObjects = sourceBreakdown.objects.filter(o => targetBreakdown.objects.includes(o));
    if (commonObjects.length > 0) {
      score += 10;
      reasons.push(`共通の対象物 (${commonObjects.join(', ')})`);
    }

    // Question Type
    if (sourceBreakdown.type === targetBreakdown.type) {
      score += 5;
    }

    if (score >= 50) {
      scoredCards.push({ card: c, score, reasons });
    }
  }

  return scoredCards
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

