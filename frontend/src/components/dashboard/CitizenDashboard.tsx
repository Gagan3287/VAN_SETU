import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Plus, Eye, FileText, Clock, AlertCircle, Phone, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CitizenDashboardProps {
  onSelectClaim: (id: string) => void;
  onOpenClaimFormModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onSelectClaim,
  onOpenClaimFormModal,
}) => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state
  const [searchMode, setSearchMode] = useState<'claimNumber' | 'mobile'>('claimNumber');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchedClaim, setSearchedClaim] = useState<any | null>(null);
  const [searchHasRun, setSearchHasRun] = useState<boolean>(false);

  useEffect(() => {
    const fetchCitizenClaims = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/claims');
        if (res.data.success) {
          setClaims(res.data.data);
        } else {
          setError(res.data.error || 'Failed to fetch your claims');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error loading claims');
      } finally {
        setLoading(false);
      }
    };

    fetchCitizenClaims();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchedClaim(null);
      setSearchHasRun(false);
      return;
    }

    setSearchHasRun(true);
    const queryLower = searchQuery.trim().toLowerCase();

    const match = claims.find((c) => {
      if (searchMode === 'claimNumber') {
        return c.claimNumber?.toLowerCase().includes(queryLower);
      } else {
        // Match phone / mobile against claimant object or user phone
        const phone = c.claimant?.phone || user?.phone || '';
        return phone.includes(queryLower);
      }
    });

    setSearchedClaim(match || null);
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Submit claim form for initial review';
      case 'SUBMITTED':
        return 'Awaiting assignment to Field Verification Officer';
      case 'FIELD_VERIFICATION':
        return 'Field Officer carrying out boundary ground truth measurement';
      case 'GRAM_SABHA_REVIEW':
        return 'Gram Sabha resolution & community verification meeting';
      case 'SUBDIVISION_REVIEW':
        return 'Sub-Divisional Level Committee (SDLC) verification';
      case 'DISTRICT_REVIEW':
        return 'District Level Committee (DLC) final title deed review';
      case 'CONFLICT_REVIEW':
        return 'Spatial overlap resolution under review by District Collector';
      case 'NEEDS_CORRECTION':
        return 'Please update claim boundary coordinates or evidence document';
      case 'APPROVED':
        return 'Title Deed Issued (Patta Granted) — Complete';
      case 'REJECTED':
        return 'Claim rejected. Contact Gram Sabha or file appeal';
      default:
        return 'Under process by Forest Rights Committee';
    }
  };

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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-forest-500/20 text-forest-300 rounded-full border border-forest-500/30">
            Citizen &amp; Claimant Portal (Blueprint §15)
          </span>
          <h1 className="text-2xl font-black text-white mt-2">
            Welcome back, {user?.name || 'Claimant'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Track your Forest Rights Act claim progress, look up submission statuses, or register a new Individual/Community Forest Resource claim.
          </p>
        </div>

        <button
          onClick={onOpenClaimFormModal}
          className="px-4 py-2.5 bg-forest-600 hover:bg-forest-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> File New FRA Claim
        </button>
      </div>

      {/* Claim Lookup Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-forest-400" />
            <h2 className="font-bold text-white text-base">Claim Status Lookup</h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Lookup by Claim Number or Mobile Number
          </span>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSearchMode('claimNumber');
                setSearchedClaim(null);
                setSearchHasRun(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                searchMode === 'claimNumber' ? 'bg-forest-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" /> Claim Number
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('mobile');
                setSearchedClaim(null);
                setSearchHasRun(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                searchMode === 'mobile' ? 'bg-forest-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Mobile Number
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === 'claimNumber'
                  ? 'Enter claim number (e.g., OD-KAN-IFR-1001)...'
                  : 'Enter 10-digit registered mobile number...'
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-forest-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Search Status
          </button>
        </form>

        {/* Search Result Display */}
        {searchHasRun && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            {searchedClaim ? (
              <div className="p-4 bg-slate-900/80 border border-forest-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white">
                    {searchedClaim.claimNumber}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      statusBadges[searchedClaim.status] || 'bg-slate-800 text-white'
                    }`}
                  >
                    {searchedClaim.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Claim Type</span>
                    <span className="font-semibold text-forest-300">{searchedClaim.claimType}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Submission Date</span>
                    <span className="text-white">
                      {searchedClaim.submittedAt
                        ? new Date(searchedClaim.submittedAt).toLocaleDateString('en-IN')
                        : new Date(searchedClaim.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Land Area</span>
                    <span className="text-white font-mono">{searchedClaim.areaHectares} Ha</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">District</span>
                    <span className="text-white font-mono">{searchedClaim.districtId?.replace('DIST_OD_', '')}</span>
                  </div>
                </div>

                <div className="p-3 bg-forest-900/20 border border-forest-500/30 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-400 block">
                    Next Expected Action:
                  </span>
                  <span className="text-xs text-slate-200 mt-0.5 block font-medium">
                    {getNextAction(searchedClaim.status)}
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onSelectClaim(searchedClaim.id)}
                    className="px-3 py-1.5 bg-forest-600 hover:bg-forest-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Full Details &amp; History
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>No claim found matching "{searchQuery}" under your citizen account.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Claims List Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-forest-400" />
            <h2 className="font-bold text-white text-base">My Submitted Claims ({claims.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Loading your claim records...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        ) : claims.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Clock className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">You have not submitted any Forest Rights Act claims yet.</p>
            <button
              onClick={onOpenClaimFormModal}
              className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              File Your First Claim
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => onSelectClaim(claim.id)}
                className="p-4 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-forest-500/40 rounded-xl transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-white group-hover:text-forest-400 transition-colors">
                      {claim.claimNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Type: <strong className="text-forest-300">{claim.claimType}</strong> • {claim.areaHectares} Ha
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      statusBadges[claim.status] || 'bg-slate-800 text-white'
                    }`}
                  >
                    {claim.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Current Stage &amp; Next Action:
                  </span>
                  <span className="text-[11px] text-slate-200 block mt-0.5">
                    {getNextAction(claim.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Updated: {new Date(claim.updatedAt || claim.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className="text-forest-400 font-bold flex items-center gap-1 group-hover:underline">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
