import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRoute } from '../../context/RouteContext.tsx';
import { WebsiteVerification, DashboardStats } from '../../types.ts';
import { StatusBadge, RiskBadge } from '../common/StatusBadge.tsx';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Globe,
  FileCheck2
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { currentUser, token } = useAuth();
  const { navigate } = useRoute();

  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    verified: 0,
    underReview: 0,
    unverified: 0,
    riskDetected: 0,
    pending: 0
  });
  const [verifications, setVerifications] = useState<WebsiteVerification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/verifications', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([statsData, verifData]) => {
        if (statsData) setStats(statsData);
        if (verifData?.verifications) setVerifications(verifData.verifications);
      })
      .catch(err => console.error('Failed to load dashboard data', err))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{currentUser?.name}</span>. Manage your submitted domain verification records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dashboard-check-website-btn"
            onClick={() => navigate('/dashboard/check')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Check a Website</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Requests</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {stats.totalRequests}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {stats.verified}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Under Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {stats.underReview}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unverified</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-700 font-mono">
            {stats.unverified}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Risk Detected</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {stats.riskDetected}
          </div>
        </div>
      </div>

      {/* Recent Submissions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Recent Website Verifications
            </h2>
            <p className="text-xs text-slate-500">
              Domains submitted for verification queue processing
            </p>
          </div>
          {verifications.length > 0 && (
            <button
              onClick={() => navigate('/dashboard/verifications')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View all ({verifications.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading verifications...</div>
        ) : verifications.length === 0 ? (
          <div className="p-12 text-center space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No websites checked yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Submit your first website domain to create an independent trust verification record and receive a Verification ID.
            </p>
            <button
              onClick={() => navigate('/dashboard/check')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm"
            >
              Check a Website Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Normalized Domain</th>
                  <th className="px-6 py-3.5">Verification ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verifications.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono">
                      {v.normalizedDomain}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {v.verificationId}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={v.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge risk={v.riskLevel} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(v.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/verifications/${v.verificationId}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => navigate(`/verify/${v.verificationId}`)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-colors"
                          title="View Public Verification URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
