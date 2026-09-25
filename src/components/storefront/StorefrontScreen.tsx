import React, { useState, useEffect } from 'react';
import { useTsosStore } from '../../lib/store';
import { MenuItem, DineTable } from '../../types';
import { VariantModal } from '../pos/VariantModal';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Utensils,
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  AlertOctagon,
  Timer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SESSION_DURATION_SECONDS = 10 * 60; // 10 minutes session limit

export const StorefrontScreen: React.FC = () => {
  const {
    location,
    categories,
    menuItems,
    tables,
    selectedTableId,
    setSelectedTableId,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    createOrder,
    setActiveSurface,
    setTrackedOrderId,
    feeConfig,
  } = useTsosStore();

  const [selectedCatId, setSelectedCatId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [isTamperSimulated, setIsTamperSimulated] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const tableSlug = selectedTable ? selectedTable.label.toLowerCase().replace(/[^a-z0-9]/g, '') : 't1';
  const cafeSlug = location.slug || 'coolkafe';

  // 10-Minute Dynamic QR Session Token State
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return `SES-${tableSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  });
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(SESSION_DURATION_SECONDS);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number>(() => Date.now() + SESSION_DURATION_SECONDS * 1000);

  // Initialize and renew 10-minute session
  const renewSession = () => {
    const newToken = `SES-${tableSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setSessionToken(newToken);
    setSessionSecondsLeft(SESSION_DURATION_SECONDS);
    setSessionExpiresAt(Date.now() + SESSION_DURATION_SECONDS * 1000);
    setIsTamperSimulated(false);
  };

  // Re-generate session when table changes
  useEffect(() => {
    renewSession();
  }, [selectedTableId]);

  // Live countdown timer for 10-minute validity
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      setSessionSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const isSessionExpired = sessionSecondsLeft <= 0;

  // Format MM:SS for user display
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const safeMenuItems = menuItems || [];
  const filteredItems = safeMenuItems.filter((item) => {
    if (!item.is_available) return false;
    if (selectedCatId !== 'all' && item.category_id !== selectedCatId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate totals
  const safeCart = cart || [];
  const subtotal = safeCart.reduce((sum, i) => sum + (i?.item_total || 0), 0);
  const taxTotal = +(subtotal * 0.05).toFixed(2);
  const feePayer = feeConfig?.default_fee_payer ?? 'customer';
  const platformFee = feeConfig?.per_order_fee ?? 5;
  const grandTotal = Math.max(
    0,
    +(subtotal + taxTotal + (feePayer === 'customer' ? platformFee : 0)).toFixed(2)
  );

  const handlePlaceOrder = () => {
    if (safeCart.length === 0 || isTamperSimulated || isSessionExpired) return;
    setIsOrdering(true);

    setTimeout(() => {
      const order = createOrder({
        paymentMethod: 'upi',
        customPlacedBy: selectedTable
          ? `Customer (${selectedTable.label} QR • ${sessionToken.substring(0, 14)})`
          : 'Customer (Self-Order QR)',
        customerNotes: customerNotes
          ? `${customerNotes} [Phone: ${customerPhone}] [Session: ${sessionToken}]`
          : `[Session: ${sessionToken}]`,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F97316', '#17803D'],
      });

      setIsOrdering(false);
      setIsCartOpen(false);
      setTrackedOrderId(order.id);
      setActiveSurface('order_track');
    }, 500);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] bg-[#FFF9F2] flex flex-col items-center justify-start p-2 sm:p-4">
      {/* Simulation Controls Banner */}
      <div className="w-full max-w-md mb-2 p-2.5 bg-white rounded-2xl border border-[#E9E0D6] shadow-xs flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-[#1C1917]">QR Security Test:</span>
            <span className="font-mono text-[10px] text-[#57534E] truncate">
              /{cafeSlug}/{tableSlug}?token={isTamperSimulated ? 'INVALID_SPOOF' : (selectedTable?.qr_token || 'verified')}
            </span>
          </div>
          <button
            onClick={() => setActiveSurface('web')}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] bg-[#F5F0EB] hover:bg-[#E9E0D6] border border-[#E9E0D6] transition-colors"
            title="Return to Staff POS"
          >
            Exit to POS
          </button>
        </div>

        {/* 10-Minute Anti-History Token Ribbon */}
        <div className="flex items-center justify-between bg-[#FFF9F2] p-1.5 rounded-xl border border-[#E9E0D6] text-[11px]">
          <div className="flex items-center gap-1.5">
            <Timer className={`w-3.5 h-3.5 ${isSessionExpired ? 'text-rose-600' : 'text-[#F97316]'}`} />
            <span className="font-semibold text-[#1C1917]">10m QR Session:</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded-md ${
                isSessionExpired
                  ? 'bg-rose-100 text-rose-700'
                  : sessionSecondsLeft < 120
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isSessionExpired ? 'EXPIRED' : formatTimer(sessionSecondsLeft)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isSessionExpired ? (
              <button
                onClick={() => {
                  setSessionSecondsLeft(0);
                  setSessionExpiresAt(Date.now() - 1000);
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold"
                title="Simulate diner opening link from history 2 hours later from home"
              >
                Expire (Test History)
              </button>
            ) : (
              <button
                onClick={renewSession}
                className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Re-scan QR</span>
              </button>
            )}

            <button
              onClick={() => setIsTamperSimulated(!isTamperSimulated)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                isTamperSimulated
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
              title="Toggle URL tampering"
            >
              {isTamperSimulated ? 'Spoofed' : 'Tamper'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Frame Container */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9E0D6] shadow-xl overflow-hidden flex flex-col min-h-[85vh]">
        {/* Brand Hero Bar */}
        <div className="p-4 bg-gradient-to-r from-[#FFF1E6] via-[#FFF9F2] to-white border-b border-[#E9E0D6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#17803D] animate-pulse" />
              <h1 className="font-bold text-base text-[#1C1917] font-display">
                {location.name}
              </h1>
            </div>
            {selectedTable ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1C1917] text-white">
                {selectedTable.label}
              </span>
            ) : (
              <select
                value={selectedTableId || ''}
                onChange={(e) => setSelectedTableId(e.target.value || null)}
                className="text-xs font-semibold px-2 py-1 rounded-lg border border-[#E9E0D6] bg-white text-[#F97316]"
              >
                <option value="">Select Table #</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.seats}s)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Anti-Tamper Status Indicator */}
          {isTamperSimulated ? (
            <div className="mt-2.5 p-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-center gap-2 text-xs text-[#991B1B]">
              <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">Tamper Protection Active:</span> URL modified without physical QR scan. Ordering locked.
              </div>
            </div>
          ) : (
            <div className="mt-2.5 p-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-[11px] text-[#166534]">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Physical QR Verified • Table {selectedTable?.label || 'T1'}</span>
              </div>
              <span className="text-[10px] text-[#15803D]/70 font-mono">HMAC Valid</span>
            </div>
          )}

          <p className="text-xs text-[#57534E] mt-1.5">
            Table Self-Ordering • Freshly crafted food & artisan coffee
          </p>
        </div>

        {/* If Tampered: Block ordering */}
        {isTamperSimulated ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center border border-[#FCA5A5]">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Table QR Verification Required</h3>
            <p className="text-xs text-[#57534E] max-w-xs leading-relaxed">
              We detected a manual URL change to <strong>/{cafeSlug}/{tableSlug}</strong>. To prevent spam and cross-table ordering errors, you must scan the physical QR code sticker on your table.
            </p>
            <button
              onClick={() => setIsTamperSimulated(false)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-semibold"
            >
              Scan Table QR (Simulate Scanned Token)
            </button>
          </div>
        ) : isSessionExpired ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Table QR Session Expired</h3>
            <p className="text-xs text-[#57534E] max-w-xs leading-relaxed">
              For security, table ordering sessions automatically expire after <strong>10 minutes</strong>. This prevents orders from being placed via browser history or bookmarked links after leaving the table.
            </p>
            <div className="p-3 bg-[#FFF9F2] rounded-xl border border-[#E9E0D6] text-xs text-[#78716C] max-w-xs text-left space-y-1">
              <div className="font-semibold text-[#1C1917]">Why did this happen?</div>
              <p className="text-[11px]">
                Your physical scan at <strong>{selectedTable?.label}</strong> has expired. Please re-scan the QR code sticker placed on your table.
              </p>
            </div>
            <button
              onClick={renewSession}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-scan QR / Start New 10m Session</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search & Categories */}
            <div className="p-3 border-b border-[#F5F0EB] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coffee, tea, snacks..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E9E0D6] bg-[#FFF9F2] focus:bg-white focus:outline-hidden text-[#1C1917]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCatId('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCatId === 'all'
                      ? 'bg-[#1C1917] text-white'
                      : 'bg-[#F5F0EB] text-[#57534E]'
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCatId(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCatId === c.id
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#F5F0EB] text-[#57534E]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-[#E9E0D6] bg-white hover:border-[#F97316]/40 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-xs border ${
                          item.is_veg ? 'border-emerald-600' : 'border-red-600'
                        } flex items-center justify-center p-0.5`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            item.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                      </span>
                      <h3 className="font-bold text-xs text-[#1C1917] truncate">{item.name}</h3>
                    </div>

                    <p className="text-[11px] text-[#57534E] line-clamp-2 leading-tight">
                      {item.description}
                    </p>

                    <div className="text-xs font-mono font-bold text-[#1C1917] mt-2">
                      ₹{item.price}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover bg-[#F5F0EB]"
                    />
                    <button
                      onClick={() => {
                        const hasVars = item.variants && item.variants.length > 0;
                        const hasAddons = item.addon_ids && item.addon_ids.length > 0;
                        if (hasVars || hasAddons) setCustomizingItem(item);
                        else addToCart(item);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="p-3 bg-white border-t border-[#E9E0D6]">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-mono text-[10px]">
                  {safeCart.reduce((sum, i) => sum + (i?.qty || 0), 0)}
                </span>
                <span>View My Order</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-sm font-bold">
                <span>₹{grandTotal}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Cart Modal / Sheet for Customer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#E9E0D6]">
            <div className="p-4 bg-[#FFF9F2] border-b border-[#E9E0D6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#F97316]" />
                <h3 className="font-bold text-sm text-[#1C1917]">Your Cart</h3>
                {selectedTable && (
                  <span className="text-xs text-[#57534E]">({selectedTable.label})</span>
                )}
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-xs text-[#57534E]">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E0D6] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#1C1917]">{item.menu_item.name}</div>
                    {item.variant && (
                      <div className="text-[10px] text-[#57534E]">{item.variant.name}</div>
                    )}
                    <div className="font-mono font-bold mt-0.5">₹{item.item_total}</div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#F5F0EB] px-2 py-0.5 rounded-lg">
                    <button
                      onClick={() => updateCartQty(item.id, -1)}
                      className="p-0.5 text-[#57534E]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold font-mono">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.id, 1)}
                      className="p-0.5 text-[#57534E]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="space-y-2 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aditi"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E9E0D6] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Kitchen Note / Requests
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Extra hot, less sugar"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E9E0D6] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="p-3 bg-[#FFF9F2] rounded-xl border border-[#E9E0D6] space-y-1 text-xs text-[#57534E]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-mono">₹{taxTotal.toFixed(2)}</span>
                </div>
                {feePayer === 'customer' && (
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="font-mono">₹{platformFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-[#1C1917] pt-1 border-t border-[#E9E0D6]">
                  <span>Total Payable</span>
                  <span className="font-mono text-[#F97316]">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E9E0D6] space-y-2">
              {isSessionExpired ? (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Session expired (10m limit)</span>
                  </div>
                  <button
                    onClick={renewSession}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700"
                  >
                    Re-scan QR
                  </button>
                </div>
              ) : null}

              <button
                disabled={isOrdering || isSessionExpired || isTamperSimulated}
                onClick={handlePlaceOrder}
                className="w-full py-3 rounded-xl bg-[#17803D] hover:bg-[#156f35] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isOrdering
                    ? 'Submitting to Kitchen...'
                    : isSessionExpired
                    ? 'Session Expired - Re-scan QR'
                    : isTamperSimulated
                    ? 'Order Locked (Tampered URL)'
                    : `Pay & Send Order (₹${grandTotal})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Variant Modal */}
      {customizingItem && (
        <VariantModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onConfirm={(variantId, addonIds, notes) => {
            addToCart(customizingItem, variantId, addonIds, notes);
            setCustomizingItem(null);
          }}
        />
      )}
    </div>
  );
};
