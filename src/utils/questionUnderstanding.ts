/**
 * Question Understanding Aid Utilities
 * 問題文読解補助機能
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  keywords?: string[];
}

export interface PartyMapping {
  code: string;
  role: string;
  description: string;
}

export interface KeyPhrase {
  phrase: string;
  importance: 'critical' | 'important' | 'minor';
  meaning: string;
}

export interface QuestionIntent {
  main_point: string;
  key_points: string[];
}

export interface TrapNotice {
  pattern: string[];
  message: string;
}

/**
 * 専門用語辞書
 */
export const GLOSSARY_DICT: GlossaryTerm[] = [
  {
    term: '甲',
    definition: '一方当事者。売主・貸主などに使われることが多い。',
    category: '登場人物',
    keywords: ['甲', 'こう']
  },
  {
    term: '乙',
    definition: '相手方当事者。買主・借主などに使われることが多い。',
    category: '登場人物',
    keywords: ['乙', 'おつ']
  },
  {
    term: '丙',
    definition: '第三者として出ることが多い。',
    category: '登場人物',
    keywords: ['丙', 'へい']
  },
  {
    term: '媒介',
    definition: '当事者の間に入り、契約成立を助けること。',
    category: '宅建業法',
    keywords: ['媒介', 'ばいかい']
  },
  {
    term: '代理',
    definition: '本人の代わりに法律行為をすること。',
    category: '権利関係',
    keywords: ['代理', 'だいり']
  },
  {
    term: '催告',
    definition: '相手に一定の行為を求める通知。',
    category: '権利関係',
    keywords: ['催告', 'さいこく']
  },
  {
    term: '善意',
    definition: 'ある事情を知らないこと。法律用語では「知らない」を意味する。',
    category: '権利関係',
    keywords: ['善意', 'ぜんい']
  },
  {
    term: '悪意',
    definition: 'ある事情を知っていること。法律用語では「知っている」を意味する。',
    category: '権利関係',
    keywords: ['悪意', 'あくい']
  },
  {
    term: '対抗',
    definition: '第三者に自分の権利や法律関係を主張できること。',
    category: '権利関係',
    keywords: ['対抗', 'たいこう']
  },
  {
    term: '登記',
    definition: '権利関係などを公に示す制度。',
    category: '権利関係',
    keywords: ['登記', 'とうき']
  },
  {
    term: '取消し',
    definition: 'いったん有効な法律行為を後から無効にすること。',
    category: '権利関係',
    keywords: ['取消', 'とりけし']
  },
  {
    term: '無効',
    definition: '最初から法律効果がないこと。',
    category: '権利関係',
    keywords: ['無効', 'むこう']
  },
  {
    term: '解除',
    definition: '有効に成立した契約を後から解消すること。',
    category: '権利関係',
    keywords: ['解除', 'かいじょ']
  },
  {
    term: '追認',
    definition: '後から有効であると認めること。',
    category: '権利関係',
    keywords: ['追認', 'ついにん']
  },
  {
    term: '相続',
    definition: '死亡した人の権利義務を承継すること。',
    category: '権利関係',
    keywords: ['相続', 'そうぞく']
  },
  {
    term: '抵当権',
    definition: '債務の担保として不動産などに設定される権利。',
    category: '権利関係',
    keywords: ['抵当権', 'ていとうけん']
  },
  {
    term: '根抵当権',
    definition: '一定範囲の継続的な取引債権を担保する権利。',
    category: '権利関係',
    keywords: ['根抵当権', 'ねていとうけん']
  },
  {
    term: '重要事項説明',
    definition: '契約前に重要事項を説明する制度。35条書面による。',
    category: '宅建業法',
    keywords: ['重要事項説明', '35条', 'さんじゅうごじょう']
  },
  {
    term: '37条書面',
    definition: '契約成立後に交付する契約内容を記載した書面。',
    category: '宅建業法',
    keywords: ['37条書面', 'さんじゅうななじょう']
  },
  {
    term: 'クーリング・オフ',
    definition: '一定条件で契約を撤回・解除できる制度。',
    category: '宅建業法',
    keywords: ['クーリングオフ', '冷却']
  },
  {
    term: '専任媒介契約',
    definition: '1業者に専任で依頼する媒介契約。',
    category: '宅建業法',
    keywords: ['専任', 'せんにん']
  },
  {
    term: '専属専任媒介契約',
    definition: '1業者に専属し、自己発見取引も不可な媒介契約。',
    category: '宅建業法',
    keywords: ['専属専任', 'せんぞくせんにん']
  }
];

/**
 * 登場人物パターン辞書
 */
export const PARTY_PATTERNS: PartyMapping[] = [
  { code: 'A', role: '登場人物', description: '問題文中の当事者。' },
  { code: 'B', role: '登場人物', description: 'Aの相手方として出てくる可能性が高い人物。' },
  { code: 'C', role: '第三者', description: 'A・B以外の第三者として出てくる可能性が高い。' },
  { code: '甲', role: '一方当事者', description: '売主・貸主などに使われることが多い。' },
  { code: '乙', role: '相手方当事者', description: '買主・借主などに使われることが多い。' },
  { code: '丙', role: '第三者', description: '第三者として出ることが多い。' },
  { code: '売主', role: '売る側', description: '物件を売る側の当事者。' },
  { code: '買主', role: '買う側', description: '物件を買う側の当事者。' },
  { code: '貸主', role: '貸す側', description: '物件を貸す側の当事者。' },
  { code: '借主', role: '借りる側', description: '物件を借りる側の当事者。' },
  { code: '賃貸人', role: '貸す側', description: '賃貸借契約で物件を貸す側。' },
  { code: '賃借人', role: '借りる側', description: '賃貸借契約で物件を借りる側。' },
  { code: '宅建業者', role: '業者', description: '宅地建物取引業者の略。' },
  { code: '代理人', role: '代理を行う者', description: '本人の代わりに法律行為を行う。' },
  { code: '本人', role: '代理される者', description: '代理人によって代理される当事者。' },
  { code: '第三者', role: '当事者以外', description: '法律行為の当事者以外の者。' }
];

/**
 * 注目語句辞書
 */
export const KEY_PHRASES: KeyPhrase[] = [
  { phrase: '契約前', importance: 'critical', meaning: '35条書面のタイミング。契約成立前を指す。' },
  { phrase: '契約後', importance: 'critical', meaning: '37条書面のタイミング。契約成立後を指す。' },
  { phrase: '直ちに', importance: 'critical', meaning: '即座に行う必要があることを指す。' },
  { phrase: '遅滞なく', importance: 'critical', meaning: '合理的な期間内に行う必要があることを指す。' },
  { phrase: 'あらかじめ', importance: 'important', meaning: '前もって行う必要があることを指す。' },
  { phrase: '書面', importance: 'critical', meaning: '書類による交付・説明が必要。' },
  { phrase: '電磁的方法', importance: 'important', meaning: 'メール等の電子的な方法。' },
  { phrase: '承諾', importance: 'important', meaning: '同意すること。' },
  { phrase: '善意', importance: 'critical', meaning: 'ある事情を知らないこと。' },
  { phrase: '悪意', importance: 'critical', meaning: 'ある事情を知っていること。' },
  { phrase: '過失', importance: 'critical', meaning: '注意不足で知らなかったこと。' },
  { phrase: '無過失', importance: 'critical', meaning: '注意不足がなかったこと。' },
  { phrase: '第三者', importance: 'critical', meaning: '法律行為の当事者以外の者。' },
  { phrase: '対抗', importance: 'critical', meaning: '第三者に権利を主張できるか。' },
  { phrase: '登記', importance: 'critical', meaning: '権利関係の公示。' },
  { phrase: '解除', importance: 'important', meaning: '契約を解消すること。' },
  { phrase: '取消', importance: 'important', meaning: '法律行為を無効にすること。' },
  { phrase: '追認', importance: 'important', meaning: '後から有効と認めること。' },
  { phrase: '媒介', importance: 'important', meaning: '間に入って契約成立を助ける。' },
  { phrase: '代理', importance: 'important', meaning: '本人の代わりに法律行為を行う。' },
  { phrase: '専任', importance: 'important', meaning: '1業者に専任して依頼。' },
  { phrase: '専属専任', importance: 'important', meaning: '1業者に専属し、自己発見取引も不可。' }
];

/**
 * ひっかけ注意パターン
 */
export const TRAP_NOTICES: TrapNotice[] = [
  {
    pattern: ['35条', '37条'],
    message: '35条は契約前、37条は契約後を意識してください。'
  },
  {
    pattern: ['専任', '専属専任'],
    message: '専属専任は自己発見取引ができない点に注意してください。'
  },
  {
    pattern: ['善意', '悪意'],
    message: '法律用語では、善意は知らない、悪意は知っているという意味です。'
  },
  {
    pattern: ['代理', '無権代理', '表見代理'],
    message: '本人・代理人・相手方の関係を整理してください。'
  },
  {
    pattern: ['登記', '対抗'],
    message: '第三者に主張できるかを問う問題です。'
  },
  {
    pattern: ['詐欺', '強迫'],
    message: '詐欺は善意無過失の第三者には対抗不可、強迫は誰にでも対抗可。'
  }
];

/**
 * 問題文から登場人物を検出
 */
export function detectParties(questionText: string): PartyMapping[] {
  const detected: PartyMapping[] = [];

  for (const pattern of PARTY_PATTERNS) {
    if (questionText.includes(pattern.code)) {
      detected.push(pattern);
    }
  }

  return detected;
}

/**
 * 問題文から専門用語を検出
 */
export function detectGlossaryTerms(questionText: string): GlossaryTerm[] {
  const detected: GlossaryTerm[] = [];

  for (const term of GLOSSARY_DICT) {
    // 直接マッチ
    if (questionText.includes(term.term)) {
      detected.push(term);
      continue;
    }

    // キーワードマッチ
    if (term.keywords) {
      for (const keyword of term.keywords) {
        if (questionText.includes(keyword)) {
          detected.push(term);
          break;
        }
      }
    }
  }

  return detected;
}

/**
 * 問題文から注目語句を検出
 */
export function detectKeyPhrases(questionText: string): KeyPhrase[] {
  const detected: KeyPhrase[] = [];

  for (const phrase of KEY_PHRASES) {
    if (questionText.includes(phrase.phrase)) {
      detected.push(phrase);
    }
  }

  return detected;
}

/**
 * 問題文からひっかけ注意を検出
 */
export function detectTrapNotices(questionText: string): TrapNotice[] {
  const detected: TrapNotice[] = [];

  for (const trap of TRAP_NOTICES) {
    for (const pattern of trap.pattern) {
      if (questionText.includes(pattern)) {
        detected.push(trap);
        break;
      }
    }
  }

  return detected;
}

/**
 * 問題の意図を推定（簡易版）
 */
export function estimateQuestionIntent(questionText: string, detectedParties: PartyMapping[], detectedKeyPhrases: KeyPhrase[]): QuestionIntent {
  let mainPoint = 'この問題は、法律知識を問う問題です。';
  const keyPoints: string[] = [];

  // 登場人物が多い場合
  if (detectedParties.length >= 3) {
    mainPoint = 'この問題は、登場人物の法律関係を整理したうえで、判断する問題です。';
    keyPoints.push('誰が誰に対して主張するかを整理してください。');
  }

  // 対抗・登記がある場合
  if (detectedKeyPhrases.some(p => p.phrase === '対抗' || p.phrase === '登記')) {
    mainPoint = 'この問題は、第三者に対抗できるかを判断する問題です。';
    keyPoints.push('対抗要件を満たしているか確認してください。');
  }

  // 35条・37条がある場合
  if (detectedKeyPhrases.some(p => p.phrase === '契約前' || p.phrase === '契約後')) {
    mainPoint = 'この問題は、契約前後のタイミングで義務が変わる点を問う問題です。';
    keyPoints.push('35条（契約前）か37条（契約後）かを区別してください。');
  }

  // 善意・悪意がある場合
  if (detectedKeyPhrases.some(p => p.phrase === '善意' || p.phrase === '悪意')) {
    keyPoints.push('法律用語としての善意・悪意の意味に注意してください。');
  }

  // キーポイントがない場合は汎用
  if (keyPoints.length === 0) {
    keyPoints.push('問題文のキーワードに注目してください。');
  }

  return { main_point: mainPoint, key_points: keyPoints };
}
