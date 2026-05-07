export type QuestionRenderMode = 'MCQ' | 'TRUE_FALSE' | 'INPUT_ONLY' | 'BLOCKED';

export interface ChoiceExplanation {
  option_no: number;
  choice_label: string; // A, B, C, D etc.
  choice_text: string;
  is_correct: boolean;
  judgment: string; // "正しい", "誤り"
  reason: string;
  trap?: string;
  source_trace?: string;
}

export type MistakeType = 
  | 'misunderstood_rule' 
  | 'confused_exception' 
  | 'missed_keyword' 
  | 'chose_opposite' 
  | 'guessed' 
  | 'no_prerequisite' 
  | 'careless'
  | 'unknown';

export interface MistakeDiagnosis {
  mistake_type: MistakeType;
  diagnosis_text: string;
  missed_keyword?: string;
  confusion_pair?: string;
  next_action: string;
  recommended_input_unit_id?: string;
}

export interface LearningContentContract {
  question_id: string;
  card_id: string;
  exam_type: 'takken' | 'chintai' | 'cross' | 'unknown';
  subject: string;
  category: string;
  sub_topic: string;
  render_mode: QuestionRenderMode;
  question_text: string;
  question_intent: string;
  correct_answer?: boolean | number | null;
  correct_answer_label?: string;
  user_answer?: boolean | number | null;
  user_answer_label?: string;
  
  // Explanation & Feedback
  direct_answer_sentence: string; // e.g. "この問題の正解はAです。"
  core_rule: string;
  why_this_is_correct: string;
  why_user_answer_is_wrong?: string;
  choice_explanations?: ChoiceExplanation[];
  
  // Educational Metadata
  prerequisite?: string;
  why_it_matters?: string;
  trap_point?: string;
  common_misconception?: string;
  compare_with?: string;
  memory_hook?: string;
  example_case?: string;
  counterexample_case?: string;
  source_trace: string;
  legal_basis_status: 'raw' | 'inferred' | 'official' | 'none';
  
  // Session Feedback
  confidence_level?: 'high' | 'medium' | 'low';
  mistake_diagnosis?: MistakeDiagnosis;
  next_review_focus?: string;

  // Quality Audit
  quality_level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
}
