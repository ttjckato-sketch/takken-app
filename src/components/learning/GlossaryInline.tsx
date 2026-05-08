import React, { useState } from 'react';
import { Book, X, HelpCircle } from 'lucide-react';
import { findGlossaryTerms, GlossaryTerm } from '../../utils/legalGlossary';

interface GlossaryInlineProps {
  text: string;
}

export const GlossaryInline: React.FC<GlossaryInlineProps> = ({ text }) => {
  const terms = findGlossaryTerms(text);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  if (terms.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {terms.map(t => (
        <button 
          key={t.term}
          onClick={() => setSelectedTerm(t)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-full text-[10px] font-black border border-slate-200 hover:border-indigo-200 transition-all active:scale-95"
        >
          <Book size={10} /> {t.term}
        </button>
      ))}

      {selectedTerm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm p-6 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-slate-900 p-8 text-white relative">
              <button 
                onClick={() => setSelectedTerm(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Legal Glossary</div>
                <h3 className="text-3xl font-black">{selectedTerm.term}</h3>
                {selectedTerm.reading && <p className="text-slate-400 text-xs font-bold">{selectedTerm.reading}</p>}
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Book size={12} className="text-indigo-500" /> 正式な意味
                </div>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {selectedTerm.meaning}
                </p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-2">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle size={12} /> かみ砕いた説明
                </div>
                <p className="text-sm font-bold text-indigo-900 leading-relaxed italic">
                  {selectedTerm.layman_explanation}
                </p>
              </div>
              <button 
                onClick={() => setSelectedTerm(null)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
