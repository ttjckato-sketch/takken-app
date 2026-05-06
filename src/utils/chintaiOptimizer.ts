import { db, type KnowledgeUnit, type MemoryCard, type SourceChoice } from '../db';
import { extractLegalLearningSignals } from './analytics';

/**
 * 賃貸管理士の公式カテゴリ
 */
export const CHINTAI_OFFICIAL_CATEGORIES = [
  '管理受託契約',
  '維持保全',
  '金銭管理',
  '賃貸借契約',
  '賃貸住宅管理業法・法令',
  '管理実務・その他'
] as const;

export type ChintaiOfficialCategory = typeof CHINTAI_OFFICIAL_CATEGORIES[number];

/**
 * 公式カテゴリへの精密マッピング
 */
export function mapChintaiOfficialCategory(qText: string, cText: string, explanation: string): {
  category: ChintaiOfficialCategory;
  sub_topic: string;
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  const text = (qText + ' ' + cText + ' ' + explanation).toLowerCase();

  if (text.includes('管理受託') || text.includes('受託契約')) {
    return { category: '管理受託契約', sub_topic: '管理受託契約', tags: ['受託契約'], confidence: 'high' };
  }
  if (text.includes('重要事項説明') || text.includes('重説')) {
      if (text.includes('管理受託')) return { category: '管理受託契約', sub_topic: '重要事項説明', tags: ['重要事項説明'], confidence: 'high' };
      return { category: '賃貸住宅管理業法・法令', sub_topic: '管理受託契約前の重要事項説明', tags: ['重要事項説明'], confidence: 'high' };
  }
  if (text.includes('サブリース') || text.includes('特定賃貸借') || text.includes('マスターリース')) {
    return { category: '管理受託契約', sub_topic: 'サブリース方式', tags: ['サブリース'], confidence: 'high' };
  }
  if (text.includes('原状回復') || text.includes('ガイドライン') || text.includes('通常損耗')) {
    return { category: '維持保全', sub_topic: '原状回復', tags: ['原状回復'], confidence: 'high' };
  }
  if (text.includes('修繕') || text.includes('維持保全') || text.includes('点検') || text.includes('設備')) {
    return { category: '維持保全', sub_topic: '建物設備', tags: ['維持保全'], confidence: 'high' };
  }
  if (text.includes('家賃') || text.includes('賃料') || text.includes('敷金') || text.includes('共益費') || text.includes('滞納')) {
    return { category: '金銭管理', sub_topic: '家賃', tags: ['金銭管理'], confidence: 'high' };
  }
  if (text.includes('賃貸借契約') || text.includes('借地借家法') || text.includes('更新') || text.includes('解約') || text.includes('退去')) {
    return { category: '賃貸借契約', sub_topic: '賃貸借契約', tags: ['賃貸借契約'], confidence: 'high' };
  }
  if (text.includes('管理業法') || text.includes('登録') || text.includes('業務管理者') || text.includes('分別管理')) {
    return { category: '賃貸住宅管理業法・法令', sub_topic: '登録制度', tags: ['管理業法'], confidence: 'high' };
  }
  if (text.includes('個人情報') || text.includes('苦情') || text.includes('ハザード') || text.includes('保険')) {
    return { category: '管理実務・その他', sub_topic: '入居者対応', tags: ['管理実務'], confidence: 'high' };
  }

  return { category: '管理実務・その他', sub_topic: '実務文書', tags: ['管理実務'], confidence: 'low' };
}

/**
 * 賃貸管理士の混同ペア生成
 */
export async function buildChintaiConfusionPairs(): Promise<any[]> {
    const pairs = [
        { left: '管理受託方式', right: 'サブリース方式', diff: '契約の当事者関係とリスク負担', trap: 'どちらも管理業法の適用対象' },
        { left: '重要事項説明', right: '契約締結時書面', diff: '交付のタイミングと内容', trap: '35条/37条との混同' },
        { left: '敷金', right: '保証金', diff: '性質と返還義務の発生時期', trap: '関西等の慣習との違い' },
        { left: '原状回復', right: '通常損耗', diff: '賃借人の負担範囲', trap: 'ガイドラインの基準' },
        { left: '賃貸住宅管理業者', right: '宅建業者', diff: '登録義務と業務範囲', trap: '兼業時の規制' }
    ];
    
    return pairs.map(p => ({
        pair_id: `CP-CH-${p.left}-${p.right}`,
        exam_type: 'chintai',
        official_category: '管理実務・その他',
        left_term: p.left,
        right_term: p.right,
        difference: p.diff,
        common_trap: p.trap,
        confidence: 'high'
    }));
}

/**
 * テキスト正規化（類似判定用）
 */
export function normalizeChintaiText(text: string): string {
    return text.replace(/[ \s　、。．.,？！?!]/g, '').replace(/することができます|することができる|できる/g, '可');
}

/**
 * 賃貸管理士データの最適化実行（全件実測生成）
 */
export async function processChintaiOptimization(): Promise<any> {
    const questions = await db.source_questions.where('exam_type').equals('chintai').toArray();
    const choices = await db.source_choices.filter(c => c.question_id.startsWith('CHINTAI-')).toArray();
    
    const qMap = new Map(questions.map(q => [q.id, q]));
    const clusters: Map<string, any[]> = new Map();

    // 1. クラスタリング
    choices.forEach(c => {
        const norm = normalizeChintaiText(c.text).slice(0, 30);
        if (!clusters.has(norm)) clusters.set(norm, []);
        clusters.get(norm)!.push(c);
    });

    const units: KnowledgeUnit[] = [];
    const memoryCards: MemoryCard[] = [];
    const chintaiClusters: any[] = [];

    for (const [norm, clusterChoices] of clusters.entries()) {
        const primary = clusterChoices[0];
        const q = qMap.get(primary.question_id);
        if (!q) continue;

        const mapping = mapChintaiOfficialCategory(q.question_text, primary.text, primary.explanation || '');
        const signals = extractLegalLearningSignals(primary.text, primary.explanation || '');
        
        const cluster_id = `CC-CH-${primary.id}`;
        const unit_id = `KU-CH-${primary.id}`;

        const clusterRecord = {
            cluster_id,
            official_category: mapping.category,
            tags: mapping.tags,
            canonical_statement: primary.text,
            core_rule: primary.explanation?.split('。')[0] || '根拠を確認',
            variations_count: clusterChoices.length,
            source_choice_ids: clusterChoices.map(c => c.id),
            years: Array.from(new Set(clusterChoices.map(c => parseInt(c.id.split('-')[1]) || 0))),
            trap_patterns: [],
            confidence: mapping.confidence
        };
        chintaiClusters.push(clusterRecord);

        const unit: KnowledgeUnit = {
            unit_id,
            source_choice_id: primary.id,
            exam_type: 'chintai',
            category: mapping.category,
            tags: mapping.confidence === 'low' ? ['要監査'] : [],
            statement: primary.text,
            is_statement_true: primary.is_statement_true === true,
            core_rule: clusterRecord.core_rule,
            why: primary.explanation || '',
            numbers_to_memorize: signals.numbers_to_memorize,
            legal_terms: signals.legal_terms,
            parties: signals.parties,
            learning_type: signals.numbers_to_memorize.length > 0 ? 'number' : 'rule',
            difficulty: 3,
            importance: Math.min(5, clusterChoices.length + (signals.confidence === 'high' ? 1 : 0)) as 1 | 2 | 3 | 4 | 5,
            confidence: mapping.confidence
        };
        units.push(unit);

        // Memory Card (Rule)
        if (unit.confidence !== 'low') {
            memoryCards.push({
                memory_card_id: `MC-RULE-${unit_id}`,
                unit_id,
                exam_type: 'chintai',
                category: unit.category,
                tags: unit.tags,
                card_type: 'rule',
                question: `【結論】\n${unit.statement}\nこの論点の法的な結論は？`,
                answer: unit.core_rule,
                source_text: unit.statement,
                confidence: unit.confidence
            });
        }
    }

    await db.chintai_clusters.clear();
    await db.knowledge_units.where('exam_type').equals('chintai').delete();
    await db.memory_cards.where('exam_type').equals('chintai').delete();
    
    await db.chintai_clusters.bulkPut(chintaiClusters);
    await db.knowledge_units.bulkPut(units);
    await db.memory_cards.bulkPut(memoryCards);

    return {
        units_count: units.length,
        memory_cards_count: memoryCards.length,
        clusters_count: chintaiClusters.length,
        low_confidence: units.filter(u => u.confidence === 'low').length,
        category_dist: Object.fromEntries(CHINTAI_OFFICIAL_CATEGORIES.map(c => [c, units.filter(u => u.category === c).length]))
    };
}
