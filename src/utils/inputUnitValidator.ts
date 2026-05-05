import { InputUnit } from '../types/inputUnit';

/**
 * P39: Input Unit Validator
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    quality_score: number;
}

export function validateInputUnit(unit: Partial<InputUnit>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // 必須フィールドチェック
    if (!unit.unit_id) errors.push('unit_id is missing');
    if (!unit.title) errors.push('title is missing');
    if (!unit.category) errors.push('category is missing');
    if (!unit.conclusion) errors.push('conclusion is missing');
    if (!unit.purpose) errors.push('purpose is missing');
    if (!unit.legal_effect) errors.push('legal_effect is missing');
    if (!unit.principle) errors.push('principle is missing');

    // 配列系
    if (!unit.requirements || unit.requirements.length === 0) errors.push('requirements list is empty');
    if (!unit.trap_points || unit.trap_points.length === 0) warnings.push('trap_points list is empty');

    // Source Trace (最重要)
    if (!unit.source_trace || unit.source_trace.length === 0) {
        errors.push('source_trace is mandatory for legal integrity');
    }

    // Output Modes
    if (!unit.linked_output_modes || unit.linked_output_modes.length === 0) {
        warnings.push('no output modes linked');
        score -= 20;
    }

    // Repair Explanation
    if (!unit.repair_explanation || !unit.repair_explanation.short_note) {
        warnings.push('repair_explanation (short_note) is missing');
        score -= 20;
    }

    // Quality Flags
    if (unit.quality_flags?.is_placeholder) {
        warnings.push('marked as placeholder');
        score -= 50;
    }
    if (unit.quality_flags?.needs_human_review) {
        warnings.push('needs human review');
        score -= 30;
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        quality_score: Math.max(0, score)
    };
}

export function getInputUnitAuditSummary(units: Partial<InputUnit>[]): any {
    const summary = {
        total: units.length,
        valid: 0,
        invalid: 0,
        needs_review: 0,
        missing_source: 0,
        placeholders: 0,
        avg_score: 0
    };

    let totalScore = 0;

    units.forEach(u => {
        const v = validateInputUnit(u);
        if (v.isValid) summary.valid++;
        else summary.invalid++;

        if (u.quality_flags?.needs_human_review) summary.needs_review++;
        if (!u.source_trace || u.source_trace.length === 0) summary.missing_source++;
        if (u.quality_flags?.is_placeholder) summary.placeholders++;
        
        totalScore += v.quality_score;
    });

    summary.avg_score = units.length > 0 ? totalScore / units.length : 0;
    return summary;
}
