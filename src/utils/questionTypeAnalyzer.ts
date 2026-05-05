/**
 * 問題タイプ判定ユーティリティ（修正版）
 * question_textから問題タイプと極性を判定
 */

export type QuestionType = 'true_false' | 'correct_choice' | 'incorrect_choice' | 'count_choice' | 'combination' | 'unknown';
export type Polarity = 'select_true' | 'select_false' | 'count' | 'combination' | 'unknown';

export interface QuestionAnalysis {
  question_type: QuestionType;
  polarity: Polarity;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 問題文から問題タイプと極性を判定
 */
export function analyzeQuestionType(questionText: string): QuestionAnalysis {
  const text = questionText.trim();

  // 個数問題判定
  if (text.includes('個数') || text.includes('いくつ') || text.includes('何個') || text.includes('何種')) {
    return { question_type: 'count_choice', polarity: 'count', confidence: 'high' };
  }

  // 組合せ問題判定
  if (text.includes('組合せ') || text.includes('組み合わせ') || text.includes('すべて')) {
    return { question_type: 'combination', polarity: 'combination', confidence: 'high' };
  }

  // 肯定問題判定（正しい/適切なものを選ぶ）
  if (text.includes('正しいもの') || text.includes('正しい') || text.includes('適切なもの') || text.includes('適切である')) {
    return { question_type: 'correct_choice', polarity: 'select_true', confidence: 'high' };
  }

  // 否定問題判定（誤っている/不適切なものを選ぶ）
  if (text.includes('誤っているもの') || text.includes('誤り') || text.includes('不適切なもの') || text.includes('不適切である')) {
    return { question_type: 'incorrect_choice', polarity: 'select_false', confidence: 'high' };
  }

  // その他の場合はtrue/falseとして扱う（デフォルト）
  return { question_type: 'true_false', polarity: 'select_true', confidence: 'low' };
}

/**
 * 選択肢の真偽を判定（簡易版）
 * 完全な判定には自然言語処理が必要ですが、キーワードベースで判定
 */
export function analyzeChoiceTruth(choiceText: string): boolean | null {
  // 明らかに否定表現を含む場合はfalse
  const negativeKeywords = [
    'ない', 'しない', 'しない', 'するものではない',
    'ないもの', '限らない', 'わけではない',
    '禁止', '禁止されている', 'してはならない',
    '無効', '取り消すことができる'
  ];

  const lowerText = choiceText.toLowerCase();
  for (const keyword of negativeKeywords) {
    if (lowerText.includes(keyword)) {
      return false;
    }
  }

  // 明らかに肯定表現を含む場合はtrue
  const positiveKeywords = [
    'できる', 'することができる', '可能',
    'しなければならない', '必要である', '義務',
    '有効', '効力を有する'
  ];

  for (const keyword of positiveKeywords) {
    if (lowerText.includes(keyword)) {
      return true;
    }
  }

  // 判定不可
  return null;
}

/**
 * correct_option と polarity から is_statement_true を計算
 */
export function calculateIsStatementTrue(
  optionNo: number,
  correctOption: number,
  polarity: Polarity
): boolean | null {
  switch (polarity) {
    case 'select_true':
      // 「正しいものを選ぶ」の場合、正解肢はtrue
      return optionNo === correctOption;

    case 'select_false':
      // 「誤っているものを選ぶ」場合、正解肢はfalse
      return optionNo !== correctOption;

    case 'count':
    case 'combination':
    case 'unknown':
      // これらは〇×学習に使わない
      return null;

    default:
      return null;
  }
}
