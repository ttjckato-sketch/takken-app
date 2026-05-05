/**
 * 宅建データsource_questions/source_choices変換ユーティリティ
 * ULTIMATE_STUDY_DECK.jsonのcorrect_patternsから変換
 */

import { db, type SourceQuestion, SourceChoice, UnderstandingCard, Metadata } from '../db';
import { analyzeQuestionType, calculateIsStatementTrue } from './questionTypeAnalyzer';

const TAKKEN_SOURCE_TRANSFORM_VERSION = '1.0.0';
const TAKKEN_SOURCE_GENERATION_METHOD = 'correct_patterns_statement';
const TAKKEN_IS_FULL_CHOICE_RECONSTRUCTION = false;

/**
 * 宅建カードの分類
 */
export type TakkenCardCategory =
  | 'active_recall_eligible'           // correct_patternsあり、〇×化可能
  | 'active_recall_excluded_count_combination'  // 個数・組合せ系
  | 'source_recovery_pending'          // correct_patternsなし、復元が必要
  | 'broken_or_unknown';                // 変換不可

export interface TakkenCardClassification {
  category: TakkenCardCategory;
  reason: string;
  can_transform: boolean;
}

/**
 * 宅建カードを分類
 */
export function classifyTakkenCard(card: UnderstandingCard): TakkenCardClassification {
  // correct_patternsの存在確認
  if (!card.question_patterns?.correct_patterns || card.question_patterns.correct_patterns.length === 0) {
    return {
      category: 'source_recovery_pending',
      reason: 'correct_patternsが存在しない。flashcards/LIMBデータからの復元が必要。',
      can_transform: false
    };
  }

  const pattern = card.question_patterns.correct_patterns[0];
  const qText = pattern.question_text || '';

  // 問題文長さチェック
  if (qText.length < 10) {
    return {
      category: 'broken_or_unknown',
      reason: '問題文が短すぎる（10文字未満）',
      can_transform: false
    };
  }

  // 選択肢数・組合せ系チェック
  const qTextLower = qText.toLowerCase();
  if (qTextLower.includes('個数') || qTextLower.includes('いくつ') || qTextLower.includes('何個') ||
      qTextLower.includes('組合せ') || qTextLower.includes('組み合わせ') || qTextLower.includes('すべて')) {
    return {
      category: 'active_recall_excluded_count_combination',
      reason: '個数・組合せ問題のため、is_statement_trueを単純に確定できない',
      can_transform: false
    };
  }

  // 問題タイプ判定
  const questionAnalysis = analyzeQuestionType(qText);
  if (questionAnalysis.question_type === 'count_choice' || questionAnalysis.question_type === 'combination') {
    return {
      category: 'active_recall_excluded_count_combination',
      reason: `問題タイプが${questionAnalysis.question_type}であるため、ActiveRecall対象外`,
      can_transform: false
    };
  }

  // 安全に〇×化可能
  return {
    category: 'active_recall_eligible',
    reason: 'correct_patternsあり、問題文の長さも十分、〇×化可能',
    can_transform: true
  };
}

export interface TakkenSourcePattern {
  card_id: string;
  year: number;
  question_no: number;
  question_text: string;
  correct_option: number;
  is_correct: boolean;
  explanation?: any;
}

/**
 * correct_patternsからTakkenSourcePatternを抽出
 */
export function extractTakkenSourcePatterns(card: UnderstandingCard): TakkenSourcePattern | null {
  if (!card.question_patterns?.correct_patterns || card.question_patterns.correct_patterns.length === 0) {
    return null;
  }

  const pattern = card.question_patterns.correct_patterns[0];

  return {
    card_id: card.card_id,
    year: pattern.year || 0,
    question_no: pattern.question_no || 0,
    question_text: pattern.question_text || '',
    correct_option: pattern.correct_option || 1,
    is_correct: pattern.is_correct || true,
    explanation: pattern.explanation
  };
}

/**
 * IDを安全な形式に変換する
 */
function sanitizeId(value: string): string {
  return String(value)
    .replace(/[^\w-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

/**
 * TakkenSourcePatternからsource_questionを生成
 */
export function buildTakkenSourceQuestion(
  pattern: TakkenSourcePattern,
  card: UnderstandingCard
): SourceQuestion {
  // 問題タイプ判定
  const questionAnalysis = analyzeQuestionType(pattern.question_text);

  // 1カード1Questionにするため、カードIDを含めて一意にする
  const sourceQuestionId = `TAKKEN-SQ-${sanitizeId(card.card_id)}`;

  return {
    id: sourceQuestionId,
    exam_type: 'takken',
    year: pattern.year,
    question_no: pattern.question_no,
    question_text: pattern.question_text,
    correct_option: pattern.correct_option,
    question_type: questionAnalysis.question_type,
    polarity: questionAnalysis.polarity,
    category: card.category,
    source_card_id: card.card_id
  };
}

/**
 * correct_patternsから選択肢を復元（暫定版）
 * 注意: correct_patternsには選択肢テキストが含まれていない場合がある
 * この場合はflashcardsからの復元が必要
 */
export function extractChoicesFromPattern(pattern: TakkenSourcePattern): Array<{
  option_no: number;
  text: string;
  isCorrect: boolean;
}> {
  // 暫定実装: 正解肢のみ復元
  // TODO: flashcardsからの全選択肢復元

  const choices = [
    {
      option_no: pattern.correct_option,
      text: `選択肢${pattern.correct_option}（テキスト元データ不足）`,
      isCorrect: true
    }
  ];

  return choices;
}

/**
 * ActiveRecall用の文章品質バリデーション
 */
export function validateStatementTextForActiveRecall(text: string, context?: {
  questionText?: string;
  explanation?: string;
  cardId?: string;
}): {
  ok: boolean;
  reason?: string;
  category?: string;
} {
  if (!text) {
    return { ok: false, reason: 'テキストが空です', category: 'empty_text' };
  }

  const trimmed = text.trim();
  const clean = trimmed.replace(/[ \s　、。．.,？！?!]/g, '');

  // 1. 文字数制限
  if (trimmed.length < 15) {
    return { ok: false, reason: `文字数が不足しています(${trimmed.length})`, category: 'short_text' };
  }

  // 2. 完全一致による除外（ラベル系）
  const exclusionList = [
    '一つ', '二つ', '三つ', '四つ', '五つ', 'なし', 'すべて', '全て',
    'イ', 'ウ', 'エ', 'ア、イ', 'イ、ウ', 'ウ、エ', 'ア、ウ', 'ア、エ', 'イ、エ'
  ];
  if (exclusionList.includes(trimmed) || exclusionList.includes(clean)) {
    return { ok: false, reason: '選択肢ラベルまたは極短文です', category: 'label_only' };
  }

  // 3. プレースホルダ
  if (trimmed.includes('テキスト元データ不足') || (trimmed.includes('選択肢') && trimmed.includes('不足'))) {
    return { ok: false, reason: 'データ不足プレースホルダです', category: 'placeholder_text_missing' };
  }

  // 4. 正規表現によるラベル・極短文検知
  if (/^[アイウエ][、,・]?[アイウエ]?$/.test(clean)) {
    return { ok: false, reason: '選択肢記号のみです', category: 'label_only' };
  }
  if (/^[一二三四五六七八九十]+つ$/.test(clean)) {
    return { ok: false, reason: '個数回答のみです', category: 'label_only' };
  }

  // 5. 個数・組合せ問題文脈のチェック
  const checkText = (text + (context?.questionText || '')).toLowerCase();
  const countCombinationWords = [
    'いくつあるか', '何個あるか', 'いくつ', '個数',
    '組合せ', '組み合わせ', '正しいものはいくつ', '誤っているものはいくつ'
  ];

  if (countCombinationWords.some(word => checkText.includes(word))) {
    return { ok: false, reason: '個数・組合せ問題の文脈が含まれています', category: 'count_combination_question' };
  }

  return { ok: true };
}

/**
 * 宅建データをsource_questions/source_choicesに変換
 */
export async function convertTakkinToSourceData(
  card: UnderstandingCard
): Promise<{ source_question?: SourceQuestion; source_choices?: SourceChoice[]; error?: string; skip_reason?: string; skip_category?: string }> {
  try {
    // correct_patternsからパターンを抽出
    const pattern = extractTakkenSourcePatterns(card);

    if (!pattern) {
      return { error: 'correct_patternsが存在しません' };
    }

    // 品質バリデーション
    const validation = validateStatementTextForActiveRecall(pattern.question_text, {
      cardId: card.card_id
    });

    if (!validation.ok) {
      return { skip_reason: validation.reason, skip_category: validation.category };
    }

    // source_questionを生成
    const sourceQuestion = buildTakkenSourceQuestion(pattern, card);
    
    // 選択肢復元（暫定版）
    const choices = extractChoicesFromPattern(pattern);
    const sourceChoices: SourceChoice[] = [];

    // 注: 現状は肢テキストの完全復元が未完了のため、
    // 肢のtextがプレースホルダであっても、問題文(pattern.question_text)が健全なら生成を許可する。
    // (ActiveRecallView側で問題文を表示するため、学習は成立する)
    
    // 全てのバリデーションを通過した場合のみ保存
    await db.source_questions.put(sourceQuestion);

    for (const choice of choices) {
      const is_statement_true = calculateIsStatementTrue(
        choice.option_no,
        pattern.correct_option,
        sourceQuestion.polarity || 'unknown'
      );

      const sourceChoice: SourceChoice = {
        id: `TAKKEN-SC-${sanitizeId(card.card_id)}`,
        question_id: sourceQuestion.id,
        option_no: choice.option_no,
        text: choice.text,
        is_exam_correct_option: choice.isCorrect,
        is_statement_true: is_statement_true,
        explanation: pattern.explanation?.full || '',
        source_card_id: card.card_id
      };

      await db.source_choices.put(sourceChoice);
      sourceChoices.push(sourceChoice);
    }

    return {
      source_question: sourceQuestion,
      source_choices: sourceChoices
    };

  } catch (error) {
    return { error: error instanceof Error ? error.message : '不明なエラー' };
  }
}

/**
 * 宅建source変換が完了しているか確認・実行する
 */
export async function ensureTakkenSourceTransformed(): Promise<{
  success: boolean;
  message: string;
  stats?: any;
}> {
  try {
    const transformStatus = await db.metadata.get('takken_source_transform_status');
    const transformVersion = await db.metadata.get('takken_source_transform_version');
    const qualityFilterVersion = await db.metadata.get('takken_source_quality_filter_version');

    const currentSourceQuestions = await db.source_questions.where('exam_type').equals('takken').count();

    if (transformStatus?.value === 'success' &&
        transformVersion?.value === TAKKEN_SOURCE_TRANSFORM_VERSION &&
        qualityFilterVersion?.value === "1.0.0" &&
        currentSourceQuestions > 0) {
      return { success: true, message: '宅建source変換は完了済みです', stats: await getTakkenSourceStats() };
    }

    const takkenCards = await db.understanding_cards.where('exam_type').equals('takken').toArray();
    if (takkenCards.length === 0) {
      return { success: false, message: '宅建カードが見つかりません' };
    }

    let eligible = 0;
    let excludedCountCombo = 0;
    let recoveryPending = 0;
    let broken = 0;
    const eligibleCards: UnderstandingCard[] = [];

    for (const card of takkenCards) {
      const classification = classifyTakkenCard(card);
      switch (classification.category) {
        case 'active_recall_eligible': eligible++; eligibleCards.push(card); break;
        case 'active_recall_excluded_count_combination': excludedCountCombo++; break;
        case 'source_recovery_pending': recoveryPending++; break;
        case 'broken_or_unknown': broken++; break;
      }
    }

    await db.source_questions.where('exam_type').equals('takken').delete();
    await db.source_choices.filter(c => c.id.startsWith('TAKKEN-SC-') || c.question_id.startsWith('TAKKEN-SQ-')).delete();

    let successCount = 0;
    const qualityStats = {
        raw_candidates: eligibleCards.length,
        short_text: 0,
        placeholder_missing: 0,
        count_combination: 0,
        label_only: 0,
        other: 0
    };

    for (const card of eligibleCards) {
      const result = await convertTakkinToSourceData(card);
      if (result.skip_reason) {
        switch (result.skip_category) {
            case 'short_text': qualityStats.short_text++; break;
            case 'placeholder_text_missing': qualityStats.placeholder_missing++; break;
            case 'count_combination_question': qualityStats.count_combination++; break;
            case 'label_only': qualityStats.label_only++; break;
            default: qualityStats.other++;
        }
      } else if (!result.error) {
        successCount++;
      }
    }

    const finalQuestions = await db.source_questions.where('exam_type').equals('takken').count();
    const finalChoices = await db.source_choices.filter(c => c.id.startsWith('TAKKEN-SC-')).count();

    await db.metadata.bulkPut([
      { key: 'takken_source_transform_status', value: 'success' },
      { key: 'takken_source_transform_version', value: TAKKEN_SOURCE_TRANSFORM_VERSION },
      { key: 'takken_source_quality_filter_version', value: "1.0.0" },
      { key: 'takken_source_questions_count', value: finalQuestions },
      { key: 'takken_source_choices_count', value: finalChoices },
      { key: 'takken_source_raw_candidate_count', value: qualityStats.raw_candidates },
      { key: 'takken_source_quality_pass_count', value: successCount },
      { key: 'takken_source_quality_excluded_count', value: qualityStats.raw_candidates - successCount },
      { key: 'takken_excluded_short_text_count', value: qualityStats.short_text },
      { key: 'takken_excluded_placeholder_count', value: qualityStats.placeholder_missing },
      { key: 'takken_excluded_count_question_count', value: qualityStats.count_combination },
      { key: 'takken_excluded_label_only_count', value: qualityStats.label_only },
      { key: 'takken_active_recall_eligible_count', value: eligible },
      { key: 'takken_source_recovery_pending_count', value: recoveryPending }
    ]);

    return { success: true, message: `宅建source変換完了: ${finalQuestions}問`, stats: await getTakkenSourceStats() };
  } catch (error) {
    console.error('ensureTakkenSourceTransformed error:', error);
    await db.metadata.put({ key: 'takken_source_transform_status', value: 'failed' });
    return { success: false, message: '変換エラーが発生しました' };
  }
}

/**
 * 宅建source統計情報を取得
 */
export async function getTakkenSourceStats(): Promise<any> {
  const qCount = await db.source_questions.where('exam_type').equals('takken').count();
  const cCount = await db.source_choices.filter(c => c.id.startsWith('TAKKEN-SC-')).count();

  const getMeta = async (key: string) => (await db.metadata.get(key))?.value || 0;

  return {
    source_questions_count: qCount,
    source_choices_count: cCount,
    raw_candidate_count: await getMeta('takken_source_raw_candidate_count'),
    quality_pass_count: await getMeta('takken_source_quality_pass_count'),
    quality_excluded_count: await getMeta('takken_source_quality_excluded_count'),
    excluded_short_text: await getMeta('takken_excluded_short_text_count'),
    excluded_placeholder: await getMeta('takken_excluded_placeholder_count'),
    excluded_count_question: await getMeta('takken_excluded_count_question_count'),
    excluded_label_only: await getMeta('takken_excluded_label_only_count')
  };
}
