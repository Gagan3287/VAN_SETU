import React from 'react';

interface VanSetuLogoProps {
  variant?: 'hero' | 'navbar' | 'icon-only' | 'footer';
  className?: string;
}

export const VanSetuLogo: React.FC<VanSetuLogoProps> = ({ variant = 'navbar', className = '' }) => {
  const isIconOnly = variant === 'icon-only';

  const iconSize =
    variant === 'hero' ? 'w-12 h-12' : variant === 'footer' ? 'w-8 h-8' : 'w-7 h-7';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Emblem: Forest Tree + Contour Map + Land Bridge */}
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
        >
          <defs>
            <linearGradient id="treeGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="0.6" stopColor="#10B981" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="contourGrad" x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="1" stopColor="#064E3B" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Topographic Contour Ring */}
          <path
            d="M 24 6 C 34 6, 42 14, 42 24 C 42 34, 34 42, 24 42 C 14 42, 6 34, 6 24 C 6 14, 14 6, 24 6 Z"
            stroke="url(#contourGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Outer GIS Boundary Ring */}
          <circle cx="24" cy="24" r="21" stroke="#10B981" strokeOpacity="0.25" strokeWidth="1" />

          {/* Stylized Tree Canopy */}
          <path
            d="M 24 8 L 34 22 H 28 L 36 33 H 12 L 20 22 H 14 Z"
            fill="url(#treeGrad)"
          />

          {/* Bridge Line connecting land territory */}
          <path
            d="M 8 38 C 16 34, 32 34, 40 38"
            stroke="#6EE7B7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Core GPS / Claim Pin Center node */}
          <circle cx="24" cy="22" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Text */}
      {!isIconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-tight text-white font-heading ${
                variant === 'hero' ? 'text-2xl' : variant === 'footer' ? 'text-lg' : 'text-base'
              }`}
            >
              VAN<span className="text-emerald-400">SETU</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
              DSS
            </span>
          </div>
          {variant !== 'footer' && (
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
              AI-Powered FRA Atlas
            </span>
          )}
        </div>
      )}
    </div>
  );
};
