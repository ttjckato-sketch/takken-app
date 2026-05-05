import React, { useState, useEffect } from 'react';
import { ArrowLeft, Library, Brain, Zap, Target } from 'lucide-react';
import { db, type KnowledgeCard, type KnowledgeProgress } from '../db';

interface KnowledgeCardViewProps {
  cardId?: string;
  onBack: () => void;
  categoryFilter?: string;
  learningTypeFilter?: 'understanding' | 'mixed' | 'memorization';
}

export function KnowledgeCardView({ cardId, onBack, categoryFilter, learningTypeFilter }: KnowledgeCardViewProps) {
  const [currentCard, setCurrentCard] = useState<KnowledgeCard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadCards();
  }, [categoryFilter, learningTypeFilter]);

  useEffect(() => {
    if (cards.length > 0) {
      if (cardId) {
        const idx = cards.findIndex(c => c.card_id === cardId);
        if (idx >= 0) {
          setCurrentIndex(idx);
        }
      }
      loadCard(cards[currentIndex]);
    }
  }, [cards, currentIndex, cardId]);

  const loadCards = async () => {
    let query = db.knowledge_cards.toCollection();

    if (categoryFilter) {
      const all = await db.knowledge_cards.where('knowledge_domain.major').equals(categoryFilter).toArray();
      setCards(all);
    } else if (learningTypeFilter) {
      const all = await db.knowledge_cards.toArray();
      const filtered = all.filter(c => c.learning_analysis?.type === learningTypeFilter);
      setCards(filtered);
    } else {
      const all = await db.knowledge_cards.toArray();
      setCards(all);
    }
  };

  const loadCard = async (card: KnowledgeCard) => {
    setCurrentCard(card);
    setShowAnswer(false);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      onBack();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const learningType = currentCard.learning_analysis?.type || 'mixed';
  const difficulty = currentCard.learning_analysis?.difficulty || 3;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft size={24} />
            <span className="font-bold">戻る</span>
          </button>
          <div className="text-center">
            <div className="text-xs font-black text-slate-400 uppercase">カード</div>
            <div className="text-sm font-bold text-slate-700">{currentIndex + 1} / {cards.length}</div>
          </div>
          <div className="w-20"></div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* カテゴリ情報 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black">
              {currentCard.knowledge_domain.major}
            </span>
            <div className="flex gap-2">
              {learningType === 'understanding' && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Brain size={12} />
                  理解重視
                </span>
              )}
              {learningType === 'memorization' && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Zap size={12} />
                  暗記重視
                </span>
              )}
            </div>
          </div>

          {/* タグ */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentCard.knowledge_domain.tags.slice(0, 5).map(tag => (
              <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                {tag}
              </span>
            ))}
          </div>

          {/* ルール */}
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="text-xs font-black text-indigo-600 uppercase mb-2">ルール</div>
            <p className="text-base font-bold text-indigo-900 leading-relaxed">
              {currentCard.core_knowledge.rule}
            </p>
          </div>

          {/* エッセンス */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <div className="text-xs font-black text-slate-400 uppercase mb-2">エッセンス</div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              {currentCard.core_knowledge.essence}
            </p>
          </div>

          {/* 出題者の意図 */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="text-xs font-black text-amber-600 uppercase mb-2 flex items-center gap-1">
              <Target size={12} />
              出題者の意図
            </div>
            <p className="text-sm font-bold text-amber-900 leading-relaxed">
              {currentCard.core_knowledge.examiners_intent}
            </p>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{currentCard.question_patterns.total}</div>
              <div className="text-xs font-bold text-slate-500">出題回数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-600">{Math.round(currentCard.question_patterns.correct_count / currentCard.question_patterns.total * 100)}%</div>
              <div className="text-xs font-bold text-slate-500">正答率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-amber-600">{currentCard.study_metadata.importance}</div>
              <div className="text-xs font-bold text-slate-500">重要度</div>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 active:scale-95 transition-all"
          >
            前のカード
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
          >
            {currentIndex < cards.length - 1 ? '次のカード' : '完了'}
          </button>
        </div>
      </div>
    </div>
  );
}
