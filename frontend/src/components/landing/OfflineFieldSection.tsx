import React, { useState } from 'react';
import { Wifi, WifiOff, Database, RefreshCw, CheckCircle2, MapPin, Camera } from 'lucide-react';

export const OfflineFieldSection: React.FC = () => {
  const [networkState, setNetworkState] = useState<'ONLINE' | 'OFFLINE' | 'SAVED_LOCALLY' | 'SYNCING' | 'SYNCED'>('OFFLINE');

  const cycleStatus = () => {
    const states: Array<'ONLINE' | 'OFFLINE' | 'SAVED_LOCALLY' | 'SYNCING' | 'SYNCED'> = [
      'ONLINE',
      'OFFLINE',
      'SAVED_LOCALLY',
      'SYNCING',
      'SYNCED',
    ];
    const nextIdx = (states.indexOf(networkState) + 1) % states.length;
    setNetworkState(states[nextIdx]);
  };

  const statusConfig = {
    ONLINE: { label: 'ONLINE', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', icon: Wifi },
    OFFLINE: { label: 'OFFLINE', bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', icon: WifiOff },
    SAVED_LOCALLY: { label: 'SAVED LOCALLY', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-300', icon: Database },
    SYNCING: { label: 'SYNCING...', bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300', icon: RefreshCw },
    SYNCED: { label: 'SYNCED', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', icon: CheckCircle2 },
  };

  const current = statusConfig[networkState];
  const StatusIcon = current.icon;

  return (
    <section id="offline-field" className="relative py-24 bg-[#06120D] border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column: Offline Architecture Explanation */}
          <div className="flex-1 space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30 uppercase tracking-widest font-heading">
              Offline-First Mobile Verification · Blueprint §10
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
              Field Verification <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-400 to-teal-200">
                Without Connectivity.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Deep inside dense tribal forest reserves, cellular connectivity is non-existent. VanSetu’s offline-first architecture allows Field Officers to collect GPS boundary points and evidence documents directly into local IndexedDB storage (via Dexie.js), automatically synchronizing with the central PostGIS database when signal is restored.
            </p>

            {/* Offline Features List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl glass-card border border-emerald-900/30">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-200">Hardware GPS Coordinate Capture & Boundary Trace</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl glass-card border border-emerald-900/30">
                <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-200">Offline Photo & PDF Evidence Capture with Local Hashing</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl glass-card border border-emerald-900/30">
                <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-200">IndexedDB Storage (Dexie.js) with Automatic Background Sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Offline Simulator Card */}
          <div className="flex-1 w-full max-w-md">
            <div className="p-6 rounded-2xl glass-panel border border-emerald-500/30 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                  Field Officer Sync Simulator
                </span>
                <button
                  onClick={cycleStatus}
                  className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                >
                  Click to Toggle Status
                </button>
              </div>

              {/* Status Pill Indicator */}
              <div className={`p-4 rounded-xl border ${current.bg} ${current.border} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <StatusIcon className={`w-5 h-5 ${current.text} ${networkState === 'SYNCING' ? 'animate-spin' : ''}`} />
                  <div>
                    <div className={`text-xs font-extrabold ${current.text}`}>{current.label}</div>
                    <div className="text-[10px] text-slate-400">
                      {networkState === 'OFFLINE' ? 'No cellular network in forest' : 'Local storage synced with PostGIS'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated Record Item */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>OD-KAN-IFR-003</span>
                  <span className="text-emerald-400">Captured On-Site</span>
                </div>
                <div className="text-[11px] text-slate-400">GPS: 20.081° N, 83.912° E (±3m)</div>
                <div className="text-[11px] text-slate-400">Evidence: Resolution_Photo.jpg (1.8MB)</div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                  <span>Local Queue: 1 Item</span>
                  <span>Dexie DB: Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
