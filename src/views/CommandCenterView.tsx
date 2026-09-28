import React, { useState } from 'react';
import {
  AlertTriangle,
  Users,
  Home,
  Truck,
  ShieldAlert,
  Flame,
  Clock,
  Send,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import {
  Habitation,
  Shelter,
  RescueTeam,
  RouteSegment,
  EvacuationRoute,
  RiskZone,
  PriorityRanking,
  DisasterAlert
} from '../types/disaster';

interface CommandCenterViewProps {
  habitations: Habitation[];
  shelters: Shelter[];
  teams: RescueTeam[];
  riskZones: RiskZone[];
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  priorities: PriorityRanking[];
  alerts: DisasterAlert[];
  onSelectHabitation: (id: string) => void;
  onSelectShelter: (id: string) => void;
  onTriggerEvacuation: (habId: string) => void;
  onRequestAIExplanation: (habId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  habitations,
  shelters,
  teams,
  riskZones,
  routeSegments,
  routes,
  priorities,
  alerts,
  onSelectHabitation,
  onSelectShelter,
  onTriggerEvacuation,
  onRequestAIExplanation,
  onNavigateTab
}) => {
  const [selectedHabId, setSelectedHabId] = useState<string>(priorities[0]?.habitationId || 'hab-1');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideHabId, setOverrideHabId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string>('');

  // Computations for top statistics
  const totalEvacuationNeeded = habitations
    .filter(h => h.vulnerabilityLevel === 'Critical' || h.vulnerabilityLevel === 'High')
    .reduce((acc, h) => acc + h.demographics.total, 0);

  const totalShelterAvailable = shelters.reduce(
    (acc, s) => acc + Math.max(0, s.totalCapacity - s.occupiedCapacity - s.reservedCapacity),
    0
  );

  const totalShelterOccupied = shelters.reduce((acc, s) => acc + s.occupiedCapacity, 0);
  const totalShelterReserved = shelters.reduce((acc, s) => acc + s.reservedCapacity, 0);

  const availableTeamsCount = teams.filter(t => t.status === 'Available').length;
  const blockedRoadsCount = routeSegments.filter(s => s.status === 'BLOCKED').length;

  const topPriorities = priorities.slice(0, 5);

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) return;
    try {
      await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'PRIORITY_RANKING',
          targetId: overrideHabId,
          overrideAction: 'Authority forced priority escalation over AI suggestion',
          mandatoryReason: overrideReason,
          authorizedUser: 'Incident Commander Duty Officer'
        })
      });
      setOverrideSuccessMsg('Manual override logged to official audit history.');
      setTimeout(() => {
        setShowOverrideModal(false);
        setOverrideSuccessMsg('');
        setOverrideReason('');
      }, 1500);
    } catch {
      setShowOverrideModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100">
      {/* 1. EXECUTIVE KPI SUMMARY METRICS */}
      <section aria-label="Executive Key Performance Indicators">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Active Disasters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Disasters</span>
              <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/60">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-white">1 Active</div>
            <p className="text-[11px] text-rose-300/90 mt-1 truncate">Stage IV Flash Flood</p>
          </div>

          {/* High Risk Red Zones */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Red Zones</span>
              <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/60">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-rose-400">
              {riskZones.filter(z => z.riskLevel === 'High' || z.riskLevel === 'Critical').length} Critical
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">8,990 pop exposed</p>
          </div>

          {/* People Requiring Evacuation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Needs Evac</span>
              <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-300">
              {totalEvacuationNeeded.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">Across 4 settlements</p>
          </div>

          {/* Available Shelter Capacity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Shelter Open</span>
              <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/60">
                <Home className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-blue-300">
              {totalShelterAvailable.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">{totalShelterReserved.toLocaleString()} reserved</p>
          </div>

          {/* Rescue Teams */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Teams</span>
              <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
              {availableTeamsCount} Ready
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">2 En Route / Deployed</p>
          </div>

          {/* Blocked Roads */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Road Safety</span>
              <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/60">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-rose-400">
              {blockedRoadsCount} Blocked
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1 truncate">Causeway Br. Rerouted</p>
          </div>
        </div>
      </section>

      {/* 2. MAIN OPERATIONS WORKSPACE: TACTICAL MAP + IMMEDIATE PRIORITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Container (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg min-h-[580px]">
          {/* Map Header */}
          <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Tactical Geospatial Operations Map
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('red-zones')}
                className="text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 transition text-xs font-medium"
              >
                Inspect Red Zones
              </button>
              <button
                onClick={() => onNavigateTab('route-safety')}
                className="text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 transition text-xs font-medium"
              >
                Route Safety
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="flex-1 w-full min-h-[500px]">
            <LeafletMap
              habitations={habitations}
              shelters={shelters}
              teams={teams}
              riskZones={riskZones}
              routeSegments={routeSegments}
              routes={routes}
              selectedHabitationId={selectedHabId}
              onSelectHabitation={(id) => {
                setSelectedHabId(id);
                onSelectHabitation(id);
              }}
              onSelectShelter={onSelectShelter}
              onTriggerEvacuation={onTriggerEvacuation}
              onRequestAIExplanation={onRequestAIExplanation}
            />
          </div>
        </div>

        {/* Right-Side Immediate Priority Panel (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white uppercase">Immediate Evacuation Priorities</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono font-bold">
                  AI RANKED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automated multi-factor risk assessment by urgency window
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('rescue-priorities')}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Priorities List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[540px]">
            {topPriorities.map((item) => {
              const isSelected = item.habitationId === selectedHabId;

              return (
                <div
                  key={item.habitationId}
                  onClick={() => setSelectedHabId(item.habitationId)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-rose-500/80 ring-2 ring-rose-500/20 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm">
                        #{item.rank}
                      </span>
                      <span className="font-bold text-sm text-slate-100">{item.habitationName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-slate-400">Score:</span>
                      <span className="font-mono font-bold text-amber-300">{item.priorityScore}/100</span>
                    </div>
                  </div>

                  {/* Clean unboxed telemetry stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 mb-2.5">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Hazard Type</span>
                      <strong className="text-rose-400">{item.hazardType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Urgency / Window</span>
                      <strong className="text-amber-300 font-mono">{item.urgency} ({item.estimatedEvacTimeMin}m)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Exposed Population</span>
                      <strong className="text-slate-200 font-mono">{item.totalPopulation.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Vulnerable Headcount</span>
                      <strong className="text-rose-300 font-mono">{item.vulnerablePopulation.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 mb-2.5 flex items-center justify-between">
                    <div className="truncate">
                      Safe Shelter: <strong className="text-slate-200">{item.nearestShelterName}</strong>
                    </div>
                    <div className="text-emerald-400 font-mono shrink-0 ml-2">
                      {item.shelterAvailableCapacity.toLocaleString()} berths
                    </div>
                  </div>

                  {/* Recommended Action Box */}
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-200 mb-3 leading-relaxed">
                    <span className="font-semibold text-rose-300 mr-1">Recommended:</span>
                    <span>{item.recommendedAction}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerEvacuation(item.habitationId);
                      }}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Evacuate Now</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestAIExplanation(item.habitationId);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold py-2 px-3 rounded-lg border border-slate-700 transition flex items-center gap-1"
                      title="Explain why this village was prioritized"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Why?</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverrideHabId(item.habitationId);
                        setShowOverrideModal(true);
                      }}
                      className="bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium py-2 px-2.5 rounded-lg border border-slate-700/60 transition"
                      title="Authority manual override"
                    >
                      Override
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 text-center">
            <button
              onClick={() => onNavigateTab('shelters')}
              className="w-full bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-semibold py-2.5 rounded-xl border border-cyan-800/40 transition flex items-center justify-center gap-1.5"
            >
              <span>Manage Multi-Team Capacity Reservations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Override AI Recommendation Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Override AI Recommendation</span>
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Human authorities have the absolute right to override automated AI rescue prioritization.
              Per protocol, a <strong>mandatory justification reason</strong> must be entered into the permanent audit trail.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mandatory Override Justification <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Ground surveillance reports unexpected bridge structural failure on alternative path; redirecting team to Sector 2."
                className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {overrideSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold">
                ✓ {overrideSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleManualOverride}
                disabled={!overrideReason.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                Confirm &amp; Log Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
