/**
 * 型定義
 */

export interface SRSParams {
  efactor: number;
  interval: number;
  repetitions: number;
  next_review_date: string | null;
  quality_history: number[];
  last_reviewed: string | null;
  total_reviews: number;
  successful_reviews: number;
}

export interface Analogy {
  analogy: string;
  explanation: string;
  mapping: Record<string, string>;
}

export interface StepDecomposition {
  step_number: number;
  content: string;
  type: 'condition' | 'obligation' | 'prohibition' | 'permission' | 'period' | 'ratio' | 'general';
  key_elements: string[];
}

export interface ActiveRecallQuestion {
  type: 'blank_fill' | 'partial_recall' | 'inverse' | 'why';
  question: string;
  answer?: string;
  correct_answer?: string;
  hints?: Array<{
    level: number;
    hint: string;
    penalty: number;
  }>;
  expected_answer_points?: string[];
  answer_points?: string[];
  original_question?: string;
  keyword?: string;
  category?: string;
  hint?: string;
}

export interface UnderstandingCard {
  card_id: string;
  category: string;
  tags: string[];
  core_knowledge: {
    rule: string;
    essence: string;
    examiners_intent: string;
  };
  sample_question?: string;
  sample_answer?: boolean;
  srs_params?: SRSParams;
  analogies?: Analogy[];
  step_decomposition?: StepDecomposition[];
  active_recall_questions?: ActiveRecallQuestion[];
  metacognitive_prompts?: {
    self_assessment: string[];
    reflection: string[];
    next_steps: string[];
  };
  misconceptions?: {
    misconception: string;
    correction: string;
    why_wrong: string;
    key_point: string;
  }[];
  cognitive_load_chunk?: {
    title: string;
    chunks: string[];
    cognitive_load_rating: 'low' | 'medium' | 'high';
  };
}

export interface LearningSession {
  mode: 'understanding' | 'memorization' | 'integrated';
  cards: UnderstandingCard[];
  currentIndex: number;
  startTime: number;
  answers: Map<string, {
    correct: boolean;
    time_spent: number;
    self_evaluation?: number;
  }>;
}

export interface StudyStats {
  total_cards: number;
  learned_cards: number;
  due_cards: number;
  streak_days: number;
  today_study_time: number;
  weekly_stats: {
    date: string;
    cards_studied: number;
    correct_rate: number;
    study_time: number;
  }[];
}
