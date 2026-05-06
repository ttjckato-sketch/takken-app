import { useState, useRef, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Home, Zap, ChevronRight, BookOpen, List, Target, AlertTriangle, Shield } from 'lucide-react';
import { db, type UnderstandingCard, type SourceChoice } from '../../db';
import { AnalogyBlock } from './AnalogyBlock';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';
import { findRepairInputUnit } from '../../utils/inputUnitRepairMatcher';
import { RepairPreview } from './RepairPreview';
import { InputUnitViewer } from './InputUnitViewer';
import { classifyQuestionRenderMode, type QuestionRenderMode } from '../../utils/questionTypeClassifier';
import { buildStructuredExplanation, type StructuredExplanation } from '../../utils/explanationBuilder';

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
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [repairUnit, setRepairUnit] = useState<any>(null);
  const [showFullViewer, setShowFullViewer] = useState(false);
  const [sourceChoices, setSourceChoices] = useState<SourceChoice[]>([]);
  const [renderMode, setRenderMode] = useState<QuestionRenderMode>('TRUE_FALSE');
  const [structuredExp, setStructuredExplanation] = useState<StructuredExplanation | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const loadData = async () => {
        // Load Source Choices
        const choices = await db.source_choices
          .where('question_id')
          .equals(card.card_id.replace(/^CHINTAI-KC-/, '').replace(/^KC-/, ''))
          .toArray();
        setSourceChoices(choices);

        // Classify Mode
        const classification = classifyQuestionRenderMode(card, choices.length);
        setRenderMode(classification.mode);

        // Build Explanation
        const exp = buildStructuredExplanation(card, choices);
        setStructuredExplanation(exp);
    };
    loadData();
    
    // P42: 補修インプット候補を事前特定
    const match = findRepairInputUnit({
        cardId: card.card_id,
        tags: card.tags,
        category: card.category
    });
    setRepairUnit(match.unit);
  }, [card.card_id, card.tags, card.category]);

  const correctAnswer = useMemo(() => {
    if (renderMode === 'MCQ') {
      const correct = sourceChoices.find(c => c.is_exam_correct_option);
      return correct ? correct.option_no : null;
    }
    return card.is_statement_true;
  }, [renderMode, sourceChoices, card.is_statement_true]);

  const handleAnswer = (selected: boolean | number, rating?: number) => {
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
          <div className="space-y-4">
            {renderMode === 'MCQ' ? (
              <div className="grid grid-cols-1 gap-3">
                {sourceChoices.sort((a, b) => a.option_no - b.option_no).map(choice => (
                  <button 
                    key={choice.id}
                    onClick={() => handleAnswer(choice.option_no)} 
                    className="bg-white hover:bg-slate-50 text-slate-800 p-6 rounded-2xl font-bold text-left shadow-soft border border-slate-200 active:scale-[0.98] transition-all flex gap-4"
                  >
                    <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">{choice.option_no}</span>
                    <span className="flex-1 leading-relaxed">{choice.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAnswer(true)} className="bg-emerald-500 text-white py-10 rounded-3xl font-black text-2xl shadow-lg active:scale-95 transition-all">正しい (◯)</button>
                <button onClick={() => handleAnswer(false)} className="bg-rose-500 text-white py-10 rounded-3xl font-black text-2xl shadow-lg active:scale-95 transition-all">誤り (×)</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`p-8 rounded-[40px] text-center font-black text-3xl shadow-xl ${selectedAnswer === correctAnswer ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} relative overflow-hidden`}>
              {selectedAnswer === correctAnswer ? '正解！' : '不正解...'}
              
              {renderMode === 'MCQ' && (
                <div className="mt-2 text-sm font-bold opacity-60">正解は 選択肢 {correctAnswer} でした</div>
              )}
              
              {/* オプション評価ボタン */}
              <div className="mt-6 pt-6 border-t border-current/10 flex justify-center gap-2">
                  {[1, 2, 3, 4].map(r => (
                      <button key={r} onClick={() => updateRating(r)} className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-current/20 hover:bg-white/20 transition-all">
                          {r===1?'Again': r===2?'Hard': r===3?'Good':'Easy'}
                      </button>
                  ))}
              </div>
            </div>

            {/* P42: 誤答時の補修プレビュー (Chintai/Takken共通) */}
            {selectedAnswer !== correctAnswer && repairUnit && (
                <RepairPreview 
                    unit={repairUnit} 
                    onViewDetail={() => setShowFullViewer(true)}
                    onNext={handleNext}
                />
            )}

            {/* 解説セクション (構造化・Grounded) */}
            {(selectedAnswer === correctAnswer || !repairUnit) && structuredExp && (
                <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} /> 構造化解説 v3.7
                    </h3>
                    <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-black rounded border border-slate-700 uppercase tracking-tighter">
                            Mode: {renderMode}
                        </span>
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <div className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
                            <Target size={14} className="text-indigo-500" /> 法的結論
                        </div>
                        <div className="text-lg font-bold border-l-4 border-indigo-500 pl-4">{structuredExp.conclusion}</div>
                    </div>

                    <div>
                        <div className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
                            <BookOpen size={14} className="text-indigo-500" /> 制度の本質と理由
                        </div>
                        <div className="text-slate-300 leading-relaxed pl-4 whitespace-pre-wrap">{structuredExp.reason}</div>
                    </div>

                    {renderMode === 'MCQ' && structuredExp.choice_details && (
                        <div className="space-y-4">
                            <div className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <List size={14} className="text-indigo-500" /> 選択肢別解説
                            </div>
                            <div className="grid grid-cols-1 gap-3 pl-2">
                                {structuredExp.choice_details.map(choice => (
                                    <div key={choice.option_no} className={`p-4 rounded-2xl border ${choice.is_correct ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${choice.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                肢 {choice.option_no}
                                            </span>
                                            <span className={`text-[10px] font-bold ${choice.is_correct ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {choice.is_correct ? '【正解】' : '【誤り】'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 mb-2 leading-tight">{choice.text}</div>
                                        <div className="text-xs font-bold text-slate-200">{choice.explanation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Shield size={14} className="text-indigo-500" /> 前提知識
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed pl-4">{structuredExp.prerequisite}</div>
                        </div>
                        <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                            <div className="text-xs font-black text-rose-400 uppercase mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> 試験の罠
                            </div>
                            <div className="text-xs text-rose-200 leading-relaxed">{structuredExp.trap_point}</div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                        <div className="text-[10px] font-black text-slate-600 uppercase italic">
                            {structuredExp.source}
                        </div>
                        <button onClick={handleNext} className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-glow">
                            次の問題へ <ChevronRight size={20} />
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
