import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  X,
  MapPin,
  User,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EvidenceUploadModal } from './EvidenceUploadModal';

interface ClaimDetailDrawerProps {
  claimId: string | null;
  onClose: () => void;
  onRefreshMap?: () => void;
}

export const ClaimDetailDrawer: React.FC<ClaimDetailDrawerProps> = ({ claimId, onClose, onRefreshMap }) => {
  const { user } = useAuth();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const fetchClaimDetail = async () => {
    if (!claimId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/claims/${claimId}`);
      if (res.data.success) {
        setClaim(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch claim details');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error loading claim payload');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!claimId) {
      setClaim(null);
      return;
    }
    fetchClaimDetail();
  }, [claimId]);

  if (!claimId) return null;

  const handleStatusTransition = async (targetStatus: string) => {
    setTransitioning(true);
    setError(null);
    try {
      const res = await axios.post(`/api/claims/${claimId}/status`, {
        targetStatus,
        remarks: remarks || `Transitioned to ${targetStatus}`,
      });

      if (res.data.success) {
        setRemarks('');
        await fetchClaimDetail();
        if (onRefreshMap) onRefreshMap();
      } else {
        setError(res.data.error || 'Status transition failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Status transition rejected');
    } finally {
      setTransitioning(false);
    }
  };

  const handleDeleteClaim = async () => {
    if (!window.confirm('Are you sure you want to delete this draft claim?')) return;
    try {
      const res = await axios.delete(`/api/claims/${claimId}`);
      if (res.data.success) {
        if (onRefreshMap) onRefreshMap();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error deleting claim');
    }
  };

  const statusColors: Record<string, string> = {
    APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    SUBMITTED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    FIELD_VERIFICATION: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    GRAM_SABHA_REVIEW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    SUBDIVISION_REVIEW: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    DISTRICT_REVIEW: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    CONFLICT_REVIEW: 'bg-red-500/20 text-red-300 border-red-500/30',
    NEEDS_CORRECTION: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    REJECTED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const riskBadge: Record<string, string> = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-darkcard/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Claim Details & Workflow</span>
            <h3 className="font-extrabold text-lg text-white font-mono flex items-center gap-2">
              {claim?.claimNumber || 'Loading...'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              Fetching claim payload from API...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          ) : claim ? (
            <>
              {/* Status & Risk Badges */}
              <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Current Status</span>
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border mt-1 ${statusColors[claim.status] || 'bg-slate-800 text-white'}`}>
                    {claim.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium block">Risk Band</span>
                  <span className={`inline-block text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border mt-1 ${riskBadge[claim.riskLevel] || 'bg-slate-800 text-white'}`}>
                    {claim.riskLevel} ({claim.riskScore}/100)
                  </span>
                </div>
              </div>

              {/* Status Workflow Action Controls */}
              {user && (
                <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-200 block border-b border-slate-800 pb-1.5">
                    Workflow Actions ({user.role})
                  </span>
                  
                  <input
                    type="text"
                    placeholder="Workflow remarks / reason..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    {claim.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusTransition('SUBMITTED')}
                        disabled={transitioning}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        {transitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Claim'}
                      </button>
                    )}

                    {claim.status === 'SUBMITTED' && (
                      <button
                        onClick={() => handleStatusTransition('FIELD_VERIFICATION')}
                        disabled={transitioning}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        Start Field Verification
                      </button>
                    )}

                    {claim.status === 'FIELD_VERIFICATION' && (
                      <button
                        onClick={() => handleStatusTransition('GRAM_SABHA_REVIEW')}
                        disabled={transitioning}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        Pass to Gram Sabha
                      </button>
                    )}

                    {claim.status === 'GRAM_SABHA_REVIEW' && (
                      <button
                        onClick={() => handleStatusTransition('SUBDIVISION_REVIEW')}
                        disabled={transitioning}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        Send to Sub-Division
                      </button>
                    )}

                    {claim.status === 'SUBDIVISION_REVIEW' && (
                      <button
                        onClick={() => handleStatusTransition('DISTRICT_REVIEW')}
                        disabled={transitioning}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        Submit to District
                      </button>
                    )}

                    {claim.status === 'DISTRICT_REVIEW' && (
                      <button
                        onClick={() => handleStatusTransition('APPROVED')}
                        disabled={transitioning}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        Approve Title
                      </button>
                    )}

                    {claim.status !== 'APPROVED' && claim.status !== 'REJECTED' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition('NEEDS_CORRECTION')}
                          disabled={transitioning}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all"
                        >
                          Request Correction
                        </button>
                        <button
                          onClick={() => handleStatusTransition('REJECTED')}
                          disabled={transitioning}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {claim.status === 'DRAFT' && (
                      <button
                        onClick={handleDeleteClaim}
                        className="px-2.5 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-bold transition-all ml-auto flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Draft
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Claimant Profile */}
              <div className="glass-panel p-4 rounded-xl space-y-2 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-forest-400" /> Claimant Profile
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Claimant Name</span>
                    <span className="font-semibold text-white">{claim.claimant?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Claim Type</span>
                    <span className="font-mono font-bold text-forest-300">{claim.claimType}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Contact Email</span>
                    <span className="text-slate-300">{claim.claimant?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Claim Area</span>
                    <span className="font-mono text-white">{claim.areaHectares} Hectares</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="glass-panel p-4 rounded-xl space-y-2 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <MapPin className="w-4 h-4 text-forest-400" /> Geographic Location
                </div>
                <div className="space-y-1 text-xs text-slate-300 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">District ID:</span>
                    <span className="font-mono font-medium">{claim.districtId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tehsil ID:</span>
                    <span className="font-mono font-medium">{claim.tehsilId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Village ID:</span>
                    <span className="font-mono font-medium">{claim.villageId}</span>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="glass-panel p-4 rounded-xl space-y-3 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <FileText className="w-4 h-4 text-forest-400" /> Attached Evidence ({claim.evidence?.length || 0})
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-2.5 py-1 bg-forest-600 hover:bg-forest-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                </div>

                {claim.evidence?.length > 0 ? (
                  <div className="space-y-2">
                    {claim.evidence.map((ev: any) => (
                      <div key={ev.id} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">{ev.type}</p>
                          <p className="text-[10px] text-slate-400">By: {ev.capturedBy} • Verified</p>
                        </div>
                        <a
                          href={ev.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-forest-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-2">No evidence documents attached yet.</p>
                )}
              </div>

              {/* Status History Timeline */}
              <div className="glass-panel p-4 rounded-xl space-y-3 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-forest-400" /> Workflow Transition Timeline
                </div>

                {claim.statusHistory?.length > 0 ? (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-800">
                    {claim.statusHistory.map((h: any) => (
                      <div key={h.id} className="relative pl-6 text-xs">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-forest-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-forest-400" />
                        </div>
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span>{h.fromStatus} $\rightarrow$ {h.toStatus}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">{h.remarks || 'No remarks'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">By {h.user?.name} ({h.user?.role})</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No transition history logged.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <EvidenceUploadModal
        claimId={claimId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchClaimDetail()}
      />
    </>
  );
};
