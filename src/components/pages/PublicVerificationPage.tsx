import React, { useEffect, useState } from 'react';
import { useRoute } from '../../context/RouteContext.tsx';
import { PublicVerificationDetails } from '../../types.ts';
import { StatusBadge, RiskBadge } from '../common/StatusBadge.tsx';
import { 
  ShieldCheck, 
  Globe, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  Search, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export const PublicVerificationPage: React.FC = () => {
  const { params, navigate } = useRoute();
  const verificationId = params.verificationId;

  const [data, setData] = useState<PublicVerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!verificationId) {
      setError('Verification ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    fetch(`/api/public/verifications/${verificationId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Verification record not found.');
        }
        return res.json();
      })
      .then((resData: PublicVerificationDetails) => {
        setData(resData);
      })
      .catch((err) => {
        setError(err.message || 'Unable to retrieve verification record.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [verificationId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLookupOther = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/verify/${searchQuery.trim().toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">Retrieving official Lynqora public record...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Record Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            No public verification record exists matching ID <span className="font-mono font-bold text-slate-800">{verificationId}</span>. The record may have expired or was typed incorrectly.
          </p>

          <form onSubmit={handleLookupOther} className="space-y-3 pt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. LQ-2026-8F72K4)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-center"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Lookup Verification ID
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            Independent Public Verification Audit
          </span>
        </div>

        {/* Main Public Verification Certificate Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            data.status === 'VERIFIED' ? 'bg-emerald-500' :
            data.status === 'UNDER_REVIEW' ? 'bg-amber-500' :
            data.status === 'RISK_DETECTED' ? 'bg-rose-500' : 'bg-sky-500'
          }`} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-400" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
                  {data.domain}
                </h1>
                {data.websiteUrl && (
                  <a
                    href={data.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Visit site in external tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Public Lynqora Domain Trust & Verification Record
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} size="lg" />
              <RiskBadge risk={data.riskLevel} size="md" />
            </div>
          </div>

          {/* Verification Record Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
            <div>
              <div className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                Verification Identifier
              </div>
              <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{data.verificationId}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  title="Copy verification link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                Date Submitted
              </div>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(data.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                Expiration / Validity
              </div>
              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {data.expiresAt 
                    ? new Date(data.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : (data.status === 'VERIFIED' ? 'Active 1 Year' : 'Pending Verification Review')}
                </span>
              </div>
            </div>
          </div>

          {/* Share / Copy Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <span className="text-slate-500">
              Share or link to this public verification:
            </span>
            <button
              id="copy-verification-link-btn"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Verification URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Checkpoint Architecture (9 checks) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Verification Checkpoints
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Structural telemetry and validation categories evaluated by Lynqora
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-sky-50 text-sky-800 border border-sky-100">
              <Info className="w-3 h-3" /> Phase 1 Foundation
            </span>
          </div>

          {/* Phase 1 Disclaimer Notice */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice regarding automated checks:</span> Phase 1 establishes the relational database records, persistent token system, and public registry. Advanced automated checks (WHOIS analysis, DNS challenges, malware feeds) are scheduled for deployment in Phase 2.
            </div>
          </div>

          {/* Check List Grid */}
          <div className="divide-y divide-slate-100">
            {data.checks.map((check, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <span>{check.checkType.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                    {check.details}
                  </p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={check.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Integrity Disclaimer */}
        <div className="p-5 rounded-2xl bg-slate-100 text-slate-600 text-xs leading-relaxed space-y-2 border border-slate-200">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            Zero-Leak Public Security Architecture
          </div>
          <p>
            Lynqora strictly sanitizes public records. No private account information, owner contact details, internal moderator notes, or network telemetry are exposed on this public URL. All verification tokens are generated using cryptographically pseudorandom strings to prevent enumeration attacks.
          </p>
        </div>
      </div>
    </div>
  );
};
