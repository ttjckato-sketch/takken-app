import { InputUnit, SourceTrace, OutputMode } from '../types/inputUnit';
import { db } from '../db';

/**
 * P39: Input Unit Builder (Skeleton & Mapping)
 */

export function buildInputUnitSkeleton(card: any): Partial<InputUnit> {
    const sourceTrace: SourceTrace[] = [];
    if (card.source_choice_id || card.source_card_id) {
        sourceTrace.push({
            type: 'past_question',
            id: card.source_choice_id || card.source_card_id || 'unknown'
        });
    }

    const linkedModes: OutputMode[] = ['active_recall'];
    if (card.tags?.some((t: string) => /数字|期間/.test(t))) linkedModes.push('number_recall');
    if (card.tags?.some((t: string) => /注意|ひっかけ/.test(t))) linkedModes.push('trap_recall');

    return {
        unit_id: `unit_${card.card_id || Math.random().toString(36).substr(2, 9)}`,
        title: card.category || 'Untitled Point',
        linked_tags: card.tags || [],
        linked_output_modes: linkedModes,
        source_trace: sourceTrace,
        quality_flags: {
            is_placeholder: true,
            low_confidence: true,
            needs_human_review: true,
            contradiction_suspected: false
        },
        created_at: Date.now(),
        updated_at: Date.now()
    };
}

/**
 * 既存カードに Input Unit を動的プロパティとして付与する (v24維持)
 */
export async function attachInputUnitToCard(cardId: string, type: 'understanding' | 'knowledge', unit: InputUnit): Promise<void> {
    if (type === 'understanding') {
        const card = await db.understanding_cards.get(cardId);
        if (card) {
            (card as any).input_unit = unit;
            await db.understanding_cards.put(card);
        }
    } else {
        const card = await db.knowledge_cards.get(cardId);
        if (card) {
            (card as any).input_unit = unit;
            await db.knowledge_cards.put(card);
        }
    }
}
