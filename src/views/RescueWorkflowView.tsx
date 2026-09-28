import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Home,
  Navigation,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Users,
  Radio,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  Habitation,
  Shelter,
  RescueTeam,
  EvacuationRoute,
  RiskZone,
  RouteSegment
} from '../types/disaster';
import { LeafletMap } from '../components/LeafletMap';
import { GoogleMapsNavigation } from '../components/GoogleMapsNavigation';
import {
  INDIAN_DISASTER_REGIONS,
  INDIAN_STAGING_BASES,
  generateRescueRoutes
} from '../data/indianDisasterData';
import { ApiClient } from '../services/apiClient';

interface RescueWorkflowViewProps {
  habitations: Habitation[];
  shelters: Shelter[];
  teams: RescueTeam[];
  riskZones: RiskZone[];
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  onRefreshState: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const RescueWorkflowView: React.FC<RescueWorkflowViewProps> = ({
  habitations,
  shelters,
  teams,
  riskZones,
  routeSegments,
  routes,
  onRefreshState,
  onNavigateTab
}) => {
  // Current active step in primary rescue workflow:
  // 1. DISASTER_AREA -> 2. RELOCATION_CENTRE -> 3. GPS_START -> 4. ROUTES -> 5. NAVIGATION
  const [activeStep, setActiveStep] = useState<number>(1);

  // Selections
  const [selectedRegionId, setSelectedRegionId] = useState<string>('kosi-bihar');
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>(
    habitations.find(h => h.vulnerabilityLevel === 'Critical')?.id || habitations[0]?.id || 'hab-1'
  );
  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    shelters[0]?.id || 'shelter-1'
  );

  // GPS State
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    source: string;
    accuracy?: number;
  }>({
    lat: INDIAN_STAGING_BASES[0].lat,
    lng: INDIAN_STAGING_BASES[0].lng,
    name: INDIAN_STAGING_BASES[0].name,
    source: 'STAGING_BASE',
    accuracy: 10
  });
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Routes State
  const [availableRoutes, setAvailableRoutes] = useState<EvacuationRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isSimulatedHazardActive, setIsSimulatedHazardActive] = useState<boolean>(false);
  const [dynamicUpdateNotice, setDynamicUpdateNotice] = useState<string | null>(null);

  // Field Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentNavStepIndex, setCurrentNavStepIndex] = useState(0);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [currentSpeedKmH, setCurrentSpeedKmH] = useState(38);

  // Rescue Confirmation Modal
  const [isRescueConfirmModalOpen, setIsRescueConfirmModalOpen] = useState(false);
  const [rescuedCountInput, setRescuedCountInput] = useState<number>(450);
  const [rescueTeamName, setRescueTeamName] = useState('NDRF Unit 7 Alpha');
  const [rescueNotes, setRescueNotes] = useState('Evacuated priority vulnerable citizens, children, and elderly using high-clearance transport.');
  const [rescueSuccessBanner, setRescueSuccessBanner] = useState<string | null>(null);

  const selectedHabitation = habitations.find(h => h.id === selectedHabitationId) || habitations[0];
  const selectedShelter = shelters.find(s => s.id === selectedShelterId) || shelters[0];
  const selectedRegion = INDIAN_DISASTER_REGIONS.find(r => r.id === selectedRegionId) || INDIAN_DISASTER_REGIONS[0];

  // Set default count when habitation changes
  useEffect(() => {
    if (selectedHabitation) {
      setRescuedCountInput(selectedHabitation.demographics.total);
    }
  }, [selectedHabitationId]);

  // Recalculate routes when start, habitation, shelter, or hazard changes
  useEffect(() => {
    if (selectedHabitation && selectedShelter) {
      const generated = generateRescueRoutes(
        gpsLocation,
        { lat: selectedShelter.lat, lng: selectedShelter.lng, name: selectedShelter.name },
        selectedHabitation,
        selectedShelter,
        isSimulatedHazardActive
      );
      setAvailableRoutes(generated);
      // Select primary or first route
      const prim = generated.find(r => r.isPrimary && r.statusText !== 'BLOCKED') || generated[0];
      setSelectedRouteId(prim?.id || generated[0]?.id || '');
    }
  }, [gpsLocation.lat, gpsLocation.lng, selectedHabitationId, selectedShelterId, isSimulatedHazardActive]);

  // Browser GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const { latitude, longitude, accuracy } = position.coords;
        setGpsLocation({
          lat: latitude,
          lng: longitude,
          name: `Live Device GPS (±${Math.round(accuracy)}m)`,
          source: 'DEVICE_GPS',
          accuracy: Math.round(accuracy)
        });
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsError(`GPS permission denied or unavailable (${err.message}). Using NDRF Staging Base.`);
        // Fallback to NDRF Staging Base
        setGpsLocation({
          lat: INDIAN_STAGING_BASES[0].lat,
          lng: INDIAN_STAGING_BASES[0].lng,
          name: INDIAN_STAGING_BASES[0].name,
          source: 'STAGING_BASE',
          accuracy: 10
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Toggle dynamic hazard simulation
  const handleTriggerSimulatedHazard = () => {
    const nextState = !isSimulatedHazardActive;
    setIsSimulatedHazardActive(nextState);

    if (nextState) {
      setDynamicUpdateNotice(
        '⚠️ ROUTE UPDATE: Selected route (NH-31 Highway) is now BLOCKED due to sudden river water overtopping (1.2m at Causeway Km 14). Switched to Alternative Route (Eastern Embankment Bypass).'
      );
    } else {
      setDynamicUpdateNotice('Route update: Road clear notice received. Primary highway corridor restored.');
      setTimeout(() => setDynamicUpdateNotice(null), 5000);
    }
  };

  // Confirm Rescue Action
  const handleConfirmRescue = async () => {
    if (!selectedHabitation || !selectedShelter) return;

    await ApiClient.confirmRescueOperation({
      habitationId: selectedHabitation.id,
      shelterId: selectedShelter.id,
      teamName: rescueTeamName,
      count: rescuedCountInput,
      notes: rescueNotes
    });

    setIsRescueConfirmModalOpen(false);
    setIsNavigating(false);
    setRescueSuccessBanner(
      `✅ PLACE RESCUED: ${selectedHabitation.name} successfully marked as RESCUED. ${rescuedCountInput} citizens secured at ${selectedShelter.name} by ${rescueTeamName}.`
    );
    onRefreshState();
  };

  const selectedRoute = availableRoutes.find(r => r.id === selectedRouteId) || availableRoutes[0];
  const requiredEvacuees = selectedHabitation?.demographics.total || 500;
  const availableBerths = Math.max(
    0,
    selectedShelter.totalCapacity - selectedShelter.occupiedCapacity - selectedShelter.reservedCapacity
  );
  const isCapacitySufficient = availableBerths >= requiredEvacuees;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-100 font-sans">
      {/* Dynamic Road / Route Alert Banner */}
      {dynamicUpdateNotice && (
        <div className="bg-amber-950/80 border border-amber-500/70 rounded-2xl p-4 shadow-lg flex items-start justify-between gap-3 text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-white">Dynamic Route Advisory Notice</div>
              <p className="text-xs text-amber-300 mt-0.5 leading-relaxed">{dynamicUpdateNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setDynamicUpdateNotice(null)}
            className="text-xs px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded-lg font-semibold transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rescue Success Banner */}
      {rescueSuccessBanner && (
        <div className="bg-emerald-950/90 border border-emerald-500/80 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">Operation Status: Confirmed Rescued</div>
              <p className="text-xs text-emerald-300">{rescueSuccessBanner}</p>
            </div>
          </div>
          <button
            onClick={() => setRescueSuccessBanner(null)}
            className="text-xs px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>
      )}

      {/* Primary Top Header: Operation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Disaster Rescue Coordination & Navigation
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/80 rounded-md">
                LIVE MISSION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              India Incident Response: Affected Area → Relocation Centre → Road Conditions → Safe Navigation
            </p>
          </div>
        </div>

        {/* Region & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indian Region Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {INDIAN_DISASTER_REGIONS.map(reg => (
                <option key={reg.id} value={reg.id} className="bg-slate-900 text-slate-100">
                  {reg.name} ({reg.state})
                </option>
              ))}
            </select>
          </div>

          {/* Test Road Blockage Simulation Button */}
          <button
            onClick={handleTriggerSimulatedHazard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              isSimulatedHazardActive
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/60'
            }`}
            title="Simulate sudden water overtopping on primary road"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isSimulatedHazardActive ? 'Clear Road Hazard' : 'Simulate Road Blockage'}</span>
          </button>
        </div>
      </div>

      {/* Primary Rescue Workflow Step Stepper */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center min-w-[720px] justify-between text-xs">
          {[
            { num: 1, label: '1. Affected Area', desc: selectedHabitation?.name.replace('Village ', '') },
            { num: 2, label: '2. Relocation Centre', desc: selectedShelter?.name.slice(0, 20) + '...' },
            { num: 3, label: '3. Team GPS Start', desc: gpsLocation.name.slice(0, 20) },
            { num: 4, label: '4. Multiple Routes', desc: selectedRoute?.statusText || 'CLEAR' },
            { num: 5, label: '5. Field Navigation', desc: isNavigating ? 'Navigating' : 'Standby' }
          ].map((step, idx) => {
            const isActive = activeStep === step.num;
            const isCompleted = activeStep > step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`flex-1 py-2 px-3 rounded-xl text-left transition flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-slate-800/80 text-emerald-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="font-semibold flex items-center gap-1.5">
                    {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{step.label}</span>
                  </div>
                  <div className={`text-[11px] truncate max-w-[130px] font-mono ${isActive ? 'text-rose-100' : 'text-slate-400'}`}>
                    {step.desc}
                  </div>
                </div>
                {idx < 4 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden lg:inline" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Active Workflow Step Panel + Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Active Workflow Step Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* STEP 1: AFFECTED AREA SELECTION */}
          {activeStep === 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    Select Affected Habitation / Disaster Site
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Active Disaster: <strong className="text-slate-200">{selectedRegion.name}</strong>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase font-mono">
                  {selectedRegion.hazardType}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {habitations.map((hab) => {
                  const isSelected = hab.id === selectedHabitationId;
                  const isRescued = hab.evacuationStatus === 'Rescued';
                  return (
                    <div
                      key={hab.id}
                      onClick={() => setSelectedHabitationId(hab.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500 shadow-sm ring-1 ring-rose-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{hab.name}</span>
                            {isRescued && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold font-mono">
                                ✓ RESCUED
                              </span>
                            )}
                            {!isRescued && hab.vulnerabilityLevel === 'Critical' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold font-mono">
                                CRITICAL
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Pop: <strong className="text-slate-200 font-mono">{hab.demographics.total}</strong> · Vulnerable: <strong className="text-rose-300 font-mono">{hab.demographics.children + hab.demographics.elderly + hab.demographics.medicalDependency}</strong> · Road: {hab.roadAccessibilityScore}/100
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-amber-300">
                            Score: {hab.vulnerabilityScore}/100
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHabitationId(hab.id);
                              setActiveStep(2);
                            }}
                            className="mt-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center justify-end gap-1"
                          >
                            Select <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Target: <strong className="text-white">{selectedHabitation.name}</strong>
                </span>
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  Proceed to Relocation Centre <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: RELOCATION CENTRE & CAPACITY CHECK */}
          {activeStep === 2 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Select Relocation Centre &amp; Verify Capacity
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evacuees to shelter: <strong className="text-amber-300 font-mono">{requiredEvacuees} people</strong> from {selectedHabitation.name}
                  </p>
                </div>
              </div>

              {/* Capacity Status Callout */}
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${
                isCapacitySufficient
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                  : 'bg-amber-950/50 border-amber-700/60 text-amber-200'
              }`}>
                {isCapacitySufficient ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {isCapacitySufficient ? 'Capacity Check Verified' : 'Caution: Limited Shelter Berths'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    Selected centre has <strong className="font-mono">{availableBerths} available berths</strong> for {requiredEvacuees} residents.
                  </div>
                </div>
              </div>

              {/* Shelters List */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {shelters.map((shelter) => {
                  const isSelected = shelter.id === selectedShelterId;
                  const avail = Math.max(0, shelter.totalCapacity - shelter.occupiedCapacity - shelter.reservedCapacity);
                  const isFull = avail <= 100;
                  const pct = Math.round(((shelter.occupiedCapacity + shelter.reservedCapacity) / shelter.totalCapacity) * 100);

                  return (
                    <div
                      key={shelter.id}
                      onClick={() => setSelectedShelterId(shelter.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500 shadow-sm ring-1 ring-blue-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-sm text-white">{shelter.name}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                          isFull ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {avail} berths available
                        </span>
                      </div>

                      {/* Capacity progress */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                        <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>

                      <div className="grid grid-cols-2 text-xs text-slate-400 gap-1.5">
                        <div>Total: <strong className="text-slate-200 font-mono">{shelter.totalCapacity}</strong></div>
                        <div>Occupied: <strong className="text-slate-200 font-mono">{shelter.occupiedCapacity}</strong></div>
                        <div>Medical: <strong className="text-slate-200 font-mono">{shelter.medicalCapacity}</strong></div>
                        <div>Rations: <strong className="text-slate-200 font-mono">{shelter.waterCapacityDays} days</strong></div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-400 truncate max-w-[200px]">{shelter.address}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShelterId(shelter.id);
                            setActiveStep(3);
                          }}
                          className="font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          Select Centre <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => setActiveStep(1)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  Proceed to GPS Start Point <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RESCUE TEAM GPS (START LOCATION) */}
          {activeStep === 3 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    Rescue Team GPS (Start Point)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acquire device GPS coordinates or choose rescue staging base
                  </p>
                </div>
              </div>

              {/* Current GPS Status Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white">Active START Position:</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-800 font-semibold">
                    {gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {gpsLocation.name}
                </div>
                {gpsLocation.accuracy && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Estimated GPS Accuracy: ±{gpsLocation.accuracy} meters
                  </div>
                )}
              </div>

              {/* Geolocation Button */}
              <div>
                <button
                  onClick={handleDetectGPS}
                  disabled={isLocatingGps}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Compass className={`w-4 h-4 ${isLocatingGps ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGps ? 'Locking GPS...' : 'Acquire My Device GPS'}</span>
                </button>
              </div>

              {gpsError && (
                <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs text-amber-300">
                  {gpsError}
                </div>
              )}

              {/* Alternative Indian Staging Bases */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-300">
                  Or Select Staging Post / Command Station:
                </div>
                {INDIAN_STAGING_BASES.map(base => {
                  const isSelected = gpsLocation.name === base.name;
                  return (
                    <div
                      key={base.name}
                      onClick={() => setGpsLocation(base)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-100">{base.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {base.lat.toFixed(3)}° N, {base.lng.toFixed(3)}° E
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  Proceed to Available Routes <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MULTIPLE ROUTES & ROAD CONDITIONS */}
          {activeStep === 4 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                    Multiple Routes &amp; Road Verification
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Production route safety engine with live hazard verification
                  </p>
                </div>
                <button
                  onClick={handleTriggerSimulatedHazard}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                >
                  {isSimulatedHazardActive ? 'Clear Blockage' : 'Simulate Blockage'}
                </button>
              </div>

              {/* Routes Selection List */}
              <div className="space-y-3">
                {availableRoutes.map((route, idx) => {
                  const isSelected = route.id === selectedRouteId;
                  const status = route.statusText || 'CLEAR';

                  let statusBadgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-700';
                  let statusText = '🟢 CLEAR';
                  if (status === 'CAUTION') {
                    statusBadgeBg = 'bg-amber-950 text-amber-300 border-amber-700';
                    statusText = '🟡 CAUTION';
                  } else if (status === 'BLOCKED') {
                    statusBadgeBg = 'bg-rose-950 text-rose-300 border-rose-700';
                    statusText = '🔴 BLOCKED';
                  } else if (status === 'UNKNOWN') {
                    statusBadgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
                    statusText = '⚪ UNKNOWN';
                  }

                  return (
                    <div
                      key={route.id}
                      onClick={() => {
                        if (status !== 'BLOCKED') {
                          setSelectedRouteId(route.id);
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-slate-800/90 border-rose-500 shadow-sm ring-1 ring-rose-500/40 cursor-pointer'
                          : status === 'BLOCKED'
                          ? 'bg-rose-950/20 border-rose-900/60 opacity-80 cursor-not-allowed'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            Route {idx + 1}: {idx === 0 ? 'NH Highway Primary' : idx === 1 ? 'Elevated Bypass Link' : 'Rural Feeder Canal'}
                          </span>
                          {route.isPrimary && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeBg}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 mb-2">
                        <div>Distance: <strong className="text-white font-mono">{route.distanceKm} km</strong></div>
                        <div>ETA: <strong className="text-white font-mono">{route.estimatedTravelTimeMin} min</strong></div>
                      </div>

                      {/* Road condition description */}
                      <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 mb-2 leading-relaxed">
                        {route.roadConditionNote}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Road status: {route.lastUpdatedTime}</span>
                        </span>

                        {status !== 'BLOCKED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRouteId(route.id);
                              setActiveStep(5);
                            }}
                            className="font-bold text-rose-400 hover:text-rose-300"
                          >
                            Select &amp; Start Navigation →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep(5)}
                  disabled={selectedRoute?.statusText === 'BLOCKED'}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  Start Rescue Mode <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: RESCUE MODE (FIELD PERSONNEL SCREEN) */}
          {activeStep === 5 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              {/* Field Command Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-rose-700/60 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-600/40 font-mono">
                    Rescue Field Command
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60"
                      title="Audio guidance alert"
                    >
                      {audioAlertsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    </button>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">ACTIVE DISASTER:</div>
                  <div className="text-sm font-bold text-white">
                    {selectedRegion.hazardType}: {selectedRegion.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">TARGET HABITATION:</div>
                    <div className="font-bold text-white truncate">{selectedHabitation.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">DESTINATION SHELTER:</div>
                    <div className="font-bold text-cyan-300 truncate">{selectedShelter.name}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-bold font-mono">
                  <div className="text-slate-200">
                    {selectedRoute.distanceKm} km · ETA: {selectedRoute.estimatedTravelTimeMin} min
                  </div>
                  <div className="text-emerald-400">
                    {selectedRoute.statusText || 'CLEAR'} ROUTE
                  </div>
                </div>
              </div>

              {/* GOOGLE MAPS DRIVER TURN-BY-TURN NAVIGATION */}
              <GoogleMapsNavigation
                origin={gpsLocation}
                destination={{
                  lat: selectedShelter.lat,
                  lng: selectedShelter.lng,
                  name: selectedShelter.name,
                  address: selectedShelter.address
                }}
                waypoint={{
                  lat: selectedHabitation.lat,
                  lng: selectedHabitation.lng,
                  name: selectedHabitation.name
                }}
                route={selectedRoute}
                isNavigating={isNavigating}
                onStartNavigation={() => setIsNavigating(true)}
                onStopNavigation={() => setIsNavigating(false)}
                audioAlertsEnabled={audioAlertsEnabled}
                onToggleAudioAlerts={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                onMarkRescued={() => setIsRescueConfirmModalOpen(true)}
              />

              {/* Mark as Rescued Button */}
              <button
                onClick={() => setIsRescueConfirmModalOpen(true)}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wide border-2 border-emerald-400/80"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>Mark as Rescued / Confirm Rescue</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Dynamic Interactive Disaster Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[520px] lg:h-auto min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <LeafletMap
            habitations={habitations}
            shelters={shelters}
            teams={teams}
            riskZones={riskZones}
            routeSegments={routeSegments}
            routes={availableRoutes}
            selectedHabitationId={selectedHabitationId}
            selectedShelterId={selectedShelterId}
            highlightRouteId={selectedRouteId}
            gpsLocation={gpsLocation}
            center={selectedRegion.center}
            zoom={selectedRegion.zoom}
            onSelectHabitation={(id) => {
              setSelectedHabitationId(id);
              setActiveStep(1);
            }}
            onSelectShelter={(id) => {
              setSelectedShelterId(id);
              setActiveStep(2);
            }}
            onSelectRoute={(id) => {
              setSelectedRouteId(id);
              setActiveStep(4);
            }}
            onLocateUser={handleDetectGPS}
          />
        </div>
      </div>

      {/* CONFIRMATION MODAL: MARK AS RESCUED */}
      {isRescueConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Confirm Rescue Operation</h3>
              </div>
              <button
                onClick={() => setIsRescueConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Record that citizens from this affected area have been safely reached, extracted, and relocated to the designated centre.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Affected Habitation:</span>
                <strong className="text-white">{selectedHabitation.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receiving Relocation Centre:</span>
                <strong className="text-cyan-300">{selectedShelter.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route Used:</span>
                <strong className="text-emerald-400 font-mono">{selectedRoute.distanceKm} km ({selectedRoute.statusText || 'CLEAR'})</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Rescued People Headcount:
                </label>
                <input
                  type="number"
                  value={rescuedCountInput}
                  onChange={(e) => setRescuedCountInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Rescue Unit / Lead:
                </label>
                <input
                  type="text"
                  value={rescueTeamName}
                  onChange={(e) => setRescueTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Operational Notes &amp; Status:
                </label>
                <textarea
                  rows={2}
                  value={rescueNotes}
                  onChange={(e) => setRescueNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsRescueConfirmModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRescue}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Mark as Rescued</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
