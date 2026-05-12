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

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-[32px] p-6 shadow-lg space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
          <BookOpen size={16} />
          誤答補修解説
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {match.source}
        </div>
      </div>

      <div className="bg-indigo-600 text-white p-5 rounded-2xl">
        <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">結論</div>
        <p className="font-black leading-relaxed">{conclusion}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reason && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target size={13} className="text-indigo-500" />
              なぜそうなるか
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{reason}</p>
          </div>
        )}

        {application && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">
              この問題へのあてはめ
            </div>
            <p className="text-sm font-bold text-blue-950 leading-relaxed">{application}</p>
          </div>
        )}

        {mistakePoint && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle size={13} />
              どこで間違えたか
            </div>
            <p className="text-sm font-bold text-rose-950 leading-relaxed">{mistakePoint}</p>
          </div>
        )}

        {memory && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Lightbulb size={13} />
              1行暗記
            </div>
            <p className="text-sm font-black text-amber-950 leading-relaxed">{memory}</p>
          </div>
        )}

        {comparison && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ArrowLeftRight size={13} />
              似た論点との比較
            </div>
            <p className="text-sm font-bold text-emerald-950 leading-relaxed">{comparison}</p>
          </div>
        )}
      </div>

      {match.repairUnit && onOpenInputUnit && (
        <button
          onClick={onOpenInputUnit}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-black text-sm transition-all active:scale-95"
        >
          詳しいInput Unitを開く
        </button>
      )}
    </div>
  );
}
