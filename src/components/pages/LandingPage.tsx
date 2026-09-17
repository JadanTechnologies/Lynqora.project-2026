import React, { useState } from 'react';
import { useRoute } from '../../context/RouteContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { normalizeDomain, validateDomain } from '../../lib/domain.ts';
import { 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Eye, 
  Server, 
  ChevronDown, 
  ExternalLink,
  Shield,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Globe
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRoute();
  const { currentUser } = useAuth();
  const [quickInput, setQuickInput] = useState('');
  const [quickError, setQuickError] = useState('');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      setQuickError('Please enter a website or domain.');
      return;
    }

    const validation = validateDomain(quickInput);
    if (!validation.isValid) {
      setQuickError(validation.error || 'Invalid domain format.');
      return;
    }

    setQuickError('');
    if (currentUser) {
      // Store in session storage so CheckWebsitePage picks it up
      sessionStorage.setItem('lynqora_prefill_domain', quickInput.trim());
      navigate('/dashboard/check');
    } else {
      sessionStorage.setItem('lynqora_prefill_domain', quickInput.trim());
      navigate('/register');
    }
  };

  const faqs = [
    {
      q: 'What is Lynqora?',
      a: 'Lynqora is an independent website trust and verification platform. It allows visitors, businesses, and developers to verify domain records, view transparent verification statuses, and validate authenticity before interacting or transacting online.'
    },
    {
      q: 'Can Lynqora detect every scam website?',
      a: 'No automated or manual system can promise 100% scam detection. Lynqora provides verifiable domain ownership records, operational telemetry, and transparent review checkpoints. We do not make unrealistic security guarantees, but rather give you verified factual trust signals.'
    },
    {
      q: 'What does "Verified" mean in Lynqora?',
      a: 'A "Verified" status indicates that the domain ownership has been cryptographically confirmed, administrative records have undergone structured review, and the domain meets all baseline operational transparency standards established by Lynqora.'
    },
    {
      q: 'Can I submit and verify my own business website?',
      a: 'Yes. In Phase 1, any registered user can submit website domains to create a persistent verification record and track its review status. Phase 2 and 3 will introduce automated DNS challenge records and official embeddable trust badges.'
    },
    {
      q: 'Is Lynqora a replacement for antivirus software?',
      a: 'No. Lynqora is a domain identity and website authenticity verification platform. It complements endpoint security and antivirus tools by providing pre-interaction domain provenance, ownership transparency, and public audit records.'
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/60 bg-radial from-sky-50/50 via-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold tracking-wide border border-sky-200">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Lynqora Verification Network — Phase 1</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Know Who You Trust Online.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl">
                Lynqora helps you verify websites and understand their trust status before you interact with them. Discover trust. Browse with confidence.
              </p>

              {/* Quick Check Form */}
              <form onSubmit={handleHeroSubmit} className="max-w-xl">
                <div className="relative flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-200">
                  <div className="relative flex-1 flex items-center pl-3.5">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      id="hero-domain-input"
                      type="text"
                      value={quickInput}
                      onChange={(e) => {
                        setQuickInput(e.target.value);
                        if (quickError) setQuickError('');
                      }}
                      placeholder="Enter website (e.g. yourcompany.com)"
                      className="w-full pl-2.5 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                    />
                  </div>
                  <button
                    id="hero-check-button"
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-sm shrink-0"
                  >
                    <span>Check a Website</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {quickError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium pl-2">{quickError}</p>
                )}
                {quickInput && !quickError && (
                  <p className="text-xs text-slate-500 mt-2 font-mono pl-2">
                    Normalized domain: <span className="font-semibold text-slate-800">{normalizeDomain(quickInput) || '...'}</span>
                  </p>
                )}
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  id="hero-cta-check-btn"
                  onClick={() => navigate(currentUser ? '/dashboard/check' : '/register')}
                  className="px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition-colors shadow-sm"
                >
                  {currentUser ? '+ Check a Website Now' : 'Create Free Account & Check'}
                </button>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 rounded-xl bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors border border-slate-200 shadow-xs"
                >
                  How Lynqora Works
                </a>
                <button
                  onClick={() => navigate('/verify/LQ-2026-8F72K4')}
                  className="px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-sky-600" />
                  View Sample Public Record
                </button>
              </div>
            </div>

            {/* Hero Right Column: Exact Visual Verification Card requested */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                {/* Glow accent */}
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-75"></div>

                {/* Demonstration Verification Card */}
                <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🌐</span>
                      <div>
                        <div className="font-bold text-slate-900 text-base font-mono">example.com</div>
                        <div className="text-[11px] text-slate-400">Public Domain Record</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      Sample Card
                    </span>
                  </div>

                  {/* Verified Badge */}
                  <div className="py-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ Lynqora Verified</span>
                    </div>
                  </div>

                  {/* Verification ID */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Verification ID
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900 tracking-wide flex items-center justify-between">
                      <span>LQ-2026-8F72K4</span>
                      <span className="text-[10px] text-sky-600 font-sans font-medium">Public Token</span>
                    </div>
                  </div>

                  {/* Last Checked */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last checked</span>
                    </div>
                    <div className="font-medium text-slate-900">
                      17 September 2026
                    </div>
                  </div>

                  {/* Clear demonstration disclosure */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      Visual demonstration format. Lynqora makes no claim that example.com is safe or officially verified by Lynqora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-bold text-sky-700 tracking-widest uppercase">
              Operational Process
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              How Lynqora Works
            </h3>
            <p className="text-slate-600 text-base leading-relaxed">
              Lynqora establishes a transparent, tamper-evident audit record for web domains in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200/80 hover:border-slate-300 transition-colors relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-6 shadow-sm">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Enter a Website
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Submit any domain or website URL into Lynqora. The system automatically normalizes the domain, generates a unique human-readable Verification ID (e.g. LQ-2026-8F72K4), and creates a permanent verification queue record.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200/80 hover:border-slate-300 transition-colors relative">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg mb-6 shadow-sm">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Verification Review
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Lynqora logs and reviews the domain against verification checkpoints. In Phase 1, records enter initial Under Review status while establishing the database and audit architecture for upcoming automated telemetry.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200/80 hover:border-slate-300 transition-colors relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mb-6 shadow-sm">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Review Trust Information
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visitors can access the public verification page anytime to inspect verified domain status, submission timestamp, expiration date, and audit trail before conducting online transactions.
              </p>
            </div>
          </div>

          <div className="mt-12 p-4 rounded-xl bg-sky-50/70 border border-sky-200/60 max-w-2xl mx-auto flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-900 leading-relaxed">
              <span className="font-semibold">Phase 1 Architecture Note:</span> Deeper automated domain analysis (including cryptographic DNS challenges, SSL transparency analysis, and WHOIS provenance) will be systematically introduced in Phase 2.
            </p>
          </div>
        </div>
      </section>

      {/* 3. WHY LYNQORA SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-bold text-sky-700 tracking-widest uppercase">
              Core Pillars
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Why Lynqora
            </h3>
            <p className="text-slate-600 text-base leading-relaxed">
              Designed from first principles to prioritize transparency, cryptographic integrity, and clear verification standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Domain Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean normalization and systematic records eliminate confusion between spoofed domain variations, homograph attacks, and authentic web destinations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Transparent Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No hidden blackbox ratings. Every verification checkpoint is documented with explicit statuses so users see exactly what was examined.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Public Verification Records</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Each verified request receives an independent, publicly verifiable web endpoint (<span className="font-mono text-[11px]">/verify/LQ-...</span>) accessible to anyone worldwide.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Independent Audit Logging</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every status transition, administrative review, and submission is logged in a relational audit trail for accountability and compliance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Security-Focused Architecture</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict separation between public verification data and private user information. Passwords hashed with bcrypt, zero plain text leaks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Tamper-Evident Token System</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Human-readable verification identifiers generated with cryptographic randomness, preventing identifier guessing or numeric enumeration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFICATION PREVIEW & TRUST BADGE PREVIEW */}
      <section className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Trust Badge Preview */}
            <div className="space-y-6">
              <h2 className="text-xs font-bold text-sky-700 tracking-widest uppercase">
                Trust Badge Preview
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                Empowering Websites with Recognizable Trust
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                In upcoming phases, verified website owners will be able to embed the official Lynqora Trust Badge directly onto their web properties. Visitors who click the badge will be taken directly to the independent Lynqora public record to verify authenticity.
              </p>

              {/* Badge Preview Demonstration */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Future Embed Badge Preview
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white font-semibold text-sm shadow-md">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>✓ Lynqora Verified</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 border border-slate-300 font-semibold text-sm shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>✓ Lynqora Verified</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The official embed script and cryptographic domain verification token will be released in Phase 3.
                </p>
              </div>
            </div>

            {/* Right: Verification Checks Breakdown Preview */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="font-bold text-slate-900 text-sm">
                  Scheduled Check Architecture (Phase 2 Roadmap)
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  9 Core Checks
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'Domain Ownership', desc: 'DNS TXT cryptographic challenge validation' },
                  { name: 'SSL Certificate', desc: 'Active valid SSL cipher suite and certificate transparency check' },
                  { name: 'Domain Age', desc: 'WHOIS registration lifespan and authoritative registrar status' },
                  { name: 'DNS Configuration', desc: 'Nameserver integrity, DNSSEC validation, and authoritative records' },
                  { name: 'Website Accessibility', desc: 'HTTP/HTTPS server responsiveness and uptime verification' },
                  { name: 'Security Headers', desc: 'HSTS, Content-Security-Policy, and X-Frame-Options validation' },
                  { name: 'Threat Intelligence', desc: 'Known malicious domain, phishing, and malware blacklist telemetry' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Queued (Phase 2)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-xs font-bold text-sky-700 tracking-widest uppercase">
              Frequently Asked Questions
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Honest Answers About Trust
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-slate-900 text-base focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Know Who You Trust Online.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Start verifying domains today. Create a free Lynqora account to submit websites, receive verification IDs, and review trust details.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="landing-final-cta-btn"
              onClick={() => navigate(currentUser ? '/dashboard/check' : '/register')}
              className="px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors shadow-lg"
            >
              Check a Website Now
            </button>
            <button
              onClick={() => navigate('/verify/LQ-2026-8F72K4')}
              className="px-6 py-3.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-sm font-semibold transition-colors"
            >
              Explore Public Verification Page
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
