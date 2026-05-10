import { useState, useRef, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Home, Zap, ChevronRight, BookOpen, List, Target, AlertTriangle, Shield, Lightbulb, Database } from 'lucide-react';
import { db, type UnderstandingCard, type SourceChoice } from '../../db';
import { AnalogyBlock } from './AnalogyBlock';
import { recordStudyEvent, updateCardSRS } from '../../utils/analytics';
import { findRepairInputUnit } from '../../utils/inputUnitRepairMatcher';
import { RepairPreview } from './RepairPreview';
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

export function ActiveRecallView({ card, onAnswer, onNext, sessionProgress, categoryProgress, questionMeta }: ActiveRecallViewProps) {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [repairUnit, setRepairUnit] = useState<any>(null);
  const [showFullViewer, setShowFullViewer] = useState(false);
  const [sourceChoices, setSourceChoices] = useState<SourceChoice[]>([]);
  const [renderMode, setRenderMode] = useState<QuestionRenderMode>('TRUE_FALSE');
  const [contract, setContract] = useState<LearningContentContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const loadData = async () => {
        setIsLoading(true);
        // Load Source Choices
        const baseId = card.card_id.replace(/^CHINTAI-KC-/, '').replace(/^KC-/, '');
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
        
        {/* Progress Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-400 font-black text-xs mr-2">Q</span>
                  <span className="font-black text-slate-800">{sessionProgress.current}</span>
                  <span className="text-slate-400 text-xs mx-1">/</span>
                  <span className="text-slate-400 font-bold text-xs">{sessionProgress.total}</span>
              </div>
              <div className="hidden sm:block text-xs font-bold text-slate-400">
                  {contract?.exam_type.toUpperCase()} | {contract?.subject}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-lg tracking-widest uppercase">
                  {contract?.render_mode}
              </span>
              <span className={`px-2 py-1 font-black text-[10px] rounded-lg tracking-widest uppercase ${contract?.quality_level === 'L4' || contract?.quality_level === 'L3' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {contract?.quality_level}
              </span>
              <button onClick={() => window.location.href = '?tab=home'} className="ml-2 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <Home size={20} />
              </button>
            </div>
        </div>

        {/* Card Content Area */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 relative overflow-hidden space-y-6">
            {hasAnswered && contract?.question_intent && (
                <div className="flex items-center gap-2 text-indigo-500">
                    <Target size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">{contract.question_intent}</span>
                </div>
            )}
            <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-slate-800 whitespace-pre-wrap">
              {contract?.question_text}
            </h2>
            
            {/* P60: Glossary and Breakdown in Question Area */}
            <GlossaryInline text={contract?.question_text || ''} />
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
            
            {/* 1. 判定と直接回答 */}
            <div className={`p-8 rounded-3xl text-center shadow-lg ${selectedAnswer === correctAnswer ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'} relative overflow-hidden animate-in zoom-in-95 duration-300`}>
              <div className="flex flex-col gap-4 items-center">
                  {renderMode === 'MCQ' && (
                    <div className="flex items-center justify-center gap-4 bg-white/80 px-6 py-2 rounded-xl shadow-sm border border-slate-100">
                        <div className="text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                          あなたの選択: <span className={`text-sm font-black ${selectedAnswer === correctAnswer ? 'text-emerald-600' : 'text-rose-600'}`}>{contract?.user_answer_label}</span>
                        </div>
                        <ArrowRight size={14} className="text-slate-300" />
                        <div className="text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                          正解: <span className="text-sm font-black text-emerald-600">{contract?.correct_answer_label}</span>
                        </div>
                    </div>
                  )}
                  <div className={`font-black text-xl md:text-2xl leading-tight px-4 py-2 ${selectedAnswer === correctAnswer ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {contract?.direct_answer_sentence}
                  </div>
              </div>

              {contract?.mistake_diagnosis && (
                  <div className="mt-6 space-y-6">
                      {/* QuestionUnderstandingAid: 問題文読解補助 */}
                      <QuestionUnderstandingAid
                          questionText={card.sample_question}
                          category={card.category}
                          tags={card.tags}
                          isExpandedDefault={true}
                      />

                      {/* Mistake Diagnosis */}
                      <div className="p-5 bg-white border border-rose-200 rounded-2xl text-left shadow-sm animate-in slide-in-from-top-4 duration-700 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <AlertTriangle size={80} className="text-rose-600" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                <AlertTriangle size={16} /> Mistake Diagnosis
                            </div>
                            <div className="text-lg font-black text-rose-900 leading-tight mb-4">{contract?.mistake_diagnosis.diagnosis_text}</div>
                            <div className="flex items-start gap-3 text-rose-700 font-bold text-sm bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                <Lightbulb size={20} className="shrink-0 text-amber-500" />
                                <span>{contract?.mistake_diagnosis.next_action}</span>
                            </div>
                          </div>
                      </div>
                  </div>
              )}
              
              {/* FSRS評価ボタン: 押下後に次問へ自動進行 */}
              <div className="mt-8 pt-8 border-t border-current/10 flex justify-center gap-3">
                  {[1, 2, 3, 4].map(r => (
                      <button 
                        key={r} 
                        onClick={() => handleFSRSRating(r)}
                        disabled={isSubmittingRating}
                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-tighter border-2 transition-all active:scale-95 shadow-sm
                          ${isSubmittingRating ? 'opacity-50 cursor-not-allowed' : ''}
                          ${r===1 ? 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600' : 
                            r===2 ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600' :
                            r===3 ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600' :
                            'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'}`}
                      >
                          {r===1?'Again': r===2?'Hard': r===3?'Good':'Easy'}
                      </button>
                  ))}
              </div>
            </div>

            {/* P42: 誤答時の補修プレビュー (Chintai/Takken共通) */}
            {selectedAnswer !== correctAnswer && repairUnit && (
                <div className="bg-indigo-600 text-white p-8 rounded-[40px] shadow-glow flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Deep Learning Resource</div>
                        <h4 className="text-xl font-black">この論点の構造化知識で再確認しますか？</h4>
                        <p className="text-xs text-indigo-100/70 font-bold">基本ルール・例外・ひっかけをまとめて学習できます</p>
                    </div>
                    <button
                        onClick={() => setShowFullViewer(true)}
                        className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black flex items-center gap-2 shadow-2xl active:scale-95 transition-all whitespace-nowrap"
                    >
                        <BookOpen size={20} /> 解説ユニットを開く
                    </button>
                </div>
            )}

            {/* 誤答時のfallback表示 (repairUnitがない場合) */}
            {selectedAnswer !== correctAnswer && !repairUnit && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-[32px] p-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-left-4 duration-500">
                    {/* Fallbackヘッダー */}
                    <div className="flex items-center gap-2 text-amber-700 font-bold">
                        <Lightbulb size={20} />
                        <span>この問題の読み方ヒント</span>
                    </div>

                    {/* QuestionUnderstandingAidを表示 */}
                    <QuestionUnderstandingAid
                        questionText={card.sample_question}
                        category={card.category}
                        tags={card.tags}
                        isExpandedDefault={true}
                    />

                    {/* 基本的な確認事項 */}
                    <div className="bg-white rounded-2xl p-4 border border-amber-100 space-y-3">
                        <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                            【この問題でまず見ること】
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span><strong>登場人物</strong>: A・B・甲・乙など、誰が登場するか整理してください</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span><strong>時系列</strong>: 契約前・契約後、登記の前後など、順序を確認してください</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span><strong>問われている制度</strong>: 35条・37条、代理・無権代理、詐欺・強迫など</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span><strong>注目語句</strong>: 契約前・契約後、善意・悪意、第三者、対抗、登記など</span>
                            </li>
                        </ul>
                    </div>

                    {/* 次に確認すること */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-3">
                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider">
                            【次に確認すること】
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>問題文の<strong>どの語句</strong>が正誤を決めているか確認してください</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>似た制度（35条vs37条、詐欺vs強迫など）と<strong>混同していないか</strong>確認してください</span>
                            </li>
                        </ul>
                    </div>

                    {/* 注意書き */}
                    <div className="bg-amber-100 rounded-xl p-3 border border-amber-200 text-center">
                        <p className="text-xs text-amber-800 font-bold">
                            対応する詳しいInput Unitは整備中ですが、この問題は出題対象として安全な正誤データを持っています。
                        </p>
                    </div>
                </div>
            )}

            {/* 解説セクション (構造化・Grounded) */}
            {(selectedAnswer === correctAnswer || !repairUnit) && (
                <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Zap size={18} className="text-indigo-400" />
                        </div>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">
                            Deep Feedback v3.9
                        </h3>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-[9px] font-black text-slate-500 border border-slate-700 tracking-tighter uppercase">
                        {contract?.quality_level} Certified Content
                    </div>
                </div>
                
                <div className="space-y-12">
                    {/* P60: Legal Context (Why the system exists) */}
                    <LegalContextPanel category={contract?.category || ''} />

                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                            <Target size={14} className="text-indigo-500" /> 結論 (Core Rule)
                        </div>
                        <div className="text-2xl font-black border-l-4 border-indigo-500 pl-8 text-white leading-relaxed">
                            {contract?.core_rule}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                            <BookOpen size={14} className="text-indigo-500" /> 理由と法的根拠
                        </div>
                        <div className="text-slate-300 font-bold leading-relaxed pl-8 border-l-4 border-slate-700 whitespace-pre-wrap text-lg">
                            {contract?.why_this_is_correct}
                        </div>
                    </div>

                    {renderMode === 'MCQ' && contract?.choice_explanations && (
                        <div className="space-y-6">
                            <div className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                <List size={14} className="text-indigo-500" /> 選択肢別判断 (Limb Analysis)
                            </div>
                            <div className="grid grid-cols-1 gap-4 pl-4">
                                {contract.choice_explanations.map((choice, idx) => (
                                    <div key={`${choice.option_no}-${idx}`} className={`p-6 rounded-[32px] border transition-all ${choice.is_correct ? 'bg-emerald-900/30 border-emerald-500/40 shadow-lg shadow-emerald-900/20' : 'bg-slate-800/40 border-slate-700/50'}`}>
                                        <div className="flex items-start gap-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${choice.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                {choice.option_no}
                                            </span>
                                            <div className="space-y-4 flex-1">
                                                <div className="text-sm text-slate-400 leading-relaxed italic">"{choice.choice_text}"</div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${choice.is_correct ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-700'}`}>
                                                            {choice.judgment}
                                                        </span>
                                                        <span className="text-md font-black text-slate-100">{choice.reason}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* P60: Similar Questions Cluster */}
                    <div className="pt-4 border-t border-white/5">
                        <SimilarQuestionsPanel 
                            card={card} 
                            onSelect={(targetCard) => {
                                console.log('Jump to similar card:', targetCard.card_id);
                            }} 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="bg-white/5 p-6 rounded-[40px] border border-white/5 shadow-inner">
                            <div className="text-[10px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                <Shield size={14} className="text-indigo-500" /> 前提・基本ルール
                            </div>
                            <div className="text-sm text-slate-400 font-bold leading-relaxed">{contract?.prerequisite}</div>
                        </div>
                        <div className="bg-rose-500/10 p-6 rounded-[40px] border border-rose-500/20 shadow-inner">
                            <div className="text-[10px] font-black text-rose-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                <AlertTriangle size={14} /> 試験の罠・注意点
                            </div>
                            <div className="text-sm text-rose-200 font-bold leading-relaxed">{contract?.trap_point}</div>
                        </div>
                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                            <div className="text-[10px] font-black text-amber-500 uppercase mb-2 flex items-center gap-2">
                                <Lightbulb size={14} /> 覚え方 (Memory Hook)
                            </div>
                            <div className="text-xs text-amber-200 leading-relaxed">{contract?.memory_hook}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Target size={14} className="text-indigo-500" /> 次回復習ポイント
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed pl-4">{contract?.next_review_focus}</div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 tracking-[0.2em] uppercase">
                                <Database size={12} />
                                {contract?.source_trace}
                            </div>
                            {repairUnit && (
                                <button 
                                    onClick={() => setShowFullViewer(true)}
                                    className="flex items-center gap-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-black px-4 py-2 rounded-xl bg-indigo-900/40 border border-indigo-500/30 transition-all w-fit uppercase tracking-tighter"
                                >
                                    <BookOpen size={14} /> 深層理解 (Input Unit) を表示
                                </button>
                            )}
                        </div>
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

