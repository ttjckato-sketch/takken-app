import { useState, useRef, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Home, Zap, ChevronRight, BookOpen, List, Target, AlertTriangle, Shield, Lightbulb, Database } from 'lucide-react';
import { db, type UnderstandingCard, type SourceChoice } from '../../db';
import { AnalogyBlock } from './AnalogyBlock';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';
import { findRepairInputUnit } from '../../utils/inputUnitRepairMatcher';
import { resolveExplanationPack, type ExplanationMatchResult } from '../../utils/explanationMatcher';
import { ExplanationRepairPanel } from './ExplanationRepairPanel';
import { InputUnitViewer } from './InputUnitViewer';
import { QuestionUnderstandingAid } from './QuestionUnderstandingAid';
import { classifyQuestionRenderMode, type QuestionRenderMode } from '../../utils/questionTypeClassifier';
import { buildLearningContentContract } from '../../utils/explanationBuilder';
import { type LearningContentContract } from '../../utils/learningContentContract';
import { QuestionBreakdownPanel } from './QuestionBreakdownPanel';
import { RightsCaseDiagram } from './RightsCaseDiagram';
import { GlossaryInline } from './GlossaryInline';
import { LegalContextPanel } from './LegalContextPanel';
import { SimilarQuestionsPanel } from './SimilarQuestionsPanel';
import { findSimilarQuestions } from '../../utils/similarQuestionCluster';

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

function getSourceQuestionId(cardId: string): string {
  return cardId.replace(/^CHINTAI-KC-/, '').replace(/^KC-/, '');
}

export function ActiveRecallView({ card, onAnswer, onNext, sessionProgress, categoryProgress, questionMeta }: ActiveRecallViewProps) {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [repairUnit, setRepairUnit] = useState<any>(null);
  const [showFullViewer, setShowFullViewer] = useState(false);
  const [sourceChoices, setSourceChoices] = useState<SourceChoice[]>([]);
  const [renderMode, setRenderMode] = useState<QuestionRenderMode>('TRUE_FALSE');
  const [contract, setContract] = useState<LearningContentContract | null>(null);
  const [explanationMatch, setExplanationMatch] = useState<ExplanationMatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const loadData = async () => {
        setIsLoading(true);
        // Load Source Choices
        const baseId = getSourceQuestionId(card.card_id);
        const choices = await db.source_choices
          .where('question_id')
          .equals(baseId)
          .toArray();
        setSourceChoices(choices);

        // Classify Mode
        const classification = classifyQuestionRenderMode(card, choices.length);
        setRenderMode(classification.mode);

        // Build Initial Explanation (User answer is null initially)
        const initialContract = buildLearningContentContract(card, choices, null);
        setContract(initialContract);
        setExplanationMatch(null);
        setIsLoading(false);
    };
    loadData();

    // P42: 補修インプット候補を事前特定（v29: DB統合対応）
    const loadRepairUnit = async () => {
        const match = await findRepairInputUnit({
            cardId: card.card_id,
            tags: card.tags,
            category: card.category
        });
        setRepairUnit(match.unit);
    };
    loadRepairUnit();
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
    setExplanationMatch(null);
    
    // Re-build contract with user answer to generate mistake diagnosis
    const updatedContract = buildLearningContentContract(card, sourceChoices, selected);
    setContract(updatedContract);
    
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
      rating_source: rating ? 'explicit_user_rating' : 'boolean_default',
      mistake_type: updatedContract.mistake_diagnosis?.mistake_type,
      render_mode: updatedContract.render_mode
    };

    if (!isCorrect && repairUnit) {
        eventParams.repair_preview_eligible = true;
        eventParams.repair_unit_id = repairUnit.unit_id;
    }

    recordStudyEvent(eventParams);
    updateCardSRS(card.card_id, isCorrect, finalRating);
    if (isCorrect) onAnswer(true);

    // Always resolve explanation pack for consistent UI
    const selectedChoice = typeof selected === 'number'
      ? sourceChoices.find(choice => choice.option_no === selected)
      : null;
    const cardSourceChoiceId = card.source_choice_id || (card as any).sourceChoiceId || null;
    const cardQuestionId = (card as any).source_question_id || (card as any).question_id || getSourceQuestionId(card.card_id);
    const selectedSourceChoiceId = (selectedChoice as any)?.source_choice_id || selectedChoice?.id || null;

    resolveExplanationPack({
      sourceChoiceId: cardSourceChoiceId || selectedSourceChoiceId,
      choiceId: selectedChoice?.id || cardSourceChoiceId || (card as any).sourceChoiceId,
      sourceQuestionId: cardQuestionId,
      questionId: cardQuestionId,
      cardId: card.card_id,
      category: card.category,
      tags: card.tags,
      examType: card.exam_type || 'unknown'
    }).then((match) => {
      setExplanationMatch(match);
      if (!repairUnit && match.repairUnit) {
        setRepairUnit(match.repairUnit);
      }
    }).catch((error) => {
      console.error('[ActiveRecallView] explanation match failed:', error);
    });
  };

  // handleFSRSRating: FSRS button pressed -> save rating -> advance to next card
  const handleFSRSRating = (rating: number) => {
    if (isSubmittingRating) return; // prevent double-click
    setIsSubmittingRating(true);

    const isCorrect = selectedAnswer === correctAnswer;
    const eventParams: any = {
      card_id: card.card_id,
      exam_type: card.exam_type || 'takken',
      category: card.category,
      tags: card.tags,
      mode: 'active_recall',
      answered_correct: isCorrect,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer === undefined ? null : correctAnswer,
      response_time_ms: Date.now() - startTimeRef.current,
      rating,
      rating_source: 'explicit_user_rating',
      mistake_type: contract?.mistake_diagnosis?.mistake_type,
      render_mode: contract?.render_mode
    };
    if (!isCorrect && repairUnit) {
      eventParams.repair_preview_eligible = true;
      eventParams.repair_unit_id = repairUnit.unit_id;
    }
    recordStudyEvent(eventParams);
    updateCardSRS(card.card_id, isCorrect, rating);

    // Advance to next card after a brief animation delay
    setIsExiting(true);
    setTimeout(() => {
      setIsSubmittingRating(false);
      setIsExiting(false);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setRepairUnit(null);
      setExplanationMatch(null);
      setShowFullViewer(false);
      setContract(null);
      onNext();
    }, 300);
  };

  const handleNext = () => {
    setIsExiting(true);
    setTimeout(() => { 
        onNext(); 
        setIsExiting(false); 
        setHasAnswered(false); 
        setSelectedAnswer(null); 
        setRepairUnit(null);
        setExplanationMatch(null);
        setShowFullViewer(false);
    }, 300);
  };

  if (isLoading || !contract) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Zap className="text-indigo-600 animate-pulse" size={48} />
              <div className="text-slate-400 font-black uppercase tracking-widest text-xs">分析中...</div>
          </div>
      );
  }

  if (renderMode === 'BLOCKED') {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <AlertTriangle className="text-rose-500" size={48} />
              <div className="space-y-2">
                  <div className="text-slate-800 font-black text-xl">このカードは現在出題できません</div>
                  <p className="text-slate-500 text-sm">必要なデータ（選択肢や回答）が不足しています。</p>
              </div>
              <button onClick={onNext} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-lg">
                  次の問題へ飛ばす
              </button>
          </div>
      );
  }

  if (showFullViewer && repairUnit) {
      return (
          <InputUnitViewer 
            unit={repairUnit} 
            onClose={() => setShowFullViewer(false)} 
          />
      );
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 transition-all duration-300 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Progress Header - Minimized */}
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 px-3 py-1 rounded-xl">
                  <span className="text-slate-400 font-black text-xs mr-1">Q</span>
                  <span className="font-black text-slate-800 text-sm">{sessionProgress.current}</span>
                  <span className="text-slate-400 text-xs mx-1">/</span>
                  <span className="text-slate-400 font-bold text-xs">{sessionProgress.total}</span>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {contract?.subject}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => window.location.href = '?tab=home'} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <Home size={18} />
              </button>
            </div>
        </div>

        {/* Question Area - Focused */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{contract?.exam_type} 1問1答</span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-slate-800 whitespace-pre-wrap mb-6">
              {contract?.question_text}
            </h2>
            
            <QuestionBreakdownPanel text={contract?.question_text || ''} category={contract?.category || ''} mode={hasAnswered ? "after_answer" : "before_answer"} />
            <RightsCaseDiagram text={contract?.question_text || ''} category={contract?.category || ''} mode={hasAnswered ? "after_answer" : "before_answer"} />
        </div>

        {!hasAnswered ? (
          <div className="space-y-4">
            {renderMode === 'MCQ' ? (
              <div className="grid grid-cols-1 gap-3">
                {sourceChoices.sort((a, b) => a.option_no - b.option_no).map(choice => (
                  <button 
                    key={choice.id}
                    onClick={() => handleAnswer(choice.option_no)} 
                    className="bg-white hover:bg-slate-50 text-slate-800 p-6 rounded-2xl font-bold text-left shadow-sm border border-slate-200 active:scale-[0.98] transition-all flex gap-4"
                  >
                    <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">{choice.option_no}</span>
                    <span className="flex-1 leading-relaxed">{choice.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAnswer(true)} className="bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-500 py-10 rounded-3xl font-black text-3xl shadow-sm active:scale-95 transition-all">◯</button>
                <button onClick={() => handleAnswer(false)} className="bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-500 py-10 rounded-3xl font-black text-3xl shadow-sm active:scale-95 transition-all">×</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Result Header */}
            <div className={`p-6 rounded-3xl text-center shadow-md ${selectedAnswer === correctAnswer ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                {selectedAnswer === correctAnswer ? (
                  <CheckCircle2 className="text-emerald-500" size={32} />
                ) : (
                  <XCircle className="text-rose-500" size={32} />
                )}
                <span className={`text-2xl font-black ${selectedAnswer === correctAnswer ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedAnswer === correctAnswer ? '正解！' : '不正解'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-600">
                {contract?.direct_answer_sentence}
              </div>
            </div>

            {/* Explanation Section */}
            <div className="space-y-4">
                {explanationMatch && (
                    <ExplanationRepairPanel
                        match={explanationMatch}
                        onOpenInputUnit={explanationMatch.repairUnit ? () => setShowFullViewer(true) : undefined}
                    />
                )}
            </div>

            {/* FSRS Rating & Next Action */}
            <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-200 text-center space-y-6">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">この問題の定着度は？</div>
                <div className="flex justify-center gap-2">
                    {[
                        { r: 1, label: 'Again', color: 'bg-rose-500', hover: 'hover:bg-rose-600' },
                        { r: 2, label: 'Hard', color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
                        { r: 3, label: 'Good', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600' },
                        { r: 4, label: 'Easy', color: 'bg-blue-500', hover: 'hover:bg-blue-600' }
                    ].map(item => (
                        <button 
                            key={item.r} 
                            onClick={() => handleFSRSRating(item.r)}
                            disabled={isSubmittingRating}
                            className={`flex-1 ${item.color} ${item.hover} text-white py-4 rounded-xl text-xs font-black uppercase tracking-tighter transition-all active:scale-95 disabled:opacity-50`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
