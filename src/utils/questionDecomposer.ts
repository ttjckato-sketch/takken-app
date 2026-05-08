export type QuestionAnalysisType = 'TRUE_FALSE' | 'MCQ_BEST_FIT' | 'MCQ_MOST_INAPPROPRIATE' | 'COUNT' | 'COMBINATION' | 'CASE_STUDY' | 'UNKNOWN';

export interface DecomposedQuestion {
  type: QuestionAnalysisType;
  intent: string;
  parties: Array<{ label: string; role: string }>;
  objects: string[];
  relationships: string[];
  conditions: string[];
  conclusion_summary: string;
}

/**
 * Analyzes question text and extracts logical components
 */
export function decomposeQuestion(text: string, category: string = ''): DecomposedQuestion {
  const t = text.toLowerCase();
  
  // 1. Determine Type
  let type: QuestionAnalysisType = 'UNKNOWN';
  if (t.includes('最も不適切')) type = 'MCQ_MOST_INAPPROPRIATE';
  else if (t.includes('最も適切')) type = 'MCQ_BEST_FIT';
  else if (t.includes('正しいものはいくつ') || t.includes('誤っているものはいくつ')) type = 'COUNT';
  else if (t.includes('組み合わせ')) type = 'COMBINATION';
  else if (t.includes('事例') || /aは.*bに対して/.test(t)) type = 'CASE_STUDY';
  else type = 'TRUE_FALSE';

  // 2. Extract Parties (Simplified heuristic)
  const parties: Array<{ label: string; role: string }> = [];
  if (t.includes(' a ')) parties.push({ label: 'A', role: '当事者' });
  if (t.includes(' b ')) parties.push({ label: 'B', role: '当事者' });
  if (t.includes(' c ')) parties.push({ label: 'C', role: '第三者/当事者' });
  
  // Add common roles based on category
  if (category.includes('業法')) {
      if (t.includes('売主')) parties.push({ label: '売主', role: '宅建業者または個人' });
      if (t.includes('買主')) parties.push({ label: '買主', role: '宅建業者または個人' });
  }

  // 3. Extract Objects
  const objects: string[] = [];
  if (t.includes('甲土地')) objects.push('甲土地');
  if (t.includes('建物')) objects.push('建物');
  if (t.includes('農地')) objects.push('農地');
  if (t.includes('標準地')) objects.push('標準地');

  // 4. Intent
  let intent = '法令の規定に関する正誤判断';
  if (category.includes('農地法')) intent = '権利移転や転用における許可の要否';
  if (category.includes('地価公示')) intent = '公示価格の決定プロセスと効力';
  if (category.includes('管理受託')) intent = '管理業務の委託範囲と重要事項説明';

  return {
    type,
    intent,
    parties,
    objects,
    relationships: [], // Would need NLP to build accurately
    conditions: [],
    conclusion_summary: '法令の規定に適合するかを問う論点'
  };
}
