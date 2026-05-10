import { InputUnit } from '../types/inputUnit';
import { TAKKEN_PROTOTYPE_UNITS } from './inputUnitPrototypes';
import { validateInputUnit } from './inputUnitValidator';
import { db, type HighQualityInputUnit } from '../db';

/**
 * P42: Repair Matcher (誤答後の補修インプット紐付け)
 *
 * マッチング順序（v29統合対応）:
 * 1. high_quality_input_units（DB、Batch 1等の高品質データ）
 * 2. TAKKEN_PROTOTYPE_UNITS（ハードコード、フォールバック）
 * 3. null（最終fallback）
 */

export interface RepairMatchResult {
    unit: InputUnit | null;
    reason: 'card_id' | 'tag' | 'category' | 'db_tag' | 'db_category' | 'none';
    matchScore: number;
    dataSource: 'db' | 'prototype' | 'none';
}

/**
 * high_quality_input_units から InputUnit への変換
 */
function convertHighQualityInputUnitToInputUnit(hqi: HighQualityInputUnit): InputUnit {
    // visual_type マッピング: HighQualityInputUnit -> InputUnit
    const visualTypeMap: Record<string, 'comparison_matrix' | 'case_flow' | 'rule_table' | 'calculation_flow'> = {
        'comparison_table': 'comparison_matrix',
        'flowchart': 'case_flow',
        'step_diagram': 'rule_table',
        'mnemonic': 'calculation_flow'
    };

    return {
        unit_id: hqi.id,
        title: hqi.id,
        category: hqi.category,
        conclusion: `DBデータ: ${hqi.id} (Batch: ${hqi.batch_id})`,
        purpose: `高品質インプット (Grade: ${hqi.source_trace_grade})`,
        requirements: [],
        legal_effect: '',
        principle: '',
        exceptions: [],
        cases: { concrete_example: '', counter_example: '' },
        comparison: [],
        trap_points: [],
        understanding_visual: {
            type: visualTypeMap[hqi.visual_type] || 'comparison_matrix',
            title: `DBデータ: ${hqi.id}`,
            columns: ['項目', '内容'],
            rows: [{
                label: 'バッチID',
                cells: [hqi.batch_id, '']
            }]
        },
        linked_tags: [],
        check_question: {
            question: `DBデータ: ${hqi.id}`,
            answer: 'バッチデータより',
            explanation: `Batch: ${hqi.batch_id}, Grade: ${hqi.source_trace_grade}`
        },
        repair_explanation: {
            short_note: `DB高品質データ (Grade: ${hqi.source_trace_grade})`,
            diagram_hint: '詳細はDB元データを参照',
            common_mistake: ''
        },
        linked_output_modes: ['active_recall'],
        source_trace: [{
            type: 'law',
            id: hqi.source_item_id,
            text: `Batch ${hqi.batch_id}`
        }],
        quality_flags: {
            needs_human_review: hqi.review_status === 'human_review_required',
            is_placeholder: false,
            low_confidence: false,
            contradiction_suspected: false
        },
        created_at: hqi.created_at,
        updated_at: hqi.updated_at
    };
}

export async function findRepairInputUnit(params: {
    cardId?: string;
    tags?: string[];
    category?: string;
    examType?: string;
}): Promise<RepairMatchResult> {
    const { cardId, tags = [], category } = params;

    // 優先順位1: high_quality_input_units（DB）を検索
    if (category) {
        try {
            const dbUnits = await db.high_quality_input_units.toArray();

            // カテゴリ一致（DB）
            const categoryMatch = dbUnits.find(hqi =>
                !hqi.disabled &&
                hqi.review_status !== 'rejected' &&
                hqi.category === category
            );

            if (categoryMatch) {
                const unit = convertHighQualityInputUnitToInputUnit(categoryMatch);
                return { unit, reason: 'db_category', matchScore: 200, dataSource: 'db' };
            }
        } catch (error) {
            console.error('[RepairMatcher] DB query error:', error);
            // フォールバックして継続
        }
    }

    // 優先順位2: TAKKEN_PROTOTYPE_UNITS（ハードコード）
    // タグ一致
    if (tags.length > 0) {
        let bestMatch: InputUnit | null = null;
        let maxMatchCount = 0;

        for (const unit of TAKKEN_PROTOTYPE_UNITS) {
            const validation = validateInputUnit(unit);
            if (!validation.isValid) continue;
            if (unit.quality_flags.needs_human_review || unit.quality_flags.is_placeholder) continue;

            const matchCount = unit.linked_tags.filter(ut => tags.includes(ut)).length;
            if (matchCount > maxMatchCount) {
                maxMatchCount = matchCount;
                bestMatch = unit;
            }
        }

        if (bestMatch) {
            return { unit: bestMatch, reason: 'tag', matchScore: 100 + maxMatchCount, dataSource: 'prototype' };
        }
    }

    // カテゴリ一致
    if (category) {
        for (const unit of TAKKEN_PROTOTYPE_UNITS) {
            const validation = validateInputUnit(unit);
            if (!validation.isValid) continue;
            if (unit.quality_flags.needs_human_review || unit.quality_flags.is_placeholder) continue;

            if (unit.category === category || unit.title.includes(category) || category.includes(unit.title)) {
                return { unit, reason: 'category', matchScore: 50, dataSource: 'prototype' };
            }
        }
    }

    return { unit: null, reason: 'none', matchScore: 0, dataSource: 'none' };
}

/**
 * 誤答イベントから補修ユニットを特定する
 */
export async function findRepairUnitForMistake(event: any): Promise<RepairMatchResult> {
    return findRepairInputUnit({
        cardId: event.card_id,
        tags: event.tags,
        category: event.category,
        examType: event.exam_type
    });
}
