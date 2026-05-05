import React, { useState } from 'react';
import { CheckCircle2, X, Info, ChevronRight, HelpCircle, ArrowLeftRight } from 'lucide-react';
import type { Limb } from '../db';

/**
 * AIが生成した「Atomic Requirements (要件)」の型定義
 */
interface AtomicRequirement {
  item: string;
  status: string;
}

interface LearningCardProps {
  limb: Limb & {
    atomic_requirements?: {
      title: string;
      list: AtomicRequirement[];
      conclusion: string;
    };
    deep_logic?: {
      reason: string;
      pro_tip: string;
    };
  };
  onAnswer: (correct: boolean) => void;
}

export const LearningCard: React.FC<LearningCardProps> = ({ limb, onAnswer }) => {
  const [showResult, setShowResult] = useState(false);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showAiGuidance, setShowAiGuidance] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const handleChoice = (choice: boolean) => {
    setUserChoice(choice);
    setShowResult(true);
    onAnswer(choice === limb.is_correct);
  };

  const handleAskAi = () => {
    setIsAiThinking(true);
    setShowAiGuidance(true);
    setTimeout(() => {
      setIsAiThinking(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* 1. 問題文エリア */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[160px] flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{limb.category_minor}</div>
        <p className="text-lg font-bold leading-relaxed text-slate-800">{limb.text}</p>
      </div>

      {/* 2. 回答ボタン */}
      {!showResult ? (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleChoice(true)}
            className="bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-100 py-6 rounded-2xl font-black text-2xl transition-all active:scale-95 flex flex-col items-center"
          >
            <CheckCircle2 size={32} className="mb-1" /> 〇
          </button>
          <button
            onClick={() => handleChoice(false)}
            className="bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-100 py-6 rounded-2xl font-black text-2xl transition-all active:scale-95 flex flex-col items-center"
          >
            <X size={32} className="mb-1" /> ×
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 animate-in zoom-in-95 duration-300 ${
          userChoice === limb.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {userChoice === limb.is_correct ? <CheckCircle2 /> : <X />}
          <span className="font-black text-xl">{userChoice === limb.is_correct ? '正解！' : '不正解...'}</span>
          <div className="ml-auto text-sm font-bold opacity-70">正解は 【{limb.is_correct ? '〇' : '×'}】</div>
        </div>
      )}

      {/* 3. AI高品質フィードバック (回答後のみ表示) */}
      {showResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {/* AIアシスタントボタン */}
          <button 
            onClick={handleAskAi}
            disabled={showAiGuidance}
            className={`w-full py-3 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition-all shadow-sm ${
              showAiGuidance 
                ? 'bg-slate-50 border-slate-100 text-slate-400' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 active:scale-95'
            }`}
          >
            <span className="text-lg">✨</span>
            {isAiThinking ? 'AIが思考中...' : showAiGuidance ? 'AI指導を表示中' : 'AIに詳しく聞く'}
          </button>

          {/* AI指導パネル */}
          {showAiGuidance && (
            <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-6 rounded-[32px] text-white shadow-xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl"></div>
              
              <h4 className="text-xs font-black text-indigo-200 mb-3 flex items-center gap-2 tracking-widest uppercase">
                Coach AI Analysis
              </h4>

              {isAiThinking ? (
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded-full w-full animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded-full w-5/6 animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-bold leading-relaxed">
                    「{limb.category_minor}」のこの問題は、<span className="text-amber-300">本質的なルールの例外</span>を突く典型的なパターンです。
                  </p>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10 italic text-xs leading-relaxed">
                    「法律は常に『誰を保護したいか』で決まります。この場合、{limb.reasoning.slice(0, 40)}... という背景を意識すると、丸暗記不要で正解を導き出せます。」
                  </div>
                  <p className="text-[10px] text-indigo-200 font-bold text-center">
                    ※ 本番では Gemini/Ollama 経由の動的解説が表示されます
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 出題者の意図 & 本質ルール */}
          <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><HelpCircle size={64} /></div>
            <h4 className="text-xs font-black text-indigo-300 mb-1 flex items-center gap-1">
              <Info size={14} /> 出題者の意図を暴く
            </h4>
            <p className="text-sm leading-relaxed mb-4 font-medium">{limb.examiners_intent}</p>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20">
              <div className="text-xs font-black text-indigo-200 mb-1">絶対ルール (Core Truth)</div>
              <p className="text-lg font-black leading-tight text-white">{limb.core_rule}</p>
            </div>
          </div>

          {/* 深掘りボタン */}
          <button 
            onClick={() => setShowDeepDive(!showDeepDive)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <ArrowLeftRight size={18} />
              <span>「なぜ？」をゼロにする細部確認</span>
            </div>
            <ChevronRight className={`transition-transform ${showDeepDive ? 'rotate-90' : ''}`} />
          </button>

          {/* 4. 極限・詳細ドリルダウン (展開時のみ表示) */}
          {showDeepDive && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* 要件チェックリスト */}
              <div className="bg-slate-100 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{limb.atomic_requirements?.title || '成立要件チェック'}</div>
                <div className="space-y-2">
                  {(limb.atomic_requirements?.list || []).map((req, i) => (
                    <div key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-200 text-sm">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold text-slate-400 shrink-0">{i+1}</div>
                      <div>
                        <div className="font-bold text-slate-700">{req.item}</div>
                        <div className="text-indigo-600 font-black mt-0.5">{req.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
                  💡 {limb.atomic_requirements?.conclusion}
                </div>
              </div>

              {/* 納得の物語 & フック */}
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                <div className="text-xs font-black text-amber-600 mb-2">理由・背景 (Deep Logic)</div>
                <p className="text-sm text-amber-900 leading-relaxed mb-3">{limb.reasoning}</p>
                <div className="p-3 bg-white/50 rounded-xl border border-amber-200 italic font-bold text-amber-800 flex items-center gap-2">
                  <span className="text-xl">⚓</span> {limb.mnemonic}
                </div>
              </div>

              {/* 比較対象 */}
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <div className="text-xs font-black text-blue-600 mb-1 uppercase">比較：もし〇〇だったら？</div>
                <p className="text-sm text-blue-900 font-bold leading-relaxed">{limb.contrast_case}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
