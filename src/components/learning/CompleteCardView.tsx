/**
 * 完全理解カードビュー（縦型フロー版）
 * 上から下へスクロールするだけで自然に理解できる
 */

import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Layers, Brain, FileText, CheckCircle2, XCircle, ArrowRight, AlertCircle, GraduationCap, Target, HelpCircle } from 'lucide-react';
import type { UnderstandingCard } from '../../db';

interface CompleteCardViewProps {
  card: UnderstandingCard;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

interface JargonDictionary {
  [term: string]: {
    translation: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

let jargonCache: JargonDictionary | null = null;

export function CompleteCardView({ card, onAnswer, onNext }: CompleteCardViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [jargonTerms, setJargonTerms] = useState<Array<{ term: string; translation: string }>>([]);

  useEffect(() => {
    const loadJargonDictionary = async () => {
      if (jargonCache) {
        setJargonTerms(extractJargonTerms(card.core_knowledge.rule, card.core_knowledge.essence, jargonCache));
        return;
      }
      try {
        const response = await fetch('/jargon_dictionary.json');
        if (response.ok) {
          const data = await response.json();
          jargonCache = data.terms;
          if (jargonCache) {
            setJargonTerms(extractJargonTerms(card.core_knowledge.rule, card.core_knowledge.essence, jargonCache));
          }
        }
      } catch (error) {
        console.warn('専門用語辞書の読み込みに失敗しました:', error);
      }
    };
    loadJargonDictionary();
  }, [card]);

  const rule = card.core_knowledge.rule;
  const essence = card.core_knowledge.essence;
  const examinersIntent = card.core_knowledge.examiners_intent;
  const analogy = card.analogies && card.analogies.length > 0 ? card.analogies[0] : null;
  const steps = card.step_decomposition && card.step_decomposition.length > 0
    ? card.step_decomposition
    : rule.split(/[。．]/).filter(s => s.trim().length > 10).map((sentence, index) => ({
        step_number: index + 1,
        content: sentence + '。',
        type: 'general' as const,
        key_elements: []
      }));

  const oneSecondAnswer = essence.split('【本質】').pop()?.split('\n')[0] || essence.substring(0, 100) + '...';

  const handleNextClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext();
      setIsExiting(false);
      setShowExplanation(false);
    }, 300);
  };

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${isExiting ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
          <div className="text-white">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
              {card.category}
            </div>
            <div className="flex gap-2 flex-wrap">
              {card.tags.slice(0, 5).map(tag => (
                <span
                  key={tag}
                  className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 問題文 */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={24} className="text-indigo-600" />
              <h3 className="text-lg font-black text-slate-800">問題</h3>
            </div>
            <p className="text-lg leading-loose text-slate-800 font-bold whitespace-pre-wrap">
              {card.sample_question || "※問題文データの取得に失敗しました"}
            </p>
          </div>

          {!showExplanation ? (
            <button
              onClick={() => setShowExplanation(true)}
              className="w-full py-6 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl font-black text-xl shadow-medium hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              解答と解説を見る
            </button>
          ) : (
            <div className="space-y-6 animate-slide-up">
              {/* 正解表示 */}
              {card.sample_answer !== undefined && (
                <div className="flex justify-center mb-8">
                  <div className={`text-3xl font-black px-10 py-4 rounded-full border-4 ${card.sample_answer ? 'text-rose-500 border-rose-500 bg-rose-50' : 'text-blue-500 border-blue-500 bg-blue-50'}`}>
                    正解は「{card.sample_answer ? '〇' : '×'}」
                  </div>
                </div>
              )}

              {/* ① 1秒アンサー */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border-2 border-rose-200">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={24} className="text-rose-600" />
                  <h3 className="text-lg font-black text-rose-900">要するにどういうこと？</h3>
                </div>
                <p className="text-base leading-loose text-slate-800 font-medium">
                  {oneSecondAnswer}
                </p>
              </div>

              {/* ② 専門用語の翻訳 (Collapsible) */}
              {jargonTerms.length > 0 && (
                <details className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 group cursor-pointer">
                  <summary className="p-4 flex items-center gap-2 font-black text-amber-900 select-none outline-none">
                    <GraduationCap size={20} className="text-amber-600" />
                    <span>👉 わからない専門用語があればクリック</span>
                  </summary>
                  <div className="p-4 pt-0 space-y-3 cursor-default">
                    {jargonTerms.map((term, index) => (
                      <div key={index} className="bg-white/60 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 min-w-[5rem] text-center text-sm font-black text-amber-700 bg-amber-100 px-2 py-1 rounded">
                            {term.term}
                          </span>
                          <span className="text-sm text-slate-700 flex-1">
                            {term.translation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* ③ イメージで理解 */}
              {analogy && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={24} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-emerald-900">イメージで理解</h3>
                  </div>
                  <div className="bg-white/60 p-5 rounded-xl mb-4">
                    <p className="text-sm font-bold text-emerald-700 mb-2">例え: {analogy.analogy}</p>
                    <p className="text-base text-emerald-900 leading-relaxed">{analogy.explanation}</p>
                  </div>
                  {analogy.mapping && Object.keys(analogy.mapping).length > 0 && (
                    <div className="text-sm text-emerald-800">
                      <p className="font-bold mb-2">対応:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(analogy.mapping).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium text-emerald-700">{key}</span>
                            <span className="text-slate-600">→ {value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ④ 公式ルール */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={24} className="text-indigo-600" />
                  <h3 className="text-lg font-black text-indigo-900">公式ルール（法律の決まり）</h3>
                </div>
                <p className="text-base leading-loose text-indigo-900 bg-white p-5 rounded-xl border border-indigo-200">
                  {rule}
                </p>
              </div>

              {/* ⑤ ステップで理解 */}
              {steps.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={24} className="text-slate-600" />
                    <h3 className="text-lg font-black text-slate-900">ステップで理解</h3>
                  </div>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-xl flex items-center justify-center text-base font-black shadow-soft">
                          {step.step_number}
                        </div>
                        <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200">
                          <p className="text-base leading-relaxed text-slate-800">{step.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⑥ 試験官の罠 */}
              {examinersIntent && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Target size={24} className="text-purple-600" />
                    <h3 className="text-lg font-black text-purple-900">試験官の罠（出題者の意図）</h3>
                  </div>
                  <p className="text-base text-purple-900 leading-relaxed">{examinersIntent}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      {showExplanation && (
        <div className="space-y-4">
          {selectedAnswer === null ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedAnswer(true);
                  onAnswer(true);
                }}
                className="py-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-medium hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={28} />
                完璧に理解した
              </button>
              <button
                onClick={() => {
                  setSelectedAnswer(false);
                  onAnswer(false);
                }}
                className="py-6 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl font-black text-xl shadow-medium hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <XCircle size={28} />
                もう復習
              </button>
            </div>
          ) : (
            <button
              onClick={handleNextClick}
              className="w-full py-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl font-black text-xl shadow-medium hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              次の問題へ
              <ArrowRight size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function extractJargonTerms(
  rule: string,
  essence: string,
  dictionary: JargonDictionary
): Array<{ term: string; translation: string }> {
  const terms: Array<{ term: string; translation: string }> = [];
  const combinedText = rule + essence;
  for (const [term, data] of Object.entries(dictionary)) {
    if (combinedText.includes(term)) {
      terms.push({ term, translation: data.translation });
    }
  }
  return terms.slice(0, 5);
}
