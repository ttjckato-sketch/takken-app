/**
 * Learning Quality Audit Logic
 * Analyzes card coverage, quality scores, and identifies weak points.
 */

import { UnderstandingCard } from '../db';
import { LEARNING_SCOPE_MAP, ScopeTopic } from './learningCoverageMap';

export interface AuditResult {
  card_id: string;
  quality_score: number;
  matched_topic_id?: string;
  is_input: boolean;
  is_output: boolean;
  weak_reasons: string[];
  recommended_fix: string;
}

export interface CoverageStats {
  topic_id: string;
  input_count: number;
  output_count: number;
  average_score: number;
  is_covered: boolean;
}

export interface GlobalAuditReport {
  generated_at: number;
  takken: {
    coverage_rate: number;
    high_priority_coverage: number;
    average_score: number;
    weak_card_count: number;
  };
  chintai: {
    coverage_rate: number;
    high_priority_coverage: number;
    average_score: number;
    weak_card_count: number;
  };
  critical_gaps: string[];
}

/**
 * Calculate quality score for a single card
 */
export function auditSingleCard(card: UnderstandingCard): AuditResult {
  let score = 0;
  const weak_reasons: string[] = [];

  // Positive Scoring (Max 100)
  
  // 1. Data Presence (30 pts)
  if (card.sample_question || card.core_knowledge?.rule) score += 15;
  else weak_reasons.push('statement_missing');

  if (card.is_statement_true !== null && card.is_statement_true !== undefined) score += 15;
  else if (card.exam_type === 'chintai') score += 15; // Chintai MCQ doesn't always have a single statement boolean
  else weak_reasons.push('answer_not_defined');

  // 2. Explanation Depth (20 pts)
  const effectiveExplanation = card.explanation || card.core_knowledge?.essence || '';
  const expLen = effectiveExplanation.length;
  
  if (expLen >= 80) score += 20;
  else if (expLen >= 40) score += 10;
  else if (expLen > 0) {
    score += 5;
    weak_reasons.push('explanation_too_short');
  } else {
    weak_reasons.push('explanation_missing');
  }

  // 3. Educational Metadata (30 pts)
  // Even if explicit fields are missing, we give partial credit for existence of core rule/essence
  if (card.prerequisite) score += 10;
  else if (effectiveExplanation.includes('【前提】')) score += 10;
  else {
      score += 5; // Fallback build provides base context
      weak_reasons.push('explicit_prerequisite_missing');
  }

  if (card.why_it_matters) score += 10;
  else if (effectiveExplanation.includes('【本質】')) score += 10;
  else {
      score += 5; // Fallback build provides base reasoning
      weak_reasons.push('explicit_why_it_matters_missing');
  }

  if (card.trap_point || card.core_knowledge?.examiners_intent) score += 10;
  else weak_reasons.push('trap_point_missing');

  // 4. Traceability (10 pts)
  if ((card.source_trace && card.source_trace.length > 0) || (card.tags && card.tags.some(t => /^\d+/.test(t)))) score += 10;
  else weak_reasons.push('no_source_trace');

  // 5. Categorization (10 pts)
  const matchedTopic = LEARNING_SCOPE_MAP.find(t => {
    if (card.exam_type && card.exam_type !== t.exam) return false;
    return card.category?.includes(t.sub_topic) || 
           t.keywords.some(k => card.category?.includes(k) || (card.tags && card.tags.includes(k)));
  });

  if (matchedTopic) score += 10;
  else weak_reasons.push('category_not_matched_to_scope');

  // Quality Level Mapping
  // L0: Broken
  // L1: Weak (Low content)
  // L2: Standard (Usable)
  // L3: Good (Has some metadata)
  // L4: Excellent (Full metadata)
  
  let recommended_fix = 'none';
  if (score < 40) recommended_fix = 'total_reconstruction';
  else if (score < 60) recommended_fix = 'expand_explanation';
  else if (score < 80) recommended_fix = 'add_metadata';

  return {
    card_id: card.card_id,
    quality_score: Math.max(0, Math.min(100, score)),
    matched_topic_id: matchedTopic?.id,
    is_input: expLen > 40,
    is_output: (card.is_statement_true !== null || card.exam_type === 'chintai') && !!(card.sample_question || card.core_knowledge?.rule),
    weak_reasons,
    recommended_fix
  };
}

/**
 * Generate full coverage report from cards
 */
export async function generateGlobalAuditReport(cards: UnderstandingCard[]): Promise<GlobalAuditReport> {
  const audits = cards.map(auditSingleCard);
  const statsMap = new Map<string, CoverageStats>();

  LEARNING_SCOPE_MAP.forEach(topic => {
    const matchedAudits = audits.filter(a => a.matched_topic_id === topic.id);
    statsMap.set(topic.id, {
      topic_id: topic.id,
      input_count: matchedAudits.filter(a => a.is_input).length,
      output_count: matchedAudits.filter(a => a.is_output).length,
      average_score: matchedAudits.length > 0 
        ? matchedAudits.reduce((sum, a) => sum + a.quality_score, 0) / matchedAudits.length 
        : 0,
      is_covered: matchedAudits.length > 0
    });
  });

  const getStatsForExam = (exam: 'takken' | 'chintai') => {
    const topics = LEARNING_SCOPE_MAP.filter(t => t.exam === exam);
    const covered = topics.filter(t => statsMap.get(t.id)?.is_covered).length;
    const highPriority = topics.filter(t => t.priority === 'high');
    const highCovered = highPriority.filter(t => statsMap.get(t.id)?.is_covered).length;
    
    const examAudits = audits.filter(a => topics.some(t => t.id === a.matched_topic_id));
    const avgScore = examAudits.length > 0
      ? examAudits.reduce((sum, a) => sum + a.quality_score, 0) / examAudits.length
      : 0;

    return {
      coverage_rate: covered / topics.length,
      high_priority_coverage: highCovered / highPriority.length,
      average_score: avgScore,
      weak_card_count: examAudits.filter(a => a.quality_score < 60).length
    };
  };

  const critical_gaps = LEARNING_SCOPE_MAP
    .filter(t => t.priority === 'high' && !statsMap.get(t.id)?.is_covered)
    .map(t => `${t.exam.toUpperCase()}: ${t.major_category} - ${t.sub_topic}`);

  return {
    generated_at: Date.now(),
    takken: getStatsForExam('takken'),
    chintai: getStatsForExam('chintai'),
    critical_gaps
  };
}
