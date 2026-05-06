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
    text.includes('記述のうち') ||
    text.includes('ア、イ、ウ、エ') ||
    text.includes('a、b、c、d') ||
    text.includes('選択肢');

  // 3. Determine mode based on intent and available data
  if (isMcqIntent) {
    // If it's clearly an MCQ, we MUST have choices.
    if (sourceChoicesCount >= 2 || (card.question_patterns?.total || 0) >= 2) {
      return { mode: 'MCQ', reasons: ['mcq_intent_with_choices'] };
    } else {
      // Intent is MCQ but we don't have choices - DO NOT fall back to TRUE_FALSE
      return { mode: 'BLOCKED', reasons: ['mcq_intent_missing_choices'] };
    }
  }

  // 4. Default to True/False ONLY if it's a single limb (no MCQ intent)
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
