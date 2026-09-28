import React, { useState } from 'react';
import { Truck, ShieldCheck, Users, Anchor, Activity, Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { RescueTeam, Habitation, Shelter } from '../types/disaster';

interface RescueTeamsViewProps {
  teams: RescueTeam[];
  habitations: Habitation[];
  shelters: Shelter[];
  onAssignMission?: (teamId: string, habId: string, shelterId: string) => void;
}

export const RescueTeamsView: React.FC<RescueTeamsViewProps> = ({
  teams,
  habitations,
  shelters,
  onAssignMission
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || 'team-1');
  const [assignHabId, setAssignHabId] = useState<string>(habitations[0]?.id || 'hab-1');
  const [assignShelterId, setAssignShelterId] = useState<string>(shelters[0]?.id || 'shelter-1');
  const [assignTask, setAssignTask] = useState<string>('Evacuate elderly and children via safe bypass');
  const [assignedSuccess, setAssignedSuccess] = useState<string | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  const handleAssign = () => {
    onAssignMission?.(selectedTeamId, assignHabId, assignShelterId);
    const hab = habitations.find(h => h.id === assignHabId);
    setAssignedSuccess(`Mission order dispatched to ${selectedTeam.name} for ${hab?.name}.`);
    setTimeout(() => setAssignedSuccess(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Rescue Teams Readiness &amp; Asset Deployment</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 font-mono">
              NDRF / SDRF SPECIALIZED UNITS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitors responder equipment readiness, inflatable rescue boats (IRB), medical personnel, vehicle transport capacities, and active deployment missions.
          </p>
        </div>

        {/* Resource shortage notice */}
        <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Heavy boat equipment limited: Reserve IRBs for Sunderpur &amp; Majuli aquatic zones.</span>
        </div>
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((team) => {
          const isSelected = team.id === selectedTeamId;
          const isAvailable = team.status === 'Available';

          return (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase font-mono ${
                  isAvailable ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {team.status}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{team.contactFrequency}</span>
              </div>

              <h4 className="font-bold text-sm text-white mb-0.5">{team.name}</h4>
              <div className="text-xs text-slate-400 mb-3">{team.unit}</div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Responders:</span>
                  <strong className="text-white font-mono">{team.teamCapacity} pax</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transport:</span>
                  <strong className="text-cyan-300 font-mono">{team.vehicleCapacity} evacuees</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boat Fleet:</span>
                  <strong className={team.boatAvailability ? 'text-amber-300 font-mono' : 'text-slate-500'}>
                    {team.boatAvailability ? `${team.boatCount} Boats` : 'None'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Medical:</span>
                  <strong className="text-emerald-300">{team.medicalCapability}</strong>
                </div>
              </div>

              {team.currentAssignment && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <div className="text-amber-400 font-semibold mb-0.5">Active Assignment:</div>
                  <div className="truncate font-medium">{team.currentAssignment.task}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Target: {team.currentAssignment.habitationName}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Team Mission Dispatch Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Dispatch Mission Orders: {selectedTeam.name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Habitation for Evacuation:</label>
            <select
              value={assignHabId}
              onChange={(e) => setAssignHabId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-400"
            >
              {habitations.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} (Pop: {h.demographics.total.toLocaleString()} · Vuln: {h.vulnerabilityScore})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Designated Receiving Shelter:</label>
            <select
              value={assignShelterId}
              onChange={(e) => setAssignShelterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-400"
            >
              {shelters.map(s => {
                const avail = s.totalCapacity - s.occupiedCapacity - s.reservedCapacity;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({avail} berths free)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Directives &amp; Tactical Guidance:</label>
            <input
              type="text"
              value={assignTask}
              onChange={(e) => setAssignTask(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {assignedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold">
            ✓ {assignedSuccess}
          </div>
        )}

        <button
          onClick={handleAssign}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Issue Deployment Order</span>
        </button>
      </div>
    </div>
  );
};
