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
        category: card.category || '未分類',
        conclusion: card.is_statement_true === true ? '原則として正しい（有効）です。' : (card.is_statement_true === false ? '原則として誤り（無効・制限あり）です。' : '論点の核心を確認してください。'),
        principle: card.explanation || card.core_knowledge?.essence || '解説を読み込んで論点を整理しましょう。',
        requirements: [],
        exceptions: [],
        cases: {},
        trap_points: card.trap_point ? [card.trap_point] : [],
        repair_explanation: {
            short_note: card.core_knowledge?.rule || '基本ルールを再確認してください。',
            common_mistake: card.trap_point || '試験でのひっかけや例外パターンに注意が必要です。'
        },
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
