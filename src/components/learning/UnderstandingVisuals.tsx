import React from 'react';
import { ShieldCheck, Layout, Target, ArrowRight, Search, AlertCircle, CheckCircle2, Zap, Plus, Minus, Equal } from 'lucide-react';
import { InputUnit, UnderstandingVisual, CasePattern, TrapDetail, ExamReadingGuide } from '../../types/inputUnit';

interface UnderstandingVisualsProps {
    unit: InputUnit;
}

export const UnderstandingVisuals: React.FC<UnderstandingVisualsProps> = ({ unit }) => {
    
    const renderComparisonMatrix = (visual: UnderstandingVisual) => {
        if (visual.type !== 'comparison_matrix' && visual.type !== 'rule_table') return null;

        const isRuleTable = visual.type === 'rule_table';

        return (
            <section className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className={`${isRuleTable ? 'bg-emerald-900' : 'bg-slate-900'} p-6`}>
                    <div className="flex items-center gap-3 text-white font-black text-lg mb-1">
                        {isRuleTable ? <ShieldCheck className="text-emerald-400" size={20} /> : <Layout className="text-indigo-400" size={20} />} 
                        {visual.title}
                    </div>
                    <p className="text-slate-400 text-xs font-bold">
                        {isRuleTable ? '法的ルールを正確に把握しましょう' : '視覚的に違いを整理しましょう'}
                    </p>
                </div>
                
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">
                                    {isRuleTable ? '項目' : '比較ポイント'}
                                </th>
                                {visual.columns.map((col, i) => (
                                    <th key={i} className="p-4 text-xs font-black text-slate-800">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visual.rows.map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-xs font-black text-slate-500 bg-slate-50/50">{row.label}</td>
                                    {row.cells.map((cell, j) => (
                                        <td key={j} className={`p-4 text-xs font-bold ${
                                            row.emphasis === 'trap' ? 'text-rose-600 bg-rose-50/20' : 
                                            row.emphasis === 'rule' ? (isRuleTable ? 'text-emerald-600' : 'text-indigo-600') : 'text-slate-600'
                                        }`}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden p-4 space-y-4">
                    {visual.rows.map((row, i) => (
                        <div key={i} className="space-y-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</div>
                            <div className="grid grid-cols-1 gap-2">
                                {visual.columns.map((col, j) => (
                                    <div key={j} className={`p-3 rounded-xl border ${
                                        row.emphasis === 'trap' ? 'border-rose-100 bg-rose-50/30' : 
                                        row.emphasis === 'rule' ? (isRuleTable ? 'border-emerald-100 bg-emerald-50/30' : 'border-indigo-100 bg-indigo-50/30') : 'border-slate-100 bg-slate-50/50'
                                    }`}>
                                        <div className="text-[9px] font-black text-slate-400 mb-1">{col}</div>
                                        <div className={`text-xs font-bold ${
                                            row.emphasis === 'trap' ? 'text-rose-700' : 
                                            row.emphasis === 'rule' ? (isRuleTable ? 'text-emerald-700' : 'text-indigo-700') : 'text-slate-700'
                                        }`}>{row.cells[j]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderCaseFlow = (visual: UnderstandingVisual) => {
        if (visual.type !== 'case_flow') return null;

        return (
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-black text-lg px-1">
                    <Target className="text-indigo-500" size={20} /> {visual.title}
                </div>
                <div className="relative space-y-2">
                    {visual.rows.map((row, i) => (
                        <React.Fragment key={i}>
                            <div className={`p-5 rounded-2xl border-2 transition-all ${
                                row.emphasis === 'rule' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' :
                                row.emphasis === 'trap' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                                'bg-white border-slate-100 text-slate-800 shadow-sm'
                            }`}>
                                <div className="flex gap-4 items-center">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                                        row.emphasis === 'rule' ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`text-[9px] font-black uppercase tracking-wider ${
                                            row.emphasis === 'rule' ? 'text-indigo-200' : 'text-slate-400'
                                        }`}>
                                            {row.label}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1">
                                            {row.cells.map((cell, j) => (
                                                <div key={j} className="text-sm font-black leading-tight">
                                                    {cell}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {i < visual.rows.length - 1 && (
                                <div className="flex justify-center py-1">
                                    <ArrowRight className="rotate-90 text-slate-300" size={20} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </section>
        );
    };

    const renderCalculationFlow = (visual: UnderstandingVisual) => {
        if (visual.type !== 'calculation_flow') return null;

        return (
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-black text-lg px-1">
                    <Zap className="text-amber-500" fill="currentColor" size={20} /> {visual.title}
                </div>
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 space-y-4">
                    {visual.rows.map((row, i) => (
                        <div key={i} className="space-y-4">
                            <div className={`flex items-center gap-4 p-4 rounded-2xl ${
                                row.emphasis === 'rule' ? 'bg-indigo-50 border border-indigo-100' :
                                row.emphasis === 'trap' ? 'bg-rose-50 border border-rose-100' :
                                'bg-slate-50'
                            }`}>
                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                                    {i === 0 ? <Plus size={16} className="text-slate-400" /> : 
                                     i === visual.rows.length - 1 ? <Equal size={16} className="text-indigo-600" /> : 
                                     <Minus size={16} className="text-rose-400" />}
                                </div>
                                <div className="space-y-0.5 flex-grow">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {row.cells.map((cell, j) => (
                                            <div key={j} className={`text-sm font-black ${
                                                row.emphasis === 'rule' ? 'text-indigo-700' :
                                                row.emphasis === 'trap' ? 'text-rose-700' : 'text-slate-700'
                                            }`}>
                                                {cell}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {i < visual.rows.length - 1 && (
                                <div className="flex justify-center -my-2 relative z-10">
                                    <div className="w-px h-4 bg-slate-200" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderTrapDetails = (traps: TrapDetail[]) => {
        return (
            <section className="bg-rose-50 rounded-[32px] p-6 border border-rose-100 space-y-4">
                <div className="flex items-center gap-2 text-rose-700 font-black text-lg">
                    <Target className="text-rose-500" size={20} /> TRAP POINT
                </div>
                <div className="space-y-4">
                    {traps.map((trap, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100/50 space-y-3">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                                    <AlertCircle className="text-rose-600" size={18} />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest">よくある勘違い</div>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{trap.trap}</p>
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-50 space-y-3">
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{trap.why_wrong}</p>
                                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                    <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <CheckCircle2 size={10} /> 正しいルール
                                    </div>
                                    <p className="text-xs font-black text-emerald-800 leading-relaxed">{trap.correct_rule}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderExamGuide = (guides: ExamReadingGuide[]) => {
        return (
            <section className="bg-indigo-900 text-white rounded-[32px] p-6 shadow-lg space-y-4 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Zap size={100} fill="currentColor" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-black text-lg mb-4">
                        <Zap className="text-amber-400" fill="currentColor" size={20} /> 問題文の読み方
                    </div>
                    <div className="space-y-3">
                        {guides.map((guide, i) => (
                            <div key={i} className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-amber-400 text-amber-900 rounded text-[9px] font-black uppercase">
                                        SIGNAL
                                    </div>
                                    <p className="text-sm font-black">{guide.signal}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Search size={12} className="text-indigo-300 mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-bold text-indigo-100">{guide.check}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <ArrowRight size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                        <p className="text-xs font-black text-emerald-300 bg-emerald-900/50 px-2 py-1 rounded-lg border border-emerald-800/50 w-full">
                                            {guide.answer_pattern}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    };

    return (
        <div className="space-y-8">
            {unit.understanding_visual && unit.understanding_visual.type === 'calculation_flow' ? renderCalculationFlow(unit.understanding_visual) : null}
            {unit.understanding_visual && (unit.understanding_visual.type === 'comparison_matrix' || unit.understanding_visual.type === 'rule_table') ? renderComparisonMatrix(unit.understanding_visual) : null}
            {unit.understanding_visual && unit.understanding_visual.type === 'case_flow' ? renderCaseFlow(unit.understanding_visual) : null}
            
            {unit.trap_details && renderTrapDetails(unit.trap_details)}
            {unit.exam_reading_guide && renderExamGuide(unit.exam_reading_guide)}
        </div>
    );
};
