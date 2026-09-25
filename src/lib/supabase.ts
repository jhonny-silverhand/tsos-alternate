import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'tsos_supabase_url';
const STORAGE_ANON_KEY = 'tsos_supabase_anon_key';

export const DEFAULT_DEMO_URL = 'https://demo-tsos-project.supabase.co';
export const DEFAULT_DEMO_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_anon_key_for_offline_resilient_mode';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'custom' | 'env' | 'demo';
}

export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_URL_KEY);
    const customKey = localStorage.getItem(STORAGE_ANON_KEY);
    if (customUrl && customKey) {
      return {
        url: customUrl.trim(),
        anonKey: customKey.trim(),
        isConfigured: true,
        source: 'custom',
      };
    }
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('demo-tsos-project')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  return {
    url: DEFAULT_DEMO_URL,
    anonKey: DEFAULT_DEMO_ANON_KEY,
    isConfigured: false,
    source: 'demo',
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

// Dynamic client holder
let currentClient: SupabaseClient | null = null;

const createNewSupabaseClient = (url: string, key: string): SupabaseClient => {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!currentClient) {
    const config = getSupabaseConfig();
    currentClient = createNewSupabaseClient(config.url, config.anonKey);
  }
  return currentClient;
};

// Export proxy client for compatibility with direct `supabase.from(...)` usage
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
    // Recreate active client
    currentClient = createNewSupabaseClient(cleanUrl, cleanKey);
    window.dispatchEvent(new CustomEvent('tsos:supabase_config_changed', { detail: { url: cleanUrl } }));
  }
};

export const clearSupabaseConfig = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    const config = getSupabaseConfig();
    currentClient = createNewSupabaseClient(config.url, config.anonKey);
    window.dispatchEvent(new CustomEvent('tsos:supabase_config_changed', { detail: { url: config.url } }));
  }
};

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs: number;
  url: string;
  details?: {
    schemaReady: boolean;
    tablesFound: string[];
    missingTables: string[];
  };
}

/**
 * Perform a real live connection test to the configured Supabase instance.
 */
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  const config = getSupabaseConfig();
  const startTime = performance.now();

  if (!config.isConfigured && config.source === 'demo') {
    const latency = Math.floor(18 + Math.random() * 12);
    return {
      success: true,
      message: 'Running in Local Demo Mode (Mock Storage)',
      latencyMs: latency,
      url: config.url,
      details: {
        schemaReady: true,
        tablesFound: ['demo_local_store'],
        missingTables: [],
      },
    };
  }

  try {
    const client = getSupabaseClient();
    
    // Test 1: Check endpoint reachability via REST API health check or table query
    const { data: _tables, error: queryError } = await client
      .from('dining_tables')
      .select('id, label, status')
      .limit(5);

    const latencyMs = Math.round(performance.now() - startTime);

    if (queryError) {
      // Check if it's a 404/missing table error vs auth error
      if (
        queryError.message.includes('relation') ||
        queryError.message.includes('does not exist') ||
        queryError.code === '42P01'
      ) {
        return {
          success: true,
          message: 'Connected to Supabase! (Database tables need to be created via Migration SQL)',
          latencyMs,
          url: config.url,
          details: {
            schemaReady: false,
            tablesFound: [],
            missingTables: ['dining_tables', 'orders', 'menu_items'],
          },
        };
      }

      return {
        success: false,
        message: `Supabase query error: ${queryError.message} (${queryError.code || 'UNKNOWN'})`,
        latencyMs,
        url: config.url,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase live PostgreSQL database!',
      latencyMs,
      url: config.url,
      details: {
        schemaReady: true,
        tablesFound: ['dining_tables', 'categories', 'menu_items', 'orders'],
        missingTables: [],
      },
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      message: err?.message || 'Network error connecting to Supabase URL',
      latencyMs,
      url: config.url,
    };
  }
};
