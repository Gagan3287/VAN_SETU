import React from 'react';
import { VanSetuLogo } from './VanSetuLogo';

interface LandingFooterProps {
  onLaunchAtlas: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onLaunchAtlas,
  onNavigateSection,
}) => {
  return (
    <footer className="bg-[#020705] border-t border-emerald-900/40 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div>
            <VanSetuLogo variant="footer" />
            <p className="text-[11px] text-slate-400 mt-2 max-w-md">
              AI-Powered FRA Atlas &amp; WebGIS Decision Support System designed for Forest Rights Act governance, spatial conflict resolution, and offline field verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <button onClick={() => onNavigateSection('overview')} className="hover:text-emerald-400 transition-colors">
              Overview
            </button>
            <button onClick={() => onNavigateSection('capabilities')} className="hover:text-emerald-400 transition-colors">
              Capabilities
            </button>
            <button onClick={() => onNavigateSection('atlas-showcase')} className="hover:text-emerald-400 transition-colors">
              WebGIS Atlas
            </button>
            <button onClick={() => onNavigateSection('offline-field')} className="hover:text-emerald-400 transition-colors">
              Offline Field
            </button>
            <button onClick={() => onNavigateSection('governance')} className="hover:text-emerald-400 transition-colors">
              Governance
            </button>
            <button onClick={onLaunchAtlas} className="text-emerald-400 font-bold hover:underline">
              Launch Atlas →
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} VanSetu DSS · Smart India Hackathon Demonstration Prototype
          </div>

          <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 font-mono">
            Notice: Prototype Demonstration System. Not an official Government of Odisha or MoTA portal.
          </div>
        </div>
      </div>
    </footer>
  );
};
