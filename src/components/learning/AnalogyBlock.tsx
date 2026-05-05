/**
 * アナロジー（例え話）表示ブロック
 * 深い理解のための日常的な例えを提供
 */

import { Lightbulb } from 'lucide-react';

export interface Analogy {
  analogy: string;
  explanation: string;
  mapping?: Record<string, string>;
}

interface AnalogyBlockProps {
  analogies?: Analogy[];
}

export function AnalogyBlock({ analogies }: AnalogyBlockProps) {
  if (!analogies || analogies.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl shadow-lg p-8 md:p-10 border-2 border-emerald-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-200 p-3 rounded-2xl">
          <Lightbulb size={24} className="text-emerald-700" />
        </div>
        <h2 className="text-lg font-black text-emerald-900">💡 日常の例え（イメージ）</h2>
      </div>

      <div className="space-y-6">
        {analogies.map((item, index) => (
          <div key={index} className="space-y-4">
            {/* 例え話 */}
            <div className="bg-white/60 rounded-2xl p-5 border border-emerald-100">
              <div className="text-sm font-black text-emerald-600 mb-2">例え話</div>
              <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
                {item.analogy}
              </p>
            </div>

            {/* 解説 */}
            <div className="bg-white/60 rounded-2xl p-5 border border-emerald-100">
              <div className="text-sm font-black text-emerald-600 mb-2">解説（なぜこの例えなのか）</div>
              <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
                {item.explanation}
              </p>
            </div>

            {/* マッピング（あれば） */}
            {item.mapping && Object.keys(item.mapping).length > 0 && (
              <div className="bg-emerald-100/50 rounded-2xl p-5 border border-emerald-200">
                <div className="text-sm font-black text-emerald-700 mb-3">用語の対応</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(item.mapping).map(([key, value]) => (
                    <div key={key} className="bg-white/80 rounded-xl p-3">
                      <div className="text-xs font-bold text-emerald-600 mb-1">{key}</div>
                      <div className="text-sm font-bold text-slate-700">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
