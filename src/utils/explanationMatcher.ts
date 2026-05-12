import { db, type ChoiceExplanation, type QuestionExplanation } from '../db';
import { type InputUnit } from '../types/inputUnit';
import { findRepairInputUnit, type RepairMatchResult } from './inputUnitRepairMatcher';

export type ExplanationMatchSource =
  | 'choice_explanations'
  | 'question_explanations'
  | 'high_quality_input_units'
  | 'prototype'
  | 'none';

export type ExplanationMatchConfidence = 'exact' | 'question' | 'category' | 'fallback' | 'none';

export type ExplanationMatchKey =
  | 'source_choice_id'
  | 'choice_id'
  | 'source_question_id'
  | 'question_id'
  | 'card_id'
  | 'category'
  | 'none';

export interface ResolveExplanationPackParams {
  sourceChoiceId?: string | null;
  choiceId?: string | null;
  sourceQuestionId?: string | null;
  questionId?: string | null;
  cardId?: string | null;
  category?: string | null;
  tags?: string[];
  examType?: 'takken' | 'chintai' | 'cross' | 'unknown';
}

export interface ExplanationMatchResult {
  source: ExplanationMatchSource;
  confidence: ExplanationMatchConfidence;
  reason: string;
  matchedBy: ExplanationMatchKey;
  choiceExplanation: ChoiceExplanation | null;
  questionExplanation: QuestionExplanation | null;
  repairUnit: InputUnit | null;
  repairMatch: RepairMatchResult | null;
}

type RankedRecord<T> = {
  record: T;
  matchedBy: ExplanationMatchKey;
  score: number;
};

const MATCH_SCORES: Record<ExplanationMatchKey, number> = {
  source_choice_id: 600,
  choice_id: 550,
  source_question_id: 500,
  question_id: 450,
  card_id: 400,
  category: 200,
  none: 0
};

function hasTable(tableName: string): boolean {
  return db.tables.some((table) => table.name === tableName);
}

function normalizeText(value?: string | null): string {
  return (value || '').trim();
}

function qualityBonus(item: any): number {
  let bonus = 0;
  if (item.review_status === 'auto_ok') bonus += 80;
  else if (item.review_status === 'draft') bonus += 20;

  if (item.source_trace_grade === 'A') bonus += 20;
  if (item.human_review_required === false) bonus += 10;
  if (item.label_conflict_suspected === false) bonus += 10;
  if (item.disabled === false) bonus += 5;
  return bonus;
}

function rankChoiceExplanation(item: ChoiceExplanation, matchedBy: ExplanationMatchKey): number {
  return MATCH_SCORES[matchedBy] + qualityBonus(item);
}

function rankQuestionExplanation(item: QuestionExplanation, matchedBy: ExplanationMatchKey): number {
  return MATCH_SCORES[matchedBy] + qualityBonus(item);
}

function dedupeById<T extends { id: string }>(records: Array<RankedRecord<T>>): Array<RankedRecord<T>> {
  const bestById = new Map<string, RankedRecord<T>>();

  for (const entry of records) {
    const existing = bestById.get(entry.record.id);
    if (!existing || entry.score > existing.score) {
      bestById.set(entry.record.id, entry);
    }
  }

  return [...bestById.values()];
}

async function loadChoiceExplanationCandidates(params: ResolveExplanationPackParams): Promise<Array<RankedRecord<ChoiceExplanation>>> {
  if (!hasTable('choice_explanations')) return [];

  const sources: Array<[ExplanationMatchKey, Promise<ChoiceExplanation[]>]> = [];
  const sourceChoiceId = normalizeText(params.sourceChoiceId);
  const choiceId = normalizeText(params.choiceId);

  if (choiceId) {
    sources.push(['choice_id', db.choice_explanations.where('choice_id').equals(choiceId).toArray()]);
  }

  const batches = await Promise.all(sources.map(([, promise]) => promise));
  const ranked: Array<RankedRecord<ChoiceExplanation>> = [];

  batches.forEach((records, index) => {
    const matchedBy = sources[index][0];
    records.forEach((record) => {
      ranked.push({
        record,
        matchedBy,
        score: rankChoiceExplanation(record, matchedBy)
      });
    });
  });

  return dedupeById(ranked).sort((a, b) => b.score - a.score);
}

async function loadQuestionExplanationCandidates(params: ResolveExplanationPackParams): Promise<Array<RankedRecord<QuestionExplanation>>> {
  if (!hasTable('question_explanations')) return [];

  const sources: Array<[ExplanationMatchKey, Promise<QuestionExplanation[]>]> = [];
  const sourceQuestionId = normalizeText(params.sourceQuestionId);
  const questionId = normalizeText(params.questionId);
  const cardId = normalizeText(params.cardId);
  const category = normalizeText(params.category);

  if (questionId) {
    sources.push(['question_id', db.question_explanations.where('question_id').equals(questionId).toArray()]);
  }
  if (category) {
    sources.push(['category', db.question_explanations.where('category').equals(category).toArray()]);
  }

  const batches = await Promise.all(sources.map(([, promise]) => promise));
  const ranked: Array<RankedRecord<QuestionExplanation>> = [];

  batches.forEach((records, index) => {
    const matchedBy = sources[index][0];
    records.forEach((record) => {
      ranked.push({
        record,
        matchedBy,
        score: rankQuestionExplanation(record, matchedBy)
      });
    });
  });

  return dedupeById(ranked).sort((a, b) => b.score - a.score);
}

function buildChoiceResult(record: ChoiceExplanation, matchedBy: ExplanationMatchKey): ExplanationMatchResult {
  const source: ExplanationMatchSource = 'choice_explanations';
  return {
    source,
    confidence: matchedBy === 'category' ? 'category' : 'exact',
    reason: `choice_explanations matched by ${matchedBy}: ${record.id}`,
    matchedBy,
    choiceExplanation: record,
    questionExplanation: null,
    repairUnit: null,
    repairMatch: null
  };
}

function buildQuestionResult(record: QuestionExplanation, matchedBy: ExplanationMatchKey): ExplanationMatchResult {
  const source: ExplanationMatchSource = 'question_explanations';
  return {
    source,
    confidence: matchedBy === 'category' ? 'category' : 'question',
    reason: `question_explanations matched by ${matchedBy}: ${record.id}`,
    matchedBy,
    choiceExplanation: null,
    questionExplanation: record,
    repairUnit: null,
    repairMatch: null
  };
}

function buildFallbackResult(
  match: RepairMatchResult | null
): ExplanationMatchResult {
  if (!match || !match.unit) {
    return {
      source: 'none',
      confidence: 'none',
      reason: 'No explanation or repair unit match found',
      matchedBy: 'none',
      choiceExplanation: null,
      questionExplanation: null,
      repairUnit: null,
      repairMatch: match
    };
  }

  return {
    source: match.dataSource === 'db' ? 'high_quality_input_units' : 'prototype',
    confidence: 'fallback',
    reason: `Fallback repair unit resolved from ${match.dataSource}:${match.reason}`,
    matchedBy:
      match.reason === 'card_id'
        ? 'card_id'
        : match.reason === 'none'
          ? 'none'
          : 'category',
    choiceExplanation: null,
    questionExplanation: null,
    repairUnit: match.unit,
    repairMatch: match
  };
}

/**
 * v30 question_explanations / choice_explanations を読み取り専用で解決する。
 *
 * 優先順位:
 * 1. choice_explanations
 * 2. question_explanations
 * 3. high_quality_input_units
 * 4. TAKKEN_PROTOTYPE_UNITS
 * 5. final fallback
 */
export async function resolveExplanationPack(params: ResolveExplanationPackParams): Promise<ExplanationMatchResult> {
  const choiceCandidates = await loadChoiceExplanationCandidates(params);
  if (choiceCandidates.length > 0) {
    const best = choiceCandidates[0];
    return buildChoiceResult(best.record, best.matchedBy);
  }

  const questionCandidates = await loadQuestionExplanationCandidates(params);
  if (questionCandidates.length > 0) {
    const best = questionCandidates[0];
    return buildQuestionResult(best.record, best.matchedBy);
  }

  const repairMatch = await findRepairInputUnit({
    cardId: normalizeText(params.cardId) || undefined,
    tags: params.tags || [],
    category: normalizeText(params.category) || undefined,
    examType: params.examType
  });

  return buildFallbackResult(repairMatch);
}

export type { ChoiceExplanation, QuestionExplanation };
