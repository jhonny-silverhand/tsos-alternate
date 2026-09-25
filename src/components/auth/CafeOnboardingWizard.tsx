import React, { useState } from 'react';
import { useTsosStore } from '../../lib/store';
import {
  Store,
  MapPin,
  Percent,
  QrCode,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface CafeOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const CafeOnboardingWizard: React.FC<CafeOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const { location, printerConfig, updatePrinterConfig } = useTsosStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cafeName, setCafeName] = useState('My Artisan Cafe');
  const [outletName, setOutletName] = useState('Downtown Branch');
  const [city, setCity] = useState('Bengaluru');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [gstRate, setGstRate] = useState<number>(5);
  const [upiId, setUpiId] = useState('cafe@okhdfcbank');
  const [gstin, setGstin] = useState('29AAAAA0000A1Z5');
  const [tableCount, setTableCount] = useState<number>(12);
  const [catalogTemplate, setCatalogTemplate] = useState<'coffee_bakery' | 'casual_dining' | 'blank'>('coffee_bakery');

  if (!isOpen) return null;

  const handleFinish = () => {
    useTsosStore.setState((s) => ({
      location: {
        ...s.location,
        name: `${cafeName} (${outletName})`,
        address: `${outletName}, ${city}`,
        phone: '+91 98765 43210',
      },
    }));

    updatePrinterConfig({
      receipt_header: cafeName.toUpperCase(),
      gstin: gstin,
    });

    onCompleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E9E0D6] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#FFF9F2] border-b border-[#E9E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F97316] text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1C1917]">Register New Cafe Outlet</h2>
              <p className="text-xs text-[#78716C]">Step {step} of 3 — Setup your business details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#E9E0D6]/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 bg-[#F5F0EB] h-1.5">
          <div className={`h-full transition-all ${step >= 1 ? 'bg-[#F97316]' : 'bg-transparent'}`} />
          <div className={`h-full transition-all ${step >= 2 ? 'bg-[#F97316]' : 'bg-transparent'}`} />
          <div className={`h-full transition-all ${step >= 3 ? 'bg-[#F97316]' : 'bg-transparent'}`} />
        </div>

        {/* Step Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <Store className="w-4 h-4 text-[#F97316]" />
                Brand & Location Profile
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-1">Cafe / Brand Name</label>
                <input
                  type="text"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                  placeholder="e.g. Roasters Cafe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">Outlet / Branch Name</label>
                  <input
                    type="text"
                    value={outletName}
                    onChange={(e) => setOutletName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                    placeholder="e.g. Indiranagar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                    placeholder="e.g. Bengaluru"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#F97316]" />
                Taxes, Currency & Digital Payments
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#57534E] mb-1">GST / Tax Rate (%)</label>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-1">UPI VPA (for Dynamic QR)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none font-mono"
                  placeholder="merchant@upi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none font-mono uppercase"
                  placeholder="29AAAAA0000A1Z5"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F97316]" />
                Dining Tables & Catalog Starter
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-1">Number of Dining Tables</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9E0D6] text-sm focus:ring-2 focus:ring-[#F97316] outline-none"
                />
                <p className="text-[11px] text-[#78716C] mt-1">
                  Unique tamper-proof QR codes will be generated for each table (T-01 through T-{tableCount}).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-2">Preset Menu Catalog</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatalogTemplate('coffee_bakery')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      catalogTemplate === 'coffee_bakery'
                        ? 'border-[#F97316] bg-[#FFF1E6] text-[#F97316]'
                        : 'border-[#E9E0D6] hover:bg-[#F5F0EB] text-[#57534E]'
                    }`}
                  >
                    <span className="font-bold text-xs block">Coffee & Bakery</span>
                    <span className="text-[10px] text-[#78716C] block">Espresso, Brews, Pastries & Snacks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogTemplate('casual_dining')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      catalogTemplate === 'casual_dining'
                        ? 'border-[#F97316] bg-[#FFF1E6] text-[#F97316]'
                        : 'border-[#E9E0D6] hover:bg-[#F5F0EB] text-[#57534E]'
                    }`}
                  >
                    <span className="font-bold text-xs block">Casual Dining</span>
                    <span className="text-[10px] text-[#78716C] block">Starters, Mains, Mocktails & Desserts</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-[#FFF9F2] border-t border-[#E9E0D6] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl border border-[#E9E0D6] text-xs font-bold text-[#57534E] hover:bg-[#F5F0EB] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Launch Cafe Terminal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
