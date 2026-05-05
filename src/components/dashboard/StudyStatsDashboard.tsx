/**
 * 学習統計ダッシュボード
 * 学習進捗を可視化
 */

import { TrendingUp, Target, Award, Flame, Calendar, Brain } from 'lucide-react';

interface StudyStatsDashboardProps {
  stats: {
    total: number;
    learned: number;
    due: number;
    streak: number;
    todayStudied: number;
    accuracy: number;
    totalReviews: number;
  };
}

export function StudyStatsDashboard({ stats }: StudyStatsDashboardProps) {
  const completionRate = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;
  const todayAccuracy = stats.accuracy > 0 ? Math.round(stats.accuracy * 100) : 0;

  const statCards = [
    {
      icon: Target,
      label: '学習進捗',
      value: `${completionRate}%`,
      subtitle: `${stats.learned}/${stats.total}カード`,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Calendar,
      label: '今日の復習',
      value: `${stats.due}枚`,
      subtitle: dueStatus(stats.due),
      color: stats.due > 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500',
      bgColor: stats.due > 0 ? 'bg-amber-50' : 'bg-emerald-50',
    },
    {
      icon: Flame,
      label: '継続日数',
      value: `${stats.streak}日`,
      subtitle: streakMessage(stats.streak),
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-50',
    },
    {
      icon: Brain,
      label: '今日の学習',
      value: `${stats.todayStudied}枚`,
      subtitle: '完了済み',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: TrendingUp,
      label: '正答率',
      value: `${todayAccuracy}%`,
      subtitle: accuracyMessage(todayAccuracy),
      color: todayAccuracy >= 70 ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500',
      bgColor: todayAccuracy >= 70 ? 'bg-emerald-50' : 'bg-amber-50',
    },
    {
      icon: Award,
      label: '総復習数',
      value: `${stats.totalReviews}回`,
      subtitle: '累計',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
    },
  ];

  function dueStatus(due: number): string {
    if (due === 0) return '完了';
    if (due < 10) return '少ない';
    if (due < 50) return '普通';
    return '多い';
  }

  function streakMessage(streak: number): string {
    if (streak === 0) return '開始';
    if (streak < 7) return '頑張れ';
    if (streak < 30) return '素晴らしい';
    return '伝説';
  }

  function accuracyMessage(accuracy: number): string {
    if (accuracy >= 90) return '完璧';
    if (accuracy >= 70) return '良好';
    if (accuracy >= 50) return '普通';
    return '要復習';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black mb-1">学習ダッシュボード</h2>
            <p className="text-indigo-100 text-sm font-medium">あなたの学習進捗を確認</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-indigo-200 mb-1">総カード数</div>
            <div className="text-3xl font-black">{stats.total}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase text-indigo-200 mb-1">学習済み</div>
            <div className="text-3xl font-black">{stats.learned}</div>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} p-5 rounded-3xl shadow-soft hover:shadow-medium transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon size={18} className="text-white" />
              </div>
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
            <div className="text-xs text-slate-600 font-medium">{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* 進捗バー */}
      <div className="bg-white p-6 rounded-3xl shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800">全体的な進捗</h3>
          <span className="text-2xl font-black text-indigo-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${completionRate}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center font-medium">
          {progressMessage(completionRate)}
        </p>
      </div>
    </div>
  );

  function progressMessage(rate: number): string {
    if (rate >= 90) return '🎉 もうすぐ完了！';
    if (rate >= 70) return '💪 順調に進んでいます';
    if (rate >= 50) return '👍 半分以上達成';
    if (rate >= 30) return '🌱 着実に成長中';
    return '🚀 まずは一歩から';
  }
}
