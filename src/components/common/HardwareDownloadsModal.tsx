import React from 'react';
import {
  Monitor,
  Smartphone,
  Printer,
  Download,
  Terminal,
  Wifi,
  Usb,
  Bluetooth,
  ExternalLink,
  X,
  CheckCircle2,
} from 'lucide-react';

interface HardwareDownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareDownloadsModal: React.FC<HardwareDownloadsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#E9E0D6] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF9F2] border-b border-[#E9E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F97316] text-white flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1C1917]">Hardware & Client Downloads</h2>
              <p className="text-xs text-[#78716C]">
                Native desktop terminal, waiter Android tablet APK, and ESC/POS thermal printers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#E9E0D6]/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Windows Desktop Client */}
          <div className="p-4 rounded-2xl border border-[#E9E0D6] bg-white hover:border-[#F97316]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1C1917]">Windows POS Terminal (WPF .NET 9)</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    v2.4.0
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Direct COM-Port cash drawer kick, raw serial ESC/POS printing without browser dialogue, and zero-latency bump bars.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#A8A29E]">
                  <span>Windows 10/11 x64</span>
                  <span>•</span>
                  <span>Direct Serial RS232 / USB</span>
                </div>
              </div>
            </div>
            <a
              href="#download-windows"
              onClick={(e) => {
                e.preventDefault();
                alert('Downloading TSOS Windows Terminal Installer (TSOS-Setup-x64.exe)...');
              }}
              className="px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shrink-0 flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.exe)</span>
            </a>
          </div>

          {/* Android Mobile & Tablet App */}
          <div className="p-4 rounded-2xl border border-[#E9E0D6] bg-white hover:border-[#F97316]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1C1917]">Android Waiter & Captain App (Jetpack Compose)</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    APK
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Table-side ordering for captains, table merges, course holds, and Bluetooth portable thermal receipt printing.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#A8A29E]">
                  <span>Android 8.0+ (ARM64)</span>
                  <span>•</span>
                  <span>Bluetooth / Wi-Fi Network</span>
                </div>
              </div>
            </div>
            <a
              href="#download-android"
              onClick={(e) => {
                e.preventDefault();
                alert('Downloading TSOS Android Waiter APK (tsos-waiter-release.apk)...');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
            </a>
          </div>

          {/* Thermal Receipt Printers Setup Guide */}
          <div className="p-4 rounded-2xl border border-[#E9E0D6] bg-[#FFF9F2]">
            <div className="flex items-center gap-2.5 mb-2">
              <Printer className="w-4 h-4 text-[#F97316]" />
              <h4 className="font-bold text-xs text-[#1C1917]">Thermal Receipt Hardware Compatibility</h4>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed">
              TSOS supports all standard 80mm and 58mm ESC/POS thermal receipt printers (Epson TM-T82, Star Micronics TSP143, TVS RP-3200, Everycom, NGX Bluetooth printers).
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div className="p-2 bg-white rounded-xl border border-[#E9E0D6] text-center">
                <Usb className="w-4 h-4 text-[#57534E] mx-auto mb-1" />
                <span className="font-semibold text-[11px] block">USB / Serial</span>
                <span className="text-[10px] text-[#A8A29E]">Zero driver config</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-[#E9E0D6] text-center">
                <Wifi className="w-4 h-4 text-[#57534E] mx-auto mb-1" />
                <span className="font-semibold text-[11px] block">LAN / IP Printer</span>
                <span className="text-[10px] text-[#A8A29E]">Kitchen order routing</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-[#E9E0D6] text-center">
                <Bluetooth className="w-4 h-4 text-[#57534E] mx-auto mb-1" />
                <span className="font-semibold text-[11px] block">Bluetooth POS</span>
                <span className="text-[10px] text-[#A8A29E]">Handheld mobile billers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F5F0EB]/60 border-t border-[#E9E0D6] flex items-center justify-between">
          <span className="text-xs text-[#78716C]">
            Need hardware drivers or ESC/POS COM port mapping assistance?
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-[#E9E0D6] hover:bg-[#F5F0EB] text-xs font-bold text-[#1C1917]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
