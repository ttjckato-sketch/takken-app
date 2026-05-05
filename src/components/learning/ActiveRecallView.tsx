import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Home, Zap, ChevronRight, BookOpen } from 'lucide-react';
import { db, type UnderstandingCard } from '../../db';
import { AnalogyBlock } from './AnalogyBlock';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';
import { findRepairInputUnit } from '../../utils/inputUnitRepairMatcher';
import { RepairPreview } from './RepairPreview';
import { InputUnitViewer } from './InputUnitViewer';

interface SessionProgress { current: number; total: number; }
interface CategoryProgress { total: number; learned: number; due: number; streak: number; todayStudied: number; accuracy: number; totalReviews: number; }
interface QuestionMeta { category: string; tags: string[]; cardId: string; }

interface ActiveRecallViewProps {
  card: UnderstandingCard;
  onAnswer: (correct: boolean, mistakeNote?: string) => void;
  onNext: () => void;
  sessionProgress: SessionProgress;
  categoryProgress: CategoryProgress;
  questionMeta: QuestionMeta;
}

export function ActiveRecallView({ card, onAnswer, onNext, sessionProgress, categoryProgress, questionMeta }: ActiveRecallViewProps) {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [mistakeNote, setMistakeNote] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [enhanced, setEnhanced] = useState<any>(null);
  const [repairUnit, setRepairUnit] = useState<any>(null);
  const [showFullViewer, setShowFullViewer] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const loadEnhanced = async () => {
        const record = await db.enhanced_explanations.get(`EE-${card.card_id}`);
        if (record) setEnhanced(record.enhanced);
        else setEnhanced(null);
    };
    loadEnhanced();
    
    // P42: 補修インプット候補を事前特定
    const match = findRepairInputUnit({
        cardId: card.card_id,
        tags: card.tags,
        category: card.category
    });
    setRepairUnit(match.unit);
  }, [card.card_id, card.tags, card.category]);

  const correctAnswer = card.is_statement_true;

  const handleAnswer = (selected: boolean, rating?: number) => {
    const isCorrect = selected === correctAnswer;
    setSelectedAnswer(selected);
    setHasAnswered(true);
    
    const finalRating = rating || (isCorrect ? 3 : 1);

    const eventParams: any = {
      card_id: card.card_id,
      exam_type: card.exam_type || 'takken',
      category: card.category,
      tags: card.tags,
      mode: 'active_recall',
      answered_correct: isCorrect,
      selected_answer: selected,
      correct_answer: correctAnswer === undefined ? null : correctAnswer,
      response_time_ms: Date.now() - startTimeRef.current,
      rating: finalRating,
      rating_source: rating ? 'explicit_user_rating' : 'boolean_default'
    };

    // P42: 補修監査情報の付与
    if (!isCorrect && repairUnit) {
        eventParams.repair_preview_eligible = true;
        eventParams.repair_unit_id = repairUnit.unit_id;
    }

    recordStudyEvent(eventParams);
    
    updateCardSRS(card.card_id, isCorrect, finalRating);
    if (isCorrect) onAnswer(true);
  };

  const updateRating = (rating: number) => {
      // 既に回答済みの場合、Ratingを上書き更新
      const isCorrect = selectedAnswer === correctAnswer;
      recordStudyEvent({
        card_id: card.card_id,
        exam_type: card.exam_type || 'takken',
        category: card.category,
        tags: card.tags,
        mode: 'active_recall',
        answered_correct: isCorrect,
        selected_answer: selectedAnswer,
        correct_answer: correctAnswer === undefined ? null : correctAnswer,
        response_time_ms: Date.now() - startTimeRef.current,
        rating: rating,
        rating_source: 'explicit_user_rating'
      });
      updateCardSRS(card.card_id, isCorrect, rating);
  };

  const handleNext = () => {
    setIsExiting(true);
    setTimeout(() => { 
        onNext(); 
        setIsExiting(false); 
        setHasAnswered(false); 
        setSelectedAnswer(null); 
        setMistakeNote('');
        setRepairUnit(null);
        setShowFullViewer(false);
    }, 300);
  };

  if (showFullViewer && repairUnit) {
      return (
          <InputUnitViewer 
            unit={repairUnit} 
            onClose={() => setShowFullViewer(false)} 
            onStartFocus={() => {
                setShowFullViewer(false);
                handleNext();
            }}
          />
      );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-4 md:p-8 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100">
          <div className="text-xs font-black text-slate-400 uppercase mb-4">{card.category} | {card.tags?.join(', ')}</div>
          <div className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">{card.sample_question || card.core_knowledge.rule}</div>
        </div>

        {!hasAnswered ? (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAnswer(true)} className="bg-emerald-500 text-white py-10 rounded-3xl font-black text-2xl shadow-lg active:scale-95 transition-all">正しい (◯)</button>
            <button onClick={() => handleAnswer(false)} className="bg-rose-500 text-white py-10 rounded-3xl font-black text-2xl shadow-lg active:scale-95 transition-all">誤り (×)</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`p-8 rounded-[40px] text-center font-black text-3xl shadow-xl ${selectedAnswer === correctAnswer ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} relative overflow-hidden`}>
              {selectedAnswer === correctAnswer ? '正解！' : '不正解...'}
              
              {/* オプション評価ボタン */}
              <div className="mt-6 pt-6 border-t border-current/10 flex justify-center gap-2">
                  {[1, 2, 3, 4].map(r => (
                      <button key={r} onClick={() => updateRating(r)} className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-current/20 hover:bg-white/20 transition-all">
                          {r===1?'Again': r===2?'Hard': r===3?'Good':'Easy'}
                      </button>
                  ))}
              </div>
            </div>

            {/* P42: 誤答時の補修プレビュー */}
            {selectedAnswer !== correctAnswer && (
                <RepairPreview 
                    unit={repairUnit} 
                    onViewDetail={() => setShowFullViewer(true)}
                    onNext={handleNext}
                />
            )}

            {/* 正解時、または補修ユニットがない場合の基本解説 */}
            {(selectedAnswer === correctAnswer || !repairUnit) && (
                <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} /> {enhanced ? 'Grounded 構造化解説 v2' : '基本解説'}
                    </h3>
                    {enhanced?.requires_human_review && (
                    <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">要確認</span>
                    )}
                </div>
                
                <div className="space-y-8">
                    {enhanced?.conclusion && (
                    <div>
                        <div className="text-xs font-black text-slate-500 uppercase mb-2">⚖️ 法的結論 (根拠あり)</div>
                        <div className="text-lg font-bold border-l-4 border-indigo-500 pl-4">{enhanced.conclusion}</div>
                    </div>
                    )}

                    {enhanced?.essence && (
                    <div>
                        <div className="text-xs font-black text-slate-500 uppercase mb-2">💡 制度の本質</div>
                        <div className="text-slate-300 leading-relaxed pl-4">{enhanced.essence}</div>
                    </div>
                    )}

                    {enhanced?.requirements && enhanced.requirements.length > 0 && (
                    <div>
                        <div className="text-xs font-black text-slate-500 uppercase mb-2">📋 成立要件</div>
                        <ul className="list-disc list-inside text-slate-300 space-y-1 pl-4">
                        {enhanced.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    )}

                    {enhanced?.traps && enhanced.traps.length > 0 && (
                    <div className="bg-rose-500/10 p-6 rounded-3xl border border-rose-500/20">
                        <div className="text-xs font-black text-rose-400 uppercase mb-2">⚠️ 試験のひっかけ</div>
                        <ul className="text-rose-200 space-y-1">{enhanced.traps.map((t: string, i: number) => <li key={i}>・{t}</li>)}</ul>
                    </div>
                    )}

                    {/* アナロジーは補助イメージに格下げ */}
                    <div className="pt-6 border-t border-white/10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2 italic">補助イメージ (Analogy)</div>
                    <div className="text-xs text-slate-400">{card.core_knowledge?.essence?.slice(0, 100)}...</div>
                    </div>

                    <div className="pt-6">
                    <button onClick={handleNext} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black text-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                        次の問題へ <ChevronRight size={24} />
                    </button>
                    </div>
                </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
