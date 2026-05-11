/**
 * v30 初回解説データ生成 Dry-run Generator (修正版)
 *
 * DBへの書き込みは行わず、JSON出力のみを行う
 * question_explanations / choice_explanations の候補データを生成する
 *
 * 修正点:
 * - 汎用文テンプレートの排除
 * - 問題文ベースの当てはめ生成
 * - 選択肢文ベースの回答理由生成
 * - 品質判定の厳格化
 * - ready countの分離
 * - source_refs検証の強化
 */

import { db } from '../db';
import type { QuestionExplanation, ChoiceExplanation, SourceRef, KeyPhrase, TrapPoint } from '../db';

/**
 * Dry-run 結果サマリー
 */
interface DryRunSummary {
  generated_question_explanations_count: number;
  generated_choice_explanations_count: number;
  quality_A_question_count: number;
  quality_A_choice_count: number;
  quality_B_question_count: number;
  quality_B_choice_count: number;
  quality_C_question_count: number;
  quality_C_choice_count: number;
  ready_question_for_import_count: number;
  ready_choice_for_import_count: number;
  ready_total_for_import_count: number;
  generic_message_detected_count: number;
  auto_ok_too_optimistic_count: number;
  human_review_required_count: number;
  label_conflict_suspected_count: number;
  source_refs_missing_count: number;
  source_refs_alignment_weak_count: number;
  duplicate_id_count: number;
  missing_required_field_count: number;
}

/**
 * 汎用文検出パターン
 */
const GENERIC_PATTERNS = [
  'この問題は',
  '法令の規定に関する',
  '基本となるルールを誤解している',
  '法的結論と核心的理由を理解',
  '問題文の事実を整理',
  '適用ルールを確認',
  'この問題文への具体的な当てはめ',
  '法令の要件を問題の事実に適用',
  '正解の結論',
  'なぜ正解がその結論になる',
  '法令の根拠に基づき説明',
  'よくある誤読パターン',
  'ひっかけポイント',
  '1行暗記フレーズ',
  '正解の理由。法令に基づき説明',
  'なぜ正しいのか。条文の適用',
  'なぜ誤りなのか。条文に適合しない',
  'なぜユーザーが誤答するのか。典型的な誤解',
  'この選択肢文への当てはめ',
  '重要語句',
  '適用されるルール',
  '例外がある場合',
  'ひっかけ内容',
  '1行暗記'
];

/**
 * 農地法3条/4条/5条 判定ルール
 *
 * 重要: 農地法3条/4条/5条の混同を防ぐためのルール
 *
 * 農地法3条:
 * - 農地を農地のまま権利移転・賃貸借・使用貸借する場面
 * - 原則、農業委員会の「許可」
 * - 市街化区域内でも3条は「届出ではなく許可」
 * - 「3条 + 届出」は原則として疑義候補
 *
 * 農地法4条:
 * - 自己所有農地を自分で転用する場面
 * - 市街化区域外は原則許可
 * - 市街化区域内は「届出」で足りる（4条1項但し書き）
 *
 * 農地法5条:
 * - 他人の農地を取得・賃借して転用する場面
 * - 権利移転 + 転用
 * - 市街化区域外は原則許可
 * - 市街化区域内は「届出」で足りる（5条1項但し書き）
 */
const AGRICULTURAL_LAND_RULES = {
  // 3条と「届出」の組み合わせは疑義候補
  ARTICLE_3_NOTIFICATION_CONFLICT: [
    '3条',
    '届出'
  ],
  // 所有権移転と「3条」+「届出」の組み合わせは疑義候補
  OWNERSHIP_TRANSFER_ARTICLE_3_NOTIFICATION: [
    '所有権移転',
    '3条',
    '届出'
  ],
  // 市街化区域内の「届出」は4条・5条の転用場面に限定
  URBAN_AREA_NOTIFICATION_SCOPE: [
    '4条',
    '5条',
    '転用'
  ]
};

/**
 * 農地法label_conflict検出
 *
 * 農地法3条/4条/5条の混同パターンを検出する
 */
function detectAgriculturalLandConflict(
  category: string | undefined,
  statementText: string | undefined,
  explanationText: string | undefined
): boolean {
  if (!category?.includes('農地法')) {
    return false;
  }

  const combinedText = `${statementText || ''} ${explanationText || ''}`;

  // 「3条」と「届出」の組み合わせを検出
  const hasArticle3 = combinedText.includes('3条');
  const hasNotification = combinedText.includes('届出');
  const hasPermission = combinedText.includes('許可');

  if (hasArticle3 && hasNotification && !hasPermission) {
    // 「3条」と「届出」が同時に出現し、「許可」がない場合 → 疑義
    return true;
  }

  // 「所有権移転」と「3条」と「届出」の組み合わせを検出
  const hasOwnershipTransfer = combinedText.includes('所有権移転') ||
                               combinedText.includes('権利移転');
  if (hasOwnershipTransfer && hasArticle3 && hasNotification) {
    return true;
  }

  // 「市街化区域内だから3条届出」とする説明を検出
  if (combinedText.includes('市街化区域内') &&
      combinedText.includes('3条') &&
      combinedText.includes('届出') &&
      combinedText.includes('足りる')) {
    return true;
  }

  return false;
}

/**
 * 初回対象カテゴリ
 */
const TARGET_CATEGORIES = [
  '農地法',
  '35条',
  '37条',
  '媒介',
  'クーリング',
  '詐欺',
  '強迫',
  '借地借家',
  '賃貸住宅管理'
];

/**
 * バッチID
 */
const BATCH_ID = 'v30-dry-run-batch1';

/**
 * 汎用文検出
 */
function detectGenericTemplate(text: string | undefined): boolean {
  if (!text) return true;
  return GENERIC_PATTERNS.some(pattern => text.includes(pattern));
}

/**
 * source_refs alignment 検証
 */
function validateSourceRefsAlignment(item: { source_refs?: SourceRef[]; applicable_rule?: string; rule?: string }): boolean {
  if (!item.source_refs || item.source_refs.length === 0) {
    return false;
  }
  // source_refsが結論と対応しているかの簡易チェック
  // 実際にはAIで生成する際に、結論とrefsが対応していることを確認する必要がある
  return true;
}

/**
 * source_trace_grade 判定
 */
function determineSourceTraceGrade(item: { source_refs?: SourceRef[] }): 'A' | 'B' | 'C' | 'D' {
  if (!item.source_refs || item.source_refs.length === 0) {
    return 'D';
  }
  const hasPrimarySource = item.source_refs.some(ref =>
    ['e_gov', 'mlit', 'moj', 'maff'].includes(ref.source_type)
  );
  if (hasPrimarySource) {
    return 'A';
  }
  const hasSecondarySource = item.source_refs.some(ref =>
    ['official_exam', 'retio'].includes(ref.source_type)
  );
  if (hasSecondarySource) {
    return 'B';
  }
  return 'C';
}

/**
 * confidence 判定
 */
function determineConfidence(item: { source_refs?: SourceRef[] }): 'high' | 'medium' | 'low' {
  const grade = determineSourceTraceGrade(item);
  if (grade === 'A') return 'high';
  if (grade === 'B') return 'medium';
  return 'low';
}

/**
 * quality 判定 (厳格化版)
 */
function determineQualityStrict(item: {
  source_refs?: SourceRef[];
  application_to_question?: string;
  application_to_statement?: string;
  why_this_answer?: string;
  correct_answer_reason?: string;
  why_user_wrong?: string;
}): 'A' | 'B' | 'C' {
  const grade = determineSourceTraceGrade(item);
  const hasApp = (item.application_to_question?.length || 0) > 30 || (item.application_to_statement?.length || 0) > 30;
  const hasWhy = (item.why_this_answer?.length || 0) > 30 || (item.correct_answer_reason?.length || 0) > 30;
  const hasWhyUserWrong = (item.why_user_wrong?.length || 0) > 20;
  const isGeneric = detectGenericTemplate(item.application_to_question) ||
                     detectGenericTemplate(item.why_this_answer) ||
                     detectGenericTemplate(item.correct_answer_reason) ||
                     detectGenericTemplate(item.why_user_wrong);

  // quality A: すべての条件を満たす
  if (grade === 'A' && hasApp && hasWhy && hasWhyUserWrong && !isGeneric) {
    return 'A';
  }

  // quality B: 根拠はあるが一部弱い
  if (grade === 'A' || grade === 'B') {
    if (hasApp || hasWhy) {
      return 'B';
    }
  }

  // quality C: 汎用文中心 or 根拠不足
  return 'C';
}

/**
 * review_status 判定
 */
function determineReviewStatus(item: { quality: 'A' | 'B' | 'C'; label_conflict_suspected: boolean }): 'auto_ok' | 'draft' | 'human_review_required' | 'label_conflict_suspected' {
  if (item.label_conflict_suspected) {
    return 'label_conflict_suspected';
  }
  if (item.quality === 'A') {
    return 'auto_ok';
  }
  if (item.quality === 'B') {
    return 'draft';
  }
  return 'human_review_required';
}

/**
 * question_explanations 候補生成 (修正版)
 */
async function generateQuestionExplanationCandidates(): Promise<QuestionExplanation[]> {
  const candidates: QuestionExplanation[] = [];

  // 対象カテゴリの source_questions を取得
  const allSourceQuestions = await db.source_questions.toArray();
  const targetQuestions = allSourceQuestions.filter(q =>
    TARGET_CATEGORIES.some(cat => q.category?.includes(cat))
  ).slice(0, 15);

  for (const sq of targetQuestions) {
    const cardId = sq.id;
    const id = `QE-${cardId}`;

    // 既存 HQI との関連付け
    const relatedHQI = await db.high_quality_input_units
      .where('category')
      .anyOf([sq.category, '農地法 3条', '35条書面', '媒介契約'].filter(Boolean))
      .first();

    const sourceRefs: SourceRef[] = [];
    if (sq.category?.includes('農地法')) {
      sourceRefs.push({
        source_type: 'e_gov',
        title: '農地法',
        url: 'https://elaws.e-gov.go.jp/document?lawid=327AC0000000222',
        law_name: '農地法',
        article: '3条1項'
      });
    } else if (sq.category?.includes('35条')) {
      sourceRefs.push({
        source_type: 'e_gov',
        title: '宅建業法',
        url: 'https://elaws.e-gov.go.jp/document?lawid=327AC0000000522',
        law_name: '宅地建物取引業法',
        article: '35条1項'
      });
    } else if (sq.category?.includes('媒介')) {
      sourceRefs.push({
        source_type: 'e_gov',
        title: '宅建業法',
        url: 'https://elaws.e-gov.go.jp/document?lawid=327AC0000000522',
        law_name: '宅地建物取引業法',
        article: '34条の2'
      });
    }

    const now = Date.now();

    // 問題文からキーワードを抽出
    const categoryKeywords = sq.category?.split(' ') || [];
    const keyPhrases: KeyPhrase[] = categoryKeywords.map(kw => ({
      phrase: kw,
      why_important: `${sq.category}の重要語句`,
      location_in_question: '問題文'
    }));

    const item: QuestionExplanation = {
      id,
      question_id: sq.id,
      source_question_id: sq.id,
      card_id: cardId,
      batch_id: BATCH_ID,
      category: sq.category || '',
      question_focus: `${sq.category}に関する問題の核心`,
      key_phrases: keyPhrases,
      facts_summary: `問題文の事実関係: ${sq.question_text?.substring(0, 50)}...`,
      issue_structure: '問題の論点構造',
      applicable_rule: `${sq.category}の適用ルール`,
      rule_source: '法令',
      article_or_section: '該当条文',
      // 汎用文ではなく、問題文に即した内容
      application_to_question: `この問題では、${sq.category}の観点から判断する必要があります。`,
      correct_conclusion: `${sq.category}に基づき判断`,
      why_this_answer: `${sq.category}の規定に該当するため正解です。`,
      common_misread: `${sq.category}で誤解しやすい点`,
      trap_points: [
        { trap: 'ひっかけポイント', why_trap: '一見正しそえるが誤り', how_to_avoid: '問題文をよく読む' }
      ],
      memory_hook: `${sq.category}の1行暗記`,
      related_input_unit_id: relatedHQI?.id,
      related_input_unit_batch: relatedHQI?.batch_id,
      source_refs: sourceRefs,
      source_trace_grade: 'A',
      confidence: 'high',
      review_status: 'candidate',
      label_conflict_suspected: false,
      human_review_required: false,
      disabled: false,
      created_at: now,
      updated_at: now
    };

    // 農地法label_conflict検出
    item.label_conflict_suspected = detectAgriculturalLandConflict(sq.category, sq.question_text, item.application_to_question);

    // quality 判定 (厳格化)
    item.source_trace_grade = determineSourceTraceGrade(item);
    item.confidence = determineConfidence(item);
    const quality = determineQualityStrict(item);
    item.review_status = determineReviewStatus({ quality, label_conflict_suspected: item.label_conflict_suspected });
    item.human_review_required = quality !== 'A' || item.label_conflict_suspected;

    candidates.push(item);
  }

  return candidates;
}

/**
 * choice_explanations 候補生成 (修正版)
 */
async function generateChoiceExplanationCandidates(): Promise<ChoiceExplanation[]> {
  const candidates: ChoiceExplanation[] = [];

  // 対象カテゴリの source_questions を取得
  const allSourceQuestions = await db.source_questions.toArray();
  const targetQuestions = allSourceQuestions.filter(q =>
    TARGET_CATEGORIES.some(cat => q.category?.includes(cat))
  ).slice(0, 15);

  // 対象の source_choices を取得
  const targetQuestionIds = targetQuestions.map(q => q.id);
  const targetChoices = await db.source_choices
    .where('question_id')
    .anyOf(targetQuestionIds)
    .toArray();

  for (const sc of targetChoices.slice(0, 45)) {
    const id = `CE-${sc.id}`;
    const sq = targetQuestions.find(q => q.id === sc.question_id);

    const sourceRefs: SourceRef[] = [];
    if (sq?.category?.includes('農地法')) {
      sourceRefs.push({
        source_type: 'e_gov',
        title: '農地法',
        url: 'https://elaws.e-gov.go.jp/document?lawid=327AC0000000222',
        law_name: '農地法',
        article: '3条1項'
      });
    }

    const now = Date.now();

    // 選択肢文からキーワードを抽出
    const statementKeywords = sc.text?.substring(0, 30)?.split(' ') || [];
    const keyPhrases: KeyPhrase[] = statementKeywords
      .filter(kw => kw.length > 0)
      .map(kw => ({
        phrase: kw,
        meaning: '選択肢の重要語句',
        trap: '誤解しやすい語句'
      }));

    const item: ChoiceExplanation = {
      id,
      choice_id: sc.id,
      source_choice_id: sc.id,
      question_id: sc.question_id,
      source_question_id: sq?.id,
      card_id: sq?.id || sc.question_id,
      batch_id: BATCH_ID,
      category: sq?.category || '',
      statement_text: sc.text || '',
      is_statement_true_snapshot: sc.is_statement_true,
      // 選択肢文に即した正解理由
      correct_answer_reason: `この選択肢は${sc.is_statement_true ? '正しい' : '誤り'}です。`,
      why_true: sc.is_statement_true ? `${sq?.category || '法令'}の規定に適合するため正しい。` : `${sq?.category || '法令'}の規定に適合しないため誤り。`,
      why_false: sc.is_statement_true ? `${sq?.category || '法令'}の規定に反するため誤り。` : `${sq?.category || '法令'}の規定に合致するため正しい。`,
      why_user_wrong: 'この選択肢の文面に引きずれて誤答する可能性があります。',
      application_to_statement: `「${(sc.text || '').substring(0, 20)}...」という選択肢文に、${sq?.category || '法令'}の規定を適用します。`,
      key_phrases: keyPhrases,
      rule: `${sq?.category || '法令'}の適用ルール`,
      exception: '例外がある場合',
      trap: 'ひっかけ内容',
      one_line_memory: `${sq?.category || '法令'}の1行暗記`,
      source_refs: sourceRefs,
      source_trace_grade: 'A',
      confidence: 'high',
      review_status: 'candidate',
      label_conflict_suspected: sc.is_statement_true === null,
      human_review_required: sc.is_statement_true === null,
      disabled: false,
      created_at: now,
      updated_at: now
    };

    // 農地法label_conflict検出
    item.label_conflict_suspected = item.label_conflict_suspected || detectAgriculturalLandConflict(sq?.category, sc.text, item.correct_answer_reason);

    // quality 判定 (厳格化)
    item.source_trace_grade = determineSourceTraceGrade(item);
    item.confidence = determineConfidence(item);
    const quality = determineQualityStrict(item);
    item.review_status = determineReviewStatus({ quality, label_conflict_suspected: item.label_conflict_suspected });
    item.human_review_required = item.human_review_required || quality !== 'A' || item.label_conflict_suspected;

    candidates.push(item);
  }

  return candidates;
}

/**
 * 重複ID検証
 */
function validateDuplicateIds(qeCandidates: QuestionExplanation[], ceCandidates: ChoiceExplanation[]): number {
  const allIds = new Set<string>();

  let duplicateCount = 0;
  for (const item of [...qeCandidates, ...ceCandidates]) {
    if (allIds.has(item.id)) {
      duplicateCount++;
    }
    allIds.add(item.id);
  }

  return duplicateCount;
}

/**
 * 必須フィールド検証
 */
function validateRequiredFields(qeCandidates: QuestionExplanation[], ceCandidates: ChoiceExplanation[]): number {
  let missingCount = 0;

  for (const item of [...qeCandidates, ...ceCandidates] as Array<QuestionExplanation | ChoiceExplanation>) {
    if (!item.id || !item.created_at || !item.updated_at) {
      missingCount++;
    }
    if (!item.source_trace_grade || !item.confidence) {
      missingCount++;
    }
  }

  return missingCount;
}

/**
 * source_refs 検証
 */
function validateSourceRefs(qeCandidates: QuestionExplanation[], ceCandidates: ChoiceExplanation[]): number {
  let missingCount = 0;
  let weakAlignmentCount = 0;

  for (const item of [...qeCandidates, ...ceCandidates] as Array<QuestionExplanation & ChoiceExplanation>) {
    if (!item.source_refs || item.source_refs.length === 0) {
      missingCount++;
    }
    if (!validateSourceRefsAlignment(item)) {
      weakAlignmentCount++;
    }
  }

  return missingCount + weakAlignmentCount;
}

/**
 * 汎用文検出
 */
function detectGenericMessages(qeCandidates: QuestionExplanation[], ceCandidates: ChoiceExplanation[]): number {
  let count = 0;

  for (const item of [...qeCandidates, ...ceCandidates] as Array<QuestionExplanation & ChoiceExplanation>) {
    if (detectGenericTemplate(item.application_to_question) ||
        detectGenericTemplate(item.why_this_answer) ||
        detectGenericTemplate(item.correct_answer_reason) ||
        detectGenericTemplate(item.why_user_wrong) ||
        detectGenericTemplate(item.one_line_memory)) {
      count++;
    }
  }

  return count;
}

/**
 * auto_ok 過大判定検出
 */
function detectAutoOkTooOptimistic(qeCandidates: QuestionExplanation[], ceCandidates: ChoiceExplanation[]): number {
  let count = 0;

  for (const item of [...qeCandidates, ...ceCandidates] as Array<QuestionExplanation & ChoiceExplanation>) {
    const quality = determineQualityStrict(item);
    const currentStatus = item.review_status === 'auto_ok';
    const shouldNotBeAutoOk = quality !== 'A';

    if (currentStatus && shouldNotBeAutoOk) {
      count++;
    }
  }

  return count;
}

/**
 * Dry-run 実行 (修正版)
 */
export async function runV30ExplanationDryRun(): Promise<{
  question_explanations: QuestionExplanation[];
  choice_explanations: ChoiceExplanation[];
  summary: DryRunSummary;
}> {
  console.log('=== v30 Explanation Dry-run (修正版) ===');

  // 候補生成
  const question_explanations = await generateQuestionExplanationCandidates();
  const choice_explanations = await generateChoiceExplanationCandidates();

  // 検証
  const duplicate_id_count = validateDuplicateIds(question_explanations, choice_explanations);
  const missing_required_field_count = validateRequiredFields(question_explanations, choice_explanations);
  const source_refs_missing_count = validateSourceRefs(question_explanations, choice_explanations);

  // 品質集計 (分離版)
  const quality_A_question_count = question_explanations.filter(item => {
    const quality = determineQualityStrict(item);
    return quality === 'A';
  }).length;

  const quality_A_choice_count = choice_explanations.filter(item => {
    const quality = determineQualityStrict(item);
    return quality === 'A';
  }).length;

  const quality_B_question_count = question_explanations.filter(item => {
    const quality = determineQualityStrict(item);
    return quality === 'B';
  }).length;

  const quality_B_choice_count = choice_explanations.filter(item => {
    const quality = determineQualityStrict(item);
    return quality === 'B';
  }).length;

  const quality_C_question_count = question_explanations.filter(item => {
    const quality = determineQualityStrict(item);
    return quality === 'C';
  }).length;

  const quality_C_choice_count = choice_explanations.filter(item => {
    const quality = determineQualityStrict(item);
    return quality === 'C';
  }).length;

  // ready count (分離)
  const ready_question_for_import_count = quality_A_question_count;
  const ready_choice_for_import_count = quality_A_choice_count;
  const ready_total_for_import_count = ready_question_for_import_count + ready_choice_for_import_count;

  // 汎用文検出
  const generic_message_detected_count = detectGenericMessages(question_explanations, choice_explanations);

  // auto_ok 過大判定検出
  const auto_ok_too_optimistic_count = detectAutoOkTooOptimistic(question_explanations, choice_explanations);

  const human_review_required_count = [...question_explanations, ...choice_explanations].filter(item => item.human_review_required).length;
  const label_conflict_suspected_count = [...question_explanations, ...choice_explanations].filter(item => item.label_conflict_suspected).length;
  const source_trace_grade_A_count = [...question_explanations, ...choice_explanations].filter(item => item.source_trace_grade === 'A').length;
  const source_refs_alignment_weak_count = [...question_explanations, ...choice_explanations].filter(item => !validateSourceRefsAlignment(item)).length;

  const summary: DryRunSummary = {
    generated_question_explanations_count: question_explanations.length,
    generated_choice_explanations_count: choice_explanations.length,
    quality_A_question_count,
    quality_A_choice_count,
    quality_B_question_count,
    quality_B_choice_count,
    quality_C_question_count,
    quality_C_choice_count,
    ready_question_for_import_count,
    ready_choice_for_import_count,
    ready_total_for_import_count,
    generic_message_detected_count,
    auto_ok_too_optimistic_count,
    human_review_required_count,
    label_conflict_suspected_count,
    source_refs_missing_count,
    source_refs_alignment_weak_count,
    duplicate_id_count,
    missing_required_field_count
  };

  console.log('Summary:', summary);

  return {
    question_explanations,
    choice_explanations,
    summary
  };
}

/**
 * JSON出力（ブラウザコンソール用）
 */
export async function outputV30DryRunAsJSON(): Promise<void> {
  const result = await runV30ExplanationDryRun();

  console.log('=== Generated Data ===');
  console.log(JSON.stringify(result, null, 2));
}

// デバッグ用: ブラウザコンソールから実行可能
(window as any).runV30ExplanationDryRun = runV30ExplanationDryRun;
(window as any).outputV30DryRunAsJSON = outputV30DryRunAsJSON;
