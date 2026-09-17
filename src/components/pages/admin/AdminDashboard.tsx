import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useRoute } from '../../../context/RouteContext.tsx';
import { AdminStats, AuditLog } from '../../../types.ts';
import { 
  ShieldAlert, 
  Users, 
  Globe, 
  FileText, 
  Settings as SettingsIcon, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token, currentUser } = useAuth();
  const { navigate } = useRoute();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([statsData, logsData]) => {
        if (statsData) setStats(statsData);
        if (logsData?.logs) setRecentLogs(logsData.logs);
      })
      .catch(err => console.error('Failed to load admin stats', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold font-mono uppercase tracking-wider">
              {currentUser?.role} Console
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-mono">Phase 1 Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            System Administration
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Modules Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/admin/verifications')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Verifications</h3>
          <p className="text-xs text-slate-500 mt-0.5">Review, verify, and flag submitted domains</p>
          <div className="mt-4 font-mono font-bold text-xl text-slate-900">
            {stats ? stats.totalRequests : '—'} <span className="text-xs text-slate-400 font-sans font-normal">total</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">User Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage accounts, roles, and suspensions</p>
          <div className="mt-4 font-mono font-bold text-xl text-slate-900">
            {stats ? stats.totalUsers : '—'} <span className="text-xs text-slate-400 font-sans font-normal">users</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/audit-logs')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Audit Logs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail of all platform operations</p>
          <div className="mt-4 font-mono font-bold text-xl text-slate-900">
            Security <span className="text-xs text-emerald-600 font-sans font-medium">● Logging active</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/settings')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">System Settings</h3>
          <p className="text-xs text-slate-500 mt-0.5">Global submission toggles and verification policy</p>
          <div className="mt-4 font-mono font-bold text-xl text-slate-900">
            System <span className="text-xs text-sky-600 font-sans font-medium">Configurable</span>
          </div>
        </button>
      </div>

      {/* Verifications Status Breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Verification Queue Distribution
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 text-center">
              <span className="text-[11px] font-semibold text-sky-700 block">Pending</span>
              <span className="text-xl font-bold font-mono text-sky-900">{stats.pending}</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
              <span className="text-[11px] font-semibold text-amber-700 block">Under Review</span>
              <span className="text-xl font-bold font-mono text-amber-900">{stats.underReview}</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 block">Verified</span>
              <span className="text-xl font-bold font-mono text-emerald-900">{stats.verified}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-700 block">Unverified</span>
              <span className="text-xl font-bold font-mono text-slate-800">{stats.unverified}</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-center">
              <span className="text-[11px] font-semibold text-rose-700 block">Risk Detected</span>
              <span className="text-xl font-bold font-mono text-rose-900">{stats.riskDetected}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent System Audit Activity Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Live Audit Log Telemetry
            </h2>
          </div>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                  {log.action}
                </span>
                <div>
                  <span className="font-semibold text-slate-900">{log.userEmail}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">{log.entityType}: {log.entityId}</span>
                </div>
              </div>
              <div className="text-slate-400 text-[11px] font-mono shrink-0">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
