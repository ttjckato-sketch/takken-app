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
    card.is_statement_true === true ? '【法的結論】正しい記述です。' : 
    card.is_statement_true === false ? '【法的結論】誤りを含む記述です。' : 
    '【法的結論】選択肢の個別判断を参照してください。';

  // 2. Main reasoning (Enhanced with category context)
  let reason = card.explanation || card.core_knowledge?.essence || '';
  if (!reason || reason.length < 20) {
      reason = `${card.category}に関する重要論点です。問題文の内容が、関連する法令（宅建業法や借地借家法など）の規定に適合しているかを確認してください。`;
  }

  // 3. Prerequisite ( 初学者向け )
  const prerequisite = card.prerequisite || '不動産取引における「信義則」や、弱者保護のための「特別法（借地借家法等）」の基本原則に基づいています。';

  // 4. Trap points
  const trap_point = card.trap_point || '試験では「～しなければならない（義務）」と「～することができる（任意）」のすり替え、および対象者（業者か一般人か）の区別に注意が必要です。';

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
    choice_details = choices.map(c => {
        let choiceExp = c.explanation || '';
        if (!choiceExp) {
            choiceExp = c.is_exam_correct_option ? 'この記述が正解（本問の要求に合致）となります。' : 'この記述は本問の正解ではありません。正誤の理由を確認してください。';
        }
        return {
            option_no: c.option_no,
            text: c.text,
            is_correct: !!c.is_exam_correct_option,
            explanation: choiceExp
        };
    });
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
