/**
 * 解説文から正誤シグナルを抽出するエンジン (v2.1.0)
 */

export type RecoveryConfidence = 'high' | 'medium' | 'low' | 'manual_review_required';
export type SignalPolarity = 'positive' | 'negative' | 'mixed' | 'dangerous' | 'insufficient';

export interface SignalClassification {
    polarity: SignalPolarity;
    confidence: RecoveryConfidence;
    is_true: boolean | null;
    reason: string;
}

const POSITIVE_SIGNALS = [
    '正しい', '適切である', '妥当である', '認められる', '有効である', 'できる'
];

const NEGATIVE_SIGNALS = [
    '誤り', '誤っている', '適切でない', '妥当でない', '認められない', '無効である', 'できない'
];

const DANGER_PATTERNS = [
    'とは限らない', '常に', '必ず', 'すべて', 'いくつ', '個数', '組合せ', '組み合わせ',
    '正しいものはいくつ', '誤っているものはいくつ', '複数選択', '二つ選べ', 'すべて選べ'
];

/**
 * 解説文を解析して正誤判定を行う
 */
export function classifyExplanationSignal(text: string): SignalClassification {
    if (!text || text.length < 5) {
        return {
            polarity: 'insufficient',
            confidence: 'low',
            is_true: null,
            reason: '解説文が短すぎるか空です'
        };
    }

    // 1. 危険パターンの検出
    for (const pattern of DANGER_PATTERNS) {
        if (text.includes(pattern)) {
            return {
                polarity: 'dangerous',
                confidence: 'manual_review_required',
                is_true: null,
                reason: `危険パターン検出: "${pattern}"`
            };
        }
    }

    // 2. シグナルのカウント
    const positiveCount = POSITIVE_SIGNALS.filter(sig => text.includes(patternToStrict(sig))).length;
    const negativeCount = NEGATIVE_SIGNALS.filter(sig => text.includes(patternToStrict(sig))).length;

    // 3. 判定ロジック
    if (positiveCount > 0 && negativeCount > 0) {
        return {
            polarity: 'mixed',
            confidence: 'manual_review_required',
            is_true: null,
            reason: '肯定・否定シグナルが混在しています'
        };
    }

    if (positiveCount > 0) {
        return {
            polarity: 'positive',
            confidence: 'high',
            is_true: true,
            reason: '明確な肯定シグナルを検出しました'
        };
    }

    if (negativeCount > 0) {
        return {
            polarity: 'negative',
            confidence: 'high',
            is_true: false,
            reason: '明確な否定シグナルを検出しました'
        };
    }

    return {
        polarity: 'insufficient',
        confidence: 'manual_review_required',
        is_true: null,
        reason: '明確なシグナルが見つかりませんでした'
    };
}

/**
 * キーワードマッチングの厳格化（文末や句読点考慮）
 */
function patternToStrict(keyword: string): string {
    // 今回は単純な包含チェックを優先するが、将来的に正規表現等で厳格化可能
    return keyword;
}
