import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Database, AlertCircle, CheckCircle2, 
  ChevronRight, Shield, ShieldCheck, HelpCircle, ArrowLeft
} from 'lucide-react';
import { db, type UnderstandingCard, type RestorationCandidate } from '../../db';
import { CardDetailPanel } from './CardDetailPanel';

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
  | 'review';

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({ onBack }) => {
  const [cards, setCards] = useState<UnderstandingCard[]>([]);
  const [restorations, setRestorations] = useState<RestorationCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Failed to fetch explorer data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const restorationMap = useMemo(() => {
    const map = new Map<string, RestorationCandidate>();
    restorations.forEach(r => {
      // restoration_id is like RES-B1-cardId
      const cardId = r.restoration_id.split('-').slice(2).join('-');
      if (cardId) map.set(cardId, r);
    });
    return map;
  }, [restorations]);

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
      
      switch (filter) {
        case 'eligible': return card.is_statement_true !== null;
        case 'pending': return card.is_statement_true === null && !res;
        case 'broken': return !card.sample_question && !card.core_knowledge?.rule;
        case 'batch1': return res?.restoration_id.startsWith('RES-B1-');
        case 'batch2': return res?.restoration_id.startsWith('RES-B2-');
        case 'review': return res?.review_status === 'human_review_required';
        default: return true;
      }
    });
  }, [cards, filter, search, restorationMap]);

  const stats = useMemo(() => ({
    total: cards.length,
    eligible: cards.filter(c => c.is_statement_true !== null).length,
    pending: cards.filter(c => c.is_statement_true === null).length,
    batch1: restorations.filter(r => r.restoration_id.startsWith('RES-B1-')).length,
    batch2: restorations.filter(r => r.restoration_id.startsWith('RES-B2-')).length,
  }), [cards, restorations]);

  const selectedCard = useMemo(() => 
    cards.find(c => c.card_id === selectedCardId), 
  [cards, selectedCardId]);

  const selectedRestoration = useMemo(() => 
    selectedCardId ? restorationMap.get(selectedCardId) : undefined,
  [restorationMap, selectedCardId]);

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
                <span className="text-slate-500 uppercase text-[9px]">Pending</span>
                <span className="text-amber-400 font-bold">{stats.pending}</span>
              </div>
              <div className="flex flex-col items-end border-l border-slate-800 pl-4">
                <span className="text-slate-500 uppercase text-[9px]">Recovered</span>
                <span className="text-blue-400 font-bold">{stats.batch1 + stats.batch2}</span>
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
              { id: 'pending', label: 'Pending' },
              { id: 'batch1', label: 'Batch-1' },
              { id: 'batch2', label: 'Batch-2' },
              { id: 'review', label: 'Needs Review' }
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

        {/* Table */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm border-b border-slate-800">
              <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Card ID / Category</th>
                <th className="px-6 py-4">Content Preview</th>
                <th className="px-6 py-4">Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCards.map(card => {
                const res = restorationMap.get(card.card_id);
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
                      <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                        {card.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed max-w-xl">
                        {card.sample_question || card.core_knowledge?.rule || '(No text)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {res ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                            res.restoration_id.startsWith('RES-B1-') ? 'bg-blue-900/30 text-blue-400' : 'bg-teal-900/30 text-teal-400'
                          }`}>
                            {res.restoration_id.startsWith('RES-B1-') ? 'B1' : 'B2'}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">
                            {res.confidence}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-700 uppercase font-bold italic tracking-tighter">Excluded</span>
                      )}
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
          <div>Knowledge Engine v2.1.0-alpha</div>
        </footer>
      </div>

      {/* Detail Panel Sidebar */}
      {selectedCard && (
        <CardDetailPanel 
          card={selectedCard}
          restoration={selectedRestoration}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
};
