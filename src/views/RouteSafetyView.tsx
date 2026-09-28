import React, { useState } from 'react';
import {
  Navigation,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { RouteSegment, EvacuationRoute } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface RouteSafetyViewProps {
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  onRefreshState: () => void;
}

export const RouteSafetyView: React.FC<RouteSafetyViewProps> = ({
  routeSegments,
  routes,
  onRefreshState
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('seg-2');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcNotice, setRecalcNotice] = useState<string | null>(null);

  const selectedSegment = routeSegments.find(s => s.id === selectedSegmentId) || routeSegments[0];

  const handleToggleBlockage = async (segId: string, currentStatus: string) => {
    setIsRecalculating(true);
    const newStatus = currentStatus === 'BLOCKED' ? 'SAFE' : 'BLOCKED';
    const reason = newStatus === 'BLOCKED' ? 'Water overtopping 0.9m across bridge deck' : undefined;

    const res = await ApiClient.recalculateRoute(segId, newStatus, reason);
    if (res) {
      setRecalcNotice(
        `Segment ${segId} marked as ${newStatus}. ${
          newStatus === 'BLOCKED' ? '⚠️ Affected routes automatically recalculated to Eastern Bypass.' : 'Route cleared.'
        }`
      );
    }
    setIsRecalculating(false);
    onRefreshState();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Dynamic Route Safety Analysis &amp; Auto-Rerouting</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 font-mono">
              GRAPH REROUTE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitors road segments for flash inundation, bridge overtopping, or debris. Automatically reroutes convoys when any segment transitions to BLOCKED.
          </p>
        </div>

        <button
          onClick={onRefreshState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Geometry</span>
        </button>
      </div>

      {recalcNotice && (
        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-600 text-indigo-200 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{recalcNotice}</span>
          </div>
          <button onClick={() => setRecalcNotice(null)} className="text-indigo-400 hover:text-white text-sm font-bold ml-2">✕</button>
        </div>
      )}

      {/* Grid: Road Segments Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Road Segments List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Monitored Road Segments</h3>
            <span className="text-xs text-slate-400 font-mono">{routeSegments.length} Segments Active</span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {routeSegments.map((seg) => {
              const isBlocked = seg.status === 'BLOCKED';
              const isRisky = seg.status === 'RISKY';
              const isSafe = seg.status === 'SAFE';

              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSegmentId(seg.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    seg.id === selectedSegmentId
                      ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border font-mono ${
                      isBlocked
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : isRisky
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {seg.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {seg.distanceKm} km · {seg.travelTimeMinutes} mins
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{seg.name}</h4>
                  <div className="text-xs text-slate-400 mb-2 mt-0.5">
                    {seg.from} → {seg.to}
                  </div>

                  {seg.blockageReason && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 mb-2.5 leading-relaxed">
                      ⚠️ {seg.blockageReason}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">Hazard: <strong className="text-slate-200">{seg.hazardRisk}</strong></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBlockage(seg.id, seg.status);
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold transition text-xs ${
                        isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {isBlocked ? 'Mark as Clear / Safe' : 'Simulate Flood Blockage'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: End-to-End Evacuation Routes and Reroute Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">Algorithmic Reroute</span>
              <h3 className="font-bold text-sm text-white mt-0.5">Active Evacuation Routes</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {routes.length} Monitored
            </span>
          </div>

          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
            {routes.map((route) => {
              const isBlocked = route.status === 'BLOCKED';

              return (
                <div
                  key={route.id}
                  className={`p-4 rounded-xl border ${
                    isBlocked
                      ? 'bg-rose-950/30 border-rose-800/80'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border font-mono ${
                      isBlocked
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {route.status} ROUTE
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {route.totalDistanceKm} km · {route.estimatedTimeMinutes} min ETA
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-1">{route.name}</h4>
                  <div className="text-xs text-slate-400 mb-2.5">
                    Origin: <strong className="text-slate-200">{route.fromHabitationName}</strong> → Destination: <strong className="text-slate-200">{route.toShelterName}</strong>
                  </div>

                  {/* Segments breadcrumb */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs mb-2.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Path:</span>
                    {route.segments.map((s, idx) => (
                      <React.Fragment key={s.id}>
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          s.status === 'BLOCKED'
                            ? 'bg-rose-950 text-rose-300 line-through border border-rose-800'
                            : s.status === 'RISKY'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-200'
                        }`}>
                          {s.name}
                        </span>
                        {idx < route.segments.length - 1 && <span className="text-slate-600">→</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  {isBlocked && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-200 space-y-1.5 leading-relaxed">
                      <div className="font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>ROUTE NO LONGER SAFE: Bridge Flooded</span>
                      </div>
                      <p className="text-xs">
                        The Kosi Causeway Bridge is submerged by +0.9m spate. Do not dispatch vehicles along standard Route 2.
                      </p>
                      <div className="mt-2 p-2.5 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs">
                        <strong className="text-emerald-300 block mb-1">Dynamic Recalculation Output:</strong>
                        <span>Reroute via Eastern Flood Bypass → Ridge Road → Purnea Community Center</span><br/>
                        <span className="font-mono text-[11px] text-emerald-400 mt-1 block">Distance: 14.8 km (+2.8 km) · ETA: 38 min (+8 min) · Risk: LOW (All segments above flood line).</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
