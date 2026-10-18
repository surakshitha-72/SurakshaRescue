import React, { useState, useEffect } from 'react';
import {
  Shield,
  RotateCcw,
  UserCheck,
  Printer,
  RefreshCw,
  Activity,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types/disaster';

interface NavbarProps {
  currentTab?: string;
  onSelectTab?: (tab) => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onRunSimulation?: () => void;
  onResetState: () => void;
  isSimulating?: boolean;
  alertCount?: number;
  onOpenRagKnowledgeModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectTab,
  userRole,
  onChangeRole,
  onResetState,
  onOpenRagKnowledgeModal
}) => {
  const [syncSeconds, setSyncSeconds] = useState<number>(4);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSeconds(prev => (prev >= 25 ? 2 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncSeconds(0);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleExportBriefing = () => {
    window.print();
  };

  return (
    <header className="bg-[#0A192F]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title + Active Threat Status Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onSelectTab?.('command-center')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            title="Suraksha Rescue India Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-black/70 border border-[#38BDF8]/60 flex items-center justify-center text-[#38BDF8] shadow-md transition-transform group-hover:scale-105 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-[#38BDF8] transition">
                SURAKSHA RESCUE
              </span>
              <span className="text-xs text-[#38BDF8] font-mono font-bold tracking-wider">
                · INDIA
              </span>
            </div>
          </button>

          {/* Active Threat Status Badge (#10B981 Active Green + #EF4444 Red Zone) */}
          <div className="flex items-center gap-2.5 pl-3.5 ml-2 border-l border-slate-800">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-black/70 text-[#10B981] border border-[#10B981]/50 font-mono font-bold uppercase tracking-wider">
                Active Ops
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-black/70 text-[#EF4444] border border-[#EF4444]/60 font-mono font-bold uppercase tracking-wider hidden sm:inline">
                Red Zone Level 4
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Sync + AI Sources & Prediction + Export + Role + Reset */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Telemetry Pulse & Refresh Indicator */}
          <button
            onClick={handleManualSync}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-[#E2E8F0] cursor-pointer hover:border-[#38BDF8]/60 transition"
            title="Click to force telemetry refresh"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-semibold tracking-wide">
              SYNC · {syncSeconds}s
            </span>
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* AI Knowledge Sources & Predictive Engine Button */}
          <button
            onClick={onOpenRagKnowledgeModal}
            className="flex items-center gap-1.5 text-white hover:text-[#38BDF8] px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-[#38BDF8]/60 shadow-sm transition text-xs font-bold cursor-pointer"
            title="Manage Knowledge Sources, RAG Embeddings & AI Prediction"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <span className="hidden xl:inline">RAG &amp; AI Engine</span>
            <span className="xl:hidden hidden sm:inline">RAG Engine</span>
          </button>

          {/* Export Incident Briefing Report (Print / PDF) */}
          <button
            onClick={handleExportBriefing}
            className="flex items-center gap-1.5 text-[#E2E8F0] hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 transition text-xs font-semibold cursor-pointer"
            title="Export / Print Official Incident Operational Briefing"
          >
            <Printer className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Emergency Role Selector */}
          <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <select
              value={userRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="bg-transparent text-[#E2E8F0] font-semibold focus:outline-none cursor-pointer text-xs"
              aria-label="Select User Role"
            >
              <option value="AUTHORITY" className="bg-[#0A192F] text-white">Commander</option>
              <option value="RESCUE_TEAM" className="bg-[#0A192F] text-white">NDRF Lead</option>
              <option value="VOLUNTEER" className="bg-[#0A192F] text-white">Volunteer</option>
              <option value="ADMIN" className="bg-[#0A192F] text-white">Admin</option>
              <option value="VIEWER" className="bg-[#0A192F] text-white">Viewer</option>
            </select>
          </div>

          {/* Global Reset Button */}
          <button
            onClick={onResetState}
            className="flex items-center gap-1.5 text-[#E2E8F0] hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 transition text-xs font-semibold cursor-pointer"
            title="Reset incident state to initial baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
