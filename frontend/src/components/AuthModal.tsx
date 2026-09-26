import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  AlertTriangle,
  ShieldCheck,
  Landmark,
  Building2,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import axios from 'axios';
import { Role } from '../types/auth';
import { VanSetuLogo } from './landing/VanSetuLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RoleCardConfig {
  role: Role;
  title: string;
  scope: string;
  email: string;
  password: string;
  icon: React.ElementType;
  badgeColor: string;
  activeBorder: string;
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    role: 'CITIZEN',
    title: 'Citizen / Claimant',
    scope: 'Own claims visibility only',
    email: 'citizen@vansetu.in',
    password: 'Password123!',
    icon: UserIcon,
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/40',
    activeBorder: 'border-emerald-500 bg-emerald-950/60 ring-1 ring-emerald-500/50',
  },
  {
    role: 'FIELD_OFFICER',
    title: 'Field Officer',
    scope: 'Assigned district scope',
    email: 'officer@vansetu.in',
    password: 'Password123!',
    icon: ShieldCheck,
    badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/40',
    activeBorder: 'border-cyan-500 bg-cyan-950/60 ring-1 ring-cyan-500/50',
  },
  {
    role: 'DISTRICT_ADMIN',
    title: 'District Admin',
    scope: 'District-wide scope',
    email: 'admin.district@vansetu.in',
    password: 'Password123!',
    icon: Landmark,
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-950/40',
    activeBorder: 'border-amber-500 bg-amber-950/60 ring-1 ring-amber-500/50',
  },
  {
    role: 'STATE_ADMIN',
    title: 'State Admin',
    scope: 'State-wide full visibility',
    email: 'admin.state@vansetu.in',
    password: 'Password123!',
    icon: Building2,
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-950/40',
    activeBorder: 'border-purple-500 bg-purple-950/60 ring-1 ring-purple-500/50',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('CITIZEN');
  const [districtId, setDistrictId] = useState('DIST_OD_KANDHAMAL');
  const [selectedRoleCard, setSelectedRoleCard] = useState<Role | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Input DOM refs for programmatically controlling focus and dismissing Chrome autofill overlays (FIX 2)
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectRole = (card: RoleCardConfig) => {
    setSelectedRoleCard(card.role);
    setEmail(card.email);
    setPassword(card.password);
    setError(null);

    // FIX 2: Dismiss Chrome native autofill overlay popup by blurring input fields after programmatic set
    setTimeout(() => {
      if (emailInputRef.current) emailInputRef.current.blur();
      if (passwordInputRef.current) passwordInputRef.current.blur();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 10);
  };

  const handleAuthSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await axios.post('/api/auth/register', {
          name,
          email,
          password,
          role,
          districtId,
        });

        if (res.data.success) {
          // Auto login after registration
          const loginRes = await login(email, password);
          if (loginRes.success) {
            handleAuthSuccess();
          } else {
            setError(loginRes.error || 'Registration succeeded but login failed');
          }
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          const authenticatedUser = res.user;

          // FIX 3: Frontend Role Gating Check — compare JWT role claim against selected role card in UI
          if (selectedRoleCard && authenticatedUser && authenticatedUser.role !== selectedRoleCard) {
            // Role mismatch! Immediately revoke session & tokens, do not navigate anywhere
            await logout();
            // Generic security error message (does not disclose account existence or role mismatch)
            setError('Invalid email or password.');
            return;
          }

          handleAuthSuccess();
        } else {
          setError(res.error || 'Invalid credentials');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-emerald-500/30 p-6 sm:p-7 shadow-2xl relative bg-[#030B08] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header - FIX 1: Neutral production-facing language without demo/testing references */}
        <div className="mb-5 space-y-1.5">
          <VanSetuLogo variant="navbar" />
          <h2 className="text-xl sm:text-2xl font-bold text-white pt-2 font-heading">
            {isRegister ? 'Register VanSetu Account' : 'Login to VanSetu'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Create a new citizen or officer account with localized district assignment'
              : 'Select your administrative role below to pre-fill credentials, or enter your email and password manually.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Role Selector Grid - FIX 1: Production-facing "Select Your Role" section header */}
        {!isRegister && (
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Select Your Role
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                4 Role Tiers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLE_CARDS.map((card) => {
                const IconComp = card.icon;
                const isSelected = selectedRoleCard === card.role || email === card.email;

                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => handleSelectRole(card)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? card.activeBorder
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${card.badgeColor}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {card.title}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal leading-tight">
                      {card.scope}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form - FIX 2: Non-guessable name attributes & autocomplete="off"/"new-password" to suppress Chrome popup */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Majhi"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                ref={emailInputRef}
                type="email"
                required
                autoComplete="off"
                name="vs_usr_credential_identifier_field"
                id="vs_usr_credential_identifier_field"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const matched = ROLE_CARDS.find((r) => r.email === e.target.value);
                  setSelectedRoleCard(matched ? matched.role : null);
                }}
                placeholder="officer@vansetu.in"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                ref={passwordInputRef}
                type="password"
                required
                autoComplete="new-password"
                name="vs_usr_credential_secret_field"
                id="vs_usr_credential_secret_field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="CITIZEN">Citizen</option>
                  <option value="FIELD_OFFICER">Field Officer</option>
                  <option value="DISTRICT_ADMIN">District Admin</option>
                  <option value="STATE_ADMIN">State Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">District ID</label>
                <input
                  type="text"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-emerald-400 hover:underline cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
