import React, { useState } from 'react';
import { BookOpen, Search, PlusCircle, CheckCircle2, AlertTriangle, Filter, Sparkles } from 'lucide-react';
import { KnowledgeBaseRecord } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface KnowledgeBaseViewProps {
  records: KnowledgeBaseRecord[];
  onRefreshState: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  records,
  onRefreshState
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHazard, setSelectedHazard] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Record Form State
  const [newLocation, setNewLocation] = useState('');
  const [newHazard, setNewHazard] = useState('Flood');
  const [newPopAffected, setNewPopAffected] = useState(2500);
  const [newLessons, setNewLessons] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  const filtered = records.filter(r => {
    const matchesHazard = selectedHazard === 'ALL' || r.hazardType === selectedHazard;
    const matchesQuery = !searchQuery ||
      r.eventCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.actualOutcome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lessonsLearned.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesHazard && matchesQuery;
  });

  const handleAddEvent = async () => {
    if (!newLocation.trim()) return;
    await ApiClient.addKnowledgeBaseEvent({
      eventCode: `KB-${newHazard.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      hazardType: newHazard as any,
      locationName: newLocation,
      eventDate: new Date().toISOString().substring(0, 10),
      predictedProbability: 92,
      actualOutcome: newOutcome || 'Zero casualties; evacuation completed before flood crest.',
      populationAffected: newPopAffected,
      sheltersUsed: ['District Stadium Relief Complex (Shelter A)'],
      routeInitiallySelected: 'Primary Access Road',
      alternativeRouteUsed: 'Elevated Flood Bypass',
      evacuationDurationMin: 65,
      lessonsLearned: newLessons || 'Early night deployment preserved critical access window.',
      verifiedOutcome: true
    });
    setShowAddModal(false);
    setNewLocation('');
    setNewLessons('');
    setNewOutcome('');
    onRefreshState();
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Disaster Knowledge Base &amp; RAG Repository</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold border border-indigo-800 font-mono">
              VERIFIED GROUND TRUTH
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Historical disaster events, verified evacuation outcomes, road failure patterns, and lessons learned indexed for semantic search and continuous model retraining.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Verified Event</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past disasters, road failure patterns, rainfall analogs, or lessons learned..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
          {(['ALL', 'Flood', 'Landslide', 'Cyclone'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHazard(h)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition border text-xs ${
                selectedHazard === h
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Knowledge Base Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((record) => (
          <div
            key={record.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {record.hazardType} · {record.eventCode}
                </span>
                <span className="text-xs font-mono text-slate-400">{record.eventDate}</span>
              </div>

              <h4 className="font-bold text-sm text-white mb-1">{record.locationName}</h4>
              <div className="text-xs text-slate-400 mb-3">
                Pop Affected: <strong className="text-white font-mono">{record.populationAffected.toLocaleString()}</strong> · Duration: <strong className="text-slate-200 font-mono">{record.evacuationDurationMin} min</strong>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300 mb-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Predicted Prob:</span>
                  <strong className="text-cyan-400 font-mono">{record.predictedProbability}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shelters Utilized:</span>
                  <span className="text-slate-200 truncate ml-2 font-medium">{record.sheltersUsed.join(', ')}</span>
                </div>
                <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 mt-1 leading-relaxed">
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Actual Outcome:</span>
                  {record.actualOutcome}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block font-mono">
                  Operational Lessons:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {record.lessonsLearned}
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>RAG ID: {record.id}</span>
              <span className="text-emerald-400 font-semibold">✓ Retraining Corpus</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Verified Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Archive Verified Disaster Event</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-3.5 text-xs mb-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Location / Sector Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Village Rampur Riverbank Sector 4"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hazard Category:</label>
                  <select
                    value={newHazard}
                    onChange={(e) => setNewHazard(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Cyclone">Cyclone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pop Affected:</label>
                  <input
                    type="number"
                    value={newPopAffected}
                    onChange={(e) => setNewPopAffected(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Verified Outcome:</label>
                <input
                  type="text"
                  placeholder="e.g. Zero casualties; 3,100 evacuees safely sheltered."
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Key Lessons Learned:</label>
                <textarea
                  placeholder="e.g. Causeway Bridge submerges when River Gauge exceeds 4.40m; Eastern Bypass must be activated automatically."
                  value={newLessons}
                  onChange={(e) => setNewLessons(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-400 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newLocation.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
              >
                Commit to Retraining Base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
