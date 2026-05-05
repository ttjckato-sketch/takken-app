import { db, type RestorationCandidate } from '../db';
import { classifyTakkenCard } from './takkenSourceTransformer';

/**
 * P26: 教材復元候補の抽出ユーティリティ (v2.9.1)
 * 破損カード(2621件)の中から復元可能性の高い50件をPoC候補として登録
 */

export async function extractRestorationCandidatesPoC(limit: number = 50) {
    console.log(`🚀 [v2.9.1] Starting extractRestorationCandidatesPoC...`);

    const takkenCards = await db.understanding_cards.where('exam_type').equals('takken').toArray();
    const sourcedQuestions = await db.source_questions.where('exam_type').equals('takken').toArray();
    const sourcedCardIds = new Set(sourcedQuestions.map(q => q.source_card_id));

    // 破損カード（source化されていないもの）を収集
    const brokenCards = takkenCards.filter(c => !sourcedCardIds.has(c.card_id));
    
    const candidates: RestorationCandidate[] = [];
    const now = Date.now();

    // 分類統計用
    const breakdown = {
        recovery_pending: 0,
        short_text: 0,
        count_combination: 0,
        other: 0
    };

    // カテゴリ別カウンタ
    const catCounts: Record<string, number> = {
        '宅建業法': 0,
        '権利関係': 0,
        '法令上の制限': 0,
        '税・その他': 0,
        '賃貸管理士': 0
    };

    // ポリシー: 年度・問番号・肢番号が追えるものを優先
    for (const card of brokenCards) {
        const classification = classifyTakkenCard(card);
        
        // 分類統計
        if (classification.category === 'source_recovery_pending') breakdown.recovery_pending++;
        else if (classification.category === 'active_recall_excluded_count_combination') breakdown.count_combination++;
        else breakdown.other++;

        if (candidates.length >= limit) continue; // 統計は最後まで取るが、登録は制限まで

        const pattern = card.question_patterns?.correct_patterns?.[0];

        // 抽出基準: 
        // 1. 個数・組合せ問題は除外
        if (classification.category === 'active_recall_excluded_count_combination') continue;
        
        // 2. 年度・肢情報があるか確認
        if (!pattern || !pattern.year || !pattern.question_no) continue;

        // 3. カテゴリ配分チェック
        const cat = card.category;
        const normalizedCat = (cat === '税金・その他' || cat.includes('税')) ? '税・その他' : cat;

        if (normalizedCat === '宅建業法' && catCounts['宅建業法'] >= 20) continue;
        if (normalizedCat === '権利関係' && catCounts['権利関係'] >= 10) continue;
        if (normalizedCat === '法令上の制限' && catCounts['法令上の制限'] >= 10) continue;
        if (normalizedCat === '税・その他' && catCounts['税・その他'] >= 5) continue;
        if (normalizedCat === '賃貸管理士' && catCounts['賃貸管理士'] >= 5) continue;

        let reason: RestorationCandidate['restore_reason'] = 'placeholder_text_shortage';
        if (classification.category === 'source_recovery_pending') reason = 'null_statement';

        const candidate: RestorationCandidate = {
            restoration_id: `RES-POC-${card.card_id}`,
            source_choice_id: `SC-${card.card_id}`, // 仮想ID
            source_question_id: `SQ-${card.card_id}`, // 仮想ID
            exam_type: 'takken',
            category: card.category,
            year: pattern.year,
            question_no: pattern.question_no,
            option_no: pattern.correct_option || 1,
            original_text: pattern.question_text || '',
            original_explanation: pattern.explanation?.full || '',
            original_is_statement_true: pattern.is_correct ?? null,
            restore_reason: reason,
            confidence: 'medium',
            source_refs: [{ 
                source_type: 'internal_db', 
                title: 'Understanding Card', 
                ref: card.card_id,
                checked_at: now 
            }],
            review_status: 'candidate',
            created_at: now,
            updated_at: now
        };

        candidates.push(candidate);
        if (catCounts[normalizedCat] !== undefined) catCounts[normalizedCat]++;
    }

    if (candidates.length > 0) {
        await db.restoration_candidates.bulkPut(candidates);
    }

    return {
        total: candidates.length,
        broken_total: brokenCards.length,
        breakdown,
        categories: catCounts
    };
}

export async function clearRestorationCandidates() {
    await db.restoration_candidates.clear();
}
