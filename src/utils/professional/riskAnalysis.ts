import { db } from '../../db';

export interface RiskScore {
    tag: string;
    score: number; // 0 (Safe) to 1 (Critical)
    error_count: number;
}

export async function calculateProHeatmap(): Promise<RiskScore[]> {
    const studyEvents = await db.study_events.toArray();
    const tagMap: Map<string, { total: number; errors: number }> = new Map();

    studyEvents.forEach(e => {
        const tags = e.category ? [e.category] : []; // Simplifying for now
        tags.forEach(tag => {
            const stats = tagMap.get(tag) || { total: 0, errors: 0 };
            stats.total++;
            if (!e.answered_correct) stats.errors++;
            tagMap.set(tag, stats);
        });
    });

    return Array.from(tagMap.entries()).map(([tag, stats]) => ({
        tag,
        error_count: stats.errors,
        score: stats.total > 0 ? stats.errors / stats.total : 0
    }));
}
