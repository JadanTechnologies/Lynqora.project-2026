import React from 'react';
import { useRoute } from '../../context/RouteContext.tsx';
import { ShieldCheck, Lock, Globe, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRoute();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Lynqora</span>
            </div>
            <p className="text-slate-300 font-medium text-sm">
              Know Who You Trust Online.
            </p>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Verify websites. Discover trust. Browse with confidence. Lynqora is building the modern website trust and verification network to protect users and legitimize genuine online properties.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                <Lock className="w-3 h-3 text-sky-400" />
                Phase 1 Production Foundation
              </span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/dashboard/check')} className="hover:text-white transition-colors">
                  Check a Website
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">
                  User Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/verify/LQ-2026-8F72K4')} className="hover:text-white transition-colors flex items-center gap-1">
                  Sample Public Verification <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
                  Sign In
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">
                  Create Account
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Trust & Security
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/security')} className="hover:text-white transition-colors">
                  Security Overview
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Lynqora. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Enterprise Domain Verification</span>
            <span>•</span>
            <span>Independent Audit Logging</span>
            <span>•</span>
            <span>PostgreSQL Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
