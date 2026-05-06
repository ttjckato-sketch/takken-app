import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Database, AlertCircle, CheckCircle2, 
  ChevronRight, Shield, ShieldCheck, HelpCircle, ArrowLeft, Tag
} from 'lucide-react';
import { db, type UnderstandingCard, type RestorationCandidate } from '../../db';
import { CardDetailPanel } from './CardDetailPanel';
import { generateCategorySuggestions, type CategoryCorrectionSuggestion } from '../../utils/categorySidecarReview';
import { auditSingleCard, generateGlobalAuditReport, type AuditResult, type GlobalAuditReport } from '../../utils/learningQualityAudit';
import { LEARNING_SCOPE_MAP } from '../../utils/learningCoverageMap';

interface DataExplorerViewProps {
  onBack: () => void;
}

type FilterType = 
  | 'all' 
  | 'eligible' 
  | 'pending' 
  | 'broken' 
  | 'batch1' 
  | 'batch2' 
  | 'batch3'
  | 'review'
  | 'suspect'
  | 'weak'
  | 'missing_prerequisite'
  | 'no_source_trace';

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({ onBack }) => {
  const [cards, setCards] = useState<UnderstandingCard[]>([]);
  const [restorations, setRestorations] = useState<RestorationCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [globalAudit, setGlobalAudit] = useState<GlobalAuditReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allCards, allRestorations] = await Promise.all([
          db.understanding_cards.toArray(),
          db.restoration_candidates.toArray()
        ]);
        setCards(allCards);
        setRestorations(allRestorations);

        const report = await generateGlobalAuditReport(allCards);
        setGlobalAudit(report);
      } catch (error) {
        console.error('Failed to fetch explorer data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cardAudits = useMemo(() => {
    const map = new Map<string, AuditResult>();
    cards.forEach(c => map.set(c.card_id, auditSingleCard(c)));
    return map;
  }, [cards]);
  const restorationMap = useMemo(() => {
    const map = new Map<string, RestorationCandidate>();
    restorations.forEach(r => {
      const cardId = r.restoration_id.split('-').slice(2).join('-');
      if (cardId) map.set(cardId, r);
    });
    return map;
  }, [restorations]);

  const suggestions = useMemo(() => 
    generateCategorySuggestions(cards, restorations),
  [cards, restorations]);

  const suggestionMap = useMemo(() => {
    const map = new Map<string, CategoryCorrectionSuggestion>();
    suggestions.forEach(s => map.set(s.source_card_id, s));
    return map;
  }, [suggestions]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Search
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        card.card_id.toLowerCase().includes(searchLower) ||
        card.category.toLowerCase().includes(searchLower) ||
        (card.sample_question || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filter
      const res = restorationMap.get(card.card_id);
      const sug = suggestionMap.get(card.card_id);
      const audit = cardAudits.get(card.card_id);
      
      switch (filter) {
        case 'eligible': return card.is_statement_true !== null;
        case 'pending': return card.is_statement_true === null && !res;
        case 'broken': return !card.sample_question && !card.core_knowledge?.rule;
        case 'batch1': return res?.restoration_id.startsWith('RES-B1-');
        case 'batch2': return res?.restoration_id.startsWith('RES-B2-');
        case 'batch3': return res?.restoration_id.startsWith('RES-B3-');
        case 'review': return res?.review_status === 'human_review_required';
        case 'suspect': return !!sug;
        case 'weak': return !!audit && audit.quality_score < 60;
        case 'missing_prerequisite': return !!audit && audit.weak_reasons.includes('prerequisite_missing');
        case 'no_source_trace': return !!audit && audit.weak_reasons.includes('no_source_trace');
        default: return true;
      }
    });
  }, [cards, filter, search, restorationMap, suggestionMap, cardAudits]);

  const stats = useMemo(() => ({
    total: cards.length,
    eligible: cards.filter(c => c.is_statement_true !== null).length,
    pending: cards.filter(c => c.is_statement_true === null).length,
    batch1: restorations.filter(r => r.restoration_id.startsWith('RES-B1-')).length,
    batch2: restorations.filter(r => r.restoration_id.startsWith('RES-B2-')).length,
    batch3: restorations.filter(r => r.restoration_id.startsWith('RES-B3-')).length,
    suspect: suggestions.length
  }), [cards, restorations, suggestions]);

  const selectedCard = useMemo(() => 
    cards.find(c => c.card_id === selectedCardId), 
  [cards, selectedCardId]);

  const selectedRestoration = useMemo(() => 
    selectedCardId ? restorationMap.get(selectedCardId) : undefined,
  [restorationMap, selectedCardId]);

  const selectedSuggestion = useMemo(() =>
    selectedCardId ? suggestionMap.get(selectedCardId) : undefined,
  [suggestionMap, selectedCardId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-400">
        <Database className="animate-pulse mb-4 text-blue-500" size={48} />
        <p className="font-mono tracking-widest uppercase text-sm">Loading Knowledge Base...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <Database size={20} className="text-blue-500" />
                Data Explorer
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-tighter">Read-Only</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-xs font-mono">
              <div className="flex flex-col items-end">
                <span className="text-slate-500 uppercase text-[9px]">Eligible</span>
                <span className="text-green-400 font-bold">{stats.eligible}</span>
              </div>
              <div className="flex flex-col items-end border-l border-slate-800 pl-4">
                <span className="text-slate-500 uppercase text-[9px]">Suspect</span>
                <span className="text-red-400 font-bold">{stats.suspect}</span>
              </div>
              <div className="flex flex-col items-end border-l border-slate-800 pl-4">
                <span className="text-slate-500 uppercase text-[9px]">Recovered</span>
                <span className="text-blue-400 font-bold">{stats.batch1 + stats.batch2 + stats.batch3}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-800 flex flex-wrap gap-4 items-center shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search by ID, Category, Text..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Filter size={16} className="text-slate-500 shrink-0" />
            {[
              { id: 'all', label: 'All' },
              { id: 'eligible', label: 'Eligible' },
              { id: 'suspect', label: 'Suspect' },
              { id: 'weak', label: 'Weak (Score < 60)' },
              { id: 'missing_prerequisite', label: 'No Prereq' },
              { id: 'no_source_trace', label: 'No Source' },
              { id: 'batch1', label: 'B1' },
              { id: 'batch2', label: 'B2' },
              { id: 'batch3', label: 'B3' },
              { id: 'review', label: 'Review' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as FilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Quality Audit Summary */}
        {globalAudit && (
          <div className="px-6 py-4 bg-indigo-900/20 border-b border-indigo-500/20 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                  <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Takken Coverage</div>
                  <div className="flex items-end gap-2">
                      <div className="text-2xl font-black text-white">{Math.round(globalAudit.takken.coverage_rate * 100)}%</div>
                      <div className="text-[10px] text-slate-500 font-bold mb-1">HP: {Math.round(globalAudit.takken.high_priority_coverage * 100)}%</div>
                  </div>
              </div>
              <div>
                  <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Chintai Coverage</div>
                  <div className="flex items-end gap-2">
                      <div className="text-2xl font-black text-white">{Math.round(globalAudit.chintai.coverage_rate * 100)}%</div>
                      <div className="text-[10px] text-slate-500 font-bold mb-1">HP: {Math.round(globalAudit.chintai.high_priority_coverage * 100)}%</div>
                  </div>
              </div>
              <div>
                  <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Avg Quality Score</div>
                  <div className="text-2xl font-black text-amber-400">{globalAudit.takken.average_score.toFixed(1)} <span className="text-xs text-slate-500">pts</span></div>
              </div>
              <div>
                  <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Weak Cards</div>
                  <div className="text-2xl font-black text-rose-500">{globalAudit.takken.weak_card_count + globalAudit.chintai.weak_card_count}</div>
              </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm border-b border-slate-800">
              <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Card ID / Category</th>
                <th className="px-6 py-4">Content Preview</th>
                <th className="px-6 py-4">Recovery / Suggestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCards.map(card => {
                const res = restorationMap.get(card.card_id);
                const sug = suggestionMap.get(card.card_id);
                const isEligible = card.is_statement_true !== null;
                const isSelected = selectedCardId === card.card_id;

                return (
                  <tr 
                    key={card.card_id}
                    onClick={() => setSelectedCardId(card.card_id)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-500/10' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      {isEligible ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : res ? (
                        <ShieldCheck size={18} className="text-blue-500" />
                      ) : (
                        <AlertCircle size={18} className="text-amber-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[11px] text-slate-300 group-hover:text-blue-400 transition-colors">
                        {card.card_id}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          {card.category}
                        </span>
                        {sug && (
                          <>
                            <ChevronRight size={10} className="text-red-500" />
                            <span className="text-[10px] text-red-400 font-black bg-red-900/20 px-1 rounded">
                              {sug.suggested_category}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed max-w-xl">
                        {card.sample_question || card.core_knowledge?.rule || '(No text)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {res && (
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                              res.restoration_id.includes('B1') ? 'bg-blue-900/30 text-blue-400' : 
                              res.restoration_id.includes('B2') ? 'bg-teal-900/30 text-teal-400' :
                              'bg-amber-900/30 text-amber-400'
                            }`}>
                              {res.restoration_id.includes('B1') ? 'B1' : res.restoration_id.includes('B2') ? 'B2' : 'B3'}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono">
                              {res.confidence}
                            </span>
                          </div>
                        )}
                        {sug && (
                          <div className="flex items-center gap-2">
                            <Tag size={10} className="text-red-500" />
                            <span className="text-[9px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                              Sug: {sug.confidence}
                            </span>
                          </div>
                        )}
                        {!res && !sug && (
                          <span className="text-[9px] text-slate-700 uppercase font-bold italic tracking-tighter">Excluded</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <HelpCircle size={48} className="mb-4 opacity-20" />
              <p className="text-sm">No matching cards found</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <footer className="h-8 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest shrink-0">
          <div>Showing {filteredCards.length} of {cards.length} cards</div>
          <div>Knowledge Engine v2.1.0-beta</div>
        </footer>
      </div>

      {/* Detail Panel Sidebar */}
      {selectedCard && (
        <CardDetailPanel 
          card={selectedCard}
          restoration={selectedRestoration}
          suggestion={selectedSuggestion}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
};
