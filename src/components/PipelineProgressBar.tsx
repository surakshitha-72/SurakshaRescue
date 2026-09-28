import React from 'react';
import { Check, ChevronRight, Activity, ArrowRight } from 'lucide-react';

export interface PipelineStep {
  id: number;
  label: string;
  tabKey: string;
  title: string;
  question: string;
  keyMetric: string;
  status: 'completed' | 'active' | 'pending';
}

interface PipelineProgressBarProps {
  currentStepIndex: number;
  onSelectStep: (stepIndex: number, tabKey: string) => void;
  expanded?: boolean;
}

export const PIPELINE_STEPS: Omit<PipelineStep, 'status'>[] = [
  { id: 1, label: '1. DATA', tabKey: 'data-sources', title: 'Data Ingestion & Verification', question: 'WHAT HAPPENED?', keyMetric: '5 streams connected' },
  { id: 2, label: '2. PREDICT', tabKey: 'hazard-prediction', title: 'Physics Hazard Prediction', question: 'WHY IS IT IMPORTANT?', keyMetric: '94% Flood Risk' },
  { id: 3, label: '3. RED ZONE', tabKey: 'red-zones', title: 'Red-Zone Geospatial Mapping', question: 'WHO IS AT RISK?', keyMetric: '8,990 exposed' },
  { id: 4, label: '4. PRIORITIZE', tabKey: 'rescue-priorities', title: 'Vulnerability & Rescue Prioritization', question: 'WHO NEEDS RESCUE FIRST?', keyMetric: 'Rampur Priority #1' },
  { id: 5, label: '5. CAPACITY', tabKey: 'shelters', title: 'Relocation Centre Capacity Assessment', question: 'WHERE CAN THEY GO?', keyMetric: '6,650 berths available' },
  { id: 6, label: '6. ALLOCATE', tabKey: 'shelters', title: 'Multi-Team Atomic Capacity Allocation', question: 'DOES SHELTER HAVE CAPACITY?', keyMetric: '1,000 reserved (NDRF)' },
  { id: 7, label: '7. ROUTE', tabKey: 'route-safety', title: 'Dynamic Route Safety Analysis', question: 'WHICH ROUTE IS SAFE?', keyMetric: 'Causeway Bridge Blocked' },
  { id: 8, label: '8. ALERT', tabKey: 'alerts', title: 'Alert Generation & Delivery', question: 'WHAT IF ALERT FAILS?', keyMetric: 'Volunteer Squad active' },
  { id: 9, label: '9. EVACUATE', tabKey: 'command-center', title: 'Evacuation Coordination & Tracking', question: 'HAS EVACUATION COMPLETED?', keyMetric: 'In Progress (3,100 moved)' },
  { id: 10, label: '10. LEARN', tabKey: 'knowledge-base', title: 'Mission Audit & Continuous Retraining', question: 'WHAT DID WE LEARN?', keyMetric: 'KB-FL-2026 recorded' },
];

export const PipelineProgressBar: React.FC<PipelineProgressBarProps> = ({
  currentStepIndex,
  onSelectStep
}) => {
  const currentStep = PIPELINE_STEPS[currentStepIndex] || PIPELINE_STEPS[0];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 text-slate-100">
      {/* 10-Step visual pipeline ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs">
        {PIPELINE_STEPS.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPast = idx < currentStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx, step.tabKey)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${
                isCurrent
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-semibold ring-1 ring-rose-400/40'
                  : isPast
                  ? 'bg-slate-800/90 text-emerald-300 border-emerald-900/60 hover:bg-slate-800 hover:text-emerald-200'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {isPast ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-ping"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0"></span>
              )}
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Operator guidance bar for current step */}
      <div className="border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 font-mono text-[10px] font-semibold">
              STEP {currentStep.id}/10
            </span>
            <span className="font-semibold text-slate-200 text-xs">
              {currentStep.title}
            </span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="text-amber-400 font-medium hidden sm:inline text-xs">
              {currentStep.question}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="text-[11px]">Key Metric:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 font-mono text-xs border border-slate-700/80">
              {currentStep.keyMetric}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
