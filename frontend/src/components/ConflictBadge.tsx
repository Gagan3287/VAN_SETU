import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ConflictBadgeProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  overlapPct?: number;
  compact?: boolean;
}

const severityConfig = {
  LOW: {
    label: 'LOW',
    icon: Info,
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    text: 'text-yellow-300',
    dot: 'bg-yellow-400',
  },
  MEDIUM: {
    label: 'MEDIUM',
    icon: AlertCircle,
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
  },
  HIGH: {
    label: 'HIGH',
    icon: AlertTriangle,
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-300',
    dot: 'bg-red-400',
  },
};

const statusConfig: Record<string, { label: string; text: string; bg: string; border: string }> = {
  PENDING: { label: 'Pending', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  UNDER_REVIEW: { label: 'Under Review', text: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  RESOLVED: { label: 'Resolved', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  REJECTED: { label: 'Rejected', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

export const ConflictBadge: React.FC<ConflictBadgeProps> = ({
  severity,
  status,
  overlapPct,
  compact = false,
}) => {
  const sev = severityConfig[severity] ?? severityConfig.LOW;
  const SevIcon = sev.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sev.bg} ${sev.border} ${sev.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
        {sev.label}
        {overlapPct !== undefined && ` · ${overlapPct.toFixed(1)}%`}
      </span>
    );
  }

  const st = status ? statusConfig[status] : null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${sev.bg} ${sev.border}`}>
      <SevIcon className={`w-4 h-4 shrink-0 ${sev.text}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold ${sev.text}`}>{sev.label} CONFLICT</span>
          {overlapPct !== undefined && (
            <span className="text-xs text-slate-400">{overlapPct.toFixed(1)}% overlap</span>
          )}
          {st && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.border} ${st.text}`}
            >
              {st.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
