import { db, type StudyEvent, type MemoryCard, type UnderstandingCard, type MemoryCardProgress, type MemoryStudyEvent } from '../db';
import { 
  Rating, 
  createInitialFSRSState, 
  scheduleWithFSRS, 
  syncFSRSToLegacySRS,
  mapAnswerToRating
} from './fsrsAdapter';

/**
 * 学習信号の抽出 (例外やひっかけのキーワード)
 */
export function extractLegalLearningSignals(text: string, explanation: string): any {
  const combined = (text + ' ' + explanation).replace(/[\n\t]/g, ' ');
  const numberPatterns = [
    /([\d０-９一二三四五六七八九十]+(年|ヶ月|か月|日|回|％|%|万|円|週間))/g,
    /(遅滞なく|直ちに|速やかに)/g
  ];
  const numbers_to_memorize = Array.from(combined.matchAll(new RegExp(numberPatterns.map(p => p.source).join('|'), 'g'))).map(m => m[0]);
  const legalTermPatterns = /(善意|悪意|過失|無過失|対抗|解除|不適合|代理|媒介|専任|専属|一般|登録|免許|供託|保証|譲渡|承継|制限)/g;
  const legal_terms = Array.from(combined.matchAll(legalTermPatterns)).map(m => m[0]);
  const modalPatterns = /(できる|できない|義務|任意|届出|許可|承諾|通知|要する|要しない|必要がある|必要がない)/g;
  const modal_words = Array.from(combined.matchAll(modalPatterns)).map(m => m[0]);
  const partyPatterns = /(業者|取引士|売主|買主|借主|貸主|委託者|受託者|本人|代理人|第三者|知事|大臣|機構)/g;
  const parties = Array.from(combined.matchAll(partyPatterns)).map(m => m[0]);

  return {
    numbers_to_memorize: Array.from(new Set(numbers_to_memorize)),
    legal_terms: Array.from(new Set(legal_terms)),
    modal_words: Array.from(new Set(modal_words)),
    parties: Array.from(new Set(parties)),
    confidence: (numbers_to_memorize.length > 0 || legal_terms.length > 0) ? 'high' : 'medium'
  };
}

/**
 * 学習結果の保存
 * P46: MemoryRecallは memory_study_events へ分離。
 */
export async function recordStudyEvent(event: Partial<StudyEvent>): Promise<void> {
    const isMemoryRecall = event.mode === 'memory_recall';
    
    if (isMemoryRecall) {
        const memoryEvent: MemoryStudyEvent = {
            event_id: `MREV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            card_id: event.card_id || '',
            mode: event.mode || 'memory_recall',
            answered_correct: event.answered_correct ?? false,
            response_time_ms: event.response_time_ms || 0,
            rating: event.rating || (event.answered_correct ? 3 : 1),
            created_at: Date.now()
        };
        await db.memory_study_events.put(memoryEvent);
    } else {
        const studyEvent: StudyEvent = {
            event_id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            card_id: event.card_id || '',
            exam_type: event.exam_type || 'takken',
            category: event.category || '',
            tags: event.tags || [],
            mode: (event.mode as any) || 'active_recall',
            answered_correct: event.answered_correct ?? false,
            selected_answer: event.selected_answer ?? null,
            correct_answer: event.correct_answer ?? null,
            response_time_ms: event.response_time_ms || 0,
            rating: (event as any).rating || (event.answered_correct ? 3 : 1),
            rating_source: (event as any).rating_source || 'binary_fallback',
            created_at: Date.now()
        };
        await db.study_events.put(studyEvent);
    }
}

/**
 * 学習ログのデータベース統計
 */
export async function logDatabaseStats(): Promise<void> {
    const counts = {
        cards: await db.understanding_cards.count(),
        events: await db.study_events.count(),
        memory_events: await db.memory_study_events.count(),
        questions: await db.source_questions.count(),
        choices: await db.source_choices.count()
    };
    console.log('📊 DB Stats:', counts);
}

/**
 * SRSパラメータの更新 (FSRS v4.5)
 * P46: MemoryCardの状態は memory_card_progress へ分離。
 */
export async function updateCardSRS(cardId: string, isCorrect: boolean, explicitRating?: number): Promise<void> {
    const rating = mapAnswerToRating(isCorrect, explicitRating as Rating);
    
    if (cardId.includes('MC-') || cardId.includes('ku_')) {
        let progress = await db.memory_card_progress.get(cardId);
        const currentState = progress?.fsrs_state || createInitialFSRSState();
        const newState = scheduleWithFSRS(currentState, rating);
        const legacy = syncFSRSToLegacySRS(newState);
        
        await db.memory_card_progress.put({
            card_id: cardId,
            fsrs_state: newState,
            srs_params: legacy,
            last_reviewed_at: Date.now()
        });
    } else {
        const card = await db.understanding_cards.get(cardId);
        if (card) {
            const currentState = card.fsrs_state || createInitialFSRSState();
            const newState = scheduleWithFSRS(currentState, rating);
            const legacy = syncFSRSToLegacySRS(newState) as any;
            await db.understanding_cards.update(cardId, {
                fsrs_state: newState,
                srs_params: legacy,
                last_reviewed: new Date().toISOString()
            });
        }
    }
}

/**
 * 動的配分の推奨値を計算 (P8/P10仕様)
 */
export async function calculateRecommendedModeDistribution(): Promise<any> {
    const now = Date.now();
    const config = await db.metadata.get('study_distribution_config');
    const cValue = config?.value || { auto_apply_enabled: false, consecutive_same_direction_count: 0 };

    // 直近7日の正答率
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentEvents = await db.study_events.where('created_at').above(sevenDaysAgo).toArray();
    const activeEvents = recentEvents.filter(e => e.mode === 'active_recall');
    const activeAccuracy = activeEvents.length > 0 
        ? activeEvents.filter(e => e.answered_correct).length / activeEvents.length 
        : null;

    // FSRS Due数 (分離テーブル対応)
    const dueMemory = await db.memory_card_progress.filter(p => {
        const due = p.fsrs_state?.due || p.srs_params?.next_review_date;
        return due && new Date(due).getTime() <= now;
    }).count();
    
    const dueActive = await db.understanding_cards.filter(c => {
        const due = c.fsrs_state?.due || c.srs_params?.next_review_date;
        return due && new Date(due).getTime() <= now;
    }).count();

    // 定着度低下比率 (Rating 1-2 の割合 - 統合集計が必要)
    const recentMemoryEvents = await db.memory_study_events.where('created_at').above(sevenDaysAgo).toArray();
    const totalEvents = recentEvents.length + recentMemoryEvents.length;
    const lowRatings = recentEvents.filter(e => (e.rating || 0) <= 2).length + 
                       recentMemoryEvents.filter(e => e.rating <= 2).length;
    const lowRatingRatio = totalEvents > 0 ? lowRatings / totalEvents : 0;

    let recommendedActive = 24;
    let recommendedMemory = 6;
    let reason = "デフォルト配分を維持します。";
    let direction = 'stable';

    if (activeAccuracy !== null && activeAccuracy < 0.6) {
        recommendedActive = 26;
        recommendedMemory = 4;
        reason = `Active正答率が低いため(${Math.round(activeAccuracy*100)}%)、演習を強化します。`;
        direction = 'active_up';
    } else if (dueMemory > 50 || lowRatingRatio > 0.3) {
        recommendedActive = 22;
        recommendedMemory = 8;
        reason = `忘却リスクが高いため(Memory Due: ${dueMemory})、暗記を強化します。`;
        direction = 'memory_up';
    }

    // 安定性カウント (2回連続ルール)
    const prevDirection = cValue.last_recommended_direction || 'stable';
    const consecutiveCount = (direction === prevDirection && direction !== 'stable') 
        ? (cValue.consecutive_same_direction_count || 0) + 1 
        : (direction === 'stable' ? 0 : 1);

    // 自動適用資格
    const eligible = consecutiveCount >= 2;
    const cooldown = cValue.auto_apply_cooldown_until || 0;
    const inCooldown = now < cooldown;

    return {
        recommended: { active_recall: recommendedActive, memory_recall: recommendedMemory },
        reason,
        direction,
        consecutive_count: consecutiveCount,
        metrics: {
            active_accuracy_7d: activeAccuracy,
            memory_due_count: dueMemory,
            active_due_count: dueActive,
            rating_1_2_ratio: lowRatingRatio
        },
        eligibility: {
            eligible: eligible && !inCooldown,
            reasons: [
                !eligible ? "推奨方向が2回連続していません" : null,
                inCooldown ? "クールダウン中です" : null
            ].filter(Boolean)
        }
    };
}

export async function persistRecommendedDistribution(rec: any): Promise<void> {
    const config = await db.metadata.get('study_distribution_config');
    const value = config?.value || {};
    await db.metadata.put({
        key: 'study_distribution_config',
        value: {
            ...value,
            last_recommended_active: rec.recommended.active_recall,
            last_recommended_memory: rec.recommended.memory_recall,
            last_recommended_direction: rec.direction,
            consecutive_same_direction_count: rec.consecutive_count,
            last_calculated_at: Date.now()
        }
    });
}

/**
 * ActiveRecall用のキュー生成
 */
export async function buildLearningQueue(options: any = {}): Promise<any[]> {
    const { limit = 50, examType = 'all' } = options;
    const now = Date.now();

    let cards = await db.understanding_cards
        .filter(c => c.is_statement_true === true || c.is_statement_true === false)
        .toArray();

    if (examType !== 'all') cards = cards.filter(c => c.exam_type === examType);

    const scored = cards.map(c => {
        let score = 50;
        const due = c.fsrs_state?.due || c.srs_params?.next_review_date;
        if (due && new Date(due).getTime() <= now) score += 100;
        if (!due) score += 20;
        return { ...c, priority_score: score };
    }).sort((a, b) => b.priority_score - a.priority_score);

    return scored.slice(0, limit);
}

/**
 * MemoryRecall用のキュー生成
 * P46: 教材本体 (memory_cards) と 学習状態 (memory_card_progress) を結合。
 */
export async function buildMemoryRecallQueue(options: { 
    examType?: 'takken' | 'chintai' | 'all';
    limit?: number;
} = {}): Promise<any[]> {
    const limit = options.limit || 10;
    const examType = options.examType || 'all';
    const now = Date.now();
    
    let cards = await db.memory_cards
        .filter(c => c.confidence !== 'low')
        .toArray();

    if (examType !== 'all') {
        cards = cards.filter(c => c.exam_type === examType);
    }

    const progressList = await db.memory_card_progress.toArray();
    const progressMap = new Map(progressList.map(p => [p.card_id, p]));

    // 優先度スコアリング (SRS Due優先)
    const scored = cards.map(c => {
        let score = 50;
        const p = progressMap.get(c.memory_card_id);
        const due = p?.fsrs_state?.due || p?.srs_params?.next_review_date;
        if (due && new Date(due).getTime() <= now) score += 100;
        if (!due) score += 20;
        return { ...c, priority_score: score, progress: p };
    }).sort((a, b) => b.priority_score - a.priority_score);

    return scored.slice(0, limit).map(c => ({
        ...c,
        id: c.memory_card_id,
        session_mode: 'memory_recall',
        // 学習UIに必要なフィールドを移植
        fsrs_state: c.progress?.fsrs_state,
        srs_params: c.progress?.srs_params
    }));
}

/**
 * NumberRecall用のキュー生成
 */
export async function buildNumberRecallQueue(options: any = {}): Promise<any[]> {
  const { examType = 'all', limit = 20 } = options;
  const kCards = await db.knowledge_cards.toArray();
  const numberCandidates = kCards.filter(c => {
      if (examType !== 'all' && !c.card_id.includes(examType)) return false;
      const rule = c.core_knowledge?.rule || '';
      return /[0-9]+[年日月％%m円]/.test(rule);
  }).map(c => ({
      ...c,
      id: `NR-${c.card_id}`,
      card_id: c.card_id,
      session_mode: 'number_recall',
      question: c.knowledge_domain.category_sample,
      rule: c.core_knowledge.rule,
      category: c.knowledge_domain.major,
      tags: c.knowledge_domain.tags || [],
      confidence: (c as any).confidence || 'medium'
  }));
  return numberCandidates.sort(() => 0.5 - Math.random()).slice(0, limit);
}

/**
 * TrapRecall用のキュー生成
 */
export async function buildTrapRecallQueue(options: any = {}): Promise<any[]> {
  const { examType = 'all', limit = 20 } = options;
  const kCards = await db.knowledge_cards.toArray();
  const trapCandidates: any[] = [];

  for (const card of kCards) {
    if (examType !== 'all' && !card.card_id.includes(examType)) continue;
    const patterns = card.question_patterns?.incorrect_patterns || [];
    for (const p of patterns) {
      if (!p.question_text || p.question_text.length < 10) continue;
      const exp = p.explanation || {};
      if (!exp.core_rule || !exp.reasoning) continue;
      trapCandidates.push({
        id: `TR-${card.card_id}-${p.id}`,
        card_id: card.card_id,
        session_mode: 'trap_recall',
        statement: p.question_text,
        is_trap: true,
        trap_point: exp.reasoning,
        correct_rule: exp.core_rule,
        explanation: exp.full,
        category: card.knowledge_domain.major,
        tags: card.knowledge_domain.tags || [],
        confidence: (card.learning_analysis?.understanding_score || 0) > 3 ? 'high' : 'medium'
      });
    }
  }
  return trapCandidates.sort(() => 0.5 - Math.random()).slice(0, limit);
}

/**
 * ComparisonRecall用のキュー生成 (P14)
 */
export async function buildComparisonRecallQueue(options: any = {}): Promise<any[]> {
  const { examType = 'all', limit = 20 } = options;

  // 1. 手動定義ペア (chintaiOptimizer)
  const { buildChintaiConfusionPairs } = await import('./chintaiOptimizer');
  const chintaiPairs = await buildChintaiConfusionPairs();

  // 2. 横断ペア (crossExamOptimizer)
  const { processCrossExamOptimization } = await import('./crossExamOptimizer');
  const crossRes = await processCrossExamOptimization();
  const crossPairs = crossRes.pairs || [];

  let allPairs = [...chintaiPairs, ...crossPairs];

  // フィルタ
  if (examType === 'chintai') allPairs = allPairs.filter(p => p.exam_type === 'chintai');
  if (examType === 'takken') allPairs = allPairs.filter(p => p.exam_type === 'takken');

  // 安全条件: 有効な用語と差異ポイントを持つもの
  allPairs = allPairs.filter(p => p.confidence !== 'low' && (p.left || p.left_term) && (p.right || p.right_term));

  return allPairs.map(p => ({
    id: `CP-${p.id || Math.random().toString(36).slice(2, 7)}`,
    card_id: p.id,
    session_mode: 'comparison_recall',
    topic: p.topic || '概念比較',
    item_a: p.left || p.left_term,
    item_b: p.right || p.right_term,
    difference_point: p.diff || p.difference,
    trap_point: p.trap || p.common_trap,
    comparison_table: p.table || [],
    question: `「${p.left || p.left_term}」と「${p.right || p.right_term}」の違いは？`,
    category: p.category || '横断知識',
    tags: p.tags || [],
    exam_type: p.exam_type || 'cross'
  })).slice(0, limit);
}

/**
 * 詳細なデータ活用率を算出 (修正版)
 */
export async function getDetailedUtilizationRates(): Promise<any> {
    const totalTakkenRaw = 3875;
    const totalChintaiRaw = 2000;

    const units = await db.knowledge_units.toArray();
    const assets = await db.recovered_learning_assets.toArray();
    const sourceQ = await db.source_questions.toArray();

    const calculateStats = (examType: 'takken' | 'chintai', rawTotal: number) => {
        const arCount = sourceQ.filter(q => q.exam_type === examType).length;
        const mrCount = units.filter(u => u.exam_type === examType).length;
        const recoveredUsable = assets.filter(a => a.exam_type === examType && a.usable_in_learning);
        
        const coveredCardIds = new Set([
            ...sourceQ.filter(q => q.exam_type === examType).map(q => q.source_card_id),
            ...units.filter(u => u.exam_type === examType).map(u => u.source_card_id),
            ...recoveredUsable.map(a => a.source_id)
        ]);
        const coverageRate = (coveredCardIds.size / rawTotal * 100);

        return {
            raw_record_coverage_rate: Math.min(100, coverageRate).toFixed(1) + '%',
            active_recall_coverage_rate: (arCount / rawTotal * 100).toFixed(1) + '%',
            memory_recall_coverage_rate: ((mrCount + recoveredUsable.length) / rawTotal * 100).toFixed(1) + '%',
            learning_asset_expansion_rate: ((arCount + mrCount + recoveredUsable.length) / rawTotal * 100).toFixed(1) + '%'
        };
    };

    return {
        takken: calculateStats('takken', totalTakkenRaw),
        chintai: calculateStats('chintai', totalChintaiRaw)
    };
}
/**
 * 苦手克服 (Focus Mode) 用のキュー生成 (P28)
 */
export async function buildFocusModeQueue(options: any = {}): Promise<any[]> {
    const { tag = '', limit = 10 } = options;
    if (!tag) return [];

    const uCards = await db.understanding_cards.filter(c => c.category === tag || (c.tags || []).includes(tag)).toArray();
    const mCards = await db.memory_cards.filter(c => c.category === tag || (c.tags || []).includes(tag)).toArray();

    // 5モードから横断的に収集
    let candidates: any[] = [
        ...uCards.map(c => ({ ...c, session_mode: 'active_recall' })),
        ...mCards.map(c => ({ ...c, session_mode: 'memory_recall' }))
    ];

    // 特殊モード (Number, Trap, Comparison) からも抽出
    const numQueue = await buildNumberRecallQueue({ limit: 100 });
    candidates.push(...numQueue.filter(c => c.category === tag || (c.tags || []).includes(tag)));

    const trapQueue = await buildTrapRecallQueue({ limit: 100 });
    candidates.push(...trapQueue.filter(c => c.category === tag || (c.tags || []).includes(tag)));

    const compQueue = await buildComparisonRecallQueue({ limit: 100 });
    candidates.push(...compQueue.filter(c => c.category === tag || (c.tags || []).includes(tag)));

    // 重複排除と品質フィルタ
    const seen = new Set();
    const unique = candidates.filter(c => {
        const id = c.card_id || c.id;
        if (seen.has(id)) return false;
        seen.add(id);
        return c.confidence !== 'low';
    });

    // 苦手克服モードとしてタグ付け
    return unique.sort(() => 0.5 - Math.random()).slice(0, limit).map(c => ({
        ...c,
        focus_tag: tag,
        is_focus_mode: true
    }));
}

export async function buildDailyStudySessionQueue(options: any = {}): Promise<any[]> {
    const { examType = 'all', variant = '30q' } = options;
    const limit = variant === '35q' ? 35 : 30;
    const config: any = await db.metadata.get('study_distribution_config');
    const configValue = config?.value || {};
    
    let activeTarget = 24;
    let memoryTarget = 6;
    let numberTarget = 0;
    let trapTarget = 0;
    let comparisonTarget = 0;
    let distributionSource = 'fixed_default';

    // P20: 35問モード (手動指定時)
    if (variant === '35q') {
        activeTarget = 24; memoryTarget = 4; numberTarget = 3; trapTarget = 2; comparisonTarget = 2;
        distributionSource = 'fixed_p20_35q';
    } 
    // P17: 30問標準モード (自動/手動予約なし時)
    else if (!configValue.manual_pending && !configValue.auto_apply_enabled) {
        activeTarget = 22; memoryTarget = 3; numberTarget = 2; trapTarget = 2; comparisonTarget = 1;
        distributionSource = 'fixed_p17_multimode';
    }

    if (variant !== '35q') {
        if (configValue.manual_pending) {
            activeTarget = configValue.manual_applied_active;
            memoryTarget = configValue.manual_applied_memory;
            distributionSource = 'manual_pending';
            // 手動予約消費
            config.value.manual_pending = false;
            config.value.applied = true;
            config.value.applied_at = Date.now();
            await db.metadata.put(config);
        } else if (configValue.auto_apply_enabled) {
            const rec = await calculateRecommendedModeDistribution();
            if (rec.eligibility.eligible) {
                activeTarget = rec.recommended.active_recall;
                memoryTarget = rec.recommended.memory_recall;
                distributionSource = 'auto_apply';
                const runId = `AUTO-P10-${Date.now()}`;
                config.value.auto_apply_last_run_id = runId;
                config.value.auto_apply_cooldown_until = Date.now() + (20 * 60 * 60 * 1000);
                config.value.applied = true;
                config.value.applied_at = Date.now();
                await db.metadata.put(config);
            }
        }
    }

    console.log(`🚀 [${distributionSource}] Distribution: A:${activeTarget} M:${memoryTarget} N:${numberTarget} T:${trapTarget} C:${comparisonTarget} (Variant: ${variant})`);

    const finalQueue: any[] = [];
    const modes = [
        { mode: 'active_recall', target: activeTarget, func: buildLearningQueue },
        { mode: 'memory_recall', target: memoryTarget, func: buildMemoryRecallQueue },
        { mode: 'number_recall', target: numberTarget, func: buildNumberRecallQueue },
        { mode: 'trap_recall', target: trapTarget, func: buildTrapRecallQueue },
        { mode: 'comparison_recall', target: comparisonTarget, func: buildComparisonRecallQueue }
    ].filter(m => m.target > 0);

    for (const m of modes) {
        const items = await m.func({ examType, limit: m.target });
        finalQueue.push(...items.map(i => ({ ...i, session_mode: m.mode })));
    }

    // 規定数に満たない場合の補完 (Activeで埋める)
    if (finalQueue.length < limit) {
        const extra = await buildLearningQueue({ limit: limit - finalQueue.length });
        finalQueue.push(...extra.map(i => ({ ...i, session_mode: 'active_recall' })));
    }

    return finalQueue.slice(0, limit).sort(() => 0.5 - Math.random());
}

/**
 * ダッシュボード統計
 */
export async function getStudyDashboard(): Promise<any> {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 統計計算
    const events = await db.study_events.toArray();
    const memoryEvents = await db.memory_study_events.toArray();
    
    const todayEvents = events.filter(e => new Date(e.created_at).toISOString().split('T')[0] === todayStr).length +
                        memoryEvents.filter(e => new Date(e.created_at).toISOString().split('T')[0] === todayStr).length;

    const recent30 = [...events, ...memoryEvents.map(e => ({ ...e, answered_correct: e.answered_correct } as any))].slice(-30);
    const recentAccuracy = recent30.length > 0 
        ? recent30.filter(e => e.answered_correct).length / recent30.length 
        : 0;

    const mCards = await db.memory_cards.toArray();
    const uCards = await db.understanding_cards.toArray();
    const mProgress = await db.memory_card_progress.toArray();
    const reviews = await db.quality_improvement_suggestions.filter(s => !s.is_applied).count();

    const dueMemory = mProgress.filter(p => {
        const due = p.fsrs_state?.due || p.srs_params?.next_review_date;
        return due && new Date(due).getTime() <= now;
    }).length;

    const dueActive = uCards.filter(c => {
        const due = c.fsrs_state?.due || c.srs_params?.next_review_date;
        return due && new Date(due).getTime() <= now;
    }).length;

    const config = await db.metadata.get('study_distribution_config');
    const autoApplyEnabled = config?.value?.auto_apply_enabled || false;

    // P24: 苦手タグと推奨アクションの取得
    let weakTags = await db.metadata.get('weak_tags_cache');
    if (!weakTags) {
        weakTags = { key: 'weak_tags_cache', value: await calculateWeakTagsMetrics() };
    }
    const topTags = (weakTags?.value?.top_tags || []).map((t: any) => ({
        ...t,
        reason: t.incorrect > 0 ? '誤答が目立つ分野です' : (t.rating_1 > 0 ? '自信が極めて低い分野です' : '定着が不安定な分野です')
    }));

    // P31: 苦手克服進捗
    let focusProgress = await db.metadata.get('focus_progress_cache');
    if (!focusProgress) {
        focusProgress = { key: 'focus_progress_cache', value: await calculateFocusProgressMetrics() };
    }

    const scoreHistory = await db.metadata.get('weak_score_history');
    const priorityTag = topTags.length > 0 ? topTags[0] : null;
    let priorityTagProgress = null;
    if (priorityTag && focusProgress?.value?.tag_progress) {
        priorityTagProgress = focusProgress.value.tag_progress.find((p: any) => p.name === priorityTag.name) || null;
    }

    // 推奨アクション生成
    let nextAction = '30問標準モードで基礎を固めましょう';
    if (recentAccuracy > 0.8 && mCards.length > 500) {
        nextAction = '好調です！ 35問集中モードで密度を上げませんか？';
    } else if (topTags.some((t: any) => /数字|期間|％|円|万/.test(t.name))) {
        nextAction = '数字・期間の特訓（NumberRecall）が合格への近道です';
    } else if (topTags.some((t: any) => /注意|ひっかけ|例外/.test(t.name))) {
        nextAction = 'ひっかけ回避（TrapRecall）で失点を防ぎましょう';
    } else if (topTags.some((t: any) => /比較|違い|整理/.test(t.name))) {
        nextAction = '制度の横断整理（ComparisonRecall）をおすすめします';
    }

    // 定着度推移 (分離テーブル対応)
    const avgStability = mProgress.length > 0 
        ? mProgress.reduce((acc, p) => acc + (p.fsrs_state?.stability || 0), 0) / mProgress.length 
        : 0;

    return {
        is_new_user: events.length === 0 && memoryEvents.length === 0,
        today: {
            completed_today: todayEvents,
            remaining_today: Math.max(0, 30 - todayEvents),
            target_today: 30
        },
        recent: {
            recent_30_accuracy: recentAccuracy
        },
        review_alerts: {
            quality_review_needed_count: reviews
        },
        recovered_stats: {
            recovered_ratio: 0.15 
        },
        due_active_cards: dueActive,
        due_memory_cards: dueMemory,
        avg_stability: avgStability,
        auto_apply_enabled: autoApplyEnabled,
        weak_tags: topTags,
        priority_tag: priorityTag,
        priority_tag_progress: priorityTagProgress,
        weak_score_history: scoreHistory?.value || null,
        next_action: nextAction,
        focus_progress: focusProgress?.value || { tag_progress: [], latest_result: null }
    };
}

export async function toggleAutoApply(enabled: boolean): Promise<void> {
    const config = await db.metadata.get('study_distribution_config') || { key: 'study_distribution_config', value: {} };
    config.value.auto_apply_enabled = enabled;
    await db.metadata.put(config);
}

export async function clearManualDistribution(isRollback: boolean = false): Promise<void> {
    const config = await db.metadata.get('study_distribution_config');
    if (config) {
        config.value.manual_pending = false;
        if (isRollback) {
            config.value.auto_apply_cooldown_until = Date.now() + (24 * 60 * 60 * 1000);
        }
        await db.metadata.put(config);
    }
}

export async function reserveManualDistribution(rec: any): Promise<void> {
    const config = await db.metadata.get('study_distribution_config') || { key: 'study_distribution_config', value: {} };
    config.value.manual_pending = true;
    config.value.manual_applied_active = rec.recommended.active_recall;
    config.value.manual_applied_memory = rec.recommended.memory_recall;
    await db.metadata.put(config);
}

export async function startStudySession(plannedCount: number, variant: string = '30q'): Promise<string> {
    const sessionId = `SESSION-${Date.now()}`;
    await db.study_sessions.put({
        session_id: sessionId,
        date: new Date().toISOString().split('T')[0],
        planned_count: plannedCount,
        completed_count: 0,
        correct_count: 0,
        accuracy: 0,
        mode_distribution: {},
        recovered_count: 0,
        quality_review_triggered_count: 0,
        started_at: Date.now(),
        session_variant: variant 
    } as any);
    return sessionId;
}

export async function completeStudySession(sessionId: string): Promise<any> {
    const session = await db.study_sessions.get(sessionId);
    if (!session) return null;

    const sessionStart = session.started_at;
    const sessionEnd = Date.now();

    const events = await db.study_events.where('created_at').between(sessionStart, sessionEnd).toArray();
    const memoryEvents = await db.memory_study_events.where('created_at').between(sessionStart, sessionEnd).toArray();
    
    const combined = [...events, ...memoryEvents];
    const modeDistribution: Record<string, number> = {};
    combined.forEach(e => {
        modeDistribution[e.mode] = (modeDistribution[e.mode] || 0) + 1;
    });

    const correctCount = combined.filter(e => e.answered_correct).length;
    
    session.ended_at = sessionEnd;
    session.completed_count = combined.length;
    session.correct_count = correctCount;
    session.accuracy = combined.length > 0 ? correctCount / combined.length : 0;
    session.mode_distribution = modeDistribution;

    await db.study_sessions.put(session);
    return session;
}

/**
 * イベントの新鮮度に応じた減衰係数を計算 (P27)
 */
export function calculateDecayFactor(index: number, total: number): number {
    const safeTotal = Math.max(total, 1);
    const rawFactor = 1.0 - (index / safeTotal);
    let factor = Math.max(0.2, rawFactor);
    if (index < 10) factor = Math.max(0.9, factor);
    return factor;
}

/**
 * 苦手分野 (weak_tags) の算出 (P27: Recency Decay版)
 */
export async function calculateWeakTagsMetrics(): Promise<any> {
    const limit = 100;
    const events = await db.study_events.orderBy('created_at').reverse().limit(limit).toArray();
    const mEvents = await db.memory_study_events.orderBy('created_at').reverse().limit(limit).toArray();
    
    const combined = [...events, ...mEvents].sort((a, b) => b.created_at - a.created_at).slice(0, limit);

    if (combined.length === 0) return { top_tags: [], total_events: 0 };

    const tagScores: Record<string, number> = {};
    const tagDetails: Record<string, any> = {};

    for (let i = 0; i < combined.length; i++) {
        const event = combined[i];
        const decayFactor = calculateDecayFactor(i, combined.length);
        
        let tags: string[] = (event as any).tags || [];
        
        if (tags.length === 0) {
            const card = await db.understanding_cards.get(event.card_id) || await db.memory_cards.get(event.card_id);
            if (card) tags = card.tags || [];
        }

        if (tags.length === 0) continue;

        let baseScore = 0;
        if (!event.answered_correct) baseScore += 3;
        if (event.rating === 1) baseScore += 3;
        if (event.rating === 2) baseScore += 2;

        for (const tag of tags) {
            tagScores[tag] = (tagScores[tag] || 0) + (baseScore * decayFactor);
            if (!tagDetails[tag]) {
                tagDetails[tag] = { name: tag, incorrect: 0, rating_1: 0, rating_2: 0, count: 0, raw_score: 0 };
            }
            tagDetails[tag].count++;
            if (!event.answered_correct) tagDetails[tag].incorrect++;
            if (event.rating === 1) tagDetails[tag].rating_1++;
            if (event.rating === 2) tagDetails[tag].rating_2++;
        }
    }

    const sortedTags = Object.values(tagDetails)
        .sort((a, b) => (tagScores[b.name] || 0) - (tagScores[a.name] || 0));

    const top5 = sortedTags.slice(0, 5).map(t => ({ ...t, score: tagScores[t.name] }));

    await db.metadata.put({ key: 'weak_tags_cache', value: { top_tags: top5, total_events: combined.length, generated_at: Date.now() } });
    return { top_tags: top5, total_events: combined.length };
}

/**
 * 苦手克服特訓 (Focus Mode) の進捗を算出 (P31)
 */
export async function calculateFocusProgressMetrics(): Promise<any> {
    const focusSessions = await db.study_sessions.where('session_variant').equals('focus_10q').reverse().limit(10).toArray();
    if (focusSessions.length === 0) return { tag_progress: [], latest_result: null };

    const tagProgress: Record<string, any> = {};
    for (const session of focusSessions) {
        const events = await db.study_events.where('created_at').between(session.started_at, session.ended_at || Date.now()).toArray();
        const focusEvents = events.filter(e => e.mode === 'focus_recall' || (e as any).is_focus_mode);
        for (const event of focusEvents) {
            const tag = (event as any).focus_tag;
            if (!tag) continue;
            if (!tagProgress[tag]) tagProgress[tag] = { name: tag, sessions_count: 0, correct_count: 0, total_count: 0, rating_1_2_count: 0 };
            tagProgress[tag].total_count++;
            if (event.answered_correct) tagProgress[tag].correct_count++;
            if (((event as any).rating || 0) <= 2) tagProgress[tag].rating_1_2_count++;
        }
    }

    const resultList = Object.values(tagProgress).map(p => ({
        name: p.name, accuracy: p.total_count > 0 ? p.correct_count / p.total_count : 0, trend: '安定'
    }));

    return { tag_progress: resultList, generated_at: Date.now() };
}
