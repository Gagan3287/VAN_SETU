import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { FilterState } from './components/MapFilters';
import { ClaimDetailDrawer } from './components/ClaimDetailDrawer';
import { ClaimListModal } from './components/ClaimListModal';
import { ClaimFormModal } from './components/ClaimFormModal';
import { ConflictQueuePanel } from './components/ConflictQueuePanel';
import { LandingPage } from './components/LandingPage';
import { DashboardRouter } from './components/dashboard/DashboardRouter';
import { Lock } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Client Routing State: '/' -> landing, '/app' -> atlas
  const initialView =
    window.location.pathname.startsWith('/app') || window.location.hash === '#app' ? 'atlas' : 'landing';
  const [currentView, setCurrentView] = useState<'landing' | 'atlas'>(initialView);

  // Dashboard Modals & State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClaimListOpen, setIsClaimListOpen] = useState(false);
  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false);
  const [isConflictQueueOpen, setIsConflictQueueOpen] = useState(false);

  const navigateView = useCallback((targetView: 'landing' | 'atlas') => {
    setCurrentView(targetView);
    if (targetView === 'atlas') {
      window.history.pushState(null, '', '/app');
    } else {
      window.history.pushState(null, '', '/');
    }
  }, []);

  // Navigation Guard: "Launch Atlas" requires authentication before entering /app
  const handleLaunchAtlasClick = () => {
    if (isAuthenticated) {
      navigateView('atlas');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    navigateView('atlas');
  };

  // GeoJSON Spatial Data State
  const [districtsGeoJson, setDistrictsGeoJson] = useState<any>(null);
  const [tehsilsGeoJson, setTehsilsGeoJson] = useState<any>(null);
  const [villagesGeoJson, setVillagesGeoJson] = useState<any>(null);
  const [claimsGeoJson, setClaimsGeoJson] = useState<any>(null);
  const [claimsCount, setClaimsCount] = useState<number>(0);
  const [loadingClaims, setLoadingClaims] = useState<boolean>(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Dropdown list options
  const [districtsList, setDistrictsList] = useState<Array<{ id: string; name: string }>>([]);
  const [tehsilsList, setTehsilsList] = useState<Array<{ id: string; name: string }>>([]);
  const [villagesList, setVillagesList] = useState<Array<{ id: string; name: string }>>([]);

  // Map Filter State
  const [filters, setFilters] = useState<FilterState>({
    districtId: '',
    tehsilId: '',
    villageId: '',
    claimType: '',
    status: '',
    riskLevel: '',
    searchQuery: '',
  });

  // Fetch boundaries (districts, tehsils, villages)
  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const [dRes, tRes, vRes] = await Promise.all([
          axios.get('/api/geo/districts'),
          axios.get('/api/geo/tehsils'),
          axios.get('/api/geo/villages'),
        ]);

        if (dRes.data.success) {
          setDistrictsGeoJson(dRes.data.data);
          const list = dRes.data.data.features.map((f: any) => ({
            id: f.properties.districtId,
            name: f.properties.name,
          }));
          setDistrictsList(list);
        }

        if (tRes.data.success) {
          setTehsilsGeoJson(tRes.data.data);
          const list = tRes.data.data.features.map((f: any) => ({
            id: f.properties.tehsilId,
            name: f.properties.name,
            districtId: f.properties.districtId,
          }));
          setTehsilsList(list);
        }

        if (vRes.data.success) {
          setVillagesGeoJson(vRes.data.data);
          const list = vRes.data.data.features.map((f: any) => ({
            id: f.properties.villageId,
            name: f.properties.name,
            tehsilId: f.properties.tehsilId,
          }));
          setVillagesList(list);
        }
      } catch (err) {
        console.error('Failed to load administrative boundaries:', err);
      }
    };

    fetchBoundaries();
  }, []);

  // Fetch role-scoped spatial claims from /api/claims/spatial
  const fetchSpatialClaims = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingClaims(true);
    try {
      const params: any = {};
      if (filters.districtId) params.districtId = filters.districtId;
      if (filters.tehsilId) params.tehsilId = filters.tehsilId;
      if (filters.villageId) params.villageId = filters.villageId;
      if (filters.claimType) params.claimType = filters.claimType;
      if (filters.status) params.status = filters.status;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;

      const res = await axios.get('/api/claims/spatial', { params });
      if (res.data.success) {
        setClaimsGeoJson(res.data.data);
        setClaimsCount(res.data.count || res.data.data.features.length);
      }
    } catch (err) {
      console.error('Failed to fetch spatial claims payload:', err);
    } finally {
      setLoadingClaims(false);
    }
  }, [isAuthenticated, filters]);

  useEffect(() => {
    if (currentView === 'atlas' && isAuthenticated) {
      fetchSpatialClaims();
    }
  }, [currentView, isAuthenticated, fetchSpatialClaims]);

  const handleResetFilters = () => {
    setFilters({
      districtId: '',
      tehsilId: '',
      villageId: '',
      claimType: '',
      status: '',
      riskLevel: '',
      searchQuery: '',
    });
  };

  // If in 'landing' view, render Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchAtlas={handleLaunchAtlasClick}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // Guard: if user navigates to /app without login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-darkbg text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Authentication Required</h2>
            <p className="text-sm text-slate-300">
              Access to the VanSetu Decision Support System requires authorized login credentials. Please sign in to continue.
            </p>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-all cursor-pointer"
          >
            Sign In to Access Atlas
          </button>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // If in 'atlas' view and authenticated, render WebGIS Atlas Dashboard via DashboardRouter
  return (
    <div className="min-h-screen bg-darkbg text-slate-100 flex flex-col font-sans selection:bg-forest-500 selection:text-white">
      {/* Dashboard Top Header */}
      <Header
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenClaimListModal={() => setIsClaimListOpen(true)}
        onOpenClaimFormModal={() => setIsClaimFormOpen(true)}
        onNavigateLanding={() => navigateView('landing')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <DashboardRouter
          districtsGeoJson={districtsGeoJson}
          tehsilsGeoJson={tehsilsGeoJson}
          villagesGeoJson={villagesGeoJson}
          claimsGeoJson={claimsGeoJson}
          loadingClaims={loadingClaims}
          claimsCount={claimsCount}
          filters={filters}
          setFilters={setFilters}
          handleResetFilters={handleResetFilters}
          districtsList={districtsList}
          tehsilsList={tehsilsList}
          villagesList={villagesList}
          fetchSpatialClaims={fetchSpatialClaims}
          onSelectClaim={(id) => setSelectedClaimId(id)}
          onOpenConflictQueue={() => setIsConflictQueueOpen(true)}
          onOpenClaimListModal={() => setIsClaimListOpen(true)}
          onOpenClaimFormModal={() => setIsClaimFormOpen(true)}
        />
      </main>

      {/* Slide-out Claim Detail Drawer */}
      <ClaimDetailDrawer
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
        onRefreshMap={fetchSpatialClaims}
      />

      {/* Scoped Claim List Registry Modal */}
      <ClaimListModal
        isOpen={isClaimListOpen}
        onClose={() => setIsClaimListOpen(false)}
        onSelectClaim={(id) => setSelectedClaimId(id)}
        onOpenCreateModal={() => setIsClaimFormOpen(true)}
      />

      {/* File Claim Modal */}
      <ClaimFormModal
        isOpen={isClaimFormOpen}
        onClose={() => setIsClaimFormOpen(false)}
        onSuccess={() => {
          fetchSpatialClaims();
          setIsClaimListOpen(true);
        }}
      />

      {/* Auth Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Phase 4: Conflict Review Queue Panel */}
      <ConflictQueuePanel
        isOpen={isConflictQueueOpen}
        onClose={() => setIsConflictQueueOpen(false)}
      />
    </div>
  );
};
