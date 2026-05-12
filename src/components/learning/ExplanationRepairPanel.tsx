import { AlertTriangle, ArrowLeftRight, BookOpen, Lightbulb, Target } from 'lucide-react';
import { type ExplanationMatchResult } from '../../utils/explanationMatcher';

interface ExplanationRepairPanelProps {
  match: ExplanationMatchResult;
  onOpenInputUnit?: () => void;
}

function firstText(...values: Array<string | null | undefined>): string {
  return values.find((value) => value && value.trim().length > 0)?.trim() || '';
}

function buildConclusion(match: ExplanationMatchResult): string {
  const choice = match.choiceExplanation;
  if (choice) {
    if (typeof choice.is_statement_true_snapshot === 'boolean') {
      return `結論：この選択肢は${choice.is_statement_true_snapshot ? '正しい' : '誤り'}。`;
    }
    return firstText(choice.correct_answer_reason, choice.why_true, choice.why_false, '結論：この選択肢の正誤を理由から確認します。');
  }

  const question = match.questionExplanation;
  if (question) {
    return firstText(question.correct_conclusion, question.why_this_answer, '結論：この問題の正誤をルールから確認します。');
  }

  const unit = match.repairUnit;
  return firstText(unit?.conclusion, '結論：この問題は基本ルールの確認が必要です。');
}

function buildReason(match: ExplanationMatchResult): string {
  const choice = match.choiceExplanation;
  if (choice) {
    return firstText(choice.rule, choice.correct_answer_reason, choice.why_true, choice.why_false);
  }

  const question = match.questionExplanation;
  if (question) {
    return firstText(question.applicable_rule, question.why_this_answer, question.rule_source);
  }

  const unit = match.repairUnit;
  return firstText(unit?.principle, unit?.legal_effect, unit?.requirements?.join(' / '), unit?.repair_explanation.short_note);
}

function buildApplication(match: ExplanationMatchResult): string {
  const choice = match.choiceExplanation;
  if (choice) return firstText(choice.application_to_statement, choice.statement_text);

  const question = match.questionExplanation;
  if (question) return firstText(question.application_to_question, question.facts_summary);

  const unit = match.repairUnit;
  return firstText(unit?.cases.concrete_example, unit?.purpose);
}

function buildMistakePoint(match: ExplanationMatchResult): string {
  const choice = match.choiceExplanation;
  if (choice) return firstText(choice.why_user_wrong, choice.why_trap, choice.trap);

  const question = match.questionExplanation;
  if (question) {
    return firstText(
      question.why_user_wrong,
      question.common_misread,
      question.trap_points?.[0]?.trap,
      question.trap_points?.[0]?.why_trap
    );
  }

  const unit = match.repairUnit;
  return firstText(unit?.repair_explanation.common_mistake, unit?.trap_points?.[0]);
}

function buildMemory(match: ExplanationMatchResult): string {
  const choice = match.choiceExplanation;
  if (choice) return firstText(choice.one_line_memory, choice.rule);

  const question = match.questionExplanation;
  if (question) return firstText(question.memory_hook, question.correct_conclusion);

  const unit = match.repairUnit;
  return firstText(unit?.repair_explanation.short_note, unit?.check_question.explanation);
}

function buildComparison(match: ExplanationMatchResult): string {
  const choice = match.choiceExplanation;
  const compareWith = choice ? (choice.compare_with as unknown) : null;
  if (compareWith) {
    if (Array.isArray(compareWith)) {
      const parts = compareWith
        .map((item: unknown) => {
          if (!item) return '';
          if (typeof item === 'string') return item.trim();
          if (typeof item !== 'object') return String(item).trim();
          const optionNo = (item as any).option_no;
          const difference = (item as any).difference;
          if (optionNo && difference) return `選択肢${optionNo}: ${String(difference)}`;
          if (difference) return String(difference).trim();
          return '';
        })
        .filter((item: string) => item.length > 0);
      if (parts.length > 0) return parts.join(' / ');
    } else if (typeof compareWith === 'string') {
      const text = compareWith.trim();
      if (text.length > 0) return text;
    }
  }

  const unit = match.repairUnit;
  if (unit?.comparison?.length) {
    return unit.comparison
      .map((item) => `${item.target_tag}: ${item.difference}`)
      .join(' / ');
  }

  return '';
}

export function ExplanationRepairPanel({ match, onOpenInputUnit }: ExplanationRepairPanelProps) {
  if (match.source === 'none') return null;

  const conclusion = buildConclusion(match);
  const reason = buildReason(match);
  const application = buildApplication(match);
  const mistakePoint = buildMistakePoint(match);
  const memory = buildMemory(match);
  const comparison = buildComparison(match);
  const sourceRefs = match.choiceExplanation?.source_refs || match.questionExplanation?.source_refs || [];

  // Helper to split text into bullets if it's a long string with many sentences
  const renderBullets = (text: string) => {
    if (!text) return null;
    const sentences = text.split(/[。\n]+/).filter(s => s.trim().length > 0);
    return (
      <div className="space-y-2">
        {sentences.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0"></div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{s}。</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* 1. Conclusion - High Prominence */}
      <div className="bg-indigo-600 text-white p-6">
        <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 flex justify-between items-center">
          <span>結論 (Conclusion)</span>
          <span className="opacity-50 text-[8px] font-mono">{match.source}</span>
        </div>
        <p className="text-lg font-black leading-relaxed">{conclusion}</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* 2. Reason - Structured */}
        {reason && (
          <div className="space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={14} className="text-indigo-500" />
              なぜそうなるか (理由)
            </div>
            {renderBullets(reason)}
          </div>
        )}

        {/* 3. Application - Specific */}
        {application && (
          <div className="space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              この問題へのあてはめ
            </div>
            <p className="text-md font-bold text-blue-800 leading-relaxed italic">
              {application}
            </p>
          </div>
        )}

        {/* 4. Mistake Point - Caution */}
        {mistakePoint && (
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} />
              間違えやすいポイント
            </div>
            <p className="text-sm font-bold text-rose-950 leading-relaxed">{mistakePoint}</p>
          </div>
        )}

        {/* 5. Memory - Amber Retention */}
        {memory && (
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Lightbulb size={14} />
              1行暗記
            </div>
            <p className="text-md font-black text-amber-950 leading-tight">「{memory}」</p>
          </div>
        )}

        {/* 6. Comparison - Emerald Context */}
        {comparison && (
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
              <ArrowLeftRight size={14} />
              似た論点との比較
            </div>
            <p className="text-sm font-bold text-emerald-950 leading-relaxed">{comparison}</p>
          </div>
        )}

        {/* Detailed Action or Source */}
        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
          {match.repairUnit && onOpenInputUnit && (
            <button
              onClick={onOpenInputUnit}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              詳細な構造化知識を開く
            </button>
          )}

          {sourceRefs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sourceRefs.map((ref: any, idx: number) => (
                <span key={idx} className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">
                  {ref.title} {ref.article}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
