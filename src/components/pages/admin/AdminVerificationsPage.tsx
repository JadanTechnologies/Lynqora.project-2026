import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useRoute } from '../../../context/RouteContext.tsx';
import { WebsiteVerification, VerificationStatus, RiskLevel } from '../../../types.ts';
import { StatusBadge, RiskBadge } from '../../common/StatusBadge.tsx';
import { 
  Globe, 
  Search, 
  Filter, 
  ArrowLeft, 
  Edit3, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  X,
  RefreshCw,
  Clock
} from 'lucide-react';

export const AdminVerificationsPage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRoute();

  const [verifications, setVerifications] = useState<WebsiteVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Edit Modal State
  const [selectedVerif, setSelectedVerif] = useState<WebsiteVerification | null>(null);
  const [editStatus, setEditStatus] = useState<VerificationStatus>('PENDING');
  const [editRisk, setEditRisk] = useState<RiskLevel>('UNKNOWN');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchVerifications = () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (riskFilter !== 'ALL') params.set('riskLevel', riskFilter);

    fetch(`/api/admin/verifications?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.verifications) setVerifications(data.verifications);
      })
      .catch(err => console.error('Failed to list verifications', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, [token, statusFilter, riskFilter]);

  const handleOpenEdit = (v: WebsiteVerification) => {
    setSelectedVerif(v);
    setEditStatus(v.status);
    setEditRisk(v.riskLevel);
    setEditNotes(v.adminNotes || '');
    setSaveMessage('');
    setSaveError('');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerif) return;

    setSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const res = await fetch(`/api/admin/verifications/${selectedVerif.verificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          riskLevel: editRisk,
          adminNotes: editNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update verification status.');

      setSaveMessage('Verification record updated successfully.');
      fetchVerifications();
      setTimeout(() => {
        setSelectedVerif(null);
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || 'Error updating record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Website Verifications Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review submitted domains, assign trust statuses, and record administrative audit notes
            </p>
          </div>
          <button
            onClick={fetchVerifications}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 self-start sm:self-auto transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchVerifications();
          }}
          className="relative flex-1 w-full"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by domain, ID, or user email..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="RISK_DETECTED">Risk Detected</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-700"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading verification records...</div>
        ) : verifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No verifications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Normalized Domain</th>
                  <th className="px-6 py-3.5">Owner Email</th>
                  <th className="px-6 py-3.5">Verification ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono text-slate-900">
                      {v.normalizedDomain}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {v.userEmail || '—'}
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
                      {new Date(v.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Review / Edit</span>
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

      {/* Admin Status Review & Edit Modal */}
      {selectedVerif && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-950">
                  Review & Status Override
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedVerif.normalizedDomain} ({selectedVerif.verificationId})
                </p>
              </div>
              <button
                onClick={() => setSelectedVerif(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crucial Section 20 Distinction Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Manual Status Override:</span> You are setting manual review decisions. This status is recorded in the relational audit trail and explicitly distinguished from upcoming automated check pipelines.
              </div>
            </div>

            {saveMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMessage}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Verification Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as VerificationStatus)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="PENDING">PENDING — Awaiting queue review</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW — Active moderation</option>
                  <option value="VERIFIED">VERIFIED — ✓ Lynqora Verified</option>
                  <option value="UNVERIFIED">UNVERIFIED — Unable to verify</option>
                  <option value="RISK_DETECTED">RISK DETECTED — Safety or fraud warning</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Assigned Risk Level
                </label>
                <select
                  value={editRisk}
                  onChange={(e) => setEditRisk(e.target.value as RiskLevel)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="LOW">LOW RISK</option>
                  <option value="MEDIUM">MEDIUM RISK</option>
                  <option value="HIGH">HIGH RISK</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Internal Admin Notes <span className="text-slate-400 font-normal">(Private — Never displayed publicly)</span>
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Verified registrar match and verified domain administrative contact."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedVerif(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Updating...' : 'Save Decision & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
