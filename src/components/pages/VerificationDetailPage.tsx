import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRoute } from '../../context/RouteContext.tsx';
import { WebsiteVerification, VerificationCheck } from '../../types.ts';
import { StatusBadge, RiskBadge } from '../common/StatusBadge.tsx';
import { 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Copy, 
  Check, 
  Info,
  AlertCircle
} from 'lucide-react';

export const VerificationDetailPage: React.FC = () => {
  const { token, isAdmin } = useAuth();
  const { params, navigate } = useRoute();
  const verificationId = params.verificationId;

  const [verification, setVerification] = useState<WebsiteVerification | null>(null);
  const [checks, setChecks] = useState<VerificationCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!verificationId || !token) return;

    setLoading(true);
    setError('');

    fetch(`/api/verifications/${verificationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Verification record not found.');
        }
        return res.json();
      })
      .then((data) => {
        setVerification(data.verification);
        setChecks(data.checks || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load details.');
      })
      .finally(() => setLoading(false));
  }, [verificationId, token]);

  const handleCopyPublicUrl = () => {
    const url = `${window.location.origin}/verify/${verificationId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading verification details...
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Record Not Available</h3>
        <p className="text-xs text-slate-500">{error || 'Verification not found.'}</p>
        <button
          onClick={() => navigate('/dashboard/verifications')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Back to My Verifications
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/verifications')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Verifications
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/verify/${verification.verificationId}`)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            <span>Open Public Record</span>
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              <h1 className="text-2xl font-extrabold text-slate-950 font-mono">
                {verification.normalizedDomain}
              </h1>
              {verification.websiteUrl && (
                <a
                  href={verification.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Verification ID: <span className="font-bold text-slate-800">{verification.verificationId}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={verification.status} size="lg" />
            <RiskBadge risk={verification.riskLevel} size="md" />
          </div>
        </div>

        {/* Telemetry metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
              Submission Timestamp
            </span>
            <div className="font-medium text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(verification.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
              Verified Date
            </span>
            <div className="font-medium text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : 'Awaiting Review'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
              Public Link
            </span>
            <button
              onClick={handleCopyPublicUrl}
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Verification URL'}</span>
            </button>
          </div>
        </div>

        {/* Phase 1 Explanatory Card */}
        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/60 text-xs text-sky-900 leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Review Status:</span> Your domain is currently registered with status <span className="font-semibold text-slate-900">{verification.status.replace('_', ' ')}</span>. In Phase 1, verification checks establish the database schema and public verification URL. Advanced automated checks are scheduled for deployment in Phase 2.
          </div>
        </div>
      </div>

      {/* Verification Checks List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Scheduled Verification Checks
            </h2>
            <p className="text-xs text-slate-500">
              Structural validation checkpoints tracked for {verification.normalizedDomain}
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {checks.length} Checks
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {checks.map((c) => (
            <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  {c.checkType.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                  {c.details}
                </div>
              </div>
              <StatusBadge status={c.status} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
