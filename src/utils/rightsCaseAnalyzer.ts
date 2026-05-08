export interface RightsCaseAnalysis {
  is_rights_case: boolean;
  expressor?: string;
  counterparty?: string;
  object?: string;
  right_holder?: string;
  claimant?: string;
  issue_summary: string;
  why_cannot_claim?: string;
  gross_negligence_position?: string;
}

export function analyzeRightsCase(text: string, category: string): RightsCaseAnalysis {
  const t = text.toLowerCase();
  const is_rights_case = category.includes('権利') || t.includes('錯誤') || t.includes('詐欺') || t.includes('不法占拠') || t.includes('取消し');

  if (!is_rights_case) {
    return { is_rights_case: false, issue_summary: '' };
  }

  const analysis: RightsCaseAnalysis = {
    is_rights_case: true,
    issue_summary: '権利関係の事例問題です。'
  };

  if (t.includes(' a ')) {
      if (t.includes('錯誤') || t.includes('詐欺')) analysis.expressor = 'A';
  }
  if (t.includes(' b ')) {
      analysis.counterparty = 'B';
  }
  if (t.includes('甲土地')) analysis.object = '甲土地';
  else if (t.includes('建物')) analysis.object = '建物';

  if (t.includes('錯誤')) {
      analysis.right_holder = analysis.expressor || '錯誤に陥った者';
      if (t.includes('bは') && t.includes('取消し')) {
          analysis.claimant = 'B (相手方)';
          analysis.why_cannot_claim = '錯誤取消しは原則として表意者（勘違いした本人）を保護する制度であり、相手方からは主張できません。';
      }
      analysis.gross_negligence_position = '表意者に重大な過失がある場合、原則として取消しできません（相手方が悪意等の例外を除く）。';
  } else if (t.includes('不法占拠')) {
      analysis.claimant = t.includes('bは') ? 'B' : '権利者';
      analysis.why_cannot_claim = '所有権に基づく妨害排除請求権の行使可否が問われます。';
  }

  return analysis;
}
