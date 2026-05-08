import React, { useEffect, useState } from 'react';
import { LayoutGrid, CheckCircle2, Circle, TrendingDown, Clock, Play } from 'lucide-react';
import { calculateCategoryProgressMetrics } from '../../utils/analytics';

interface CategoryProgressDashboardProps {
  examType: string;
  onStartCategory: (category: string) => void;
}

export const CategoryProgressDashboard: React.FC<CategoryProgressDashboardProps> = ({ examType, onStartCategory }) => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await calculateCategoryProgressMetrics(examType);
      setMetrics(data);
    };
    load();
  }, [examType]);

  if (metrics.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <LayoutGrid size={20} className="text-indigo-600" />
          <h3 className="text-lg font-black tracking-tighter">分野別進捗状況</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.name} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1 truncate">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.exam_type.toUpperCase()}</div>
                <h4 className="font-black text-slate-800 truncate">{m.name}</h4>
              </div>
              <button 
                onClick={() => onStartCategory(m.name)}
                className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm"
              >
                <Play size={16} fill="currentColor" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>進捗: {m.answered} / {m.total}</span>
                <span>正答率: {Math.round(m.accuracy * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(m.answered / m.total) * 100}%` }}></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-600">{m.answered}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle size={12} className="text-slate-200" />
                  <span className="text-[10px] font-black text-slate-400">{m.unanswered}</span>
                </div>
                {m.weakness > 20 && (
                  <div className="flex items-center gap-1 text-rose-500">
                    <TrendingDown size={12} />
                    <span className="text-[10px] font-black">要注意</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={12} />
                <span className="text-[10px] font-black italic">~{Math.round(m.unanswered * 2 / 60)}h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
