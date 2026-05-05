import React from 'react';
import { X, AlertCircle, Info, Database, Shield, Tag, ChevronRight } from 'lucide-react';
import { type UnderstandingCard, type RestorationCandidate } from '../../db';
import { type CategoryCorrectionSuggestion } from '../../utils/categorySidecarReview';

interface CardDetailPanelProps {
  card: UnderstandingCard;
  restoration?: RestorationCandidate;
  suggestion?: CategoryCorrectionSuggestion;
  onClose: () => void;
}

export const CardDetailPanel: React.FC<CardDetailPanelProps> = ({ card, restoration, suggestion, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 shadow-2xl border-l border-slate-700 w-full md:w-[500px] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-blue-400" />
          <h3 className="font-bold text-lg truncate">Card Detail</h3>
          <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded uppercase tracking-wider text-slate-400">Read-Only</span>
        </div>
        <button className="p-1 hover:bg-slate-700 rounded-full transition-colors" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Info size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Metadata</h4>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-sm font-mono space-y-1 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">ID:</span>
              <span className="text-slate-300">{card.card_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Category:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-400">{card.category}</span>
                {suggestion && (
                  <>
                    <ChevronRight size={10} className="text-red-500" />
                    <span className="text-red-400 font-black bg-red-900/20 px-1 rounded">{suggestion.suggested_category}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Exam:</span>
              <span className="text-slate-300">{card.exam_type || 'takken'}</span>
            </div>
          </div>
        </section>

        {suggestion && (
          <section className="bg-red-900/10 border border-red-900/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <Tag size={16} />
              <h4 className="text-xs font-black uppercase tracking-widest">Category Suggestion</h4>
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black ml-auto uppercase tracking-tighter">
                {suggestion.confidence} conf
              </span>
            </div>
            <div className="text-sm space-y-2">
              <p className="text-slate-300 leading-relaxed italic border-l-2 border-red-500 pl-3 py-1 bg-red-950/20">
                {suggestion.reason}
              </p>
              <div>
                <div className="text-slate-500 text-[9px] uppercase font-black mb-1">Evidence Keywords</div>
                <div className="flex flex-wrap gap-1">
                  {suggestion.evidence_terms.map(t => (
                    <span key={t} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{t}</span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-red-400/60 font-bold uppercase tracking-tighter pt-1">
                ※ Read-only proposal. No category is automatically changed.
              </p>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <AlertCircle size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Original Text</h4>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-sm leading-relaxed border border-slate-700">
            {card.sample_question || card.core_knowledge?.rule || 'No original text available'}
          </div>
        </section>

        {card.is_statement_true === null && !restoration && (
          <section className="bg-red-900/20 border border-red-900/30 rounded-xl p-4">
            <h4 className="text-xs font-black text-red-400 uppercase mb-2 flex items-center gap-2">
              <X size={14} /> Exclusion Reason: null_statement
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              正誤判定がnullのため、Active Recall対象から除外されています。Batch-2以降での救済対象です。
            </p>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <Shield size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Recovery Status</h4>
          </div>
          {restoration ? (
            <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-black uppercase">
                  {restoration.confidence} confidence
                </span>
                <span className="text-xs text-slate-500 font-mono">{restoration.restoration_id}</span>
              </div>
              <div className="text-sm space-y-3">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Restored Statement</div>
                  <p className="text-slate-300 leading-relaxed">{restoration.restored_text}</p>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Restored Answer</div>
                  <p className={restoration.restored_is_statement_true ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {restoration.restored_is_statement_true ? "◯ 正しい" : "× 誤り"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-500 text-center italic border border-slate-800">
              Not recovered yet
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Info size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Internal Essence</h4>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-sm leading-relaxed border border-slate-700 text-slate-400">
            {card.core_knowledge?.essence || 'No internal essence available.'}
          </div>
        </section>
      </div>
      
      <div className="p-4 bg-slate-800 border-t border-slate-700 text-[10px] text-slate-500 text-center uppercase tracking-tighter">
        Data integrity protection active • read only view
      </div>
    </div>
  );
};
