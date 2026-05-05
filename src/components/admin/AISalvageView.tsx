import React from 'react';
import { Home, Zap } from 'lucide-react';

export const AISalvageView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="p-10 bg-slate-900 text-white min-h-screen font-sans">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black tracking-tighter">
                    🛠️ AI Salvage <span className="text-indigo-400 font-medium text-lg ml-2">PRO</span>
                </h1>
                <button 
                    onClick={onBack} 
                    className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-95"
                >
                    <Home size={24}/>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">待機中の救済候補</div>
                    <div className="text-3xl font-black text-white">0</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">承認済み</div>
                    <div className="text-3xl font-black text-emerald-400">0</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2">却下済み</div>
                    <div className="text-3xl font-black text-rose-400">0</div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[40px] p-20 text-center flex flex-col items-center gap-6">
                <Zap size={60} className="text-amber-400 opacity-20" fill="currentColor" />
                <div className="space-y-2">
                    <p className="text-xl font-bold text-slate-400">Human-in-the-loop 承認フローを構築中...</p>
                    <p className="text-sm text-slate-500 italic">v3.0.0 Foundation Reconstructed</p>
                </div>
            </div>
        </div>
    );
};
