import React, { useState } from 'react';
import { ForestPreloader } from './landing/ForestPreloader';
import { LandingNavbar } from './landing/LandingNavbar';
import { HeroForestSection } from './landing/HeroForestSection';
import { HeroGisLayer } from './landing/HeroGisLayer';
import { ProductStorySection } from './landing/ProductStorySection';
import { CoreCapabilitiesSection } from './landing/CoreCapabilitiesSection';
import { AtlasShowcaseSection } from './landing/AtlasShowcaseSection';
import { OfflineFieldSection } from './landing/OfflineFieldSection';
import { RiskIntelligenceSection } from './landing/RiskIntelligenceSection';
import { EvidenceIntelligenceSection } from './landing/EvidenceIntelligenceSection';
import { UserEcosystemSection } from './landing/UserEcosystemSection';
import { TrustGovernanceSection } from './landing/TrustGovernanceSection';
import { FinalCtaSection } from './landing/FinalCtaSection';
import { LandingFooter } from './landing/LandingFooter';

interface LandingPageProps {
  onLaunchAtlas: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchAtlas }) => {
  const [showPreloader, setShowPreloader] = useState<boolean>(() => {
    try {
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const seenSession = sessionStorage.getItem('vansetu_intro_seen') === 'true';
      return !isReducedMotion && !seenSession;
    } catch {
      return false;
    }
  });

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030B08] text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Session-Based Cinematic Forest Preloader */}
      {showPreloader && (
        <ForestPreloader onComplete={() => setShowPreloader(false)} />
      )}

      {/* Glassmorphic Navbar (Rendered only after preloader resolves) */}
      {!showPreloader && (
        <LandingNavbar
          onLaunchAtlas={onLaunchAtlas}
          onNavigateSection={handleNavigateSection}
        />
      )}

      {/* Cinematic Forest Hero Section with Floating GIS HUD Overlay */}
      <HeroForestSection>
        <HeroGisLayer
          onExplore={() => handleNavigateSection('overview')}
          onLaunchAtlas={onLaunchAtlas}
        />
      </HeroForestSection>

      {/* Product Story: End-to-End Decision Lifecycle */}
      <ProductStorySection />

      {/* Core Capabilities Grid (9 Blueprint MVP Modules) */}
      <CoreCapabilitiesSection />

      {/* Major WebGIS Atlas Showcase Window */}
      <AtlasShowcaseSection onLaunchAtlas={onLaunchAtlas} />

      {/* Offline-First Mobile Field Section */}
      <OfflineFieldSection />

      {/* Explainable Risk Intelligence Section */}
      <RiskIntelligenceSection />

      {/* Evidence Intelligence & Security Hardening Section */}
      <EvidenceIntelligenceSection />

      {/* Connected 4-Tier User Ecosystem */}
      <UserEcosystemSection />

      {/* Trust & Governance Security Architecture */}
      <TrustGovernanceSection />

      {/* Final Forest Atmosphere CTA Section */}
      <FinalCtaSection onLaunchAtlas={onLaunchAtlas} />

      {/* Institutional Footer */}
      <LandingFooter
        onLaunchAtlas={onLaunchAtlas}
        onNavigateSection={handleNavigateSection}
      />
    </div>
  );
};
