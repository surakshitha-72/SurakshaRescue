import React, { useState } from 'react';
import {
  MapPin,
  Home,
  Users,
  Navigation,
  ShieldAlert,
  Search,
  Crosshair,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers
} from 'lucide-react';
import {
  Habitation,
  Shelter,
  RescueTeam,
  RiskZone,
  RouteSegment,
  EvacuationRoute
} from '../types/disaster';
import { LeafletMap } from '../components/LeafletMap';
import { INDIAN_DISASTER_REGIONS, INDIAN_STAGING_BASES } from '../data/indianDisasterData';

interface LiveMapViewProps {
  habitations: Habitation[];
  shelters: Shelter[];
  teams: RescueTeam[];
  riskZones: RiskZone[];
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  onTriggerEvacuation?: (habId: string) => void;
  onRequestAIExplanation?: (habId: string) => void;
  onLaunchRescueForHabitation?: (habId: string) => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  habitations,
  shelters,
  teams,
  riskZones,
  routeSegments,
  routes,
  onTriggerEvacuation,
  onRequestAIExplanation,
  onLaunchRescueForHabitation
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('kosi-bihar');
  const [selectedHabitationId, setSelectedHabitationId] = useState<string | undefined>(
    habitations[0]?.id
  );
  const [selectedShelterId, setSelectedShelterId] = useState<string | undefined>();
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DISASTERS' | 'SHELTERS' | 'TEAMS'>('ALL');

  const selectedRegion = INDIAN_DISASTER_REGIONS.find(r => r.id === selectedRegionId) || INDIAN_DISASTER_REGIONS[0];
  const selectedHabitation = habitations.find(h => h.id === selectedHabitationId);
  const selectedShelter = shelters.find(s => s.id === selectedShelterId);

  // Filtered lists for quick drawer list
  const filteredHabitations = habitations.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-100 font-sans h-full">
      {/* Top Map Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
            <MapPin className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">India Live Disaster &amp; Route Map</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 font-mono">
                GIS LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive OpenStreetMap GIS view of affected zones, shelters, rescue units, and verified route corridors
            </p>
          </div>
        </div>

        {/* Region & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indian Region Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Sector:</span>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {INDIAN_DISASTER_REGIONS.map(reg => (
                <option key={reg.id} value={reg.id} className="bg-slate-900 text-slate-100">
                  {reg.name} ({reg.state})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search settlement / shelter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Main Map + Inspector Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Stage */}
        <div className="lg:col-span-8 h-[550px] lg:h-[640px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
          <LeafletMap
            habitations={filteredHabitations}
            shelters={shelters}
            teams={teams}
            riskZones={riskZones}
            routeSegments={routeSegments}
            routes={routes}
            selectedHabitationId={selectedHabitationId}
            selectedShelterId={selectedShelterId}
            highlightRouteId={selectedRouteId}
            center={selectedRegion.center}
            zoom={selectedRegion.zoom}
            onSelectHabitation={(id) => {
              setSelectedHabitationId(id);
              setSelectedShelterId(undefined);
            }}
            onSelectShelter={(id) => {
              setSelectedShelterId(id);
            }}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            onTriggerEvacuation={onTriggerEvacuation}
            onRequestAIExplanation={onRequestAIExplanation}
          />
        </div>

        {/* Selected Point Inspector Sidebar */}
        <div className="lg:col-span-4 space-y-4 flex flex-col h-[640px]">
          {/* Quick Filter Segmented Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 pl-1">
              <Filter className="w-3.5 h-3.5" /> Filter Map:
            </span>
            <div className="flex gap-1">
              {(['ALL', 'DISASTERS', 'SHELTERS', 'TEAMS'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    activeFilter === tab
                      ? 'bg-cyan-600 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* If Habitation Selected */}
          {selectedHabitation && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Affected Location</span>
                </div>
                {selectedHabitation.evacuationStatus === 'Rescued' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-700 font-mono">
                    ✓ RESCUED
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold border border-rose-800 font-mono">
                    Score: {selectedHabitation.vulnerabilityScore}/100
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-white">{selectedHabitation.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Status: <strong className="text-amber-300">{selectedHabitation.evacuationStatus}</strong> · Nearest Shelter: <strong className="text-slate-200 font-mono">{selectedHabitation.distanceToNearestShelterKm} km</strong>
                </p>
              </div>

              {/* Demographics Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>Total Population: <strong className="text-slate-200 font-mono">{selectedHabitation.demographics.total}</strong></div>
                <div>Children: <strong className="text-slate-200 font-mono">{selectedHabitation.demographics.children}</strong></div>
                <div>Elderly: <strong className="text-slate-200 font-mono">{selectedHabitation.demographics.elderly}</strong></div>
                <div>Medical Needs: <strong className="text-amber-300 font-mono">{selectedHabitation.demographics.medicalDependency}</strong></div>
                <div>Road Accessibility: <strong className="text-slate-200 font-mono">{selectedHabitation.roadAccessibilityScore}/100</strong></div>
                <div>Hazard Exposure: <strong className="text-rose-300 font-mono">{selectedHabitation.hazardExposureScore}/100</strong></div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onLaunchRescueForHabitation && (
                  <button
                    onClick={() => onLaunchRescueForHabitation(selectedHabitation.id)}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Rescue Mission for This Area</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex gap-2">
                  {onTriggerEvacuation && (
                    <button
                      onClick={() => onTriggerEvacuation(selectedHabitation.id)}
                      className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
                    >
                      Trigger Evacuation
                    </button>
                  )}
                  {onRequestAIExplanation && (
                    <button
                      onClick={() => onRequestAIExplanation(selectedHabitation.id)}
                      className="flex-1 py-2 px-2.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 font-semibold text-xs rounded-xl border border-indigo-700/50 transition"
                    >
                      AI Why?
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick List of Habitations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <span className="text-xs font-bold text-slate-300">Habitations in Sector ({filteredHabitations.length})</span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredHabitations.map(h => {
                const isSelected = h.id === selectedHabitationId;
                const isRescued = h.evacuationStatus === 'Rescued';
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHabitationId(h.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-950/30 border-rose-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{h.name}</span>
                        {isRescued && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-700 font-mono">
                            RESCUED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pop: {h.demographics.total} · Nearest shelter: {h.distanceToNearestShelterKm} km
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {h.vulnerabilityScore}/100
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
