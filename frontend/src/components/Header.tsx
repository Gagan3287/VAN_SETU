import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ListFilter, Plus, Home } from 'lucide-react';
import { Role } from '../types/auth';
import { VanSetuLogo } from './landing/VanSetuLogo';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenAuthModal: () => void;
  onOpenClaimListModal?: () => void;
  onOpenClaimFormModal?: () => void;
  onNavigateLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuthModal,
  onOpenClaimListModal,
  onOpenClaimFormModal,
  onNavigateLanding,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const roleColors: Record<Role, string> = {
    CITIZEN: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    FIELD_OFFICER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    DISTRICT_ADMIN: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    STATE_ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Unified Brand Logo & Identity */}
      <button
        onClick={onNavigateLanding}
        className="text-left hover:opacity-90 transition-opacity cursor-pointer"
        title="Return to Landing Page"
      >
        <VanSetuLogo variant="navbar" />
      </button>

      {/* Navigation Buttons for Claims Engine & Home */}
      <div className="flex items-center gap-2">
        {onNavigateLanding && (
          <button
            onClick={onNavigateLanding}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Return to Landing Page"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" /> Landing
          </button>
        )}

        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-2">
            {onOpenClaimListModal && (
              <button
                onClick={onOpenClaimListModal}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5 text-emerald-400" /> Claims Registry
              </button>
            )}
            {onOpenClaimFormModal && user?.role === 'CITIZEN' && (
              <button
                onClick={onOpenClaimFormModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> File Claim
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auth Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Mode Toggle Button */}
        <ThemeToggle />

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user.name}</div>
              <span className={`inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded border mt-0.5 ${roleColors[user.role]}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Logout & Revoke Token"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/40 transition-all cursor-pointer"
          >
            Login / Register
          </button>
        )}
      </div>
    </header>
  );
};
