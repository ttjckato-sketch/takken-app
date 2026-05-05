/**
 * 理解カード学習コンポーネント
 * アナロジー、ステップ分解、想起練習を統合
 */

import { useState } from 'react';
import { BookOpen, Layers, Lightbulb, Brain, CheckCircle2, XCircle } from 'lucide-react';
import type { UnderstandingCard } from '../../types';

interface UnderstandingCardViewProps {
  card: UnderstandingCard;
  onAnswer: (correct: boolean, selfEvaluation?: number) => void;
}

export function UnderstandingCardView({ card, onAnswer }: UnderstandingCardViewProps) {
  const [activeTab, setActiveTab] = useState<'rule' | 'analogy' | 'steps' | 'recall'>('rule');
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const handleNext = () => {
    if (selectedAnswer !== null) {
      onAnswer(selectedAnswer);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            {card.category}
          </div>
          <div className="flex gap-1 flex-wrap mt-1">
            {card.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => { setActiveTab('rule'); setShowAnswer(false); }}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${
            activeTab === 'rule'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={14} />
          <span className="hidden sm:inline">ルール</span>
        </button>
        <button
          onClick={() => { setActiveTab('analogy'); setShowAnswer(false); }}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${
            activeTab === 'analogy'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lightbulb size={14} />
          <span className="hidden sm:inline">アナロジー</span>
        </button>
        <button
          onClick={() => { setActiveTab('steps'); setShowAnswer(false); }}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${
            activeTab === 'steps'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers size={14} />
          <span className="hidden sm:inline">ステップ</span>
        </button>
        <button
          onClick={() => { setActiveTab('recall'); setShowAnswer(false); }}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${
            activeTab === 'recall'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Brain size={14} />
          <span className="hidden sm:inline">想起</span>
        </button>
      </div>

      {/* コンテンツ */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'rule' && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-2">【ルール】</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {card.core_knowledge.rule}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">【本質】</h3>
              <p className="text-sm text-indigo-900 leading-relaxed">
                {card.core_knowledge.essence}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'analogy' && card.analogies && card.analogies.length > 0 && (
          <div className="p-6 space-y-4">
            {card.analogies.map((analogy, index) => (
              <div key={index} className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h3 className="text-sm font-black text-amber-800 mb-1">💡 {analogy.analogy}</h3>
                <p className="text-xs text-amber-900 leading-relaxed mb-2">{analogy.explanation}</p>
                <div className="text-[10px] font-bold text-amber-700">
                  対応: {Object.entries(analogy.mapping).slice(0, 2).map(([k, v]) => `${k}→${v}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'steps' && card.step_decomposition && card.step_decomposition.length > 0 && (
          <div className="p-6">
            <div className="space-y-3">
              {card.step_decomposition.map((step) => (
                <div key={step.step_number} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black">
                    {step.step_number}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase">
                      {step.type}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {step.content}
                    </p>
                    {step.key_elements.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {step.key_elements.map((elem, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                          >
                            {elem}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recall' && card.active_recall_questions && card.active_recall_questions.length > 0 && (
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-slate-500 text-center">
              答えを見る前に、まず思い出してください
            </p>
            {card.active_recall_questions.slice(0, 2).map((question, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                  {question.type === 'blank_fill' ? 'ブランク埋め' : 'なぜ問題'}
                </div>
                <p className="text-sm text-slate-800 leading-relaxed mb-2">
                  {question.question}
                </p>
                {showAnswer && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 mb-1">解答</div>
                    <p className="text-sm text-indigo-700 font-medium">{question.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アクション */}
      <div className="space-y-2">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg active:scale-95 transition-transform"
          >
            解答を表示
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedAnswer(true)}
              className={`py-4 rounded-2xl font-black transition-all ${
                selectedAnswer === true
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
              }`}
            >
              <CheckCircle2 className="inline mr-1" size={16} />
              正解
            </button>
            <button
              onClick={() => setSelectedAnswer(false)}
              className={`py-4 rounded-2xl font-black transition-all ${
                selectedAnswer === false
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
              }`}
            >
              <XCircle className="inline mr-1" size={16} />
              不正解
            </button>
          </div>
        )}

        {selectedAnswer !== null && (
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl font-black text-white bg-slate-800 shadow-lg active:scale-95 transition-transform"
          >
            次へ
          </button>
        )}
      </div>
    </div>
  );
}