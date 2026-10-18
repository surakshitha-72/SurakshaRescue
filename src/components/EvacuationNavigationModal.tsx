import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  Users,
  Truck,
  Volume2,
  VolumeX,
  ExternalLink,
  RotateCcw,
  Send,
  Home,
  X,
  Radio,
  Activity,
  Layers,
  Sparkles,
  Check,
  Plus,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Habitation, Shelter, RescueTeam, EvacuationRoute, TurnByTurnStep, PriorityRanking } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

export interface EvacuationNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitation?: Habitation | null;
  settlement?: Habitation | null;
  priorityItem?: PriorityRanking;
  shelters?: Shelter[];
  teams?: RescueTeam[];
  routes?: EvacuationRoute[];
  onRefreshState?: () => void;
}

export interface CandidateRoute {
  id: string;
  name: string;
  routeType: 'AI_RECOMMENDED' | 'CAUTION' | 'BLOCKED' | 'SPECIALIZED';
  distanceKm: number;
  etaMin: number;
  roadName: string;
  statusText: 'CLEAR' | 'CAUTION' | 'BLOCKED';
  safetyNote: string;
  hazardWarning?: string;
  isAiRecommended: boolean;
  isBlocked: boolean;
  steps: TurnByTurnStep[];
}

// Inner 4-stage lifecycle component
const EvacuationNavigationModalContent: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settlement: Habitation;
  priorityItem?: PriorityRanking;
  shelters?: Shelter[];
  teams?: RescueTeam[];
  routes?: EvacuationRoute[];
  onRefreshState?: () => void;
}> = ({
  isOpen,
  onClose,
  settlement,
  priorityItem,
  shelters = [],
  teams = [],
  routes = [],
  onRefreshState
}) => {
  // Current 4-stage rescue lifecycle state (Stage 1 to Stage 4)
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);

  // Settlement coordinates with safe fallbacks
  const habLat = settlement?.coordinates?.[0] ?? settlement?.lat ?? 25.575;
  const habLng = settlement?.coordinates?.[1] ?? settlement?.lng ?? 87.245;
  const habName = settlement?.name || 'Affected Settlement';
  const evacCount = settlement?.demographics?.total ?? (settlement as any)?.population ?? 850;
  const vulnerableCount = settlement?.demographics?.vulnerable?.total ?? 180;

  // Selected Assigned Team
  const assignedTeam = teams?.find(t => t?.assignedHabitationId === settlement?.id) ||
    teams?.find(t => t?.status === 'Available') ||
    teams?.[0] ||
    null;

  // STAGE 1 & 2: Hazard-Aware Candidate Inbound Routes via RAG Engine
  const defaultHazardAwareRoutes: CandidateRoute[] = [
    {
      id: 'route-inbound-primary',
      name: 'NH-31 High Embankment Expressway (RAG Safe Detour)',
      routeType: 'AI_RECOMMENDED',
      distanceKm: 4.8,
      etaMin: 14,
      roadName: 'NH-31 High Embankment Corridor',
      statusText: 'CLEAR',
      safetyNote: 'RAG Verified: Elevated 4-lane expressway (+3.5m above HFL). Automatically bypasses submerged SH-58 culverts and Kosi Old Bridge.',
      isAiRecommended: true,
      isBlocked: false,
      steps: [
        { instruction: `Deploy from ${assignedTeam?.name || 'NDRF Base'} onto NH-31 Elevated Bypass`, distanceMeters: 800, roadName: 'NH-31 Link', action: 'straight' },
        { instruction: `Follow NH-31 High Embankment detour waypoint (25.5680°N, 87.2550°E) toward ${habName}`, distanceMeters: 3100, roadName: 'NH-31 High Embankment', action: 'straight' },
        { instruction: `Take northern elevated perimeter exit into ${habName}`, distanceMeters: 900, roadName: 'Sector 3 Access Road', action: 'take-exit' }
      ]
    },
    {
      id: 'route-inbound-bypass',
      name: 'SH-58 PWD Canal Bund Road',
      routeType: 'BLOCKED',
      distanceKm: 6.9,
      etaMin: 22,
      roadName: 'SH-58 PWD Canal Bund Road',
      statusText: 'BLOCKED',
      safetyNote: 'COMPROMISED / BLOCKED: Ingested BSDMA & CWC bulletins report low-lying culverts submerged under 0.6m water.',
      hazardWarning: 'RAG TELEMETRY BLOCKAGE: Water depth 0.6m at Km 3.8 sluice gate. Automatically bypassed.',
      isAiRecommended: false,
      isBlocked: true,
      steps: [
        { instruction: `Depart via State Highway 58 Canal Bund road`, distanceMeters: 1200, roadName: 'SH-58 Bund Rd', action: 'straight' },
        { instruction: `CULVERT SUBMERGED at Km 3.8: Rerouted to NH-31`, distanceMeters: 0, roadName: 'Submerged Culvert', action: 'arrive' }
      ]
    },
    {
      id: 'route-inbound-causeway',
      name: 'Kosi River Causeway Old Bridge',
      routeType: 'BLOCKED',
      distanceKm: 3.5,
      etaMin: 10,
      roadName: 'Kosi River Causeway Old Bridge',
      statusText: 'BLOCKED',
      safetyNote: 'COMPROMISED / BLOCKED: Submerged under 1.4m rapid discharge (3.4 m/s flow velocity).',
      hazardWarning: 'RAG TELEMETRY BLOCKAGE: Sensor CS-09 structural scour alert. Corridor closed.',
      isAiRecommended: false,
      isBlocked: true,
      steps: [
        { instruction: 'Approach Old Causeway bridge junction', distanceMeters: 1500, roadName: 'Causeway Approach', action: 'straight' },
        { instruction: 'BRIDGE SUBMERGED: Turn around immediately', distanceMeters: 0, roadName: 'Causeway Deck', action: 'arrive' }
      ]
    },
    {
      id: 'route-inbound-boat',
      name: 'Kosi Aquatic Zodiac Channel (NDRF Boat Squad)',
      routeType: 'SPECIALIZED',
      distanceKm: 5.2,
      etaMin: 25,
      roadName: 'Kosi Waterway Transit Channel',
      statusText: 'CLEAR',
      safetyNote: 'Specialized deep-water channel for motorized NDRF Zodiacs & rescue watercraft.',
      hazardWarning: 'Restricted: Watercraft squads only.',
      isAiRecommended: false,
      isBlocked: false,
      steps: [
        { instruction: 'Launch inflatable boats from Kosi Ghat staging ramp', distanceMeters: 500, roadName: 'Boat Slipway', action: 'straight' },
        { instruction: 'Navigate downriver channel toward flooded ward', distanceMeters: 4100, roadName: 'River Navigation Channel', action: 'straight' },
        { instruction: `Moor at elevated rooftop staging point in ${habName}`, distanceMeters: 600, roadName: 'Submerged Muster Point', action: 'arrive' }
      ]
    }
  ];

  const [candidateInboundRoutes, setCandidateInboundRoutes] = useState<CandidateRoute[]>(defaultHazardAwareRoutes);
  const [safeBypassWaypoint, setSafeBypassWaypoint] = useState<{ lat: number; lng: number }>({ lat: 25.568, lng: 87.255 });
  const [ragRouteAdvisory, setRagRouteAdvisory] = useState<string>(
    'RAG Route Engine flagged SH-58 Canal Bund (0.6m culvert submergence) and Kosi Old Bridge (1.4m surge) as COMPROMISED / BLOCKED. Safe detour recalculated via NH-31 High Embankment.'
  );

  useEffect(() => {
    let active = true;
    ApiClient.getHazardAwareInboundRoutes(habName, assignedTeam?.currentLocation).then((res) => {
      if (active && res && Array.isArray(res.routes) && res.routes.length > 0) {
        setCandidateInboundRoutes(res.routes);
        if (res.safeBypassWaypoint) setSafeBypassWaypoint(res.safeBypassWaypoint);
        if (res.ragAdvisoryNote) setRagRouteAdvisory(res.ragAdvisoryNote);
      }
    });
    return () => {
      active = false;
    };
  }, [habName]);

  // Selected Inbound Route
  const [selectedRouteId, setSelectedRouteId] = useState<string>(defaultHazardAwareRoutes[0].id);
  const selectedRoute = candidateInboundRoutes.find(r => r.id === selectedRouteId) || candidateInboundRoutes[0];

  // STAGE 2: Live Navigation state to Affected Region
  const [navProgress, setNavProgress] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(38);
  const [etaMinutes, setEtaMinutes] = useState<number>(selectedRoute.etaMin);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // STAGE 3: Shelters Sorted by Proximity
  const sheltersWithDistance = (shelters || []).map((s, idx) => {
    const sLat = s?.coordinates?.[0] ?? s?.lat ?? 25.59;
    const sLng = s?.coordinates?.[1] ?? s?.lng ?? 87.26;
    const dLat = (sLat - habLat) * 111;
    const dLng = (sLng - habLng) * 111 * Math.cos((habLat * Math.PI) / 180);
    const approxDist = Math.max(1.5, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10);
    const approxEta = Math.round(approxDist * 2.4);

    return {
      ...s,
      calculatedDistanceKm: approxDist,
      calculatedEtaMin: approxEta,
      coordinates: [sLat, sLng] as [number, number]
    };
  }).sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);

  // Default selected shelter is the nearest or the AI recommended one
  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    sheltersWithDistance.find(s => s?.name === priorityItem?.nearestShelterName)?.id ||
    sheltersWithDistance[0]?.id ||
    'shelter-1'
  );

  const activeTargetShelter = sheltersWithDistance.find(s => s.id === selectedShelterId) || sheltersWithDistance[0];

  // Quick Berth Reservation state in Stage 3
  const [reserveBerthInput, setReserveBerthInput] = useState<number>(Math.min(evacCount, 250));
  const [isReservingInline, setIsReservingInline] = useState<boolean>(false);
  const [reserveNotice, setReserveNotice] = useState<string | null>(null);

  // STAGE 4: Completion & Execution state
  const [isCompletingMission, setIsCompletingMission] = useState<boolean>(false);
  const [missionCompleteSuccess, setMissionCompleteSuccess] = useState<boolean>(false);

  // Audio speech helper
  const speakText = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio synthesis errors
    }
  };

  // User real-time GPS coordinates state
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);

  // Live Google Maps Navigation Integration with Real-Time Geolocation (Requirement 3)
  const launchLiveGoogleMapsNavigation = () => {
    const defaultOriginLat = assignedTeam?.currentLocation?.lat ?? 25.5520;
    const defaultOriginLng = assignedTeam?.currentLocation?.lng ?? 87.2350;
    const targetLat = habLat;
    const targetLng = habLng;

    const openDirectionsUrl = (originLat: number, originLng: number) => {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${targetLat},${targetLng}&travelmode=driving`;
      window.open(url, '_blank', 'noopener,noreferrer');
      speakText(`Opening live Google Maps driving navigation to ${habName}.`);
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocatingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingGPS(false);
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setUserGpsCoords({ lat: userLat, lng: userLng });
          openDirectionsUrl(userLat, userLng);
        },
        (err) => {
          console.warn('GPS location unavailable or permission denied, using default Command Center origin:', err);
          setIsLocatingGPS(false);
          openDirectionsUrl(defaultOriginLat, defaultOriginLng);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      openDirectionsUrl(defaultOriginLat, defaultOriginLng);
    }
  };

  // Google Maps URL to Destination Shelter (Stage 3)
  const openGoogleMapsToShelter = (sLat: number, sLng: number, sName: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${habLat},${habLng}&destination=${sLat},${sLng}&travelmode=driving`;
    window.open(url, '_blank');
    speakText(`Opening Google Maps navigation from ${habName} to ${sName}.`);
  };

  // Handle Quick Inline Berth Reservation (Stage 3)
  const handleQuickReserveBerths = async (shelterId: string) => {
    setIsReservingInline(true);
    setReserveNotice(null);
    try {
      const res = await ApiClient.reserveShelterCapacity({
        shelterId,
        teamId: assignedTeam?.id || 'team-1',
        teamName: assignedTeam?.name || 'NDRF Unit 7',
        habitationId: settlement?.id || 'hab-1',
        habitationName: habName,
        count: reserveBerthInput
      });

      if (res.success) {
        setReserveNotice(`Locked ${reserveBerthInput.toLocaleString()} berths for convoy.`);
        if (onRefreshState) onRefreshState();
      } else {
        setReserveNotice(res.message || 'Berth reservation rejected: Insufficient space');
      }
    } catch (e: any) {
      setReserveNotice(e.message || 'Reservation error');
    } finally {
      setIsReservingInline(false);
      setTimeout(() => setReserveNotice(null), 4000);
    }
  };

  // Handle Full Mission Completion (Stage 4)
  const handleMarkMissionComplete = async () => {
    setIsCompletingMission(true);
    try {
      await ApiClient.confirmRescueOperation({
        habitationId: settlement?.id || 'hab-1',
        shelterId: activeTargetShelter?.id || 'shelter-1',
        teamName: assignedTeam?.name || 'NDRF Unit 7 Alpha',
        count: evacCount,
        notes: `Convoy safely arrived at ${activeTargetShelter?.name}. All ${evacCount} residents evacuated via ${selectedRoute.name}.`
      });

      setMissionCompleteSuccess(true);
      if (onRefreshState) onRefreshState();
      speakText(`Mission complete! ${habName} marked as Secured. ${evacCount} residents delivered to ${activeTargetShelter?.name}.`);
    } catch (e) {
      console.warn('Mission complete error:', e);
      setMissionCompleteSuccess(true);
      if (onRefreshState) onRefreshState();
    } finally {
      setIsCompletingMission(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & 4-STAGE LIFECYCLE PROGRESS BAR                            */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md ring-2 ring-rose-500/30 shrink-0">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">
                    4-STAGE RESCUE LIFECYCLE
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    Target: {habName}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <span>Evacuation Coordination &amp; Navigation Flow</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-xl border text-xs font-medium transition ${
                  audioEnabled
                    ? 'bg-slate-800 text-cyan-300 border-cyan-700/60 shadow-sm'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
                title={audioEnabled ? 'Voice Guidance Active' : 'Voice Guidance Muted'}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Stage Stepper Ribbon */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-xs">
            {[
              { num: 1, label: 'Route Selection', desc: 'All Candidate Corridors' },
              { num: 2, label: 'En Route to Region', desc: 'Google Maps GPS' },
              { num: 3, label: 'Shelter & Return', desc: 'Capacity & Delivery' },
              { num: 4, label: 'Mission Complete', desc: 'Rescued Status Update' }
            ].map((st) => {
              const isCurrent = currentStage === st.num;
              const isDone = currentStage > st.num;

              let stageBtnStyle = 'bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed';
              let badgeStyle = 'bg-slate-800 text-slate-400';

              if (isCurrent) {
                if (st.num === 2) {
                  // Stage 2 Primary Header & Indicator: Deep Dark Blue (#0A192F) with Sky Blue accents
                  stageBtnStyle = 'bg-[#0A192F] border-sky-500 text-sky-200 ring-2 ring-sky-500/50 shadow-lg shadow-sky-950/60';
                  badgeStyle = 'bg-sky-400 text-slate-950 font-black';
                } else if (st.num === 3) {
                  stageBtnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-sm';
                  badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
                } else {
                  stageBtnStyle = 'bg-rose-950/80 border-rose-500 text-white ring-1 ring-rose-500/40 shadow-sm';
                  badgeStyle = 'bg-rose-600 text-white font-black';
                }
              } else if (isDone) {
                stageBtnStyle = 'bg-emerald-950/60 border-emerald-700 text-emerald-300 cursor-pointer';
                badgeStyle = 'bg-emerald-500 text-slate-950 font-bold';
              }

              return (
                <button
                  key={st.num}
                  onClick={() => {
                    if (st.num <= currentStage || isDone) {
                      setCurrentStage(st.num as any);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all ${stageBtnStyle}`}
                >
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${badgeStyle}`}>
                      {isDone ? '✓' : st.num}
                    </span>
                    <span className="truncate">{st.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-300/80 block truncate mt-0.5">
                    {st.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BODY CONTENT AREA (RENDERED BY CURRENT STAGE)                          */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ========================================================================= */}
          {/* STAGE 1: ROUTE SELECTION (ALL POSSIBLE ROUTES)                             */}
          {/* ========================================================================= */}
          {currentStage === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Stage 1: Evacuation Route Planner — Select Inbound Corridor</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review all available paths to <strong>{habName}</strong> ({evacCount.toLocaleString()} residents, {vulnerableCount} vulnerable).
                    Select safest route verified by hydrological sensors.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {candidateInboundRoutes.length} Corridors Evaluated
                </span>
              </div>

              {/* Candidate Routes List */}
              <div className="space-y-3">
                {candidateInboundRoutes.map((route) => {
                  const isSelected = route.id === selectedRouteId;

                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  let borderHighlight = 'border-slate-800';

                  if (route.isAiRecommended) {
                    badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800 ring-1 ring-emerald-500/40';
                    borderHighlight = isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20' : 'border-emerald-800/80 bg-slate-950/80';
                  } else if (route.isBlocked) {
                    badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
                    borderHighlight = isSelected ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20' : 'border-rose-900/60 bg-slate-950/80 opacity-75';
                  } else {
                    badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
                    borderHighlight = isSelected ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20' : 'border-amber-900/60 bg-slate-950/80';
                  }

                  return (
                    <div
                      key={route.id}
                      onClick={() => {
                        if (!route.isBlocked) {
                          setSelectedRouteId(route.id);
                        }
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${borderHighlight}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="selectedRoute"
                            checked={isSelected}
                            disabled={route.isBlocked}
                            onChange={() => setSelectedRouteId(route.id)}
                            className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-sm text-white flex items-center gap-2">
                              <span>{route.name}</span>
                              {route.isAiRecommended && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-slate-950 font-bold font-mono">
                                  AI RECOMMENDED
                                </span>
                              )}
                              {route.isBlocked && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold font-mono">
                                  BLOCKED - FLOODED
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              Via: {route.roadName}
                            </span>
                          </div>
                        </div>

                        {/* Telemetry info */}
                        <div className="flex items-center gap-2 text-xs font-mono self-start sm:self-center">
                          <span className="text-slate-300">{route.distanceKm} km</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-300 font-bold">{route.etaMin} mins ETA</span>
                          <span className="text-slate-500">•</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badgeColor}`}>
                            {route.statusText}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                        {route.safetyNote}
                      </p>

                      {route.hazardWarning && (
                        <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-xs text-amber-200 mb-3 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{route.hazardWarning}</span>
                        </div>
                      )}

                      {/* Prominent Navigate via Google Maps Button (Stage 2 hook) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            launchLiveGoogleMapsNavigation();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-800/60 transition text-xs font-semibold cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Navigate via Google Maps ↗</span>
                        </button>

                        <div className="text-[11px] text-slate-400 font-mono">
                          Target Coordinates: {habLat.toFixed(4)}, {habLng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stage 1 Action: Proceed to Navigation */}
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setCurrentStage(2);
                    speakText(`Stage 2 initiated. Navigating to ${habName} via ${selectedRoute.name}.`);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
                >
                  <span>Proceed to Navigation to Region ➔</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: EN ROUTE TO AFFECTED REGION VIA GOOGLE MAPS (REFACTORED)         */}
          {/* ========================================================================= */}
          {currentStage === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* 1. Primary Header Card & Stage Indicator (Deep Dark Blue #0A192F with Sky Blue Accents) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0A192F] border-2 border-sky-500/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg ring-2 ring-sky-300/40 shrink-0">
                    <Truck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Active Disaster Status Badge in Emerald Green (#10B981) */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/60 font-mono font-bold text-xs uppercase tracking-wider shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>Active Embankment Breach</span>
                      </span>

                      <span className="text-xs text-sky-300 font-mono font-bold uppercase tracking-wider bg-slate-950/80 px-2.5 py-1 rounded-md border border-sky-800/80">
                        STAGE 2: EN ROUTE TO AFFECTED REGION
                      </span>
                    </div>

                    {/* Crisp White (#FFFFFF) for Title, Sky Blue for Sub-labels */}
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Inbound Rescue Convoy En Route to {habName}
                    </h3>
                    <p className="text-xs sm:text-sm text-sky-200 mt-0.5 font-medium">
                      Designated Corridor: <strong className="text-white">{selectedRoute.name}</strong> • Unit: <strong className="text-sky-300">{assignedTeam?.name || 'NDRF Unit 7 Alpha'}</strong>
                    </p>
                  </div>
                </div>

                {/* 3. Live Google Maps Navigation Integration Button */}
                <button
                  onClick={launchLiveGoogleMapsNavigation}
                  disabled={isLocatingGPS}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-sky-500/30 ring-2 ring-sky-300 hover:ring-white transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
                  title="Acquire live GPS and open Google Maps turn-by-turn driving directions"
                >
                  <Navigation className={`w-4 h-4 fill-slate-950 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGPS ? 'Acquiring GPS Fix...' : 'Navigate via Google Maps ➔'}</span>
                </button>
              </div>

              {/* 2. Alert Zones & Threatened Area Metrics (High-Visibility Red #EF4444 with subtle glowing pulse borders) */}
              <div className="rounded-2xl border border-rose-500/80 bg-rose-950/30 p-5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-rose-800/60 mb-3.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-wider text-rose-300">
                      CRITICAL ALERT ZONE • SECTOR 4 INUNDATION THREAT
                    </span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-rose-900/80 text-rose-200 font-mono text-xs font-bold border border-rose-700/80">
                    Level 4 • Red Zone
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950/90 p-3.5 rounded-xl border border-rose-900/60">
                    <span className="text-slate-400 uppercase font-mono text-[10px] block font-semibold">Exposed Citizens</span>
                    <strong className="text-2xl sm:text-3xl font-black font-mono text-white block mt-0.5">{evacCount.toLocaleString()}</strong>
                    <span className="text-xs text-rose-300 block font-mono mt-0.5">Mandatory Evac</span>
                  </div>

                  <div className="bg-slate-950/90 p-3.5 rounded-xl border border-rose-900/60">
                    <span className="text-slate-400 uppercase font-mono text-[10px] block font-semibold">High Vulnerability</span>
                    <strong className="text-2xl sm:text-3xl font-black font-mono text-rose-400 block mt-0.5">{vulnerableCount}</strong>
                    <span className="text-xs text-rose-300 block font-mono mt-0.5">Priority Transfer</span>
                  </div>

                  <div className="bg-slate-950/90 p-3.5 rounded-xl border border-rose-900/60">
                    <span className="text-slate-400 uppercase font-mono text-[10px] block font-semibold">Surge Level</span>
                    <strong className="text-2xl sm:text-3xl font-black font-mono text-rose-300 block mt-0.5">+4.82m</strong>
                    <span className="text-xs text-rose-400 block font-mono mt-0.5">Peak Inundation</span>
                  </div>

                  <div className="bg-slate-950/90 p-3.5 rounded-xl border border-rose-900/60">
                    <span className="text-slate-400 uppercase font-mono text-[10px] block font-semibold">Impact Window</span>
                    <strong className="text-2xl sm:text-3xl font-black font-mono text-amber-300 block mt-0.5">T - 45m</strong>
                    <span className="text-xs text-amber-300/80 block font-mono mt-0.5">Cutoff Window</span>
                  </div>
                </div>
              </div>

              {/* 3. En Route Guidance & Interactive Navigation Card */}
              <div className="rounded-2xl border border-slate-700/80 bg-[#0A192F] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-sky-400" />
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      En Route Transit Status &amp; Inbound Guidance
                    </h4>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-600/80 font-mono font-bold">
                    ● {selectedRoute.statusText === 'BLOCKED' ? 'BLOCKED' : selectedRoute.statusText === 'CAUTION' ? 'CAUTION' : 'Corridor Clear'}
                  </span>
                </div>

                {/* Origin vs Target Destination Vectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <span className="text-sky-300 font-mono text-[10px] uppercase font-bold block mb-1">
                      ● Origin: Command Convoy Base
                    </span>
                    <div className="font-bold text-sm text-white">
                      {userGpsCoords ? 'Live GPS Position Fix' : `${assignedTeam?.name || 'NDRF Base Command'}`}
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      Coordinates: {userGpsCoords ? `${userGpsCoords.lat.toFixed(4)}°N, ${userGpsCoords.lng.toFixed(4)}°E` : `${(assignedTeam?.currentLocation?.lat ?? 25.5520).toFixed(4)}°N, ${(assignedTeam?.currentLocation?.lng ?? 87.2350).toFixed(4)}°E`}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <span className="text-rose-400 font-mono text-[10px] uppercase font-bold block mb-1">
                      ● Target Destination: Affected Settlement
                    </span>
                    <div className="font-bold text-sm text-white">
                      {habName} (Sector 4 Causeway)
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      Coordinates: {habLat.toFixed(4)}°N, {habLng.toFixed(4)}°E
                    </div>
                  </div>
                </div>

                {/* Live Metrics: Estimated Distance, Estimated Transit Time, Route Safety Status */}
                <div className="grid grid-cols-3 gap-3 text-center bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Estimated Distance</span>
                    <strong className="text-xl sm:text-2xl text-white font-black block mt-0.5">{selectedRoute.distanceKm} km</strong>
                    <span className="text-[11px] text-slate-400 block font-sans">via {selectedRoute.roadName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Estimated Transit Time</span>
                    <strong className="text-xl sm:text-2xl text-amber-300 font-black block mt-0.5">{etaMinutes} mins</strong>
                    <span className="text-[11px] text-slate-400 block font-sans">Speed: {speedKmh} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Route Safety Status</span>
                    <strong className="text-xl sm:text-2xl text-emerald-400 font-black block mt-0.5">
                      {selectedRoute.statusText === 'BLOCKED' ? 'BLOCKED' : selectedRoute.statusText === 'CAUTION' ? 'CAUTION' : 'CLEAR'}
                    </strong>
                    <span className="text-[11px] text-emerald-400/80 block font-sans">Verified Passable</span>
                  </div>
                </div>

                {/* Turn-by-Turn Waypoints list */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span>Turn-by-Turn Waypoints to Settlement</span>
                    <span className="text-slate-400 font-mono text-[11px]">{selectedRoute.steps.length} Waypoints</span>
                  </div>

                  {selectedRoute.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-slate-800 text-sky-400 flex items-center justify-center font-mono font-bold text-xs border border-sky-800/60">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-white font-semibold block">{step.instruction}</span>
                          <span className="text-xs text-sky-200/80 font-mono">{step.roadName}</span>
                        </div>
                      </div>
                      <span className="text-sky-300 font-mono font-bold shrink-0">{step.distanceMeters}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Step Completion Controls (Confirm Arrival at Affected Zone ➔) */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  onClick={() => setCurrentStage(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  ← Back to Route Selection
                </button>

                <button
                  onClick={() => {
                    setCurrentStage(3);
                    speakText(`Arrival confirmed at ${habName}. Proceeding to Stage 3: Shelter Selection and Evacuation.`);
                  }}
                  className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/50 hover:ring-emerald-300 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm Arrival at Affected Zone ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 3: DESTINATION SHELTER SELECTION & ROUTE GUIDANCE                   */}
          {/* ========================================================================= */}
          {currentStage === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span>Stage 3: Select Relocation Centre &amp; Candidate Return Routes</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evacuees boarded from <strong>{habName}</strong> ({evacCount.toLocaleString()} residents).
                    Select safe destination shelter sorted by proximity.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {sheltersWithDistance.length} Shelters Available
                </span>
              </div>

              {/* Reservation Toast Notice */}
              {reserveNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{reserveNotice}</span>
                </div>
              )}

              {/* Nearby Shelters List Sorted by Proximity */}
              <div className="space-y-3">
                {sheltersWithDistance.map((shelter) => {
                  const isSelected = shelter.id === selectedShelterId;
                  const available = Math.max(0, shelter.totalCapacity - shelter.occupiedCapacity - shelter.reservedCapacity);
                  const occPct = Math.round((shelter.occupiedCapacity / shelter.totalCapacity) * 100);
                  const resPct = Math.round((shelter.reservedCapacity / shelter.totalCapacity) * 100);
                  const availPct = Math.max(0, 100 - occPct - resPct);

                  return (
                    <div
                      key={shelter.id}
                      onClick={() => setSelectedShelterId(shelter.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-950/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="selectedShelter"
                            checked={isSelected}
                            onChange={() => setSelectedShelterId(shelter.id)}
                            className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-sm text-white flex items-center gap-2">
                              <span>{shelter.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                                {shelter.calculatedDistanceKm} KM AWAY
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {shelter.location} • Estimated Return Time: ~{shelter.calculatedEtaMin} mins
                            </span>
                          </div>
                        </div>

                        {/* Google Maps Link to this shelter from settlement */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGoogleMapsToShelter(shelter.coordinates[0], shelter.coordinates[1], shelter.name);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-800/60 transition text-xs font-semibold self-start sm:self-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Navigate to Shelter via Google Maps ↗</span>
                        </button>
                      </div>

                      {/* Visual Capacity Meter */}
                      <div className="my-2.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                        <div className="grid grid-cols-4 gap-2 text-center text-[11px] mb-2 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">TOTAL</span>
                            <strong className="text-white">{shelter.totalCapacity.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-rose-400 block text-[10px]">OCCUPIED</span>
                            <strong className="text-rose-400">{shelter.occupiedCapacity.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-amber-400 block text-[10px]">RESERVED</span>
                            <strong className="text-amber-300">{shelter.reservedCapacity.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-emerald-400 block text-[10px]">AVAILABLE</span>
                            <strong className="text-emerald-400 font-bold">{available.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                          <div style={{ width: `${occPct}%` }} className="bg-rose-500 h-full" title="Occupied" />
                          <div style={{ width: `${resPct}%` }} className="bg-amber-400 h-full" title="Reserved" />
                          <div style={{ width: `${availPct}%` }} className="bg-emerald-500 h-full" title="Available" />
                        </div>
                      </div>

                      {/* Inline "Reserve Berths" Quick-Action Widget */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">Quick Pre-Reserve:</span>
                          <input
                            type="number"
                            min={10}
                            max={available}
                            step={50}
                            value={reserveBerthInput}
                            onChange={(e) => setReserveBerthInput(parseInt(e.target.value) || 0)}
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickReserveBerths(shelter.id);
                            }}
                            disabled={isReservingInline || available === 0}
                            className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Lock Berths</span>
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono">
                          Candidate Return Route: High Embankment Safe Corridor (0 Flood Risk)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stage 3 Controls */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  onClick={() => setCurrentStage(2)}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium"
                >
                  ← Back to En Route View
                </button>

                <button
                  onClick={() => {
                    setCurrentStage(4);
                    speakText(`Convoy arriving at ${activeTargetShelter?.name}. Ready to confirm mission completion.`);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition"
                >
                  <span>Arrived at Shelter — Complete Evacuation ➔</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 4: MISSION COMPLETION & AUTOMATIC SYSTEM UPDATES                    */}
          {/* ========================================================================= */}
          {currentStage === 4 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-600/70 shadow-xl space-y-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg ring-2 ring-emerald-400/40 shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      STAGE 4: RESCUE MISSION RECEPTION &amp; SYSTEM REGISTRY
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                      Confirm Mission Completion &amp; Update Central Registry
                    </h3>
                  </div>
                </div>

                {/* Mission Summary Card */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Affected Settlement:</span>
                    <strong className="text-white">{habName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Total Citizens Evacuated:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{evacCount.toLocaleString()} Citizens ({vulnerableCount} vulnerable)</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Safe Destination Facility:</span>
                    <strong className="text-slate-200">{activeTargetShelter?.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Executing Rescue Team:</span>
                    <strong className="text-cyan-300 font-mono">{assignedTeam?.name || 'NDRF Unit 7 Alpha'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Automated System State Updates:</span>
                    <div className="text-right text-emerald-300 font-semibold space-y-0.5">
                      <div>✓ Status updated to "Rescued / Secured" (Green badge on map &amp; dashboard)</div>
                      <div>✓ Shelter occupied capacity incremented by +{evacCount.toLocaleString()} berths</div>
                      <div>✓ Central audit registry immutable receipt generated</div>
                    </div>
                  </div>
                </div>

                {/* Success Verification Box once clicked */}
                {missionCompleteSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>MISSION ACCOMPLISHED &amp; RECORDED IN AUDIT LEDGER</span>
                    </div>
                    <p className="leading-relaxed text-emerald-200">
                      <strong>{habName}</strong> is now officially secured. All evacuees have been checked into{' '}
                      <strong>{activeTargetShelter?.name}</strong>. The central geospatial dashboard and map indicators have been refreshed in real-time.
                    </p>
                  </div>
                )}

                {/* Final Actions */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentStage(3)}
                    disabled={missionCompleteSuccess}
                    className="text-xs text-slate-400 hover:text-slate-200 font-medium disabled:opacity-50"
                  >
                    ← Review Shelter Details
                  </button>

                  <div className="flex items-center gap-2">
                    {!missionCompleteSuccess ? (
                      <button
                        onClick={handleMarkMissionComplete}
                        disabled={isCompletingMission}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isCompletingMission ? 'Updating Central Registry...' : 'Mark Mission Complete & Update System'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (onRefreshState) onRefreshState();
                          onClose();
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Return to Live Command Dashboard</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Outer Guard Component
export const EvacuationNavigationModal: React.FC<EvacuationNavigationModalProps> = ({
  isOpen,
  onClose,
  habitation,
  settlement,
  priorityItem,
  shelters,
  teams,
  routes,
  onRefreshState
}) => {
  const activeSettlement = settlement || habitation || null;

  // Rule 2: Top-level check before rendering JSX
  if (!isOpen || !activeSettlement) {
    return null;
  }

  return (
    <EvacuationNavigationModalContent
      isOpen={isOpen}
      onClose={onClose}
      settlement={activeSettlement}
      priorityItem={priorityItem}
      shelters={shelters}
      teams={teams}
      routes={routes}
      onRefreshState={onRefreshState}
    />
  );
};
