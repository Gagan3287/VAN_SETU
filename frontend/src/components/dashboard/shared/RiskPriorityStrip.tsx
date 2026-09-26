import React from 'react';
import { AlertOctagon, ChevronRight } from 'lucide-react';

interface ClaimRiskItem {
  id: string;
  claimNumber: string;
  claimType: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  districtId: string;
  areaHectares: number;
}

interface RiskPriorityStripProps {
  claims: ClaimRiskItem[];
  onSelectClaim: (id: string) => void;
}

export const RiskPriorityStrip: React.FC<RiskPriorityStripProps> = ({ claims, onSelectClaim }) => {
  // Sort claims by risk score descending, top 5
  const topRiskClaims = [...claims]
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
    .slice(0, 5);

  const riskBadge: Record<string, string> = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  if (topRiskClaims.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 my-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-orange-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Risk-Sorted Priority Queue
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Showing top {topRiskClaims.length} high-risk claims
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
        {topRiskClaims.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectClaim(item.id)}
            className="p-3 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-forest-500/40 rounded-xl transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-white group-hover:text-forest-400 transition-colors">
                  {item.claimNumber}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    riskBadge[item.riskLevel] || 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.riskScore} pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {item.claimType} • {item.areaHectares} ha
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {item.districtId.replace('DIST_OD_', '')}
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate max-w-[100px]">{item.status.replace(/_/g, ' ')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-forest-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
