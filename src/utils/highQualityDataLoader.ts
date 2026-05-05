/**
 * 高品質学習データローダー
 * ANALOGY_SYSTEM.json, ACTIVE_RECALL_SYSTEM.json, COGNITIVE_LOAD_OPTIMIZED.json を統合
 */

import { db, type UnderstandingCard } from '../db';

export interface AnalogyData {
  card_id: string;
  category: string;
  tags: string[];
  core_knowledge: {
    rule: string;
    essence: string;
    examiners_intent: string;
  };
  analogy: {
    analogy: string;
    explanation: string;
    mapping: Record<string, string>;
  };
  source: 'library' | 'generated';
}

export interface ActiveRecallQuestion {
  type: 'blank_fill' | 'partial_recall' | 'inverse' | 'why';
  question: string;
  answer?: string;
  correct_answer?: string;
  hints?: Array<{
    level: number;
    hint: string;
    penalty: number;
  }>;
  expected_answer_points?: string[];
  answer_points?: string[];
  original_question?: string;
  keyword?: string;
  category?: string;
  hint?: string;
}

export interface ActiveRecallData {
  card_id: string;
  category: string;
  tags: string[];
  question_types: ActiveRecallQuestion[];
}

export interface CognitiveLoadChunk {
  chunk_id: number;
  cards: Array<{
    card: any;
    optimal_chunk: {
      title: string;
      chunks: string[];
      cognitive_load_rating: 'low' | 'medium' | 'high';
    };
  }>;
}

/**
 * アナロジーデータを柔軟に検索（タグベース強化版）
 */
function findAnalogyData(
  cardId: string,
  category: string,
  tags: string[] | undefined,
  analogyMap: Map<string, AnalogyData>
): AnalogyData | null {
  const exactMatch = analogyMap.get(cardId);
  if (exactMatch) return exactMatch;

  const idMatch = Array.from(analogyMap.values()).find(item =>
    item.card_id.includes(cardId) || cardId.includes(item.card_id)
  );
  if (idMatch) return idMatch;

  if (tags && tags.length > 0) {
    const firstTag = tags[0];
    const tagMatch = Array.from(analogyMap.values()).find(item =>
      item.tags && item.tags.some(t => t.includes(firstTag) || firstTag.includes(t))
    );
    if (tagMatch) return tagMatch;
  }

  return null;
}

/**
 * アクティブリコールデータを柔軟に検索（タグベース強化版）
 */
function findActiveRecallData(
  cardId: string,
  category: string,
  tags: string[] | undefined,
  recallMap: Map<string, ActiveRecallData>
): ActiveRecallData | null {
  // 1. 完全一致
  const exactMatch = recallMap.get(cardId);
  if (exactMatch) return exactMatch;

  // 2. タグベースのマッチング（最優先）
  if (tags && tags.length > 0) {
    const firstTag = tags[0];

    // 完全一致タグ
    const tagMatch = Array.from(recallMap.values()).find(item =>
      item.tags.includes(firstTag)
    );
    if (tagMatch) {
      console.log(`✓ アクティブリコールマッチング（タグ完全一致）: ${cardId} -> ${firstTag}`);
      return tagMatch;
    }

    // 部分一致タグ
    const partialTagMatch = Array.from(recallMap.values()).find(item =>
      item.tags.some(tag => tag.includes(firstTag) || firstTag.includes(tag))
    );
    if (partialTagMatch) {
      console.log(`✓ アクティブリコールマッチング（タグ部分一致）: ${cardId} -> ${firstTag}`);
      return partialTagMatch;
    }

    // カテゴリ+タグの組み合わせマッチング
    const categoryTagMatch = Array.from(recallMap.values()).find(item =>
      item.category === category && item.tags.some(tag => tags.includes(tag))
    );
    if (categoryTagMatch) {
      console.log(`✓ アクティブリコールマッチング（カテゴリ+タグ一致）: ${cardId} -> ${category}`);
      return categoryTagMatch;
    }
  }

  // 3. 前方一致（末尾の枝番を無視）
  const baseId = cardId.split('-')[0];
  const prefixMatch = Array.from(recallMap.values()).find(item =>
    item.card_id.startsWith(baseId) || cardId.startsWith(item.card_id.split('-')[0])
  );
  if (prefixMatch) {
    console.log(`✓ アクティブリコールマッチング（前方一致）: ${cardId} -> ${prefixMatch.card_id}`);
    return prefixMatch;
  }

  // 4. カテゴリベースのフォールバック
  const categoryMatch = Array.from(recallMap.values()).find(item =>
    item.category === category || item.category.includes(category.split('・')[0])
  );
  if (categoryMatch) {
    console.log(`✓ アクティブリコールマッチング（カテゴリ一致）: ${cardId} -> ${category}`);
    return categoryMatch;
  }

  return null;
}
export async function loadAnalogyData(): Promise<Map<string, AnalogyData>> {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/ANALOGY_SYSTEM.json?v=${timestamp}`, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('ANALOGY_SYSTEM.jsonの読み込みに失敗しました');
      return new Map();
    }

    const data = await response.json();
    const analogyMap = new Map<string, AnalogyData>();

    for (const item of data.analogy_deck || []) {
      analogyMap.set(item.card_id, item);
    }

    console.log(`✓ ${analogyMap.size}件のアナロジーデータをロードしました`);
    return analogyMap;
  } catch (error) {
    console.error('アナロジーデータロードエラー:', error);
    return new Map();
  }
}

/**
 * アクティブリコールデータをロード
 */
export async function loadActiveRecallData(): Promise<Map<string, ActiveRecallData>> {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/ACTIVE_RECALL_SYSTEM.json?v=${timestamp}`, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('ACTIVE_RECALL_SYSTEM.jsonの読み込みに失敗しました');
      return new Map();
    }

    const data = await response.json();
    const recallMap = new Map<string, ActiveRecallData>();

    for (const item of data.active_recall_deck || []) {
      recallMap.set(item.card_id, item);
    }

    console.log(`✓ ${recallMap.size}件のアクティブリコールデータをロードしました`);
    return recallMap;
  } catch (error) {
    console.error('アクティブリコールデータロードエラー:', error);
    return new Map();
  }
}

/**
 * 認知負荷最適化データをロード
 */
export async function loadCognitiveLoadData(): Promise<Map<string, any>> {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/COGNITIVE_LOAD_OPTIMIZED.json?v=${timestamp}`, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('COGNITIVE_LOAD_OPTIMIZED.jsonの読み込みに失敗しました');
      return new Map();
    }

    const data = await response.json();
    const cognitiveMap = new Map<string, any>();

    for (const chunk of data.optimal_chunks || []) {
      for (const item of chunk.cards || []) {
        const cardId = item.card?.card_id;
        if (cardId) {
          cognitiveMap.set(cardId, item.optimal_chunk);
        }
      }
    }

    console.log(`✓ ${cognitiveMap.size}件の認知負荷最適化データをロードしました`);
    return cognitiveMap;
  } catch (error) {
    console.error('認知負荷最適化データロードエラー:', error);
    return new Map();
  }
}

/**
 * 高品質データを統合してIndexedDBに保存
 */
export async function integrateHighQualityData(): Promise<{
  success: boolean;
  message: string;
  analogies?: number;
  activeRecall?: number;
  cognitiveLoad?: number;
}> {
  try {
    // 並列ロード
    const [analogyMap, recallMap, cognitiveMap] = await Promise.all([
      loadAnalogyData(),
      loadActiveRecallData(),
      loadCognitiveLoadData()
    ]);

    // 既存のUnderstandingCardを取得
    const allCards = await db.understanding_cards.toArray();

    // 各カードに高品質データを統合
    let analogiesIntegrated = 0;
    let activeRecallIntegrated = 0;
    let cognitiveLoadIntegrated = 0;

    for (const card of allCards) {
      const cardId = card.card_id;

      // アナロジーデータ統合（柔軟検索）
      const analogyData = findAnalogyData(cardId, card.category, card.tags, analogyMap);
      if (analogyData && analogyData.analogy) {
        card.analogies = [{
          analogy: analogyData.analogy.analogy,
          explanation: analogyData.analogy.explanation,
          mapping: analogyData.analogy.mapping
        }];
        analogiesIntegrated++;
      }

      // アクティブリコールデータ統合（柔軟検索）
      const recallData = findActiveRecallData(cardId, card.category, card.tags, recallMap);
      if (recallData && recallData.question_types) {
        card.active_recall_questions = recallData.question_types;
        activeRecallIntegrated++;
      }

      // 認知負荷最適化データ統合（必要に応じて）
      const cognitiveData = cognitiveMap.get(cardId);
      if (cognitiveData) {
        // 必要に応じて認知負荷データを統合
        card.cognitive_load_chunk = cognitiveData;
        cognitiveLoadIntegrated++;
      }

      // 更新
      await db.understanding_cards.put(card);
    }

    console.log(`✓ アナロジー統合: ${analogiesIntegrated}/${allCards.length}枚`);
    console.log(`✓ アクティブリコール統合: ${activeRecallIntegrated}/${allCards.length}枚`);
    console.log(`✓ 認知負荷統合: ${cognitiveLoadIntegrated}/${allCards.length}枚`);

    // 成功時にmetadata flagを保存
    await db.metadata.put({ key: 'high_quality_integrated_v1', value: true });
    console.log('✓ high_quality_integrated_v1 flag saved');

    return {
      success: true,
      message: `高品質データ統合完了: アナロジー${analogiesIntegrated}件、アクティブリコール${activeRecallIntegrated}件、認知負荷${cognitiveLoadIntegrated}件`,
      analogies: analogiesIntegrated,
      activeRecall: activeRecallIntegrated,
      cognitiveLoad: cognitiveLoadIntegrated
    };
  } catch (error) {
    console.error('高品質データ統合エラー:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '統合失敗'
    };
  }
}

/**
 * 高品質データがロードされているか確認
 * db.metadataのhigh_quality_integrated_v1フラグで判定
 */
export async function isHighQualityDataLoaded(): Promise<boolean> {
  const flag = await db.metadata.get('high_quality_integrated_v1');
  return Boolean(flag?.value === true);
}
