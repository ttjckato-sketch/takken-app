/**
 * カテゴリ正規化ユーティリティ
 * 411種類のカテゴリを宅建6区分に正規化
 */

export type TakkenMajor = '宅建業法' | '権利関係' | '法令上の制限' | '税・その他' | '建築基準法' | '賃貸管理';

const CATEGORY_KEYWORDS: Record<TakkenMajor, string[]> = {
  宅建業法: [
    '宅建', '業法', '35条', '37条', '8条', '8種制限',
    '重要事項説明', '専任媒介契約', '一般媒介契約', '免許',
    '宅建業法・', '広告表示', '表示規約', '宅地建物取引業法',
    '宅建業法・広告', '宅建業法・不当表示防止法', '宅建業法・関連法規',
    '宅建業法・その他', '宅建法・税・その他', '取引業者', '取引主任',
    '業務規制', '報酬', '保証協会', '指定', '監督', '罰則',
    '媒介', '業務', '取引'
  ],
  権利関係: [
    '権利', '権利関係', '物権', '債権', '相続', '登記',
    '契約', '賃貸借', '借地権', '区分所有法', '区分所有',
    '民法', '占有', '担保', '抵当', '質権', '売買', '贈与',
    '時効', '占有権', '相続・遺言', '親権', '後見',
    '不当利得', '不法行為', '代理', '留置権', '先取特権',
    '債権関係', '契約関係', '契約・債権', '契約・権利関係',
    '契約・消費者契約', '契約法', '契約・担保', '賃貸借権'
  ],
  法令上の制限: [
    '法令上の制限', '都市計画', '都市計画法', '建築基準法', '宅地造成',
    '開発許可', '用途地域', '地域地区', '土地利用',
    '国土利用', '建築協定', '農地', '農地法', '森林法',
    '国土利用計画法', '土地区画整理', '土地区画整理法', '宅地造成等規制法',
    '宅地造成等規制', '宅地造成技術規制', '宅地造成等工事規制',
    '風致地区', '港湾', '道路', '公園', '緑地', '流通業務',
    '生産緑地', '景観', '地区', '地区計画', '敷地', '建ぺい率', '容積率',
    '防火地域', '準防火', '建築確認', '建築確認手数'
  ],
  '税・その他': [
    '税', '税法', '不動産鑑定評価', '鑑定評価', '統計',
    '金融', '融資', '金融・融資', '金融制度', '住宅金融',
    '住宅金融支援機構', '地価', '地価公示', '公示', '鑑定',
    '評価', '不動産', '市場', '経済', '価格', '需給',
    '所得税', '固定資産', '登録免許', '登録免許税', '印紙', '印紙税',
    '譲渡', '消費税', '相続税', '贈与税', '法人税', '地方税', '税制',
    '税務', '税務・相続', '契法関係', '金融機関'
  ],
  建築基準法: [
    '建築基準', '建築', '構造', '設備', '材料',
    '建築物', '耐震', '換気', '採光',
    '防腐', '検査', '確認申請', '高さ', '階数',
    '延べ面積', '建築面積', '建築法規', '建築・構造', '建築・法規定',
    '建築物の構造・材料', '構造と材料', '建築・建物', '建築物の構造・設備',
    '建築・建物法規', '建築基準・構造', '建築基準法上の制限', '建築規制',
    '建築・構造'
  ],
  賃貸管理: [
    '賃貸管理', '賃貸管理士', '賃貸不動産', '管理受託',
    '賃貸住宅管理業', '管理業務', '借地借家',
    '管理受託契約', '定期借家', '転貸借', 'サブリース',
    '原状回復', '賃借人', '入居者'
  ]
};

/**
 * カテゴリを宅建6区分に正規化
 */
export function normalizeCategory(category: string): TakkenMajor {
  const normalized = category.trim();

  // 賃貸管理は最優先で判定（デフォルトの「税・その他」に落ちるのを防ぐ）
  if (
    normalized.includes('賃貸管理') ||
    normalized.includes('賃貸不動産') ||
    normalized.includes('賃貸住宅管理') ||
    normalized.includes('借地借家') ||
    normalized === '賃貸管理士'
  ) {
    return '賃貸管理';
  }

  // 完全一致チェック
  if (Object.keys(CATEGORY_KEYWORDS).includes(normalized)) {
    return normalized as TakkenMajor;
  }

  // キーワードマッチング（優先順位順）
  const priorities: TakkenMajor[] = [
    '建築基準法',
    '宅建業法',
    '権利関係',
    '法令上の制限',
    '賃貸管理',
    '税・その他'
  ];

  for (const major of priorities) {
    const keywords = CATEGORY_KEYWORDS[major];

    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return major;
      }

      const categoryPrefix = normalized.split(/[・ー─]/)[0];
      if (keyword.includes(categoryPrefix) && categoryPrefix.length > 2) {
        return major;
      }
    }
  }

  // デフォルト
  return '税・その他';
}

/**
 * バッチ正規化
 */
export function normalizeCategories(categories: string[]): Map<string, TakkenMajor> {
  const mapping = new Map<string, TakkenMajor>();

  for (const category of categories) {
    mapping.set(category, normalizeCategory(category));
  }

  return mapping;
}
