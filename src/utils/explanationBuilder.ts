import { type UnderstandingCard, type SourceQuestion, type SourceChoice } from '../db';

export interface StructuredExplanation {
  conclusion: string;
  reason: string;
  prerequisite: string;
  trap_point: string;
  source: string;
  choice_details?: Array<{
    option_no: number;
    text: string;
    is_correct: boolean;
    explanation: string;
  }>;
}

/**
 * Builds a structured explanation from various data sources with fallback logic
 */
export function buildStructuredExplanation(
  card: UnderstandingCard,
  choices: SourceChoice[] = []
): StructuredExplanation {
  
  // 1. Base components
  const conclusion = 
    card.is_statement_true === true ? '法的結論：正しい。' : 
    card.is_statement_true === false ? '法的結論：誤り。' : 
    '法的結論：解説を参照。';

  // 2. Main reasoning
  const reason = card.explanation || card.core_knowledge?.essence || '詳細な理由は現在精査中ですが、本論点の核心は以下の通りです。';

  // 3. Prerequisite
  const prerequisite = card.prerequisite || '不動産取引における基本原則（信義則・対抗要件等）に基づきます。';

  // 4. Trap points
  const trap_point = card.trap_point || '試験では、主語（業者か個人か）や「～することができる」という表現のすり替えに注意してください。';

  // 5. Source trace
  let source = '出典：過去問データベース（Raw Trace）';
  if (card.source_trace && card.source_trace.length > 0) {
    source = `出典：${card.source_trace.map(t => t.text || t.id).join(', ')}`;
  } else if (card.card_id.includes('20')) {
    const match = card.card_id.match(/20\d{2}-\d{2}/);
    if (match) source = `出典：平成/令和 ${match[0]}年度 本試験`;
  }

  // 6. Choice-level details for MCQ
  let choice_details;
  if (choices.length > 0) {
    choice_details = choices.map(c => ({
      option_no: c.option_no,
      text: c.text,
      is_correct: !!c.is_exam_correct_option,
      explanation: c.explanation || '選択肢の個別解説を構築中。'
    }));
  }

  return {
    conclusion,
    reason,
    prerequisite,
    trap_point,
    source,
    choice_details
  };
}
