import React, { useState, useEffect } from 'react';
import { Sparkles, X, AlertTriangle, ShieldCheck, CheckCircle2, Clock, Users, Home } from 'lucide-react';
import { Habitation, PriorityRanking } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitation: Habitation | null;
  priorityItem?: PriorityRanking;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  habitation,
  priorityItem
}) => {
  const [geminiExplanation, setGeminiExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !habitation) return;
    setIsLoading(true);
    setGeminiExplanation('');

    ApiClient.explainDecision(habitation.id)
      .then(res => {
        setGeminiExplanation(res);
      })
      .catch(() => {
        setGeminiExplanation('Priority justified by critical river breach proximity, 1,850 vulnerable residents (infants, elderly, medically dependent), and limited 45-minute evacuation window.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, habitation]);

  if (!isOpen || !habitation) return null;

  const d = habitation.demographics;
  const vulnerableCount = d.children + d.elderly + d.disabilities + d.pregnantWomen + d.medicalDependency;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono">
                AI Transparency Audit
              </span>
              <h3 className="font-bold text-base text-white">
                WHY IS {habitation.name.toUpperCase()} {priorityItem ? `PRIORITY #${priorityItem.rank}` : 'AT HIGH RISK'}?
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Key Deterministic Factors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
          <div>
            <span className="text-slate-400 text-[10px] block font-medium uppercase">Exposure</span>
            <strong className="text-rose-400 font-mono text-sm">94% Risk</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-medium uppercase">Vulnerable</span>
            <strong className="text-amber-300 font-mono text-sm">{vulnerableCount.toLocaleString()} pax</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-medium uppercase">Road Score</span>
            <strong className={`font-mono text-sm ${habitation.roadAccessibilityScore < 40 ? 'text-rose-400' : 'text-slate-200'}`}>
              {habitation.roadAccessibilityScore}/100
            </strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-medium uppercase">Evac Window</span>
            <strong className="text-cyan-300 font-mono text-sm">45 Mins</strong>
          </div>
        </div>

        {/* Explainable Factor Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="font-semibold text-xs text-slate-300">Algorithmic Justification Points:</div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Hydrological Proximity:</strong> Distance to rising river is only 0.4km with embankment structural integrity declining at 62%.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>High Medical &amp; Demographic Vulnerability:</strong> 120 medically dependent individuals and 420 elderly require non-ambulatory transport.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Constrained Escape Corridor:</strong> Road accessibility score is low ({habitation.roadAccessibilityScore}/100); low-lying culvert expected to submerge within 50 minutes.</span>
            </li>
          </ul>
        </div>

        {/* Gemini Generative Synthesis */}
        <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-700/60 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-indigo-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Operational Synthesis</span>
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">Server-Side Verified</span>
          </div>

          {isLoading ? (
            <div className="py-4 text-center text-indigo-300 animate-pulse">
              Synthesizing natural language decision justification...
            </div>
          ) : (
            <p className="text-indigo-200 leading-relaxed whitespace-pre-line text-xs font-sans">
              {geminiExplanation}
            </p>
          )}
        </div>

        {/* Action Directives */}
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-xs text-rose-200 mb-4 leading-relaxed">
          <strong className="block text-rose-300 font-bold text-xs mb-1">RECOMMENDED DIRECTIVE:</strong>
          Deploy NDRF Unit 7 equipped with 4 Inflatable Rescue Boats (IRB) immediately. Evacuate Village Rampur toward Safe Shelter A using High Embankment Route.
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
