export interface FSRSState { stability: number; difficulty: number; reps: number; lapses: number; state: string; last_review: string; due: string; }

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export function createInitialFSRSState(): FSRSState { return { stability: 0, difficulty: 0, reps: 0, lapses: 0, state: "New", last_review: new Date().toISOString(), due: new Date().toISOString() }; }

export function scheduleWithFSRS(state: FSRSState, rating: number): FSRSState {
    const newState = { ...state };
    if (newState.reps === 0) {
        newState.difficulty = Math.max(1, Math.min(10, 5 - (rating - 3) * 2));
        newState.stability = rating === 1 ? 0.1 : (rating === 3 ? 2 : 5);
        newState.state = rating === 1 ? "Learning" : "Review";
    } else {
        if (rating === 1) { newState.stability *= 0.5; newState.difficulty = Math.min(10, newState.difficulty + 1); newState.lapses++; }
        else { newState.stability *= (1 + (newState.difficulty / 5) * (rating === 3 ? 1.0 : 1.5)); newState.difficulty = Math.max(1, newState.difficulty - 0.1); }
    }
    newState.reps++;
    newState.last_review = new Date().toISOString();
    const due = new Date(); due.setDate(due.getDate() + Math.max(1, Math.round(newState.stability)));
    newState.due = due.toISOString();
    return newState;
}

export function mapAnswerToRating(answeredCorrect: boolean, responseTimeMs: number): Rating {
  if (!answeredCorrect) return Rating.Again;
  if (responseTimeMs > 10000) return Rating.Hard;
  if (responseTimeMs < 3000) return Rating.Easy;
  return Rating.Good;
}

export function syncFSRSToLegacySRS(fsrs: FSRSState): any {
  return {
    efactor: fsrs.difficulty,
    interval: Math.round(fsrs.stability),
    repetitions: fsrs.reps,
    next_review_date: fsrs.due,
    last_reviewed: fsrs.last_review,
    total_reviews: fsrs.reps,
    successful_reviews: fsrs.reps - fsrs.lapses,
    quality_history: []
  };
}
