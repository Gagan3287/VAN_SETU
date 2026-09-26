import React, { useState } from 'react';
import { AtlasMap } from '../AtlasMap';
import { MapFilters, FilterState } from '../MapFilters';
import { Map, Layers, AlertTriangle, RefreshCw, Clock, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FieldOfficerDashboardProps {
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

export const FieldOfficerDashboard: React.FC<FieldOfficerDashboardProps> = ({
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
  const { user } = useAuth();
  const [showConflictHeatmap, setShowConflictHeatmap] = useState<boolean>(false);

  // Compute verification stats from claimsGeoJson features
  const features = claimsGeoJson?.features || [];
  const fieldVerifCount = features.filter((f: any) => f.properties?.status === 'FIELD_VERIFICATION').length;
  const submittedCount = features.filter((f: any) => f.properties?.status === 'SUBMITTED').length;
  const correctionCount = features.filter((f: any) => f.properties?.status === 'NEEDS_CORRECTION').length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-forest-500/20 text-forest-400 rounded-xl">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              Field Officer Verification Workspace
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 bg-forest-500/20 text-forest-300 rounded-full border border-forest-500/30">
                {user?.districtId || 'District Scoped'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Field ground-truth verification workspace for assigned district FRA claims.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            {loadingClaims ? 'Loading...' : `${claimsCount} Claims Loaded`}
          </span>

          <button
            onClick={onOpenConflictQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="View Read-Only Conflict Queue"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Conflicts (Read-Only)
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

      {/* Verification Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">In Field Verification</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{fieldVerifCount}</span>
          </div>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>

        <div className="glass-panel p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">Awaiting Verification</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{submittedCount}</span>
          </div>
          <FileCheck className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="glass-panel p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block uppercase">Needs Correction</span>
            <span className="text-lg font-bold text-orange-400 font-mono">{correctionCount}</span>
          </div>
          <AlertTriangle className="w-4 h-4 text-orange-400" />
        </div>
      </div>

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
            Scope: <strong className="text-slate-200">FIELD_OFFICER ({user?.districtId})</strong> — Click any claim polygon to inspect boundary or upload verification evidence.
          </span>
        </div>
      </div>
    </div>
  );
};
