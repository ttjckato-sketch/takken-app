export interface LegalContext {
  title: string;
  purpose: string;
  protected_party: string;
  typical_scenario: string;
  exam_focus: string;
}

export const LEGAL_CONTEXT_MAP: Record<string, LegalContext> = {
  '地価公示': {
    title: '地価公示制度',
    purpose: '土地取引の目安となる公的価格（公示価格）を示し、適正な地価形成を支援すること。',
    protected_party: '一般の土地取引者、行政機関',
    typical_scenario: '土地の売買や公共事業の買収の際に、価格の目安として参照される。',
    exam_focus: '公示の主体（土地鑑定委員会）、閲覧の供与（市町村長）、官報公示の事項が狙われる。'
  },
  '農地法': {
    title: '農地法（3条・4条・5条）',
    purpose: '日本の限られた農地を保護し、農業生産力を維持・増大させること。',
    protected_party: '農業従事者、国内の食料自給基盤',
    typical_scenario: '農地を宅地に変えたいときや、農家以外の人が農地を買いたいとき。',
    exam_focus: '3条（権利移転）、4条（自己転用）、5条（転用目的の権利移転）の許可権者の違い。'
  },
  '管理受託契約': {
    title: '賃貸住宅管理受託契約',
    purpose: 'オーナーの委託を受けて管理業務を適正に行い、良好な居住環境を確保すること。',
    protected_party: '賃貸住宅オーナー、入居者',
    typical_scenario: '大家さんが「自分で管理するのは大変だから業者に任せよう」と考えたとき。',
    exam_focus: '重要事項説明のタイミングと方法、契約書（13条書面）の必須記載事項。'
  }
};

export function buildLegalContext(category: string): LegalContext | undefined {
  for (const key in LEGAL_CONTEXT_MAP) {
    if (category.includes(key)) return LEGAL_CONTEXT_MAP[key];
  }
  return undefined;
}
