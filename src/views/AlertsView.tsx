import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  Radio,
  Users,
  ShieldCheck,
  Megaphone,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { DisasterAlert, AlertNotification, Habitation } from '../types/disaster';
import { ApiClient } from '../services/apiClient';

interface AlertsViewProps {
  alerts: DisasterAlert[];
  notifications: AlertNotification[];
  habitations: Habitation[];
  onRefreshState: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  notifications,
  habitations,
  onRefreshState
}) => {
  // Broadcast Form
  const [selectedHabId, setSelectedHabId] = useState<string>(habitations[0]?.id || 'hab-1');
  const [recipientType, setRecipientType] = useState<string>('COMMUNITY');
  const [channel, setChannel] = useState<string>('SMS');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(true);
  const [customMsg, setCustomMsg] = useState<string>(
    'FLASH FLOOD RED ALERT: Evacuate immediately toward Safe Shelter A via High Embankment. Water levels rising rapidly.'
  );

  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  const handleBroadcast = async () => {
    setIsSending(true);
    setSendSuccessMsg(null);

    const res = await ApiClient.sendNotification({
      habitationId: selectedHabId,
      recipientType,
      channel,
      message: customMsg,
      simulateFailure
    });

    if (res) {
      if (res.deliveryStatus === 'FAILED') {
        setSendSuccessMsg(
          `⚠️ Primary ${channel} Broadcast Failed. Automatic Fallback Activated: ${res.fallbackVolunteerName} deployed for door-to-door physical alert!`
        );
      } else {
        setSendSuccessMsg(`✓ Alert successfully delivered across ${channel} to all registered recipients.`);
      }
    }

    setIsSending(false);
    onRefreshState();
  };

  const handleVerifyAlert = async (alertId: string, action: 'VERIFY' | 'REJECT' | 'CONVERT_TO_EVENT') => {
    await ApiClient.verifyAlert(alertId, action, 'Incident Duty Commander');
    onRefreshState();
  };

  const handleCompleteVolunteer = async (notifId: string) => {
    await ApiClient.completeVolunteerContact(notifId);
    onRefreshState();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Alert Generation, Verification &amp; Fallback Dispatch</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold border border-rose-800 font-mono">
              CAP COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Multi-tier Common Alerting Protocol dispatch (SMS, Siren, WhatsApp, VHF). Features automatic door-to-door volunteer fallback if cellular networks fail.
          </p>
        </div>

        <button
          onClick={onRefreshState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Broadcast Result Banner */}
      {sendSuccessMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-md ${
          sendSuccessMsg.includes('Failed')
            ? 'bg-rose-950/80 border-rose-600 text-rose-200'
            : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
        }`}>
          <span>{sendSuccessMsg}</span>
          <button onClick={() => setSendSuccessMsg(null)} className="text-slate-400 hover:text-white text-sm font-bold ml-2">✕</button>
        </div>
      )}

      {/* Grid: Broadcast Creator + Incoming Alerts for Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Broadcast Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>Targeted Emergency Broadcast</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">CAP PROTOCOL</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Habitation:</label>
              <select
                value={selectedHabId}
                onChange={(e) => setSelectedHabId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-400"
              >
                {habitations.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.vulnerabilityLevel} - Pop: {h.demographics.total.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recipient Category:</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-400"
                >
                  <option value="COMMUNITY">Local Community Residents</option>
                  <option value="RESCUE_TEAMS">Field Rescue Teams</option>
                  <option value="VOLUNTEERS">Civil Defence Volunteers</option>
                  <option value="AUTHORITY">Disaster Mgmt Authority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Broadcast Channel:</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-400"
                >
                  <option value="SMS">SMS Cellular Broadcast</option>
                  <option value="WHATSAPP">WhatsApp Alert Group</option>
                  <option value="SIREN_PA">Community Siren / PA Tower</option>
                  <option value="VHF_RADIO">VHF Tactical Radio Net</option>
                  <option value="VOLUNTEER_NETWORK">Civil Defence Door-to-Door</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mandatory Alert Message Body:</label>
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full h-20 bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-400 text-xs"
              />
            </div>

            {/* Test Toggle for Failure Simulation */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block text-xs">Simulate Low-Connectivity Outage:</span>
                <span className="text-[11px] text-slate-400">
                  Activates door-to-door volunteer network if cell towers fail
                </span>
              </div>
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleBroadcast}
              disabled={isSending}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Transmitting Over CAP Protocol...' : 'Transmit Priority Alert'}</span>
            </button>
          </div>
        </div>

        {/* Right: Real-Time Notification Log & Fallback Status (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider font-mono">Transmission Audit</span>
              <h3 className="font-bold text-sm text-white mt-0.5">Live Alert Delivery &amp; Volunteer Fallback Log</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {notifications.length} Records
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {notifications.map((n) => {
              const isFailed = n.deliveryStatus === 'FAILED';
              const isDelivered = n.deliveryStatus === 'DELIVERED';
              const isCompleted = n.deliveryStatus === 'MANUAL_CONTACT_COMPLETED';

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs ${
                    isFailed
                      ? 'bg-rose-950/30 border-rose-800'
                      : isCompleted
                      ? 'bg-emerald-950/30 border-emerald-800'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border font-mono ${
                        isFailed
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : isCompleted
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border-blue-800'
                      }`}>
                        {n.deliveryStatus.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{n.channel} · {n.timestamp}</span>
                    </div>
                    <span className="font-semibold text-slate-200">{n.habitationName}</span>
                  </div>

                  <p className="text-slate-300 text-xs mb-2.5 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    "{n.message}"
                  </p>

                  {/* Fallback Display if Delivery Failed */}
                  {n.fallbackTriggered && (
                    <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-200 text-xs space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <Users className="w-3.5 h-3.5" />
                        <span>Offline Fallback Active: Door-to-Door Physical Warning</span>
                      </div>
                      <p>
                        Assigned Volunteer: <strong className="text-white">{n.fallbackVolunteerName}</strong>
                      </p>
                      {n.deliveryStatus !== 'MANUAL_CONTACT_COMPLETED' ? (
                        <button
                          onClick={() => handleCompleteVolunteer(n.id)}
                          className="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition"
                        >
                          Confirm Physical Contact Completed
                        </button>
                      ) : (
                        <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Physical warning confirmed delivered in person.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incoming Alerts Verification Workflow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">Multi-Source Verification</span>
            <h3 className="font-bold text-sm text-white mt-0.5">Incoming Unverified Hazard Reports</h3>
          </div>
          <span className="text-xs text-slate-400">Requires Incident Commander Authorization</span>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border font-mono ${
                    alert.status === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {alert.status}
                  </span>
                  <span className="font-bold text-white text-sm">{alert.title}</span>
                  <span className="text-slate-400 text-xs">Source: <strong className="text-slate-200">{alert.source}</strong></span>
                </div>
                <p className="text-slate-300 text-xs mb-1.5 leading-relaxed">{alert.description}</p>
                <div className="text-slate-400 text-[11px] font-mono">
                  Target: {alert.targetHabitationName} · Timestamp: {alert.timestamp}
                </div>
              </div>

              {alert.status === 'UNVERIFIED' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleVerifyAlert(alert.id, 'VERIFY')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                  >
                    Verify &amp; Broadcast
                  </button>
                  <button
                    onClick={() => handleVerifyAlert(alert.id, 'REJECT')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    Reject Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
