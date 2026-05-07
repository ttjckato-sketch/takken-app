import { type UnderstandingCard, type SourceChoice } from '../db';
import { type MistakeDiagnosis, type MistakeType } from './learningContentContract';
import { classifyQuestionRenderMode } from './questionTypeClassifier';

export function diagnoseMistake(
  card: UnderstandingCard,
  choices: SourceChoice[],
  userAnswer: boolean | number | null,
  correctAnswer: boolean | number | null
): MistakeDiagnosis | undefined {
  if (userAnswer === correctAnswer || userAnswer === null) return undefined;

  const mode = classifyQuestionRenderMode(card, choices.length).mode;
  let mistake_type: MistakeType = 'unknown';
  let diagnosis_text = '不正解です。解説を確認してください。';
  let next_action = '解説を熟読する';
  let missed_keyword = '';

  const qText = (card.sample_question || '').toLowerCase();

  // Keyword missing detection (e.g. "最も不適切")
  if (mode === 'MCQ') {
      if (qText.includes('不適切') || qText.includes('誤っている')) {
          mistake_type = 'missed_keyword';
          missed_keyword = '不適切 / 誤っている';
          diagnosis_text = '「不適切なもの」「誤っているもの」を選ぶ問題です。正しい選択肢を選んでしまった可能性があります。';
          next_action = '問題文の末尾（問われている条件）を先に確認する癖をつけましょう。';
      } else if (qText.includes('適切') || qText.includes('正しい')) {
          mistake_type = 'missed_keyword';
          missed_keyword = '適切 / 正しい';
          diagnosis_text = '「適切なもの」「正しいもの」を選ぶ問題です。誤った選択肢を選んでしまった可能性があります。';
          next_action = '問題文の条件を読み落とさないように注意しましょう。';
      } else {
          mistake_type = 'misunderstood_rule';
          diagnosis_text = '該当の制度・ルールの理解が不十分な可能性があります。';
          next_action = 'この論点の「基本ルール」と「理由」を再確認してください。';
      }
  } else if (mode === 'TRUE_FALSE') {
      if (card.trap_point) {
          mistake_type = 'confused_exception';
          diagnosis_text = 'よくある「ひっかけ」に誘導された可能性があります。';
          next_action = '「ひっかけポイント（罠）」を確認し、例外や対象者のすり替えに注意してください。';
      } else {
          mistake_type = 'misunderstood_rule';
          diagnosis_text = '基本となるルールを誤解している可能性があります。';
          next_action = '「法的結論」と「核心的理由」を暗記ではなく「なぜそうなるのか」で理解しましょう。';
      }
  }

  return {
      mistake_type,
      diagnosis_text,
      missed_keyword: missed_keyword || undefined,
      next_action
  };
}
