import React, { useEffect, useState } from 'react';
import { Home, ChevronRight, ShieldCheck, AlertTriangle, Database, Zap, Map } from 'lucide-react';
import { db } from '../../db';
import { ARTICLE_35_TEMPLATE, type Article35Item } from '../../utils/professional/article35Template';
import { calculateProHeatmap, type RiskScore } from '../../utils/professional/riskAnalysis';

export const RealityProjectionView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [selectedItem, setSelectedItem] = useState<Article35Item | null>(null);
    const [riskMap, setRiskMap] = useState<RiskScore[]>([]);
    const [relatedCards, setSelectedCards] = useState<any[]>([]);

    useEffect(() => {
        const init = async () => {
            const heatmap = await calculateProHeatmap();
            setRiskMap(heatmap);
        };
        init();
    }, []);

    const handleItemClick = async (item: Article35Item) => {
        setSelectedItem(item);
        // Find cards matching template tags
        const cards = await db.understanding_cards
            .filter(c => item.tags.some(t => c.category?.includes(t) || (c.tags && c.tags.includes(t))))
            .limit(5)
            .toArray();
        setSelectedCards(cards);
    };

    const getRiskForTag = (tags: string[]) => {
        const scores = riskMap.filter(r => tags.includes(r.tag)).map(r => r.score);
        return scores.length > 0 ? Math.max(...scores) : 0;
    };

    return (
        <div className="p-10 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                            <Map className="text-indigo-600" size={36} /> Reality Projection <span className="text-indigo-500 font-medium text-lg ml-2">PRO</span>
                        </h1>
                        <p className="text-slate-500 font-bold">35条重要事項説明書：理論と実務の完全同期</p>
                    </div>
                    <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-full shadow-soft hover:bg-slate-50 transition-all active:scale-95">
                        <Home size={24}/>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Document Template Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 shadow-soft">
                            <h2 className="text-xl font-black mb-6 border-b pb-4">35条重要事項説明書 項目一覧</h2>
                            <div className="space-y-3">
                                {ARTICLE_35_TEMPLATE.map(item => {
                                    const risk = getRiskForTag(item.tags);
                                    return (
                                        <button 
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
                                            className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group ${selectedItem?.id === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-glow-indigo' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${risk > 0.5 ? 'bg-rose-500 animate-pulse' : (risk > 0 ? 'bg-amber-500' : 'bg-emerald-500')}`} />
                                                <div className="space-y-0.5">
                                                    <div className="font-black text-sm">{item.title}</div>
                                                    <div className={`text-[10px] font-bold ${selectedItem?.id === item.id ? 'text-indigo-200' : 'text-slate-400'}`}>{item.description}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className={selectedItem?.id === item.id ? 'text-indigo-200' : 'text-slate-300 group-hover:text-indigo-400'} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Simulation Panel Column */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl sticky top-10">
                            {selectedItem ? (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border border-indigo-500/30">
                                            Simulation Active
                                        </div>
                                        <h3 className="text-2xl font-black leading-tight">{selectedItem.title}</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">関連する法的エビデンス</h4>
                                        <div className="space-y-3">
                                            {relatedCards.length > 0 ? (
                                                relatedCards.map((card, i) => (
                                                    <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:bg-white/10 transition-colors cursor-pointer group">
                                                        <div className="flex justify-between items-start">
                                                            <div className="text-[10px] font-black text-indigo-400">{card.category}</div>
                                                            {card.srs_params?.difficulty > 5 && <ShieldCheck size={14} className="text-rose-500" />}
                                                        </div>
                                                        <p className="text-xs font-bold leading-relaxed line-clamp-2">{card.sample_question || card.core_knowledge?.rule}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-10 text-center text-slate-600 font-bold italic text-sm border-2 border-dashed border-slate-800 rounded-2xl">
                                                    No matches found
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-3 text-amber-400 mb-2">
                                            <AlertTriangle size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Risk Summary</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                                            あなたの学習履歴に基づき、この項目に関連する「ひっかけ問題」への耐性は {relatedCards.some(c => c.srs_params?.difficulty > 5) ? '低い' : '高い'} と判定されました。
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                        <Zap size={40} className="text-slate-700" fill="currentColor" />
                                    </div>
                                    <p className="text-slate-500 font-bold text-sm">左側の項目を選択して<br/>実務シミュレーションを開始してください</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
