import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { useTsosStore } from './store';
import { Profile } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'kitchen';
  business_id: string;
  location_id?: string;
}

class AuthService {
  private static instance: AuthService;

  private constructor() {
    this.initSessionListener();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initSessionListener(): void {
    if (typeof window === 'undefined') return;

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        client.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const user = session.user;
            const meta = user.user_metadata || {};
            const store = useTsosStore.getState();

            const profile: Profile = {
              id: user.id,
              name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Staff Member',
              role: (meta.role as any) || 'owner',
              email: user.email || 'user@cafe.local',
              business_id: meta.business_id || store.currentProfile.business_id,
              pin_code: meta.pin_code || '1234',
              is_active: true,
            };

            store.setCurrentProfile(profile);
            store.setCloudSyncStatus('connected');
          } else if (event === 'SIGNED_OUT') {
            // handle sign out
          }
        });
      } catch (err) {
        console.warn('Supabase auth state listener error:', err);
      }
    }
  }

  public async signInWithPassword(email: string, pass: string): Promise<{ user?: AuthUser; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          const meta = data.user.user_metadata || {};
          const store = useTsosStore.getState();
          const profile: Profile = {
            id: data.user.id,
            name: meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Staff User',
            role: (meta.role as any) || 'owner',
            email: data.user.email || email,
            business_id: meta.business_id || store.currentProfile.business_id,
            pin_code: meta.pin_code || '1234',
            is_active: true,
          };
          store.setCurrentProfile(profile);
          return {
            user: {
              id: data.user.id,
              email: data.user.email || email,
              name: profile.name,
              role: profile.role as any,
              business_id: profile.business_id,
            },
          };
        }
      } catch (err: any) {
        return { error: err.message || 'Authentication failed' };
      }
    }

    // Offline / Demo fallback authentication
    const store = useTsosStore.getState();
    const demoStaff = store.staffMembers.find((s) => s.email?.toLowerCase() === email.toLowerCase());

    const role = demoStaff
      ? demoStaff.role === 'manager'
        ? 'owner'
        : demoStaff.role === 'chef'
        ? 'kitchen'
        : 'cashier'
      : 'owner';

    const profile: Profile = {
      id: demoStaff?.id || 'usr-local-owner',
      name: demoStaff?.name || email.split('@')[0] || 'Cafe Owner',
      role,
      email,
      business_id: store.currentProfile.business_id,
      pin_code: demoStaff?.pin_code || '1234',
      is_active: true,
    };

    store.setCurrentProfile(profile);
    return {
      user: {
        id: profile.id,
        email,
        name: profile.name,
        role: profile.role as any,
        business_id: profile.business_id,
      },
    };
  }

  public async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        error: 'Demo Mode: In production with live Supabase, a login link will be sent to your email.',
      };
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch magic link' };
    }
  }

  public async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        await client.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }

    // Reset profile session in store
    const store = useTsosStore.getState();
    store.setCurrentProfile({
      id: '',
      name: '',
      role: 'cashier',
      email: '',
      business_id: '',
      pin_code: '',
      is_active: false,
    });
  }

  public quickSignInAs(role: 'owner' | 'manager' | 'cashier' | 'kitchen'): void {
    const store = useTsosStore.getState();
    const staff = store.staffMembers.find((s) => {
      if (role === 'owner') return s.role === 'manager';
      if (role === 'kitchen') return s.role === 'chef';
      return s.role === role;
    });

    const profile: Profile = {
      id: staff?.id || `staff-${role}`,
      name: staff?.name || (role === 'owner' ? 'Devraj Sen (Owner)' : 'Rajesh Kumar (Cashier)'),
      role: role === 'manager' ? 'owner' : role,
      email: staff?.email || `${role}@coolkafe.in`,
      business_id: store.tenantBusinesses[0]?.id || 'biz-indiranagar-01',
      pin_code: staff?.pin_code || '1234',
      is_active: true,
    };

    store.setCurrentProfile(profile);
  }
}

export const authService = AuthService.getInstance();
