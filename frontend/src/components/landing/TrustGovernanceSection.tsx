import React from 'react';
import { ShieldCheck, Lock, EyeOff, FileCheck, Gauge } from 'lucide-react';

export const TrustGovernanceSection: React.FC = () => {
  const securityFeatures = [
    {
      title: 'Server-Side RBAC & Scope Enforcing',
      codeRef: 'auth.ts & claimController.ts',
      status: 'ACTIVE',
      icon: ShieldCheck,
      desc: 'Token-level role verification and database-level query scoping ensuring citizens see own claims only and admins see assigned districts.',
    },
    {
      title: 'Audit Trail with Database PII Masking',
      codeRef: 'audit.ts (maskPiiInObject)',
      status: 'ACTIVE',
      icon: EyeOff,
      desc: 'Immutable system audit logging automatically masking emails, phone numbers, and credentials before writing JSON logs to audit_logs.',
    },
    {
      title: 'HMAC Signed Evidence Download Tokens',
      codeRef: 'evidenceService.ts (EVIDENCE_URL_SECRET)',
      status: 'ACTIVE',
      icon: Lock,
      desc: 'Time-bound 15-minute HMAC-SHA256 URL signatures preventing direct file URL guessing or unauthorized evidence file downloads.',
    },
    {
      title: 'MIME Sniffing & Upload Hardening',
      codeRef: 'evidenceService.ts (verifyMagicBytes)',
      status: 'ACTIVE',
      icon: FileCheck,
      desc: 'In-memory 5MB file size limits and magic-byte header inspection verifying true PDF, JPEG, and PNG binary content.',
    },
    {
      title: 'API Rate Limiting & Protection',
      codeRef: 'rateLimiter.ts (apiRateLimiter)',
      status: 'ACTIVE',
      icon: Gauge,
      desc: 'Express API rate limiters protecting authentication and data endpoints against brute-force attacks and automated scrapers.',
    },
  ];

  return (
    <section id="governance" className="relative py-24 bg-[#06120D] border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
            Trust &amp; Governance Architecture · Blueprint §17
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Institutional-Grade <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Security &amp; Data Hardening.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Verified backend security protocols protecting citizen data integrity, system access, and audit compliance.
          </p>
        </div>

        {/* Security Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((sec) => {
            const IconComp = sec.icon;
            return (
              <div
                key={sec.title}
                className="p-6 rounded-2xl glass-card border border-emerald-900/30 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {sec.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 font-heading">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal mb-4">
                    {sec.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Backend Verified</span>
                  <span className="text-emerald-400/80">{sec.codeRef}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
