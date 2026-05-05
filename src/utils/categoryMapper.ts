/**
 * カテゴリ正規化マッパー
 * 断片化されたカテゴリ文字列を「綺麗な親カテゴリ」に集約
 */

export type NormalizedCategory =
  | '宅建業法'
  | '権利関係'
  | '法令上の制限'
  | '税・その他'
  | '賃貸管理';

/**
 * 生のカテゴリ文字列を正規化された親カテゴリにマッピング
 */
export function normalizeCategory(rawCategory: string): NormalizedCategory {
  if (!rawCategory) return '税・その他';

  const category = rawCategory.toLowerCase();

  // 宅建業法（広告、業務、契約等）
  if (
    category.includes('業法') ||
    category.includes('宅建法') ||
    category.includes('広告') ||
    category.includes('表示') ||
    category.includes('業務') ||
    category.includes('取引') ||
    category.includes('媒介') ||
    category.includes('報酬') ||
    category.includes('保証') ||
    category.includes('重説') ||
    category.includes('重要事項') ||
    category.includes('35条') ||
    category.includes('37条')
  ) {
    return '宅建業法';
  }

  // 権利関係（物権、契約、相隣等）
  if (
    category.includes('権利') ||
    category.includes('相隣') ||
    category.includes('抵当権') ||
    category.includes('質権') ||
    category.includes('留置権') ||
    category.includes('先取特権') ||
    category.includes('所有権') ||
    category.includes('占有') ||
    category.includes('共有') ||
    category.includes('契約') ||
    category.includes('意思表示') ||
    category.includes('代理') ||
    category.includes('条件') ||
    category.includes('期限') ||
    category.includes('時効')
  ) {
    return '権利関係';
  }

  // 法令上の制限（都市計画、建築基準等）
  if (
    category.includes('法令') ||
    category.includes('都市計画') ||
    category.includes('建築基準') ||
    category.includes('造成') ||
    category.includes('開発') ||
    category.includes('建ぺい率') ||
    category.includes('容積率') ||
    category.includes('用途地域') ||
    category.includes('高さ') ||
    category.includes('防火') ||
    category.includes('避難')
  ) {
    return '法令上の制限';
  }

  // 税・その他（税、統計、金融、鑑定等）
  if (
    category.includes('税') ||
    category.includes('統計') ||
    category.includes('金融') ||
    category.includes('鑑定') ||
    category.includes('評価') ||
    category.includes('登記') ||
    category.includes('測量')
  ) {
    return '税・その他';
  }

  // 賃貸管理（借地借家法等）
  if (
    category.includes('借地') ||
    category.includes('借家') ||
    category.includes('賃貸') ||
    category.includes('管理') ||
    category.includes('修繕') ||
    category.includes('敷金') ||
    category.includes('礼金') ||
    category.includes('保証金') ||
    category.includes('家賃') ||
    category.includes('chintai')
  ) {
    return '賃貸管理';
  }

  return '税・その他';
}

/**
 * 正規化されたカテゴリ一覧を取得（表示順序固定）
 * @param studyMode - 'takken' で宅建4分野、'chintai' で賃貸管理、undefined で全カテゴリ
 */
export function getNormalizedCategories(studyMode?: 'takken' | 'chintai'): NormalizedCategory[] {
  if (studyMode === 'chintai') {
    return ['賃貸管理'];
  }
  if (studyMode === 'takken') {
    return ['宅建業法', '権利関係', '法令上の制限', '税・その他'];
  }
  // 未指定時は全カテゴリ（賃貸管理は最後）
  return ['宅建業法', '権利関係', '法令上の制限', '税・その他', '賃貸管理'];
}

/**
 * 正規化されたカテゴリに含まれる可能性のある生のカテゴリ名の例
 * （デバッグ・テスト用）
 */
export function getCategoryExamples(): Record<NormalizedCategory, string[]> {
  return {
    宅建業法: [
      '宅建業法',
      '広告表示',
      '重要事項説明',
      '35条書面',
      '37条書面',
      '業務上の規制',
      '媒介契約',
      '報酬規定',
    ],
    権利関係: [
      '所有権',
      '抵当権',
      '相隣関係',
      '契約の成立',
      '意思表示',
      '代理',
      '時効',
      '共有',
    ],
    法令上の制限: [
      '都市計画法',
      '建築基準法',
      '開発許可',
      '用途地域',
      '建ぺい率',
      '容積率',
      '防火規定',
    ],
    '税・その他': [
      '不動産取得税',
      '登録免許税',
      '固定資産税',
      '消費税',
      '住宅金融支援機構',
      '不動産統計',
    ],
    賃貸管理: [
      '借地借家法',
      '賃貸借契約',
      '敷金礼金',
      '修繕義務',
      '管理業務',
    ],
  };
}
