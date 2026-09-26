import React from 'react';
import {
  Map,
  FileText,
  AlertTriangle,
  Activity,
  WifiOff,
  Briefcase,
  Lock,
  GitMerge,
  ShieldCheck,
} from 'lucide-react';

export const CoreCapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      icon: Map,
      title: 'FRA Atlas / WebGIS',
      category: 'Geospatial Core',
      desc: 'Interactive visualization of IFR, CR, and CFR claims, administrative boundaries, conflict zones, and spatial risk layers across Odisha districts.',
      tag: 'Blueprint §6',
    },
    {
      icon: FileText,
      title: 'Claim Engine & State Machine',
      category: 'Workflow & Scope',
      desc: 'Role-scoped CRUD operations and strict state transitions (DRAFT → SUBMITTED → FIELD_VERIFICATION → DLC REVIEW → APPROVED).',
      tag: 'Blueprint §5',
    },
    {
      icon: AlertTriangle,
      title: 'PostGIS Conflict Engine',
      category: 'Spatial Intelligence',
      desc: 'Three-stage spatial overlap detection (ST_Intersects → ST_Intersection m² area calculation → severity banding: LOW <5%, MEDIUM 5–20%, HIGH >20%).',
      tag: 'Blueprint §7',
    },
    {
      icon: Activity,
      title: 'Explainable Risk Engine',
      category: 'Decision Support',
      desc: 'Transparent risk score calculation (0–100) incorporating boundary conflicts, missing evidence, processing delays, and spatial proximity factors.',
      tag: 'Blueprint §8',
    },
    {
      icon: WifiOff,
      title: 'Offline Field Verification',
      category: 'Mobile Field Operations',
      desc: 'Offline-first PWA sync using IndexedDB (Dexie). Field officers capture GPS coordinates and evidence in remote forests without active network.',
      tag: 'Blueprint §10',
    },
    {
      icon: Briefcase,
      title: 'Decision Support Dashboard',
      category: 'Governance & Analytics',
      desc: 'Role-customized analytical dashboards for Gram Sabha, Field Officers, District Collectors, and State Level Monitoring Committees.',
      tag: 'Blueprint §12',
    },
    {
      icon: Lock,
      title: 'Evidence Hardening & Security',
      category: 'Security & Verification',
      desc: 'File size caps, MIME header magic-byte verification, EXIF GPS extraction, and short-lived HMAC signed evidence download URLs.',
      tag: 'Blueprint §17',
    },
    {
      icon: GitMerge,
      title: 'Scheme Convergence Engine',
      category: 'Post-Rights Development',
      desc: 'Automated recommendation matching approved FRA titles with welfare schemes (MGNREGA land development, PM-KISAN, Jal Jeevan Mission).',
      tag: 'Blueprint §9',
    },
    {
      icon: ShieldCheck,
      title: 'Audit & Governance Engine',
      category: 'Security & Traceability',
      desc: 'Immutable system audit logging recording all state changes and API operations with automated database PII masking (emails, phones, credentials).',
      tag: 'Blueprint §17',
    },
  ];

  return (
    <section id="capabilities" className="relative py-24 bg-[#06120D] border-y border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Built for National-Scale <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Forest Rights Governance.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Nine integrated MVP modules designed specifically around the MoTA & Odisha FRA operational architecture.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const IconComp = cap.icon;
            return (
              <div
                key={cap.title}
                className="group p-6 rounded-2xl glass-card border border-emerald-900/30 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {cap.tag}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    {cap.category}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 font-heading group-hover:text-emerald-300 transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
