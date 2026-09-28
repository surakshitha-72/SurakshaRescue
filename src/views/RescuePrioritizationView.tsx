import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Truck,
  Clock,
  Home,
  CheckCircle2,
  HelpCircle,
  Send,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PriorityRanking } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface RescuePrioritizationViewProps {
  priorities: PriorityRanking[];
  onTriggerEvacuation: (habId: string) => void;
  onRequestAIExplanation: (habId: string) => void;
}

export const RescuePrioritizationView: React.FC<RescuePrioritizationViewProps> = ({
  priorities,
  onTriggerEvacuation,
  onRequestAIExplanation
}) => {
  const [expandedRank, setExpandedRank] = useState<number | null>(1);
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
  const [customAiExplanation, setCustomAiExplanation] = useState<Record<string, string>>({});

  const handleFetchAiWhy = async (habId: string) => {
    setLoadingAiId(habId);
    const explanation = await ApiClient.explainDecision(habId);
    setCustomAiExplanation(prev => ({ ...prev, [habId]: explanation }));
    setLoadingAiId(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Rescue Prioritization Engine</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold border border-rose-800 font-mono">
              WHO SHOULD BE RESCUED FIRST?
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Algorithmic ranking weighting hazard severity, rate of water rise, population vulnerability headcount, road condition, and shelter accessibility.
          </p>
        </div>

        <div className="text-xs text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Calculated dispatch window: <strong className="text-white font-mono">45 mins</strong></span>
        </div>
      </div>

      {/* Priority Cards List */}
      <div className="space-y-4">
        {priorities.map((item) => {
          const isExpanded = expandedRank === item.rank;
          const isTop = item.rank === 1;

          return (
            <div
              key={item.habitationId}
              className={`border rounded-2xl p-4 sm:p-5 shadow-md transition-all ${
                isTop
                  ? 'bg-slate-900 border-rose-600/80 ring-2 ring-rose-600/20'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Title Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm font-mono ${
                    item.rank === 1 ? 'bg-rose-600 text-white' : item.rank === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{item.rank}
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <span>{item.habitationName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono">
                        {item.hazardType}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Evacuation Urgency: <strong className="text-rose-400">{item.urgency}</strong> · Window: <strong className="text-slate-200 font-mono">{item.estimatedEvacTimeMin} mins</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800/80 font-mono">
                    Priority Score: {item.priorityScore}/100
                  </span>
                  <button
                    onClick={() => setExpandedRank(isExpanded ? null : item.rank)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 mb-3.5">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Total Population</span>
                  <strong className="text-white text-sm font-mono">{item.totalPopulation.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Vulnerable Headcount</span>
                  <strong className="text-rose-400 text-sm font-mono">{item.vulnerablePopulation.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Assigned Shelter</span>
                  <strong className="text-cyan-300 text-sm truncate block">{item.nearestShelterName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Assigned Team</span>
                  <strong className="text-amber-300 text-sm truncate block">{item.recommendedTeamName || 'NDRF Unit 7'}</strong>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200 mb-3.5 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-rose-300 mr-1">Tactical Directives:</span>
                  <span>{item.recommendedAction}</span>
                </div>
              </div>

              {/* Expandable "WHY IS THIS LOCATION PRIORITY #X?" AI Justification */}
              {isExpanded && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 mb-3.5 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>WHY IS {item.habitationName.toUpperCase()} PRIORITY #{item.rank}?</span>
                    </span>
                    <button
                      onClick={() => handleFetchAiWhy(item.habitationId)}
                      disabled={loadingAiId === item.habitationId}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <span>{loadingAiId === item.habitationId ? 'Querying Gemini...' : 'Regenerate Gemini Analysis'}</span>
                    </button>
                  </div>

                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    {item.aiExplanation.map((line, idx) => (
                      <li key={idx} className="leading-relaxed">{line}</li>
                    ))}
                  </ul>

                  {customAiExplanation[item.habitationId] && (
                    <div className="mt-2.5 p-3 rounded-xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 font-sans leading-relaxed whitespace-pre-line text-xs">
                      {customAiExplanation[item.habitationId]}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onTriggerEvacuation(item.habitationId)}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Priority Evacuation</span>
                </button>
                <button
                  onClick={() => handleFetchAiWhy(item.habitationId)}
                  className="bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold py-2 px-3.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Explanation (Why?)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
