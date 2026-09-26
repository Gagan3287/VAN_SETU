import React from 'react';
import { User, ShieldCheck, Landmark, Building2, ArrowRight } from 'lucide-react';

export const UserEcosystemSection: React.FC = () => {
  const roles = [
    {
      title: 'Citizen / Claimant',
      roleKey: 'CITIZEN',
      desc: 'Submits IFR, CR, or CFR claims, tracks status progression, and uploads supporting evidence documents.',
      scope: 'Own claims visibility only',
      icon: User,
      color: 'border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Field Officer',
      roleKey: 'FIELD_OFFICER',
      desc: 'Conducts on-site boundary verification, captures GPS points offline, and uploads verified field photos.',
      scope: 'Assigned district scope',
      icon: ShieldCheck,
      color: 'border-cyan-500/30 text-cyan-400',
    },
    {
      title: 'District Administration',
      roleKey: 'DISTRICT_ADMIN',
      desc: 'Reviews DLC priority queues, resolves spatial conflict reports, and makes district-level approvals.',
      scope: 'District-wide scope',
      icon: Landmark,
      color: 'border-amber-500/30 text-amber-400',
    },
    {
      title: 'State Administration',
      roleKey: 'STATE_ADMIN',
      desc: 'Monitors state-wide FRA progress, oversees cross-district boundary conflicts, and evaluates scheme convergence.',
      scope: 'State-wide full visibility',
      icon: Building2,
      color: 'border-purple-500/30 text-purple-400',
    },
  ];

  return (
    <section className="relative py-24 bg-[#030B08] border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
            Connected User Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Empowering Every Stakeholder <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Across Administrative Tiers.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Strict server-side role-based access control enforces data scoping across all four primary user tiers.
          </p>
        </div>

        {/* Roles Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {roles.map((r, idx) => {
            const IconComp = r.icon;
            return (
              <div
                key={r.roleKey}
                className="group p-6 rounded-2xl glass-card border border-emerald-900/30 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-slate-900/90 border ${r.color} group-hover:scale-110 transition-transform`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                      {r.roleKey}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 font-heading group-hover:text-emerald-300 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal mb-4">
                    {r.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{r.scope}</span>
                  {idx < roles.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
