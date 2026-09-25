import React, { useState, useEffect, useRef } from 'react';
import { useTsosStore } from '../../lib/store';
import {
  Store,
  Volume2,
  VolumeX,
  Printer,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Lock,
  ChevronDown,
  User,
  ShieldAlert,
  Database,
  LogOut,
  MapPin,
  Clock as ClockIcon,
  Download,
} from 'lucide-react';
import { ConnectionStatusIndicator, CloudOfflineBanner } from './ConnectionStatusIndicator';
import { StaffPinModal } from './StaffPinModal';
import { HardwareDownloadsModal } from './HardwareDownloadsModal';
import { authService } from '../../lib/authService';

export const Header: React.FC = () => {
  const {
    location,
    currentProfile,
    audioEnabled,
    toggleAudio,
    feeConfig,
    printerConfig,
    setActiveSurface,
    setActiveWebTab,
    activeSurface,
    tenantBusinesses,
  } = useTsosStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#E9E0D6] sticky top-0 z-40 shadow-xs select-none">
        {/* Main Production POS Header */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Brand & Outlet Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black text-sm shadow-xs">
                TS
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-[#1C1917] tracking-tight">TSOS</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#FFF1E6] text-[#F97316] rounded-md border border-[#F97316]/20">
                    CLOUD POS
                  </span>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-[#E9E0D6] hidden sm:block" />

            {/* Outlet Selector Dropdown */}
            <div className="relative" ref={locationRef}>
              <button
                type="button"
                onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E9E0D6] bg-[#FFF9F2] hover:bg-[#F5F0EB] text-[#1C1917] text-xs font-bold transition-all shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="truncate max-w-[160px] md:max-w-[220px]">{location.name}</span>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>

              {isLocationMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-[#E9E0D6] p-2 z-50 animate-in fade-in">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    Cafe Locations
                  </div>
                  <button
                    onClick={() => setIsLocationMenuOpen(false)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#FFF1E6] text-[#F97316] font-semibold text-xs flex items-center justify-between"
                  >
                    <span>{location.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316] text-white">
                      Active
                    </span>
                  </button>
                  <div className="p-2 border-t border-[#F5F0EB] mt-1 text-[11px] text-[#78716C]">
                    GSTIN: <span className="font-mono text-[#1C1917]">{printerConfig.gstin || '29AABCT1337C1Z0'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#57534E] bg-white border border-[#E9E0D6] px-3 py-1.5 rounded-xl">
              <ClockIcon className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="font-mono font-bold text-[#1C1917]">{currentTime}</span>
              <span className="text-[#A8A29E]">·</span>
              <span className="text-[#78716C]">{currentDate}</span>
            </div>
          </div>

          {/* Right: Operational Hardware & Staff Controls */}
          <div className="flex items-center gap-2">
            {/* Thermal Printer Quick Badge */}
            <button
              onClick={() => {
                setActiveSurface('web');
                setActiveWebTab('settings');
              }}
              title="Thermal Printer Status (Click to configure)"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E9E0D6] hover:bg-[#F5F0EB] text-[#57534E] text-xs font-mono transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="font-bold text-[#1C1917]">{printerConfig.paper_width}</span>
              <span className="text-[10px] text-[#78716C]">({printerConfig.connection_type})</span>
            </button>

            {/* Cloud Sync Status Indicator */}
            <ConnectionStatusIndicator />

            {/* Audio Chime Toggle */}
            <button
              onClick={toggleAudio}
              title={audioEnabled ? 'Kitchen & POS Audio Chimes Enabled' : 'Audio Muted'}
              className="p-2 rounded-xl border border-[#E9E0D6] bg-white hover:bg-[#F5F0EB] text-[#57534E] hover:text-[#1C1917] transition-colors shadow-2xs"
            >
              {audioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#17803D]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#A8A29E]" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen POS Mode'}
              className="p-2 rounded-xl border border-[#E9E0D6] bg-white hover:bg-[#F5F0EB] text-[#57534E] hover:text-[#1C1917] transition-colors shadow-2xs hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Staff / Cashier Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border border-[#E9E0D6] bg-white hover:bg-[#F5F0EB] text-xs transition-all shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-[#FFF1E6] text-[#F97316] font-bold flex items-center justify-center text-[11px]">
                  {currentProfile.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-bold text-[#1C1917] block leading-tight truncate max-w-[110px]">
                    {currentProfile.name}
                  </span>
                  <span className="text-[10px] text-[#78716C] capitalize block leading-none">
                    {currentProfile.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-[#E9E0D6] p-2 z-50 animate-in fade-in space-y-1">
                  <div className="px-3 py-2 border-b border-[#F5F0EB]">
                    <span className="font-bold text-xs text-[#1C1917] block truncate">
                      {currentProfile.name}
                    </span>
                    <span className="text-[11px] text-[#78716C] capitalize block">
                      Active Role: {currentProfile.role}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsPinModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF9F2] text-xs font-semibold text-[#1C1917] flex items-center gap-2.5 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-[#F97316]" />
                    <span>Switch Staff PIN / Lock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActiveSurface('web');
                      setActiveWebTab('settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF9F2] text-xs font-semibold text-[#1C1917] flex items-center gap-2.5 transition-colors"
                  >
                    <Database className="w-4 h-4 text-[#78716C]" />
                    <span>Cloud Database & Keys</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsHardwareModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF9F2] text-xs font-semibold text-[#1C1917] flex items-center gap-2.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#F97316]" />
                    <span>Hardware Downloads</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActiveSurface('superadmin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF9F2] text-xs font-semibold text-[#7C3AED] flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#7C3AED]" />
                    <span>SuperAdmin Platform</span>
                  </button>

                  <div className="border-t border-[#F5F0EB] pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await authService.signOut();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-xs font-semibold text-rose-700 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out / Lock Terminal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Persistent Cloud Offline Warning Banner */}
        <CloudOfflineBanner />
      </header>

      {/* Fast Staff PIN Lock Modal */}
      <StaffPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Terminal Staff Sign-in / Lock"
      />

      {/* Hardware & Client Downloads Modal */}
      <HardwareDownloadsModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />
    </>
  );
};
