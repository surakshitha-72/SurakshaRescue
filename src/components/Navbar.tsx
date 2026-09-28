import React, { useState } from 'react';
import {
  Shield,
  Play,
  RotateCcw,
  AlertTriangle,
  Radio,
  Map,
  Compass,
  Home,
  Bell,
  History,
  LayoutDashboard,
  Menu,
  X,
  Layers,
  Users,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../types/disaster';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onRunSimulation: () => void;
  onResetState: () => void;
  isSimulating: boolean;
  alertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  onChangeRole,
  onRunSimulation,
  onResetState,
  isSimulating,
  alertCount = 4
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop primary navigation tabs as requested:
  // Dashboard | Map | Disasters | Rescue | Centres | Alerts | History
  const desktopTabs = [
    { id: 'command-center', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'disasters', label: 'Disasters', icon: AlertTriangle },
    { id: 'rescue', label: 'Rescue', icon: Compass, isHighlight: true },
    { id: 'centres', label: 'Centres', icon: Home },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
    { id: 'history', label: 'History', icon: History }
  ];

  // Mobile bottom navigation tabs as requested:
  // Home | Map | Rescue | Centres | Alerts
  const mobileBottomTabs = [
    { id: 'command-center', label: 'Home', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'rescue', label: 'Rescue', icon: Compass, isHighlight: true },
    { id: 'centres', label: 'Centres', icon: Home },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount }
  ];

  // Check if currentTab belongs to a group
  const isDisastersGroup = ['disasters', 'hazard-prediction', 'red-zones', 'vulnerability'].includes(currentTab);
  const isRescueGroup = ['rescue', 'rescue-priorities', 'rescue-teams', 'route-safety'].includes(currentTab);
  const isCentresGroup = ['centres', 'shelters'].includes(currentTab);
  const isHistoryGroup = ['history', 'knowledge-base', 'learning', 'audit-logs', 'data-sources'].includes(currentTab);

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 text-slate-100 shadow-md">
        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('command-center')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white group-hover:text-slate-200 transition">
                    SURAKSHA RESCUE
                  </span>
                  <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-semibold tracking-wider">
                    INDIA
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block leading-none">
                  National Disaster Evacuation & Route Safety Platform
                </div>
              </div>
            </button>

            {/* Live Incident Status Indicator */}
            <div className="hidden xl:flex items-center gap-2 pl-3 ml-2 border-l border-slate-800 text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Incident:</span>
              <span className="font-semibold text-rose-300">Kosi Flash Flood (Stage IV)</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs: Dashboard | Map | Disasters | Rescue | Centres | Alerts | History */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-950/70 rounded-xl border border-slate-800/80">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                currentTab === tab.id ||
                (tab.id === 'disasters' && isDisastersGroup) ||
                (tab.id === 'rescue' && isRescueGroup) ||
                (tab.id === 'centres' && isCentresGroup) ||
                (tab.id === 'history' && isHistoryGroup);

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? tab.isHighlight
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-800 text-white shadow-sm'
                      : tab.isHighlight
                      ? 'text-rose-400 hover:text-rose-300 hover:bg-slate-800/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-600 text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions: Role, Reset, Simulation */}
          <div className="flex items-center gap-2">
            {/* Role selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Role:</span>
              <select
                value={userRole}
                onChange={(e) => onChangeRole(e.target.value as UserRole)}
                className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="AUTHORITY" className="bg-slate-900 text-slate-100">Authority (Incident Commander)</option>
                <option value="RESCUE_TEAM" className="bg-slate-900 text-slate-100">Rescue Team Lead (NDRF)</option>
                <option value="VOLUNTEER" className="bg-slate-900 text-slate-100">Civil Defence Volunteer</option>
                <option value="ADMIN" className="bg-slate-900 text-slate-100">System Administrator</option>
                <option value="VIEWER" className="bg-slate-900 text-slate-100">Public Viewer</option>
              </select>
            </div>

            {/* Reset State */}
            <button
              onClick={onResetState}
              className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition text-xs font-medium"
              title="Reset state to initial scenario"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Run Simulation */}
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate Disaster'}</span>
              <span className="sm:hidden">Simulate</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Secondary Sub-Navigation Bar for Deep Functional Views */}
        {isRescueGroup && (
          <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 py-1.5 hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Rescue Views:</span>
            {[
              { id: 'rescue', label: 'Primary Rescue Workflow & Navigation' },
              { id: 'rescue-priorities', label: 'Priority Evacuation List' },
              { id: 'rescue-teams', label: 'Team Deployments (NDRF/SDRF)' },
              { id: 'route-safety', label: 'Route Safety Matrix' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => onSelectTab(sub.id)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  currentTab === sub.id
                    ? 'bg-rose-950/90 text-rose-300 font-bold border border-rose-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {isDisastersGroup && (
          <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 py-1.5 hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Disaster Modules:</span>
            {[
              { id: 'disasters', label: 'Hazard Hub' },
              { id: 'hazard-prediction', label: 'Physics Inundation Engine' },
              { id: 'red-zones', label: 'Red Zone Perimeter' },
              { id: 'vulnerability', label: 'Vulnerability Matrix' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => onSelectTab(sub.id)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  currentTab === sub.id
                    ? 'bg-rose-950/90 text-rose-300 font-bold border border-rose-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {isHistoryGroup && (
          <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 py-1.5 hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Historical Audit:</span>
            {[
              { id: 'history', label: 'History Hub' },
              { id: 'knowledge-base', label: 'Past Mission Case Studies' },
              { id: 'learning', label: 'Model Retraining' },
              { id: 'audit-logs', label: 'Immutable Audit Log' },
              { id: 'data-sources', label: 'Telemetry Feeds' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => onSelectTab(sub.id)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  currentTab === sub.id
                    ? 'bg-indigo-950/90 text-indigo-300 font-bold border border-indigo-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Mobile Drawer (When hamburger menu opened) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm pt-20 px-4 pb-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-white">Application Modules</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {desktopTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 font-bold transition ${
                      isActive
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Role Switcher */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
              <label className="text-slate-400 font-semibold block">Incident Role:</label>
              <select
                value={userRole}
                onChange={(e) => onChangeRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-amber-300 font-semibold"
              >
                <option value="AUTHORITY">Authority (Incident Commander)</option>
                <option value="RESCUE_TEAM">Rescue Team Lead (NDRF)</option>
                <option value="VOLUNTEER">Civil Defence Volunteer</option>
                <option value="ADMIN">System Administrator</option>
                <option value="VIEWER">Public Viewer</option>
              </select>
            </div>

            <button
              onClick={() => {
                onResetState();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Operational State</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR: Home | Map | Rescue | Centres | Alerts */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentTab === tab.id ||
            (tab.id === 'rescue' && isRescueGroup) ||
            (tab.id === 'centres' && isCentresGroup) ||
            (tab.id === 'command-center' && currentTab === 'command-center');

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 transition ${
                isActive
                  ? tab.isHighlight
                    ? 'text-rose-400 font-bold'
                    : 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${tab.isHighlight && isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-rose-600 text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
