import React from 'react';
import { X, AlertCircle, Info, Database, Shield } from 'lucide-react';
import { type UnderstandingCard, type RestorationCandidate } from '../../db';

interface CardDetailPanelProps {
  card: UnderstandingCard;
  restoration?: RestorationCandidate;
  onClose: () => void;
}

export const CardDetailPanel: React.FC<CardDetailPanelProps> = ({ card, restoration, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 shadow-2xl border-l border-slate-700 w-full md:w-[500px] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-blue-400" />
          <h3 className="font-bold text-lg truncate">Card Detail</h3>
          <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded uppercase tracking-wider text-slate-400">Read-Only</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Info size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Metadata</h4>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-sm font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">ID:</span>
              <span className="text-slate-300">{card.card_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="text-blue-400">{card.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Exam:</span>
              <span className="text-slate-300">{card.exam_type}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <AlertCircle size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Original Text</h4>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-sm leading-relaxed border border-slate-700">
            {card.sample_question || card.core_knowledge?.rule || 'No original text available'}
          </div>
        </section>

        {card.is_statement_true === null && (
          <section className="bg-red-900/20 border border-red-900/30 rounded-xl p-4">
            <h4 className="text-xs font-black text-red-400 uppercase mb-2 flex items-center gap-2">
              <X size={14} /> Exclusion Reason: null_statement
            </h4>
            <p className="text-sm text-slate-400">
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
                <span className="text-xs text-slate-500">{restoration.restoration_id}</span>
              </div>
              <div className="text-sm">
                <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Restored Statement</div>
                <p className="text-slate-300 mb-2">{restoration.restored_text}</p>
                <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Restored Answer</div>
                <p className={restoration.restored_is_statement_true ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {restoration.restored_is_statement_true ? "◯ 正しい" : "× 誤り"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-500 text-center italic">
              Not recovered yet
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Info size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Explanation</h4>
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
