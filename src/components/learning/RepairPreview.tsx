import React, { useState } from 'react';
import { Zap, AlertTriangle, ChevronRight, BookOpen, ShieldCheck, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { InputUnit } from '../../types/inputUnit';

interface RepairPreviewProps {
    unit: InputUnit | null;
    onViewDetail: (unit: InputUnit) => void;
    onNext: () => void;
}

export const RepairPreview: React.FC<RepairPreviewProps> = ({ unit, onViewDetail, onNext }) => {
    const [recheckAnswered, setRecheckAnswered] = useState(false);
    const [recheckCorrect, setRecheckAnsweredCorrect] = useState<boolean | null>(null);

    const handleRecheck = (answer: string) => {
        const isCorrect = answer === unit?.check_question.answer;
        setRecheckAnsweredCorrect(isCorrect);
        setRecheckAnswered(true);
    };

    if (!unit) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 text-center space-y-4">
                <div className="text-slate-400 font-bold italic">この論点の構造化解説は準備中です。</div>
                <button onClick={onNext} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 mx-auto">
                    次へ進む <ChevronRight size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-rose-100 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-rose-50 px-8 py-4 flex justify-between items-center border-b border-rose-100">
                <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest">
                    <AlertTriangle size={14} /> 誤答補修インプット
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-rose-200 text-[9px] font-bold text-rose-400">
                    <ShieldCheck size={10} /> source_trace: {unit.source_trace[0]?.text || 'OK'}
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Conclusion Mini Card */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">{unit.title}</h3>
                    <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-glow relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={60} fill="currentColor" />
                         </div>
                         <div className="relative z-10 space-y-2">
                             <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">正しい結論</div>
                             <p className="font-bold leading-relaxed">{unit.conclusion}</p>
                         </div>
                    </div>
                </div>

                {/* Repair Explanation (Digest) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={10} className="text-rose-500" /> ひっかけポイント
                        </div>
                        <ul className="space-y-2">
                            {unit.trap_points.slice(0, 2).map((trap, i) => (
                                <li key={i} className="text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                    " {trap} "
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <BookOpen size={10} className="text-indigo-500" /> 補修アドバイス
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm font-bold text-indigo-900 leading-relaxed">
                            {unit.repair_explanation.short_note}
                        </div>
                    </div>
                </div>

                {/* Comparison (P46 強化) */}
                {unit.comparison && unit.comparison.length > 0 && (
                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <ArrowLeftRight size={10} className="text-amber-500" /> 似た制度との違い
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {unit.comparison.map((comp, i) => (
                                <div key={i} className="flex flex-col md:flex-row bg-amber-50/50 border border-amber-100 rounded-2xl overflow-hidden">
                                    <div className="md:w-1/3 bg-amber-100/50 p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-amber-100">
                                        <div className="text-xs font-black text-amber-800 text-center">
                                            {unit.title.split('の')[0]} <br/><span className="text-amber-500 my-1 inline-block">vs</span><br/> {comp.target_tag}
                                        </div>
                                    </div>
                                    <div className="md:w-2/3 p-4 flex items-center">
                                        <p className="text-sm font-bold text-amber-900 leading-relaxed">
                                            {comp.difference}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 1-Question Recheck */}
                {!recheckAnswered ? (
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase">
                            <Zap size={14} fill="currentColor" /> 今すぐ理解度再確認
                        </div>
                        <p className="font-bold text-lg">{unit.check_question.question}</p>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button onClick={() => handleRecheck('○')} className="bg-white/10 hover:bg-emerald-500 py-3 rounded-2xl font-black transition-all">○</button>
                            <button onClick={() => handleRecheck('×')} className="bg-white/10 hover:bg-rose-500 py-3 rounded-2xl font-black transition-all">×</button>
                        </div>
                    </div>
                ) : (
                    <div className={`p-6 rounded-3xl flex items-center justify-between gap-4 border-2 ${recheckCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                        <div className="flex items-center gap-3">
                            {recheckCorrect ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                            <div className="font-black">
                                {recheckCorrect ? '正解！理解が深まりました。' : 'まだ迷いがあるようです。'}
                            </div>
                        </div>
                        {!recheckCorrect && (
                            <button onClick={() => onViewDetail(unit)} className="px-4 py-2 bg-white rounded-xl text-xs font-black border border-current transition-all">
                                解説を詳しく見る
                            </button>
                        )}
                    </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <button 
                        onClick={() => onViewDetail(unit)}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black shadow-glow transition-all active:scale-95"
                    >
                        <BookOpen size={20} /> 解説の全容を読む
                    </button>
                    <button 
                        onClick={onNext}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-black transition-all active:scale-95"
                    >
                        次の問題へ進む <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
