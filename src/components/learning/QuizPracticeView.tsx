/**
 * 問題演習特化ビュー（縦型フロー版 + 2択回答UI + 実務トラブル直結）
 * 修正: 4択→2択変更、アナロジー廃止、実務トラブル直結アプローチ
 */

import { useState } from 'react';
import { BookOpen, Brain, CheckCircle2, XCircle, ArrowRight, GraduationCap, Target, ChevronDown, Home, AlertTriangle } from 'lucide-react';
import type { UnderstandingCard } from '../../db';
import type { KnowledgeCard } from '../../db';

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

interface QuizPracticeViewProps {
  card: UnderstandingCard;
  knowledgeCard: KnowledgeCard | null;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  sessionProgress: SessionProgress;
  categoryProgress: CategoryProgress;
  questionMeta: QuestionMeta;
}

interface JargonTerm {
  term: string;
  translation: string;
}

// 専門用語辞書（キャッシュ）
let jargonCache: Record<string, { translation: string; category: string; difficulty: string }> | null = null;

export function QuizPracticeView({
  card,
  knowledgeCard,
  onAnswer,
  onNext,
  sessionProgress,
  categoryProgress,
  questionMeta
}: QuizPracticeViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [jargonTerms, setJargonTerms] = useState<JargonTerm[]>([]);
  const [jargonExpanded, setJargonExpanded] = useState(false);

  // 問題文と正解を取得（フォールバックチェーン）
  const getQuestionText = (): string => {
    if (knowledgeCard?.question_patterns?.correct_patterns?.[0]?.question_text) {
      return knowledgeCard.question_patterns.correct_patterns[0].question_text;
    }
    if (knowledgeCard?.question_patterns?.incorrect_patterns?.[0]?.question_text) {
      return knowledgeCard.question_patterns.incorrect_patterns[0].question_text;
    }
    if (card.sample_question) {
      return card.sample_question;
    }
    if (card.core_knowledge.examiners_intent) {
      return card.core_knowledge.examiners_intent;
    }
    return card.core_knowledge.rule || '学習カード';
  };

  const questionText = getQuestionText();

  const correctOption = knowledgeCard?.question_patterns?.correct_patterns?.[0]?.correct_option ??
                      knowledgeCard?.question_patterns?.incorrect_patterns?.[0]?.correct_option ??
                      true;

  const explanation = knowledgeCard?.question_patterns?.correct_patterns?.[0]?.explanation?.full ??
                   knowledgeCard?.question_patterns?.incorrect_patterns?.[0]?.explanation?.full ??
                   card.core_knowledge.essence;

  const rule = card.core_knowledge.rule;
  const essence = card.core_knowledge.essence;
  const examinersIntent = card.core_knowledge.examiners_intent;

  // ステップ分解
  const steps = card.step_decomposition && card.step_decomposition.length > 0
    ? card.step_decomposition
    : rule.split(/[。．]/).filter(s => s.trim().length > 10).map((sentence, index) => ({
        step_number: index + 1,
        content: sentence + '。',
        type: 'general' as const,
        key_elements: []
      }));

  // 1秒アンサー
  const oneSecondAnswer = essence.split('【本質】').pop()?.split('\n')[0] || essence.substring(0, 100) + '...';

  // 専門用語辞書をロード
  useState(() => {
    const loadJargonDictionary = async () => {
      if (jargonCache) {
        setJargonTerms(extractJargonTerms(rule, essence, jargonCache));
        return;
      }

      try {
        const response = await fetch('/jargon_dictionary.json');
        if (response.ok) {
          const data = await response.json();
          jargonCache = data.terms;
          if (jargonCache) {
            setJargonTerms(extractJargonTerms(rule, essence, jargonCache));
          }
        }
      } catch (error) {
        console.warn('専門用語辞書の読み込みに失敗しました:', error);
      }
    };

    loadJargonDictionary();
  });

  const handleAnswer = (correct: boolean) => {
    setSelectedAnswer(correct);
    setShowExplanation(true);
    onAnswer(correct);
  };

  const handleNextClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext();
      setIsExiting(false);
      setShowExplanation(false);
      setSelectedAnswer(null);
    }, 300);
  };

  const isCorrect = selectedAnswer === correctOption;
  const progressPercent = (sessionProgress.current / sessionProgress.total) * 100;
  const categoryPercent = categoryProgress.total > 0 ? (categoryProgress.learned / categoryProgress.total) * 100 : 0;

  // 実務トラブルの生成（ルール違反による具体的な被害例）
  const getRealWorldTrouble = (): string => {
    if (rule.includes('重要事項') || rule.includes('説明')) {
      return '重要事項を説明しなかった場合、買主が契約を解除できたり、損害賠償請求されたりする最悪の事態に！業者としての信頼も失います。';
    }
    if (rule.includes('手付金') || rule.includes('手付')) {
      return '手付金のルールを間違えると、倍返し請求や解約手付の没収で大きな金銭トラブルに発展！実務では数百万円単位のリスクがあります。';
    }
    if (rule.includes('契約') || rule.includes('解除')) {
      return '契約解除のルール違反は、契約無効による白紙に戻るだけでなく、違約金や損害賠償の請求に直結！実務で最も怖いトラブルの一つです。';
    }
    if (rule.includes('登記') || rule.includes('登記')) {
      return '登記の不備や漏れは、権利関係を巡る訴訟リスクを大幅に高めます！最悪の場合、物件を失うこともある致命的なミスです。';
    }
    if (rule.includes('宅地建物取引業') || rule.includes('宅建業')) {
      return '宅建業法違反は、業務停止命令や免許取消処分のリスク！業者としての生存に関わる最重要ルールです。';
    }
    if (rule.includes('広告') || rule.includes('誇大')) {
      return '誇大広告は課徴金や業務停止の対象！消費者庁や都道府県からの指導入りで、業者としての信用を失います。';
    }
    return `このルールを知らないと、実務では${['契約無効', '損害賠償請求', '業務停止', '信頼失墜', '訴訟リスク'][Math.floor(Math.random() * 5)]}といった致命的な問題に直結します！`;
  };

  const realWorldTrouble = getRealWorldTrouble();

  return (
    <div className={`min-h-screen bg-slate-50 ${isExiting ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
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
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-1">
              セッション: {sessionProgress.current} / {sessionProgress.total}
            </div>
          </div>

          {/* 問題カード */}
          <div className="bg-white rounded-[32px] shadow-soft overflow-hidden mb-6">
            {/* カテゴリーとタグ */}
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

            {/* 縦型フローコンテンツ */}
            <div className="p-6 space-y-6">
              {/* ① 問題文 */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border-2 border-rose-200">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={24} className="text-rose-600" />
                  <h3 className="text-lg font-black text-rose-900">問題</h3>
                </div>
                <p className="text-base leading-loose text-slate-800 font-medium">
                  {questionText}
                </p>
              </div>

              {/* ② 〇×選択（2択化） */}
              {!showExplanation && (
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
              )}

              {/* ③ 正解・不正解の表示 */}
              {showExplanation && (
                <div className={`p-6 rounded-2xl border-2 ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={24} className="text-emerald-600" />
                        <h3 className="text-lg font-black text-emerald-900">正解！</h3>
                      </>
                    ) : (
                      <>
                        <XCircle size={24} className="text-rose-600" />
                        <h3 className="text-lg font-black text-rose-900">不正解...</h3>
                      </>
                    )}
                  </div>
                  <p className="text-base text-slate-700">
                    {correctOption ? 'この文は正しいです' : 'この文は誤りです'}
                  </p>
                </div>
              )}

              {/* 💻 PCモード: 解説を常に展開 */}
              {showExplanation && (
                <div className="hidden md:block space-y-6">
                  {/* 本質 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain size={24} className="text-indigo-600" />
                      <h3 className="text-lg font-black text-indigo-900">本質</h3>
                    </div>
                    <p className="text-base leading-loose text-indigo-900 font-medium">
                      {oneSecondAnswer}
                    </p>
                  </div>

                  {/* 実務トラブル（NEW） */}
                  <div className="p-6 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-rose-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={28} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">
                          ⚠️ 実務でどうヤバいのか
                        </div>
                        <p className="text-base font-bold text-rose-900 leading-relaxed">
                          {realWorldTrouble}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 解説 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen size={24} className="text-indigo-600" />
                      <h3 className="text-lg font-black text-indigo-900">解説</h3>
                    </div>
                    <p className="text-base leading-loose text-indigo-900 bg-white p-5 rounded-xl border border-indigo-200">
                      {explanation}
                    </p>
                  </div>

                  {/* ルール */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen size={24} className="text-slate-600" />
                      <h3 className="text-lg font-black text-slate-900">公式ルール（法律の決まり）</h3>
                    </div>
                    <p className="text-base leading-loose text-slate-900 bg-white p-5 rounded-xl border border-slate-200">
                      {rule}
                    </p>
                  </div>

                  {/* ステップで理解 */}
                  {steps.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Target size={24} className="text-slate-600" />
                        <h3 className="text-lg font-black text-slate-900">ステップで理解</h3>
                      </div>
                      <div className="space-y-4">
                        {steps.map((step, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-xl flex items-center justify-center text-base font-black shadow-soft">
                              {step.step_number}
                            </div>
                            <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200">
                              <p className="text-base leading-relaxed text-slate-800">
                                {step.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 試験官の罠 */}
                  {examinersIntent && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Target size={24} className="text-purple-600" />
                        <h3 className="text-lg font-black text-purple-900">試験官の罠（出題者の意図）</h3>
                      </div>
                      <p className="text-base text-purple-900 leading-relaxed">
                        {examinersIntent}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 📱 スマホモード: 用語解説（アコーディオン式） */}
              {jargonTerms.length > 0 && (
                <div className="md:hidden bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                  <button
                    onClick={() => setJargonExpanded(!jargonExpanded)}
                    className="w-full flex items-center justify-between p-3 bg-white/60 rounded-xl border border-amber-200 hover:bg-white/80 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap size={20} className="text-amber-600" />
                      <span className="text-sm font-bold text-amber-900">
                        わからない用語の解説（{jargonTerms.length}語）
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-amber-600 transition-transform ${jargonExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {jargonExpanded && (
                    <div className="mt-3 space-y-2">
                      {jargonTerms.map((term, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-24 text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded">
                              {term.term}
                            </span>
                            <span className="text-sm text-slate-700 flex-1">
                              {term.translation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 📱 スマホモード: アクションボタン（Sticky配置） */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-100 z-50">
            {selectedAnswer !== null && (
              <button
                onClick={handleNextClick}
                className="w-full py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl font-black text-lg shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                次の問題へ
                <ArrowRight size={24} />
              </button>
            )}
          </div>

          {/* 💻 PCモード: アクションボタン（通常配置） */}
          <div className="hidden md:block">
            {selectedAnswer !== null && (
              <button
                onClick={handleNextClick}
                className="w-full py-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl font-black text-xl shadow-glow hover:shadow-glow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
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

/**
 * 専門用語を抽出して翻訳する
 */
function extractJargonTerms(
  rule: string,
  essence: string,
  dictionary: Record<string, { translation: string; category: string; difficulty: string }>
): JargonTerm[] {
  const terms: JargonTerm[] = [];

  // ルールと本質から専門用語を検索
  const combinedText = rule + essence;

  for (const [term, data] of Object.entries(dictionary)) {
    if (combinedText.includes(term)) {
      terms.push({ term, translation: data.translation });
    }
  }

  // 最大8つに制限
  return terms.slice(0, 8);
}
