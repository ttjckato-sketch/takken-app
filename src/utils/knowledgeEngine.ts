import { db, type KnowledgeUnit, type MemoryCard, type UnderstandingCard, type SourceChoice, type KnowledgeCard, type Flashcard } from '../db';
import { extractLegalLearningSignals } from './analytics';

/**
 * 暗記カードの本文品質を自動改善する
 */
export function improveMemoryCardText(card: MemoryCard, unit: KnowledgeUnit): MemoryCard {
    const improved = { ...card };
    const context = unit.statement.slice(0, 60) + (unit.statement.length > 60 ? '...' : '');

    // プレースホルダや不備のチェック
    if (!card.answer || card.answer.includes('不足') || card.answer.includes('確認して')) {
        improved.confidence = 'low';
        return improved;
    }

    switch (card.card_type) {
        case 'rule':
            improved.question = `【結論】\n状況: ${context}\nこのケースにおける法的な結論（できる/できない、有効/無効など）は？`;
            improved.answer = `結論：${card.answer.replace(/^結論：/, '')}`;
            break;
        case 'why':
            improved.question = `【理由・根拠】\n状況: ${context}\nなぜこのようなルールになっているか？その「理由」や「趣旨」を答えてください。`;
            if (!improved.answer.startsWith('なぜなら')) {
                improved.answer = `なぜなら、${improved.answer.replace(/^なぜなら、?/, '')}`;
            }
            break;
        case 'number':
            improved.question = `【数字・期間】\n状況: ${context}\nこの規定に関連する「日数」「年数」「割合」などの数字を答えてください。`;
            // 数字カードの回答を構造化
            if (unit.numbers_to_memorize && unit.numbers_to_memorize.length > 0) {
                improved.answer = unit.numbers_to_memorize.join(', ');
            }
            break;
    }

    return improved;
}

/**
 * 既存のSourceデータからKnowledgeUnitとMemoryCardを生成
 */
export async function processKnowledgeOptimization(): Promise<any> {
    // ... (前回の実装を維持しつつ、improveMemoryCardTextを適用)
  console.log('🚀 知識の構造化と暗記カードの生成を開始します...');
  
  const choices = await db.source_choices.toArray();
  const cards = await db.understanding_cards.toArray();
  const cardMap = new Map(cards.map(c => [c.card_id, c]));

  const units: KnowledgeUnit[] = [];
  const memoryCards: MemoryCard[] = [];

  for (const choice of choices) {
    const card = cardMap.get(choice.source_card_id || '');
    if (!card) continue;

    const explanation = choice.explanation || card.core_knowledge.rule || '';
    const signals = extractLegalLearningSignals(choice.text, explanation);

    const unit_id = `KU-${choice.id}`;
    const unit: KnowledgeUnit = {
      unit_id,
      source_choice_id: choice.id,
      source_card_id: card.card_id,
      exam_type: card.exam_type || 'takken',
      category: card.category,
      tags: card.tags,
      statement: choice.text,
      is_statement_true: choice.is_statement_true === true,
      core_rule: card.core_knowledge.rule,
      why: card.core_knowledge.essence,
      numbers_to_memorize: signals.numbers_to_memorize,
      legal_terms: signals.legal_terms,
      parties: signals.parties,
      learning_type: signals.numbers_to_memorize.length > 0 ? 'number' : 'rule',
      difficulty: 3,
      importance: 3,
      confidence: signals.confidence
    };
    units.push(unit);

    // MemoryCard生成 (多角的な問い)
    
    // 1. 結論カード (Rule)
    const ruleCard = improveMemoryCardText({
      memory_card_id: `MC-RULE-${unit_id}`,
      unit_id,
      exam_type: unit.exam_type,
      category: unit.category,
      tags: unit.tags,
      card_type: 'rule',
      question: `【結論】\n${unit.statement}\nこの論点の法的な結論は？`,
      answer: unit.core_rule,
      source_text: unit.statement,
      confidence: unit.confidence
    }, unit);
    memoryCards.push(ruleCard);

    // 2. 理由カード (Why)
    if (unit.why && unit.why.length > 10) {
      const whyCard = improveMemoryCardText({
        memory_card_id: `MC-WHY-${unit_id}`,
        unit_id,
        exam_type: unit.exam_type,
        category: unit.category,
        tags: unit.tags,
        card_type: 'why',
        question: `【根拠】\n${unit.statement}\nなぜこのようなルールになっているか？`,
        answer: unit.why,
        source_text: unit.statement,
        confidence: unit.confidence
      }, unit);
      memoryCards.push(whyCard);
    }

    // 3. 数字カード (Number)
    if (unit.numbers_to_memorize && unit.numbers_to_memorize.length > 0) {
      const numCard = improveMemoryCardText({
        memory_card_id: `MC-NUM-${unit_id}`,
        unit_id,
        exam_type: unit.exam_type,
        category: unit.category,
        tags: unit.tags,
        card_type: 'number',
        question: `【期間・数字】\n${unit.statement}\nこの規定に関連する「期間」や「数字」は？`,
        answer: unit.numbers_to_memorize.join(', '),
        source_text: unit.statement,
        confidence: unit.confidence
      }, unit);
      memoryCards.push(numCard);
    }
  }

  // DBへ保存
  await db.knowledge_units.clear();
  await db.memory_cards.clear();
  await db.knowledge_units.bulkPut(units);
  await db.memory_cards.bulkPut(memoryCards);

  // P1拡張: knowledge_cards / flashcards からの追加生成
  const recoveredCount = await recoverMemoryCardsFromKnowledgeCards();
  const allCardsAfterRecovery = await db.memory_cards.toArray();
  const totalMC = allCardsAfterRecovery.length;

  console.log(`✅ 加工完了: KU=${units.length}, MC=${memoryCards.length} (Recovered: ${recoveredCount}, Total MC: ${totalMC})`);
  
  // 物理監査ログ (Trace)
  const ruleCount = allCardsAfterRecovery.filter(c => c.memory_card_id.includes('RULE')).length;
  const flashCount = allCardsAfterRecovery.filter(c => c.memory_card_id.includes('FLASH')).length;
  const placeholderCount = allCardsAfterRecovery.filter(c => JSON.stringify(c).includes('不足')).length;
  console.log(`📊 Audit Trace: RULE=${ruleCount}, FLASH=${flashCount}, PLACEHOLDER=${placeholderCount}`);

  return {
    units: units.length,
    memory_cards: totalMC,
    recovered_count: recoveredCount,
    confidence_stats: {
        high: units.filter(u => u.confidence === 'high').length,
        medium: units.filter(u => u.confidence === 'medium').length,
        low: units.filter(u => u.confidence === 'low').length
    }
  };
}

/**
 * P1 Asset Expansion: knowledge_cards から暗記カードを復元・増産する
 */
export async function recoverMemoryCardsFromKnowledgeCards(): Promise<number> {
    console.log('🔄 knowledge_cards からの資産復元を開始します...');
    
    const kCards = await db.knowledge_cards.toArray();
    const recoveredCards: MemoryCard[] = [];
    const timestamp = Date.now();

    for (const kCard of kCards) {
        const kCardAny = kCard as any;
        
        // 1. core_knowledge.rule から結論カードを生成 (source_choices にない場合)
        if (kCard.core_knowledge && kCard.core_knowledge.rule && kCard.core_knowledge.rule.length > 10) {
            const ruleId = `MC-RECOVERED-RULE-${kCard.card_id}`;
            // 重複チェック
            recoveredCards.push({
                memory_card_id: ruleId,
                unit_id: `KU-RECOVERED-${kCard.card_id}`,
                exam_type: kCard.card_id.includes('chintai') ? 'chintai' : 'takken',
                category: kCard.knowledge_domain.major,
                tags: kCard.knowledge_domain.tags || [],
                card_type: 'rule',
                question: `【暗記】${kCard.knowledge_domain.category_sample}\n以下の論点に関する正しい知識を答えてください。`,
                answer: kCard.core_knowledge.rule,
                source_text: kCard.core_knowledge.rule,
                confidence: 'medium'
            });
        }

        // 2. flashcards 配列から 〇× 形式のカードを生成
        // ULTIMATE_STUDY_DECK.json のフラッシュカードデータは kCard.flashcards に入っている可能性がある
        const fCards = kCardAny.flashcards || [];
        for (const fCard of fCards) {
            const q = fCard.qa?.q;
            const a = fCard.qa?.a;

            // 品質フィルタ
            if (!q || !a || q.includes('不足') || a.includes('不足')) continue;
            if (q.length < 10) continue;

            recoveredCards.push({
                memory_card_id: `MC-FLASH-${fCard.card_id || kCard.card_id + '-' + Math.random().toString(36).slice(2, 7)}`,
                unit_id: `KU-FLASH-${kCard.card_id}`,
                exam_type: kCard.card_id.includes('chintai') ? 'chintai' : 'takken',
                category: fCard.qa?.category || kCard.knowledge_domain.major,
                tags: fCard.qa?.tags || kCard.knowledge_domain.tags || [],
                card_type: 'rule',
                question: `【〇×判断】\n${q}`,
                answer: `正解: ${a}\n\n解説: ${fCard.explanation?.core_rule || '本文参照'}`,
                source_text: q,
                confidence: 'high'
            });
        }
    }

    if (recoveredCards.length > 0) {
        await db.memory_cards.bulkPut(recoveredCards);
    }

    console.log(`✅ 資産復元完了: ${recoveredCards.length}枚の暗記カードを追加しました。`);
    return recoveredCards.length;
}
