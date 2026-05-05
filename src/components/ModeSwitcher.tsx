/**
 * 宅建/賃貸 モード切替コンポーネント
 */

import { Building2, Home } from 'lucide-react';

type StudyMode = 'takken' | 'chintai';

interface ModeSwitcherProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
      <button
        onClick={() => onModeChange('takken')}
        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
          currentMode === 'takken'
            ? 'bg-white text-indigo-600 shadow-sm scale-105'
            : 'text-slate-500 hover:bg-slate-200'
        }`}
      >
        <Home size={18} strokeWidth={currentMode === 'takken' ? 2.5 : 2} />
        <span className="font-black text-sm">宅建</span>
      </button>
      <button
        onClick={() => onModeChange('chintai')}
        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
          currentMode === 'chintai'
            ? 'bg-white text-emerald-600 shadow-sm scale-105'
            : 'text-slate-500 hover:bg-slate-200'
        }`}
      >
        <Building2 size={18} strokeWidth={currentMode === 'chintai' ? 2.5 : 2} />
        <span className="font-black text-sm">賃貸管理</span>
      </button>
    </div>
  );
}
