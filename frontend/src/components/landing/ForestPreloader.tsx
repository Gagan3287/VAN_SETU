import React, { useState, useEffect, useCallback } from 'react';
import { VanSetuLogo } from './VanSetuLogo';
import { ChevronDown, SkipForward } from 'lucide-react';

interface ForestPreloaderProps {
  onComplete: () => void;
}

export const ForestPreloader: React.FC<ForestPreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0); // 0 (closed) to 1 (fully opened)
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const completeIntro = useCallback(() => {
    try {
      sessionStorage.setItem('vansetu_intro_seen', 'true');
    } catch (e) {
      // Ignore storage quota/private browsing errors
    }
    onComplete();
  }, [onComplete]);

  // Handle scroll / wheel / touch events to drive the forest opening transition
  useEffect(() => {
    try {
      // Reduced motion check — skip immediately if enabled
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReduceMotion(isReduced);
      if (isReduced) {
        completeIntro();
        return;
      }

      // Check if session flag already exists
      if (sessionStorage.getItem('vansetu_intro_seen') === 'true') {
        completeIntro();
        return;
      }

      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY > 0) {
          setProgress((prev) => {
            const next = Math.min(1, prev + 0.25);
            if (next >= 1) {
              setTimeout(completeIntro, 350);
            }
            return next;
          });
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (['ArrowDown', 'PageDown', 'Space', 'Enter'].includes(e.code)) {
          setProgress((prev) => {
            const next = Math.min(1, prev + 0.35);
            if (next >= 1) {
              setTimeout(completeIntro, 350);
            }
            return next;
          });
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } catch (err) {
      console.warn('ForestPreloader initialization error, bypassing preloader:', err);
      setErrorOccurred(true);
      completeIntro();
    }
  }, [completeIntro]);

  if (errorOccurred) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#020805] text-white flex flex-col justify-between overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Top Header Controls — Dedicated Preloader Header */}
      <div className="relative z-30 p-6 flex items-center justify-between max-w-7xl w-full mx-auto">
        <VanSetuLogo variant="navbar" />
        <button
          onClick={completeIntro}
          className="px-4 py-2 rounded-full glass-panel border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-950/60 transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Organic Seamless Forest Canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* Layer 1: Seamless Continuous Forest Background (Moving WebP Loop + Static Fallback) */}
        <div
          className="absolute inset-0 bg-[#030B08] transition-opacity duration-700"
          style={{ opacity: 1 - progress }}
        >
          <picture>
            {!reduceMotion && (
              <source srcSet="/assets/forest_wind_sway.webp" type="image/webp" />
            )}
            <img
              src="/assets/dense_indian_forest_bg.webp"
              alt="Forest Entry Background"
              className="w-full h-full object-cover opacity-70 mix-blend-luminosity scale-105"
            />
          </picture>
        </div>

        {/* Layer 2: Left Feathered Canopy Framing (Soft edge-blend, zero sharp cuts) */}
        <div
          className="absolute inset-y-0 left-0 w-1/2 transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(-${progress * 100}%, 0, 0)`,
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          }}
        >
          <picture>
            <source srcSet="/assets/tree_canopy_silhouette.webp" type="image/webp" />
            <img
              src="/assets/tree_canopy_silhouette.png"
              alt="Left Forest Canopy"
              className="w-full h-full object-cover opacity-60 mix-blend-screen scale-110"
            />
          </picture>
        </div>

        {/* Layer 3: Right Feathered Canopy Framing (Soft edge-blend, zero sharp cuts) */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(${progress * 100}%, 0, 0)`,
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          }}
        >
          <picture>
            <source srcSet="/assets/tree_canopy_silhouette.webp" type="image/webp" />
            <img
              src="/assets/tree_canopy_silhouette.png"
              alt="Right Forest Canopy"
              className="w-full h-full object-cover opacity-60 mix-blend-screen scale-110 -scale-x-100"
            />
          </picture>
        </div>

        {/* Layer 4: Soft Radial Center Fog & Light Beam Opening (Feathers the center seamless transition) */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-[#030B08]/40 to-[#020805] transition-opacity duration-700"
          style={{ opacity: progress > 0 ? progress : 0.8 }}
        />

        {/* Layer 5: Soft Vignette Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020805] via-transparent to-[#020805]/80" />
      </div>

      {/* Center Title & Minimal Chevron Down Indicator */}
      <div className="relative z-20 max-w-xl mx-auto px-6 text-center my-auto space-y-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
            NATIONAL FRA GEOSPATIAL PLATFORM
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Entering the Forest Intelligence Atlas
          </h1>
        </div>

        {/* Minimal Fading Chevron Down Indicator */}
        <button
          onClick={() => {
            setProgress(1);
            setTimeout(completeIntro, 350);
          }}
          className="inline-flex flex-col items-center gap-1.5 p-2 text-emerald-400/80 hover:text-emerald-300 transition-colors cursor-pointer"
          title="Scroll or click to open"
        >
          <div className="animate-bounce">
            <ChevronDown className="w-6 h-6 stroke-[2.5]" />
          </div>
        </button>

        {/* Progress Bar Line */}
        <div className="w-48 h-1 mx-auto bg-slate-900/80 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-300"
            style={{ width: `${Math.max(10, progress * 100)}%` }}
          />
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="relative z-20 p-6 text-center text-[10px] font-mono text-slate-500">
        VANSETU DSS · SMART INDIA HACKATHON DEMONSTRATION
      </div>
    </div>
  );
};
