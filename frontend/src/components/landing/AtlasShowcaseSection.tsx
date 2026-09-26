import React, { useState } from 'react';
import { Map, ArrowUpRight, Flame } from 'lucide-react';

interface AtlasShowcaseSectionProps {
  onLaunchAtlas: () => void;
}

export const AtlasShowcaseSection: React.FC<AtlasShowcaseSectionProps> = ({ onLaunchAtlas }) => {
  const [heatmapActive, setHeatmapActive] = useState(true);

  return (
    <section id="atlas-showcase" className="relative py-24 bg-[#030B08] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
            WebGIS Atlas Engine · Blueprint §6
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            State-Wide Spatial Visibility <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Across Forest Landscapes.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Multi-layered WebGIS engine rendering administrative boundaries, individual/community forest claims, conflict zones, and risk heatmaps.
          </p>
        </div>

        {/* Map UI Showcase Window */}
        <div className="relative rounded-2xl glass-panel p-4 border border-emerald-500/30 shadow-2xl overflow-hidden">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Map className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-heading">Odisha FRA WebGIS Atlas</div>
                <div className="text-[10px] text-slate-400">Kandhamal & Mayurbhanj Seed Polygons · EPSG:4326</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Heatmap Toggle */}
              <button
                onClick={() => setHeatmapActive(!heatmapActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  heatmapActive
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                {heatmapActive ? 'Conflict Heatmap ON' : 'Heatmap OFF'}
              </button>

              <button
                onClick={onLaunchAtlas}
                className="forest-glow-btn px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 transition-all"
              >
                Launch Atlas <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Map Preview Graphic Representation */}
          <div className="relative w-full h-[420px] rounded-xl bg-[#040D09] overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Topographic Background Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 800 450" fill="none">
              <path d="M 50 100 Q 200 40 400 120 T 750 180" stroke="#10B981" strokeWidth="1.5" strokeDasharray="6 4" />
              <path d="M 20 220 Q 220 160 450 250 T 780 200" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 2" />
              <path d="M 80 320 Q 280 240 500 350 T 790 310" stroke="#047857" strokeWidth="1" />
            </svg>

            {/* Simulated Claim Polygons */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" fill="none">
              {/* Claim Polygon 1: Approved (Green) */}
              <polygon points="120,100 220,80 260,180 150,200" fill="#10B981" fillOpacity="0.25" stroke="#10B981" strokeWidth="2" />
              <text x="170" y="145" fill="#34D399" fontSize="10" fontWeight="bold" textAnchor="middle">IFR-001 (APPROVED)</text>

              {/* Claim Polygon 2: Field Verification (Amber) */}
              <polygon points="320,120 450,110 420,240 300,210" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="2" />
              <text x="375" y="175" fill="#FBBF24" fontSize="10" fontWeight="bold" textAnchor="middle">CR-002 (FIELD VERIF)</text>

              {/* Overlapping Claim Polygons: Conflict Review (Red Pulsing) */}
              <polygon points="500,180 620,160 660,280 540,300" fill="#EF4444" fillOpacity="0.3" stroke="#EF4444" strokeWidth="2.5" strokeDasharray={heatmapActive ? "6 4" : "none"} />
              <polygon points="580,210 700,190 730,310 610,330" fill="#EF4444" fillOpacity="0.35" stroke="#EF4444" strokeWidth="2.5" strokeDasharray={heatmapActive ? "6 4" : "none"} />

              {/* Heatmap Conflict Warning Tag */}
              {heatmapActive && (
                <g transform="translate(610, 240)">
                  <rect x="-65" y="-12" width="130" height="24" rx="6" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1" />
                  <text x="0" y="4" fill="#FCA5A5" fontSize="10" fontWeight="bold" textAnchor="middle">⚠ OVERLAP 42.8% (HIGH)</text>
                </g>
              )}
            </svg>

            {/* Map Floating Legend */}
            <div className="absolute bottom-4 left-4 p-3 rounded-xl glass-panel border border-slate-800 text-[11px] space-y-1.5 z-10">
              <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Claim Layer Status</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-300">Approved</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-slate-300">Field Review</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-slate-300">Conflict Review</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /><span className="text-slate-300">Submitted</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
