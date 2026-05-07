/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { Home, ChevronRight, Zap, RefreshCw, Brain, AlertTriangle, ArrowLeftRight, TrendingDown, Target, Compass, Info, Star, TrendingUp, BookOpen, Database, CheckCircle2 } from 'lucide-react';
import { db } from './db';
import { ActiveRecallView } from './components/learning/ActiveRecallView';
import { MemoryRecallView } from './components/learning/MemoryRecallView';
import { NumberRecallView } from './components/learning/NumberRecallView';
import { TrapRecallView } from './components/learning/TrapRecallView';
import { ComparisonRecallView } from './components/learning/ComparisonRecallView';
import { RepairPreview } from './components/learning/RepairPreview';
import { getStudyDashboard, buildDailyStudySessionQueue, startStudySession, completeStudySession, updateCardSRS } from './utils/analytics';
import { ensureAllDataReady } from './utils/dataInitializer';
import { resolvePublicAssetPath } from './utils/publicAssetPath';

import { InputUnitViewer } from './components/learning/InputUnitViewer';
import { ComparisonLearningView } from './components/learning/ComparisonLearningView';
import { TAKKEN_PROTOTYPE_UNITS } from './utils/inputUnitPrototypes';
import { DataExplorerView } from './components/admin/DataExplorerView';
import { AISalvageView } from './components/admin/AISalvageView';
import { RealityProjectionView } from './components/admin/RealityProjectionView';

type HomeStats = {
  total: number;
  learned: number;
  due: number;
  streak: number;
  todayStudied: number;
  accuracy: number;
  totalReviews: number;
};

type TabType = 'home' | 'study_session' | 'session_summary' | 'input_viewer' | 'comparison_viewer' | 'admin_explorer' | 'ai_salvage' | 'reality_projection';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<HomeStats>({ total: 0, learned: 0, due: 0, streak: 0, todayStudied: 0, accuracy: 0, totalReviews: 0 });
  const [examTypeFilter, setExamTypeFilter] = useState<'takken' | 'chintai' | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  
  const [knowledgeQueue, setKnowledgeQueue] = useState<any[]>([]);
  const [activeKnowledgeCard, setActiveKnowledgeCard] = useState<any>(null);
  const [activeInputUnit, setActiveInputUnit] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<any>(null);

  // P46: Dev-only Input Unit Preview Logic
  const [devPreviewUnit, setDevPreviewUnit] = useState<any>(null);
  useEffect(() => {
      if (import.meta.env.DEV) {
          const params = new URLSearchParams(window.location.search);
          const tag = params.get('devRepairTag');
          const unitId = params.get('devRepairUnit');
          
          if (tag || unitId) {
              const unit = TAKKEN_PROTOTYPE_UNITS.find(u => 
                  (tag && u.linked_tags.includes(tag)) || (unitId && u.unit_id === unitId)
              );
              if (unit) {
                  setDevPreviewUnit(unit);
              } else {
                  console.warn('Dev Preview: Unit not found for', tag || unitId);
              }
          }
      }
  }, []);

  const viewInputUnit = (tag: string) => {
    const unit = TAKKEN_PROTOTYPE_UNITS.find(u => u.linked_tags.includes(tag));
    if (unit) {
      setActiveInputUnit(unit);
      setCurrentTab('input_viewer');
    } else {
      alert('この分野の構造化インプットはまだ準備中です。');
    }
  };

  const startMemoryRecallTest = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(10, 'memory_recall');
      setCurrentSessionId(sessionId);
      
      const { buildMemoryRecallQueue } = await import('./utils/analytics');
      const queue = await buildMemoryRecallQueue({ examType: examTypeFilter || 'all', limit: 10 });
      
      if (queue.length === 0) {
        alert('Memory Cardsが見つかりませんでした。db-audit.htmlから生成してください。');
        setLoading(false);
        return;
      }

      const validCards = queue.map(i => ({ ...i, session_mode: 'memory_recall' }));
      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (err) {
      console.error('MemoryRecall start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTrapRecallTest = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(10);
      setCurrentSessionId(sessionId);
      const { buildTrapRecallQueue } = await import('./utils/analytics');
      const queue = await buildTrapRecallQueue({ examType: examTypeFilter || 'all', limit: 10 });
      if (queue.length === 0) {
        alert('Trap候補が見つかりませんでした。');
        setLoading(false);
        return;
      }
      setKnowledgeQueue(queue);
      setActiveKnowledgeCard(queue[0]);
      setCurrentTab('study_session');
    } catch (err) {
      console.error('TrapRecall start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startComparisonRecallTest = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(10);
      setCurrentSessionId(sessionId);
      const { buildComparisonRecallQueue } = await import('./utils/analytics');
      const queue = await buildComparisonRecallQueue({ examType: examTypeFilter || 'all', limit: 10 });
      if (queue.length === 0) {
        alert('比較候補が見つかりませんでした。');
        setLoading(false);
        return;
      }
      setKnowledgeQueue(queue);
      setActiveKnowledgeCard(queue[0]);
      setCurrentTab('study_session');
    } catch (err) {
      console.error('ComparisonRecall start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startFocusRecall = async (tag: string) => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(10, 'focus_10q');
      setCurrentSessionId(sessionId);
      const { buildFocusModeQueue } = await import('./utils/analytics');
      const queue = await buildFocusModeQueue({ tag, limit: 10 });
      
      if (queue.length === 0) {
        alert(`${tag} に関連する有効なカードが見つかりませんでした。`);
        setLoading(false);
        return;
      }

      const cards = await Promise.all(queue.map(async i => {
        const cardId = i.card_id || i.id;
        if (i.session_mode === 'active_recall') {
          const c = await db.understanding_cards.get(cardId);
          return c ? { ...c, card_id: cardId, session_mode: 'active_recall' } : null;
        }
        return { ...i, card_id: cardId, session_mode: i.session_mode };
      }));

      let validCards = (cards.filter(c => c !== null) as any[]);

      // P46: Focus 10Q冒頭にInput Unitを1枚だけ任意表示
      const unit = TAKKEN_PROTOTYPE_UNITS.find(u => u.linked_tags.includes(tag));
      if (unit) {
          validCards = [
              { session_mode: 'focus_intro', unit, id: `intro_${unit.unit_id}` },
              ...validCards
          ];
      }

      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (err) {
      console.error('FocusRecall start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    const dbDashboard = await getStudyDashboard();
    setDashboard(dbDashboard);
    const streakData = await db.metadata.get('streak');
    setStats(prev => ({ ...prev, streak: streakData?.value || 0 }));
  };

  // 状態の保存 (localStorage)
  useEffect(() => {
    if (currentTab === 'study_session' && currentSessionId && activeKnowledgeCard) {
      const idx = knowledgeQueue.findIndex(c => (c.card_id || c.id) === (activeKnowledgeCard.card_id || activeKnowledgeCard.id));
      localStorage.setItem('takken_session_state_v2', JSON.stringify({
        tab: currentTab,
        sessionId: currentSessionId,
        queue: knowledgeQueue,
        activeCardIdx: idx >= 0 ? idx : 0
      }));
    } else if (currentTab === 'home' || currentTab === 'session_summary') {
      localStorage.removeItem('takken_session_state_v2');
    }
  }, [currentTab, currentSessionId, knowledgeQueue, activeKnowledgeCard]);

  useEffect(() => {
    const init = async () => {
      await ensureAllDataReady();

      // 初期タブの制御 (URLパラメータ優先)
      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get('tab') as TabType;
      if (initialTab && ['admin_explorer', 'ai_salvage', 'reality_projection'].includes(initialTab)) {
          setCurrentTab(initialTab);
      }
      
      // 状態の復元
      const savedState = localStorage.getItem('takken_session_state_v2');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setKnowledgeQueue(parsed.queue || []);
          setCurrentSessionId(parsed.sessionId);
          if (parsed.queue && parsed.queue[parsed.activeCardIdx]) {
            setActiveKnowledgeCard(parsed.queue[parsed.activeCardIdx]);
            setCurrentTab(parsed.tab);
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
          localStorage.removeItem('takken_session_state_v2');
        }
      }
      
      await refreshStats();
    };
    init();
  }, [examTypeFilter]);

  const startDailySession = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(30);
      setCurrentSessionId(sessionId);
      const queue = await buildDailyStudySessionQueue({ examType: examTypeFilter || 'all', limit: 30 });
      
      const cards = await Promise.all(queue.map(async i => {
        const cardId = i.card_id || i.asset_id || i.id;
        if (i.session_mode === 'active_recall') {
          const c = await db.understanding_cards.get(cardId);
          return c ? { ...c, card_id: cardId, session_mode: i.session_mode } : null;
        }
        return { ...i, card_id: cardId, session_mode: i.session_mode };
      }));

      const validCards = (cards.filter(c => c !== null) as any[]);
      if (validCards.length === 0) {
        alert('学習対象のカードが見つかりませんでした。');
        return;
      }
      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (err) {
      console.error('Session start error:', err);
    } finally { 
      setLoading(false); 
    }
  };

  const startWrongAnswerSession = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(20, 'wrong_answer');
      setCurrentSessionId(sessionId);
      const { buildWrongAnswerQueue } = await import('./utils/analytics');
      const queue = await buildWrongAnswerQueue({ examType: examTypeFilter || 'all', limit: 20 });
      const validCards = queue.map(c => ({ ...c, session_mode: 'active_recall' }));
      if (validCards.length === 0) {
        alert('直近で間違えた問題はありません！素晴らしいです。');
        return;
      }
      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startUnansweredSession = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(20, 'unanswered');
      setCurrentSessionId(sessionId);
      const { buildUnansweredQueue } = await import('./utils/analytics');
      const queue = await buildUnansweredQueue({ examType: examTypeFilter || 'all', limit: 20 });
      const validCards = queue.map(c => ({ ...c, session_mode: 'active_recall' }));
      if (validCards.length === 0) {
        alert('すべての問題に回答済みです！');
        return;
      }
      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startWeakTopicSession = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(20, 'weak_topic');
      setCurrentSessionId(sessionId);
      const priorityTag = dashboard.priority_tag;
      if (!priorityTag) {
        alert('データが不足しており、弱点分野を特定できませんでした。');
        return;
      }
      const { buildWeakTopicQueue } = await import('./utils/analytics');
      const queue = await buildWeakTopicQueue({ topic: priorityTag.name, limit: 20 });
      const validCards = queue.map(c => ({ ...c, session_mode: 'active_recall' }));
      if (validCards.length === 0) {
        alert('対象カードがありません。');
        return;
      }
      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startThirtyFiveSession = async () => {
    setLoading(true);
    try {
      const sessionId = await startStudySession(35, '35q');
      setCurrentSessionId(sessionId);
      const { buildDailyStudySessionQueue } = await import('./utils/analytics');
      const queue = await buildDailyStudySessionQueue({ examType: examTypeFilter || 'all', variant: '35q' });
      
      const cards = await Promise.all(queue.map(async i => {
        const cardId = i.card_id || i.asset_id || i.id;
        if (i.session_mode === 'active_recall') {
          const c = await db.understanding_cards.get(cardId);
          return c ? { ...c, card_id: cardId, session_mode: i.session_mode } : null;
        }
        return { ...i, card_id: cardId, session_mode: i.session_mode };
      }));

      const validCards = (cards.filter(c => c !== null) as any[]);
      if (validCards.length === 0) {
        alert('学習対象のカードが見つかりませんでした。');
        setLoading(false);
        return;
      }
      setKnowledgeQueue(validCards);
      setActiveKnowledgeCard(validCards[0]);
      setCurrentTab('study_session');
    } catch (err) {
      console.error('35Q Session start error:', err);
    } finally { 
      setLoading(false); 
    }
  };

  const finishSession = async () => {
    if (!currentSessionId) return;
    setLoading(true);
    try {
      const summary = await completeStudySession(currentSessionId);
      setSessionSummary(summary);
      setCurrentTab('session_summary');
      localStorage.removeItem('takken_session_state_v2');
      await refreshStats();
    } catch (err) {
      console.error('Finish session error:', err);
      setCurrentTab('home');
    } finally { 
      setLoading(false); 
    }
  };

  const currentIdx = activeKnowledgeCard ? knowledgeQueue.findIndex(c => (c.card_id || c.id) === (activeKnowledgeCard.card_id || activeKnowledgeCard.id)) : -1;

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <div className="space-y-8 max-w-4xl mx-auto py-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">TAKKEN OS</h1>
              <div className="flex justify-center gap-2 mt-4">
                {[
                  { label: '📚 全て', value: null },
                  { label: '🏢 宅建', value: 'takken' },
                  { label: '🏠 賃管', value: 'chintai' }
                ].map((opt) => (
                  <button key={opt.label} onClick={() => setExamTypeFilter(opt.value as any)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      examTypeFilter === opt.value
                        ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {dashboard && (
                <div className="space-y-6">
                    {/* P46: 新規ユーザー向け動的ガイダンス */}
                    {dashboard.is_new_user && (
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl border border-white/10 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-1000">
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                                        <Compass size={12} /> Getting Started Guide
                                    </div>
                                    <h2 className="text-4xl font-black leading-tight tracking-tighter">
                                        最短で合格を<br/>
                                        手に入れる４ステップ。
                                    </h2>
                                    <p className="text-slate-400 font-bold leading-relaxed">
                                        TAKKEN OSは、単なる問題集ではありません。
                                        脳科学に基づいた「正のループ」で、あなたの記憶を最適化します。
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        <button onClick={startDailySession} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                                            演習を始める <ChevronRight size={20} />
                                        </button>
                                        <button onClick={() => setCurrentTab('comparison_viewer')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all active:scale-95 border border-white/10">
                                            比較学習を見る
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { step: '01', title: '10Q演習', desc: 'まずは宅建業法の10問から。AIが今の実力を測ります。', icon: <Zap className="text-amber-400" fill="currentColor" /> },
                                        { step: '02', title: '誤答補修', desc: '間違えたら即、構造化解説を確認。弱点を放置しません。', icon: <AlertTriangle className="text-rose-400" /> },
                                        { step: '03', title: '分散学習', desc: '覚えるべき知識はカード化。忘れる前に最適なタイミングで復習。', icon: <Brain className="text-indigo-400" /> },
                                        { step: '04', title: '比較整理', desc: '似ている論点は対比。本試験のひっかけパターンを潰します。', icon: <ArrowLeftRight className="text-emerald-400" /> }
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xs text-slate-400 group-hover:scale-110 transition-transform">
                                                {s.step}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 font-black text-sm">
                                                    {s.icon} {s.title}
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* 装飾用背景 */}
                            <Compass size={300} className="absolute -bottom-20 -left-20 text-white opacity-[0.02] -rotate-12" />
                        </div>
                    )}

                    {/* P10: Minimal Dashboard Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">定着度 (Stability)</div>
                            <div className="text-2xl font-black text-white">{dashboard?.avg_stability?.toFixed(1) || '0.0'} <span className="text-xs font-bold text-slate-500">Days</span></div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">復習期限 (Due)</div>
                            <div className="text-2xl font-black text-amber-400">{ (dashboard?.due_active_cards || 0) + (dashboard?.due_memory_cards || 0) } <span className="text-xs font-bold text-slate-500">Cards</span></div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">自動適用状態</div>
                            <div className="text-lg font-black text-indigo-400">{dashboard?.auto_apply_enabled ? 'ON (自動最適化中)' : 'OFF (固定配分)'}</div>
                        </div>
                    </div>

                    {/* P24/P31/P34: Weak Tags & Focus Progress Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* P34: Top 1 Priority Card */}
                        <div className="md:col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-soft relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <Star size={200} className="text-rose-500" />
                            </div>
                            
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Star size={12} fill="currentColor" /> Priority Issue #1
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">今やるならこれ</div>
                                </div>

                                {dashboard.priority_tag ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-4xl font-black text-slate-800 leading-none">{dashboard.priority_tag.name}</h2>
                                                {dashboard.weak_score_history && !dashboard.weak_score_history.insufficient_data && (
                                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-1 ${dashboard.weak_score_history.delta > 0 ? 'bg-emerald-500' : (dashboard.weak_score_history.delta < 0 ? 'bg-rose-500' : 'bg-slate-400')}`}>
                                                        {dashboard.weak_score_history.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {dashboard.weak_score_history.label}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-slate-500 font-bold flex items-center gap-2">
                                                <Info size={16} className="text-rose-400" /> {dashboard.priority_tag.reason}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">前回の特訓成果</div>
                                                    {TAKKEN_PROTOTYPE_UNITS.some(u => u.linked_tags.includes(dashboard.priority_tag.name)) && (
                                                        <button 
                                                            onClick={() => viewInputUnit(dashboard.priority_tag.name)}
                                                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                                        >
                                                            <BookOpen size={10} /> 解説を読む
                                                        </button>
                                                    )}
                                                </div>
                                                {dashboard.priority_tag_progress ? (
                                                    <div className="flex items-end gap-3">
                                                        <div className="text-4xl font-black text-slate-800">{Math.round(dashboard.priority_tag_progress.accuracy * 100)}%</div>
                                                        <div className={`mb-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black text-white ${dashboard.priority_tag_progress.accuracy >= 0.8 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                            {dashboard.priority_tag_progress.trend}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-bold text-slate-400 italic py-2">まだ特訓データがありません</div>
                                                )}
                                            </div>

                                            <button 
                                                onClick={() => startFocusRecall(dashboard.priority_tag.name)}
                                                className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-[32px] p-6 font-black text-xl shadow-glow-rose transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Zap size={24} fill="currentColor" /> 10Q Focus
                                                </div>
                                                <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">この分野を特訓する</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-slate-300 font-black text-xl italic">
                                        No weakness detected. Keep going!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* P34: Top 2-5 Compact List */}
                        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-soft flex flex-col">
                            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                                <TrendingDown className="text-slate-400" /> 次点の弱点分野
                            </h3>
                            <div className="space-y-4 flex-1">
                                {dashboard.weak_tags && dashboard.weak_tags.length > 1 ? (
                                    dashboard.weak_tags.slice(1, 5).map((tag: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-indigo-50 transition-colors">
                                            <div className="flex flex-col flex-1 truncate">
                                                <span className="font-black text-slate-700 group-hover:text-indigo-700 transition-colors text-sm truncate">{tag.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-md group-hover:bg-indigo-200 group-hover:text-indigo-600 transition-colors">#{i+2}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">Score: {tag.score.toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {TAKKEN_PROTOTYPE_UNITS.some(u => u.linked_tags.includes(tag.name)) && (
                                                    <button 
                                                        onClick={() => viewInputUnit(tag.name)}
                                                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-90"
                                                        title="解説"
                                                    >
                                                        <BookOpen size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => startFocusRecall(tag.name)}
                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm active:scale-90"
                                                    title="Focus"
                                                >
                                                    <Zap size={14} fill="currentColor" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex items-center justify-center py-8 text-center text-slate-400 font-bold text-sm italic">
                                        データ不足
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <p className="text-[9px] font-bold text-slate-400 leading-relaxed italic text-center">
                                    ※詳細なスコア内訳は db-audit.html で確認可能です。
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Area */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <button 
                            onClick={() => setCurrentTab('comparison_viewer')}
                            className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-soft hover:shadow-glow-indigo hover:border-indigo-100 transition-all group active:scale-95 flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <ArrowLeftRight size={24} />
                            </div>
                            <span className="font-black text-slate-700 text-sm">比較学習</span>
                        </button>
                        <button 
                            onClick={() => viewInputUnit('宅建業法')}
                            className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-soft hover:shadow-glow-indigo hover:border-indigo-100 transition-all group active:scale-95 flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <BookOpen size={24} />
                            </div>
                            <span className="font-black text-slate-700 text-sm">重要項目</span>
                        </button>
                        <div className="p-6 bg-slate-200/50 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center gap-1 opacity-50">
                             <div className="text-[10px] font-black text-slate-400 uppercase">Streak</div>
                             <div className="text-xl font-black text-slate-600">{stats.streak} Days</div>
                        </div>
                        <div className="p-6 bg-slate-200/50 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center gap-1 opacity-50">
                             <div className="text-[10px] font-black text-slate-400 uppercase">Today</div>
                             <div className="text-xl font-black text-slate-600">{stats.todayStudied} Qs</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* P31: Focus Progress Card (Merged into Dashboard context) */}
                        <div className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-glow flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute -top-4 -right-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                <Compass size={240} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Target size={16} /> Next Recommended Step
                                </div>
                                <h3 className="text-3xl font-black leading-tight mb-8">
                                    {dashboard.next_action}
                                </h3>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-[10px] font-bold text-indigo-100/70 leading-relaxed italic max-w-[200px]">
                                    ※学習ログから算出された、データに基づくアドバイスです。
                                </p>
                                <Zap size={40} className="text-amber-400 opacity-20" fill="currentColor" />
                            </div>
                        </div>

                        {/* Recent History or Stats */}
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-soft">
                             <div className="flex justify-between items-center mb-8">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">特訓の全体進捗</div>
                                <Zap className="text-amber-400" fill="currentColor" size={16} />
                             </div>
                             <div className="space-y-6">
                                {dashboard.focus_progress?.tag_progress && dashboard.focus_progress.tag_progress.length > 0 ? (
                                    dashboard.focus_progress.tag_progress.slice(0, 3).map((p: any, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs font-black text-slate-600">
                                                <span>{p.name}</span>
                                                <span>{Math.round(p.accuracy * 100)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${p.accuracy * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-300 font-bold italic">No data</div>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-slate-800">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black flex items-center gap-3"><Zap className="text-orange-500" fill="currentColor" /> 今日の学習管制</h2>
                            <div className="px-4 py-2 bg-white/10 rounded-2xl text-xs font-black uppercase text-slate-400">Status: Active</div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-500 uppercase">残りタスク</div>
                                <div className="text-4xl font-black text-white">{dashboard.today.remaining_today}</div>
                                {dashboard.today.remaining_today > 0 && (
                                    <div className="text-[9px] font-black text-amber-400 uppercase mt-1">1 Comparison Incl.</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-500 uppercase">正答率(直近30)</div>
                                <div className="text-4xl font-black text-indigo-400">{dashboard.recent.recent_30_accuracy ? Math.round(dashboard.recent.recent_30_accuracy * 100) : '--'}%</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-500 uppercase">要レビュー</div>
                                <div className="text-4xl font-black text-rose-500">{dashboard.review_alerts.quality_review_needed_count}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-500 uppercase">救済比率</div>
                                <div className="text-4xl font-black text-emerald-400">{Math.round(dashboard.recovered_stats.recovered_ratio * 100)}%</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={startDailySession} className="col-span-2 md:col-span-1 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-3xl font-black text-xl shadow-glow transition-all active:scale-95 flex items-center justify-center gap-3">
                                学習 <ChevronRight size={24} />
                            </button>
                            <button onClick={startWrongAnswerSession} className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 py-6 rounded-3xl font-black text-xl border border-rose-500/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                                復習 <AlertTriangle size={24} />
                            </button>
                            <button onClick={startUnansweredSession} className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-6 rounded-3xl font-black text-xl border border-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                                未答 <CheckCircle2 size={24} />
                            </button>
                            <button onClick={startWeakTopicSession} className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-6 rounded-3xl font-black text-xl border border-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                                弱点 <Target size={24} />
                            </button>
                            <button onClick={startMemoryRecallTest} className="hidden md:flex w-full bg-white/10 hover:bg-white/20 text-white py-6 rounded-3xl font-black text-xl border border-white/20 transition-all active:scale-95 items-center justify-center gap-3">
                                暗記 <Brain size={24} className="text-indigo-400" />
                            </button>
                            <button onClick={startThirtyFiveSession} className="hidden md:flex w-full bg-slate-800 hover:bg-slate-700 text-white py-6 rounded-3xl font-black text-xl border border-slate-700 transition-all active:scale-95 items-center justify-center gap-3 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                集中 <Zap size={24} className="text-amber-400" />
                            </button>
                            <button onClick={startTrapRecallTest} className="w-full bg-white/10 hover:bg-white/20 text-white py-6 rounded-3xl font-black text-xl border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                                罠 <AlertTriangle size={24} className="text-rose-400" />
                            </button>
                            <div className="md:hidden col-span-2 grid grid-cols-2 gap-4">
                                <button onClick={startComparisonRecallTest} className="w-full bg-white/10 hover:bg-white/20 text-white py-6 rounded-3xl font-black text-lg border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                                    比較 <ArrowLeftRight size={20} className="text-amber-400" />
                                </button>
                                <button onClick={startThirtyFiveSession} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-6 rounded-3xl font-black text-lg border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                                    35Q <Zap size={20} className="text-amber-400" />
                                </button>
                            </div>
                            <button onClick={startComparisonRecallTest} className="hidden md:flex w-full bg-white/10 hover:bg-white/20 text-white py-6 rounded-3xl font-black text-xl border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                                比較 <ArrowLeftRight size={24} className="text-amber-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* P46: Dev-only Preview Links Panel */}
            {import.meta.env.DEV && (
                <div className="mt-20 pt-10 border-t border-slate-200">
                    <div className="bg-slate-900 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">Dev Only</div>
                            <h3 className="text-xl font-black text-white">Input Unit Preview (Direct Access)</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {[
                                '借地借家法', '抵当権', '時効',
                                '農地法', '盛土規制法', '土地区画整理法', 
                                '開発許可', '建築基準法', '容積率', 
                                '37条書面', '報酬計算', '媒介契約', 
                                '重要事項説明', 'クーリング・オフ', '営業保証金'
                            ].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => {
                                        const unit = TAKKEN_PROTOTYPE_UNITS.find(u => u.linked_tags.includes(tag));
                                        if (unit) setDevPreviewUnit(unit);
                                        else alert(`Unit not found for: ${tag}`);
                                    }}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4">
                            <button 
                                onClick={() => startMemoryRecallTest()}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Brain size={18} /> MemoryRecall 最終PoC (10Q)
                            </button>
                            <button 
                                onClick={() => window.open(resolvePublicAssetPath('db-audit.html'), '_blank')}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Target size={18} /> DB品質監査ページを開く
                            </button>
                            <button 
                                onClick={() => setCurrentTab('admin_explorer')}
                                className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Database size={18} /> Data Explorer (Read-Only)
                            </button>
                            <button 
                                onClick={() => setCurrentTab('ai_salvage')}
                                className="px-6 py-3 bg-indigo-700 hover:bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Zap size={18} /> AI Salvage (Pro)
                            </button>
                            <button 
                                onClick={() => setCurrentTab('reality_projection')}
                                className="px-6 py-3 bg-rose-700 hover:bg-rose-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Target size={18} /> Reality Projection
                            </button>
                        </div>

                        <p className="text-slate-500 text-[10px] font-bold">※URLパラメータ ?devRepairTag=農地法 等でも直接表示可能です。</p>
                    </div>
                </div>
            )}
          </div>
        );
      case 'study_session':
        return activeKnowledgeCard && (
          <div className="space-y-6">
            <div className="text-xs font-black text-slate-400 uppercase text-center">SESSION: {currentIdx + 1} / {knowledgeQueue.length} | MODE: {activeKnowledgeCard.session_mode}</div>
            {activeKnowledgeCard.session_mode === 'focus_intro' ? (
                <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-indigo-600 text-white rounded-[40px] p-10 shadow-glow relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2 text-indigo-200 font-black text-xs uppercase tracking-widest">
                                <Zap size={14} /> Focus 10Q 導入インプット
                            </div>
                            <h2 className="text-3xl font-black leading-tight">{activeKnowledgeCard.unit.title}</h2>
                            <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                                <div className="text-[10px] font-black text-indigo-300 uppercase mb-2">一言結論</div>
                                <p className="text-xl font-bold leading-relaxed">{activeKnowledgeCard.unit.conclusion}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/10">
                                    <div className="text-[10px] font-black text-amber-400 uppercase mb-2">⚠️ ひっかけポイント</div>
                                    <ul className="space-y-1 text-sm font-bold text-slate-300">
                                        {activeKnowledgeCard.unit.trap_points.slice(0, 2).map((t: string, i: number) => <li key={i}>・{t}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/10">
                                    <div className="text-[10px] font-black text-emerald-400 uppercase mb-2">💡 代表例</div>
                                    <p className="text-sm font-bold text-slate-300 italic">"{activeKnowledgeCard.unit.cases.concrete_example}"</p>
                                </div>
                            </div>

                            {activeKnowledgeCard.unit.comparison && activeKnowledgeCard.unit.comparison.length > 0 && (
                                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/10">
                                    <div className="text-[10px] font-black text-indigo-300 uppercase mb-2">似た制度との違い</div>
                                    <div className="text-sm font-bold text-slate-300">
                                        <span className="text-indigo-200">vs {activeKnowledgeCard.unit.comparison[0].target_tag}:</span><br/>
                                        {activeKnowledgeCard.unit.comparison[0].difference}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const nextIdx = currentIdx + 1;
                            if (nextIdx < knowledgeQueue.length) setActiveKnowledgeCard(knowledgeQueue[nextIdx]);
                            else finishSession();
                        }} 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[32px] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        すぐ解く（特訓開始） <ChevronRight size={24} />
                    </button>
                </div>
            ) : activeKnowledgeCard.session_mode === 'active_recall' ? (
                <ActiveRecallView card={activeKnowledgeCard} 
                    onAnswer={async (correct) => { 
                      await refreshStats(); 
                    }}
                    onNext={() => {
                        const nextIdx = currentIdx + 1;
                        if (nextIdx < knowledgeQueue.length) setActiveKnowledgeCard(knowledgeQueue[nextIdx]);
                        else finishSession();
                    }}
                    sessionProgress={{ current: currentIdx + 1, total: knowledgeQueue.length }}
                    categoryProgress={stats}
                    questionMeta={{
                      category: activeKnowledgeCard.category,
                      tags: activeKnowledgeCard.tags,
                      cardId: activeKnowledgeCard.card_id
                    }}
                />
            ) : activeKnowledgeCard.session_mode === 'number_recall' ? (
                <NumberRecallView card={activeKnowledgeCard}
                    onNext={async () => {
                        await refreshStats();
                        const nextIdx = currentIdx + 1;
                        if (nextIdx < knowledgeQueue.length) setActiveKnowledgeCard(knowledgeQueue[nextIdx]);
                        else finishSession();
                    }}
                    sessionProgress={{ current: currentIdx + 1, total: knowledgeQueue.length }}
                />
            ) : activeKnowledgeCard.session_mode === 'trap_recall' ? (
                <TrapRecallView card={activeKnowledgeCard}
                    onNext={async () => {
                        await refreshStats();
                        const nextIdx = currentIdx + 1;
                        if (nextIdx < knowledgeQueue.length) setActiveKnowledgeCard(knowledgeQueue[nextIdx]);
                        else finishSession();
                    }}
                    sessionProgress={{ current: currentIdx + 1, total: knowledgeQueue.length }}
                />
            ) : activeKnowledgeCard.session_mode === 'comparison_recall' ? (
                <ComparisonRecallView card={activeKnowledgeCard}
                    onNext={async () => {
                        await refreshStats();
                        const nextIdx = currentIdx + 1;
                        if (nextIdx < knowledgeQueue.length) setActiveKnowledgeCard(knowledgeQueue[nextIdx]);
                        else finishSession();
                    }}
                    sessionProgress={{ current: currentIdx + 1, total: knowledgeQueue.length }}
                />
            ) : activeKnowledgeCard.session_mode === 'memory_recall' ? (
                <MemoryRecallView card={activeKnowledgeCard}
                    onNext={async () => {
                        await refreshStats();
                        const nextIdx = currentIdx + 1;
                        if (nextIdx < knowledgeQueue.length) setActiveKnowledgeCard(knowledgeQueue[nextIdx]);
                        else finishSession();
                    }}
                    sessionProgress={{ current: currentIdx + 1, total: knowledgeQueue.length }}
                />
            ) : (
                <div className="p-20 text-center font-black text-slate-300">UNKNOWN SESSION MODE: {activeKnowledgeCard.session_mode}</div>
            )}
          </div>
        );
      case 'input_viewer':
        return activeInputUnit && (
          <InputUnitViewer 
            unit={activeInputUnit} 
            onClose={() => setCurrentTab('home')} 
            onStartFocus={(tag) => startFocusRecall(tag)}
          />
        );
      case 'comparison_viewer':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ComparisonLearningView
                onBack={() => setCurrentTab('home')}
            />
          </div>
        );
      case 'admin_explorer':
        return (
          <div className="animate-in fade-in duration-500">
            <DataExplorerView 
                onBack={() => setCurrentTab('home')} 
            />
          </div>
        );
      case 'ai_salvage':
        return (
          <div className="animate-in fade-in duration-500">
            <AISalvageView 
                onBack={() => setCurrentTab('home')} 
            />
          </div>
        );
      case 'reality_projection':
        return (
          <div className="animate-in fade-in duration-500">
            <RealityProjectionView 
                onBack={() => setCurrentTab('home')} 
            />
          </div>
        );
      case 'session_summary':

        return sessionSummary && (
            <div className="max-w-2xl mx-auto space-y-8 py-10 text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">🏆 SESSION COMPLETE</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase">正答率</div>
                        <div className="text-4xl font-black text-indigo-600">{Math.round(sessionSummary.accuracy * 100)}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase">完了数</div>
                        <div className="text-4xl font-black text-slate-900">{sessionSummary.completed_count}</div>
                    </div>
                </div>
                <button onClick={() => setCurrentTab('home')} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xl">ダッシュボードへ戻る</button>
            </div>
        );
      default:
        return <div className="p-20 text-center font-black text-slate-300">UNKNOWN STATE</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main className="p-4 md:p-8">
        {loading ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-600" size={48}/></div> : renderContent()}
        
        {/* P46: Dev Preview Overlay */}
        {import.meta.env.DEV && devPreviewUnit && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm p-4 md:p-10 overflow-y-auto flex justify-center items-start">
                <div className="max-w-4xl w-full animate-in zoom-in-95 duration-300 relative">
                    <button 
                        onClick={() => setDevPreviewUnit(null)}
                        className="absolute -top-4 -right-4 md:top-0 md:-right-12 bg-white text-slate-900 p-3 rounded-full shadow-2xl hover:bg-slate-100 transition-all z-[110]"
                    >
                        <ChevronRight size={24} className="rotate-180" />
                    </button>
                    <div className="bg-amber-500 text-slate-900 px-6 py-2 rounded-t-3xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} fill="currentColor" /> Development Preview Mode
                    </div>
                    <RepairPreview 
                        unit={devPreviewUnit} 
                        onViewDetail={(unit) => {
                            setActiveInputUnit(unit);
                            setCurrentTab('input_viewer');
                            setDevPreviewUnit(null);
                        }}
                        onNext={() => setDevPreviewUnit(null)} 
                    />
                    <div className="bg-white/10 text-white/50 text-[10px] font-bold text-center py-4">
                        検証用プレビューです。学習履歴は保存されません。
                    </div>
                </div>
            </div>
        )}
      </main>
      {currentTab !== 'home' && (
          <button onClick={() => setCurrentTab('home')} className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl active:scale-95 transition-all"><Home size={24}/></button>
      )}
    </div>
  );
}
