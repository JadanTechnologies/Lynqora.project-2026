import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useRoute } from '../../../context/RouteContext.tsx';
import { AuditLog } from '../../../types.ts';
import { 
  FileText, 
  Search, 
  Filter, 
  ArrowLeft, 
  RefreshCw, 
  ShieldAlert, 
  Code, 
  X,
  Clock,
  Terminal
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRoute();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter !== 'ALL') params.set('action', actionFilter);
    params.set('limit', '100');

    fetch(`/api/admin/audit-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.logs) setLogs(data.logs);
      })
      .catch(err => console.error('Failed to load audit logs', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [token, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Console
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable relational records of all platform actions, security events, and status transitions
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 self-start sm:self-auto transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-700"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="REGISTER">REGISTER</option>
            <option value="VERIFICATION_CREATED">VERIFICATION_CREATED</option>
            <option value="VERIFICATION_STATUS_CHANGED">VERIFICATION_STATUS_CHANGED</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_REACTIVATED">USER_REACTIVATED</option>
            <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {logs.length} logged events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No audit events match filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">User Email</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Entity</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-sans font-semibold text-slate-900">
                      {log.userEmail || 'System'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {log.entityType}: <span className="text-slate-900 font-bold">{log.entityId}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      {log.metadata ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-sans font-medium"
                        >
                          View JSON
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Metadata Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white font-mono">
                  {selectedLog.action} Metadata
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto font-mono text-xs text-sky-300">
              <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
              <span>Event ID: {selectedLog.id}</span>
              <span>{new Date(selectedLog.createdAt).toISOString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
