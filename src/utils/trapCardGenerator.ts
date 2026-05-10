import { db, MemoryCard } from '../db';
import { InputUnit, TrapDetail, SourceTrace } from '../types/inputUnit';
import { TAKKEN_PROTOTYPE_UNITS } from './inputUnitPrototypes';

/**
 * P41: Memory Trap Card Generation
 * Input Unit の Trap 情報を MemoryRecall 用のカード形式に変換する。
 */

export interface TrapCardCandidate {
    id: string;
    unit_id: string;
    card_type: 'trap';
    question: string;
    answer: string;
    explanation: string;
    source_trace: SourceTrace[];
    confidence: 'high' | 'low';
    origin: string;
}

const truncate = (str: string, max: number): string => {
    if (str.length <= max) return str;
    return str.substring(0, max - 3) + '...';
};

export const generateTrapCardCandidates = (units: InputUnit[]): TrapCardCandidate[] => {
    const candidates: TrapCardCandidate[] = [];

    units.forEach(unit => {
        if (!unit.source_trace || unit.source_trace.length === 0) return;

        let unitTrapCount = 0;
        
        // Batch 判定
        const isBatch1 = unit.unit_id.includes('mistake_vs_fraud') || 
                         unit.unit_id.includes('rescission_vs_cancellation') ||
                         unit.unit_id.includes('agency_vs_unauthorized') ||
                         unit.unit_id.includes('apparent_agency_types') ||
                         unit.unit_id.includes('regulatory_farmland_345');

        const isBatch2 = unit.unit_id.includes('mortgage_vs_revolving') ||
                         unit.unit_id.includes('guarantee_vs_joint') ||
                         unit.unit_id.includes('joint_debt_vs_guarantee') ||
                         unit.unit_id.includes('contract_non_conformity') ||
                         unit.unit_id.includes('brokerage_3types');

        const isBatch3 = unit.unit_id.includes('lease_land_hikaku') ||
                         unit.unit_id.includes('lease_building_v2') ||
                         unit.unit_id.includes('regulatory_usage_zones') ||
                         unit.unit_id.includes('regulatory_road_42_43') ||
                         unit.unit_id.includes('regulatory_height_limits');

        const isBatch4 = unit.unit_id.includes('regulatory_dev_permission_detail') ||
                         unit.unit_id.includes('regulatory_land_readjustment') ||
                         unit.unit_id.includes('brokerage_fees_master') ||
                         unit.unit_id.includes('jusetsu_37_detail') ||
                         unit.unit_id.includes('jusetsu_35_detail');

        const isBatch5 = unit.unit_id.includes('rights_inheritance_master') ||
                         unit.unit_id.includes('rights_asset_division_confrontation') ||
                         unit.unit_id.includes('tax_capital_gains_master') ||
                         unit.unit_id.includes('tax_gift_housing_funds') ||
                         unit.unit_id.includes('regulatory_embankment_act');

        const isBatch6 = unit.unit_id.includes('brokerage_security_deposits_vs_assoc') ||
                         unit.unit_id.includes('brokerage_cooling_off_master') ||
                         unit.unit_id.includes('brokerage_deposit_protection_master');
        
        let origin = 'high_quality_input_unit';
        if (isBatch1) origin = 'high_quality_input_unit_batch1';
        else if (isBatch2) origin = 'high_quality_input_unit_batch2';
        else if (isBatch3) origin = 'high_quality_input_unit_batch3';
        else if (isBatch4) origin = 'high_quality_input_unit_batch4';
        else if (isBatch5) origin = 'high_quality_input_unit_batch5';
        else if (isBatch6) origin = 'high_quality_input_unit_final_batch';

        // 1. trap_details
        if (unit.trap_details && unit.trap_details.length > 0) {
            unit.trap_details.slice(0, 3).forEach((detail, index) => {
                candidates.push({
                    id: `MC-TRAP-${unit.unit_id}-D${index}`,
                    unit_id: unit.unit_id,
                    card_type: 'trap',
                    question: truncate(`「${detail.trap}」とする記述は正しいか？`, 60),
                    answer: truncate(`誤り。${detail.correct_rule}`, 80),
                    explanation: truncate(detail.why_wrong, 150),
                    source_trace: unit.source_trace,
                    confidence: 'high',
                    origin: origin
                });
                unitTrapCount++;
            });
        }

        // 2. trap_points
        if (unitTrapCount < 3 && unit.trap_points && unit.trap_points.length > 0) {
            unit.trap_points.forEach((point, index) => {
                if (unitTrapCount >= 3) return;
                const id = `MC-TRAP-${unit.unit_id}-P${index}`;
                if (candidates.some(c => c.id === id)) return;

                candidates.push({
                    id: id,
                    unit_id: unit.unit_id,
                    card_type: 'trap',
                    question: truncate(`ひっかけ注意：${point} か？`, 60),
                    answer: truncate(`誤り。${unit.conclusion}`, 80),
                    explanation: truncate(unit.repair_explanation.short_note, 150),
                    source_trace: unit.source_trace,
                    confidence: 'high',
                    origin: origin
                });
                unitTrapCount++;
            });
        }
    });

    return candidates;
};

export interface TrapPromotionDryRun {
    target_candidate_count: number;
    promotable_candidates_count: number;
    rejected_count: number;
    duplicate_card_id_count: number;
    existing_collision_count: number;
    source_trace_missing_count: number;
    long_content_count: {
        question: number;
        answer: number;
        explanation: number;
    };
    results: Array<TrapCardCandidate & { promoted: boolean; audit_note: string }>;
}

export const runTrapPromotionDryRun = (units: InputUnit[]): TrapPromotionDryRun => {
    const candidates = generateTrapCardCandidates(units);
    const dryRun: TrapPromotionDryRun = {
        target_candidate_count: candidates.length,
        promotable_candidates_count: 0,
        rejected_count: 0,
        duplicate_card_id_count: 0,
        existing_collision_count: 0,
        source_trace_missing_count: 0,
        long_content_count: { question: 0, answer: 0, explanation: 0 },
        results: []
    };

    const seenIds = new Set<string>();

    candidates.forEach(c => {
        let promoted = true;
        let audit_note = 'PASS';
        if (seenIds.has(c.id)) { promoted = false; audit_note = 'FAIL: Duplicate ID'; dryRun.duplicate_card_id_count++; }
        seenIds.add(c.id);
        if (!c.source_trace || c.source_trace.length === 0) { promoted = false; audit_note = 'FAIL: No Source'; dryRun.source_trace_missing_count++; }
        if (c.question.length > 60) dryRun.long_content_count.question++;
        if (c.answer.length > 80) dryRun.long_content_count.answer++;
        if (c.explanation.length > 150) dryRun.long_content_count.explanation++;
        if (c.confidence !== 'high') { promoted = false; audit_note = 'FAIL: Low Conf'; }
        if (promoted) dryRun.promotable_candidates_count++; else dryRun.rejected_count++;
        dryRun.results.push({ ...c, promoted, audit_note });
    });
    return dryRun;
};

export const getPromotableMemoryCards = (units: InputUnit[]): MemoryCard[] => {
    const candidates = generateTrapCardCandidates(units);
    const memoryCards: MemoryCard[] = [];

    candidates.forEach(c => {
        const sourceUnit = units.find(u => u.unit_id === c.unit_id);
        if (!sourceUnit || c.confidence !== 'high') return;

        memoryCards.push({
            memory_card_id: c.id,
            unit_id: c.unit_id,
            exam_type: sourceUnit.category === '賃貸管理士' ? 'chintai' : 'takken',
            category: sourceUnit.category,
            tags: sourceUnit.linked_tags,
            card_type: 'trap',
            question: c.question,
            answer: c.answer,
            source_text: sourceUnit.conclusion,
            confidence: 'high',
            origin: c.origin
        });
    });
    return memoryCards;
};

export async function promoteTrapCards(): Promise<{ success: boolean; added: number; errors: string[] }> {
    try {
        const cards = getPromotableMemoryCards(TAKKEN_PROTOTYPE_UNITS);
        let added = 0;
        await db.transaction('rw', db.memory_cards, async () => {
            for (const card of cards) {
                const existing = await db.memory_cards.get(card.memory_card_id);
                if (existing) continue;
                await db.memory_cards.put(card);
                added++;
            }
        });
        return { success: true, added, errors: [] };
    } catch (error) {
        return { success: false, added: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
}
