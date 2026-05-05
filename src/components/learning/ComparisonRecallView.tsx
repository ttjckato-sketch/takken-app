import React, { useState, useRef } from 'react';
import { Columns, Eye, Check, X, Zap, ArrowLeftRight } from 'lucide-react';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';

interface ComparisonRecallViewProps {
  card: any;
  onNext: () => void;
  sessionProgress: { current: number; total: number };
}

export function ComparisonRecallView({ card, onNext, sessionProgress }: ComparisonRecallViewProps) {
  const [hasRevealed, setHasRevealed] = useState(false);
  const startTimeRef = useRef(Date.now());

  const handleRating = async (rating: number) => {
    const responseTime = Date.now() - startTimeRef.current;
    const cardId = card.card_id || card.id;
    const isCorrect = rating >= 3;

    await recordStudyEvent({
      card_id: cardId,
      exam_type: card.exam_type || 'cross',
      category: card.category || '概念比較',
      tags: card.tags || [],
      mode: 'comparison_recall',
      answered_correct: isCorrect,
      selected_answer: isCorrect,
      correct_answer: true,
      response_time_ms: responseTime,
      rating: rating,
      rating_source: 'explicit_user_rating'
    });
    
    // SRS更新
    await updateCardSRS(cardId, isCorrect, rating);

    onNext();
    setHasRevealed(false);
    startTimeRef.current = Date.now();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
          <ArrowLeftRight size={14} /> Comparison Recall
        </div>
        <div className="text-slate-400 text-xs font-bold">
          セッション: {sessionProgress.current} / {sessionProgress.total}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-soft p-8 md:p-12 border border-slate-100 relative overflow-hidden min-h-[500px] flex flex-col">
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8">
          {card.topic} / 決定的な違い
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
            <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 flex flex-col items-center justify-center min-h-[160px]">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-tighter">CONCEPT A</div>
              <div className="text-2xl font-black text-slate-800">{card.item_a}</div>
            </div>
            
            <div className="hidden md:flex items-center justify-center">
              <div className="w-12 h-12 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <ArrowLeftRight size={24} />
              </div>
            </div>

            <div className="p-8 bg-indigo-50 rounded-[32px] border-2 border-indigo-100 flex flex-col items-center justify-center min-h-[160px]">
              <div className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-tighter">CONCEPT B</div>
              <div className="text-2xl font-black text-indigo-800">{card.item_b}</div>
            </div>
          </div>

          <div className="text-xl font-bold text-slate-600">
            この2つの違いを正確に説明できますか？
          </div>
        </div>

        {!hasRevealed ? (
          <button
            onClick={() => setHasRevealed(true)}
            className="mt-12 w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-3xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Eye size={24} /> 違いを確認する
          </button>
        ) : (
          <div className="mt-12 w-full space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 bg-amber-50 rounded-[32px] border-2 border-amber-100 space-y-6">
              <div>
                <div className="text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                  <Zap size={12} /> Key Difference
                </div>
                <p className="text-lg font-bold text-slate-800 leading-tight">{card.difference_point}</p>
              </div>

              {card.comparison_table && card.comparison_table.length > 0 && (
                <div className="overflow-x-auto pt-4 border-t border-amber-200/50">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-amber-200/50">
                        <th className="pb-2 pr-4">項目</th>
                        <th className="pb-2 pr-4">{card.item_a}</th>
                        <th className="pb-2">{card.item_b}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200/30">
                      {card.comparison_table.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="py-3 pr-4 font-bold text-slate-500">{row.feature}</td>
                          <td className="py-3 pr-4 text-slate-800">{row.left}</td>
                          <td className="py-3 text-slate-800">{row.right}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {card.trap_point && (
                <div className="pt-6 border-t border-amber-200/50">
                  <div className="text-[10px] font-black text-rose-500 uppercase mb-2 tracking-widest">⚠️ 混同注意</div>
                  <p className="text-sm font-bold text-rose-900 leading-relaxed">{card.trap_point}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRating(1)}
                className="p-6 bg-white hover:bg-rose-50 text-rose-600 rounded-[24px] font-black transition-all flex flex-col items-center gap-2 border-4 border-rose-100 hover:border-rose-200 active:scale-95"
              >
                <X size={32} />
                <span className="text-sm">まだ曖昧</span>
              </button>
              <button
                onClick={() => handleRating(3)}
                className="p-6 bg-white hover:bg-emerald-50 text-emerald-600 rounded-[24px] font-black transition-all flex flex-col items-center gap-2 border-4 border-emerald-100 hover:border-emerald-200 active:scale-95"
              >
                <Check size={32} />
                <span className="text-sm">覚えた！</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-indigo-900/5 p-6 rounded-[24px] border border-indigo-200/50 text-indigo-900/70">
        <p className="text-xs leading-relaxed italic">「似ているもの」をセットで覚えることが、法務試験におけるケアレスミスを防ぐ最強の武器になります。</p>
      </div>
    </div>
  );
}
