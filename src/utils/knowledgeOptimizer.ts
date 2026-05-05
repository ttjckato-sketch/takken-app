
import { db, KnowledgeUnit, MemoryCard, ConfusionPair } from '../db';

/**
 * Phase 1-7: Knowledge Processing Engine (v2.5.9)
 * 1000件規模の本番加工実行に向けた強化。
 */

export interface OptimizationStats {
    run_id: string;
    executed_at: string;
    requested_total: number;
    actual_sampled_total: number;
    raw_source_choices_count: number;
    prefiltered_source_choices_count: number;
    eligible_for_knowledge_optimization_count: number;
    excluded_from_raw_count: number;
    excluded_reason_breakdown: Record<string, number>;
    generated_knowledge_units: number;
    generated_memory_cards: number;
    generated_confusion_pairs: number;
    low_confidence_count: number;
    contradiction_suspected_count: number;
    skipped_count: number;
    category_distribution: Record<string, number>;
    card_type_distribution: Record<string, number>;
    dry_run?: boolean;
}

export async function processKnowledgeOptimizationSample(options: { 
    limit?: number; 
    examType?: 'takken' | 'chintai' | 'all';
    clearBefore?: boolean;
    dryRun?: boolean;
    customRunId?: string;
} = {}) {
    const limit = options.limit || 1000;
    const examType = options.examType || 'all';
    const now = new Date();
    
    // P23: run_id pattern
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const defaultRunId = `${options.dryRun ? 'DRY_RUN' : 'KNOWLEDGE_OPT'}_V2_5_${timestamp}`;
    const run_id = options.customRunId || defaultRunId;

    console.log(`🚀 Starting processKnowledgeOptimizationSample [${run_id}] (Target: ${limit}, DryRun: ${!!options.dryRun})`);

    if (options.clearBefore && !options.dryRun) {
        await db.knowledge_units.clear();
        await db.memory_cards.clear();
        await db.confusion_pairs.clear();
    }

    const stats: OptimizationStats = {
        run_id,
        executed_at: now.toISOString(),
        requested_total: limit,
        actual_sampled_total: 0,
        raw_source_choices_count: 0,
        prefiltered_source_choices_count: 0,
        eligible_for_knowledge_optimization_count: 0,
        excluded_from_raw_count: 0,
        excluded_reason_breakdown: {
            missing_question: 0,
            missing_explanation: 0,
            short_explanation: 0,
            null_statement: 0,
            placeholder: 0,
            count_combination: 0,
            broken_short_text: 0,
            duplicate_source_choice: 0,
            unsupported_category: 0,
            contradiction_suspected: 0,
            other: 0
        },
        generated_knowledge_units: 0,
        generated_memory_cards: 0,
        generated_confusion_pairs: 0,
        low_confidence_count: 0,
        contradiction_suspected_count: 0,
        skipped_count: 0,
        category_distribution: {},
        card_type_distribution: { rule: 0, why: 0, trap: 0, number: 0, exception: 0, comparison: 0 },
        dry_run: !!options.dryRun
    };

    const allChoices = await db.source_choices.toArray();
    stats.raw_source_choices_count = allChoices.length;

    const eligiblePool: any[] = [];
    const seenChoiceIds = new Set();

    for (const choice of allChoices) {
        if (seenChoiceIds.has(choice.id)) {
            stats.excluded_reason_breakdown.duplicate_source_choice++;
            continue;
        }
        seenChoiceIds.add(choice.id);

        if (choice.is_statement_true === null) {
            stats.excluded_reason_breakdown.null_statement++;
            continue;
        }

        if (!choice.explanation || choice.explanation.length < 5) {
            stats.excluded_reason_breakdown.missing_explanation++;
            continue;
        }

        const isPlaceholderText = choice.text.includes('不足') || choice.text.length < 8;
        const isPlaceholderExp = choice.explanation.includes('不足') || choice.explanation.includes('placeholder') || choice.explanation.includes('???');
        
        if (isPlaceholderExp || (isPlaceholderText && choice.explanation.length < 15)) {
            stats.excluded_reason_breakdown.placeholder++;
            continue;
        }

        const question = await db.source_questions.get(choice.question_id);
        if (!question) {
            stats.excluded_reason_breakdown.missing_question++;
            continue;
        }

        if (question.question_type === 'count_choice' || question.question_type === 'combination') {
            stats.excluded_reason_breakdown.count_combination++;
            continue;
        }

        stats.prefiltered_source_choices_count++;

        const signals = extractLegalLearningSignals(choice.text, choice.explanation, choice.is_statement_true);
        if (detectContradiction(choice, signals)) {
            stats.excluded_reason_breakdown.contradiction_suspected++;
            continue;
        }

        eligiblePool.push({ choice, question, signals });
        stats.eligible_for_knowledge_optimization_count++;
    }

    stats.excluded_from_raw_count = stats.raw_source_choices_count - stats.eligible_for_knowledge_optimization_count;

    // Sampling logic
    let finalSample: any[] = [];
    
    if (examType === 'all' || examType === 'takken') {
        const takkenPool = eligiblePool.filter(p => p.question.exam_type === 'takken');
        const takkenCategories = [
            { key: '業法', pattern: /業法|取引/, target: 300 },
            { key: '権利', pattern: /権利|民法/, target: 220 },
            { key: '制限', pattern: /制限|都市|建築|法令/, target: 180 },
            { key: '税他', pattern: /税|地価|その他/, target: 100 }
        ];

        let takkenTotal = 0;
        for (const cat of takkenCategories) {
            const catSamples = takkenPool.filter(p => cat.pattern.test(p.question.category)).slice(0, cat.target);
            finalSample.push(...catSamples);
            stats.category_distribution[cat.key] = catSamples.length;
            takkenTotal += catSamples.length;
        }
        
        if (takkenTotal < 800) {
            const remaining = takkenPool.filter(p => !finalSample.includes(p)).slice(0, 800 - takkenTotal);
            finalSample.push(...remaining);
            stats.category_distribution['その他(宅建)'] = (stats.category_distribution['その他(宅建)'] || 0) + remaining.length;
        }
    }

    if (examType === 'all' || examType === 'chintai') {
        const chintaiPool = eligiblePool.filter(p => p.question.exam_type === 'chintai');
        const chintaiSamples = chintaiPool.slice(0, 200);
        finalSample.push(...chintaiSamples);
        stats.category_distribution['賃貸'] = chintaiSamples.length;
    }

    if (options.limit && finalSample.length > options.limit) {
        finalSample = finalSample.slice(0, options.limit);
    }

    stats.actual_sampled_total = finalSample.length;

    for (const item of finalSample) {
        const { choice, question, signals } = item;
        try {
            const unit: KnowledgeUnit = {
                unit_id: `ku_${choice.id}`,
                source_choice_id: choice.id,
                source_question_id: question.id,
                source_card_id: choice.source_card_id,
                exam_type: question.exam_type,
                category: question.category,
                tags: question.tags || [],
                statement: choice.text,
                is_statement_true: !!choice.is_statement_true,
                core_rule: signals.core_rule,
                why: signals.why,
                exception: signals.exception,
                trap: signals.trap,
                contrast: signals.contrast,
                numbers_to_memorize: signals.numbers,
                legal_terms: signals.terms,
                learning_type: determineLearningType(signals),
                difficulty: 3,
                importance: 3,
                confidence: determineConfidence(choice, signals)
            };

            if (unit.confidence === 'low') stats.low_confidence_count++;

            if (!options.dryRun) {
                await db.knowledge_units.put(unit);
            }
            stats.generated_knowledge_units++;

            const cards = generateMemoryCards(unit);
            for (const card of cards) {
                if (!options.dryRun) {
                    await db.memory_cards.put(card);
                }
                stats.generated_memory_cards++;
                stats.card_type_distribution[card.card_type] = (stats.card_type_distribution[card.card_type] || 0) + 1;
            }

            if (unit.contrast) {
                const pair: ConfusionPair = {
                    pair_id: `cp_${unit.unit_id}`,
                    exam_type: unit.exam_type,
                    category: unit.category,
                    left_term: signals.terms[0] || unit.category,
                    right_term: unit.contrast.split(/[は、]/)[0]?.substring(0, 10) || '他'
                };
                if (!options.dryRun) {
                    await db.confusion_pairs.put(pair);
                }
                stats.generated_confusion_pairs++;
            }
        } catch (e) {
            stats.skipped_count++;
        }
    }

    if (!options.dryRun) {
        await db.metadata.put({ key: 'last_optimization_run', value: stats });
    }
    return stats;
}

function extractLegalLearningSignals(text: string, explanation: string, isTrue: boolean | null) {
    const signals = { core_rule: '', why: '', exception: '', trap: '', contrast: '', numbers: [] as string[], terms: [] as string[] };
    const cleanExp = (explanation || '').trim()
        .replace(/^(解説|肢\d+|本肢は)[正しい適切誤り不適切]*[。\s]*/, '')
        .replace(/^[正しい適切誤り不適切]*である。[。\s]*/, '');
    
    const firstSentence = cleanExp.split(/[。！]/)[0] + '。';

    if (isTrue === true) {
        signals.core_rule = `原則として正しい。${firstSentence}`;
    } else {
        signals.core_rule = `誤り。正しい結論: ${firstSentence}`;
    }

    const whyKeywords = ['なぜなら', '理由', 'これは', '規定により', '規定されているため', '〜からである', '〜ため', '基づき', '基づく', '要件'];
    const whyRegex = new RegExp(`[^。]*?(${whyKeywords.join('|')})[^。]*?。`, 'g');
    const whyMatches = cleanExp.match(whyRegex);
    if (whyMatches) signals.why = whyMatches[0];
    else {
        const fallbackWhy = cleanExp.match(/[^。]*?(である|となる|となっている|とされている|認められる|認められない|要する)[^。]*?。$/);
        signals.why = fallbackWhy ? fallbackWhy[0] : cleanExp.substring(0, 100);
    }

    const trapKeywords = ['ただし', '例外', 'できない', '必要', '不要', '義務', '任意', '届出', '許可', '承諾', '期間', '遅滞なく', '直ちに', 'すみやかに', 'に限る', 'のみ', '禁止', '違反'];
    for (const kw of trapKeywords) {
        if (cleanExp.includes(kw) || text.includes(kw)) {
            const match = (cleanExp + ' ' + text).match(new RegExp(`[^。]*${kw}[^。]*。?`));
            if (match) { signals.trap = match[0]; break; }
        }
    }

    const exceptionKeywords = ['ただし', '例外', '場合を除く', 'あっても', 'に限り', 'なくても'];
    for (const kw of exceptionKeywords) {
        if (cleanExp.includes(kw)) {
            const match = cleanExp.match(new RegExp(`[^。]*${kw}[^。]*。`));
            if (match) { signals.exception = match[0]; break; }
        }
    }

    const numRegex = /[\d０-９]+(日|か月|ヶ月|月|年|週間|分の[\d０-９]+|%|割|倍|人|㎡|平方メートル)/g;
    const foundNums = (text + ' ' + cleanExp).match(numRegex) || [];
    signals.numbers = Array.from(new Set(foundNums))
        .map(n => n.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)))
        .filter(n => !n.match(/^(19|20)\d+年$/));

    const termMap = {
        'takken': ['免許', '登録', '取引士', '重要事項説明', '35条', '37条', '媒介契約', '手付', '意思表示', '代理', '時効', '相続', '抵当権', '賃貸借', '売買', '建ぺい率', '容積率', '用途地域', '開発許可', '農地法', '都市計画'],
        'chintai': ['管理受託契約', 'サブリース', '賃貸住宅管理業者', '原状回復', '敷金', '標準管理規約', '定期借家']
    };
    const allTerms = [...termMap.takken, ...termMap.chintai];
    signals.terms = allTerms.filter(t => cleanExp.includes(t) || text.includes(t));

    const contrastKeywords = ['違い', '比較', '一方', 'とは異なり', 'に対して', '対して', '対照的'];
    for (const kw of contrastKeywords) {
        if (cleanExp.includes(kw)) {
            const match = cleanExp.match(new RegExp(`[^。]*${kw}[^。]*?。`));
            if (match) { signals.contrast = match[0]; break; }
        }
    }
    return signals;
}

function determineLearningType(signals: any): KnowledgeUnit['learning_type'] {
    if (signals.numbers.length > 0) return 'number';
    if (signals.contrast) return 'comparison';
    if (signals.trap) return 'trap';
    if (signals.exception) return 'exception';
    if (signals.terms.length > 2) return 'definition';
    return 'rule';
}

function determineConfidence(choice: any, signals: any): KnowledgeUnit['confidence'] {
    if (!choice.explanation || choice.explanation.length < 8) return 'low';
    if (signals.core_rule.length < 8) return 'low'; 
    if (choice.explanation.includes('不足')) return 'low';
    if (signals.core_rule.match(/(解説|正しい|誤り|適切)。?$/)) return 'low';
    if (signals.why.length > 12 && signals.terms.length > 0) return 'high';
    return 'medium';
}

function detectContradiction(choice: any, signals: any) {
    const isFalse = choice.is_statement_true === false;
    const isTrue = choice.is_statement_true === true;
    if (isFalse && (signals.core_rule.includes('正しい。') && !signals.core_rule.includes('誤り。'))) return true;
    if (isTrue && signals.core_rule.includes('誤り。')) return true;
    return false;
}

function generateMemoryCards(unit: KnowledgeUnit): MemoryCard[] {
    const cards: MemoryCard[] = [];
    const isGarbage = (s: string) => s.length < 5 || s.match(/^(解説|正しい|誤り|適切)。?$/);

    if (!isGarbage(unit.core_rule)) {
        cards.push({
            memory_card_id: `MC-RULE-${unit.unit_id}`, unit_id: unit.unit_id, exam_type: unit.exam_type, category: unit.category, tags: unit.tags,
            card_type: 'rule', question: `論点: 「${unit.statement.substring(0, 45)}...」\n法律上の結論は？`,
            answer: unit.core_rule, source_text: unit.statement, confidence: unit.confidence
        });
    }

    if (unit.why && unit.why.length > 20 && unit.why !== unit.core_rule && !isGarbage(unit.why)) {
        cards.push({
            memory_card_id: `MC-WHY-${unit.unit_id}`, unit_id: unit.unit_id, exam_type: unit.exam_type, category: unit.category, tags: unit.tags,
            card_type: 'why', question: `論点: 「${unit.statement.substring(0, 30)}...」\nなぜそのような結論になる？`,
            answer: unit.why, source_text: unit.statement, confidence: unit.confidence
        });
    }

    if ((unit.trap || unit.exception) && !isGarbage(unit.exception || unit.trap || '')) {
        cards.push({
            memory_card_id: `MC-TRAP-${unit.unit_id}`, unit_id: unit.unit_id, exam_type: unit.exam_type, category: unit.category, tags: unit.tags,
            card_type: unit.exception ? 'exception' : 'trap', question: `注意点: この論点の「ひっかけ」や「例外」は？`,
            answer: unit.exception || unit.trap || '', source_text: unit.statement, confidence: unit.confidence
        });
    }

    if (unit.numbers_to_memorize && unit.numbers_to_memorize.length > 0) {
        cards.push({
            memory_card_id: `MC-NUM-${unit.unit_id}`, unit_id: unit.unit_id, exam_type: unit.exam_type, category: unit.category, tags: unit.tags,
            card_type: 'number', question: `論点: 「${unit.statement.substring(0, 30)}...」\n覚えるべき具体的な数字・期間は？`,
            answer: unit.numbers_to_memorize.join('、'), source_text: unit.statement, confidence: unit.confidence
        });
    }
    return cards.slice(0, 3);
}
