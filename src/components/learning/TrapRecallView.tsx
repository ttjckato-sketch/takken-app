import React, { useState, useRef } from 'react';
import { AlertTriangle, Check, X, Eye, Zap, Info } from 'lucide-react';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';

interface TrapRecallViewProps {
  card: any;
  onNext: () => void;
  sessionProgress: { current: number; total: number };
}

export function TrapRecallView({ card, onNext, sessionProgress }: TrapRecallViewProps) {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());

  const handleChoice = async (isCorrect: boolean, rating?: number) => {
    const responseTime = Date.now() - startTimeRef.current;
    const cardId = card.card_id || card.id;
    const finalRating = rating || (isCorrect ? 3 : 1);

    await recordStudyEvent({
      card_id: cardId,
      exam_type: card.exam_type || 'takken',
      category: card.category || 'ひっかけ注意',
      tags: card.tags || [],
      mode: 'trap_recall',
      answered_correct: isCorrect,
      selected_answer: isCorrect,
      correct_answer: true,
      response_time_ms: responseTime,
      rating: finalRating,
      rating_source: 'explicit_user_rating'
    });
    
    // SRS更新
    await updateCardSRS(cardId, isCorrect, finalRating);

    setHasAnswered(true);
  };

  const handleNext = () => {
    setHasAnswered(false);
    onNext();
    startTimeRef.current = Date.now();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-black uppercase tracking-widest">
          <AlertTriangle size={14} /> Trap Recall
        </div>
        <div className="text-slate-400 text-xs font-bold">
          セッション: {sessionProgress.current} / {sessionProgress.total}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-soft p-10 md:p-16 border border-slate-100 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="absolute top-8 left-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          {card.category} / ひっかけ・注意点
        </div>

        <div className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-12 whitespace-pre-wrap">
          {card.statement}
        </div>

        {!hasAnswered ? (
          <div className="w-full space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">この文章は正しいですか？</div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => handleChoice(true, 3)}
                className="p-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black transition-all flex flex-col items-center gap-2 border-b-4 border-emerald-800 hover:border-emerald-700 active:scale-95"
              >
                <Check size={32} />
                <span className="text-sm">正しい</span>
              </button>
              <button
                onClick={() => handleChoice(false, 1)}
                className="p-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[24px] font-black transition-all flex flex-col items-center gap-2 border-b-4 border-rose-800 hover:border-rose-700 active:scale-95"
              >
                <X size={32} />
                <span className="text-sm">罠がある (誤り)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-12 animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 bg-rose-50 rounded-[32px] border-2 border-rose-100 text-left space-y-6">
              <div>
                <div className="text-[10px] font-black text-rose-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                  <Zap size={12} /> Trap Point
                </div>
                <p className="text-lg font-bold text-rose-900 leading-tight">{card.trap_point}</p>
              </div>
              
              <div className="pt-6 border-t border-rose-200/50">
                <div className="text-[10px] font-black text-emerald-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                  <Check size={12} /> Correct Rule
                </div>
                <p className="text-md font-bold text-slate-800 leading-relaxed">{card.correct_rule}</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-3xl font-black text-xl shadow-xl transition-all active:scale-95"
            >
              次へ進む
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-rose-900/5 p-6 rounded-[24px] border border-rose-200/50 text-rose-900/70">
        <p className="text-xs leading-relaxed italic">罠（Trap）は「誤り」の選択肢そのものです。なぜ誤りなのかを瞬時に見抜くことが合格への近道です。</p>
      </div>
    </div>
  );
}
