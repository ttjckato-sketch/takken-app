import { db, type UnderstandingCard } from '../db';

export interface QuestionCluster {
  topic: string;
  cards: UnderstandingCard[];
}

/**
 * Finds similar questions based on category, tags and exam type
 */
export async function findSimilarQuestions(card: UnderstandingCard, limit: number = 5): Promise<UnderstandingCard[]> {
  const allCards = await db.understanding_cards
    .where('category')
    .equals(card.category)
    .limit(limit * 2)
    .toArray();

  return allCards
    .filter(c => c.card_id !== card.card_id)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}
