import React from 'react';
import { ArrowLeft, Library, Brain, Target, Zap } from 'lucide-react';
import { db } from '../db';

interface KnowledgeSelectViewProps {
  onSelectCategory: (category: string) => void;
  onSelectLearningType: (type: 'understanding' | 'mixed' | 'memorization') => void;
  onBack: () => void;
}

export function KnowledgeSelectView({ onSelectCategory, onSelectLearningType, onBack }: KnowledgeSelectViewProps) {
  const [categories, setCategories] = React.useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cards = await db.knowledge_cards.toArray();
    const categoryMap: Record<string, number> = {};

    cards.forEach(card => {
      const major = card.knowledge_domain.major;
      categoryMap[major] = (categoryMap[major] || 0) + 1;
    });

    const sorted = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setCategories(sorted);
    setLoading(false);
  };

  const majorCategories = [
    { name: '宅建業法', icon: Brain, color: 'blue', description: '1,319カード' },
    { name: '権利関係', icon: Library, color: 'emerald', description: '971カード' },
    { name: '法令上の制限', icon: Target, color: 'amber', description: '363カード' },
    { name: '税・その他', icon: Zap, color: 'rose', description: '119カード' },
    { name: '建築基準法', icon: Target, color: 'purple', description: '44カード' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">知識カード学習</h1>
          <p className="text-xs text-slate-400">科目または学習タイプを選択</p>
        </div>
      </div>

      {/* 学習タイプ別 */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">学習タイプ別</h2>
        <div className="grid gap-3">
          <button
            onClick={() => onSelectLearningType('understanding')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:bg-blue-50 transition-colors flex items-center gap-4"
          >
            <div className="bg-blue-100 p-3 rounded-2xl">
              <Brain size={24} className="text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-black text-slate-800">理解型</div>
              <div className="text-xs text-slate-400">本質理解を優先</div>
            </div>
            <div className="text-xs font-black text-blue-600">2,928</div>
          </button>

          <button
            onClick={() => onSelectLearningType('mixed')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:bg-amber-50 transition-colors flex items-center gap-4"
          >
            <div className="bg-amber-100 p-3 rounded-2xl">
              <Zap size={24} className="text-amber-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-black text-slate-800">混合型</div>
              <div className="text-xs text-slate-400">理解+暗記</div>
            </div>
            <div className="text-xs font-black text-amber-600">795</div>
          </button>

          <button
            onClick={() => onSelectLearningType('memorization')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:bg-rose-50 transition-colors flex items-center gap-4"
          >
            <div className="bg-rose-100 p-3 rounded-2xl">
              <Target size={24} className="text-rose-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-black text-slate-800">暗記型</div>
              <div className="text-xs text-slate-400">数値・期間の記憶</div>
            </div>
            <div className="text-xs font-black text-rose-600">152</div>
          </button>
        </div>
      </div>

      {/* 科目別 */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">大分野別</h2>
        <div className="grid gap-3">
          {majorCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:bg-${cat.color}-50 transition-colors flex items-center gap-4`}
              >
                <div className={`bg-${cat.color}-100 p-3 rounded-2xl`}>
                  <Icon size={24} className={`text-${cat.color}-600`} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-slate-800">{cat.name}</div>
                  <div className="text-xs text-slate-400">{cat.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 全カテゴリ */}
      {!loading && categories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">全カテゴリ</h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-700">{cat.name}</span>
                <span className="text-xs font-black text-slate-400">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
