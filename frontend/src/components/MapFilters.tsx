import React from 'react';
import { Filter, RotateCcw, MapPin } from 'lucide-react';

export interface FilterState {
  districtId: string;
  tehsilId: string;
  villageId: string;
  claimType: string;
  status: string;
  riskLevel: string;
  searchQuery: string;
}

interface MapFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  districts: Array<{ id: string; name: string }>;
  tehsils: Array<{ id: string; name: string }>;
  villages: Array<{ id: string; name: string }>;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  filters,
  onChange,
  onReset,
  districts,
  tehsils,
  villages,
}) => {
  const handleChange = (key: keyof FilterState, value: string) => {
    const updated = { ...filters, [key]: value };
    // Reset child hierarchy if parent changes
    if (key === 'districtId') {
      updated.tehsilId = '';
      updated.villageId = '';
    } else if (key === 'tehsilId') {
      updated.villageId = '';
    }
    onChange(updated);
  };

  return (
    <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-forest-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Atlas Filters</span>
        </div>

        {/* Claim Type Filter Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px] font-medium">
          {['ALL', 'IFR', 'CR', 'CFR'].map((type) => (
            <button
              key={type}
              onClick={() => handleChange('claimType', type === 'ALL' ? '' : type)}
              className={`px-2.5 py-0.5 rounded transition-all ${
                (type === 'ALL' && !filters.claimType) || filters.claimType === type
                  ? 'bg-forest-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>

        <button
          onClick={onReset}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Filter Select Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        {/* District Select */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" /> District
          </label>
          <select
            value={filters.districtId}
            onChange={(e) => handleChange('districtId', e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-forest-400"
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tehsil Select */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Tehsil</label>
          <select
            value={filters.tehsilId}
            onChange={(e) => handleChange('tehsilId', e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-forest-400"
          >
            <option value="">All Tehsils</option>
            {tehsils.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Village Select */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Village</label>
          <select
            value={filters.villageId}
            onChange={(e) => handleChange('villageId', e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-forest-400"
          >
            <option value="">All Villages</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-forest-400"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="FIELD_VERIFICATION">Field Verification</option>
            <option value="GRAM_SABHA_REVIEW">Gram Sabha Review</option>
            <option value="SUBDIVISION_REVIEW">Subdivision Review</option>
            <option value="DISTRICT_REVIEW">District Review</option>
            <option value="CONFLICT_REVIEW">Conflict Review</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Risk Level Select */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Risk Band</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleChange('riskLevel', e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-forest-400"
          >
            <option value="">All Risk Bands</option>
            <option value="LOW">Low Risk (&lt; 40)</option>
            <option value="MEDIUM">Medium Risk (40-60)</option>
            <option value="HIGH">High Risk (60-85)</option>
            <option value="CRITICAL">Critical Risk (&gt; 85)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
