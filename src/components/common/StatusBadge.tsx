import React from 'react';
import { VerificationStatus, RiskLevel, CheckStatus } from '../../types.ts';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, HelpCircle, MinusCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: VerificationStatus | CheckStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  switch (status) {
    case 'VERIFIED':
    case 'PASSED':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-medium ${sizeClasses[size]} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>✓ Lynqora Verified</span>
        </span>
      );

    case 'UNDER_REVIEW':
      return (
        <span
          id="status-badge-under-review"
          className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 font-medium ${sizeClasses[size]} ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
          <span>Under Review</span>
        </span>
      );

    case 'RISK_DETECTED':
    case 'FAILED':
      return (
        <span
          id="status-badge-risk-detected"
          className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20 font-medium ${sizeClasses[size]} ${className}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Risk Detected</span>
        </span>
      );

    case 'UNVERIFIED':
      return (
        <span
          id="status-badge-unverified"
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium ${sizeClasses[size]} ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Unverified</span>
        </span>
      );

    case 'PENDING':
      return (
        <span
          id="status-badge-pending"
          className={`inline-flex items-center rounded-full bg-sky-500/10 text-sky-700 border border-sky-500/20 font-medium ${sizeClasses[size]} ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Pending</span>
        </span>
      );

    case 'NOT_CHECKED':
    default:
      return (
        <span
          id="status-badge-not-checked"
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs px-2.5 py-0.5 gap-1.5 ${className}`}
        >
          <MinusCircle className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Not Checked</span>
        </span>
      );
  }
};

export const RiskBadge: React.FC<{ risk: RiskLevel; size?: 'sm' | 'md' }> = ({ risk, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  switch (risk) {
    case 'LOW':
      return (
        <span className={`inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium ${sizeClass}`}>
          Low Risk
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium ${sizeClass}`}>
          Medium Risk
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold ${sizeClass}`}>
          High Risk
        </span>
      );
    case 'UNKNOWN':
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClass}`}>
          Risk: Unknown
        </span>
      );
  }
};
