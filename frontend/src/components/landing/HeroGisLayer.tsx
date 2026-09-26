import React from 'react';
import { Shield, Layers, MapPin, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroGisLayerProps {
  onExplore: () => void;
  onLaunchAtlas: () => void;
}

export const HeroGisLayer: React.FC<HeroGisLayerProps> = ({ onExplore, onLaunchAtlas }) => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 lg:pt-40 lg:pb-32 flex flex-col lg:flex-row items-center justify-between gap-12">
      {/* Left Column: Editorial Headline & CTAs */}
      <div className="flex-1 text-left space-y-6 max-w-2xl">
        {/* Brand Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>VANSETU DSS · AI-POWERED FRA ATLAS</span>
        </div>

        {/* Primary Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-heading">
          From Forest Rights <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-200">
            to Intelligent Decisions.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Visualize FRA claims, detect spatial overlaps, prioritize risk, and empower field verification — even in low-connectivity forest regions.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={onLaunchAtlas}
            className="forest-glow-btn px-6 py-3.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all shadow-lg"
          >
            Launch Atlas
            <ArrowRight className="w-4 h-4 text-emerald-200" />
          </button>

          <button
            onClick={onExplore}
            className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 backdrop-blur-md transition-all flex items-center gap-2"
          >
            Explore Platform
          </button>
        </div>

        {/* Floating Quick Metric Pills */}
        <div className="pt-6 grid grid-cols-3 gap-3 max-w-md border-t border-emerald-900/40">
          <div>
            <div className="text-lg font-bold text-white font-heading">18+</div>
            <div className="text-[11px] text-slate-400">Seeded Claims</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400 font-heading">PostGIS</div>
            <div className="text-[11px] text-slate-400">Conflict Engine</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400 font-heading">Offline</div>
            <div className="text-[11px] text-slate-400">Field Sync</div>
          </div>
        </div>
      </div>

      {/* Right Column: Floating WebGIS Spatial Intelligence HUD Overlay */}
      <div className="flex-1 w-full max-w-lg relative lg:block">
        {/* Tilted HUD Container */}
        <div className="relative rounded-2xl glass-panel p-5 border border-emerald-500/25 shadow-2xl overflow-hidden group hover:border-emerald-500/40 transition-all duration-500">
          {/* Topographic Contour Lines SVG Layer */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
            viewBox="0 0 400 300"
            fill="none"
          >
            <path
              d="M -20 150 C 50 80, 150 220, 250 100 C 320 20, 420 180, 450 150"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="animate-contour"
            />
            <path
              d="M -20 200 C 80 120, 180 260, 280 140 C 350 50, 420 220, 450 180"
              stroke="#047857"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <path
              d="M -20 100 C 60 40, 140 180, 220 80 C 300 10, 380 140, 450 100"
              stroke="#065F46"
              strokeWidth="1"
            />
          </svg>

          {/* HUD Header Bar */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-900/40 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                WebGIS Spatial Intelligence
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
              LIVE ATLAS
            </span>
          </div>

          {/* Floating Data Cards & Map Preview Elements */}
          <div className="space-y-3 relative z-10">
            {/* Metric Card 1: Overlap Conflict */}
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Spatial Overlap Detected</div>
                  <div className="text-[10px] text-slate-400">Claims OD-KAN-IFR-003 ↔ OD-KAN-IFR-004</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                HIGH · 42.8%
              </span>
            </div>

            {/* Metric Card 2: Field Verification Status */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Field Verification Pending</div>
                  <div className="text-[10px] text-slate-400">Kandhamal District · Balliguda Block</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VERIFIED
              </span>
            </div>

            {/* Metric Card 3: Spatial Claim Layer Info */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">District Boundary Layers</div>
                  <div className="text-[10px] text-slate-400">Kandhamal & Mayurbhanj Seed Datasets</div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">18 Polygons</span>
            </div>
          </div>

          {/* Interactive HUD Footer */}
          <div className="mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Odisha GIS Bounds
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">UTM Zone 44N</span>
          </div>
        </div>
      </div>
    </div>
  );
};
