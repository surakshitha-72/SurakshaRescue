import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  FileText,
  ShieldCheck,
  Activity,
  Flame,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  TrustedKnowledgeSource,
  KnowledgeChunk,
  RagRetrievalResult,
  PredictiveForecastResult,
  EnvironmentalTelemetry
} from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface AdminKnowledgeSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForecastUpdated?: (forecast: PredictiveForecastResult) => void;
}

export const AdminKnowledgeSourcesModal: React.FC<AdminKnowledgeSourcesModalProps> = ({
  isOpen,
  onClose,
  onForecastUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'rag' | 'prediction'>('sources');

  // Sources State
  const [sources, setSources] = useState<TrustedKnowledgeSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // New Source Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TrustedKnowledgeSource['category']>('Flood Alert');
  const [newTrustScore, setNewTrustScore] = useState<number>(10);
  const [newFeedType, setNewFeedType] = useState<TrustedKnowledgeSource['feedType']>('Official Bulletin');
  const [newDescription, setNewDescription] = useState<string>('');

  // RAG Query State
  const [ragQuery, setRagQuery] = useState<string>('Kosi river embankment breach water release 440000 cusecs');
  const [ragResults, setRagResults] = useState<RagRetrievalResult[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState<boolean>(false);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [briefingCitedSources, setBriefingCitedSources] = useState<any[]>([]);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<boolean>(false);

  // Environmental Predictive Engine State
  const [envParams, setEnvParams] = useState<EnvironmentalTelemetry>({
    rainfallMm: 185,
    flowVelocityMs: 3.4,
    upstreamReleaseCusecs: 442000,
    soilSaturationPct: 94,
    windSpeedKmh: 45
  });
  const [forecastResult, setForecastResult] = useState<PredictiveForecastResult | null>(null);
  const [isForecasting, setIsForecasting] = useState<boolean>(false);

  // Load sources on mount
  useEffect(() => {
    if (isOpen) {
      loadSources();
      handleRunPrediction();
    }
  }, [isOpen]);

  const loadSources = async () => {
    setIsLoadingSources(true);
    const data = await ApiClient.getTrustedSources();
    setSources(data);
    setIsLoadingSources(false);
  };

  // Add Trusted Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const added = await ApiClient.saveTrustedSource({
      name: newName.trim(),
      url: newUrl.trim(),
      category: newCategory,
      trustScore: Number(newTrustScore) || 10,
      feedType: newFeedType,
      description: newDescription.trim() || 'Official monitored authority'
    });

    if (added) {
      setNewName('');
      setNewUrl('');
      setNewDescription('');
      setShowAddForm(false);
      await loadSources();
      setSyncStatusMsg(`Added ${added.name} to trusted sources.`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Delete Trusted Source
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from trusted knowledge sources?`)) return;
    const ok = await ApiClient.deleteTrustedSource(id);
    if (ok) {
      await loadSources();
    }
  };

  // Trigger Knowledge Base Re-Sync
  const handleTriggerReSync = async (sourceId?: string) => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    const res = await ApiClient.syncKnowledgeBase(sourceId);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatusMsg(`Successfully synchronized! ${res.totalChunksAdded || res.chunksAdded || 4} vector-embedded chunks generated with Gemini.`);
      await loadSources();
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } else {
      setSyncStatusMsg(`Sync error: ${res.error || 'Failed to sync'}`);
    }
  };

  // Execute Prioritized RAG Retrieval
  const handleSearchRag = async () => {
    if (!ragQuery.trim()) return;
    setIsSearchingRag(true);
    const results = await ApiClient.retrieveRagContext(ragQuery.trim(), 4);
    setRagResults(results);
    setIsSearchingRag(false);
  };

  // Generate RAG Situation Briefing
  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    const data = await ApiClient.generateRagBriefing(ragQuery);
    setBriefingText(data.briefingText);
    setBriefingCitedSources(data.citedSources || []);
    setIsGeneratingBriefing(false);
  };

  // Run AI Environmental Predictive Engine
  const handleRunPrediction = async () => {
    setIsForecasting(true);
    const result = await ApiClient.generatePredictiveForecast(envParams);
    if (result) {
      setForecastResult(result);
      if (onForecastUpdated) onForecastUpdated(result);
    }
    setIsForecasting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2800] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                  RAG &amp; PREDICTIVE INTELLIGENCE
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Gemini Vector Embeddings &amp; Hybrid Ranking
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                Trusted Knowledge Sources &amp; AI Disaster Prediction Engine
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/90 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sources'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Trusted Knowledge Sources ({sources.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('rag');
              if (ragResults.length === 0) handleSearchRag();
            }}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rag'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Prioritized RAG Retrieval &amp; Briefings</span>
          </button>

          <button
            onClick={() => setActiveTab('prediction')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'prediction'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Environmental Predictive Engine (Gemini)</span>
          </button>
        </div>

        {/* Sync Alert Banner if active */}
        {syncStatusMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-700 px-5 py-2 text-xs font-semibold text-emerald-200 flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatusMsg}</span>
            </div>
            <button onClick={() => setSyncStatusMsg(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: TRUSTED KNOWLEDGE SOURCES & INGESTION                              */}
          {/* ========================================================================= */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Configured Authoritative Knowledge Sources</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sources are tagged with admin Trust Scores (1–10). High-trust feeds (IMD, CWC, NDMA) are weighted higher in the hybrid RAG retrieval pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerReSync()}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
                    title="Fetch and embed fresh bulletins from all active sources"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Ingesting Feeds...' : 'Sync All Feeds'}</span>
                  </button>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Source</span>
                  </button>
                </div>
              </div>

              {/* Add Source Form Drawer */}
              {showAddForm && (
                <form onSubmit={handleAddSource} className="bg-slate-950 p-4 rounded-2xl border border-cyan-700/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300">
                      Configure New Trusted Disaster Knowledge Feed
                    </h4>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Source Organization / Title *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. State Relief Commissioner Feed"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Source URL / API Endpoint *</label>
                      <input
                        type="url"
                        required
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://disaster-feed.gov.in/alerts"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Flood Alert">Flood Alert</option>
                        <option value="Embankment Report">Embankment Report</option>
                        <option value="Weather Warning">Weather Warning</option>
                        <option value="Hydrological Telemetry">Hydrological Telemetry</option>
                        <option value="Seismic Hazard">Seismic Hazard</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Feed Type</label>
                      <select
                        value={newFeedType}
                        onChange={(e) => setNewFeedType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Official Bulletin">Official Bulletin</option>
                        <option value="API">API (JSON / REST)</option>
                        <option value="RSS">RSS Feed</option>
                        <option value="Web">Web Scraper</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Source Trust Score: <strong className="text-amber-300 font-mono">{newTrustScore}/10</strong>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={newTrustScore}
                        onChange={(e) => setNewTrustScore(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition"
                    >
                      Save &amp; Ingest Chunks
                    </button>
                  </div>
                </form>
              )}

              {/* Sources List */}
              <div className="space-y-3">
                {sources.map(source => (
                  <div
                    key={source.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{source.name}</h4>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-semibold text-[10px]">
                          {source.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-bold text-[10px]">
                          Trust: {source.trustScore}/10
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {source.feedType}
                        </span>
                      </div>

                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-xl"
                      >
                        <span className="truncate">{source.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>

                      <p className="text-slate-400 text-xs">{source.description}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <div className="text-right mr-2 hidden sm:block">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Ingested {source.chunksCount || 0} Chunks
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {source.lastIngestedAt ? new Date(source.lastIngestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleTriggerReSync(source.id)}
                        disabled={isSyncing}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="Re-ingest this specific feed"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleDeleteSource(source.id, source.name)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                        title="Delete source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PRIORITIZED RAG RETRIEVAL & BRIEFING ENGINE                         */}
          {/* ========================================================================= */}
          {activeTab === 'rag' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>Prioritized Hybrid RAG Search &amp; Ranking Algorithm</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Score = (Semantic Similarity × 0.5) + (Normalized Source Trust × 0.3) + (Recency Decay × 0.2)
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateBriefing}
                    disabled={isGeneratingBriefing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingBriefing ? 'Synthesizing with Gemini...' : 'Generate Situation Briefing'}</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ragQuery}
                      onChange={(e) => setRagQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchRag()}
                      placeholder="Enter disaster query e.g. Kosi breach water release, culvert overflow..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={handleSearchRag}
                    disabled={isSearchingRag}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
                  >
                    {isSearchingRag ? 'Searching...' : 'Search RAG'}
                  </button>
                </div>
              </div>

              {/* Generated Briefing Card */}
              {briefingText && (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/60 shadow-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                      <Sparkles className="w-4 h-4" />
                      <span>Synthesized RAG Situation Briefing (Gemini 3.8 Flash)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Real-time Grounded</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {briefingText}
                  </p>

                  {/* Cited Sources with Click-Through Links */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Cited Grounded Sources:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {briefingCitedSources.map((cs, idx) => (
                        <a
                          key={idx}
                          href={cs.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition"
                        >
                          <span>{cs.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">({cs.trustScore}/10)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Retrieved Chunks with Hybrid Score Breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Ranked Retrieved Knowledge Chunks ({ragResults.length}):
                </span>

                {ragResults.map((item, idx) => (
                  <div
                    key={item.chunk.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-cyan-600 text-slate-950 font-bold font-mono text-[11px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-white">{item.chunk.title}</h4>
                      </div>

                      {/* Hybrid Score Indicator */}
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400 text-[11px]">Combined Rank:</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 text-xs">
                          {item.combinedScore.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                      {item.chunk.text}
                    </p>

                    {/* Score Formula Components Bar */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block">1. Semantic Similarity (50%)</span>
                        <strong className="text-cyan-400">{item.semanticScore} ({(item.semanticScore * 0.5).toFixed(3)})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">2. Source Trust (30%)</span>
                        <strong className="text-emerald-400">{item.normalizedTrustScore} ({(item.normalizedTrustScore * 0.3).toFixed(3)})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">3. Recency Decay (20%)</span>
                        <strong className="text-amber-300">{item.recencyScore} ({(item.recencyScore * 0.2).toFixed(3)})</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>Source: <strong>{item.chunk.sourceName}</strong> (Trust {item.chunk.sourceTrustScore}/10)</span>
                      <a
                        href={item.chunk.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Source Feed</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ENVIRONMENTAL PREDICTIVE ENGINE (GEMINI)                            */}
          {/* ========================================================================= */}
          {activeTab === 'prediction' && (
            <div className="space-y-5">
              {/* Parameter Sensitivity Sliders */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Environmental Telemetry &amp; Sensitivity Calibration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust real-time physical variables to test generative predictive forecasting and inundation ETA windows.
                    </p>
                  </div>

                  <button
                    onClick={handleRunPrediction}
                    disabled={isForecasting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer shrink-0"
                  >
                    <Activity className={`w-4 h-4 ${isForecasting ? 'animate-spin' : ''}`} />
                    <span>{isForecasting ? 'Calculating Inundation...' : 'Run AI Prediction'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Rainfall Volume */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Rainfall Volume</span>
                      <strong className="text-rose-400 font-bold">{envParams.rainfallMm} mm</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={300}
                      step={5}
                      value={envParams.rainfallMm}
                      onChange={(e) => setEnvParams(p => ({ ...p, rainfallMm: Number(e.target.value) }))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">Hazard Threshold: &gt;100 mm/3h</span>
                  </div>

                  {/* Flow Velocity */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">River Flow Velocity</span>
                      <strong className="text-amber-300 font-bold">{envParams.flowVelocityMs} m/s</strong>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={6.0}
                      step={0.1}
                      value={envParams.flowVelocityMs}
                      onChange={(e) => setEnvParams(p => ({ ...p, flowVelocityMs: Number(e.target.value) }))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">Erosion Cutoff: &gt;2.8 m/s</span>
                  </div>

                  {/* Upstream Release */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Upstream Barrage Release</span>
                      <strong className="text-cyan-300 font-bold">{envParams.upstreamReleaseCusecs.toLocaleString()} cusecs</strong>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={600000}
                      step={10000}
                      value={envParams.upstreamReleaseCusecs}
                      onChange={(e) => setEnvParams(p => ({ ...p, upstreamReleaseCusecs: Number(e.target.value) }))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">Emergency Breach Threshold: &gt;400k cusecs</span>
                  </div>

                  {/* Soil Saturation */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Soil Saturation Index</span>
                      <strong className="text-emerald-400 font-bold">{envParams.soilSaturationPct}%</strong>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      step={2}
                      value={envParams.soilSaturationPct}
                      onChange={(e) => setEnvParams(p => ({ ...p, soilSaturationPct: Number(e.target.value) }))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">Impervious Runoff: &gt;85%</span>
                  </div>

                  {/* Sustained Wind Speed */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Sustained Wind Speed</span>
                      <strong className="text-white font-bold">{envParams.windSpeedKmh} km/h</strong>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      step={5}
                      value={envParams.windSpeedKmh}
                      onChange={(e) => setEnvParams(p => ({ ...p, windSpeedKmh: Number(e.target.value) }))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">Gale Warning: &gt;50 km/h</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Generated Predictive Forecast Display */}
              {forecastResult && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-2 border-rose-600/70 shadow-2xl space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-rose-800/60">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shrink-0">
                        <Flame className="w-7 h-7 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-xs uppercase tracking-wider">
                            {forecastResult.alertLevel}
                          </span>
                          <span className="text-xs text-rose-300 font-mono font-semibold">
                            Disaster Risk Score: <strong>{forecastResult.riskScore}%</strong>
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight mt-1">
                          Inundation Impact ETA: {forecastResult.inundationWindow}
                        </h4>
                      </div>
                    </div>

                    <div className="bg-slate-950/90 px-4 py-2 rounded-xl border border-rose-800 text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">Estimated Breach Moment</span>
                      <strong className="text-amber-300 font-mono text-base font-bold">~{forecastResult.impactEtaTimestamp}</strong>
                    </div>
                  </div>

                  {/* Hydrological Rationale */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <span className="font-bold text-cyan-300 block mb-1 font-mono text-xs uppercase tracking-wider">
                      Hydrological AI Rationale:
                    </span>
                    {forecastResult.rationale}
                  </div>

                  {/* Recommended Preventive Actions */}
                  <div className="space-y-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-300 block font-mono">
                      Recommended Immediate Preventive Directives:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {forecastResult.recommendedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cited Authoritative Grounding Sources */}
                  <div className="pt-3 border-t border-rose-900/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">Authoritative Ingested Citations:</span>
                    {forecastResult.citedSources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800 text-[11px] font-semibold hover:border-cyan-500 transition"
                      >
                        <span>{source.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
