import React from 'react';
import { User, Box, ArrowRightLeft, Info, HelpCircle } from 'lucide-react';
import { decomposeQuestion } from '../../utils/questionDecomposer';

interface QuestionBreakdownPanelProps {
  text: string;
  category: string;
  mode?: 'before_answer' | 'after_answer';
}

export const QuestionBreakdownPanel: React.FC<QuestionBreakdownPanelProps> = ({ text, category, mode = 'after_answer' }) => {
  const breakdown = decomposeQuestion(text, category);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 space-y-6">
      <div className="flex items-center gap-2 text-slate-500">
        <HelpCircle size={16} />
        <h4 className="text-[10px] font-black uppercase tracking-widest">Question Breakdown</h4>
        {mode === 'before_answer' && (
            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full ml-2">
                読解補助
            </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parties */}
        <div className="space-y-3">
          <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
            <User size={12} /> 登場人物 (Parties)
          </div>
          <div className="flex flex-wrap gap-2">
            {breakdown.parties.length > 0 ? breakdown.parties.map((p, i) => (
              <div key={i} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                <span className="text-indigo-500 mr-2">{p.label}</span>
                <span className="text-[10px] text-slate-400">{p.role}</span>
              </div>
            )) : (
              <div className="text-[10px] text-slate-400 italic">抽象的な論点問題です</div>
            )}
          </div>
        </div>

        {/* Objects */}
        <div className="space-y-3">
          <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
            <Box size={12} /> 対象物 (Objects)
          </div>
          <div className="flex flex-wrap gap-2">
            {breakdown.objects.length > 0 ? breakdown.objects.map((o, i) => (
              <div key={i} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                {o}
              </div>
            )) : (
              <div className="text-[10px] text-slate-400 italic">具体的な対象はありません</div>
            )}
          </div>
        </div>
      </div>

      {mode === 'after_answer' && (
          <>
            <div className="pt-4 border-t border-slate-200">
              <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                <Info size={12} /> 出題の狙い (Intent)
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                {breakdown.intent}
              </p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div className="text-[9px] font-black text-indigo-400 uppercase mb-1">論理構造</div>
              <p className="text-xs font-bold text-indigo-700 leading-relaxed italic">
                {breakdown.conclusion_summary}
              </p>
            </div>
          </>
      )}
    </div>
  );
};
