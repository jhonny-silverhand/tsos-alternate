import React, { useState, useRef, useEffect } from 'react';
import { useTsosStore } from '../../lib/store';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Server,
  Activity,
  X,
  Settings,
} from 'lucide-react';
import { getSupabaseConfig } from '../../lib/supabase';

export const ConnectionStatusIndicator: React.FC = () => {
  const { cloudSync, triggerManualSync, toggleSimulatedOffline, setActiveWebTab, setActiveSurface } = useTsosStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const supabaseConfig = getSupabaseConfig();

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingLocal(true);
    await triggerManualSync();
    setIsSyncingLocal(false);
  };

  const isOffline = cloudSync.status === 'offline' || cloudSync.simulatedOffline;
  const isSyncing = cloudSync.status === 'syncing' || isSyncingLocal;

  const formatLastSync = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 5) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button / Badge */}
      <button
        id="cloud-status-indicator-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border shadow-xs ${
          isOffline
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse'
            : isSyncing
            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
        }`}
        title="Click to view Cloud Database Connection & Sync details"
      >
        {isOffline ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            <CloudOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="font-mono">Offline</span>
            {cloudSync.pendingChangesCount > 0 && (
              <span className="bg-rose-200 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {cloudSync.pendingChangesCount} queued
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
            <span>Syncing DB...</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Cloud Synced</span>
            <span className="hidden sm:inline text-[10px] font-mono text-emerald-600/80">
              ({cloudSync.latencyMs}ms)
            </span>
          </>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E9E0D6] z-50 p-4 animate-in fade-in slide-in-from-top-2 text-[#1C1917]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F0EB]">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isOffline ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isOffline ? <CloudOff className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#1C1917]">Database Synchronization</h4>
                <p className="text-[10px] text-[#A8A29E]">Cloud DB Health & Offline Cache</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#A8A29E] hover:text-[#57534E] p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Details */}
          <div className="py-3 space-y-2.5 text-xs">
            {/* Status Pill */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9F2] border border-[#E9E0D6]">
              <span className="text-[#57534E] font-medium text-xs">Cloud Status</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isOffline
                    ? 'bg-rose-100 text-rose-800'
                    : isSyncing
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isOffline ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>Disconnected (Offline Mode)</span>
                  </>
                ) : isSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Connected & Up to date</span>
                  </>
                )}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-[#F5F0EB] rounded-xl">
                <div className="text-[10px] text-[#57534E] flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#A8A29E]" />
                  <span>Heartbeat / Ping</span>
                </div>
                <div className="font-mono font-bold text-xs mt-0.5 text-[#1C1917]">
                  {isOffline ? '0 ms (Halted)' : `${cloudSync.latencyMs} ms (Healthy)`}
                </div>
              </div>

              <div className="p-2 bg-[#F5F0EB] rounded-xl">
                <div className="text-[10px] text-[#57534E] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-[#A8A29E]" />
                  <span>Last Synced</span>
                </div>
                <div className="font-mono font-bold text-xs mt-0.5 text-[#1C1917]">
                  {formatLastSync(cloudSync.lastSyncedAt)}
                </div>
              </div>
            </div>

            {/* Offline Pending Queue */}
            <div className="p-2.5 rounded-xl border border-[#E9E0D6] bg-white flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-[#1C1917]">Offline Pending Queue</div>
                <div className="text-[10px] text-[#A8A29E]">
                  Changes stored in browser local state
                </div>
              </div>
              <span
                className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                  cloudSync.pendingChangesCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-[#F5F0EB] text-[#57534E]'
                }`}
              >
                {cloudSync.pendingChangesCount} operations
              </span>
            </div>

            {/* Cloud Target Endpoint */}
            <div className="p-2.5 rounded-xl bg-[#FFF9F2] text-[11px] text-[#57534E] flex items-start gap-2.5 border border-[#E9E0D6]">
              <Server className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1C1917]">Supabase Backend:</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      supabaseConfig.isConfigured
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {supabaseConfig.isConfigured ? 'Custom Supabase' : 'Demo Sandbox'}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#57534E] truncate block mt-0.5">
                  {cloudSync.endpoint}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Simulation */}
          <div className="pt-3 border-t border-[#F5F0EB] space-y-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncClick}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isSyncing
                  ? 'bg-[#E9E0D6] text-[#A8A29E] cursor-not-allowed'
                  : 'bg-[#1C1917] text-white hover:bg-black shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing with Database...' : 'Force Sync with Cloud DB'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSurface('web');
                setActiveWebTab('settings');
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[#F5F0EB] hover:bg-[#E9E0D6] text-[#1C1917] border border-[#E9E0D6] transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Configure Supabase Keys & SQL Migration</span>
            </button>

            {/* Test Simulation Switch */}
            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
                {cloudSync.simulatedOffline ? (
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="text-[11px]">Simulate Cloud Disconnect</span>
              </div>
              <button
                type="button"
                onClick={toggleSimulatedOffline}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  cloudSync.simulatedOffline ? 'bg-rose-500' : 'bg-stone-300'
                }`}
                title="Toggle simulated network drop to test offline resilience"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    cloudSync.simulatedOffline ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CloudOfflineBanner: React.FC = () => {
  const { cloudSync, triggerManualSync, toggleSimulatedOffline } = useTsosStore();

  const isOffline = cloudSync.status === 'offline' || cloudSync.simulatedOffline;

  if (!isOffline) return null;

  return (
    <div
      id="cloud-offline-warning-banner"
      className="bg-rose-600 text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs transition-all animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0 animate-pulse" />
        <span>
          <strong>Cloud Synchronization Disconnected:</strong> Running in local offline-first mode.
          Orders and loyalty ledger are safely preserved and will auto-sync when connection is restored.
        </span>
        {cloudSync.pendingChangesCount > 0 && (
          <span className="bg-rose-700 text-rose-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {cloudSync.pendingChangesCount} pending update{cloudSync.pendingChangesCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => triggerManualSync()}
          className="px-2.5 py-0.5 rounded-lg bg-white text-rose-700 font-semibold text-[11px] hover:bg-rose-50 transition-colors flex items-center gap-1 shadow-xs"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry Sync</span>
        </button>
        {cloudSync.simulatedOffline && (
          <button
            onClick={toggleSimulatedOffline}
            className="px-2 py-0.5 rounded-lg bg-rose-700 text-white text-[11px] hover:bg-rose-800 transition-colors"
          >
            Disable Simulation
          </button>
        )}
      </div>
    </div>
  );
};
