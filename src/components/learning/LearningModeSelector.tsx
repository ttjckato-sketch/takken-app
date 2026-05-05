/**
 * 統合学習モード選択コンポーネント
 */

import { Brain, Layers, BookOpen, Zap } from 'lucide-react';

interface LearningModeSelectorProps {
  onSelectMode: (mode: 'understanding' | 'memorization' | 'integrated') => void;
  stats: {
    due: number;
    learned: number;
    total: number;
  };
}

export function LearningModeSelector({ onSelectMode, stats }: LearningModeSelectorProps) {
  const modes = [
    {
      id: 'understanding' as const,
      title: '理解優先モード',
      description: 'アナロジー・ステップ分解で理解を深める',
      icon: <Layers size={24} />,
      color: 'from-amber-500 to-orange-500',
      features: ['アナロジー表示', 'ステップ分解', 'メタ認知プロンプト']
    },
    {
      id: 'memorization' as const,
      title: '記憶優先モード',
      description: 'SRS・想起練習で記憶に定着',
      icon: <Brain size={24} />,
      color: 'from-blue-500 to-cyan-500',
      features: ['間隔反復', '想起練習', '誤概念訂正']
    },
    {
      id: 'integrated' as const,
      title: 'フル統合モード',
      description: '理解と記憶のバランスで学習',
      icon: <Zap size={24} />,
      color: 'from-indigo-500 to-purple-500',
      features: ['全機能統合', '最適学習パス', 'AI推奨']
    }
  ];

  return (
    <div className="space-y-6">
      {/* モード選択 */}
      <div className="grid gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className="w-full text-left p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 bg-white"
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 bg-gradient-to-br ${mode.color} p-3 rounded-2xl text-white`}>
                {mode.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-lg mb-1">{mode.title}</h3>
                <p className="text-xs text-slate-500 font-medium mb-2">{mode.description}</p>
                <div className="flex flex-wrap gap-1">
                  {mode.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* クイックスタート */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl text-white">
        <h3 className="font-black text-lg mb-2">🚀 クイックスタート</h3>
        <button
          onClick={() => onSelectMode('integrated')}
          className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-colors"
        >
          今日の復習を開始（{stats.due}枚）
        </button>
      </div>

      {/* 統計サマリー */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 mb-4">学習状況</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">総カード数</span>
            <span className="text-sm font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">学習済み</span>
            <span className="text-sm font-black text-indigo-600">{stats.learned}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">復習待ち</span>
            <span className="text-sm font-black text-amber-600">{stats.due}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
