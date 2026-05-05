import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { ArrowLeftRight, AlertTriangle, Brain, ChevronLeft, BookOpen, Layers } from 'lucide-react';
import { TAKKEN_PROTOTYPE_UNITS } from '../../utils/inputUnitPrototypes';

/**
 * 比較学習UI MVP (v1.0)
 * 混同しやすい論点を対比形式で学習する最小機能ビュー
 */
export const ComparisonLearningView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [comparisonPairs, setComparisonPairs] = useState<any[]>([]);

    useEffect(() => {
        // Prototype Units から比較情報を抽出してペアを作成
        const pairs = TAKKEN_PROTOTYPE_UNITS.filter(unit => unit.comparison && unit.comparison.length > 0).map(unit => {
            const comp = unit.comparison![0];
            const targetUnit = TAKKEN_PROTOTYPE_UNITS.find(u => u.linked_tags.includes(comp.target_tag));

            return {
                id: `COMP-${unit.unit_id}`,
                title: `${unit.title} vs ${comp.target_tag}`,
                left: {
                    title: unit.title,
                    conclusion: unit.conclusion,
                    point: unit.principle
                },
                right: {
                    title: comp.target_tag,
                    conclusion: targetUnit ? targetUnit.conclusion : '（関連論点）',
                    point: targetUnit ? targetUnit.principle : '（詳細は当該項目を参照）'
                },
                difference: comp.difference,
                trap: unit.trap_points[0] || 'ひっかけに注意',
                mnemonic: unit.memory_hook
            };
        });
        setComparisonPairs(pairs);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition-all active:scale-95"
                    >
                        <ChevronLeft size={20} /> 戻る
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                            <ArrowLeftRight size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800">比較学習</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Comparison MVP v1.0</p>
                        </div>
                    </div>
                    <div className="w-20 hidden md:block"></div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
                {/* Intro Section */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-black leading-tight italic">
                            「似ている論点」を<br/>
                            制する者は宅建を制す。
                        </h2>
                        <p className="text-indigo-100 font-bold leading-relaxed">
                            本試験で最も失点しやすい「ひっかけ」の多くは、類似した制度の混同です。
                            ここでは、それらの違いを「対比」によって明確に整理します。
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
                        <Layers size={160} />
                    </div>
                </div>

                {/* Pairs List */}
                <div className="grid grid-cols-1 gap-8">
                    {comparisonPairs.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                            <Layers className="mx-auto text-slate-200 mb-4" size={64} />
                            <p className="text-slate-400 font-black text-xl italic">No comparison data available.</p>
                        </div>
                    ) : (
                        comparisonPairs.map((pair, idx) => (
                            <div key={pair.id} className="group scroll-mt-24">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {pair.title}
                                    </h3>
                                </div>

                                <div className="bg-white rounded-[40px] shadow-soft border border-slate-100 overflow-hidden group-hover:shadow-xl transition-shadow duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        {/* 左側論点 */}
                                        <div className="p-8 md:p-10 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-glow-indigo"></div>
                                                <h4 className="font-black text-xl text-slate-800">{pair.left.title}</h4>
                                            </div>
                                            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 min-h-[140px] relative">
                                                <div className="absolute top-4 right-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Conclusion</div>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed pt-2">
                                                    {pair.left.conclusion}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 右側論点 */}
                                        <div className="p-8 md:p-10 space-y-6 bg-slate-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-rose-500 rounded-full shadow-glow-rose"></div>
                                                <h4 className="font-black text-xl text-slate-800">{pair.right.title}</h4>
                                            </div>
                                            <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 min-h-[140px] relative">
                                                <div className="absolute top-4 right-6 text-[10px] font-black text-rose-300 uppercase tracking-widest">Target</div>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed pt-2">
                                                    {pair.right.conclusion}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 違いのハイライト */}
                                    <div className="bg-slate-900 text-white p-8 md:p-10 relative overflow-hidden">
                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-amber-400">
                                                    <AlertTriangle size={20} />
                                                    <span className="text-xs font-black uppercase tracking-widest">ココが違う！</span>
                                                </div>
                                                <p className="text-lg font-black leading-snug">
                                                    {pair.difference}
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-indigo-400">
                                                    <Brain size={20} />
                                                    <span className="text-xs font-black uppercase tracking-widest">覚え方・ひっかけ</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-300 leading-relaxed">
                                                    {pair.mnemonic || pair.trap}
                                                </p>
                                            </div>
                                        </div>
                                        {/* 装飾用アイコン */}
                                        <ArrowLeftRight className="absolute -bottom-8 -right-8 text-white/5 rotate-12" size={180} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="py-12 border-t border-slate-200 text-center space-y-4">
                    <button 
                        onClick={onBack}
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-[24px] font-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        ホームに戻る
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Precision Learning System • Comparison MVP
                    </p>
                </div>
            </div>
        </div>
    );
};
