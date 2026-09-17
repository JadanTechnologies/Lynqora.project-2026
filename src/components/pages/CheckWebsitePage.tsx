import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRoute } from '../../context/RouteContext.tsx';
import { normalizeDomain, validateDomain, formatWebsiteUrl } from '../../lib/domain.ts';
import { 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  AlertCircle, 
  Globe, 
  Info, 
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const CheckWebsitePage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRoute();

  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if domain was passed from landing hero or search
  useEffect(() => {
    const prefill = sessionStorage.getItem('lynqora_prefill_domain');
    if (prefill) {
      setInputUrl(prefill);
      sessionStorage.removeItem('lynqora_prefill_domain');
    }
  }, []);

  const normalized = normalizeDomain(inputUrl);
  const formattedUrl = formatWebsiteUrl(inputUrl);
  const validation = inputUrl.trim() ? validateDomain(inputUrl) : { isValid: true };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError('Please enter a website URL or domain name.');
      return;
    }

    const check = validateDomain(inputUrl);
    if (!check.isValid) {
      setError(check.error || 'Please enter a valid domain format.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: inputUrl.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit website verification.');
      }

      // Successfully created verification record, navigate to its detail view
      navigate(`/dashboard/verifications/${data.verification.verificationId}`);
    } catch (err: any) {
      setError(err.message || 'Submission error. Please check the domain and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
          Check a Website
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Initiate a new trust and authenticity record for any website domain.
        </p>
      </div>

      {/* Main Submission Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Website URL or Domain
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="check-website-url-input"
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. example.com or https://myshop.org"
                className={`w-full pl-10 pr-4 py-3 text-sm text-slate-900 border rounded-xl focus:outline-none focus:ring-2 font-mono transition-colors ${
                  inputUrl.trim() && !validation.isValid
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-sky-500 bg-slate-50/30'
                }`}
              />
            </div>
            {inputUrl.trim() && !validation.isValid && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">
                {validation.error}
              </p>
            )}
          </div>

          {/* Real-time Normalization Preview Box */}
          {inputUrl.trim() && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                Domain Normalization Telemetry
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Normalized Domain</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {normalized || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Canonical URL</span>
                  <span className="font-mono text-slate-700 text-xs truncate block">
                    {formattedUrl || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Clear explanatory notice as mandated in prompt */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/60 text-xs text-sky-900 leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Phase 1 Foundation:</span> Submitting a website creates an official verification record and assigns a human-readable Verification ID (e.g. LQ-2026-XXXXXX). Initial records enter <span className="font-semibold text-slate-900">Under Review</span> queue status. Advanced automated checks will run in future phases.
            </div>
          </div>

          <button
            id="submit-verification-btn"
            type="submit"
            disabled={loading || (inputUrl.trim().length > 0 && !validation.isValid)}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Start Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
