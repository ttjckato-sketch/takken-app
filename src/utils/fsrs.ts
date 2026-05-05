/**
 * FSRS (Free Spaced Repetition Scheduler) 実装
 * SM-2よりも高精度な間隔反復スケジューリング
 */

export interface FSRSCard {
  difficulty: number; // 1-10
  stability: number; // 日数
  retrievability: number; // 0-1
  last_review: number;
  next_review: number;
  reps: number;
  lapses: number;
}

export type FSRSRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

/**
 * FSRSパラメータ
 */
const FSRS_PARAMS = {
  request_retention: 0.9, // 目標保持率
  maximum_interval: 36500, // 最大間隔（100年）
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
};

/**
 * 次の復習日時を計算
 */
export function calculateNextReview(card: FSRSCard, rating: FSRSRating): FSRSCard {
  const now = Date.now();
  const daysSinceLastReview = Math.max(1, (now - card.last_review) / (1000 * 60 * 60 * 24));

  // 保持率を計算
  const retrievability = calculateRetrievability(card.stability, daysSinceLastReview);

  // 評価値を数値に変換
  const ratingValue = rating;

  // 新しい難易度を計算
  let newDifficulty = card.difficulty + (0.1 - (ratingValue - 3) * (0.08 + (ratingValue - 3) * 0.02));
  newDifficulty = Math.max(1, Math.min(10, newDifficulty));

  // 新しい安定度を計算
  let newStability = card.stability;
  if (ratingValue === 1) { // Again
    newStability = card.stability * 0.4;
  } else if (ratingValue === 2) { // Hard
    newStability = card.stability * 1.2;
  } else if (ratingValue === 3) { // Good
    newStability = card.stability * (2.5 + retrievability * 0.1);
  } else { // Easy
    newStability = card.stability * (3.5 + retrievability * 0.15);
  }

  // 次の復習日を計算
  let nextInterval = newStability;
  if (ratingValue === 1) {
    nextInterval = Math.max(1, newStability * 0.5);
  } else if (ratingValue === 4) {
    nextInterval = newStability * 1.3;
  }

  nextInterval = Math.min(
    Math.max(1, nextInterval),
    FSRS_PARAMS.maximum_interval
  );

  const nextReview = now + nextInterval * 24 * 60 * 60 * 1000;

  return {
    difficulty: newDifficulty,
    stability: nextInterval,
    retrievability: calculateRetrievability(nextInterval, nextInterval),
    last_review: now,
    next_review: nextReview,
    reps: ratingValue >= 3 ? card.reps + 1 : 0,
    lapses: ratingValue === 1 ? card.lapses + 1 : card.lapses,
  };
}

/**
 * 保持率を計算
 */
function calculateRetrievability(stability: number, elapsedDays: number): number {
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * 初期カードを作成
 */
export function createInitialCard(): FSRSCard {
  const now = Date.now();
  return {
    difficulty: 5,
    stability: 1,
    retrievability: 1,
    last_review: now,
    next_review: now + 24 * 60 * 60 * 1000, // 1日後
    reps: 0,
    lapses: 0,
  };
}

/**
 * 復習が必要なカードを判定
 */
export function isCardDue(card: FSRSCard): boolean {
  return card.next_review <= Date.now();
}
