/**
 * モダン理解カード学習コンポーネント (v2.3 - 進捗表示改善 + 実務トラブル直結)
 * 修正: 分野全体のボリューム表示、アナロジー廃止、実務トラブル直結アプローチ
 */

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, ArrowRight, Home, AlertTriangle } from 'lucide-react';
import type { UnderstandingCard } from '../../types';

interface SessionProgress {
  current: number;
  total: number;
}

interface CategoryProgress {
  total: number;
  learned: number;
  due: number;
  streak: number;
  todayStudied: number;
  accuracy: number;
  totalReviews: number;
}

interface QuestionMeta {
  category: string;
  tags: string[];
  cardId: string;
}

interface ModernUnderstandingCardViewProps {
  card: UnderstandingCard;
  onAnswer: (correct: boolean, selfEvaluation?: number) => void;
  onNext: () => void;
  sessionProgress: SessionProgress;
  categoryProgress: CategoryProgress;
  questionMeta: QuestionMeta;
}

export function ModernUnderstandingCardView({
  card,
  onAnswer,
  onNext,
  sessionProgress,
  categoryProgress,
  questionMeta
}: ModernUnderstandingCardViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showDeepExplanation, setShowDeepExplanation] = useState(false);
  const [userMemo, setUserMemo] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const handleAnswer = (correct: boolean) => {
    setSelectedAnswer(correct);
    onAnswer(correct);
  };

  const handleNextClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext();
      setIsExiting(false);
      setSelectedAnswer(null);
      setShowDeepExplanation(false);
      setUserMemo('');
    }, 300);
  };

  const actualCorrect = card.sample_answer ?? true;
  const progressPercent = (sessionProgress.current / sessionProgress.total) * 100;
  const categoryPercent = categoryProgress.total > 0 ? (categoryProgress.learned / categoryProgress.total) * 100 : 0;

  // 問題文の取得（フォールバックチェーン）
  const getQuestionText = (): string => {
    if (card.sample_question) return card.sample_question;
    if (card.core_knowledge?.examiners_intent) return card.core_knowledge.examiners_intent;
    if (card.core_knowledge?.rule) return card.core_knowledge.rule;
    return '学習カード';
  };

  const questionText = getQuestionText();

  // 実務トラブルの生成（ルール違反による具体的な被害例）
  const getRealWorldTrouble = (): string => {
    const rule = card.core_knowledge.rule;
    const essence = card.core_knowledge.essence;

    // 重要なキーワードからトラブル例を生成
    if (rule.includes('重要事項') || rule.includes('説明')) {
      return '【実務トラブル】重要事項を説明しなかった場合、買主が契約を解除できたり、損害賠償請求されたりする最悪の事態に！業者としての信頼も失います。';
    }
    if (rule.includes('手付金') || rule.includes('手付')) {
      return '【実務トラブル】手付金のルールを間違えると、倍返し請求や解約手付の没収で大きな金銭トラブルに発展！実務では数百万円単位のリスクがあります。';
    }
    if (rule.includes('契約') || rule.includes('解除')) {
      return '【実務トラブル】契約解除のルール違反は、契約無効による白紙に戻るだけでなく、違約金や損害賠償の請求に直結！実務で最も怖いトラブルの一つです。';
    }
    if (rule.includes('登記') || rule.includes('登記')) {
      return '【実務トラブル】登記の不備や漏れは、権利関係を巡る訴訟リスクを大幅に高めます！最悪の場合、物件を失うこともある致命的なミスです。';
    }
    if (rule.includes('宅地建物取引業') || rule.includes('宅建業')) {
      return '【実務トラブル】宅建業法違反は、業務停止命令や免許取消処分のリスク！業者としての生存に関わる最重要ルールです。';
    }
    if (rule.includes('広告') || rule.includes('誇大')) {
      return '【実務トラブル】誇大広告は課徴金や業務停止の対象！消費者庁や都道府県からの指導入りで、業者としての信用を失います。';
    }

    // デフォルトの実務トラブル
    return `【実務トラブル】このルールを知らないと、実務では${['契約無効', '損害賠償請求', '業務停止', '信頼失墜', '訴訟リスク'][Math.floor(Math.random() * 5)]}といった致命的な問題に直結します！`;
  };

  const realWorldTrouble = getRealWorldTrouble();

  return (
    <div className={`min-h-screen bg-slate-50 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* 💻 PCモード: レイアウトコンテナ（2カラム） */}
      <div className="md:flex md:max-w-7xl md:mx-auto md:min-h-screen">
        {/* 💻 PCモード: 左サイドナビゲーション枠 */}
        <aside className="hidden md:flex md:w-80 lg:w-96 bg-white border-r border-slate-100 flex-col p-6 sticky top-0 h-screen overflow-y-auto">
          {/* 分野情報（階層パンくず + 全体ボリューム） */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">分野全体のボリューム</h3>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <Home size={16} className="text-indigo-600" />
                <span className="text-sm font-bold text-indigo-900">{questionMeta.category}</span>
              </div>
              <div className="bg-white/60 rounded-xl p-3 mb-3 border border-indigo-100">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">全問題数</div>
                <div className="text-2xl font-black text-indigo-600">{categoryProgress.total}<span className="text-sm text-slate-600 ml-1">問</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">習得済み</span>
                  <span className="font-black text-emerald-600">{categoryProgress.learned}問</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">未習得</span>
                  <span className="font-black text-amber-600">{categoryProgress.total - categoryProgress.learned}問</span>
                </div>
              </div>
              {questionMeta.tags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-100">
                  <div className="text-[10px] font-black text-slate-500 uppercase mb-2">関連タグ</div>
                  <div className="flex flex-wrap gap-2">
                    {questionMeta.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-full border border-indigo-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* セッション進捗 */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">現在のセッション</h3>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">進捗</span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  {sessionProgress.current} / {sessionProgress.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">連続学習</div>
              <div className="text-xl font-black text-emerald-700">{categoryProgress.streak}<span className="text-xs text-slate-600 ml-1">日</span></div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="text-[10px] font-black text-blue-600 uppercase mb-1">正答率</div>
              <div className="text-xl font-black text-blue-700">{Math.round(categoryProgress.accuracy * 100)}%</div>
            </div>
          </div>
        </aside>

        {/* メインコンテンツエリア */}
        <main className="flex-1 md:p-8 pb-32 md:pb-8">
          {/* 📱 スマホモード: 進捗ヘッダー（カード内部上部） */}
          <div className="md:hidden bg-white rounded-t-3xl border-b border-slate-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase">全問題数</div>
                <div className="text-lg font-black text-indigo-600">{categoryProgress.total}<span className="text-sm text-slate-600 ml-1">問</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-slate-500 uppercase">{questionMeta.category}</div>
                <div className="text-xs font-bold text-emerald-600">{categoryProgress.learned}問完了</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(sessionProgress.current / sessionProgress.total) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-1">
              セッション: {sessionProgress.current} / {sessionProgress.total}
            </div>
          </div>

          {/* 問題カード */}
          <div className="bg-white rounded-[32px] shadow-soft overflow-hidden mb-6">
            {/* 問題文エリア */}
            <div className="p-6 md:p-10">
              <div className="min-h-[200px] md:min-h-[300px] flex items-center justify-center">
                <p className="text-xl md:text-3xl font-black text-slate-900 leading-relaxed text-center">
                  {questionText}
                </p>
              </div>
            </div>

            {/* 回答後の即時フィードバック */}
            {selectedAnswer !== null && (
              <div className="animate-slide-up p-6 md:p-10 bg-slate-50 border-t border-slate-100">
                {/* 正解/不正解 バッジ */}
                <div className={`p-4 md:p-6 rounded-2xl mb-4 ${
                  selectedAnswer === actualCorrect
                    ? 'bg-emerald-50 border-2 border-emerald-200'
                    : 'bg-rose-50 border-2 border-rose-200'
                }`}>
                  <div className="flex items-center gap-3 md:gap-4">
                    {selectedAnswer === actualCorrect ? (
                      <CheckCircle2 size={28} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle size={28} className="text-rose-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className={`text-lg md:text-xl font-black ${
                        selectedAnswer === actualCorrect ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {selectedAnswer === actualCorrect ? '正解！' : '不正解...'}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {actualCorrect ? 'この文は正しいです' : 'この文は誤りです'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 本質（Essence） - 即時表示 */}
                <div className="p-4 md:p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 mb-4">
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
                    💡 本質
                  </div>
                  <p className="text-base md:text-lg font-bold text-indigo-900 leading-relaxed">
                    {card.core_knowledge.essence}
                  </p>
                </div>

                {/* 実務トラブル（NEW） */}
                <div className="p-4 md:p-5 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-rose-200 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">
                        ⚠️ 実務でどうヤバいのか
                      </div>
                      <p className="text-sm md:text-base font-bold text-rose-900 leading-relaxed">
                        {realWorldTrouble}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 💻 PCモード: 深い解説（常に展開） */}
                <div className="hidden md:block">
                  {/* ルール */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
                      📖 ルール
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {card.core_knowledge.rule}
                    </p>
                  </div>

                  {/* 出題意図 */}
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                    <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">
                      🎯 出題意図
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {card.core_knowledge.examiners_intent}
                    </p>
                  </div>
                </div>

                {/* 📱 スマホモード: 深い解説（アコーディオン） */}
                <div className="md:hidden">
                  {/* 1行メモ入力（不正解時） */}
                  {selectedAnswer !== actualCorrect && (
                    <div className="mb-4">
                      <div className="bg-white rounded-2xl p-4 border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                          📝 1行メモを残す
                        </label>
                        <input
                          type="text"
                          value={userMemo}
                          onChange={(e) => setUserMemo(e.target.value)}
                          placeholder="定着のためのフックを残そう"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          maxLength={100}
                        />
                      </div>
                    </div>
                  )}

                  {/* アコーディオンボタン */}
                  <button
                    onClick={() => setShowDeepExplanation(!showDeepExplanation)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-700">
                      {showDeepExplanation ? '▲ 閉じる' : '▼ もっと深く知る'}
                    </span>
                    {showDeepExplanation ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                  </button>

                  {showDeepExplanation && (
                    <div className="mt-4 space-y-4 animate-slide-down">
                      {/* ルール */}
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
                          📖 ルール
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {card.core_knowledge.rule}
                        </p>
                      </div>

                      {/* 出題意図 */}
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">
                          🎯 出題意図
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed">
                          {card.core_knowledge.examiners_intent}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 📱 スマホモード: 巨大なアクションボタン（Sticky配置） */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-100 z-50">
            {selectedAnswer === null ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer(true)}
                  className="group py-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-glow transition-all active:scale-95 flex flex-col items-center gap-2"
                >
                  <CheckCircle2 size={32} strokeWidth={3} />
                  <span>正しい</span>
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="group py-6 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl font-black text-xl shadow-glow transition-all active:scale-95 flex flex-col items-center gap-2"
                >
                  <XCircle size={32} strokeWidth={3} />
                  <span>誤り</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleNextClick}
                className="w-full py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl font-black text-lg shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                次へ
                <ArrowRight size={24} />
              </button>
            )}
          </div>

          {/* 💻 PCモード: アクションボタン（通常配置） */}
          <div className="hidden md:block space-y-3">
            {selectedAnswer === null ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer(true)}
                  className="group py-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-glow hover:shadow-glow-lg transition-all active:scale-95 flex flex-col items-center gap-2"
                >
                  <CheckCircle2 size={36} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                  <span>正しい</span>
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="group py-6 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl font-black text-xl shadow-glow hover:shadow-glow-lg transition-all active:scale-95 flex flex-col items-center gap-2"
                >
                  <XCircle size={36} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                  <span>誤り</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleNextClick}
                className="w-full py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl font-black text-lg shadow-glow hover:shadow-glow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                次の問題へ
                <ArrowRight size={24} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
