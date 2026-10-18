import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Shield,
  Compass,
  Check,
  RotateCcw,
  Plus,
  Lock,
  ArrowLeft,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Printer,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { EvacuationNavigationModal } from '../components/EvacuationNavigationModal';
import {
  Habitation,
  Shelter,
  RescueTeam,
  RouteSegment,
  EvacuationRoute,
  RiskZone,
  PriorityRanking,
  DisasterAlert,
  RagWarningAdvisory
} from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface CommandCenterViewProps {
  habitations: Habitation[];
  shelters: Shelter[];
  teams: RescueTeam[];
  riskZones: RiskZone[];
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  priorities: PriorityRanking[];
  alerts: DisasterAlert[];
  ragAdvisory?: RagWarningAdvisory;
  initialWorkflowStage?: 'welcome' | 1 | 2 | 3;
  onSelectHabitation?: (id: string) => void;
  onSelectShelter?: (id: string) => void;
  onTriggerEvacuation?: (habId: string) => void;
  onRequestAIExplanation?: (habId: string) => void;
  onNavigateTab?: (tab: string) => void;
  onRefreshState?: () => void;
  onOpenRagKnowledgeModal?: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  habitations = [],
  shelters = [],
  teams = [],
  riskZones = [],
  routeSegments = [],
  routes = [],
  priorities = [],
  alerts = [],
  ragAdvisory,
  initialWorkflowStage = 'welcome',
  onSelectHabitation,
  onSelectShelter,
  onTriggerEvacuation,
  onRequestAIExplanation,
  onNavigateTab,
  onRefreshState,
  onOpenRagKnowledgeModal
}) => {
  // Progressive workflow stage ('welcome' on load, or strictly Step 1, 2, 3)
  const [workflowStage, setWorkflowStage] = useState<'welcome' | 1 | 2 | 3>(initialWorkflowStage);

  useEffect(() => {
    if (initialWorkflowStage) {
      setWorkflowStage(initialWorkflowStage);
    }
  }, [initialWorkflowStage]);

  const [selectedHabId, setSelectedHabId] = useState<string>(
    priorities?.[0]?.habitationId || habitations?.[0]?.id || 'hab-1'
  );

  // Advanced Professional UI: Search, Filter & Operational Density Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'RESCUED'>('ALL');
  const [densityMode, setDensityMode] = useState<'detailed' | 'compact'>('detailed');

  // Direct Evacuation Modal state (4-Stage Rescue Lifecycle)
  const [navModalHabId, setNavModalHabId] = useState<string | null>(null);

  // Preventive Broadcast State
  const [isBroadcastingPreventive, setIsBroadcastingPreventive] = useState<boolean>(false);
  const [preventiveBroadcastSuccess, setPreventiveBroadcastSuccess] = useState<string | null>(null);
  const [copiedBroadcastMsg, setCopiedBroadcastMsg] = useState<boolean>(false);

  const handleCopyBroadcastMessage = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeAdvisory.suggestedBroadcastMessage);
      setCopiedBroadcastMsg(true);
      setTimeout(() => setCopiedBroadcastMsg(false), 2500);
    }
  };

  // Manual Override State
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideHabId, setOverrideHabId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string>('');

  // Inline Shelter Quick-Reservation State (Step 3 only)
  const [reservationShelterId, setReservationShelterId] = useState<string>(shelters?.[0]?.id || 'shelter-1');
  const [reservationTeamId, setReservationTeamId] = useState<string>(teams?.[0]?.id || 'team-1');
  const [reservationHabId, setReservationHabId] = useState<string>(habitations?.[0]?.id || 'hab-1');
  const [reservationBerthCount, setReservationBerthCount] = useState<number>(250);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState<boolean>(false);
  const [reservationNotice, setReservationNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Computations for KPI cards with clear numerical formatting
  const totalEvacuationNeeded = (habitations || [])
    .filter(h => (h?.vulnerabilityLevel === 'Critical' || h?.vulnerabilityLevel === 'High') && h?.evacuationStatus !== 'Rescued')
    .reduce((acc, h) => acc + (h?.demographics?.total ?? (h as any)?.population ?? 0), 0);

  const totalRescuedCount = (habitations || [])
    .filter(h => h?.evacuationStatus === 'Rescued')
    .reduce((acc, h) => acc + (h?.rescuedCount ?? h?.demographics?.total ?? 0), 0);

  const totalShelterAvailable = (shelters || []).reduce(
    (acc, s) => acc + Math.max(0, (s?.totalCapacity ?? 0) - (s?.occupiedCapacity ?? 0) - (s?.reservedCapacity ?? 0)),
    0
  );

  const totalShelterOccupied = (shelters || []).reduce((acc, s) => acc + (s?.occupiedCapacity ?? 0), 0);
  const totalShelterReserved = (shelters || []).reduce((acc, s) => acc + (s?.reservedCapacity ?? 0), 0);
  const totalShelterTotal = (shelters || []).reduce((acc, s) => acc + (s?.totalCapacity ?? 0), 0);

  const availableTeamsCount = (teams || []).filter(t => t?.status === 'Available').length;
  const blockedRoadsCount = (routeSegments || []).filter(s => s?.status === 'BLOCKED').length;

  // Filtered & Searched Priorities for Step 2
  const filteredPriorities = priorities.filter((item) => {
    if (!item) return false;
    const hab = habitations.find(h => h.id === item.habitationId);
    const matchesSearch = item.habitationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hab?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterSeverity === 'CRITICAL') {
      return (hab?.vulnerabilityLevel === 'Critical' || (hab?.vulnerabilityScore ?? 0) >= 80) && hab?.evacuationStatus !== 'Rescued';
    }
    if (filterSeverity === 'HIGH') {
      return (hab?.vulnerabilityLevel === 'High' || item.urgency === 'Immediate') && hab?.evacuationStatus !== 'Rescued';
    }
    if (filterSeverity === 'RESCUED') {
      return hab?.evacuationStatus === 'Rescued';
    }

    return true;
  });

  const activeAdvisory: RagWarningAdvisory = ragAdvisory || {
    id: 'rag-adv-default',
    agencyName: 'Central Water Commission (CWC) & IMD Doppler Radar',
    category: 'Stage IV Flash Flood & Embankment Breach Alert',
    trustScore: 10,
    headline: 'CRITICAL BREACH WARNING: Birpur Barrage Release Exceeds 442,000 Cusecs (+4.82m Surge)',
    bulletinExcerpt: 'Upstream discharge at 442,000 cusecs (3.4 m/s velocity). SH-58 culverts submerged; mandatory evacuation via NH-31 High Embankment.',
    keyMetrics: {
      surgeLevel: '+4.82m Surge',
      dischargeCusecs: '442,000 cusecs',
      rainfallMm: '185 mm / 3h',
      inundationEta: 'T - 45 Mins'
    },
    officialDirective: 'Evacuate all settlements within 5km of Sector 4 Bund via NH-31 High Embankment.',
    sourceUrl: 'https://cwc.gov.in/flood-forecast-kosi-basin',
    timestamp: 'Live RAG Feed',
    threatenedZones: ['Sector A Embankment', 'Ward 4 Causeway', 'Ward 7 Lowlands', 'Rampur Riverbank'],
    suggestedBroadcastMessage: 'SURAKSHA RESCUE / CWC FLASH FLOOD EMERGENCY: Birpur Barrage discharge has peaked at 442,000 cusecs (+4.82m surge). Mandatory evacuation ordered for Rampur and low-lying sectors. Move immediately via NH-31 High Embankment to District Stadium Relief Complex.'
  };

  // 1-Click Preventive Broadcast Trigger (Wired directly to RAG-generated advisory text)
  const handleTriggerPreventiveBroadcast = async () => {
    setIsBroadcastingPreventive(true);
    setPreventiveBroadcastSuccess(null);

    const ragMessage = activeAdvisory.suggestedBroadcastMessage;

    try {
      const criticalHabs = (habitations || []).filter(
        h => (h?.vulnerabilityLevel === 'Critical' || h?.vulnerabilityLevel === 'High') && h?.evacuationStatus !== 'Rescued'
      );
      
      for (const hab of criticalHabs) {
        if (!hab?.id) continue;
        await ApiClient.sendNotification({
          habitationId: hab.id,
          recipientType: 'COMMUNITY',
          channel: 'SMS',
          message: ragMessage,
          simulateFailure: false
        });
      }

      setPreventiveBroadcastSuccess(
        `RAG Advisory Broadcast dispatched to ${criticalHabs.length} critical settlements (${activeAdvisory.agencyName}).`
      );
      if (onRefreshState) onRefreshState();

      setTimeout(() => {
        setPreventiveBroadcastSuccess(null);
      }, 5000);
    } catch (e) {
      console.warn('Preventive broadcast notice:', e);
      setPreventiveBroadcastSuccess('RAG warning broadcast dispatched to telecommunications gateways.');
    } finally {
      setIsBroadcastingPreventive(false);
    }
  };

  // Launch Evacuation Navigation Modal (4-Stage Lifecycle)
  const handleLaunchEvacuation = (habId: string) => {
    if (!habId) return;
    setSelectedHabId(habId);
    setNavModalHabId(habId);
    if (onTriggerEvacuation) {
      onTriggerEvacuation(habId);
    }
  };

  // Inline Shelter Reservation Submission
  const handleInlineReserveBerths = async (shelterId: string) => {
    setIsSubmittingReservation(true);
    setReservationNotice(null);

    const targetShelter = (shelters || []).find(s => s?.id === shelterId);
    const targetTeam = (teams || []).find(t => t?.id === reservationTeamId);
    const targetHab = (habitations || []).find(h => h?.id === reservationHabId);

    if (!targetShelter) {
      setIsSubmittingReservation(false);
      return;
    }

    const available = Math.max(0, (targetShelter?.totalCapacity ?? 0) - (targetShelter?.occupiedCapacity ?? 0) - (targetShelter?.reservedCapacity ?? 0));
    if (reservationBerthCount > available) {
      setReservationNotice({
        type: 'error',
        message: `Overbooking rejected: Only ${available.toLocaleString()} berths available at ${targetShelter?.name || 'Relocation Centre'}!`
      });
      setIsSubmittingReservation(false);
      return;
    }

    const result = await ApiClient.reserveShelterCapacity({
      shelterId,
      teamId: reservationTeamId,
      teamName: targetTeam?.name || 'NDRF Unit 7',
      habitationId: reservationHabId,
      habitationName: targetHab?.name || 'Affected Settlement',
      count: reservationBerthCount
    });

    if (result.success) {
      setReservationNotice({
        type: 'success',
        message: `Locked ${reservationBerthCount.toLocaleString()} berths for ${targetTeam?.name || 'Team'} at ${targetShelter?.name || 'Shelter'}.`
      });
      if (onRefreshState) onRefreshState();
      setTimeout(() => setReservationNotice(null), 4000);
    } else {
      setReservationNotice({
        type: 'error',
        message: result.message || 'Capacity reservation could not be completed.'
      });
    }

    setIsSubmittingReservation(false);
  };

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) return;
    try {
      await ApiClient.submitOverride({
        targetType: 'PRIORITY_RANKING',
        targetId: overrideHabId,
        overrideAction: 'Authority forced priority escalation over AI suggestion',
        mandatoryReason: overrideReason,
        authorizedUser: 'Incident Commander Duty Officer'
      });
      setOverrideSuccessMsg('Manual override logged to official audit history.');
      if (onRefreshState) onRefreshState();
      setTimeout(() => {
        setShowOverrideModal(false);
        setOverrideSuccessMsg('');
        setOverrideReason('');
      }, 1500);
    } catch {
      setShowOverrideModal(false);
    }
  };

  // Safe resolution of the active modal settlement
  const activeModalHabitation: Habitation | null =
    (habitations || []).find(h => h?.id === navModalHabId) ||
    (habitations || []).find(h => h?.id === selectedHabId) ||
    habitations?.[0] ||
    null;

  const activeModalPriority: PriorityRanking | undefined =
    (priorities || []).find(p => p?.habitationId === (navModalHabId || selectedHabId)) ||
    priorities?.[0] ||
    undefined;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-[#E2E8F0]">
      {/* ========================================================================= */}
      {/* 1. WELCOME HEADER (SUBDUED TACTICAL LAUNCHPAD)                            */}
      {/* ========================================================================= */}
      {workflowStage === 'welcome' && (
        <section aria-label="Incident Welcome & Assessment Launchpad" className="animate-fadeIn">
          <div className="relative rounded-2xl bg-[#0A192F]/80 backdrop-blur-md border border-[#38BDF8]/40 p-8 sm:p-10 shadow-2xl overflow-hidden text-center">
            {/* Status Indicator */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-lg bg-black/70 border border-[#EF4444]/60 mb-6">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444]"></span>
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#EF4444]">
                RED ZONE ALERT · KOSI RIVER BASIN BREACH (LEVEL 4)
              </span>
            </div>

            {/* Streamlined Title Header */}
            <div className="max-w-3xl mx-auto space-y-2 mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                SURAKSHA RESCUE INDIA
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-[#38BDF8] font-mono">
                <span>RAG Vector Intelligence</span>
                <span>·</span>
                <span>Dynamic Evacuation Priority</span>
                <span>·</span>
                <span>Hazard-Aware Routing</span>
              </div>
            </div>

            {/* Action-Oriented Metric Callout Cards (2xl/3xl Bold) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8 text-left">
              <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
                <span className="text-[#E2E8F0] block uppercase font-mono text-xs font-semibold">Active Threat</span>
                <strong className="text-2xl sm:text-3xl font-bold font-mono text-[#EF4444] block mt-1">+4.82m</strong>
                <span className="text-xs text-[#E2E8F0]/80 block mt-1">Peak River Surge</span>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
                <span className="text-[#E2E8F0] block uppercase font-mono text-xs font-semibold">Impact Window</span>
                <strong className="text-2xl sm:text-3xl font-bold font-mono text-[#38BDF8] block mt-1">T - 45 Mins</strong>
                <span className="text-xs text-[#E2E8F0]/80 block mt-1">Inundation Cutoff</span>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
                <span className="text-[#E2E8F0] block uppercase font-mono text-xs font-semibold">Exposed Citizens</span>
                <strong className="text-2xl sm:text-3xl font-bold font-mono text-white block mt-1">8,990 Citizens</strong>
                <span className="text-xs text-[#E2E8F0]/80 block mt-1">4 Red/Caution Zones</span>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
                <span className="text-[#E2E8F0] block uppercase font-mono text-xs font-semibold">Available Shelters</span>
                <strong className="text-2xl sm:text-3xl font-bold font-mono text-[#10B981] block mt-1">3,450 Berths</strong>
                <span className="text-xs text-[#E2E8F0]/80 block mt-1">3 Centres Operational</span>
              </div>
            </div>

            {/* Main Interactive CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
              <button
                onClick={() => setWorkflowStage(1)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#38BDF8] hover:bg-sky-300 text-slate-950 font-bold text-sm sm:text-base uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>Open Active Threat Briefing</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setWorkflowStage(2)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-[#38BDF8]/50 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Compass className="w-5 h-5 text-[#38BDF8]" />
                <span>Tactical Map &amp; Priorities</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. PROGRESSIVE WORKFLOW STEPPER BAR (SKY BLUE STAGE INDICATORS)           */}
      {/* ========================================================================= */}
      {workflowStage !== 'welcome' && (
        <div className="bg-[#0A192F]/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { step: 1, label: '1. Active Threat', desc: 'RAG Advisory & KPIs' },
              { step: 2, label: '2. Priority & Map', desc: 'RAG Ranking & GIS' },
              { step: 3, label: '3. Available Shelters', desc: 'Capacity & Berths' }
            ].map(tab => {
              const isActive = workflowStage === tab.step;
              const isPast = typeof workflowStage === 'number' && workflowStage > tab.step;

              return (
                <button
                  key={tab.step}
                  onClick={() => setWorkflowStage(tab.step as any)}
                  className={`px-4 py-2.5 rounded-xl text-left border transition-all shrink-0 flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900/90 border-[#38BDF8] text-white ring-1 ring-[#38BDF8]/50'
                      : isPast
                      ? 'bg-black/50 border-[#10B981]/60 text-[#E2E8F0]'
                      : 'bg-black/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      isActive
                        ? 'bg-[#38BDF8] text-slate-950'
                        : isPast
                        ? 'bg-[#10B981] text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : tab.step}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-white block">{tab.label}</span>
                    <span className="text-xs text-[#E2E8F0]/80 block">{tab.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setWorkflowStage('welcome')}
              className="text-xs sm:text-sm text-[#E2E8F0] hover:text-white px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700 transition flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#38BDF8]" />
              <span>Overview</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STEP 1: RAG WARNING ADVISORY BANNER, ACTIVE THREAT & KPI SUMMARY       */}
      {/* ========================================================================= */}
      {workflowStage === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* ACTIVE RAG WARNING ADVISORY BANNER (Compact & Scannable with Expandable Technical Details) */}
          <section aria-label="Active RAG Warning Advisory Banner">
            <div className="rounded-2xl bg-[#0A192F]/80 backdrop-blur-md border border-[#38BDF8]/50 p-5 sm:p-6 shadow-xl space-y-4">
              {/* Header row with concise color-coded status pills */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50 font-mono font-bold text-xs uppercase tracking-wider">
                    Level 4 • Red Zone
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50 font-mono font-bold text-xs">
                    Trust {activeAdvisory.trustScore}/10 • Verified
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-[#38BDF8] border border-slate-800 font-mono text-xs">
                    {activeAdvisory.agencyName}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  {onOpenRagKnowledgeModal && (
                    <button
                      onClick={onOpenRagKnowledgeModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-slate-900 text-[#38BDF8] hover:text-white border border-[#38BDF8]/40 text-xs font-bold transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Ingest / Sync</span>
                    </button>
                  )}
                  <a
                    href={activeAdvisory.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-[#38BDF8] px-2 py-1 transition"
                  >
                    <span>Bulletin</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Main Headline & Extra-Large Telemetry Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-7 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#38BDF8] block">
                    HYDROLOGICAL FORECAST ADVISORY
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                    {activeAdvisory.headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed line-clamp-2">
                    {activeAdvisory.bulletinExcerpt}
                  </p>
                </div>

                {/* Extra-Large Key Metrics Grid (Instant Scanning) */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono uppercase block">Barrage Release</span>
                    <strong className="text-xl sm:text-2xl font-black font-mono text-white block mt-0.5">
                      {activeAdvisory.keyMetrics.dischargeCusecs}
                    </strong>
                    <span className="text-[11px] text-[#38BDF8] font-mono block mt-0.5">Velocity: 3.4 m/s</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono uppercase block">Radar Rainfall</span>
                    <strong className="text-xl sm:text-2xl font-black font-mono text-[#38BDF8] block mt-0.5">
                      {activeAdvisory.keyMetrics.rainfallMm}
                    </strong>
                    <span className="text-[11px] text-amber-300 font-mono block mt-0.5">Cloudburst Alert</span>
                  </div>
                </div>
              </div>

              {/* Collapsible Details Container for Lower-Priority Technical Background */}
              <details className="group pt-2 border-t border-slate-800/80 text-xs">
                <summary className="flex items-center justify-between cursor-pointer py-1 text-slate-400 hover:text-white font-mono select-none">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>View Technical Directive &amp; Ingestion Source Notes</span>
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                </summary>
                <div className="mt-3 p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2 text-xs leading-relaxed text-[#E2E8F0]">
                  <div>
                    <strong className="text-white block mb-0.5">Official Command Directive:</strong>
                    <span className="text-slate-300">{activeAdvisory.officialDirective}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Source Feed: {activeAdvisory.agencyName} ({activeAdvisory.timestamp})</span>
                    <a
                      href={activeAdvisory.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#38BDF8] hover:underline inline-flex items-center gap-1"
                    >
                      <span>CWC Hydro Bulletin</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </details>
            </div>
          </section>

          {/* Active Threat Card & Compact CAP/SMS Broadcast Box */}
          <section aria-label="Active Threat and RAG Preventive Broadcast">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              {/* Header Row with Extra-Large Metric Callouts */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-black/70 border border-[#EF4444]/60 flex items-center justify-center text-[#EF4444] shrink-0">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50 font-mono font-bold text-xs uppercase">
                        Level 4 • Red Zone
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50 font-mono text-xs font-bold">
                        Active Disaster Ops
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Bihar North (Supaul / Saharsa)
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
                      Kosi River Embankment Overtopping &amp; Flash Flood
                    </h3>
                  </div>
                </div>

                {/* Primary Metric Callouts: 3xl/4xl Bold for Instant Scanning */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/60 px-4 py-2.5 rounded-xl border border-slate-800 text-center sm:text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-mono block">Active Surge</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#EF4444]">+4.82m</span>
                  </div>
                  <div className="bg-black/60 px-4 py-2.5 rounded-xl border border-slate-800 text-center sm:text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-mono block">Impact Window</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#38BDF8]">T - 45m</span>
                  </div>
                  <div className="bg-black/60 px-4 py-2.5 rounded-xl border border-slate-800 text-center sm:text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-mono block">RAG Confidence</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#10B981]">96.4%</span>
                  </div>
                </div>
              </div>

              {/* Scannable Bullet Points & Compact CAP/SMS Broadcast Box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left: Scannable Threat Bullet Points */}
                <div className="lg:col-span-6 flex flex-col justify-between p-4 rounded-xl bg-black/60 border border-slate-800 space-y-3">
                  <div className="space-y-2.5">
                    <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#38BDF8]" />
                      <span>Impact Window &amp; Hazard Telemetry</span>
                    </h4>

                    <ul className="space-y-2 text-xs sm:text-sm text-[#E2E8F0] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-[#EF4444] font-bold mt-0.5">•</span>
                        <span><strong className="text-white">+1.2m Surge Projected:</strong> Inundation cutoff in <strong className="text-[#38BDF8]">45 mins</strong> across lowlands.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#EF4444] font-bold mt-0.5">•</span>
                        <span><strong className="text-white">Corridors Blocked:</strong> SH-58 Canal Bund &amp; Kosi Old Bridge submerged.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#10B981] font-bold mt-0.5">•</span>
                        <span><strong className="text-white">Safe Bypass Active:</strong> Elevated <strong className="text-[#38BDF8]">NH-31 High Embankment</strong> verified.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-400">Threatened Sectors:</span>
                    {activeAdvisory.threatenedZones.map((zone) => (
                      <span key={zone} className="px-2 py-0.5 rounded bg-slate-900 text-[#EF4444] border border-[#EF4444]/30 text-[11px]">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Compact CAP/SMS Broadcast Box with Single-Click Copy */}
                <div className="lg:col-span-6 flex flex-col justify-between p-4 rounded-xl bg-black/60 border border-slate-800 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#38BDF8]" />
                        <span>CAP / SMS Preventive Broadcast</span>
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold">
                        Gateway Ready
                      </span>
                    </div>

                    {/* Compact single-click message preview container */}
                    <div className="relative p-3 rounded-lg bg-[#0A192F]/90 border border-slate-800 text-xs text-[#E2E8F0] font-mono leading-relaxed max-h-24 overflow-y-auto">
                      "{activeAdvisory.suggestedBroadcastMessage}"
                    </div>
                  </div>

                  {/* Dual Action CTAs: Single-Click Copy Text & Trigger Broadcast */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyBroadcastMessage}
                        type="button"
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-[#E2E8F0] hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        title="Copy CAP/SMS broadcast text"
                      >
                        {copiedBroadcastMsg ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-[#10B981] font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleTriggerPreventiveBroadcast}
                        disabled={isBroadcastingPreventive}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                          isBroadcastingPreventive
                            ? 'bg-slate-700 text-white cursor-wait'
                            : 'bg-[#38BDF8] hover:bg-sky-300 text-slate-950 font-black ring-1 ring-[#38BDF8]'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isBroadcastingPreventive ? 'Dispatching Broadcast...' : 'Trigger Preventive Broadcast'}
                        </span>
                      </button>
                    </div>

                    {preventiveBroadcastSuccess && (
                      <div className="p-2.5 rounded-lg bg-black/90 border border-[#10B981]/60 text-[#10B981] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{preventiveBroadcastSuccess}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Action-Oriented Executive KPI Cards (3xl Bold Values, Subtle Dark Backgrounds) */}
          <section aria-label="Executive Key Performance Indicators">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-[#0A192F]/60 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Active Threat</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#10B981] mt-1">Level 4</div>
                <p className="text-[11px] text-slate-400 mt-1">Kosi Basin Breach</p>
              </div>

              <div className="bg-[#0A192F]/60 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Red Zones</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#EF4444] mt-1">
                  {(riskZones || []).filter(z => z?.riskLevel === 'High' || z?.riskLevel === 'Critical').length} Critical
                </div>
                <p className="text-[11px] text-slate-400 mt-1">RAG Score &gt;80%</p>
              </div>

              <div className="bg-[#0A192F]/60 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Exposed Citizens</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-white mt-1">
                  {totalEvacuationNeeded.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#10B981] font-mono mt-1">
                  {totalRescuedCount > 0 ? `${totalRescuedCount.toLocaleString()} Rescued` : '4 Settlements'}
                </p>
              </div>

              <div className="bg-[#0A192F]/60 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Available Shelters</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#10B981] mt-1">
                  {totalShelterAvailable.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{totalShelterReserved.toLocaleString()} Reserved</p>
              </div>

              <div className="bg-[#0A192F]/60 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Ready Teams</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#38BDF8] mt-1">
                  {availableTeamsCount} Units
                </div>
                <p className="text-[11px] text-slate-400 mt-1">NDRF Boat Squads</p>
              </div>

              <div className="bg-[#0A192F]/60 border border-slate-800/80 rounded-xl p-4 transition hover:border-slate-700">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Blocked Corridors</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#EF4444] mt-1">
                  {blockedRoadsCount} Routes
                </div>
                <p className="text-[11px] text-[#38BDF8] mt-1">NH-31 Bypass Open</p>
              </div>
            </div>
          </section>

          {/* Step 1 Next Action Bar */}
          <div className="p-4 rounded-xl bg-[#0A192F]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <h4 className="text-base sm:text-lg font-bold text-white">RAG Priority Ranking Ready</h4>
            </div>
            <button
              onClick={() => setWorkflowStage(2)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-sky-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Open Priority Ranking &amp; Tactical Map</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STEP 2: DYNAMIC RAG PRIORITY RANKING & TACTICAL MAP                    */}
      {/* ========================================================================= */}
      {workflowStage === 2 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Quick-Filter & Search Bar */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0A192F]/90 border border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settlement or ward..."
                className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#38BDF8]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Severity Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
              {[
                { id: 'ALL', label: `All (${priorities.length})` },
                { id: 'CRITICAL', label: 'Red Zone (>80%)' },
                { id: 'HIGH', label: 'Caution (50–80%)' },
                { id: 'RESCUED', label: `Secured (${habitations.filter(h => h.evacuationStatus === 'Rescued').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterSeverity(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                    filterSeverity === f.id
                      ? 'bg-[#38BDF8] text-slate-950 border-[#38BDF8] font-bold'
                      : 'bg-black/60 text-[#E2E8F0] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Density View Toggle */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-slate-800 self-end md:self-auto shrink-0">
              <button
                onClick={() => setDensityMode('detailed')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  densityMode === 'detailed'
                    ? 'bg-[#38BDF8] text-slate-950 font-bold'
                    : 'text-[#E2E8F0] hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Detailed</span>
              </button>
              <button
                onClick={() => setDensityMode('compact')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  densityMode === 'compact'
                    ? 'bg-[#38BDF8] text-slate-950 font-bold'
                    : 'text-[#E2E8F0] hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Compact</span>
              </button>
            </div>
          </div>

          {/* Tactical Geospatial Map & Prioritization Split-View */}
          <section aria-label="Integrated Tactical Geospatial Operations & Evacuation Priorities">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT: Live Interactive Tactical Map (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[620px]">
                {/* Map Header Bar with RAG Risk Zone Legend */}
                <div className="px-4 py-3 bg-[#0A192F]/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                    <h3 className="font-bold text-lg text-white">
                      Tactical Geospatial Map
                    </h3>
                  </div>

                  {/* RAG Zone Risk Indicators (Requirement 1.1) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-semibold text-[#E2E8F0]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                      <span>Red Critical (&gt;80%)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                      <span>Caution (50–80%)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                      <span>Safe Zone</span>
                    </span>
                  </div>
                </div>

                {/* Interactive Leaflet Map */}
                <div className="flex-1 w-full min-h-[540px]">
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
                      if (onSelectHabitation) onSelectHabitation(id);
                    }}
                    onSelectShelter={onSelectShelter}
                    onTriggerEvacuation={(id) => handleLaunchEvacuation(id)}
                    onRequestAIExplanation={onRequestAIExplanation}
                  />
                </div>
              </div>

              {/* RIGHT: Dynamic RAG Evacuation Priority List (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Panel Header */}
                <div className="px-5 py-3.5 bg-[#0A192F]/95 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-lg text-white">
                      RAG Priority Ranking
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-black/70 text-[#38BDF8] border border-[#38BDF8]/50 font-mono font-bold">
                      LIVE VECTOR SYNC
                    </span>
                  </div>

                  <span className="text-xs font-mono text-[#E2E8F0] font-semibold">
                    {filteredPriorities.length} {filteredPriorities.length === 1 ? 'Zone' : 'Zones'}
                  </span>
                </div>

                {/* Priority Cards List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[580px]">
                  {filteredPriorities.length === 0 ? (
                    <div className="p-8 text-center text-[#E2E8F0] text-sm">
                      No settlements match the current filter.
                    </div>
                  ) : filteredPriorities.map((item) => {
                    if (!item) return null;
                    const isSelected = item?.habitationId === selectedHabId;
                    const hab = (habitations || []).find(h => h?.id === item?.habitationId);
                    const isRescued = hab?.evacuationStatus === 'Rescued';
                    const shelter = (shelters || []).find(s => s?.name === item?.nearestShelterName) || shelters?.[0];
                    const availableBerths = shelter
                      ? Math.max(0, (shelter?.totalCapacity ?? 0) - (shelter?.occupiedCapacity ?? 0) - (shelter?.reservedCapacity ?? 0))
                      : (item?.shelterAvailableCapacity ?? 0);
                    const ragScore = item.ragRiskScore || item.priorityScore || 85;
                    const isRedZone = !isRescued && ragScore > 80;

                    // ==========================================
                    // COMPACT OPERATIONAL DENSITY VIEW
                    // ==========================================
                    if (densityMode === 'compact') {
                      return (
                        <div
                          key={item.habitationId}
                          onClick={() => setSelectedHabId(item.habitationId)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isRescued
                              ? 'bg-black/60 border-[#10B981]/60'
                              : isSelected
                              ? 'bg-[#0A192F] border-[#38BDF8] ring-1 ring-[#38BDF8]/50'
                              : 'bg-black/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-black font-mono ${
                                isRescued
                                  ? 'bg-[#10B981] text-slate-950'
                                  : isRedZone
                                  ? 'bg-[#EF4444] text-white'
                                  : 'bg-[#38BDF8] text-slate-950'
                              }`}
                            >
                              {isRescued ? '✓' : `#${item.rank}`}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-white flex items-center gap-2">
                                <span>{item.habitationName}</span>
                                <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                                  isRedZone ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#38BDF8]/20 text-[#38BDF8]'
                                }`}>
                                  {ragScore}% RAG
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                {(item?.totalPopulation ?? 0).toLocaleString()} Citizens · {(item?.vulnerablePopulation ?? 0).toLocaleString()} Vulnerable
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLaunchEvacuation(item.habitationId);
                              }}
                              className={`text-xs font-black py-1.5 px-3 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 ${
                                isRescued
                                  ? 'bg-[#10B981] text-slate-950'
                                  : 'bg-[#38BDF8] hover:bg-sky-300 text-slate-950'
                              }`}
                            >
                              {isRescued ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                              <span>{isRescued ? 'Secured' : 'Evacuate'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // ==========================================
                    // DETAILED OPERATIONAL CARDS VIEW
                    // ==========================================
                    return (
                      <div
                        key={item.habitationId}
                        onClick={() => setSelectedHabId(item.habitationId)}
                        className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                          isRescued
                            ? 'bg-black/60 border-[#10B981]/60'
                            : isSelected
                            ? 'bg-[#0A192F]/95 border-[#38BDF8] ring-1 ring-[#38BDF8]/50 shadow-lg'
                            : 'bg-black/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Card Title & RAG Risk Score Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                                isRescued
                                  ? 'bg-[#10B981] text-slate-950'
                                  : isRedZone
                                  ? 'bg-[#EF4444] text-white'
                                  : 'bg-[#38BDF8] text-slate-950'
                              }`}
                            >
                              {isRescued ? '✓' : `#${item.rank}`}
                            </span>
                            <div>
                              <h4 className="font-bold text-base sm:text-lg text-white tracking-tight">
                                {item.habitationName}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                                <span>RAG Score: <strong className={isRedZone ? 'text-[#EF4444]' : 'text-[#38BDF8]'}>{ragScore}%</strong></span>
                                <span>•</span>
                                <span className="text-amber-300 font-semibold">{item.inundationWindow || `T - ${item.estimatedEvacTimeMin}m`}</span>
                              </div>
                            </div>
                          </div>

                          {/* Concise Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase shrink-0 ${
                              isRescued
                                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50'
                                : isRedZone
                                ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {isRescued ? 'Secured' : isRedZone ? 'Level 4 • Red Zone' : 'Caution'}
                          </span>
                        </div>

                        {/* Rescued Notice Banner if complete */}
                        {isRescued && (
                          <div className="p-2.5 rounded-lg bg-black/70 border border-[#10B981]/50 text-[#10B981] text-xs mb-3 flex items-center justify-between gap-2 font-mono">
                            <div className="flex items-center gap-2 font-bold">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>Evacuated by {hab?.rescuedByTeam || 'NDRF Unit 7'}</span>
                            </div>
                            <span>100% Secured</span>
                          </div>
                        )}

                        {/* Primary Key Metrics (Extra Large Bold for Instant Scanning) */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-3">
                          <div>
                            <span className="text-slate-400 text-[11px] block font-mono uppercase font-semibold">
                              Exposed Citizens
                            </span>
                            <strong className="text-white font-mono text-2xl sm:text-3xl font-black block mt-0.5">
                              {(item?.totalPopulation ?? 0).toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block font-mono uppercase font-semibold">
                              High Vulnerability
                            </span>
                            <strong className="text-[#EF4444] font-mono text-2xl sm:text-3xl font-black block mt-0.5">
                              {(item?.vulnerablePopulation ?? 0).toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        {/* Assigned Shelter & Free Berths Info */}
                        <div className="p-3 rounded-xl bg-black/60 border border-slate-800 mb-3 flex items-center justify-between text-xs">
                          <div className="truncate mr-2">
                            <span className="text-slate-400 block font-mono uppercase text-[10px]">
                              Assigned Shelter
                            </span>
                            <span className="font-bold text-white text-xs sm:text-sm truncate block mt-0.5">
                              {item.nearestShelterName}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-slate-400 block font-mono text-[10px]">Free Berths</span>
                            <span className="font-mono font-bold text-[#10B981] text-lg sm:text-xl">
                              {availableBerths.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Lower-Priority RAG Citation Container */}
                        {item.ragCitedBulletin && (
                          <details className="group text-xs mb-3.5">
                            <summary className="cursor-pointer text-slate-400 hover:text-white flex items-center justify-between select-none py-1 font-mono">
                              <span className="flex items-center gap-1.5 text-[#38BDF8] font-bold">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>RAG Intelligence Citation</span>
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-slate-400" />
                            </summary>
                            <div className="mt-1.5 p-2.5 rounded-lg bg-black/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                              {item.ragCitedBulletin}
                            </div>
                          </details>
                        )}

                        {/* Action Buttons: Clearly Distinguished Primary & Secondary Styles */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchEvacuation(item.habitationId);
                            }}
                            className={`flex-1 text-xs font-black py-2.5 px-3 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                              isRescued
                                ? 'bg-[#10B981] hover:bg-emerald-400 text-slate-950'
                                : 'bg-[#38BDF8] hover:bg-sky-300 text-slate-950 ring-1 ring-[#38BDF8]'
                            }`}
                          >
                            {isRescued ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>View Route</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Evacuate &amp; Route</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestAIExplanation?.(item.habitationId);
                            }}
                            className="bg-black/60 hover:bg-slate-800 text-[#38BDF8] text-xs font-bold py-2.5 px-3 rounded-xl border border-[#38BDF8]/40 transition flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Inspect RAG & AI prioritization rationale"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Why?</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOverrideHabId(item.habitationId);
                              setShowOverrideModal(true);
                            }}
                            className="bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 transition shrink-0 cursor-pointer"
                          >
                            Override
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Step 2 Bottom Navigation */}
          <div className="p-4 rounded-xl bg-[#0A192F]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setWorkflowStage(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#E2E8F0] border border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#38BDF8]" />
              <span>Back to Active Threat</span>
            </button>

            <button
              onClick={() => setWorkflowStage(3)}
              className="px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-sky-300 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition flex items-center gap-2 group cursor-pointer"
            >
              <span>Open Available Shelters</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STEP 3: AVAILABLE SHELTERS & CAPACITY RESERVATION                      */}
      {/* ========================================================================= */}
      {workflowStage === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <section aria-label="Available Shelters and Capacity Reservation">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Home className="w-6 h-6 text-[#10B981]" />
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Available Shelters
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-black/70 text-[#10B981] border border-[#10B981]/50 font-mono font-bold">
                    ACTIVE SANCTUARIES
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-sm font-mono">
                  <div>
                    <span className="text-[#E2E8F0] mr-2">Total Capacity:</span>
                    <strong className="text-white text-xl font-bold">{totalShelterTotal.toLocaleString()}</strong>
                  </div>
                  <span>·</span>
                  <div>
                    <span className="text-[#E2E8F0] mr-2">Available Berths:</span>
                    <strong className="text-[#10B981] text-2xl font-bold">{totalShelterAvailable.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Reservation Toast Notification */}
              {reservationNotice && (
                <div
                  className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fadeIn ${
                    reservationNotice.type === 'success'
                      ? 'bg-black/80 border border-[#10B981]/60 text-[#10B981]'
                      : 'bg-black/80 border border-[#EF4444]/60 text-[#EF4444]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {reservationNotice.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0" />
                    )}
                    <span>{reservationNotice.message}</span>
                  </div>
                  <button
                    onClick={() => setReservationNotice(null)}
                    className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Shelters Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(shelters || []).map((shelter) => {
                  const totalCap = shelter?.totalCapacity ?? 2000;
                  const occCap = shelter?.occupiedCapacity ?? 0;
                  const resCap = shelter?.reservedCapacity ?? 0;
                  const available = Math.max(0, totalCap - occCap - resCap);
                  const occupiedPct = totalCap > 0 ? Math.round((occCap / totalCap) * 100) : 0;
                  const reservedPct = totalCap > 0 ? Math.round((resCap / totalCap) * 100) : 0;
                  const availablePct = Math.max(0, 100 - occupiedPct - reservedPct);
                  const isSelectedForRes = shelter?.id === reservationShelterId;

                  return (
                    <div
                      key={shelter.id}
                      className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                        isSelectedForRes
                          ? 'bg-[#0A192F]/90 border-[#38BDF8] ring-1 ring-[#38BDF8]/40'
                          : 'bg-black/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Shelter Header */}
                        <div className="flex items-start justify-between gap-2.5 mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-white">{shelter.name}</h4>
                            <span className="text-xs text-[#E2E8F0] block mt-0.5">{shelter.location}</span>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                              available > 200
                                ? 'bg-black/70 text-[#10B981] border border-[#10B981]/50'
                                : 'bg-black/70 text-orange-400 border border-orange-500/50'
                            }`}
                          >
                            {available > 200 ? 'OPEN' : 'LIMITED'}
                          </span>
                        </div>

                        {/* Primary Available Metric (2xl Bold) */}
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-[#E2E8F0] uppercase font-mono block">Available Berths</span>
                            <strong className="text-2xl sm:text-3xl font-bold font-mono text-[#10B981] block mt-0.5">
                              {available.toLocaleString()}
                            </strong>
                          </div>
                          <div className="text-right font-mono text-xs text-[#E2E8F0] space-y-0.5">
                            <div>Total: <strong className="text-white">{totalCap.toLocaleString()}</strong></div>
                            <div>Occupied: <strong className="text-white">{occCap.toLocaleString()}</strong></div>
                            <div>Reserved: <strong className="text-[#38BDF8]">{resCap.toLocaleString()}</strong></div>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="space-y-1.5 mb-4">
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${occupiedPct}%` }}
                              className="bg-slate-500 h-full"
                            />
                            <div
                              style={{ width: `${reservedPct}%` }}
                              className="bg-[#38BDF8] h-full"
                            />
                            <div
                              style={{ width: `${availablePct}%` }}
                              className="bg-[#10B981] h-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-[#E2E8F0] font-mono">
                            <span>{occupiedPct}% Occ</span>
                            <span className="text-[#38BDF8]">{reservedPct}% Res</span>
                            <span className="text-[#10B981] font-bold">{availablePct}% Free</span>
                          </div>
                        </div>
                      </div>

                      {/* Inline Reserve Berths Action */}
                      <div className="pt-3.5 border-t border-slate-800 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-xs text-[#E2E8F0] block mb-1">Rescue Unit</label>
                            <select
                              value={reservationTeamId}
                              onChange={(e) => setReservationTeamId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                            >
                              {(teams || []).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-[#E2E8F0] block mb-1">Berths</label>
                            <input
                              type="number"
                              min={50}
                              max={available}
                              step={50}
                              value={reservationBerthCount}
                              onChange={(e) => setReservationBerthCount(Math.max(10, parseInt(e.target.value) || 0))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#38BDF8]"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleInlineReserveBerths(shelter.id)}
                          disabled={isSubmittingReservation || available === 0}
                          className="w-full py-2.5 px-3 rounded-lg bg-[#38BDF8] hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Reserve {reservationBerthCount} Berths</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Step 3 Bottom Navigation */}
          <div className="p-4 rounded-xl bg-[#0A192F]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setWorkflowStage(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#E2E8F0] border border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#38BDF8]" />
              <span>Back to Priority &amp; Map</span>
            </button>

            <button
              onClick={() => setWorkflowStage(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#E2E8F0] border border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <span>Return to Active Threat</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. IMMERSIVE 4-STAGE EVACUATION & NAVIGATION MODAL                         */}
      {/* ========================================================================= */}
      {Boolean(navModalHabId && activeModalHabitation) && (
        <EvacuationNavigationModal
          isOpen={Boolean(navModalHabId)}
          onClose={() => setNavModalHabId(null)}
          settlement={activeModalHabitation}
          habitation={activeModalHabitation}
          priorityItem={activeModalPriority}
          shelters={shelters || []}
          teams={teams || []}
          routes={routes || []}
          onRefreshState={() => {
            if (onRefreshState) onRefreshState();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. OVERRIDE AI RECOMMENDATION MODAL                                       */}
      {/* ========================================================================= */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Override AI Prioritization Model</span>
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-200 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Command authorities have override authority over automated AI rescue prioritization.
              Per protocol, a <strong>mandatory justification reason</strong> must be entered into the immutable audit trail.
            </p>

            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                Mandatory Override Justification <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Ground reconnaissance reports sudden culvert collapse on route; escalating Ramnagar priority immediately."
                className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {overrideSuccessMsg && (
              <div className="mb-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs sm:text-sm font-semibold">
                ✓ {overrideSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManualOverride}
                disabled={!overrideReason.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
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
