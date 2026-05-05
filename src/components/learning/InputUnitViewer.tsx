import React from 'react';
import { ChevronLeft, Zap, Info, ShieldCheck, AlertCircle, BookOpen, CheckCircle2, MessageSquare, Star } from 'lucide-react';
import { InputUnit } from '../../types/inputUnit';

interface InputUnitViewerProps {
    unit: InputUnit;
    onClose: () => void;
    onStartFocus?: (tag: string) => void;
}

export const InputUnitViewer: React.FC<InputUnitViewerProps> = ({ unit, onClose, onStartFocus }) => {
    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 text-slate-600 font-bold"
                    >
                        <ChevronLeft size={20} /> Dashboard
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Knowledge Unit
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-10 space-y-10">
                {/* Main Content */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black text-slate-900 leading-tight">{unit.title}</h1>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {unit.linked_tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Conclusion Highlight */}
                    <div className="bg-indigo-600 text-white rounded-[40px] p-10 shadow-glow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Star size={160} fill="currentColor" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> 一言結論
                            </div>
                            <p className="text-2xl font-black leading-relaxed">
                                {unit.conclusion}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Purpose & Requirements */}
                    <div className="space-y-8">
                        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-soft space-y-6">
                            <div className="flex items-center gap-3 text-slate-800 font-black text-lg">
                                <Info className="text-indigo-500" /> 制度の趣旨
                            </div>
                            <p className="text-slate-600 font-bold leading-relaxed">
                                {unit.purpose}
                            </p>
                        </section>

                        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-soft space-y-6">
                            <div className="flex items-center gap-3 text-slate-800 font-black text-lg">
                                <BookOpen className="text-emerald-500" /> 成立要件
                            </div>
                            <ul className="space-y-3">
                                {unit.requirements.map((req, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 font-bold">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Principle & Exceptions */}
                    <div className="space-y-8">
                        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-soft space-y-6">
                            <div className="flex items-center gap-3 text-slate-800 font-black text-lg">
                                <Zap className="text-amber-500" fill="currentColor" /> 原則
                            </div>
                            <p className="text-slate-600 font-bold leading-relaxed p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                {unit.principle}
                            </p>
                        </section>

                        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-soft space-y-6">
                            <div className="flex items-center gap-3 text-slate-800 font-black text-lg">
                                <AlertCircle className="text-rose-500" /> 例外
                            </div>
                            <ul className="space-y-3">
                                {unit.exceptions.map((ex, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 font-bold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                                        <span>{ex}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Traps & Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl space-y-6">
                        <div className="flex items-center gap-3 font-black text-lg">
                            <AlertCircle className="text-rose-400" /> ひっかけポイント
                        </div>
                        <ul className="space-y-4">
                            {unit.trap_points.map((trap, i) => (
                                <li key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold text-slate-300">
                                    {trap}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-soft space-y-6">
                        <div className="flex items-center gap-3 text-slate-800 font-black text-lg">
                            <MessageSquare className="text-indigo-400" /> 混同しやすい制度
                        </div>
                        <div className="space-y-4">
                            {unit.comparison.map((comp, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">vs {comp.target_tag}</div>
                                    <p className="text-sm font-bold text-slate-600">{comp.difference}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Example Cases */}
                <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-soft space-y-8">
                    <h3 className="text-2xl font-black text-slate-800">具体例と反例</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block">
                                具体例 (Case A)
                            </div>
                            <p className="text-slate-600 font-bold leading-relaxed italic">
                                "{unit.cases.concrete_example}"
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="px-4 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block">
                                反例 (Case B)
                            </div>
                            <p className="text-slate-600 font-bold leading-relaxed italic">
                                "{unit.cases.counter_example}"
                            </p>
                        </div>
                    </div>
                </section>

                {/* Repair & Action */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-soft flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2 max-w-xl text-center md:text-left">
                        <h4 className="text-xl font-black text-slate-800">理解できましたか？</h4>
                        <p className="text-slate-500 font-bold">
                            この論点の特訓（10問集中）を開始して、知識を定着させましょう。
                        </p>
                    </div>
                    <button 
                        onClick={() => onStartFocus?.(unit.linked_tags[0])}
                        className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white rounded-3xl px-10 py-5 font-black text-xl shadow-glow-rose transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Zap size={24} fill="currentColor" /> 特訓を開始
                    </button>
                </div>

                {/* Source Trace */}
                <div className="pt-10 border-t border-slate-200">
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest justify-center md:justify-start">
                        <span>法的根拠:</span>
                        {unit.source_trace.map((source, i) => (
                            <div key={i} className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                                <ShieldCheck size={12} />
                                {source.text || source.id}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
