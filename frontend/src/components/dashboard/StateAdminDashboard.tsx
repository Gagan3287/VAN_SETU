import React, { useState } from 'react';
import { AtlasMap } from '../AtlasMap';
import { MapFilters, FilterState } from '../MapFilters';
import { AnalyticsBar } from './shared/AnalyticsBar';
import { RiskPriorityStrip } from './shared/RiskPriorityStrip';
import { DistrictBreakdownTable } from './shared/DistrictBreakdownTable';
import { TrustCenterPanel } from '../TrustCenterPanel';
import { Layers, AlertTriangle, RefreshCw, Globe } from 'lucide-react';

interface StateAdminDashboardProps {
  districtsGeoJson: any;
  tehsilsGeoJson: any;
  villagesGeoJson: any;
  claimsGeoJson: any;
  loadingClaims: boolean;
  claimsCount: number;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  handleResetFilters: () => void;
  districtsList: any[];
  tehsilsList: any[];
  villagesList: any[];
  fetchSpatialClaims: () => void;
  onSelectClaim: (id: string) => void;
  onOpenConflictQueue: () => void;
  onOpenClaimListModal: () => void;
}

export const StateAdminDashboard: React.FC<StateAdminDashboardProps> = ({
  districtsGeoJson,
  tehsilsGeoJson,
  villagesGeoJson,
  claimsGeoJson,
  loadingClaims,
  claimsCount,
  filters,
  setFilters,
  handleResetFilters,
  districtsList,
  tehsilsList,
  villagesList,
  fetchSpatialClaims,
  onSelectClaim,
  onOpenConflictQueue,
  onOpenClaimListModal: _onOpenClaimListModal,
}) => {
  const [showConflictHeatmap, setShowConflictHeatmap] = useState<boolean>(false);

  // Compute stats from unpaginated spatial dataset across all districts
  const features = claimsGeoJson?.features || [];
  const totalClaims = features.length;
  const pendingReview = features.filter(
    (f: any) =>
      f.properties?.status === 'DISTRICT_REVIEW' ||
      f.properties?.status === 'SUBDIVISION_REVIEW' ||
      f.properties?.status === 'FIELD_VERIFICATION'
  ).length;

  const conflictClaims = features.filter((f: any) => f.properties?.status === 'CONFLICT_REVIEW');
  const activeConflicts = conflictClaims.length;

  const totalRiskSum = features.reduce((acc: number, f: any) => acc + (f.properties?.riskScore || 0), 0);
  const avgRiskScore = totalClaims > 0 ? totalRiskSum / totalClaims : 0;

  // Count districts with high/critical risk claims
  const criticalDistrictsSet = new Set<string>();
  features.forEach((f: any) => {
    if (f.properties?.riskLevel === 'HIGH' || f.properties?.riskLevel === 'CRITICAL') {
      if (f.properties?.districtId) criticalDistrictsSet.add(f.properties.districtId);
    }
  });

  // Map features to flat objects for RiskPriorityStrip
  const claimListForPriority = features.map((f: any) => ({
    id: f.properties?.id || f.id,
    claimNumber: f.properties?.claimNumber || 'N/A',
    claimType: f.properties?.claimType || 'IFR',
    riskScore: f.properties?.riskScore || 0,
    riskLevel: f.properties?.riskLevel || 'LOW',
    status: f.properties?.status || 'SUBMITTED',
    districtId: f.properties?.districtId || '',
    areaHectares: f.properties?.areaHectares || 0,
  }));

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-forest-500/20 text-forest-400 rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              Statewide Command &amp; Decision Support Atlas
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                State Nodal Officer Scope
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Statewide spatial intelligence, cross-district conflict escalation &amp; governance oversight.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            {loadingClaims ? 'Loading...' : `${claimsCount} Statewide Claims`}
          </span>

          <button
            onClick={onOpenConflictQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Open Cross-District Conflict Escalation Queue"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Cross-District Conflicts
          </button>

          <button
            onClick={() => setShowConflictHeatmap((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              showConflictHeatmap
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showConflictHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
          </button>

          <button
            onClick={fetchSpatialClaims}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            title="Refresh spatial claims"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingClaims ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statewide Analytics Bar */}
      <AnalyticsBar
        totalClaims={totalClaims}
        pendingReview={pendingReview}
        activeConflicts={activeConflicts}
        avgRiskScore={avgRiskScore}
        criticalDistricts={criticalDistrictsSet.size}
        isStateAdmin
      />

      {/* Risk Priority Queue Strip */}
      <RiskPriorityStrip claims={claimListForPriority} onSelectClaim={onSelectClaim} />

      {/* District Breakdown Table */}
      <DistrictBreakdownTable claims={claimListForPriority} />

      {/* Map Filters */}
      <MapFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        districts={districtsList}
        tehsils={tehsilsList}
        villages={villagesList}
      />

      {/* WebGIS Leaflet Canvas Map */}
      <div className="relative">
        <AtlasMap
          districtsGeoJson={districtsGeoJson}
          tehsilsGeoJson={tehsilsGeoJson}
          villagesGeoJson={villagesGeoJson}
          claimsGeoJson={claimsGeoJson}
          showConflictHeatmap={showConflictHeatmap}
          onSelectClaim={onSelectClaim}
        />

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            Scope: <strong className="text-slate-200">STATE_ADMIN</strong> — Unrestricted statewide spatial visibility &amp; cross-district conflict resolution authority.
          </span>
        </div>
      </div>

      {/* Trust Center Panel (Preserved for State Admin per Item 1) */}
      <TrustCenterPanel />
    </div>
  );
};
