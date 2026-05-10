/**
 * P39: Input Quality Layer - Input Unit Template & Types
 */

export type OutputMode = 'active_recall' | 'memory_recall' | 'number_recall' | 'trap_recall' | 'comparison_recall';

export interface SourceTrace {
    type: 'law' | 'past_question' | 'official_guide';
    id: string;
    text?: string;
    url?: string;
}

export interface ComparisonRef {
    target_tag: string;
    difference: string;
}

export interface CheckQuestion {
    question: string;
    answer: string;
    explanation: string;
}

export interface UnderstandingVisual {
    type: 'comparison_matrix' | 'case_flow' | 'rule_table' | 'calculation_flow';
    title: string;
    columns: string[];
    rows: Array<{
        label: string;
        cells: string[];
        emphasis?: 'trap' | 'rule' | 'neutral';
    }>;
}

export interface CasePattern {
    title: string;
    situation: string;
    conclusion: string;
    reason: string;
    exam_signal: string;
}

export interface TrapDetail {
    trap: string;
    why_wrong: string;
    correct_rule: string;
}

export interface ExamReadingGuide {
    signal: string;
    check: string;
    answer_pattern: string;
}

export interface RepairExplanation {
    short_note: string;
    diagram_hint?: string;
    common_mistake?: string;
}

export interface QualityFlags {
    is_placeholder: boolean;
    low_confidence: boolean;
    needs_human_review: boolean;
    contradiction_suspected: boolean;
}

export interface InputUnit {
    unit_id: string;
    title: string;
    category: string;
    conclusion: string;
    purpose: string;
    requirements: string[];
    legal_effect: string;
    principle: string;
    exceptions: string[];
    cases: {
        concrete_example?: string;
        counter_example?: string;
    };
    comparison: ComparisonRef[];
    trap_points: string[];
    
    // High-Quality Understanding Fields (PoC)
    understanding_visual?: UnderstandingVisual;
    case_patterns?: CasePattern[];
    trap_details?: TrapDetail[];
    exam_reading_guide?: ExamReadingGuide[];

    memory_hook?: string;
    check_question: CheckQuestion;
    repair_explanation: RepairExplanation;
    linked_tags: string[];
    linked_output_modes: OutputMode[];
    source_trace: SourceTrace[];
    quality_flags: QualityFlags;
    created_at: number;
    updated_at: number;
}
