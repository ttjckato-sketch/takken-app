import React, { useEffect, useState } from 'react';
import { Layers, ChevronRight, Zap } from 'lucide-react';
import { type UnderstandingCard } from '../../db';
import { findSimilarQuestions } from '../../utils/similarQuestionCluster';

interface SimilarQuestionsPanelProps {
  card: UnderstandingCard;
  onSelect: (card: UnderstandingCard) => void;
}

export const SimilarQuestionsPanel: React.FC<SimilarQuestionsPanelProps> = ({ card, onSelect }) => {
  const [similarCards, setSimilarCards] = useState<UnderstandingCard[]>([]);

  useEffect(() => {
    const load = async () => {
      const results = await findSimilarQuestions(card);
      setSimilarCards(results);
    };
    load();
  }, [card.card_id]);

  if (similarCards.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          <Layers size={18} className="text-indigo-500" />
          <h4 className="text-xs font-black uppercase tracking-widest">Similar Questions</h4>
        </div>
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded border border-indigo-100">
          {similarCards.length} Cards Found
        </span>
      </div>

      <div className="space-y-3">
        {similarCards.map(c => (
          <button 
            key={c.card_id}
            onClick={() => onSelect(c)}
            className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
              Q
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed">
                {c.sample_question || c.core_knowledge?.rule}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">#{c.category}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 mt-1" />
          </button>
        ))}
      </div>

      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
        <Zap size={16} className="text-amber-500" />
        <p className="text-[10px] font-bold text-amber-700 leading-tight">
          似た論点をまとめて解くことで、制度の「適用範囲」と「例外」の区別が明確になります。
        </p>
      </div>
    </div>
  );
};
