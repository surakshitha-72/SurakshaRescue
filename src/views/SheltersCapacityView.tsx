import React, { useState } from 'react';
import {
  Home,
  Users,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Flame,
  Check
} from 'lucide-react';
import { Shelter, RescueTeam, Habitation } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface SheltersCapacityViewProps {
  shelters: Shelter[];
  teams: RescueTeam[];
  habitations: Habitation[];
  onRefreshState: () => void;
}

export const SheltersCapacityView: React.FC<SheltersCapacityViewProps> = ({
  shelters,
  teams,
  habitations,
  onRefreshState
}) => {
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id || 'shelter-1');

  // Reservation Form State
  const [resTeamId, setResTeamId] = useState<string>(teams[0]?.id || 'team-1');
  const [resHabId, setResHabId] = useState<string>(habitations[0]?.id || 'hab-1');
  const [resCount, setResCount] = useState<number>(1200);

  const [reserveStatus, setReserveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [isReserving, setIsReserving] = useState(false);

  const selectedShelter = shelters.find(s => s.id === selectedShelterId) || shelters[0];
  const availableBerths = selectedShelter.totalCapacity - selectedShelter.occupiedCapacity - selectedShelter.reservedCapacity;

  const handleReserve = async () => {
    setIsReserving(true);
    setReserveStatus({ type: null, message: '' });

    const team = teams.find(t => t.id === resTeamId);
    const hab = habitations.find(h => h.id === resHabId);

    const result = await ApiClient.reserveShelterCapacity({
      shelterId: selectedShelterId,
      teamId: resTeamId,
      teamName: team?.name || 'Rescue Unit',
      habitationId: resHabId,
      habitationName: hab?.name || 'Habitation',
      count: resCount
    });

    if (result.success) {
      setReserveStatus({
        type: 'success',
        message: `Capacity successfully RESERVED: ${resCount} berths locked for ${team?.name} at ${selectedShelter.name}.`
      });
      onRefreshState();
    } else {
      setReserveStatus({
        type: 'error',
        message: result.message || 'Overbooking rejected: Insufficient free capacity!'
      });
    }
    setIsReserving(false);
  };

  const handleRelease = async (resId: string) => {
    await ApiClient.releaseShelterCapacity(selectedShelterId, resId);
    onRefreshState();
  };

  const handleConfirmArrival = async (resId: string) => {
    await ApiClient.confirmEvacueeArrival(selectedShelterId, resId);
    onRefreshState();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Relocation Centres &amp; Carrying Capacity Engine</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 font-bold border border-blue-800 font-mono">
              MUTUAL EXCLUSION LOCK
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time carrying capacity assessment and atomic multi-team reservation engine. Prevents overbooking and guarantees shelter beds.
          </p>
        </div>

        <button
          onClick={onRefreshState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh State</span>
        </button>
      </div>

      {/* Grid: Shelter Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {shelters.map((s) => {
          const isSelected = s.id === selectedShelterId;
          const avail = s.totalCapacity - s.occupiedCapacity - s.reservedCapacity;
          const isFull = avail <= 50;

          return (
            <div
              key={s.id}
              onClick={() => setSelectedShelterId(s.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase font-mono ${
                  isFull ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}>
                  {s.status}
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {Math.max(0, avail).toLocaleString()} Free
                </span>
              </div>

              <h4 className="font-bold text-sm text-white truncate mb-1">{s.name}</h4>
              <p className="text-xs text-slate-400 mb-3 truncate">{s.address}</p>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex mb-2.5 border border-slate-800">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${Math.round((s.occupiedCapacity / s.totalCapacity) * 100)}%` }}
                  title={`Occupied: ${s.occupiedCapacity}`}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${Math.round((s.reservedCapacity / s.totalCapacity) * 100)}%` }}
                  title={`Reserved: ${s.reservedCapacity}`}
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px] bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block">TOTAL</span>
                  <strong className="text-white">{s.totalCapacity}</strong>
                </div>
                <div>
                  <span className="text-blue-400 block">OCCUPIED</span>
                  <strong className="text-slate-200">{s.occupiedCapacity}</strong>
                </div>
                <div>
                  <span className="text-amber-400 block">RESERVED</span>
                  <strong className="text-amber-300">{s.reservedCapacity}</strong>
                </div>
                <div>
                  <span className="text-emerald-400 block">AVAILABLE</span>
                  <strong className="text-emerald-300">{Math.max(0, avail)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Reservation Console for Selected Shelter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Test Console & Capacity Reservation Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">Atomic Allocation Console</span>
              <h3 className="font-bold text-sm text-white mt-0.5">Reserve Capacity: {selectedShelter.name}</h3>
            </div>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Rescue Team Reserving Capacity:</label>
              <select
                value={resTeamId}
                onChange={(e) => setResTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-medium focus:outline-none focus:border-blue-400"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.unit}) - Cap: {t.teamCapacity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Vulnerable Habitation:</label>
              <select
                value={resHabId}
                onChange={(e) => setResHabId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-medium focus:outline-none focus:border-blue-400"
              >
                {habitations.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} (Pop: {h.demographics.total.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-semibold">Number of Berths to Lock:</span>
                <span className="text-cyan-400 font-bold font-mono text-sm">{resCount.toLocaleString()} berths</span>
              </div>
              <input
                type="range"
                min="100"
                max={selectedShelter.totalCapacity}
                step="50"
                value={resCount}
                onChange={(e) => setResCount(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>100 min</span>
                <span>Free: {availableBerths.toLocaleString()}</span>
                <span>Total: {selectedShelter.totalCapacity}</span>
              </div>
            </div>

            {/* Status alerts */}
            {reserveStatus.type === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-300 uppercase text-[10px]">Capacity Check Failed</strong>
                  <span>{reserveStatus.message}</span>
                </div>
              </div>
            )}

            {reserveStatus.type === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-300 uppercase text-[10px]">Atomic Reservation Approved</strong>
                  <span>{reserveStatus.message}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleReserve}
              disabled={isReserving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isReserving ? 'Validating Atomic Locks...' : 'Submit Capacity Reservation'}</span>
            </button>
          </div>
        </div>

        {/* Right: Active Reservations on this Shelter (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">Active Capacity Locks</span>
              <h3 className="font-bold text-sm text-white mt-0.5">Current Reservations at {selectedShelter.name}</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {selectedShelter.activeReservations.length} Active
            </span>
          </div>

          {selectedShelter.activeReservations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
              No active reservations on this facility. Capacity is fully available for assignment.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {selectedShelter.activeReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span className="font-bold text-white text-sm">{res.teamName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                        {res.status}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Destination for: <strong className="text-slate-200">{res.habitationName}</strong>
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono mt-1">
                      Reserved At: {res.timestamp} · Expires: {res.expiresAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-base font-bold text-cyan-400 font-mono">
                        {res.reservedCount.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Berths Locked</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleConfirmArrival(res.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition"
                        title="Evacuees arrived: transition RESERVED -> OCCUPIED"
                      >
                        Confirm Arrival
                      </button>
                      <button
                        onClick={() => handleRelease(res.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 font-medium rounded-lg text-xs transition"
                      >
                        Release Lock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 flex flex-wrap items-center justify-between gap-2">
            <span>Medical Readiness: <strong className="text-white">{selectedShelter.medicalCapacity}</strong></span>
            <span>Water Rations: <strong className="text-white font-mono">{selectedShelter.waterCapacityDays} days</strong></span>
            <span>Food Supplies: <strong className="text-white font-mono">{selectedShelter.foodCapacityDays} days</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
