import React, { useState, useEffect } from 'react';

interface HeroForestSectionProps {
  children: React.ReactNode;
}

export const HeroForestSection: React.FC<HeroForestSectionProps> = ({ children }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check system prefers-reduced-motion setting
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    const handleMouseMove = (e: MouseEvent) => {
      if (mediaQuery.matches) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className="relative min-h-screen w-full bg-[#030B08] overflow-hidden flex flex-col justify-between">
      {/* Background Layer 1: Procedural Atmospheric Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#020A07] via-[#051910] to-[#030B08]" />

      {/* Layer 2: Real Forest Tree Texture Image (WebP + PNG Fallback) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-35 mix-blend-luminosity transition-transform duration-700 ease-out"
        style={
          reduceMotion
            ? undefined
            : {
                transform: `translate3d(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px, 0) scale(1.05)`,
              }
        }
      >
        <picture>
          <source srcSet="/assets/dense_indian_forest_bg.webp" type="image/webp" />
          <img
            src="/assets/dense_indian_forest_bg.png"
            alt="Indian Sal Forest Background"
            className="w-full h-full object-cover"
          />
        </picture>
      </div>

      {/* Background Layer 3: Light Rays & Atmospheric Mist */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
          <g opacity="0.4">
            <polygon points="0,0 400,0 200,900 0,900" fill="url(#ray1)" />
            <polygon points="300,0 800,0 600,900 100,900" fill="url(#ray2)" />
          </g>
          <defs>
            <linearGradient id="ray1" x1="200" y1="0" x2="100" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="1" stopColor="#030B08" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ray2" x1="550" y1="0" x2="350" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" stopOpacity="0.1" />
              <stop offset="1" stopColor="#030B08" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Background Layer 4: Real Tree Canopy Silhouette Layer (WebP + PNG Fallback) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen transition-transform duration-700 ease-out"
        style={
          reduceMotion
            ? undefined
            : {
                transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0) scale(1.08)`,
              }
        }
      >
        <picture>
          <source srcSet="/assets/tree_canopy_silhouette.webp" type="image/webp" />
          <img
            src="/assets/tree_canopy_silhouette.png"
            alt="Forest Tree Canopy Framing"
            className="w-full h-full object-cover"
          />
        </picture>
      </div>

      {/* Background Layer 5: Procedural Layered SVG Tree Silhouettes */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-transform duration-700 ease-out"
        style={
          reduceMotion
            ? undefined
            : {
                transform: `translate3d(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px, 0)`,
              }
        }
      >
        <svg
          className="absolute bottom-0 w-full h-[65%] text-[#061811] opacity-70"
          viewBox="0 0 1440 500"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0 500 V300 L60 250 L120 320 L180 240 L240 310 L300 220 L360 290 L420 200 L480 300 L540 210 L600 320 L660 230 L720 310 L780 220 L840 300 L900 200 L960 290 L1020 210 L1080 300 L1140 220 L1200 310 L1260 230 L1320 300 L1380 220 L1440 280 V500 Z" />
        </svg>

        <svg
          className="absolute bottom-0 w-full h-[45%] text-[#04120D]"
          viewBox="0 0 1440 400"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M-40 400 V180 L40 120 L120 220 L200 100 L280 240 L360 140 L440 260 L520 120 L600 240 L680 100 L760 250 L840 110 L920 240 L1000 90 L1080 260 L1160 130 L1240 270 L1320 110 L1400 240 L1480 150 V400 Z" />
        </svg>
      </div>

      {/* Floating Particle Mist Layer */}
      {!reduceMotion && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
          <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-emerald-400 blur-[1px] animate-pulse" />
          <div className="absolute top-1/3 right-20 w-3 h-3 rounded-full bg-teal-300 blur-[2px] animate-pulse" />
          <div className="absolute top-1/2 left-1/3 w-2 h-2 rounded-full bg-emerald-300 blur-[1px]" />
          <div className="absolute top-2/3 right-1/3 w-3 h-3 rounded-full bg-emerald-500 blur-[2px]" />
        </div>
      )}

      {/* Dark Vignette Gradient Overlay for Crisp Typography Legibility */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#030B08] via-[#030B08]/60 to-[#030B08]/85 pointer-events-none" />

      {/* Main Content Children */}
      {children}
    </section>
  );
};
