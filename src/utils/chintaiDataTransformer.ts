/**
 * 賃貸管理データ変換ユーティリティ（強化版）
 * chintai_raw.jsonをKnowledgeCard形式に変換し、source_questions/source_choicesに保存
 */

import { db, type KnowledgeCard, UnderstandingCard, SourceQuestion, SourceChoice } from '../db';
import { buildIntegratedCard } from './dataIntegration';
import { analyzeQuestionType, calculateIsStatementTrue, type Polarity } from './questionTypeAnalyzer';

export interface ChintaiQuestion {
  id: string;
  year: number;
  question_text: string;
  correct_option: number;
  limbs: string[];  // 累積形式の肢テキスト配列
  explanation_source: string;
  category_major: string;
}

/**
 * 文字列の正規化（suffix比較用）
 */
function normalizeForSuffix(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/　/g, '')
    .trim();
}

/**
 * 累積形式のlimbsを個別の肢に分解
 * limbs[0] = 肢1+2+3+4, limbs[1] = 肢2+3+4, limbs[2] = 肢3+4, limbs[3] = 肢4
 * suffix除去で各肢を抽出
 */
function extractIndividualLimbs(chintai: ChintaiQuestion): Array<{
  text: string;
  isCorrect: boolean;
  optionNumber: number;
}> {
  const result: Array<{ text: string; isCorrect: boolean; optionNumber: number }> = [];

  if (chintai.limbs.length < 4) {
    console.warn(`⚠️ limbs配列が不足しています (${chintai.limbs.length}件): ${chintai.id}`);
    return result;
  }

  // 累積形式のsuffix除去で各肢を抽出
  const limbs = chintai.limbs.map(l => l.trim());

  // option4: limbs[3]（肢4）
  const option4 = limbs[3];

  // option3: limbs[2] から limbs[3] を除去
  let option3 = limbs[2];
  const normalized3 = normalizeForSuffix(limbs[2]);
  const normalized4 = normalizeForSuffix(limbs[3]);

  if (normalized3.endsWith(normalized4)) {
    option3 = option3.slice(0, -limbs[3].length).trim();
  } else {
    console.warn(`⚠️ Suffix removal failed for option3 in ${chintai.id}. Using original value.`);
  }

  // option2: limbs[1] から limbs[2] を除去
  let option2 = limbs[1];
  const normalized2 = normalizeForSuffix(limbs[1]);
  const normalized2Full = normalizeForSuffix(limbs[2]);

  if (normalized2.endsWith(normalized2Full)) {
    option2 = option2.slice(0, -limbs[2].length).trim();
  } else {
    console.warn(`⚠️ Suffix removal failed for option2 in ${chintai.id}. Using original value.`);
  }

  // option1: limbs[0] から limbs[1] を除去
  let option1 = limbs[0];
  const normalized1 = normalizeForSuffix(limbs[0]);
  const normalized1Full = normalizeForSuffix(limbs[1]);

  if (normalized1.endsWith(normalized1Full)) {
    option1 = option1.slice(0, -limbs[1].length).trim();
  } else {
    console.warn(`⚠️ Suffix removal failed for option1 in ${chintai.id}. Using original value.`);
  }

  const options = [
    { text: option1, number: 1 },
    { text: option2, number: 2 },
    { text: option3, number: 3 },
    { text: option4, number: 4 }
  ];

  for (const opt of options) {
    const text = opt.text.trim();
    const isCorrect = opt.number === chintai.correct_option;

    // 空文字や極端に短い肢はwarning
    if (text.length < 5) {
      console.warn(`⚠️ 肢${opt.number}が短すぎます (${text.length}文字): ${chintai.id} - "${text}"`);
    }

    result.push({
      text,
      isCorrect,
      optionNumber: opt.number
    });
  }

  return result;
}

/**
 * SourceQuestionとSourceChoiceを生成して保存
 */
export async function saveChintaiSourceData(
  chintai: ChintaiQuestion,
  index: number
): Promise<{ questionType: string; polarity: Polarity }> {
  // 問題タイプ判定
  const questionAnalysis = analyzeQuestionType(chintai.question_text);

  // SourceQuestionを作成
  const sourceQuestion: SourceQuestion = {
    id: chintai.id,
    exam_type: 'chintai',
    year: chintai.year,
    question_no: index + 1,
    question_text: chintai.question_text,
    correct_option: chintai.correct_option,
    question_type: questionAnalysis.question_type,
    polarity: questionAnalysis.polarity,
    category: chintai.category_major
  };

  // SourceQuestionを保存
  await db.source_questions.put(sourceQuestion);

  // 肢を個別に抽出
  const limbs = extractIndividualLimbs(chintai);

  // SourceChoiceを作成
  for (const limb of limbs) {
    // is_statement_true を計算
    const is_statement_true = calculateIsStatementTrue(
      limb.optionNumber,
      chintai.correct_option,
      questionAnalysis.polarity
    );

    const sourceChoice: SourceChoice = {
      id: `${chintai.id}-${limb.optionNumber}`,
      question_id: chintai.id,
      option_no: limb.optionNumber,
      text: limb.text,
      is_exam_correct_option: limb.optionNumber === chintai.correct_option,
      is_statement_true: is_statement_true,
      explanation: chintai.explanation_source
    };

    await db.source_choices.put(sourceChoice);
  }

  return { questionType: questionAnalysis.question_type, polarity: questionAnalysis.polarity };
}

/**
 * 賃貸管理問題を知識カード形式に変換
 */
export function transformChintaiToKnowledgeCard(
  chintai: ChintaiQuestion,
  index: number
): KnowledgeCard {
  // 肢を個別に抽出
  const limbs = extractIndividualLimbs(chintai);

  // タグを抽出
  const tags = extractTags(chintai);

  return {
    card_id: `CHINTAI-${chintai.id}`,
    knowledge_domain: {
      major: '賃貸管理',
      tags: tags,
      category_sample: chintai.category_major,
      total_patterns: 1,
    },
    core_knowledge: {
      rule: extractCoreRule(chintai),
      essence: extractEssence(chintai.explanation_source),
      examiners_intent: `賃貸管理における${chintai.category_major}の理解`,
      all_essences: [chintai.explanation_source],
    },
    question_patterns: {
      total: 1,
      correct_count: 1,
      incorrect_count: 3,
      years_active: [chintai.year],
      correct_patterns: [{
        id: `${chintai.id}_correct`,
        year: chintai.year,
        question_no: index + 1,
        question_text: chintai.question_text,
        is_correct: true,
        correct_option: chintai.correct_option,
        explanation: {
          full: chintai.explanation_source,
          core_reasoning: extractCoreRule(chintai),
        }
      }],
      incorrect_patterns: limbs.filter(l => !l.isCorrect).map((limb, i) => ({
        id: `${chintai.id}_incorrect_${i}`,
        year: chintai.year,
        question_no: index + 1,
        question_text: chintai.question_text,
        is_correct: false,
        correct_option: chintai.correct_option,
        explanation: {
          full: `誤り：${limb.text}`,
          core_reasoning: extractCoreRule(chintai),
        }
      })),
    },
    study_metadata: {
      importance: 3,
      frequency: 1,
      difficulty: 0.5,
      estimated_time: 2,
    },
    learning_analysis: {
      type: 'understanding',
      difficulty: 0.5,
      complexity: 0.5,
      understanding_score: 0.7,
      memorization_score: 0.3,
    },
    related_knowledge: [],
  };
}

/**
 * タグを抽出
 */
function extractTags(chintai: ChintaiQuestion): string[] {
  const tags = [chintai.category_major];

  // 問題文からキーワードを抽出
  const keywords = [
    '個人情報保護法', '賃貸住宅管理業者', '管理業務', '委託',
    '賃料', '修繕', '契約', '法令', '届出', '登録',
    '重要事項説明', '37条書面', '35条書面',
    '管理受託契約', '管理方法', '契約書', '通知',
    '損害賠償', '原状回復', '費用', '請求',
    '区分所有法', '敷金', '礼金', '保証金',
    '定期借家', '定期建物賃貸借', '期間',
    '用法', '目的', '転貸借', '期間満了',
    '修繕', '管理費', '支払い', '受領'
  ];

  keywords.forEach(kw => {
    if (chintai.question_text.includes(kw) && !tags.includes(kw)) {
      tags.push(kw);
    }
  });

  return tags.slice(0, 8);
}

/**
 * ルールを抽出
 */
function extractCoreRule(chintai: ChintaiQuestion): string {
  const limbs = chintai.limbs || [];
  if (limbs.length === 0) return '規定なし';
  
  const correctLimbIndex = chintai.correct_option - 1;
  const correctLimb = limbs[Math.max(0, Math.min(correctLimbIndex, limbs.length - 1))];
  
  if (!correctLimb || typeof correctLimb !== 'string') return '規定なし';

  const sentences = correctLimb.split('。');
  if (sentences.length > 0 && sentences[0]) {
    return sentences[0] + '。';
  }

  return correctLimb;
}

/**
 * エッセンスを抽出
 */
function extractEssence(explanation: string): string {
  if (!explanation || typeof explanation !== 'string') return '本質抽出不可';
  
  const sentences = explanation.split('。');
  if (sentences.length > 0 && sentences[0]) {
    return sentences[0] + '。';
  }
  return explanation.substring(0, 100) + '...';
}

/**
 * 賃貸管理データ変換の検証
 */
export async function validateChintaiTransformResult(): Promise<void> {
  console.log('🔍 賃貸管理データ変換検証開始...');

  // source_questions の chintai 件数
  const sourceQuestionsChintai = await db.source_questions.where('exam_type').equals('chintai').count();

  // source_choices の chintai 件数
  const sourceChoicesChintai = await db.source_choices
    .where('question_id')
    .startsWith('CH-')
    .count();

  // 空文字の肢
  const emptyChoices = await db.source_choices
    .where('text')
    .equals('')
    .count();

  // is_statement_true === null の件数
  const nullStatementTruth = await db.source_choices
    .filter(choice => choice.is_statement_true === null && choice.question_id.startsWith('CH-'))
    .count();

  // polarity unknown の件数（source_questionsにpolarityフィールドがないので、question_typeで推定）
  const unknownTypeQuestions = await db.source_questions
    .where('exam_type').equals('chintai')
    .and(q => q.question_type === 'unknown')
    .count();

  // count/combination の件数
  const countComboQuestions = await db.source_questions
    .where('exam_type').equals('chintai')
    .and(q => q.question_type === 'count_choice' || q.question_type === 'combination')
    .count();

  console.table([
    {
      '検証項目': 'source_questions_chintai',
      '期待値': 500,
      '実績値': sourceQuestionsChintai,
      'ステータス': sourceQuestionsChintai === 500 ? '✓' : `✗ (${sourceQuestionsChintai}/500)`
    },
    {
      '検証項目': 'source_choices_chintai',
      '期待値': 2000,
      '実績値': sourceChoicesChintai,
      'ステータス': sourceChoicesChintai === 2000 ? '✓' : `✗ (${sourceChoicesChintai}/2000)`
    },
    {
      '検証項目': '空文字の肢',
      '期待値': 0,
      '実績値': emptyChoices,
      'ステータス': emptyChoices === 0 ? '✓' : `✗ (${emptyChoices}件)`
    },
    {
      '検証項目': 'is_statement_true===null',
      '期待値': 0,
      '実績値': nullStatementTruth,
      'ステータス': nullStatementTruth === 0 ? '✓' : `⚠️ (${nullStatementTruth}件)`
    },
    {
      '検証項目': 'question_type===unknown',
      '期待値': 0,
      '実績値': unknownTypeQuestions,
      'ステータス': unknownTypeQuestions === 0 ? '✓' : `⚠️ (${unknownTypeQuestions}件)`
    },
    {
      '検証項目': 'count/combination',
      '注意': '〇×学習対象外',
      '実績値': countComboQuestions
    }
  ]);
}

/**
 * 賃貸管理データをインポート
 */
export async function importChintaiData(): Promise<{
  success: boolean;
  message: string;
  imported?: number;
  sourceQuestions?: number;
  sourceChoices?: number;
  questionTypeStats?: Record<string, number>;
}> {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/chintai_raw.json?v=${timestamp}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('chintai_raw.jsonの読み込みに失敗しました');
    }

    const chintaiQuestions: ChintaiQuestion[] = await response.json();

    console.log(`📊 賃貸管理データ: ${chintaiQuestions.length}問`);

    // KnowledgeCardとUnderstandingCardを生成
    const knowledgeCards: KnowledgeCard[] = chintaiQuestions.map((q, i) =>
      transformChintaiToKnowledgeCard(q, i)
    );

    const understandingCards: UnderstandingCard[] = knowledgeCards.map(card =>
      buildIntegratedCard(card)
    );

    // exam_typeを設定
    understandingCards.forEach(card => {
      card.exam_type = 'chintai';
    });

    // question_type統計
    const questionTypeStats: Record<string, number> = {
      true_false: 0,
      correct_choice: 0,
      incorrect_choice: 0,
      count_choice: 0,
      combination: 0,
      unknown: 0
    };

    // source_questionsとsource_choicesを保存
    let sourceQuestionsCount = 0;
    let sourceChoicesCount = 0;

    for (let i = 0; i < chintaiQuestions.length; i++) {
      const q = chintaiQuestions[i];
      try {
        const { questionType } = await saveChintaiSourceData(q, i);
        questionTypeStats[questionType]++;
        sourceQuestionsCount++;
        sourceChoicesCount += 4; // 各問題4肢
      } catch (error) {
        console.warn(`⚠️ ソースデータ保存エラー (${q.id}):`, error);
      }
    }

    console.log(`✓ source_questions: ${sourceQuestionsCount}件`);
    console.log(`✓ source_choices: ${sourceChoicesCount}件`);
    console.log('📊 Question Type Stats:', questionTypeStats);

    // knowledge_cardsへの安全な保存
    try {
      await db.knowledge_cards.bulkPut(knowledgeCards);
    } catch (bulkPutError) {
      console.warn('⚠️ knowledge_cards bulkPutでエラー発生。1件ずつの安全なインポートへ切り替えます', bulkPutError);

      let successCount = 0;
      let errorCount = 0;

      for (const card of knowledgeCards) {
        try {
          await db.knowledge_cards.put(card);
          successCount++;
        } catch (singlePutError) {
          console.warn(`⚠️ カード ${card.card_id} の保存に失敗（スキップ）:`, singlePutError);
          errorCount++;
        }
      }

      console.log(`✓ knowledge_cards: ${successCount}件成功、${errorCount}件エラー`);
    }

    // understanding_cardsへの安全な保存
    try {
      await db.understanding_cards.bulkPut(understandingCards);
    } catch (bulkPutError) {
      console.warn('⚠️ understanding_cards bulkPutでエラー発生。1件ずつの安全なインポートへ切り替えます', bulkPutError);

      let successCount = 0;
      let errorCount = 0;

      for (const card of understandingCards) {
        try {
          await db.understanding_cards.put(card);
          successCount++;
        } catch (singlePutError) {
          console.warn(`⚠️ カード ${card.card_id} の保存に失敗（スキップ）:`, singlePutError);
          errorCount++;
        }
      }

      console.log(`✓ understanding_cards: ${successCount}件成功、${errorCount}件エラー`);
    }

    // 検証実行
    await validateChintaiTransformResult();

    return {
      success: true,
      message: `${chintaiQuestions.length}問の賃貸管理データをインポートしました`,
      imported: chintaiQuestions.length,
      sourceQuestions: sourceQuestionsCount,
      sourceChoices: sourceChoicesCount,
      questionTypeStats
    };
  } catch (error) {
    console.error('賃貸データインポートエラー:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'インポート失敗'
    };
  }
}

/**
 * 賃貸管理データがロードされているか確認
 */
export async function isChintaiDataLoaded(): Promise<boolean> {
  const count = await db.knowledge_cards
    .where('card_id')
    .startsWith('CHINTAI-')
    .count();
  return count >= 500; // 最低500問
}
