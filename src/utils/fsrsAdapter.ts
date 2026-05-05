/**
 * FSRS (Free Spaced Repetition Scheduler) 最小実装アダプター
 * 外部ライブラリ ts-fsrs に依存せず、FSRS v4.5 相当の基本計算を行う
 */

export interface FSRSState {
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  last_review: string;
  due: string;
}

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

// FSRS v4.5 デフォルトパラメータ (簡易版)
const W = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.26, 2.05
];

export function createInitialFSRSState(): FSRSState {
  return {
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 'New',
    last_review: new Date().toISOString(),
    due: new Date().toISOString()
  };
}

/**
 * 既存の 2-ボタン UI 正誤を FSRS Rating にマッピング
 * explicitRating が提供された場合はそれを優先
 */
export function mapAnswerToRating(isCorrect: boolean, explicitRating?: Rating): Rating {
  if (explicitRating && [1, 2, 3, 4].includes(explicitRating)) {
    return explicitRating;
  }
  return isCorrect ? Rating.Good : Rating.Again;
}

/**
 * 次回の復習間隔を計算
 */
export function scheduleWithFSRS(state: FSRSState, rating: Rating): FSRSState {
  const newState = { ...state };
  const now = new Date();
  
  // 簡易安定性・難易度更新ロジック (SM-2 EF的な要素をFSRS風に変換)
  // 本来は W パラメータを用いた複雑な累乗計算だが、P4では近似値を使用
  
  if (newState.reps === 0) {
    // 初期学習
    newState.difficulty = Math.max(1, Math.min(10, 5 - (rating - 3) * 2));
    newState.stability = rating === Rating.Again ? 0.1 : (rating === Rating.Good ? 2 : 5);
    newState.state = rating === Rating.Again ? 'Learning' : 'Review';
  } else {
    // 復習
    if (rating === Rating.Again) {
      newState.stability = newState.stability * 0.5; // 急落
      newState.difficulty = Math.min(10, newState.difficulty + 1);
      newState.lapses++;
      newState.state = 'Relearning';
    } else {
      const bonus = rating === Rating.Good ? 1.0 : 1.5;
      newState.stability = newState.stability * (1 + (newState.difficulty / 5) * bonus);
      newState.difficulty = Math.max(1, newState.difficulty - 0.1);
      newState.state = 'Review';
    }
  }

  newState.reps++;
  newState.last_review = now.toISOString();
  
  // 間隔 = stability * ln(0.9) / ln(retention) -> デフォルト 90% retention
  newState.scheduled_days = Math.max(1, Math.round(newState.stability));
  
  const due = new Date();
  due.setDate(due.getDate() + newState.scheduled_days);
  newState.due = due.toISOString();

  return newState;
}

/**
 * FSRS 状態をレガシーな Simple SRS パラメータと同期
 */
export function syncFSRSToLegacySRS(fsrs: FSRSState): any {
  return {
    efactor: 1.3 + (fsrs.difficulty / 10) * 1.2, // 逆マッピング
    interval: fsrs.scheduled_days,
    repetitions: fsrs.reps,
    next_review_date: fsrs.due,
    last_reviewed: fsrs.last_review
  };
}
