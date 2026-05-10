import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Users, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import {
  detectParties,
  detectGlossaryTerms,
  detectKeyPhrases,
  detectTrapNotices,
  estimateQuestionIntent,
  type GlossaryTerm,
  type PartyMapping,
  type KeyPhrase,
  type TrapNotice
} from '../../utils/questionUnderstanding';

interface QuestionUnderstandingAidProps {
  questionText?: string;
  category?: string;
  tags?: string[];
  isExpandedDefault?: boolean;
}

export const QuestionUnderstandingAid: React.FC<QuestionUnderstandingAidProps> = ({
  questionText = '',
  category = '',
  tags = [],
  isExpandedDefault = false
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 問題文解析
  const detectedParties = useMemo(() => {
    if (!questionText) return [];
    return detectParties(questionText);
  }, [questionText]);

  const detectedGlossary = useMemo(() => {
    if (!questionText) return [];
    return detectGlossaryTerms(questionText);
  }, [questionText]);

  const detectedKeyPhrases = useMemo(() => {
    if (!questionText) return [];
    return detectKeyPhrases(questionText);
  }, [questionText]);

  const detectedTraps = useMemo(() => {
    if (!questionText) return [];
    return detectTrapNotices(questionText);
  }, [questionText]);

  const questionIntent = useMemo(() => {
    if (!questionText) {
      return { main_point: 'この問題は法律知識を問う問題です。', key_points: [] };
    }
    return estimateQuestionIntent(questionText, detectedParties, detectedKeyPhrases);
  }, [questionText, detectedParties, detectedKeyPhrases]);

  // 表示すべきか判定
  const shouldDisplay = useMemo(() => {
    // 問題文が長い（100文字以上）
    if (questionText && questionText.length >= 100) return true;

    // 登場人物が多い（3人以上）
    if (detectedParties.length >= 3) return true;

    // 専門用語が多い（3つ以上）
    if (detectedGlossary.length >= 3) return true;

    // 注目語句がある
    if (detectedKeyPhrases.some(p => p.importance === 'critical')) return true;

    // ひっかけ注意がある
    if (detectedTraps.length > 0) return true;

    return false;
  }, [questionText, detectedParties.length, detectedGlossary.length, detectedKeyPhrases, detectedTraps.length]);

  if (!shouldDisplay) {
    return null;
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-amber-600" size={20} />
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">
            問題文を読むヒント
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-700 hover:text-amber-900 transition-colors"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* 問題の意図 */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100">
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-amber-600" />
          <h4 className="text-xs font-black text-amber-800 uppercase">この問題が聞いていること</h4>
        </div>
        <p className="text-sm font-bold text-slate-700 leading-relaxed">
          {questionIntent.main_point}
        </p>
        {questionIntent.key_points.length > 0 && (
          <ul className="mt-2 space-y-1">
            {questionIntent.key_points.map((point, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* 登場人物の整理 */}
          {detectedParties.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-amber-600" />
                  <h4 className="text-xs font-black text-amber-800 uppercase">登場人物の整理</h4>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {detectedParties.map((party, i) => (
                  <div key={i} className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <div className="font-black text-amber-900 text-sm">{party.code}</div>
                    <div className="text-xs text-slate-600 mt-1">{party.role}</div>
                    <div className="text-xs text-slate-500 mt-1">{party.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 専門用語の補足 */}
          {detectedGlossary.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-amber-600" />
                <h4 className="text-xs font-black text-amber-800 uppercase">専門用語の補足</h4>
              </div>
              <div className="space-y-2">
                {detectedGlossary.map((term, i) => (
                  <div key={i} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <div className="font-black text-blue-900 text-sm">{term.term}</div>
                    <div className="text-xs text-slate-600 mt-1">{term.definition}</div>
                    <div className="text-xs text-blue-600 mt-1">【{term.category}】</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 注目語句 */}
          {detectedKeyPhrases.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-amber-600" />
                <h4 className="text-xs font-black text-amber-800 uppercase">注目すべき語句</h4>
              </div>
              <div className="space-y-2">
                {detectedKeyPhrases.map((phrase, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border ${
                      phrase.importance === 'critical'
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{phrase.phrase}</span>
                      {phrase.importance === 'critical' && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          重要
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{phrase.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ひっかけ注意 */}
          {detectedTraps.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-4 border-2 border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-rose-600" />
                <h4 className="text-xs font-black text-rose-800 uppercase">ひっかけ注意</h4>
              </div>
              <div className="space-y-2">
                {detectedTraps.map((trap, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-rose-100">
                    <p className="text-sm font-bold text-rose-900">{trap.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
