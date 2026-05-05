import React, { useState, useRef } from 'react';
import { Hash, Eye, Check, X, Zap } from 'lucide-react';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';

interface NumberRecallViewProps {
  card: any;
  onNext: () => void;
  sessionProgress: { current: number; total: number };
}

export function NumberRecallView({ card, onNext, sessionProgress }: NumberRecallViewProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const startTimeRef = useRef(Date.now());

  // 数字を伏せ字にする簡易ロジック
  const maskNumbers = (text: string) => {
    return text.replace(/[0-9]+/g, ' [ ? ] ');
  };

  const handleChoice = async (isCorrect: boolean, rating?: number) => {
    const responseTime = Date.now() - startTimeRef.current;
    const cardId = card.card_id || card.id;
    const finalRating = rating || (isCorrect ? 3 : 1);

    await recordStudyEvent({
      card_id: cardId,
      exam_type: card.exam_type || 'takken',
      category: card.category || '数字暗記',
      tags: card.tags || [],
      mode: 'number_recall',
      answered_correct: isCorrect,
      selected_answer: isCorrect,
      correct_answer: true,
      response_time_ms: responseTime,
      rating: finalRating,
      rating_source: 'explicit_user_rating'
    });
    
    // SRS更新 (FSRS adapter経由)
    await updateCardSRS(cardId, isCorrect, finalRating);

    setShowAnswer(false);
    onNext();
    startTimeRef.current = Date.now();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest">
          <Hash size={14} /> Number Recall
        </div>
        <div className="text-slate-400 text-xs font-bold">
          セッション: {sessionProgress.current} / {sessionProgress.total}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-soft p-10 md:p-16 border border-slate-100 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="absolute top-8 left-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          {card.category} / 数字重要論点
        </div>

        <div className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-12 whitespace-pre-wrap">
          {!showAnswer ? maskNumbers(card.question || card.rule || '') : (card.question || card.rule || '')}
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="group bg-amber-500 hover:bg-amber-600 text-white px-10 py-5 rounded-[24px] font-black text-lg shadow-glow-amber transition-all flex items-center gap-3 active:scale-95"
          >
            <Eye size={24} />
            数字を確認する
          </button>
        ) : (
          <div className="w-full space-y-12 animate-in zoom-in-95 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              <button
                onClick={() => handleChoice(false, 1)}
                className="p-4 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-[20px] font-black transition-all flex flex-col items-center gap-1 border-b-4 border-slate-200 hover:border-rose-200 active:scale-95"
              >
                <X size={24} />
                <span className="text-[10px] uppercase">Again</span>
                <span className="text-xs">まだ</span>
              </button>
              <button
                onClick={() => handleChoice(true, 2)}
                className="p-4 bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-orange-600 rounded-[20px] font-black transition-all flex flex-col items-center gap-1 border-b-4 border-slate-200 hover:border-orange-200 active:scale-95"
              >
                <Zap size={24} className="text-orange-400" />
                <span className="text-[10px] uppercase">Hard</span>
                <span className="text-xs">ギリギリ</span>
              </button>
              <button
                onClick={() => handleChoice(true, 3)}
                className="p-4 bg-amber-500 hover:bg-amber-400 text-white rounded-[20px] font-black transition-all flex flex-col items-center gap-1 border-b-4 border-amber-700 hover:border-amber-600 active:scale-95"
              >
                <Check size={24} />
                <span className="text-[10px] uppercase">Good</span>
                <span className="text-xs">覚えた</span>
              </button>
              <button
                onClick={() => handleChoice(true, 4)}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[20px] font-black transition-all flex flex-col items-center gap-1 border-b-4 border-emerald-800 hover:border-emerald-700 active:scale-95"
              >
                <Zap size={24} />
                <span className="text-[10px] uppercase">Easy</span>
                <span className="text-xs">簡単</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-amber-900/5 p-6 rounded-[24px] border border-amber-200/50 text-amber-900/70">
        <p className="text-xs leading-relaxed italic">「数字」は宅建試験・賃貸管理士試験の合否を分ける重要ポイントです。</p>
      </div>
    </div>
  );
}
