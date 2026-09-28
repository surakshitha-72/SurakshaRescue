import React from 'react';
import { ShieldAlert, Users, Home, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RiskZone, Shelter } from '../types/disaster';

interface RedZonesViewProps {
  riskZones: RiskZone[];
  shelters: Shelter[];
  onSelectZone?: (zoneId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const RedZonesView: React.FC<RedZonesViewProps> = ({
  riskZones,
  shelters,
  onNavigateTab
}) => {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Geospatial Red-Zone Identification</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold border border-rose-800 font-mono">
            TRI-COLOR CLASSIFICATION
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Identifies geographical containment zones categorized into Red (High Risk / Immediate Attention), Yellow (Moderate Inundation Buffer), and Green (Safe Elevation Sanctuary).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {riskZones.map((zone) => {
          const isRed = zone.riskLevel === 'High' || zone.riskLevel === 'Critical';
          const isYellow = zone.riskLevel === 'Medium';
          const isGreen = zone.riskLevel === 'Low';

          let borderClass = 'border-rose-700/60 bg-slate-900';
          let badgeClass = 'bg-rose-950 text-rose-300 border-rose-800';
          if (isYellow) {
            borderClass = 'border-amber-700/60 bg-slate-900';
            badgeClass = 'bg-amber-950 text-amber-300 border-amber-800';
          } else if (isGreen) {
            borderClass = 'border-emerald-700/60 bg-slate-900';
            badgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
          }

          const nearbyShelterNames = zone.nearbyShelterIds
            .map(id => shelters.find(s => s.id === id)?.name || id)
            .slice(0, 2);

          return (
            <div key={zone.id} className={`border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${borderClass}`}>
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border font-mono ${badgeClass}`}>
                    {zone.riskLevel} Risk Zone
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Prob: <strong className="text-white font-mono">{zone.probability}%</strong>
                  </span>
                </div>

                <h3 className="font-bold text-base text-white mb-1">{zone.name}</h3>
                <div className="text-xs text-slate-400 mb-3">{zone.severity}</div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300 mb-3.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exposed Population:</span>
                    <strong className="text-white font-mono">{zone.population.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vulnerable Individuals:</span>
                    <strong className={`font-mono ${isRed ? 'text-rose-400' : 'text-slate-200'}`}>
                      {zone.vulnerablePopulation.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hazard Type:</span>
                    <strong className="text-cyan-400">{zone.hazardType}</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-300 mb-3.5">
                  <div className="font-semibold text-slate-200 mb-1">Recommended Directives:</div>
                  <p className="text-[11px] leading-relaxed text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {zone.recommendedAction}
                  </p>
                </div>

                <div className="text-xs text-slate-400 mb-3.5">
                  <span className="font-semibold text-slate-300 block mb-1">Designated Shelters:</span>
                  <div className="space-y-1.5">
                    {nearbyShelterNames.map((sName, i) => (
                      <div key={i} className="text-xs text-cyan-300 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => onNavigateTab('command-center')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>Locate Zone on Tactical Map</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
