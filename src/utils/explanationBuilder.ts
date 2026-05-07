import { type UnderstandingCard, type SourceChoice } from '../db';
import { type LearningContentContract, type ChoiceExplanation } from './learningContentContract';
import { classifyQuestionRenderMode } from './questionTypeClassifier';
import { diagnoseMistake } from './mistakeDiagnosis';

/**
 * Builds a comprehensive LearningContentContract for Active Recall
 */
export function buildLearningContentContract(
  card: UnderstandingCard,
  choices: SourceChoice[] = [],
  userAnswer: boolean | number | null = null
): LearningContentContract {
  
  const classification = classifyQuestionRenderMode(card, choices.length);
  const mode = classification.mode;
  
  // Determine correct answer
  let correctAnswer: boolean | number | null = null;
  if (mode === 'MCQ') {
      const correctChoice = choices.find(c => c.is_exam_correct_option);
      if (correctChoice) correctAnswer = correctChoice.option_no;
  } else if (mode === 'TRUE_FALSE') {
      if (card.is_statement_true === true || card.is_statement_true === false) {
          correctAnswer = card.is_statement_true;
      }
  }

  // Answer Labels
  const correctAnswerLabel = 
    mode === 'MCQ' && correctAnswer ? `選択肢 ${correctAnswer}` :
    mode === 'TRUE_FALSE' && correctAnswer === true ? '正しい (◯)' :
    mode === 'TRUE_FALSE' && correctAnswer === false ? '誤り (×)' : '不明';

  const userAnswerLabel = 
    userAnswer === null ? '未回答' :
    mode === 'MCQ' ? `選択肢 ${userAnswer}` :
    mode === 'TRUE_FALSE' && userAnswer === true ? '正しい (◯)' :
    mode === 'TRUE_FALSE' && userAnswer === false ? '誤り (×)' : '不明';

  // Direct Answer Sentence
  let directAnswerSentence = '';
  if (mode === 'MCQ') {
      directAnswerSentence = `この問題の正解は「${correctAnswerLabel}」です。`;
  } else if (mode === 'TRUE_FALSE') {
      directAnswerSentence = `この記述は「${correctAnswerLabel}」です。`;
  } else {
      directAnswerSentence = '出題に必要なデータが不足しています。';
  }

  // Core Rule & Reasoning
  let coreRule = card.core_knowledge?.rule || '基本ルールが未定義です。';
  let whyCorrect = card.explanation || card.core_knowledge?.essence || '';
  if (!whyCorrect || whyCorrect.length < 20) {
      whyCorrect = `${card.category}における重要論点です。問題文の状況が、関連する法令の規定に適合するか判断する必要があります。`;
  }

  // Prerequisite & Trap
  const prerequisite = card.prerequisite || '不動産取引における基本原則（信義則・対抗要件等）や弱者保護の趣旨に基づきます。';
  const trapPoint = card.trap_point || '試験では「～しなければならない（義務）」と「～することができる（任意）」のすり替え、または対象者（業者か一般か）の入れ替えに注意してください。';
  const memoryHook = (card as any).memory_hook || '理由と結論をセットで声に出して覚えると定着しやすくなります。';
  const nextReviewFocus = '間違えたポイントや見落としたキーワードに注意して復習しましょう。';

  // Source Trace
  let sourceTrace = '出典：過去問データベース（Raw Trace）';
  if (card.source_trace && card.source_trace.length > 0) {
    sourceTrace = `出典：${card.source_trace.map(t => t.text || t.id).join(', ')}`;
  } else if (card.card_id.includes('20')) {
    const match = card.card_id.match(/20\d{2}-\d{2}/);
    if (match) sourceTrace = `出典：平成/令和 ${match[0]}年度 本試験`;
  }

  // Choice Details
  let choiceExplanations: ChoiceExplanation[] = [];
  if (mode === 'MCQ' && choices.length > 0) {
    choiceExplanations = choices.map(c => {
        let choiceExp = c.explanation || '';
        if (!choiceExp) {
            choiceExp = c.is_exam_correct_option 
                ? 'この記述が正解です。論点の核心的理由を確認し、知識を定着させましょう。' 
                : 'この記述は誤り（または本問の正解ではない）です。どこが事実に反するかを確認してください。';
        }
        return {
            option_no: c.option_no,
            choice_label: `選択肢 ${c.option_no}`,
            choice_text: c.text,
            is_correct: !!c.is_exam_correct_option,
            judgment: c.is_exam_correct_option ? '【正解】' : '【誤り】',
            reason: choiceExp
        };
    });
  } else if (mode === 'MCQ') {
      // Fallback choices if missing (should be rare)
      choiceExplanations = [1, 2, 3, 4].map(n => ({
          option_no: n,
          choice_label: `選択肢 ${n}`,
          choice_text: '詳細な選択肢データが現在ロードされていません。',
          is_correct: false,
          judgment: '【不明】',
          reason: 'source_choicesの同期が必要です。'
      }));
  }

  // Quality Audit
  let qualityLevel: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' = 'L2';
  if (mode === 'BLOCKED') qualityLevel = 'L0';
  else if (!card.explanation || card.explanation.length < 50) qualityLevel = 'L1';
  else if (card.prerequisite && card.trap_point && card.explanation.length > 100) qualityLevel = 'L4';
  else if (card.prerequisite || card.trap_point) qualityLevel = 'L3';

  return {
    question_id: card.card_id.replace(/^CHINTAI-KC-/, '').replace(/^KC-/, ''),
    card_id: card.card_id,
    exam_type: card.exam_type || (card.card_id.includes('CHINTAI') ? 'chintai' : 'takken'),
    subject: card.category || '不明',
    category: card.category || '不明',
    sub_topic: (card as any).knowledge_domain?.category_sample || '不明',
    render_mode: mode,
    question_text: card.sample_question || card.core_knowledge?.rule || '問題文がありません。',
    question_intent: card.core_knowledge?.examiners_intent || '論点の正確な理解を問う',
    correct_answer: correctAnswer,
    correct_answer_label: correctAnswerLabel,
    user_answer: userAnswer,
    user_answer_label: userAnswerLabel,
    direct_answer_sentence: directAnswerSentence,
    core_rule: coreRule,
    why_this_is_correct: whyCorrect,
    choice_explanations: choiceExplanations,
    prerequisite: prerequisite,
    trap_point: trapPoint,
    memory_hook: memoryHook,
    next_review_focus: nextReviewFocus,
    source_trace: sourceTrace,
    legal_basis_status: card.source_trace && card.source_trace.length > 0 ? 'official' : 'raw',
    mistake_diagnosis: diagnoseMistake(card, choices, userAnswer, correctAnswer),
    quality_level: qualityLevel
  };
}
