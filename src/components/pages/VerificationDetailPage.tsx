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
  AlertCircle,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Server,
  Shield,
  Link,
  Mail,
  FileText,
  Lock,
  Globe as GlobeIcon
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
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState('');
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  const loadDetails = async () => {
    if (!verificationId || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/verifications/${verificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Verification record not found.');
      }
      const data = await res.json();
      setVerification(data.verification);
      setChecks(data.checks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetails(); }, [verificationId, token]);

  const handleRunVerification = async () => {
    if (!token) return;
    setRunning(true);
    setRunMessage('');
    try {
      const res = await fetch(`/api/verifications/${verificationId}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run verification.');
      setRunMessage(`Verification completed. Score: ${data.score}/100`);
      await loadDetails();
    } catch (err: any) {
      setRunMessage(err.message || 'Verification failed.');
    } finally {
      setRunning(false);
    }
  };

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

        {/* Technical Verification Score */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `conic-gradient(#3b82f6 ${(verification.score || 0) * 1}%, #e5e7eb ${(verification.score || 0) * 1}%)` }}
          >
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col">
              <span className="text-xl font-extrabold text-slate-900 font-mono">{verification.score || 0}</span>
              <span className="text-[10px] text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-slate-900">Technical Verification Score</h3>
            <p className="text-xs text-slate-500 mt-1">
              This score summarizes available technical signals. It is not a guarantee that a website, business, or transaction is safe.
            </p>
            {runMessage && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">{runMessage}</p>
            )}
          </div>
          <button
            onClick={handleRunVerification}
            disabled={running}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {running ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {running ? 'Running...' : 'Run Verification Again'}
          </button>
        </div>
        {/* Important Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Important Notice:</span> Lynqora verification results represent available technical and identity signals at the time of checking. They are not a guarantee against fraud, scams, malware, or financial loss. Website conditions can change.
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
            <div key={c.id}>
              <button
                onClick={() => setExpandedCheck(expandedCheck === c.id ? null : c.id)}
                className="w-full py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-slate-50/50 transition-colors px-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} size="sm" />
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{c.checkType.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-500 max-w-lg leading-relaxed">{c.result || c.details}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{c.score || 0}pts</span>
                  {expandedCheck === c.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {expandedCheck === c.id && (
                <div className="ml-4 mr-2 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
                  <div className="font-semibold text-slate-700">Details</div>
                  <p className="text-slate-600">{c.details || c.result}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
