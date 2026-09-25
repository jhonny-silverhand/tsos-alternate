import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Terminal,
  Server,
  Layers,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  ConnectionTestResult,
  DEFAULT_DEMO_URL,
} from '../../lib/supabase';
import { SUPABASE_MIGRATION_SQL } from '../../lib/supabaseMigrationSql';
import { useTsosStore } from '../../lib/store';

export const SupabaseConfigCard: React.FC = () => {
  const { triggerManualSync } = useTsosStore();

  const [config, setConfig] = useState(getSupabaseConfig());
  const [urlInput, setUrlInput] = useState(config.url);
  const [anonKeyInput, setAnonKeyInput] = useState(config.anonKey);
  const [showKey, setShowKey] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handleConfigChange = () => {
      const updated = getSupabaseConfig();
      setConfig(updated);
      setUrlInput(updated.url);
      setAnonKeyInput(updated.anonKey);
    };

    window.addEventListener('tsos:supabase_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('tsos:supabase_config_changed', handleConfigChange);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsSaving(true);
    saveSupabaseConfig(urlInput.trim(), anonKeyInput.trim());
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // Test new connection immediately
    handleTestConnection();
  };

  const handleResetToDemo = () => {
    if (window.confirm('Reset Supabase configuration back to demo sandbox mode?')) {
      clearSupabaseConfig();
      const updated = getSupabaseConfig();
      setConfig(updated);
      setUrlInput(updated.url);
      setAnonKeyInput(updated.anonKey);
      setTestResult(null);
      triggerManualSync();
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setIsTesting(false);
    await triggerManualSync();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_MIGRATION_SQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tsos_supabase_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDemo = !config.isConfigured || config.url === DEFAULT_DEMO_URL;

  return (
    <div className="bg-white rounded-3xl border border-[#E9E0D6] p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F5F0EB] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-[#1C1917] tracking-tight">
                Supabase & PostgreSQL Cloud Integration
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isDemo
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isDemo ? 'Demo Local Mode' : 'Connected to Supabase'}
              </span>
            </div>
            <p className="text-xs text-[#57534E] mt-0.5">
              Connect your Antigravity / Supabase database for real-time order sync, multi-tenant RLS, and cryptographic table sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E9E0D6] text-xs font-semibold text-[#57534E] hover:bg-[#F5F0EB] transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-[#F97316]" />
            <span>{showGuide ? 'Hide Guide' : 'Setup Guide'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
            title="Copy SQL migration to clipboard"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'SQL Copied!' : 'Copy Migration SQL'}</span>
          </button>
        </div>
      </div>

      {/* Antigravity Setup Quick Guide (Collapsible) */}
      {showGuide && (
        <div className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#E9E0D6] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>How to connect your Supabase project from Antigravity</span>
            </h4>
            <span className="text-[10px] text-[#A8A29E] font-mono">Step-by-step instructions</span>
          </div>

          <ol className="text-xs text-[#57534E] space-y-2 list-decimal pl-4 leading-relaxed">
            <li>
              <strong>Open your Supabase Project:</strong> Go to your Supabase project in your browser or local Supabase Studio dashboard.
            </li>
            <li>
              <strong>Execute Migration SQL:</strong> Navigate to the <strong>SQL Editor</strong> tab in Supabase. Click the <em>Copy Migration SQL</em> button above, paste the code into the editor, and click <strong>Run</strong>. This creates all tables (orders, menu, inventory, tables, RLS policies, and anti-tamper RPCs).
            </li>
            <li>
              <strong>Retrieve API Keys:</strong> Go to <strong>Project Settings ➔ API</strong>. Copy your <strong>Project URL</strong> and your <strong>anon public</strong> API key.
            </li>
            <li>
              <strong>Paste into TSOS:</strong> Paste both into the form below and click <strong>Save & Test Connection</strong>. TSOS will immediately start routing live transactions to your database!
            </li>
          </ol>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Supabase credentials saved securely in local browser storage.</span>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project URL */}
          <div>
            <label className="block text-xs font-semibold text-[#57534E] mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzabcdefghijklmnop.supabase.co"
                className="w-full pl-3 pr-10 py-2.5 text-xs font-mono rounded-xl border border-[#E9E0D6] bg-white text-[#1C1917] focus:border-[#F97316] focus:outline-hidden"
              />
              <Server className="w-4 h-4 text-[#A8A29E] absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-[#A8A29E] mt-1">
              Found in Project Settings ➔ API ➔ Project URL
            </p>
          </div>

          {/* Anon Public Key */}
          <div>
            <label className="block text-xs font-semibold text-[#57534E] mb-1">
              Supabase Anon / Public Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                required
                value={anonKeyInput}
                onChange={(e) => setAnonKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-3 pr-10 py-2.5 text-xs font-mono rounded-xl border border-[#E9E0D6] bg-white text-[#1C1917] focus:border-[#F97316] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-[#A8A29E] hover:text-[#57534E] p-0.5"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#A8A29E] mt-1">
              Found in Project Settings ➔ API ➔ Project API Keys (anon public)
            </p>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Connect'}</span>
            </button>

            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-4 py-2 rounded-xl bg-[#F5F0EB] hover:bg-[#E9E0D6] text-[#1C1917] text-xs font-semibold border border-[#E9E0D6] transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#F97316]' : ''}`} />
              <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isDemo && (
              <button
                type="button"
                onClick={handleResetToDemo}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
              >
                Reset to Demo Sandbox
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadSql}
              className="px-3 py-1.5 rounded-xl border border-[#E9E0D6] text-[#57534E] hover:bg-[#F5F0EB] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-1.5 rounded-xl border border-[#E9E0D6] text-[#57534E] hover:bg-[#F5F0EB] text-xs font-medium transition-colors flex items-center gap-1"
            >
              <span>{showSqlPreview ? 'Hide SQL' : 'View SQL'}</span>
              {showSqlPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </form>

      {/* Live Test Feedback Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-bold">{testResult.message}</span>
            </div>
            <span className="font-mono text-[10px] bg-white/70 px-2 py-0.5 rounded-md border border-current/20">
              {testResult.latencyMs} ms latency
            </span>
          </div>

          {testResult.details && (
            <div className="pt-2 border-t border-current/10 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="opacity-75">Schema Readiness: </span>
                <span className="font-semibold">
                  {testResult.details.schemaReady ? 'Tables Ready' : 'Tables Needed'}
                </span>
              </div>
              <div>
                <span className="opacity-75">Endpoint Tested: </span>
                <span className="font-mono truncate block max-w-xs">{testResult.url}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SQL Migration Code Block (Collapsible) */}
      {showSqlPreview && (
        <div className="p-4 rounded-2xl bg-[#1C1917] text-[#E9E0D6] space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F97316]" />
              <span className="font-mono font-bold text-xs text-white">tsos_supabase_schema.sql</span>
            </div>
            <button
              onClick={handleCopySql}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed text-stone-300 p-2 select-all">
            {SUPABASE_MIGRATION_SQL}
          </pre>
        </div>
      )}
    </div>
  );
};
