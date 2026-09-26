import React from 'react';
import {
  FileSpreadsheet,
  Cpu,
  Layers,
  ShieldCheck,
  Smartphone,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export const ProductStorySection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Real-World Input',
      desc: 'Digitize physical claim records, boundary coordinates, and village records.',
      icon: FileSpreadsheet,
      accent: 'border-emerald-500/30 text-emerald-400',
    },
    {
      number: '02',
      title: 'Geospatial Processing',
      desc: 'Map geometries against district, tehsil, and village administrative boundaries.',
      icon: Layers,
      accent: 'border-cyan-500/30 text-cyan-400',
    },
    {
      number: '03',
      title: 'Spatial & Risk Analysis',
      desc: 'Detect spatial overlaps via PostGIS and evaluate transparent risk scores.',
      icon: Cpu,
      accent: 'border-amber-500/30 text-amber-400',
    },
    {
      number: '04',
      title: 'Field Verification',
      desc: 'Officers inspect boundaries on-site with offline-first evidence capture.',
      icon: Smartphone,
      accent: 'border-teal-500/30 text-teal-400',
    },
    {
      number: '05',
      title: 'Committee Review',
      desc: 'Progress claims through Gram Sabha, Sub-Division, and District DLC reviews.',
      icon: ShieldCheck,
      accent: 'border-blue-500/30 text-blue-400',
    },
    {
      number: '06',
      title: 'Decision Intelligence',
      desc: 'State & District Admins make informed approvals backed by audit trails.',
      icon: BarChart3,
      accent: 'border-emerald-400/30 text-emerald-300',
    },
  ];

  return (
    <section id="overview" className="relative py-24 bg-[#030B08] overflow-hidden">
      {/* Background Topographic Grid Transition */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #10B981 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
            End-to-End Decision Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Making Forest Rights Visible, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Verifiable, and Actionable.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            VanSetu bridges paper records, geospatial analysis, field inspections, and committee governance into a single connected platform.
          </p>
        </div>

        {/* Process Flow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.number}
                className="group relative p-6 rounded-2xl glass-card border border-emerald-900/30 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">
                      PHASE {step.number}
                    </span>
                    <div
                      className={`p-2.5 rounded-xl bg-slate-900/80 border ${step.accent} transition-transform group-hover:scale-110`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 font-heading group-hover:text-emerald-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end text-[11px] text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <span>Next Stage</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
