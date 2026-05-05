import { InputUnit } from '../types/inputUnit';
import { TAKKEN_PROTOTYPE_UNITS } from './inputUnitPrototypes';
import { validateInputUnit } from './inputUnitValidator';

/**
 * P42: Repair Matcher (誤答後の補修インプット紐付け)
 */

export interface RepairMatchResult {
    unit: InputUnit | null;
    reason: 'card_id' | 'tag' | 'category' | 'none';
    matchScore: number;
}

export function findRepairInputUnit(params: {
    cardId?: string;
    tags?: string[];
    category?: string;
    examType?: string;
}): RepairMatchResult {
    const { cardId, tags = [], category } = params;

    // 1. card_id 直接一致 (Prototypeには現状ないが将来用)
    // Prototypeは unit_id が独自なので、metadata等での紐付けが必要

    // 2. tags 一致 (最優先：一致数が多いものを選択)
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
            return { unit: bestMatch, reason: 'tag', matchScore: 100 + maxMatchCount };
        }
    }

    // 3. category 一致
    if (category) {
        for (const unit of TAKKEN_PROTOTYPE_UNITS) {
            const validation = validateInputUnit(unit);
            if (!validation.isValid) continue;
            if (unit.quality_flags.needs_human_review || unit.quality_flags.is_placeholder) continue;

            if (unit.category === category || unit.title.includes(category) || category.includes(unit.title)) {
                return { unit, reason: 'category', matchScore: 50 };
            }
        }
    }

    return { unit: null, reason: 'none', matchScore: 0 };
}

/**
 * 誤答イベントから補修ユニットを特定する
 */
export function findRepairUnitForMistake(event: any): RepairMatchResult {
    return findRepairInputUnit({
        cardId: event.card_id,
        tags: event.tags,
        category: event.category,
        examType: event.exam_type
    });
}
