import React, { useState } from 'react';
import { authService } from '../../lib/authService';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Coffee,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Store,
  ChefHat,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onOpenOnboarding: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onOpenOnboarding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const hasLiveSupabase = isSupabaseConfigured();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your work email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await authService.signInWithPassword(email, password || 'password123');
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onSuccess();
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email to receive a login link');
      return;
    }
    setIsLoading(true);
    setError(null);
    const res = await authService.signInWithMagicLink(email);
    setIsLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleQuickPreset = (role: 'owner' | 'manager' | 'cashier' | 'kitchen') => {
    authService.quickSignInAs(role);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#F97316] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#F97316]/20">
            TS
          </div>
          <div>
            <span className="font-black text-lg text-[#1C1917] tracking-tight block leading-tight">
              TSOS Cloud
            </span>
            <span className="text-[11px] text-[#78716C] font-medium block">
              Cafe & Restaurant Operating System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasLiveSupabase ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Supabase Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
              Offline / Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E9E0D6] animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">Staff Sign In</h1>
          <p className="text-xs text-[#78716C] mt-1">
            Access your POS terminal, Kitchen KDS, and shift register
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="font-bold">Notice:</span> {error}
          </div>
        )}

        {magicLinkSent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            ✨ Login link sent! Check your inbox to sign in instantly.
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1.5 uppercase tracking-wider">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="devraj@coolkafe.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E0D6] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#57534E] uppercase tracking-wider">
                Password / Passcode
              </label>
              <button
                type="button"
                onClick={handleMagicLink}
                className="text-xs text-[#F97316] hover:underline font-semibold"
              >
                Send Magic Link
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E0D6] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              'Authenticating...'
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Presets */}
        <div className="mt-6 pt-5 border-t border-[#F5F0EB]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] block mb-2 text-center">
            One-Click Staff Logins
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('owner')}
              className="p-2 rounded-xl bg-[#FFF9F2] hover:bg-[#FFEED9] border border-[#F97316]/20 text-center transition-all group"
            >
              <Store className="w-4 h-4 text-[#F97316] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-[#1C1917] block">Owner</span>
              <span className="text-[10px] text-[#78716C] block">Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('cashier')}
              className="p-2 rounded-xl bg-[#FFF9F2] hover:bg-[#FFEED9] border border-[#F97316]/20 text-center transition-all group"
            >
              <CreditCard className="w-4 h-4 text-[#17803D] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-[#1C1917] block">Cashier</span>
              <span className="text-[10px] text-[#78716C] block">POS Shift</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('kitchen')}
              className="p-2 rounded-xl bg-[#FFF9F2] hover:bg-[#FFEED9] border border-[#F97316]/20 text-center transition-all group"
            >
              <ChefHat className="w-4 h-4 text-[#7C3AED] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-[#1C1917] block">Kitchen</span>
              <span className="text-[10px] text-[#78716C] block">KDS Screen</span>
            </button>
          </div>
        </div>

        {/* Onboarding Trigger */}
        <div className="mt-5 pt-4 text-center border-t border-[#F5F0EB]">
          <p className="text-xs text-[#78716C]">
            Opening a new cafe location?{' '}
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="text-[#F97316] font-bold hover:underline"
            >
              Register & Setup Outlet
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-[#A8A29E] py-2">
        TSOS Cloud POS v2.6 · Enterprise Multi-Tenant Restaurant Suite · Realtime Supabase PostgreSQL
      </div>
    </div>
  );
};
