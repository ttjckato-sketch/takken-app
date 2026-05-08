import React from 'react';
import { Compass, ShieldCheck, Target, Zap } from 'lucide-react';
import { buildLegalContext } from '../../utils/legalContextBuilder';

interface LegalContextPanelProps {
  category: string;
}

export const LegalContextPanel: React.FC<LegalContextPanelProps> = ({ category }) => {
  const context = buildLegalContext(category);

  if (!context) return null;

  return (
    <div className="bg-indigo-600 text-white rounded-[40px] p-8 md:p-10 shadow-glow relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
        <Compass size={240} />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/30 rounded-full text-indigo-100 text-[10px] font-black uppercase tracking-widest border border-indigo-400/30">
            <ShieldCheck size={12} /> Legal Background
          </div>
          <h3 className="text-3xl font-black leading-tight tracking-tighter">
            {context.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} /> 制度の目的
              </div>
              <p className="text-sm font-bold text-white/90 leading-relaxed">
                {context.purpose}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} /> 試験のポイント
              </div>
              <p className="text-sm font-bold text-white/90 leading-relaxed italic">
                {context.exam_focus}
              </p>
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md space-y-4">
            <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
              活用される場面
            </div>
            <p className="text-xs font-bold text-indigo-50/80 leading-relaxed italic">
              "{context.typical_scenario}"
            </p>
            <div className="pt-2 border-t border-white/10 text-[9px] font-black text-indigo-300 uppercase">
              対象: {context.protected_party}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
