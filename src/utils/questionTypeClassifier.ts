import { type UnderstandingCard } from '../db';

export type QuestionRenderMode = 'MCQ' | 'TRUE_FALSE' | 'INPUT_ONLY' | 'BLOCKED';

export interface QuestionClassification {
  mode: QuestionRenderMode;
  reasons: string[];
}

/**
 * Classifies how a question should be rendered in the UI
 */
export function classifyQuestionRenderMode(
  card: UnderstandingCard, 
  sourceChoicesCount: number = 0
): QuestionClassification {
  const reasons: string[] = [];
  const text = (card.sample_question || card.core_knowledge?.rule || '').toLowerCase();
  
  // 1. Check for basic requirements
  if (!card.sample_question && !card.core_knowledge?.rule) {
    return { mode: 'BLOCKED', reasons: ['missing_question_text'] };
  }

  // 2. Detect MCQ intent from text patterns
  const isMcqIntent = 
    text.includes('最も適切') || 
    text.includes('最も不適切') || 
    text.includes('正しいものはいくつ') || 
    text.includes('誤っているものはいくつ') || 
    text.includes('正しいものの組み合わせ') || 
    text.includes('記述のうち');

  // 3. Determine mode based on intent and available data
  if (isMcqIntent) {
    if (sourceChoicesCount >= 4 || (card.question_patterns?.total || 0) >= 4) {
      return { mode: 'MCQ', reasons: ['mcq_intent_with_choices'] };
    } else {
      // Intent is MCQ but we don't have choices
      return { mode: 'BLOCKED', reasons: ['mcq_intent_missing_choices'] };
    }
  }

  // 4. Default to True/False if we have a definitive answer
  if (card.is_statement_true === true || card.is_statement_true === false) {
    return { mode: 'TRUE_FALSE', reasons: ['has_boolean_answer'] };
  }

  // 5. If no answer but has rich explanation, it's input-only
  if (card.explanation && card.explanation.length > 100) {
    return { mode: 'INPUT_ONLY', reasons: ['rich_explanation_no_answer'] };
  }

  return { mode: 'BLOCKED', reasons: ['insufficient_data_for_learning'] };
}

/**
 * Checks if a card is ready for Active Recall
 */
export function isActiveRecallReady(card: UnderstandingCard): boolean {
  const classification = classifyQuestionRenderMode(card);
  return classification.mode === 'MCQ' || classification.mode === 'TRUE_FALSE';
}
