import Dexie, { type Table } from 'dexie';

export type SRSParams = { efactor: number; interval: number; repetitions: number; next_review_date: string | null; quality_history: number[]; last_reviewed: string | null; total_reviews: number; successful_reviews: number; };
export type Analogy = { analogy: string; explanation: string; mapping: Record<string, string>; };
export type StepDecomposition = { step_number: number; content: string; type: 'condition' | 'obligation' | 'prohibition' | 'permission' | 'period' | 'ratio' | 'general'; key_elements: string[]; };
export type ActiveRecallQuestion = { type: 'blank_fill' | 'partial_recall' | 'inverse' | 'why'; question: string; answer?: string; correct_answer?: string; hints?: Array<{ level: number; hint: string; penalty: number }>; expected_answer_points?: string[]; answer_points?: string[]; original_question?: string; keyword?: string; category?: string; hint?: string; };

export interface Limb { id: string; parent_id: string; limb_no?: number; session?: string; year: number; question_no?: number; question_text?: string; correct_option?: number; category_major: string; category_minor: string; text: string; is_correct: boolean; explanation_full?: string; source_url?: string; tags: string[]; examiners_intent: string; core_rule: string; contrast_case: string; reasoning: string; mnemonic: string; importance: number; contrast_axis?: string; atomic_requirements?: { title: string; list: { item: string; status: string }[]; conclusion: string; }; }
export interface ComparisonTable { id?: number; title: string; headers: string[]; rows: { label: string; values: string[] }[]; }
export interface CaseLaw { id: string; title: string; story: string; conclusion: string; point: string; }
export interface Statistic { id?: number; item: string; value: string; trend: 'up' | 'down' | 'flat'; memo: string; }
export interface PersonalMnemonic { id?: number; category: string; title: string; mnemonic: string; explanation: string; }
export interface Progress { limb_id: string; stability: number; difficulty: number; due_at: number; last_review: number; reps: number; lapses: number; state: number; }
export interface KnowledgeCard { card_id: string; knowledge_domain: { major: string; tags: string[]; category_sample: string; total_patterns: number; }; core_knowledge: { rule: string; essence: string; examiners_intent: string; all_essences: string[]; }; question_patterns: { total: number; correct_count: number; incorrect_count: number; years_active: number[]; correct_patterns?: Array<{ id: string; year: number; question_no: number; question_text: string; is_correct: boolean; correct_option: number; explanation?: any; }>; incorrect_patterns?: Array<{ id: string; year: number; question_no: number; question_text: string; is_correct: boolean; correct_option: number; explanation?: any; }>; }; study_metadata: { importance: number; frequency: number; difficulty: number; estimated_time: number; }; learning_analysis?: { type: 'understanding' | 'mixed' | 'memorization'; difficulty: number; complexity: number; understanding_score: number; memorization_score: number; }; related_knowledge: Array<{ card_id: string; shared_tags: string[]; category: string; }>; }
export interface Flashcard { card_id: string; flashcard_id: string; qa: { q: string; a: string; category: string; tags: string[]; }; explanation: { core_rule: string; reasoning: string; year: number; }; metadata: { question_id: string; is_original: boolean; pattern_index: number; }; }
export interface KnowledgeProgress { card_id: string; mastered: boolean; correct_count: number; incorrect_count: number; last_review: number; next_review: number; }
export interface ConfusionPair { pair_id: string; exam_type: 'takken' | 'chintai'; category: string; left_term: string; right_term: string; difference?: string; }
export interface UnderstandingCard { card_id: string; category: string; tags: string[]; core_knowledge: { rule: string; essence: string; examiners_intent: string; }; sample_question?: string; sample_answer?: boolean; is_statement_true?: boolean | null; source_choice_id?: string | null; question_patterns?: { total: number; correct_count: number; incorrect_count: number; years_active: number[]; correct_patterns?: Array<{ id: string; year: number; question_no: number; question_text: string; is_correct: boolean; correct_option: number; explanation?: any; }>; incorrect_patterns?: Array<{ id: string; year: number; question_no: number; question_text: string; is_correct: boolean; correct_option: number; explanation?: any; }>; }; srs_params?: { efactor: number; interval: number; repetitions: number; next_review_date: string | null; quality_history: number[]; last_reviewed: string | null; total_reviews: number; successful_reviews: number; }; fsrs_state?: any; personal_notes?: string[]; analogies?: Array<{ analogy: string; explanation: string; mapping: Record<string, string>; }>; step_decomposition?: Array<{ step_number: number; content: string; type: 'condition' | 'obligation' | 'prohibition' | 'permission' | 'period' | 'ratio' | 'general'; key_elements: string[]; }>; active_recall_questions?: Array<{ type: 'blank_fill' | 'partial_recall' | 'inverse' | 'why'; question: string; answer?: string; correct_answer?: string; hints?: Array<{ level: number; hint: string; penalty: number; }>; expected_answer_points?: string[]; answer_points?: string[]; original_question?: string; keyword?: string; category?: string; hint?: string; }>; metacognitive_prompts?: { self_assessment: string[]; reflection: string[]; next_steps: string[]; }; misconceptions?: Array<{ misconception: string; correction: string; why_wrong: string; key_point: string; }>; cognitive_load_chunk?: { title: string; chunks: string[]; cognitive_load_rating: 'low' | 'medium' | 'high'; }; exam_type?: 'takken' | 'chintai'; }
export interface LearningSession { id: string; mode: 'understanding' | 'memorization' | 'integrated'; start_time: number; end_time?: number; cards_studied: number; correct_count: number; total_count: number; }
export interface SourceQuestion { id: string; exam_type: 'takken' | 'chintai'; year: number; question_no: number; question_text: string; correct_option: number; question_type: 'true_false' | 'correct_choice' | 'incorrect_choice' | 'count_choice' | 'combination' | 'unknown'; polarity?: 'select_true' | 'select_false' | 'count' | 'combination' | 'unknown'; category: string; source_url?: string; source_card_id?: string; }
export interface SourceChoice { id: string; question_id: string; option_no: number; text: string; is_exam_correct_option: boolean; is_statement_true: boolean | null; explanation?: string; source_card_id?: string; }
export interface StudyEvent { event_id: string; card_id: string; question_id?: string; exam_type: 'takken' | 'chintai'; category: string; tags: string[]; mode: 'understanding' | 'memorization' | 'integrated' | 'active_recall' | 'memory_recall' | 'comparison_recall' | 'trap_recall' | 'number_recall' | 'focus_recall'; answered_correct: boolean; selected_answer: boolean | null; correct_answer: boolean | null; response_time_ms: number; rating?: number; rating_source?: string; mistake_note?: string; created_at: number; }
export interface Metadata { key: string; value: any; }
export interface KnowledgeUnit { unit_id: string; source_choice_id?: string; source_question_id?: string; source_card_id?: string; exam_type: 'takken' | 'chintai'; category: string; tags: string[]; statement: string; is_statement_true: boolean; core_rule: string; why: string; exception?: string; trap?: string; contrast?: string; concrete_example?: string; memory_hook?: string; numbers_to_memorize?: string[]; parties?: string[]; legal_terms?: string[]; learning_type: 'rule' | 'exception' | 'number' | 'comparison' | 'trap' | 'definition'; difficulty: 1 | 2 | 3 | 4 | 5; importance: 1 | 2 | 3 | 4 | 5; confidence: 'high' | 'medium' | 'low'; }
export interface MemoryCard { memory_card_id: string; unit_id: string; exam_type: 'takken' | 'chintai'; category: string; tags: string[]; card_type: 'rule' | 'why' | 'exception' | 'number' | 'comparison' | 'trap'; question: string; answer: string; source_text: string; confidence: 'high' | 'medium' | 'low'; srs_params?: any; fsrs_state?: any; last_reviewed_at?: number; }

export interface MemoryCardProgress { card_id: string; srs_params?: SRSParams; fsrs_state?: any; last_reviewed_at: number; }
export interface MemoryStudyEvent { event_id: string; card_id: string; mode: string; answered_correct: boolean; response_time_ms: number; rating: number; created_at: number; }

/**
 * P26: 教材復元 Sidecar テーブル
 */
export interface RestorationCandidate {
    restoration_id: string;
    source_choice_id: string;
    source_question_id: string;
    exam_type: 'takken' | 'chintai';
    category: string;
    year: number;
    question_no: number;
    option_no: number;
    original_text: string;
    original_explanation: string;
    original_is_statement_true: boolean | null;
    restore_reason: 'placeholder_text_shortage' | 'null_statement' | 'short_explanation' | 'missing_explanation' | 'other';
    restored_text?: string;
    restored_explanation?: string;
    restored_is_statement_true?: boolean;
    confidence: 'high' | 'medium' | 'low';
    source_refs: Array<{
        source_type: 'law' | 'official_guideline' | 'official_exam' | 'internal_db' | 'human_note';
        title: string;
        ref: string;
        article_or_section?: string;
        checked_at: number;
        note?: string;
    }>;
    review_status: 'candidate' | 'auto_ok' | 'human_review_required' | 'rejected';
    created_at: number;
    updated_at: number;
}

export interface ChintaiCluster { cluster_id: string; official_category: string; tags: string[]; canonical_statement: string; core_rule: string; variations_count: number; source_choice_ids: string[]; years: number[]; trap_patterns: string[]; confidence: 'high' | 'medium' | 'low'; }
export interface RecoveredLearningAsset { asset_id: string; source_id: string; source_type: string; exam_type: 'takken' | 'chintai'; category: string; tags: string[]; asset_type: 'memory_card' | 'number_card' | 'trap_card' | 'comparison_card' | 'explanation_note' | 'review_only' | 'discard'; question?: string; answer?: string; note?: string; source_text: string; confidence: 'high' | 'medium' | 'low'; recovery_reason: string; contradiction_risk: 'none' | 'low' | 'medium' | 'high'; usable_in_learning: boolean; created_at: number; mistake_count?: number; last_mistake_at?: number; quality_review_needed?: boolean; review_reason?: string; }
export interface QualityImprovementSuggestion {
  suggestion_id: string;
  target_id: string;
  target_type: 'memory_card' | 'recovered_asset' | 'knowledge_unit' | 'source_choice';
  issue_type: 'bad_question' | 'bad_answer' | 'too_abstract' | 'too_long' | 'misleading' | 'weak_explanation' | 'needs_comparison' | 'needs_number_card' | 'needs_trap_card' | 'learner_weakness_only' | 'shallow_analogy';
  before_question: string;
 before_answer: string; suggested_question: string; suggested_answer: string; suggested_extra_card?: any; reason: string; confidence: 'high' | 'medium' | 'low'; requires_human_review: boolean; is_applied: boolean; created_at: number; }
export interface StudySession { session_id: string; date: string; planned_count: number; completed_count: number; correct_count: number; accuracy: number; mode_distribution: Record<string, number>; recovered_count: number; quality_review_triggered_count: number; started_at: number; ended_at?: number; session_variant?: string; }

export interface EnhancedExplanation {
  conclusion: string;
  essence: string;
  requirements: string[];
  legal_effect: string;
  exceptions: string[];
  traps: string[];
  related_knowledge: string[];
  memorize_table: Array<{ item: string; content: string; importance: 'high' | 'medium' | 'low'; }>;
  comparison_table: Array<{ left: string; right: string; difference: string; }>;
  one_line_summary: string;
  confidence: 'high' | 'medium' | 'low';
  requires_human_review: boolean;
  requires_human_review_reason?: string;
  evidence_spans: {
    conclusion?: string;
    essence?: string;
    requirements?: string[];
    legal_effect?: string;
    exceptions?: string[];
    traps?: string[];
  };
}

export interface EnhancedExplanationRecord { explanation_id: string; source_id: string; source_type: string; exam_type: 'takken' | 'chintai'; category: string; tags: string[]; question: string; original_explanation: string; enhanced: EnhancedExplanation; quality_score: number; issue_flags: string[]; usable_in_learning: boolean; created_at: number; updated_at: number; }

export interface ImprovementCandidate {
  candidate_id: string;
  card_id: string;
  category: string;
  issue_type: 'mismatch' | 'contradiction' | 'shallow_analogy' | 'missing_core_rule' | 'missing_trap' | 'unsupported_visible' | 'other';
  current_question: string;
  current_explanation: string;
  suggested_fix_type: 'question_rewrite' | 'answer_simplify' | 'add_trap' | 'add_number' | 'add_comparison' | 'human_review';
  human_review_required: boolean;
  reason: string;
  created_at: number;
}

export class TakkenDatabase extends Dexie {
  limbs!: Table<Limb, string>; progress!: Table<Progress, string>; comparisons!: Table<ComparisonTable, number>; cases!: Table<CaseLaw, string>; stats!: Table<Statistic, number>; mnemonics!: Table<PersonalMnemonic, number>; metadata!: Table<Metadata, string>; knowledge_cards!: Table<KnowledgeCard, string>; knowledge_progress!: Table<KnowledgeProgress, string>; understanding_cards!: Table<UnderstandingCard, string>; learning_sessions!: Table<LearningSession, string>; source_questions!: Table<SourceQuestion, string>; source_choices!: Table<SourceChoice, string>; study_events!: Table<StudyEvent, string>; knowledge_units!: Table<KnowledgeUnit, string>; memory_cards!: Table<MemoryCard, string>; chintai_clusters!: Table<ChintaiCluster, string>; recovered_learning_assets!: Table<RecoveredLearningAsset, string>; quality_improvement_suggestions!: Table<QualityImprovementSuggestion, string>; study_sessions!: Table<StudySession, string>; enhanced_explanations!: Table<EnhancedExplanationRecord, string>;
  improvement_candidates!: Table<ImprovementCandidate, string>;
  confusion_pairs!: Table<ConfusionPair, string>;
  memory_card_progress!: Table<MemoryCardProgress, string>;
  memory_study_events!: Table<MemoryStudyEvent, string>;
  restoration_candidates!: Table<RestorationCandidate, string>;

  constructor() {
    super('TakkenOS_DB');
    this.version(24).stores({
      limbs: 'id, parent_id, year, category_major, category_minor, *tags, importance, contrast_axis',
      progress: 'limb_id, due_at, state, last_review',
      comparisons: '++id, title',
      cases: 'id, title',
      stats: '++id, item',
      mnemonics: '++id, category, title',
      metadata: 'key',
      knowledge_cards: 'card_id, knowledge_domain.major, *knowledge_domain.tags, study_metadata.importance',
      knowledge_progress: 'card_id, mastered, next_review, last_review',
      understanding_cards: 'card_id, category, *tags, exam_type, srs_params.repetitions, srs_params.last_reviewed, srs_params.next_review_date',
      learning_sessions: 'id, mode, start_time',
      source_questions: 'id, exam_type, year, question_no, category, question_type',
      source_choices: 'id, question_id, option_no, text, is_exam_correct_option',
      study_events: 'event_id, card_id, exam_type, category, mode, answered_correct, created_at',
      knowledge_units: 'unit_id, source_card_id, exam_type, category, learning_type, importance, confidence',
      memory_cards: 'memory_card_id, unit_id, exam_type, category, card_type, confidence',
      chintai_clusters: 'cluster_id, official_category, *tags, variations_count, confidence',
      recovered_learning_assets: 'asset_id, source_id, source_type, exam_type, category, asset_type, confidence, usable_in_learning, created_at, quality_review_needed',
      quality_improvement_suggestions: 'suggestion_id, target_id, target_type, issue_type, confidence, requires_human_review, is_applied',
      study_sessions: 'session_id, date, started_at',
      enhanced_explanations: 'explanation_id, source_id, exam_type, category, quality_score, usable_in_learning',
      improvement_candidates: 'candidate_id, card_id, category, issue_type, human_review_required'
    });

    this.version(25).stores({
      study_sessions: 'session_id, date, started_at, session_variant'
    }).upgrade(async tx => {
      const table = tx.table('study_sessions');
      await table.toCollection().modify(session => {
        if (!session.session_variant) {
          session.session_variant = '30q';
        }
      });
    });

    this.version(26).stores({
      knowledge_units: 'unit_id, source_choice_id, source_question_id, source_card_id, exam_type, category, *tags, learning_type, confidence',
      memory_cards: 'memory_card_id, unit_id, exam_type, category, *tags, card_type, confidence',
      confusion_pairs: 'pair_id, exam_type, category, left_term, right_term'
    });

    this.version(27).stores({
      memory_card_progress: 'card_id, last_reviewed_at',
      memory_study_events: 'event_id, card_id, mode, created_at'
    });

    this.version(28).stores({
      restoration_candidates: 'restoration_id, source_choice_id, source_question_id, exam_type, category, restore_reason, review_status, confidence'
    });
  }
}
export const db = new TakkenDatabase();
export async function resetDatabase(): Promise<void> { console.warn('⚠️ Resetting database...'); await db.delete(); window.location.reload(); }
