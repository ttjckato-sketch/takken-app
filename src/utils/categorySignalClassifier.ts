/**
 * カテゴリ不整合（Category Suspect）を検知するエンジン (v2.1.0)
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    '宅建業法': ['免許', '媒介', '報酬', '35条', '37条', '保証金', '案内所', '広告', '自ら売主'],
    '権利関係': ['抵当権', '借地', '借家', '相続', '共有', '制限行為能力', '意思表示', '代理', '時効', '区分所有'],
    '法令上の制限': ['都市計画', '建築基準', '国土利用計画', '農地法', '土地区画整理', '宅地造成'],
    '税・その他': ['登録免許税', '印紙税', '不動産取得税', '固定資産税', '所得税', '鑑定評価', '地価公示']
};

/**
 * カードのカテゴリと内容が一致しているか確認する
 */
export function detectCategorySuspect(category: string, text: string): { is_suspect: boolean; detected_keywords: string[] } {
    if (!category || !text) return { is_suspect: false, detected_keywords: [] };

    // 他の主要カテゴリのキーワードが含まれていないかチェック
    let isSuspect = false;
    const detectedKeywords: string[] = [];

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        // 現在のカテゴリ自体はスキップ
        if (category.includes(cat)) continue;

        const found = keywords.filter(k => text.includes(k));
        if (found.length >= 2) {
            // 他のカテゴリのキーワードが2つ以上見つかったら疑わしい
            isSuspect = true;
            detectedKeywords.push(...found);
        }
    }

    return {
        is_suspect: isSuspect,
        detected_keywords: detectedKeywords
    };
}
