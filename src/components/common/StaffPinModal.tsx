import React, { useState } from 'react';
import { useTsosStore } from '../../lib/store';
import { StaffMember } from '../../types';
import { Lock, Delete, Check, X, Shield, UserCheck, KeyRound } from 'lucide-react';

interface StaffPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (staff: StaffMember) => void;
  title?: string;
}

export const StaffPinModal: React.FC<StaffPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Terminal Staff Sign-in',
}) => {
  const { staffMembers, currentProfile, setCurrentProfile } = useTsosStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      // Auto-validate if 4 digits
      if (newPin.length === 4) {
        verifyPin(newPin, selectedStaff);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (pinToTest: string, staffTarget: StaffMember | null) => {
    let matchedStaff: StaffMember | undefined;

    if (staffTarget) {
      if (staffTarget.pin_code === pinToTest) {
        matchedStaff = staffTarget;
      }
    } else {
      matchedStaff = staffMembers.find((s) => s.pin_code === pinToTest);
    }

    if (matchedStaff) {
      setCurrentProfile({
        id: matchedStaff.id,
        name: matchedStaff.name,
        role: matchedStaff.role === 'manager'
          ? 'owner'
          : matchedStaff.role === 'chef'
          ? 'kitchen'
          : 'cashier',
        email: `${matchedStaff.name.toLowerCase().replace(/\s+/g, '')}@cafe.local`,
        business_id: currentProfile.business_id,
        pin_code: matchedStaff.pin_code,
        is_active: matchedStaff.is_active,
      });

      if (onSuccess) {
        onSuccess(matchedStaff);
      }
      onClose();
      setPin('');
      setSelectedStaff(null);
    } else {
      setError('Invalid PIN code. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#E9E0D6] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF9F2] border-b border-[#E9E0D6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1C1917]">{title}</h3>
              <p className="text-[11px] text-[#78716C]">Enter your 4-digit staff PIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#E9E0D6]/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Staff Quick Selector */}
        <div className="p-4 bg-white border-b border-[#F5F0EB]">
          <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block mb-2">
            Select Staff Member:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {staffMembers.slice(0, 4).map((staff) => {
              const isSelected = selectedStaff?.id === staff.id;
              const isCurrent = currentProfile.name === staff.name;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(staff);
                    setPin('');
                    setError('');
                  }}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    isSelected
                      ? 'border-[#F97316] bg-[#FFF1E6] text-[#F97316] font-semibold shadow-2xs'
                      : 'border-[#E9E0D6] bg-white text-[#57534E] hover:border-[#F97316]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{staff.name}</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active user" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#78716C] capitalize block">
                    {staff.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="p-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  idx < pin.length
                    ? 'bg-[#F97316] border-[#F97316] scale-110'
                    : 'border-[#D6D3D1] bg-[#F5F5F4]'
                }`}
              />
            ))}
          </div>

          {error ? (
            <p className="text-xs text-rose-600 font-medium h-5">{error}</p>
          ) : (
            <p className="text-[11px] text-[#78716C] h-5">
              {selectedStaff ? `Logging in as ${selectedStaff.name}` : 'Enter code using keypad below'}
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mt-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-2xl bg-[#F5F0EB] hover:bg-[#E9E0D6] active:scale-95 text-lg font-bold text-[#1C1917] flex items-center justify-center transition-all shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-white border border-[#E9E0D6] hover:bg-[#F5F0EB] active:scale-95 text-xs font-semibold text-[#78716C] flex items-center justify-center transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-2xl bg-[#F5F0EB] hover:bg-[#E9E0D6] active:scale-95 text-lg font-bold text-[#1C1917] flex items-center justify-center transition-all shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-white border border-[#E9E0D6] hover:bg-[#F5F0EB] active:scale-95 text-base font-bold text-[#78716C] flex items-center justify-center transition-all"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Demo PIN Hint for easy switching */}
        <div className="px-6 py-3 bg-[#F5F0EB]/60 border-t border-[#E9E0D6] text-[11px] text-[#78716C] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#F97316]" />
            Default PINs:
          </span>
          <span className="font-mono text-[10px]">
            Owner: <strong>1234</strong> | Cashier: <strong>2345</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
