import React from 'react';
import { VanSetuLogo } from './VanSetuLogo';
import { ArrowRight, MapPin } from 'lucide-react';

interface FinalCtaSectionProps {
  onLaunchAtlas: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onLaunchAtlas }) => {
  return (
    <section className="relative py-32 bg-[#030B08] overflow-hidden flex items-center justify-center">
      {/* Real Forest Tree Image Background (Lazy-Loaded) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25 mix-blend-luminosity">
        <picture>
          <source srcSet="/assets/dense_indian_forest_bg.webp" type="image/webp" />
          <img
            src="/assets/dense_indian_forest_bg.png"
            alt="Indian Sal Forest CTA Background"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </picture>
      </div>

      {/* Background Forest SVG Silhouette Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full text-[#10B981]" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
          <path d="M 0 300 Q 360 150 720 300 T 1440 300 V 600 H 0 Z" fill="currentColor" fillOpacity="0.05" />
          <path d="M 0 400 C 480 200 960 500 1440 350 V 600 H 0 Z" fill="currentColor" fillOpacity="0.08" />
        </svg>
      </div>

      {/* Topographic Glow Lines */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-emerald-500/30 animate-contour" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-emerald-500/20" />
      </div>

      {/* Dark Vignette Overlay for Crisp Typography Legibility */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#030B08] via-[#030B08]/70 to-[#030B08] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
        <VanSetuLogo variant="hero" className="justify-center mx-auto mb-2" />

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight">
          Connect the Forest, the Field, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-200">
            and the Decision Maker.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          VanSetu brings FRA claims, geospatial intelligence, field verification, and decision support into one connected national system.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onLaunchAtlas}
            className="forest-glow-btn px-8 py-4 rounded-xl text-base font-bold text-white flex items-center gap-2 transition-all shadow-2xl"
          >
            Enter VanSetu Platform
            <ArrowRight className="w-5 h-5 text-emerald-200" />
          </button>
        </div>

        <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Odisha Spatial Pilot
          </span>
          <span>·</span>
          <span>18 Seeded Claims</span>
          <span>·</span>
          <span>Smart India Hackathon 2026</span>
        </div>
      </div>
    </section>
  );
};
