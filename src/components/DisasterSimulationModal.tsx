import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Home,
  Truck,
  Navigation,
  Bell,
  Cpu
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';

interface DisasterSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshState: () => void;
  onJumpToTab: (tab: string) => void;
}

export interface SimStep {
  stepNumber: number;
  title: string;
  category: 'DATA' | 'PREDICT' | 'RED_ZONE' | 'PRIORITIZE' | 'CAPACITY' | 'ALLOCATE' | 'ROUTE' | 'ALERT' | 'EVACUATE' | 'LEARN';
  tabKey: string;
  whatHappened: string;
  whyImportant: string;
  systemAction: string;
  actionPayload?: () => Promise<void>;
}

export const DisasterSimulationModal: React.FC<DisasterSimulationModalProps> = ({
  isOpen,
  onClose,
  onRefreshState,
  onJumpToTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scenarioSteps: SimStep[] = [
    {
      stepNumber: 1,
      title: 'Heavy Rainfall Inundation Observed',
      category: 'DATA',
      tabKey: 'data-sources',
      whatHappened: 'Doppler Radar telemetry at Station DP-2 logs 185mm cumulative precipitation over 3 hours in upper Kosi catchment.',
      whyImportant: 'Precipitation exceeds flash flood warning thresholds by 240%.',
      systemAction: 'Raw radar precipitation vector ingested and normalized through the 8-stage data pipeline.'
    },
    {
      stepNumber: 2,
      title: 'River Sensor Triggers Alert',
      category: 'DATA',
      tabKey: 'alerts',
      whatHappened: 'IoT River Gauge GS-04 detects stage at +4.82m (danger mark: +4.00m) with rapid +0.38m/hr rise rate.',
      whyImportant: 'Imminent overtopping of earthen embankments in vulnerable sectors.',
      systemAction: 'Automated high-water telemetry alert generated and flagged for authority verification.'
    },
    {
      stepNumber: 3,
      title: 'Telemetry Alert Verified by Commander',
      category: 'ALERT',
      tabKey: 'alerts',
      whatHappened: 'Incident Commander reviews multi-station sensor agreement and cross-references Sentinel-1 SAR imagery.',
      whyImportant: 'Prevents false alarms while establishing legal authority for emergency evacuations.',
      systemAction: 'Report verified and elevated to ACTIVE FLASH FLOOD EVENT.',
      actionPayload: async () => {
        await ApiClient.verifyAlert('alert-001', 'VERIFY', 'Incident Commander');
      }
    },
    {
      stepNumber: 4,
      title: 'AI Hazard Engine Predicts Inundation',
      category: 'PREDICT',
      tabKey: 'hazard-prediction',
      whatHappened: 'Hydrological ML Ensemble v2.1 processes gauge levels, soil moisture (96%), and embankment weakness.',
      whyImportant: 'Predicts 94% Flood probability with catastrophic inundation depth within 90 minutes.',
      systemAction: 'Inundation mesh computed across 48 km² affecting 16,500 exposed population.'
    },
    {
      stepNumber: 5,
      title: 'Red-Zone Geospatial Polygon Generated',
      category: 'RED_ZONE',
      tabKey: 'red-zones',
      whatHappened: 'Tri-color risk zones rendered on map: High-Risk Red Zone, Yellow Buffer Zone, and Safe Green Sanctuary.',
      whyImportant: 'Enables precise containment boundaries and evacuation perimeter enforcement.',
      systemAction: 'Geospatial boundary pushed to tactical GIS layers.'
    },
    {
      stepNumber: 6,
      title: 'Vulnerable Habitations Identified',
      category: 'PRIORITIZE',
      tabKey: 'vulnerability',
      whatHappened: '6 habitations scored against demographic vulnerability formula (infants, elderly, bedridden, poverty).',
      whyImportant: 'Raw population totals are inadequate; vulnerable residents require 3x evacuation time and specialized transport.',
      systemAction: 'Vulnerability scores assigned: Rampur (92/100), Majuli (84/100), Lower Kosi (88/100).'
    },
    {
      stepNumber: 7,
      title: 'Village Rampur Ranked Priority #1',
      category: 'PRIORITIZE',
      tabKey: 'rescue-priorities',
      whatHappened: 'Algorithmic prioritization places Village Rampur at Rank #1 due to riverbank proximity and 1,850 vulnerable souls.',
      whyImportant: '45-minute evacuation window before water reaches settlement dwellings.',
      systemAction: 'AI justification generated explaining exact decision variables to field commanders.'
    },
    {
      stepNumber: 8,
      title: 'Shelter Carrying Capacity Evaluated',
      category: 'CAPACITY',
      tabKey: 'shelters',
      whatHappened: 'Disaster operations evaluates 5 designated shelters. Total capacity: 13,000 berths; 6,650 currently available.',
      whyImportant: 'Guarantees that evacuated villagers will not be turned away into secondary danger.',
      systemAction: 'Carrying capacity limits and water/medical stocks verified.'
    },
    {
      stepNumber: 9,
      title: 'NDRF Unit 7 Reserves 1,000 Spaces at Shelter A',
      category: 'ALLOCATE',
      tabKey: 'shelters',
      whatHappened: 'NDRF Unit 7 dispatches toward Rampur and claims atomic reservation for 1,000 evacuee berths at District College Shelter.',
      whyImportant: 'Prevents race conditions between simultaneous responder teams.',
      systemAction: 'Shelter A capacity locked: Occupied + Reserved = 2,100; Available drops to 1,900.',
      actionPayload: async () => {
        await ApiClient.reserveShelterCapacity({
          shelterId: 'shelter-1',
          teamId: 'team-1',
          teamName: 'NDRF Battalion 7',
          habitationId: 'hab-1',
          habitationName: 'Village Rampur Riverbank',
          count: 1000
        });
      }
    },
    {
      stepNumber: 10,
      title: 'SDRF Unit 3 Capacity Split & Overbooking Guard',
      category: 'ALLOCATE',
      tabKey: 'shelters',
      whatHappened: 'SDRF Unit 3 requires 2,000 berths for Majuli Basti. Shelter A only has 1,900 remaining.',
      whyImportant: 'Overbooking prevention prevents overcrowding and disease outbreak.',
      systemAction: 'System auto-splits overflow: 1,200 assigned to Shelter A; remaining 800 redirected to Safe Sanctuary Shelter D.'
    },
    {
      stepNumber: 11,
      title: 'Kosi Causeway Bridge Submerged & Blocked',
      category: 'ROUTE',
      tabKey: 'route-safety',
      whatHappened: 'Water rises +0.9m over the deck of Kosi Causeway Bridge. Segment status changed to BLOCKED.',
      whyImportant: 'Standard Route 2 is impassable for emergency vehicle convoys.',
      systemAction: 'Route 2 marked as UNSAFE / BLOCKED.',
      actionPayload: async () => {
        await ApiClient.recalculateRoute('seg-2', 'BLOCKED', 'Water overtopping 0.9m across bridge deck');
      }
    },
    {
      stepNumber: 12,
      title: 'Dynamic Reroute via Eastern Bypass',
      category: 'ROUTE',
      tabKey: 'route-safety',
      whatHappened: 'Graph routing engine recalculates alternative path: Village Majuli → Junction 4 → Eastern Flood Bypass → Ridge Road.',
      whyImportant: 'Guarantees rescue convoys remain above flood line with zero submersion risk.',
      systemAction: 'New route published (+2.8km distance, +8m travel time, Safe rating).'
    },
    {
      stepNumber: 13,
      title: 'Targeted CAP Emergency Broadcasts Dispatched',
      category: 'ALERT',
      tabKey: 'alerts',
      whatHappened: 'Common Alerting Protocol (CAP) alerts broadcast to authorities, NDRF units, and registered residents.',
      whyImportant: 'Informs communities with designated shelter directions before phone networks degrade.',
      systemAction: 'SMS and radio notifications sent with custom evacuation routes.'
    },
    {
      stepNumber: 14,
      title: 'SMS Failure Triggers Volunteer Door-to-Door',
      category: 'ALERT',
      tabKey: 'alerts',
      whatHappened: 'Cellular tower failure causes SMS broadcast failure in Lower Kosi Hamlet.',
      whyImportant: 'In a real disaster, cell connectivity collapses; reliance on SMS alone is fatal.',
      systemAction: 'Automatic fallback activated: Civil Defence Volunteer Squad #4 deployed for physical door-to-door siren warning!',
      actionPayload: async () => {
        await ApiClient.sendNotification({
          habitationId: 'hab-3',
          recipientType: 'COMMUNITY',
          channel: 'SMS',
          message: 'FLASH FLOOD: Evacuate immediately.',
          simulateFailure: true
        });
      }
    },
    {
      stepNumber: 15,
      title: 'Active Evacuation in Progress',
      category: 'EVACUATE',
      tabKey: 'command-center',
      whatHappened: 'Responders deploy 8 IRBs and 4 off-road trucks. 3,100 villagers moved through safe bypass.',
      whyImportant: 'Priority 1 settlement completely evacuated 12 minutes before flood crest.',
      systemAction: 'Habitation status transitioned to EVACUATING.'
    },
    {
      stepNumber: 16,
      title: 'Evacuee Arrival Confirmed at Shelter A',
      category: 'CAPACITY',
      tabKey: 'shelters',
      whatHappened: '1,000 evacuees reach Shelter A. Gate officer verifies count and taps Confirm Arrival.',
      whyImportant: 'Transitions status from RESERVED to OCCUPIED and updates relief inventory tracking.',
      systemAction: 'Shelter A capacity: 1,000 moved from Reserved to Occupied.',
      actionPayload: async () => {
        await ApiClient.confirmEvacueeArrival('shelter-1', 'res-ndrf-001', 1000);
      }
    },
    {
      stepNumber: 17,
      title: 'Post-Disaster Ground Verification',
      category: 'LEARN',
      tabKey: 'knowledge-base',
      whatHappened: 'Ground survey confirms zero casualties. Inundation boundary matched AI model with 92.4% spatial precision.',
      whyImportant: 'Ground-truth capture provides training targets for next-generation ML algorithms.',
      systemAction: 'Event verified and signed off by Incident Commander.'
    },
    {
      stepNumber: 18,
      title: 'Event Committed to Knowledge Base',
      category: 'LEARN',
      tabKey: 'knowledge-base',
      whatHappened: 'Record KB-FL-2026 committed: "Causeway Bridge submerged at +4.4m; Eastern Bypass successful."',
      whyImportant: 'Prevents institutional memory loss and informs future response playbooks.',
      systemAction: 'Vector embeddings created in RAG knowledge repository.',
      actionPayload: async () => {
        await ApiClient.addKnowledgeBaseEvent({
          eventCode: 'KB-FL-2026-STAGE4',
          hazardType: 'Flood',
          locationName: 'Kosi Basin Sector 4',
          eventDate: '2026-09-12',
          predictedProbability: 94,
          actualOutcome: 'River breached embankment; 3,100 villagers safely relocated to Shelter A via Eastern Bypass.',
          populationAffected: 3100,
          sheltersUsed: ['District Stadium Relief Complex (Shelter A)'],
          routeInitiallySelected: 'Kosi Causeway Bridge Rd',
          alternativeRouteUsed: 'Eastern Flood Bypass',
          evacuationDurationMin: 45,
          lessonsLearned: 'Causeway bridge submerged at +4.4m river gauge; Eastern Bypass must be activated automatically.',
          verifiedOutcome: true
        });
      }
    },
    {
      stepNumber: 19,
      title: 'Continuous Retraining Scheduled',
      category: 'LEARN',
      tabKey: 'learning',
      whatHappened: 'New verified dataset added to training queue. Candidate model v2.2-rc1 shows +1.8% F1 gain.',
      whyImportant: 'Continuous improvement loop ensures system becomes smarter with every hazard event.',
      systemAction: 'Model governance checkpoint cleared; continuous learning cycle complete.'
    }
  ];

  const currentScenario = scenarioSteps[currentStep] || scenarioSteps[0];

  // Auto Play Loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && isOpen) {
      timer = setTimeout(async () => {
        if (currentStep < scenarioSteps.length - 1) {
          const next = currentStep + 1;
          setCurrentStep(next);
          const stepObj = scenarioSteps[next];
          if (stepObj.actionPayload) {
            await stepObj.actionPayload();
            onRefreshState();
          }
          onJumpToTab(stepObj.tabKey);
        } else {
          setIsPlaying(false);
        }
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, isOpen]);

  const handleNext = async () => {
    if (currentStep < scenarioSteps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      const stepObj = scenarioSteps[next];
      if (stepObj.actionPayload) {
        await stepObj.actionPayload();
        onRefreshState();
      }
      onJumpToTab(stepObj.tabKey);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onJumpToTab(scenarioSteps[prev].tabKey);
    }
  };

  const handleResetSim = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    onJumpToTab(scenarioSteps[0].tabKey);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-rose-950/90 via-slate-900 to-indigo-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm font-bold text-sm font-mono">
              {currentScenario.stepNumber}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono">
                Live Disaster Scenario Simulation
              </span>
              <h3 className="font-bold text-base text-white">
                Step {currentScenario.stepNumber} of {scenarioSteps.length}: {currentScenario.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Timeline Bar */}
        <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / scenarioSteps.length) * 100}%` }}
          />
        </div>

        {/* Step Operational Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* What Happened */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                <span>WHAT HAPPENED?</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {currentScenario.whatHappened}
              </p>
            </div>

            {/* Why Important */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>WHY IS IT IMPORTANT?</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {currentScenario.whyImportant}
              </p>
            </div>

            {/* System Action */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SYSTEM ACTION TAKEN</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {currentScenario.systemAction}
              </p>
            </div>
          </div>

          {/* Jump to Relevant Tab Context */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Active Module: <strong className="text-white uppercase font-mono">{currentScenario.category}</strong> (Tab: <em className="text-cyan-300 font-mono">{currentScenario.tabKey}</em>)
            </span>
            <button
              onClick={() => {
                onJumpToTab(currentScenario.tabKey);
                onClose();
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-xs"
            >
              <span>Inspect UI View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Navigation & Playback Controls */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Auto-Play' : 'Auto Play Scenario'}</span>
            </button>

            <button
              onClick={handleResetSim}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === scenarioSteps.length - 1}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <span>{currentStep === scenarioSteps.length - 1 ? 'Simulation Complete' : 'Next Step'}</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
