import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, AlertTriangle, RefreshCw, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { ConflictBadge } from './ConflictBadge';
import { useAuth } from '../context/AuthContext';

interface ConflictClaim {
  id: string;
  claimNumber: string;
  claimType: string;
  status: string;
  areaHectares: number;
  districtId: string;
  tehsilId: string;
  villageId: string;
}

interface Conflict {
  id: string;
  claimAId: string;
  claimBId: string;
  claimA: ConflictClaim;
  claimB: ConflictClaim;
  overlapArea: number;
  overlapPercentage: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  conflictType: string;
  detectedAt: string;
  reviewedBy: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
}

interface ConflictQueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictQueuePanel: React.FC<ConflictQueuePanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveStatus, setResolveStatus] = useState<'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'>('UNDER_REVIEW');
  const [submitting, setSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const canResolve = user?.role === 'DISTRICT_ADMIN' || user?.role === 'STATE_ADMIN';

  const fetchConflicts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      const res = await axios.get('/api/conflicts', { params });
      if (res.data.success) {
        setConflicts(res.data.data);
      } else {
        setError(res.data.error || 'Failed to load conflicts');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load conflict queue');
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus]);

  useEffect(() => {
    if (isOpen) fetchConflicts();
  }, [isOpen, fetchConflicts]);

  const handleResolve = async () => {
    if (!selectedConflict) return;
    setSubmitting(true);
    setResolveError(null);
    setResolveSuccess(false);
    try {
      const res = await axios.put(`/api/conflicts/${selectedConflict.id}/resolve`, {
        status: resolveStatus,
        resolutionNote: resolveNote,
      });
      if (res.data.success) {
        setResolveSuccess(true);
        setSelectedConflict({ ...selectedConflict, status: resolveStatus, resolutionNote: resolveNote });
        await fetchConflicts();
      } else {
        setResolveError(res.data.error || 'Resolution failed');
      }
    } catch (err: any) {
      const detail = err.response?.data?.details?.resolutionNote?.[0] || err.response?.data?.error;
      setResolveError(detail || 'Failed to submit resolution');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-darkcard border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="font-bold text-white text-base">Conflict Review Queue</h2>
            {conflicts.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full border border-red-500/30">
                {conflicts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchConflicts}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prototype threshold disclaimer */}
        <div className="mx-4 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-start gap-2 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Prototype Thresholds:</strong> Severity bands (LOW &lt;5%, MEDIUM 5–20%, HIGH &gt;20%) are VanSetu
            prototype values and <strong>do not</strong> represent official FRA boundary rules.
          </span>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 flex gap-2 shrink-0">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-forest-500"
          >
            <option value="">All Severities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-forest-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading conflicts…
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 text-center">
              {error}
            </div>
          )}

          {!loading && !error && conflicts.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500/40" />
              No conflicts found for your district.
            </div>
          )}

          {!loading &&
            conflicts.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedConflict(c);
                  setResolveNote(c.resolutionNote || '');
                  setResolveError(null);
                  setResolveSuccess(false);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedConflict?.id === c.id
                    ? 'border-forest-500/60 bg-forest-900/20'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-xs font-semibold text-white">
                    {c.claimA.claimNumber} ↔ {c.claimB.claimNumber}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
                <ConflictBadge severity={c.severity} status={c.status} overlapPct={c.overlapPercentage} compact />
                <div className="mt-2 text-[10px] text-slate-500">
                  Detected {new Date(c.detectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </button>
            ))}
        </div>

        {/* Selected Conflict Detail */}
        {selectedConflict && (
          <div className="border-t border-slate-800 p-4 bg-slate-900/60 shrink-0 max-h-[55%] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Conflict Detail</h3>
              <button onClick={() => setSelectedConflict(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Claims side-by-side */}
            <div className="grid grid-cols-2 gap-2">
              {[selectedConflict.claimA, selectedConflict.claimB].map((cl, i) => (
                <div key={cl.id} className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                  <div className="text-[10px] text-slate-400 mb-1">Claim {String.fromCharCode(65 + i)}</div>
                  <div className="text-xs font-bold text-white">{cl.claimNumber}</div>
                  <div className="text-[10px] text-slate-400">{cl.claimType} · {cl.areaHectares} ha</div>
                  <div className="text-[10px] text-slate-500 mt-1">{cl.districtId.replace('DIST_OD_', '')}</div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl">
              <div className="text-[10px] text-slate-400 mb-1">Overlap</div>
              <div className="flex items-center gap-2">
                <ConflictBadge severity={selectedConflict.severity} status={selectedConflict.status} overlapPct={selectedConflict.overlapPercentage} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{selectedConflict.overlapArea.toFixed(4)} ha intersection area</div>
            </div>

            {/* Resolution Note (read-only if resolved or officer) */}
            {selectedConflict.resolutionNote && !canResolve && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="text-[10px] text-emerald-400 font-semibold mb-1">Resolution Note</div>
                <div className="text-xs text-slate-300">{selectedConflict.resolutionNote}</div>
              </div>
            )}

            {/* Resolution Form — District Admin / State Admin only */}
            {canResolve && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Update Status</div>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-forest-500"
                >
                  <option value="UNDER_REVIEW">Mark Under Review</option>
                  <option value="RESOLVED">Mark Resolved</option>
                  <option value="REJECTED">Reject Conflict Report</option>
                </select>

                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Resolution notes (min. 10 characters)…"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-forest-500 resize-none"
                />

                {resolveError && (
                  <p className="text-xs text-red-400">{resolveError}</p>
                )}
                {resolveSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Resolution saved successfully
                  </p>
                )}

                <button
                  onClick={handleResolve}
                  disabled={submitting || resolveNote.length < 10}
                  className="w-full py-2 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting ? 'Submitting…' : 'Submit Resolution'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
