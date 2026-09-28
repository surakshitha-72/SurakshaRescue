import React, { useState } from 'react';
import { History, BookOpen, Brain, ShieldCheck, Database } from 'lucide-react';
import { KnowledgeBaseView } from './KnowledgeBaseView';
import { ContinuousLearningView } from './ContinuousLearningView';
import { AuditLogsView } from './AuditLogsView';
import { DataSourcesView } from './DataSourcesView';
import {
  KnowledgeBaseRecord,
  ModelVersion,
  DataSourceStatus,
  AuditLog
} from '../types/disaster';

interface HistoryHubViewProps {
  knowledgeBase: KnowledgeBaseRecord[];
  modelVersions: ModelVersion[];
  dataSources: DataSourceStatus[];
  auditLogs: AuditLog[];
  onRefreshState: () => void;
}

export const HistoryHubView: React.FC<HistoryHubViewProps> = ({
  knowledgeBase,
  modelVersions,
  dataSources,
  auditLogs,
  onRefreshState
}) => {
  const [subTab, setSubTab] = useState<'knowledge' | 'learning' | 'audit' | 'sources'>('knowledge');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-100 font-sans">
      {/* Top Hub Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md font-bold shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Disaster History &amp; Operational Audit</h2>
            <p className="text-xs text-slate-400 mt-0.5">Past rescue operations, continuous model weights, telemetry sources, and audit trace</p>
          </div>
        </div>

        {/* Sub-tab segmented control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubTab('knowledge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'knowledge'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => setSubTab('learning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'learning'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Model Retraining</span>
          </button>

          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setSubTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'sources'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Sources</span>
          </button>
        </div>
      </div>

      {/* Views */}
      {subTab === 'knowledge' && (
        <KnowledgeBaseView
          records={knowledgeBase}
          onRefreshState={onRefreshState}
        />
      )}
      {subTab === 'learning' && (
        <ContinuousLearningView
          modelVersions={modelVersions}
          onRefreshState={onRefreshState}
        />
      )}
      {subTab === 'audit' && (
        <AuditLogsView auditLogs={auditLogs} />
      )}
      {subTab === 'sources' && (
        <DataSourcesView
          dataSources={dataSources}
          onRefreshState={onRefreshState}
        />
      )}
    </div>
  );
};
