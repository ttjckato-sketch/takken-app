import React, { useEffect, useRef } from 'react';
import { X, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { InputUnit } from '../../types/inputUnit';
import { UnderstandingVisuals } from './UnderstandingVisuals';

interface UnderstandingSyncViewerProps {
    unit: InputUnit;
    onClose: () => void;
    onNext: () => void;
}

export const UnderstandingSyncViewer: React.FC<UnderstandingSyncViewerProps> = ({ unit, onClose, onNext }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    // Initial focus on the close button or the container for accessibility
    useEffect(() => {
        modalRef.current?.focus();
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-viewer-title"
            tabIndex={-1}
            ref={modalRef}
        >
            <div className="bg-slate-50 w-full max-w-4xl h-full max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-glow">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 id="sync-viewer-title" className="text-xl font-black text-slate-900 leading-tight">
                                {unit.title}
                            </h2>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                理解・記憶同期ビューア
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        aria-label="閉じる"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-8 space-y-12">
                    {/* Conclusion Highlight */}
                    <div className="bg-indigo-600 text-white rounded-[32px] p-8 shadow-lg relative overflow-hidden group">
                        <div className="relative z-10 space-y-3">
                            <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> 一言結論
                            </div>
                            <p className="text-xl md:text-2xl font-black leading-relaxed">
                                {unit.conclusion}
                            </p>
                        </div>
                    </div>

                    {/* Visual Materials */}
                    <UnderstandingVisuals unit={unit} />

                    {/* Source Trace */}
                    <div className="pt-8 border-t border-slate-200">
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>法的根拠 (Legal Basis):</span>
                            {unit.source_trace.map((source, i) => (
                                <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    {source.text || source.id}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white border-t border-slate-200 p-6 flex flex-col md:flex-row gap-4 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl font-black text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        理解した
                    </button>
                    <button 
                        onClick={onNext}
                        className="flex-[2] py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black shadow-glow-rose transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        次のカードへ進む <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
