import React, { useState } from 'react';
import { ShieldCheck, Download, Filter, Search, User, Terminal } from 'lucide-react';
import { AuditLog } from '../types/disaster';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = auditLogs.filter(log => {
    const matchesCat = filterCategory === 'ALL' || log.category === filterCategory;
    const matchesQuery = !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `disaster_ops_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Immutable Decision &amp; Action Audit Trail</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 font-mono">
              TAMPER EVIDENT LOG
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographically sealed timeline of all automated predictions, multi-team shelter reservations, route recalculations, alert broadcasts, and human command overrides.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-md text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, user actors, justifications, or target IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
          {(['ALL', 'SYSTEM', 'RESERVATION', 'ALERT', 'ROUTE', 'OVERRIDE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition border text-xs whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Action / Event</th>
                <th className="p-3.5">Authorized Actor</th>
                <th className="p-3.5">Event Details &amp; Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((log) => {
                let catBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                if (log.category === 'OVERRIDE') catBadge = 'bg-amber-950 text-amber-300 border-amber-800 font-bold';
                else if (log.category === 'RESERVATION') catBadge = 'bg-blue-950 text-blue-300 border-blue-800';
                else if (log.category === 'ALERT') catBadge = 'bg-rose-950 text-rose-300 border-rose-800';
                else if (log.category === 'ROUTE') catBadge = 'bg-cyan-950 text-cyan-300 border-cyan-800';

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap text-xs">
                      {log.timestamp}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-mono border ${catBadge}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-200">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.user}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400 text-xs max-w-md">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed font-sans">
                        {log.details}
                      </div>
                    </td>
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
