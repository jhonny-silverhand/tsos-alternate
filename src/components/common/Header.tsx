import React from 'react';
import { useTsosStore } from '../../lib/store';
import { ActiveSurface } from '../../types';
import {
  Store,
  Smartphone,
  Monitor,
  QrCode,
  Compass,
  FileCode,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Printer,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { ConnectionStatusIndicator, CloudOfflineBanner } from './ConnectionStatusIndicator';
import { GuidanceTooltip } from './GuidanceTooltip';

export const Header: React.FC = () => {
  const {
    activeSurface,
    setActiveSurface,
    location,
    currentProfile,
    audioEnabled,
    toggleAudio,
    resetToSeed,
    feeConfig,
    printerConfig,
    guidanceMode,
    toggleGuidanceMode,
    startTour,
    setActiveWebTab,
  } = useTsosStore();

  const surfaces: { id: ActiveSurface; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'superadmin', label: 'SuperAdmin SaaS', icon: <ShieldAlert className="w-4 h-4 text-[#7C3AED]" />, badge: 'Platform Master' },
    { id: 'web', label: 'Web POS & Ops', icon: <Store className="w-4 h-4" /> },
    { id: 'android', label: 'Customer Android App', icon: <Smartphone className="w-4 h-4" />, badge: 'Kotlin/Compose' },
    { id: 'windows', label: 'Windows Client', icon: <Monitor className="w-4 h-4" />, badge: 'WPF .NET 9' },
    { id: 'storefront', label: 'Customer QR', icon: <QrCode className="w-4 h-4" /> },
    { id: 'order_track', label: 'Track Order', icon: <Compass className="w-4 h-4" /> },
    { id: 'marketing_v1', label: 'Marketing V1', icon: <Layers className="w-4 h-4" /> },
    { id: 'marketing_v2', label: 'Marketing V2', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'code_viewer', label: 'Sources & SQL', icon: <FileCode className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-[#E9E0D6] sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Location, Fee Engine Status & Quick Controls */}
      <div className="px-4 py-2 bg-[#FFF1E6] border-b border-[#F5E6D8] text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#57534E]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold bg-[#F97316] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            TSOS
          </span>
          <span className="font-semibold text-[#1C1917]">{location.name}</span>
          <span className="text-[#A8A29E]">|</span>
          <span className="text-[#57534E]">
            Model: <strong className="text-[#17803D]">₹0/mo</strong> + <strong className="text-[#F97316]">₹{feeConfig.per_order_fee}/order</strong>
          </span>
          <span className="hidden sm:inline text-[#A8A29E]">|</span>
          <span className="hidden sm:inline">
            Fee Payer: <span className="font-medium capitalize text-[#1C1917]">{feeConfig.default_fee_payer}</span>
            {feeConfig.auto_flip_enabled && (
              <span className="text-[#A8A29E] ml-1">
                ({feeConfig.period_order_count}/{feeConfig.customer_paid_order_limit} till flip)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Thermal Printer Quick Badge */}
          <GuidanceTooltip guideKey="thermal_printer_shortcut" position="bottom">
            <button
              onClick={() => {
                setActiveSurface('web');
                setActiveWebTab('settings');
              }}
              title="Thermal Printer Settings & Hardware Status"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E9E0D6] hover:bg-[#F5F0EB] text-[#57534E] text-[11px] font-mono font-medium transition-colors"
            >
              <Printer className="w-3 h-3 text-[#F97316]" />
              <span>{printerConfig.paper_width}</span>
              <span className="text-[10px] text-[#A8A29E]">({printerConfig.connection_type})</span>
            </button>
          </GuidanceTooltip>

          {/* Cloud Sync Status */}
          <GuidanceTooltip guideKey="cloud_sync_indicator" position="bottom">
            <ConnectionStatusIndicator />
          </GuidanceTooltip>

          {/* First-Time Usage & Hover Guidance Controls */}
          <GuidanceTooltip guideKey="guidance_toggle" position="bottom">
            <div className="flex items-center gap-1 bg-white border border-[#E9E0D6] rounded-md p-0.5">
              <button
                onClick={toggleGuidanceMode}
                title={guidanceMode ? 'Hover Guidance Enabled' : 'Hover Guidance Disabled'}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  guidanceMode
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                <span>Guidance</span>
              </button>
              <button
                onClick={startTour}
                title="Start Guided System Tour"
                className="px-1.5 py-0.5 text-[10px] font-semibold text-[#F97316] hover:bg-[#FFF9F2] rounded transition-colors"
              >
                Tour
              </button>
            </div>
          </GuidanceTooltip>

          {/* Audio Chime Toggle */}
          <GuidanceTooltip guideKey="audio_toggle" position="bottom">
            <button
              onClick={toggleAudio}
              title={audioEnabled ? 'Sound Effects Enabled' : 'Sound Effects Muted'}
              className="p-1 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-white/60 transition-colors"
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#A8A29E]" />}
            </button>
          </GuidanceTooltip>
          
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data (menu, orders, stock, tables)?')) {
                resetToSeed();
              }
            }}
            title="Reset to fresh demo data"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[#57534E] hover:text-[#B42318] hover:bg-white/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>

          <div className="h-3 w-[1px] bg-[#E9E0D6]" />
          <span className="text-[#57534E]">
            Logged in: <strong className="text-[#1C1917]">{currentProfile.name}</strong> ({currentProfile.role})
          </span>
        </div>
      </div>

      {/* Surface Switcher Bar */}
      <div className="px-4 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <GuidanceTooltip guideKey="surface_switcher" position="bottom" className="w-full">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-xs font-semibold text-[#A8A29E] uppercase tracking-wider mr-1 hidden md:inline">
              Surfaces:
            </span>
            {surfaces.map((s) => {
              const isActive = activeSurface === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSurface(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1C1917] text-white shadow-xs'
                      : 'text-[#57534E] hover:bg-[#F5F0EB] hover:text-[#1C1917]'
                  }`}
                >
                  {s.icon}
                  <span>{s.label}</span>
                  {s.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-[#F97316] text-white' : 'bg-[#E9E0D6] text-[#57534E]'
                      }`}
                    >
                      {s.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GuidanceTooltip>
      </div>

      {/* Persistent Cloud Offline Warning Banner */}
      <CloudOfflineBanner />
    </header>
  );
};
