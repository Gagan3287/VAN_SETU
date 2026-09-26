import React from 'react';
import { AlertTriangle, Clock, FileWarning, MapPin, HelpCircle } from 'lucide-react';

export const RiskIntelligenceSection: React.FC = () => {
  const riskFactors = [
    { name: 'Boundary Conflict', impact: '+30', icon: AlertTriangle, color: 'text-red-400', desc: 'Overlaps existing claim OD-KAN-IFR-004' },
    { name: 'Processing Delay', impact: '+22', icon: Clock, color: 'text-amber-400', desc: 'Exceeds 90-day SLA window' },
    { name: 'Missing Evidence', impact: '+18', icon: FileWarning, color: 'text-amber-400', desc: 'Gram Sabha resolution document unverified' },
    { name: 'Correction History', impact: '+10', icon: HelpCircle, color: 'text-yellow-400', desc: 'Resubmitted after correction request' },
    { name: 'Geographic Risk', impact: '+7', icon: MapPin, color: 'text-emerald-400', desc: 'Proximity to protected reserve boundary' },
  ];

  return (
    <section className="relative py-24 bg-[#030B08] border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column: Risk Engine Explanation */}
          <div className="flex-1 space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
              Explainable Risk Engine · Blueprint §8
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
              Transparent Priority Scoring, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                Not a Black Box.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              VanSetu avoids opaque AI models that hide recommendations behind unexplainable scores. Every claim’s risk score (0–100) is calculated using weighted, transparent spatial and administrative factors that officers and committee members can audit line-by-line.
            </p>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-emerald-400">Recommended System Action:</div>
              <div>&quot;Prioritize for field inspection &amp; surface in District Collector conflict queue.&quot;</div>
            </div>
          </div>

          {/* Right Column: Explainable Risk Score Card UI */}
          <div className="flex-1 w-full max-w-md">
            <div className="p-6 rounded-2xl glass-panel border border-red-500/30 shadow-2xl space-y-6">
              {/* Header Score Display */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Risk Evaluation</div>
                  <div className="text-sm font-bold text-white font-heading">Claim OD-KAN-IFR-003</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-red-400 font-heading">87<span className="text-sm text-slate-500">/100</span></div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                    HIGH PRIORITY
                  </span>
                </div>
              </div>

              {/* Factor Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Weighted Risk Factor Breakdown
                </div>

                {riskFactors.map((factor) => {
                  const IconComp = factor.icon;
                  return (
                    <div key={factor.name} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`w-4 h-4 ${factor.color} shrink-0`} />
                        <div>
                          <div className="font-bold text-white">{factor.name}</div>
                          <div className="text-[10px] text-slate-400">{factor.desc}</div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${factor.color}`}>{factor.impact}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-slate-500 text-center">
                Prototype demonstration weights · Calculated via VanSetu Risk Engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
