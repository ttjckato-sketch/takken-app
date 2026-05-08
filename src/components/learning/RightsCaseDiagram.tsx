import React from 'react';
import { User, Box, AlertTriangle, ShieldAlert } from 'lucide-react';
import { analyzeRightsCase } from '../../utils/rightsCaseAnalyzer';

interface RightsCaseDiagramProps {
  text: string;
  category: string;
  mode?: 'before_answer' | 'after_answer';
}

export const RightsCaseDiagram: React.FC<RightsCaseDiagramProps> = ({ text, category, mode = 'after_answer' }) => {
  const analysis = analyzeRightsCase(text, category);

  if (!analysis.is_rights_case) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 mt-4 space-y-4">
      <div className="flex items-center gap-2 text-indigo-500 mb-2">
        <ShieldAlert size={16} />
        <h4 className="text-[10px] font-black uppercase tracking-widest">Rights Case Analysis</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {analysis.expressor && (
          <div className="bg-white p-3 rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-sm">
            <User className="text-indigo-400" size={16} />
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">表意者</div>
              <div className="text-sm font-bold text-slate-700">{analysis.expressor}</div>
            </div>
          </div>
        )}
        
        {analysis.counterparty && (
          <div className="bg-white p-3 rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-sm">
            <User className="text-indigo-400" size={16} />
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">相手方</div>
              <div className="text-sm font-bold text-slate-700">{analysis.counterparty}</div>
            </div>
          </div>
        )}

        {analysis.object && (
          <div className="col-span-2 bg-white p-3 rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-sm">
            <Box className="text-amber-500" size={16} />
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">対象物</div>
              <div className="text-sm font-bold text-slate-700">{analysis.object}</div>
            </div>
          </div>
        )}
      </div>

      {mode === 'after_answer' && (
        <div className="mt-4 space-y-3 pt-4 border-t border-indigo-100/50">
          {analysis.claimant && (
            <div className="bg-white/60 p-4 rounded-xl border border-indigo-100">
              <div className="text-[10px] font-black text-indigo-500 uppercase mb-1">主張者</div>
              <div className="text-sm font-bold text-slate-700">{analysis.claimant} が権利を主張している</div>
            </div>
          )}
          
          {analysis.right_holder && (
            <div className="bg-white/60 p-4 rounded-xl border border-indigo-100">
              <div className="text-[10px] font-black text-indigo-500 uppercase mb-1">真の権利者 / 保護対象</div>
              <div className="text-sm font-bold text-slate-700">{analysis.right_holder}</div>
            </div>
          )}

          {analysis.why_cannot_claim && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
              <div className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 mb-1">
                <AlertTriangle size={12} /> なぜ主張が認められないか
              </div>
              <div className="text-xs font-bold text-rose-800 leading-relaxed">{analysis.why_cannot_claim}</div>
            </div>
          )}

          {analysis.gross_negligence_position && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <div className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1 mb-1">
                <AlertTriangle size={12} /> 重過失の扱い
              </div>
              <div className="text-xs font-bold text-amber-800 leading-relaxed">{analysis.gross_negligence_position}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
