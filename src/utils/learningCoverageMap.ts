/**
 * Learning Coverage Map
 * Official exam scopes for Takken and Chintai exams.
 */

export interface ScopeTopic {
  id: string;
  exam: 'takken' | 'chintai';
  major_category: string;
  sub_topic: string;
  keywords: string[];
  required_input: boolean;
  required_output: boolean;
  priority: 'high' | 'medium' | 'low';
  practical_link_required: boolean;
}

export const LEARNING_SCOPE_MAP: ScopeTopic[] = [
  // --- Takken Exam ---
  { id: 't-gyo-1', exam: 'takken', major_category: '宅建業法', sub_topic: '免許', keywords: ['免許', '欠格事由', '更新'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-gyo-2', exam: 'takken', major_category: '宅建業法', sub_topic: '宅建士', keywords: ['宅建士', '登録', '事務禁止'], required_input: true, required_output: true, priority: 'high', practical_link_required: false },
  { id: 't-gyo-3', exam: 'takken', major_category: '宅建業法', sub_topic: '営業保証金', keywords: ['営業保証金', '供託', '還付'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-gyo-4', exam: 'takken', major_category: '宅建業法', sub_topic: '保証協会', keywords: ['保証協会', '弁済業務保証金', '分担金'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-gyo-5', exam: 'takken', major_category: '宅建業法', sub_topic: '媒介契約', keywords: ['媒介契約', '34条の2', '専任', '一般'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-gyo-6', exam: 'takken', major_category: '宅建業法', sub_topic: '35条重要事項説明', keywords: ['35条', '重要事項説明', 'IT重説'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-gyo-7', exam: 'takken', major_category: '宅建業法', sub_topic: '37条書面', keywords: ['37条', '契約締結後', '記載事項'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-gyo-8', exam: 'takken', major_category: '宅建業法', sub_topic: '8種制限', keywords: ['8種制限', '自ら売主', 'クーリングオフ', '手付金'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-gyo-9', exam: 'takken', major_category: '宅建業法', sub_topic: '報酬', keywords: ['報酬', '上限', '消費税'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-gyo-10', exam: 'takken', major_category: '宅建業法', sub_topic: '監督処分・罰則', keywords: ['監督処分', '罰則', '指示', '停止'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },

  { id: 't-ken-1', exam: 'takken', major_category: '権利関係', sub_topic: '意思表示', keywords: ['意思表示', '虚偽表示', '錯誤', '詐欺', '強迫'], required_input: true, required_output: true, priority: 'high', practical_link_required: false },
  { id: 't-ken-2', exam: 'takken', major_category: '権利関係', sub_topic: '代理', keywords: ['代理', '無権代理', '表見代理'], required_input: true, required_output: true, priority: 'high', practical_link_required: false },
  { id: 't-ken-3', exam: 'takken', major_category: '権利関係', sub_topic: '時効', keywords: ['時効', '取得時効', '消滅時効'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-ken-4', exam: 'takken', major_category: '権利関係', sub_topic: '物権変動', keywords: ['物権変動', '登記', '対抗要件'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-ken-5', exam: 'takken', major_category: '権利関係', sub_topic: '抵当権', keywords: ['抵当権', '根抵当権', '法定地上権'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-ken-6', exam: 'takken', major_category: '権利関係', sub_topic: '債務不履行', keywords: ['債務不履行', '解除', '損害賠償'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-ken-7', exam: 'takken', major_category: '権利関係', sub_topic: '契約不適合責任', keywords: ['契約不適合', '瑕疵'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-ken-8', exam: 'takken', major_category: '権利関係', sub_topic: '賃貸借', keywords: ['賃貸借', '敷金'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-ken-9', exam: 'takken', major_category: '権利関係', sub_topic: '借地借家法', keywords: ['借地借家法', '定期借地', '定期借家'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-ken-10', exam: 'takken', major_category: '権利関係', sub_topic: '区分所有法', keywords: ['区分所有法', '管理組合', '規約'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-ken-11', exam: 'takken', major_category: '権利関係', sub_topic: '相続', keywords: ['相続', '遺言', '遺留分'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-ken-12', exam: 'takken', major_category: '権利関係', sub_topic: '不動産登記法', keywords: ['不動産登記法', '仮登記'], required_input: true, required_output: true, priority: 'low', practical_link_required: true },

  { id: 't-sei-1', exam: 'takken', major_category: '法令上の制限', sub_topic: '都市計画法', keywords: ['都市計画法', '用途地域'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-sei-2', exam: 'takken', major_category: '法令上の制限', sub_topic: '開発許可', keywords: ['開発許可', '面積要件'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-sei-3', exam: 'takken', major_category: '法令上の制限', sub_topic: '建築基準法', keywords: ['建築基準法', '接道義務', '防火地域'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-sei-4', exam: 'takken', major_category: '法令上の制限', sub_topic: '建ぺい率', keywords: ['建ぺい率'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-sei-5', exam: 'takken', major_category: '法令上の制限', sub_topic: '容積率', keywords: ['容積率'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-sei-6', exam: 'takken', major_category: '法令上の制限', sub_topic: '農地法', keywords: ['農地法', '3条', '4条', '5条'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 't-sei-7', exam: 'takken', major_category: '法令上の制限', sub_topic: '国土利用計画法', keywords: ['国土利用計画法', '事後届出'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-sei-8', exam: 'takken', major_category: '法令上の制限', sub_topic: '土地区画整理法', keywords: ['土地区画整理法', '換地'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 't-sei-9', exam: 'takken', major_category: '法令上の制限', sub_topic: '特定盛土等規制法', keywords: ['特定盛土等規制法', '宅地造成'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },

  { id: 't-zei-1', exam: 'takken', major_category: '税その他', sub_topic: '不動産取得税', keywords: ['不動産取得税'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-zei-2', exam: 'takken', major_category: '税その他', sub_topic: '固定資産税', keywords: ['固定資産税'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-zei-3', exam: 'takken', major_category: '税その他', sub_topic: '登録免許税', keywords: ['登録免許税'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },
  { id: 't-zei-4', exam: 'takken', major_category: '税その他', sub_topic: '印紙税', keywords: ['印紙税'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-zei-5', exam: 'takken', major_category: '税その他', sub_topic: '譲渡所得', keywords: ['譲渡所得', '3000万円特別控除'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-zei-6', exam: 'takken', major_category: '税その他', sub_topic: '不動産鑑定評価', keywords: ['不動産鑑定評価'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },
  { id: 't-zei-7', exam: 'takken', major_category: '税その他', sub_topic: '地価公示', keywords: ['地価公示'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },
  { id: 't-zei-8', exam: 'takken', major_category: '税その他', sub_topic: '住宅金融支援機構', keywords: ['住宅金融支援機構'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 't-zei-9', exam: 'takken', major_category: '税その他', sub_topic: '統計', keywords: ['統計'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },
  { id: 't-zei-10', exam: 'takken', major_category: '税その他', sub_topic: '土地建物', keywords: ['土地', '建物', '構造'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },

  // --- Chintai Exam ---
  { id: 'c-jutaku-1', exam: 'chintai', major_category: '管理受託契約', sub_topic: '管理受託方式', keywords: ['管理受託方式'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-jutaku-2', exam: 'chintai', major_category: '管理受託契約', sub_topic: 'サブリース方式', keywords: ['サブリース方式', '特定転貸事業者'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-jutaku-3', exam: 'chintai', major_category: '管理受託契約', sub_topic: '重要事項説明', keywords: ['重要事項説明', '管理受託契約前'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-jutaku-4', exam: 'chintai', major_category: '管理受託契約', sub_topic: '管理受託契約書', keywords: ['管理受託契約書', '13条'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-jutaku-5', exam: 'chintai', major_category: '管理受託契約', sub_topic: '委託者・受託者', keywords: ['委託者', '受託者'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 'c-jutaku-6', exam: 'chintai', major_category: '管理受託契約', sub_topic: 'リスク負担', keywords: ['リスク負担'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },

  { id: 'c-hozen-1', exam: 'chintai', major_category: '維持保全', sub_topic: '建物設備', keywords: ['建物設備', '給排水', '電気'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-hozen-2', exam: 'chintai', major_category: '維持保全', sub_topic: '長期修繕', keywords: ['長期修繕計画'], required_input: true, required_output: true, priority: 'low', practical_link_required: true },
  { id: 'c-hozen-3', exam: 'chintai', major_category: '維持保全', sub_topic: '原状回復', keywords: ['原状回復', 'ガイドライン'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-hozen-4', exam: 'chintai', major_category: '維持保全', sub_topic: '修繕義務', keywords: ['修繕義務'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-hozen-5', exam: 'chintai', major_category: '維持保全', sub_topic: '点検', keywords: ['法定点検'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-hozen-6', exam: 'chintai', major_category: '維持保全', sub_topic: '防災', keywords: ['防災'], required_input: true, required_output: true, priority: 'low', practical_link_required: true },
  { id: 'c-hozen-7', exam: 'chintai', major_category: '維持保全', sub_topic: '設備不具合', keywords: ['不具合対応'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },

  { id: 'c-kin-1', exam: 'chintai', major_category: '金銭管理', sub_topic: '家賃', keywords: ['家賃', '供託'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-kin-2', exam: 'chintai', major_category: '金銭管理', sub_topic: '敷金', keywords: ['敷金', '返還'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-kin-3', exam: 'chintai', major_category: '金銭管理', sub_topic: '共益費', keywords: ['共益費'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 'c-kin-4', exam: 'chintai', major_category: '金銭管理', sub_topic: '滞納', keywords: ['滞納', '督促'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-kin-5', exam: 'chintai', major_category: '金銭管理', sub_topic: '保証会社', keywords: ['保証会社'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-kin-6', exam: 'chintai', major_category: '金銭管理', sub_topic: '収支報告', keywords: ['収支報告'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-kin-7', exam: 'chintai', major_category: '金銭管理', sub_topic: '管理口座', keywords: ['分別管理', '専用口座'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },

  { id: 'c-shaku-1', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '賃貸借契約', keywords: ['賃貸借契約'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-shaku-2', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '借地借家法', keywords: ['借地借家法'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-shaku-3', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '更新', keywords: ['合意更新', '法定更新'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-shaku-4', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '解約', keywords: ['解約告知', '正当事由'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-shaku-5', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '退去', keywords: ['明渡し'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-shaku-6', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '特約', keywords: ['特約'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-shaku-7', exam: 'chintai', major_category: '賃貸住宅の賃貸借', sub_topic: '定期建物賃貸借', keywords: ['定期借家'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },

  { id: 'c-ho-1', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '登録制度', keywords: ['登録制度'], required_input: true, required_output: true, priority: 'high', practical_link_required: false },
  { id: 'c-ho-2', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '業務管理者', keywords: ['業務管理者'], required_input: true, required_output: true, priority: 'high', practical_link_required: false },
  { id: 'c-ho-3', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '誇大広告等禁止', keywords: ['誇大広告'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 'c-ho-4', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '不当勧誘禁止', keywords: ['不当勧誘'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 'c-ho-5', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '管理受託契約前の重要事項説明', keywords: ['重要事項説明'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-ho-6', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '書面交付', keywords: ['書面交付'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-ho-7', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '財産の分別管理', keywords: ['分別管理'], required_input: true, required_output: true, priority: 'high', practical_link_required: true },
  { id: 'c-ho-8', exam: 'chintai', major_category: '賃貸住宅管理業法等', sub_topic: '監督処分', keywords: ['監督処分'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },

  { id: 'c-zitsu-1', exam: 'chintai', major_category: '管理実務その他', sub_topic: '入居者対応', keywords: ['入居者募集'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-zitsu-2', exam: 'chintai', major_category: '管理実務その他', sub_topic: 'オーナー対応', keywords: ['コンサルティング'], required_input: true, required_output: true, priority: 'low', practical_link_required: true },
  { id: 'c-zitsu-3', exam: 'chintai', major_category: '管理実務その他', sub_topic: '苦情対応', keywords: ['苦情'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-zitsu-4', exam: 'chintai', major_category: '管理実務その他', sub_topic: '個人情報', keywords: ['個人情報'], required_input: true, required_output: true, priority: 'medium', practical_link_required: false },
  { id: 'c-zitsu-5', exam: 'chintai', major_category: '管理実務その他', sub_topic: '保険', keywords: ['少額短期保険'], required_input: true, required_output: true, priority: 'low', practical_link_required: true },
  { id: 'c-zitsu-6', exam: 'chintai', major_category: '管理実務その他', sub_topic: '税務', keywords: ['所得税'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },
  { id: 'c-zitsu-7', exam: 'chintai', major_category: '管理実務その他', sub_topic: '住宅セーフティネット', keywords: ['住宅セーフティネット'], required_input: true, required_output: true, priority: 'low', practical_link_required: false },
  { id: 'c-zitsu-8', exam: 'chintai', major_category: '管理実務その他', sub_topic: '災害・ハザード', keywords: ['ハザードマップ'], required_input: true, required_output: true, priority: 'medium', practical_link_required: true },
  { id: 'c-zitsu-9', exam: 'chintai', major_category: '管理実務その他', sub_topic: '実務文書', keywords: ['実務文書'], required_input: true, required_output: true, priority: 'low', practical_link_required: true },
];
