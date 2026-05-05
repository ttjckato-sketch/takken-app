/**
 * 高速インプットモード（Mode A）
 * 上質な参考書のような深い理解を提供するフラッシュカード
 * 全ての解説を隠さずに表示し、スッと頭に入るレイアウト
 */

import { useState } from 'react';
import { ArrowRight, Home, BookOpen, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import type { UnderstandingCard } from '../../db';
import { AnalogyBlock } from './AnalogyBlock';

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

interface FlashInputViewProps {
  card: UnderstandingCard;
  onNext: () => void;
  sessionProgress: SessionProgress;
  categoryProgress: CategoryProgress;
  questionMeta: QuestionMeta;
}

export function FlashInputView({
  card,
  onNext,
  sessionProgress,
  categoryProgress,
  questionMeta
}: FlashInputViewProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext();
      setIsExiting(false);
    }, 300);
  };

  const progressPercent = (sessionProgress.current / sessionProgress.total) * 100;

  // 問題文の取得
  const getQuestionText = (): string => {
    if (card.sample_question) return card.sample_question;
    if (card.core_knowledge?.examiners_intent) return card.core_knowledge.examiners_intent;
    if (card.core_knowledge?.rule) return card.core_knowledge.rule;
    return '学習カード';
  };

  const questionText = getQuestionText();

  // 実務トラブルの生成
  const getRealWorldTrouble = (): string => {
    const rule = card.core_knowledge.rule;
    if (rule.includes('重要事項') || rule.includes('説明')) {
      return '重要事項を説明しなかった場合、買主が契約を解除できたり、損害賠償請求されたりする最悪の事態に！';
    }
    if (rule.includes('手付金') || rule.includes('手付')) {
      return '手付金のルールを間違えると、倍返し請求や解約手付の没収で大きな金銭トラブルに発展！';
    }
    if (rule.includes('契約') || rule.includes('解除')) {
      return '契約解除のルール違反は、契約無効による白紙に戻るだけでなく、違約金や損害賠償の請求に直結！';
    }
    if (rule.includes('登記') || rule.includes('登記')) {
      return '登記の不備や漏れは、権利関係を巡る訴訟リスクを大幅に高めます！最悪の場合、物件を失うこともある致命的なミスです。';
    }
    return `このルールを知らないと、実務では${['契約無効', '損害賠償請求', '業務停止', '信頼失墜', '訴訟リスク'][Math.floor(Math.random() * 5)]}といった致命的な問題に直結します！`;
  };

  const realWorldTrouble = getRealWorldTrouble();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="md:flex md:max-w-7xl md:mx-auto md:min-h-screen">
        {/* 💻 PCモード: 左サイドバー */}
        <aside className="hidden md:flex md:w-80 lg:w-96 bg-white border-r border-slate-100 flex-col p-6 sticky top-0 h-screen overflow-y-auto">
          {/* 分野情報 */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">分野全体のボリューム</h3>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Home size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-blue-900">{questionMeta.category}</span>
              </div>
              <div className="bg-white/60 rounded-xl p-3 mb-3 border border-blue-100">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">全問題数</div>
                <div className="text-2xl font-black text-blue-600">{categoryProgress.total}<span className="text-sm text-slate-600 ml-1">問</span></div>
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
            </div>
          </div>

          {/* セッション進捗 */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">現在のセッション</h3>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">進捗</span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {sessionProgress.current} / {sessionProgress.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 統計 */}
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

        {/* メインコンテンツエリア - 参考書風レイアウト */}
        <main className="flex-1 md:p-8 pb-32 md:pb-8">
          {/* 📱 スマホモード: 進捗ヘッダー */}
          <div className="md:hidden bg-white rounded-t-3xl border-b border-slate-100 p-4 mb-6 sticky top-0 z-40 backdrop-blur-lg bg-white/95">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase">全問題数</div>
                <div className="text-lg font-black text-blue-600">{categoryProgress.total}<span className="text-sm text-slate-600 ml-1">問</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-slate-500 uppercase">{questionMeta.category}</div>
                <div className="text-xs font-bold text-emerald-600">{categoryProgress.learned}問完了</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-1">
              セッション: {sessionProgress.current} / {sessionProgress.total}
            </div>
          </div>

          {/* 参考書風カード - 全ての情報を見せる */}
          <div className="space-y-6">
            {/* 1. 問題文セクション */}
            <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border-2 border-indigo-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-3 rounded-2xl">
                  <Target size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-black text-indigo-900">問題</h2>
                {/* 試験種別バッジ */}
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                  card.exam_type === 'chintai'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                  {card.exam_type === 'chintai' ? '🏠 賃貸管理士' : '🏢 宅建'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
                {questionText}
              </p>
            </div>

            {/* 2. 公式ルール（条文）セクション */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-lg p-8 md:p-10 border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-200 p-3 rounded-2xl">
                  <BookOpen size={24} className="text-amber-700" />
                </div>
                <h2 className="text-lg font-black text-amber-900">公式ルール（条文）</h2>
              </div>
              <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                {card.core_knowledge.rule}
              </p>
            </div>

            {/* 3. 出題者の意図（試験官の罠）セクション */}
            {card.core_knowledge.examiners_intent && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-lg p-8 md:p-10 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-200 p-3 rounded-2xl">
                    <Target size={24} className="text-purple-700" />
                  </div>
                  <h2 className="text-lg font-black text-purple-900">出題者の意図（試験官の罠）</h2>
                </div>
                <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                  {card.core_knowledge.examiners_intent}
                </p>
              </div>
            )}

            {/* 4. 本質（つまりこういうこと）セクション */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-lg p-8 md:p-10 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-200 p-3 rounded-2xl">
                  <Lightbulb size={24} className="text-blue-700" />
                </div>
                <h2 className="text-lg font-black text-blue-900">本質（つまりこういうこと）</h2>
              </div>
              <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                {card.core_knowledge.essence}
              </p>
            </div>

            {/* 5. 実務トラブルセクション */}
            <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-3xl shadow-lg p-8 md:p-10 border-2 border-rose-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-rose-200 p-3 rounded-2xl">
                  <AlertTriangle size={24} className="text-rose-700" />
                </div>
                <h2 className="text-lg font-black text-rose-900">実務でどうヤバいのか</h2>
              </div>
              <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                {realWorldTrouble}
              </p>
            </div>

            {/* 6. アナロジー（例え話）セクション */}
            <AnalogyBlock analogies={card.analogies} />

            {/* タグ表示 */}
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {card.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 📱 スマホモード: 次へボタン（Sticky配置） */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-100 z-50">
            <button
              onClick={handleNext}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              次へ
              <ArrowRight size={24} />
            </button>
          </div>

          {/* 💻 PCモード: 次へボタン（通常配置） */}
          <div className="hidden md:block mt-8">
            <button
              onClick={handleNext}
              className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl shadow-glow hover:shadow-glow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              次のカードへ
              <ArrowRight size={24} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
