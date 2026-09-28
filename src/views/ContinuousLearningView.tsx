import React, { useState } from 'react';
import { Cpu, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, BarChart2, Zap } from 'lucide-react';
import { ModelVersion } from '../types/disaster';

interface ContinuousLearningViewProps {
  modelVersions: ModelVersion[];
  onRefreshState: () => void;
}

export const ContinuousLearningView: React.FC<ContinuousLearningViewProps> = ({
  modelVersions,
  onRefreshState
}) => {
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainStep, setRetrainStep] = useState<number | null>(null);

  const lifecycleStages = [
    { step: 1, title: 'New Data Ingestion', desc: 'Sentinel-1 radar, IMD gauges, and ground telemetry' },
    { step: 2, title: 'Preprocessing & Cleaning', desc: 'Anomaly filtering, deduplication, and CRS snapping' },
    { step: 3, title: 'Ground Verification', desc: 'Commander confirmation of actual flood boundaries' },
    { step: 4, title: 'Knowledge Base Commit', desc: 'Verified outcomes indexed into training corpus' },
    { step: 5, title: 'Ensemble Retraining', desc: 'Offline gradient-boosted spatial loss minimization' },
    { step: 6, title: 'Shadow Evaluation', desc: 'Benchmarked against historical flood benchmarks' },
    { step: 7, title: 'Human Safety Sign-off', desc: 'Incident commander validation of false-negative thresholds' },
    { step: 8, title: 'Zero-Downtime Rollout', desc: 'Production weights switched in disaster operations center' }
  ];

  const handleTriggerRetrain = () => {
    setIsRetraining(true);
    let s = 1;
    setRetrainStep(s);
    const interval = setInterval(() => {
      s += 1;
      if (s > 8) {
        clearInterval(interval);
        setIsRetraining(false);
        setRetrainStep(null);
        onRefreshState();
      } else {
        setRetrainStep(s);
      }
    }, 600);
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Continuous Learning &amp; Model Governance Lifecycle</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold border border-indigo-800 font-mono">
              PRODUCTION: v2.1-HYBRID
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated model retraining pipeline incorporating post-disaster verified boundaries to suppress false alarms and boost spatial flood precision.
          </p>
        </div>

        <button
          onClick={handleTriggerRetrain}
          disabled={isRetraining}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isRetraining ? `Retraining Step ${retrainStep}/8...` : 'Trigger Scheduled Retraining Run'}</span>
        </button>
      </div>

      {/* 8-Stage Model Retraining Pipeline Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono">Automated MLOps Pipeline</span>
          <h3 className="font-bold text-sm text-white mt-0.5">Continuous Feedback Loop (Ground Truth → Model Weights)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {lifecycleStages.map((stage) => {
            const isCurrent = retrainStep === stage.step;
            const isPast = retrainStep !== null && retrainStep > stage.step;

            return (
              <div
                key={stage.step}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                    : isPast
                    ? 'bg-slate-950/80 border-emerald-800/80'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] font-mono ${
                    isCurrent ? 'bg-indigo-600 text-white' : isPast ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPast ? '✓' : stage.step}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Stage 0{stage.step}</span>
                </div>
                <h4 className="font-bold text-slate-200 mb-1">{stage.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Versions Registry & Benchmark Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">Model Registry</span>
            <h3 className="font-bold text-sm text-white mt-0.5">Hazard Prediction Model Benchmark Versions</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Kosi-Ganga Ground Truth Validated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-3.5">Model Version</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Accuracy</th>
                <th className="p-3.5">Precision</th>
                <th className="p-3.5">Recall (Safety Metric)</th>
                <th className="p-3.5">F1 Score</th>
                <th className="p-3.5">Deployed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {modelVersions.map((mv) => {
                const isActive = mv.status === 'ACTIVE';
                const isCandidate = mv.status === 'CANDIDATE';

                return (
                  <tr key={mv.version} className={isActive ? 'bg-indigo-950/20' : 'hover:bg-slate-800/40'}>
                    <td className="p-3.5 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{mv.version}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-900 text-indigo-300 font-mono">
                            Production
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border font-mono ${
                        isActive
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : isCandidate
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {mv.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-200">{mv.accuracy}%</td>
                    <td className="p-3.5 font-mono text-slate-300">{mv.precision}%</td>
                    <td className="p-3.5 font-mono text-emerald-400 font-semibold">{mv.recall}%</td>
                    <td className="p-3.5 font-mono text-cyan-300 font-bold">{mv.f1Score}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-xs">{mv.deployedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
