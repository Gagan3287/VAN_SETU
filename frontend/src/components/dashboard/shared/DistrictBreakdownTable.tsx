import React from 'react';
import { Building2 } from 'lucide-react';

interface DistrictStat {
  districtId: string;
  districtName: string;
  totalClaims: number;
  highRiskCount: number;
  approvedCount: number;
}

interface DistrictBreakdownTableProps {
  claims: any[];
}

export const DistrictBreakdownTable: React.FC<DistrictBreakdownTableProps> = ({ claims }) => {
  // Group spatial claims by districtId
  const breakdownMap: Record<string, DistrictStat> = {};

  claims.forEach((c) => {
    const distId = c.districtId || 'UNKNOWN';
    const distName = distId.replace('DIST_OD_', '').replace('_', ' ');
    if (!breakdownMap[distId]) {
      breakdownMap[distId] = {
        districtId: distId,
        districtName: distName,
        totalClaims: 0,
        highRiskCount: 0,
        approvedCount: 0,
      };
    }
    breakdownMap[distId].totalClaims += 1;
    if (c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL' || (c.riskScore && c.riskScore >= 40)) {
      breakdownMap[distId].highRiskCount += 1;
    }
    if (c.status === 'APPROVED') {
      breakdownMap[distId].approvedCount += 1;
    }
  });

  const districtList = Object.values(breakdownMap);

  if (districtList.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 my-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Statewide District Summary Breakdown
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {districtList.length} Active Districts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <th className="py-2 px-3">District ID</th>
              <th className="py-2 px-3">District Name</th>
              <th className="py-2 px-3">Total Claims</th>
              <th className="py-2 px-3">High Risk Claims</th>
              <th className="py-2 px-3">Approved Title Deeds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {districtList.map((row) => (
              <tr key={row.districtId} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-300">{row.districtId}</td>
                <td className="py-2.5 px-3 font-sans font-medium text-white">{row.districtName}</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.totalClaims}</td>
                <td className="py-2.5 px-3 text-orange-400 font-bold">{row.highRiskCount}</td>
                <td className="py-2.5 px-3 text-cyan-400">{row.approvedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
