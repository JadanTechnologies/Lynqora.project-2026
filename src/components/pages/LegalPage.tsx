import React from 'react';
import { useRoute } from '../../context/RouteContext.tsx';
import { ShieldCheck, ArrowLeft, Lock, FileText, Globe, Mail } from 'lucide-react';

export const LegalPage: React.FC<{ type: 'privacy' | 'terms' | 'security' | 'contact' }> = ({ type }) => {
  const { navigate } = useRoute();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
          {type === 'privacy' && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">Privacy Policy</h1>
                  <p className="text-xs text-slate-400">Effective September 2026</p>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
              <p>
                Lynqora collects domain names submitted for verification, user account credentials (name, email address, password hashes), and technical access logs for system security and auditability. We store only cryptographic password hashes (bcrypt) and never have access to plain-text passwords.
              </p>

              <h3 className="text-base font-bold text-slate-900">2. Public vs. Private Data</h3>
              <p>
                Public verification certificates (<span className="font-mono text-xs text-slate-800">/verify/LQ-...</span>) strictly display normalized domains, verification identifiers, and overall validation status. Internal administrative notes, submitter account emails, and IP addresses are completely isolated and never exposed publicly.
              </p>

              <h3 className="text-base font-bold text-slate-900">3. Zero Data Brokering</h3>
              <p>
                Lynqora does not sell, lease, or monetize personal user data or search telemetry to third-party advertising networks.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">Terms of Service</h1>
                  <p className="text-xs text-slate-400">Last updated September 2026</p>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">1. Verification Scope & Disclaimer</h3>
              <p>
                Lynqora provides website verification and domain trust signals based on available registrar records, ownership verification, and security telemetry. Lynqora does not guarantee that a verified website is completely free from risk or malicious behavior. Users must exercise independent judgment when conducting transactions online.
              </p>

              <h3 className="text-base font-bold text-slate-900">2. Acceptable Use</h3>
              <p>
                Users agree not to submit fraudulent domains, attempt automated enumeration of verification identifiers, or use Lynqora to promote illegal activities. Violation of these terms will result in immediate account suspension and revocation of verification records.
              </p>
            </>
          )}

          {type === 'security' && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">Security Architecture</h1>
                  <p className="text-xs text-slate-400">Lynqora Trust Standards</p>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">1. Cryptographic Identifiers</h3>
              <p>
                Verification tokens (e.g., <span className="font-mono text-xs">LQ-2026-8F72K4</span>) utilize cryptographic randomness to resist brute-force enumeration attacks and predictive ID generation.
              </p>

              <h3 className="text-base font-bold text-slate-900">2. Audit Logging</h3>
              <p>
                Every administrative status modification, security event, and verification request is logged to an immutable relational audit trail with IP address and user provenance.
              </p>

              <h3 className="text-base font-bold text-slate-900">3. Password Security</h3>
              <p>
                User passwords are salted and hashed using bcrypt with 10 rounds of computational complexity. Passwords are never logged or stored in plain text.
              </p>
            </>
          )}

          {type === 'contact' && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">Contact & Support</h1>
                  <p className="text-xs text-slate-400">Get in touch with the Lynqora team</p>
                </div>
              </div>

              <p>
                Have questions regarding website verification, domain challenges, or trust records? We are here to assist.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-800">Support Inquiries:</div>
                <div className="font-mono text-sky-700">support@lynqora.com</div>
                <div className="font-semibold text-slate-800 pt-2">Security & Abuse Reports:</div>
                <div className="font-mono text-rose-700">security@lynqora.com</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
