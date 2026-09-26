import React, { useState, useEffect } from 'react';
import { VanSetuLogo } from './VanSetuLogo';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface LandingNavbarProps {
  onLaunchAtlas: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLaunchAtlas,
  onNavigateSection,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'atlas-showcase', label: 'WebGIS Atlas' },
    { id: 'offline-field', label: 'Offline Field' },
    { id: 'governance', label: 'Governance' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#030B08]/85 backdrop-blur-md border-b border-emerald-900/30 py-3 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-left focus:outline-none"
        >
          <VanSetuLogo variant="navbar" />
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 glass-panel px-5 py-2 rounded-full border border-emerald-500/15">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigateSection(link.id)}
              className="text-xs font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right CTA & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onLaunchAtlas}
            className="forest-glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
          >
            Launch Atlas
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-200" />
          </button>
        </div>

        {/* Mobile Menu Button & Theme Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-900/60 border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-emerald-900/30 px-4 py-4 space-y-3 animate-fade-in">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigateSection(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-emerald-400 font-medium"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onLaunchAtlas();
                setMobileMenuOpen(false);
              }}
              className="w-full forest-glow-btn py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
            >
              Launch Atlas <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

