/**
 * データ統合ユーティリティ
 */

import {
  db,
  type KnowledgeCard,
  type UnderstandingCard,
  type SRSParams,
  type Analogy,
  type StepDecomposition,
  type ActiveRecallQuestion
} from '../db';
import { normalizeCategory } from './categoryNormalizer';

/**
 * ULTIMATE_STUDY_DECK.json から理解カードを抽出
 */
export function extractUnderstandingCards(deck: any): UnderstandingCard[] {
  const ultimateDeck = deck.ultimate_deck || deck;

  return ultimateDeck.map((card: any) => {
    const knowledgeCard = card as KnowledgeCard;

    return {
      card_id: knowledgeCard.card_id,
      category: knowledgeCard.knowledge_domain.major,
      tags: knowledgeCard.knowledge_domain.tags,
      core_knowledge: {
        rule: knowledgeCard.core_knowledge.rule,
        essence: knowledgeCard.core_knowledge.essence,
        examiners_intent: knowledgeCard.core_knowledge.examiners_intent
      }
    };
  });
}

/**
 * SRSパラメータを初期化
 */
export function initializeSRSParams(card: KnowledgeCard): SRSParams {
  const difficulty = card.learning_analysis?.difficulty || 0.5;
  const total = card.question_patterns?.total || 0;
  const correct = card.question_patterns?.correct_count || 0;

  // 正答率に基づいて初期E-Factorを設定
  let initialEFactor = 2.5;
  if (total > 0) {
    const accuracy = correct / total;
    if (accuracy >= 0.8) initialEFactor = 2.8;
    else if (accuracy >= 0.6) initialEFactor = 2.5;
    else if (accuracy >= 0.4) initialEFactor = 2.2;
    else initialEFactor = 1.8;
  }

  return {
    efactor: initialEFactor,
    interval: 1,
    repetitions: 0,
    next_review_date: new Date().toISOString(),
    quality_history: [],
    last_reviewed: null,
    total_reviews: 0,
    successful_reviews: 0
  };
}

/**
 * アナロジーを生成（簡易版）
 */
export function generateAnalogy(card: KnowledgeCard): Analogy[] {
  const rule = card.core_knowledge.rule;
  const tags = card.knowledge_domain.tags;
  const primaryTag = tags[0] || '本件';

  const analogies: Analogy[] = [];

  // 期間系
  if (rule.includes('年') || rule.includes('ヶ月') || rule.includes('日')) {
    analogies.push({
      analogy: '期限付きのクーポン',
      explanation: `このルールは「有効期限付きのクーポン」と同じ。期間内に手続きが必要で、期限切れでは無効になる`,
      mapping: {
        '期間': '有効期限',
        '手続き': 'クーポン使用',
        '期限後': '失効'
      }
    });
  }

  // 義務系
  if (rule.includes('しなければならない') || rule.includes('義務')) {
    analogies.push({
      analogy: 'リモコンの電池交換',
      explanation: `「${primaryTag}」は「リモコンの電池を交換する」のと同じ。やらないと正常に動かない義務`,
      mapping: {
        '義務': '必須作業',
        '履行': '実行',
        '不履行': '電池切れ'
      }
    });
  }

  // 禁止系
  if (rule.includes('禁止') || rule.includes('してはならない')) {
    analogies.push({
      analogy: '交通ルールの「一時停止」',
      explanation: `「${primaryTag}」は「止まれ」の道路標識と同じ。違反すると罰せられる`,
      mapping: {
        '禁止事項': '一時停止',
        '違反': '無視',
        '罰則': '反則金'
      }
    });
  }

  return analogies;
}

/**
 * ステップ分解を生成
 */
export function generateStepDecomposition(card: KnowledgeCard): StepDecomposition[] {
  const rule = card.core_knowledge.rule;
  const steps: StepDecomposition[] = [];

  // 文を分割
  const sentences = rule.split(/[。．\n]/).filter(s => s.trim().length > 5);

  sentences.forEach((sentence, index) => {
    let type: StepDecomposition['type'] = 'general';

    if (sentence.includes('場合') || sentence.includes('とき') || sentence.includes('際')) {
      type = 'condition';
    } else if (sentence.includes('しなければならない') || sentence.includes('義務')) {
      type = 'obligation';
    } else if (sentence.includes('禁止') || sentence.includes('してはならない')) {
      type = 'prohibition';
    } else if (sentence.includes('できる') || sentence.includes('することができる')) {
      type = 'permission';
    }

    // キーワード抽出
    const keyElements: string[] = [];
    const numbers = sentence.match(/\d+(?:年|ヶ月|日|%|割)/g);
    if (numbers) keyElements.push(...numbers.slice(0, 3));

    const legalTerms = ['宅地建物取引業者', '重要事項説明', '37条書面', '35条書面'];
    legalTerms.forEach(term => {
      if (sentence.includes(term)) keyElements.push(term);
    });

    steps.push({
      step_number: index + 1,
      content: sentence,
      type,
      key_elements: keyElements.slice(0, 5)
    });
  });

  return steps;
}

/**
 * 想起練習問題を生成
 */
export function generateActiveRecallQuestions(card: KnowledgeCard): ActiveRecallQuestion[] {
  const rule = card.core_knowledge.rule;
  const essence = card.core_knowledge.essence;
  const tags = card.knowledge_domain.tags;
  const questions: ActiveRecallQuestion[] = [];

  // ブランク埋め
  const numbers = rule.match(/\d+(?:年|ヶ月|日|%|割)/g);
  if (numbers) {
    numbers.slice(0, 2).forEach(num => {
      const blankedRule = rule.replace(num, '___');
      questions.push({
        type: 'blank_fill',
        question: blankedRule,
        answer: num,
        hint: `数値: ${num.length}文字`,
        category: tags[0]
      });
    });
  }

  // 「なぜ」問題
  questions.push({
    type: 'why',
    question: `このルールが存在する「なぜ」は？`,
    answer: essence || card.core_knowledge.examiners_intent,
    category: tags[0]
  });

  return questions;
}

/**
 * メタ認知プロンプトを生成
 */
export function generateMetacognitivePrompts(card: KnowledgeCard) {
  const tags = card.knowledge_domain.tags;

  return {
    self_assessment: [
      `「${tags[0]}」のルールを自分の言葉で説明できるか？`,
      `このルールの具体例を1つ挙げられるか？`,
      `この知識と関連する他の知識を挙げられるか？`
    ],
    reflection: [
      'この知識を学習するのに、どのような方法が効果的だったか？',
      '学習中、どこでつまずいたか？',
      'どのようにしてつまずきを克服したか？'
    ],
    next_steps: [
      '基本に戻って関連知識を復習',
      '具体例を複数考えてイメージを固める',
      '対比表で似ている知識と比較',
      '過去問で演習'
    ]
  };
}

/**
 * 誤概念を生成
 */
export function generateMisconceptions(card: KnowledgeCard) {
  const rule = card.core_knowledge.rule;
  const tags = card.knowledge_domain.tags;
  const misconceptions = [];

  // 期間系の誤解
  if (rule.includes('以内')) {
    const periods = rule.match(/\d+(?:年|ヶ月|日)/);
    if (periods) {
      misconceptions.push({
        misconception: `「${periods[0]}経過後も可能」と誤解しがち`,
        correction: `「${periods[0]}以内」に限定される`,
        why_wrong: '期限は「以内」で、「経過後」は不可',
        key_point: `${periods[0]}以内の期限`
      });
    }
  }

  // 義務系の誤解
  if (rule.includes('しなければならない')) {
    misconceptions.push({
      misconception: '努力目標と誤解しがち',
      correction: '法的義務で、違反すると罰則あり',
      why_wrong: '「義務」は強制力のある法的要件',
      key_point: '法的義務 = 強制力あり'
    });
  }

  return misconceptions;
}

/**
 * 統合カードを作成
 */
export function buildIntegratedCard(
  knowledgeCard: KnowledgeCard,
  srsData?: any,
  analogyData?: any,
  stepData?: any,
  activeRecallData?: any
): UnderstandingCard {
  const baseCard: UnderstandingCard = {
    card_id: knowledgeCard.card_id,
    category: normalizeCategory(knowledgeCard.knowledge_domain.major),
    tags: knowledgeCard.knowledge_domain.tags,
    core_knowledge: {
      rule: knowledgeCard.core_knowledge.rule,
      essence: knowledgeCard.core_knowledge.essence,
      examiners_intent: knowledgeCard.core_knowledge.examiners_intent
    },
    sample_question: knowledgeCard.question_patterns?.correct_patterns?.[0]?.question_text || 
                     knowledgeCard.question_patterns?.incorrect_patterns?.[0]?.question_text || undefined,
    sample_answer: knowledgeCard.question_patterns?.correct_patterns?.[0]?.is_correct ?? 
                   knowledgeCard.question_patterns?.incorrect_patterns?.[0]?.is_correct,
    is_statement_true: knowledgeCard.question_patterns?.correct_patterns?.[0]?.is_correct ?? 
                       knowledgeCard.question_patterns?.incorrect_patterns?.[0]?.is_correct ?? null,
    source_choice_id: knowledgeCard.question_patterns?.correct_patterns?.[0]?.id || 
                      knowledgeCard.question_patterns?.incorrect_patterns?.[0]?.id || null,
    question_patterns: knowledgeCard.question_patterns
  };

  // SRSパラメータ
  if (srsData) {
    baseCard.srs_params = srsData.srs_params;
  } else {
    baseCard.srs_params = initializeSRSParams(knowledgeCard);
  }

  // アナロジー
  if (analogyData && analogyData.analogies) {
    baseCard.analogies = analogyData.analogies;
  } else {
    baseCard.analogies = generateAnalogy(knowledgeCard);
  }

  // ステップ分解
  if (stepData && stepData.step_decomposition) {
    baseCard.step_decomposition = stepData.step_decomposition;
  } else {
    baseCard.step_decomposition = generateStepDecomposition(knowledgeCard);
  }

  // 想起練習
  if (activeRecallData && activeRecallData.active_recall_questions) {
    baseCard.active_recall_questions = activeRecallData.active_recall_questions;
  } else {
    baseCard.active_recall_questions = generateActiveRecallQuestions(knowledgeCard);
  }

  // メタ認知
  baseCard.metacognitive_prompts = generateMetacognitivePrompts(knowledgeCard);

  // 誤概念
  baseCard.misconceptions = generateMisconceptions(knowledgeCard);

  return baseCard;
}

/**
 * データをインポートして統合
 */
export async function importIntegratedData(
  ultimateDeck: any,
  srsSystem?: any,
  activeRecallSystem?: any
): Promise<number> {
  // 知識カードを取得
  const knowledgeCards = ultimateDeck.ultimate_deck || ultimateDeck;

  // SRSデータのマップを作成
  const srsMap = new Map<string, any>();
  if (srsSystem && srsSystem.srs_deck) {
    srsSystem.srs_deck.forEach((item: any) => {
      srsMap.set(item.card_id, item);
    });
  }

  // Active Recallデータのマップを作成
  const arMap = new Map<string, any>();
  if (activeRecallSystem && activeRecallSystem.active_recall_deck) {
    activeRecallSystem.active_recall_deck.forEach((item: any) => {
      arMap.set(item.card_id, item);
    });
  }

  // 統合カードを作成
  const integratedCards: UnderstandingCard[] = [];

  for (const card of knowledgeCards) {
    const srsData = srsMap.get(card.card_id);
    const arData = arMap.get(card.card_id);

    const integrated = buildIntegratedCard(card, srsData, undefined, undefined, arData);
    integratedCards.push(integrated);
  }

  // IndexedDBに保存（エラーフォールバック付き）
  await db.understanding_cards.clear();

  try {
    await db.understanding_cards.bulkPut(integratedCards);
  } catch (bulkPutError) {
    console.warn('⚠️ understanding_cards bulkPutでエラー発生。1件ずつの安全なインポートへ切り替えます', bulkPutError);

    // エラーが起きた場合は、1件ずつ安全に保存
    let successCount = 0;
    let errorCount = 0;

    for (const card of integratedCards) {
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

  return integratedCards.length;
}
