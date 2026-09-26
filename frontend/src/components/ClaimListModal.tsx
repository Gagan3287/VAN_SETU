import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, ListFilter, Eye, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ClaimListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClaim: (claimId: string) => void;
  onOpenCreateModal: () => void;
}

export const ClaimListModal: React.FC<ClaimListModalProps> = ({
  isOpen,
  onClose,
  onSelectClaim,
  onOpenCreateModal,
}) => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const fetchClaims = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (typeFilter !== 'ALL') params.claimType = typeFilter;

        const res = await axios.get('/api/claims', { params });
        if (res.data.success) {
          setClaims(res.data.data);
        } else {
          setError(res.data.error || 'Failed to fetch claims list');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error loading claims payload');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [isOpen, statusFilter, typeFilter]);

  if (!isOpen) return null;

  const statusBadges: Record<string, string> = {
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SUBMITTED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    FIELD_VERIFICATION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    GRAM_SABHA_REVIEW: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    SUBDIVISION_REVIEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    DISTRICT_REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    CONFLICT_REVIEW: 'bg-red-500/20 text-red-400 border-red-500/30',
    NEEDS_CORRECTION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    REJECTED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-darkcard border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-forest-400" />
            <div>
              <h3 className="font-bold text-white text-base">Scoped FRA Claims Registry</h3>
              <span className="text-[11px] text-slate-400">
                Server-side role-scoped list view ({user?.role})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="px-3 py-1.5 bg-forest-600 hover:bg-forest-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> File Claim
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT font-medium">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="FIELD_VERIFICATION">FIELD VERIFICATION</option>
              <option value="GRAM_SABHA_REVIEW">GRAM SABHA REVIEW</option>
              <option value="SUBDIVISION_REVIEW">SUBDIVISION REVIEW</option>
              <option value="DISTRICT_REVIEW">DISTRICT REVIEW</option>
              <option value="CONFLICT_REVIEW">CONFLICT REVIEW</option>
              <option value="NEEDS_CORRECTION">NEEDS CORRECTION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="ALL">All Types</option>
              <option value="IFR">IFR (Individual)</option>
              <option value="CR">CR (Community)</option>
              <option value="CFR">CFR (Forest Resource)</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
              Loading scoped claim records...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No claims match the active scope & filter criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Claim Number</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Claimant (PII Minimized)</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Area (Ha)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">{c.claimNumber}</td>
                    <td className="py-3 px-3 font-mono text-forest-300 font-bold">{c.claimType}</td>
                    <td className="py-3 px-3 text-slate-200">{c.claimant?.name || 'N/A'}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{c.districtId}</td>
                    <td className="py-3 px-3 text-slate-200 font-mono">{c.areaHectares}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadges[c.status] || 'bg-slate-800 text-white'}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectClaim(c.id);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-forest-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
