import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Layers, Activity } from 'lucide-react';
import { HazardPredictionView } from './HazardPredictionView';
import { RedZonesView } from './RedZonesView';
import { VulnerabilityView } from './VulnerabilityView';
import {
  HazardPrediction,
  RiskZone,
  Habitation,
  Shelter
} from '../types/disaster';

interface DisastersHubViewProps {
  riskZones: RiskZone[];
  habitations: Habitation[];
  shelters: Shelter[];
  onRefreshState: () => void;
  onNavigateTab: (tab: string) => void;
  onTriggerEvacuation?: (habId: string) => void;
}

export const DisastersHubView: React.FC<DisastersHubViewProps> = ({
  riskZones,
  habitations,
  shelters,
  onRefreshState,
  onNavigateTab,
  onTriggerEvacuation
}) => {
  const [subTab, setSubTab] = useState<'prediction' | 'red-zones' | 'vulnerability'>('prediction');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-100 font-sans">
      {/* Top Hub Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md font-bold shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Disaster Risk Intelligence &amp; Hazards</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pre-impact physics hazard prediction, red zone delineation, and vulnerability scoring</p>
          </div>
        </div>

        {/* Sub-tab segmented control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('prediction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              subTab === 'prediction'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Hazard Prediction</span>
          </button>

          <button
            onClick={() => setSubTab('red-zones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              subTab === 'red-zones'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Red Zones</span>
          </button>

          <button
            onClick={() => setSubTab('vulnerability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              subTab === 'vulnerability'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vulnerability</span>
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {subTab === 'prediction' && (
        <HazardPredictionView
          onApplyPredictionToMap={() => {
            onRefreshState();
            onNavigateTab('map');
          }}
        />
      )}

      {subTab === 'red-zones' && (
        <RedZonesView
          riskZones={riskZones}
          shelters={shelters}
          onNavigateTab={onNavigateTab}
        />
      )}

      {subTab === 'vulnerability' && (
        <VulnerabilityView
          habitations={habitations}
          onSelectHabitation={() => {}}
          onTriggerEvacuation={(id) => onTriggerEvacuation?.(id)}
        />
      )}
    </div>
  );
};
