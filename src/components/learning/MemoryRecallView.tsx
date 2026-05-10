import React, { useState, useRef } from 'react';
import { Brain, Check, X, Eye, Zap } from 'lucide-react';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';
import { UnderstandingSyncViewer } from './UnderstandingSyncViewer';
import { TAKKEN_PROTOTYPE_UNITS } from '../../utils/inputUnitPrototypes';
import { InputUnit } from '../../types/inputUnit';

interface MemoryRecallViewProps {
  card: any;
  onNext: () => void;
  sessionProgress: { current: number; total: number };
}

export function MemoryRecallView({ card, onNext, sessionProgress }: MemoryRecallViewProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [syncUnit, setSyncUnit] = useState<InputUnit | null>(null);
  const startTimeRef = useRef(Date.now());

  const handleChoice = async (isCorrect: boolean, rating?: number) => {
    const responseTime = Date.now() - startTimeRef.current;
    
    const cardId = card.card_id || card.memory_card_id || card.id || card.unit_id || card.asset_id;
    const finalRating = rating || (isCorrect ? 3 : 1);

    await recordStudyEvent({
      card_id: cardId,
      exam_type: card.exam_type,
      category: card.category,
      tags: card.tags,
      mode: card.session_mode || 'memory_recall',
      answered_correct: isCorrect,
      selected_answer: isCorrect,
      correct_answer: true,
      response_time_ms: responseTime,
      rating: finalRating,
      rating_source: 'explicit_user_rating'
    });
    
    // SRS更新
    await updateCardSRS(cardId, isCorrect, finalRating);

    // HQ-Sync: 正解かつTrapカードなら関連図解を探す
    if (isCorrect && card.card_type === 'trap') {
        const unit = TAKKEN_PROTOTYPE_UNITS.find(u => u.unit_id === card.unit_id);
        if (unit) {
            setSyncUnit(unit);
            return; // 描画を優先
        }
    }

    setShowAnswer(false);
    onNext();
    startTimeRef.current = Date.now();
  };

  const handleCloseSync = () => {
    setSyncUnit(null);
    setShowAnswer(false);
    onNext();
    startTimeRef.current = Date.now();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {syncUnit && (
        <UnderstandingSyncViewer 
          unit={syncUnit}
          onClose={() => setSyncUnit(null)}
          onNext={handleCloseSync}
        />
      )}

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
          <Brain size={14} /> Memory Recall
        </div>
        <div className="text-slate-400 text-xs font-bold">
          セッション: {sessionProgress.current} / {sessionProgress.total}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-soft p-10 md:p-16 border border-slate-100 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="absolute top-8 left-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          {card.category} / {card.card_type}
        </div>

        <div className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-12 whitespace-pre-wrap">
          {card.question}
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="group bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[24px] font-black text-lg shadow-glow hover:shadow-glow-lg transition-all flex items-center gap-3 active:scale-95"
          >
            <Eye size={24} />
            答えを見る
          </button>
        ) : (
          <div className="w-full space-y-12 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-50 rounded-[32px] border-2 border-indigo-100 text-xl font-black text-indigo-900">
              {card.answer}
            </div>

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
                <Brain size={24} />
                <span className="text-[10px] uppercase">Hard</span>
                <span className="text-xs">ギリギリ</span>
              </button>
              <button
                onClick={() => handleChoice(true, 3)}
                className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] font-black transition-all flex flex-col items-center gap-1 border-b-4 border-indigo-800 hover:border-indigo-700 active:scale-95"
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
      
      <div className="bg-slate-900/5 p-6 rounded-[24px] border border-slate-200/50">
        <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Source Context</div>
        <p className="text-xs text-slate-500 leading-relaxed italic">"{card.source_text}"</p>
      </div>
    </div>
  );
}
