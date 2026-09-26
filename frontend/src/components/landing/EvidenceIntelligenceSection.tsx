import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, FileText, Lock } from 'lucide-react';

export const EvidenceIntelligenceSection: React.FC = () => {
  const documents = [
    { title: 'Gram Sabha Resolution', status: 'VERIFIED', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Boundary Verification Map', status: 'VERIFIED', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Ancestral Occupancy Proof', status: 'MISSING', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Witness Statement', status: 'UNVERIFIED', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { title: 'Field Inspection Photo', status: 'VERIFIED', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <section className="relative py-24 bg-[#06120D] border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column: Evidence Intelligence Card */}
          <div className="flex-1 w-full max-w-md order-2 lg:order-1">
            <div className="p-6 rounded-2xl glass-panel border border-emerald-500/30 shadow-2xl space-y-6">
              {/* Header Completeness Gauge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Document Verification</div>
                  <div className="text-sm font-bold text-white font-heading">Evidence Completeness</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-emerald-400 font-heading">67%</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    3 / 5 VERIFIED
                  </span>
                </div>
              </div>

              {/* Status Checklist */}
              <div className="space-y-2.5">
                {documents.map((doc) => {
                  const IconComp = doc.icon;
                  return (
                    <div key={doc.title} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-200">{doc.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${doc.bg} ${doc.color}`}>
                        <IconComp className="w-3 h-3" />
                        {doc.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  MIME Magic-Byte Verified
                </span>
                <span>HMAC Signed URLs</span>
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Hardening Explanation */}
          <div className="flex-1 space-y-6 order-1 lg:order-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-heading">
              Evidence Hardening & Security · Blueprint §17
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
              Tamper-Proof Evidence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-200">
                &amp; Strict Verification.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Every document uploaded to VanSetu undergoes automated security validation: memory-buffered 5MB file caps, magic-byte MIME header inspection (preventing file extension renaming attacks), EXIF GPS extraction, and time-bound HMAC signed download URLs that prevent unauthorized access.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl glass-card border border-emerald-900/30">
                <div className="text-sm font-bold text-white font-heading">5MB Cap</div>
                <div className="text-[11px] text-slate-400">Validated in memory before disk write</div>
              </div>
              <div className="p-3.5 rounded-xl glass-card border border-emerald-900/30">
                <div className="text-sm font-bold text-white font-heading">HMAC Signed</div>
                <div className="text-[11px] text-slate-400">15-min token URL download links</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
