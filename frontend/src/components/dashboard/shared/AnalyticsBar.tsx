import React from 'react';
import { FileText, Clock, AlertTriangle, ShieldAlert, Building2 } from 'lucide-react';

interface AnalyticsBarProps {
  totalClaims: number;
  pendingReview: number;
  activeConflicts: number;
  avgRiskScore: number;
  criticalDistricts?: number;
  isStateAdmin?: boolean;
}

export const AnalyticsBar: React.FC<AnalyticsBarProps> = ({
  totalClaims,
  pendingReview,
  activeConflicts,
  avgRiskScore,
  criticalDistricts = 0,
  isStateAdmin = false,
}) => {
  return (
    <div className={`grid grid-cols-2 ${isStateAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 mb-4`}>
      {/* Stat 1: Total Claims */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Total Claims</span>
          <span className="text-xl font-extrabold text-white font-mono">{totalClaims}</span>
        </div>
        <div className="p-2.5 bg-forest-500/20 text-forest-400 rounded-xl">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 2: Pending Review */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Pending Review</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono">{pendingReview}</span>
        </div>
        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 3: Active Conflicts */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Active Conflicts</span>
          <span className="text-xl font-extrabold text-red-400 font-mono">{activeConflicts}</span>
        </div>
        <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 4: Avg Risk Score */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Avg Risk Score</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">
            {avgRiskScore.toFixed(1)} <span className="text-xs text-slate-400">/ 100</span>
          </span>
        </div>
        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* Stat 5 (State Admin only): Critical Districts */}
      {isStateAdmin && (
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Critical Districts</span>
            <span className="text-xl font-extrabold text-orange-400 font-mono">{criticalDistricts}</span>
          </div>
          <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
};
