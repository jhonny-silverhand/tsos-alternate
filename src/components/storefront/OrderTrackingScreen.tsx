import React from 'react';
import { useTsosStore } from '../../lib/store';
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  Utensils,
  ChevronLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const OrderTrackingScreen: React.FC = () => {
  const { orders, trackedOrderId, setActiveSurface, location } = useTsosStore();

  const trackedOrder = orders.find((o) => o.id === trackedOrderId) || orders[0];

  if (!trackedOrder) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
        <p className="text-sm text-[#57534E]">No active order found.</p>
        <button
          onClick={() => setActiveSurface('storefront')}
          className="mt-3 px-4 py-2 bg-[#F97316] text-white rounded-xl text-xs font-semibold"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'new', label: 'Order Received', desc: 'Sent to the kitchen ticket line' },
    { key: 'preparing', label: 'Preparing', desc: 'Chef Rajesh & Barista are brewing/cooking' },
    { key: 'ready', label: 'Ready for You', desc: 'Hot & fresh at pickup counter or table' },
    { key: 'completed', label: 'Served & Enjoyed', desc: 'Thank you for visiting!' },
  ];

  const currentStepIndex =
    trackedOrder.status === 'cancelled'
      ? -1
      : steps.findIndex((s) => s.key === trackedOrder.status);

  return (
    <div className="min-h-[calc(100vh-100px)] bg-[#FFF9F2] flex flex-col items-center justify-start p-2 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9E0D6] shadow-xl overflow-hidden flex flex-col p-5 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#F5F0EB] pb-3">
          <button
            onClick={() => setActiveSurface('storefront')}
            className="flex items-center gap-1 text-xs font-semibold text-[#57534E] hover:text-[#1C1917]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Order Menu</span>
          </button>

          <span className="text-xs font-bold text-[#F97316] font-mono">
            Order #{trackedOrder.order_number}
          </span>
        </div>

        {/* Live Status Animation */}
        <div className="text-center py-2 space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#FFF1E6] text-[#F97316] mx-auto flex items-center justify-center shadow-inner">
            {trackedOrder.status === 'new' && <Clock className="w-8 h-8 animate-spin" />}
            {trackedOrder.status === 'preparing' && <ChefHat className="w-8 h-8 animate-bounce" />}
            {trackedOrder.status === 'ready' && <Bell className="w-8 h-8 animate-pulse text-[#17803D]" />}
            {trackedOrder.status === 'completed' && <CheckCircle2 className="w-8 h-8 text-[#17803D]" />}
          </div>

          <h2 className="text-lg font-bold text-[#1C1917]">
            {trackedOrder.status === 'new' && 'Your order is being reviewed!'}
            {trackedOrder.status === 'preparing' && 'Brewing & Baking in Progress'}
            {trackedOrder.status === 'ready' && 'Your Order is READY! 🎉'}
            {trackedOrder.status === 'completed' && 'Order Complete. Enjoy your meal!'}
            {trackedOrder.status === 'cancelled' && 'Order was Cancelled'}
          </h2>

          <p className="text-xs text-[#57534E]">
            {trackedOrder.table_label ? `Serving at ${trackedOrder.table_label}` : 'Counter Pickup'} • {location.name}
          </p>
        </div>

        {/* Vertical Stepper */}
        <div className="p-4 bg-[#FFF9F2] rounded-2xl border border-[#E9E0D6] space-y-4">
          {steps.map((step, idx) => {
            const isPassed = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isPassed
                      ? 'bg-[#17803D] text-white'
                      : 'bg-white border-2 border-[#E9E0D6] text-[#A8A29E]'
                  }`}
                >
                  {isPassed ? '✓' : idx + 1}
                </div>

                <div className="flex-1">
                  <div
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-[#F97316]'
                        : isPassed
                        ? 'text-[#1C1917]'
                        : 'text-[#A8A29E]'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-[#57534E]">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items Preview */}
        <div className="border-t border-[#F5F0EB] pt-3 space-y-2">
          <div className="text-xs font-semibold text-[#57534E]">Items Ordered:</div>
          {trackedOrder.items.map((i) => (
            <div key={i.id} className="flex justify-between text-xs">
              <span className="text-[#1C1917]">
                {i.qty} × {i.menu_item_name} {i.variant_name ? `(${i.variant_name})` : ''}
              </span>
              <span className="font-mono text-[#57534E]">₹{i.item_total}</span>
            </div>
          ))}

          <div className="flex justify-between text-xs font-bold pt-2 border-t border-[#F5F0EB]">
            <span>Total Paid</span>
            <span className="font-mono text-[#17803D]">₹{trackedOrder.grand_total}</span>
          </div>
        </div>

        <button
          onClick={() => setActiveSurface('storefront')}
          className="w-full py-2.5 rounded-xl bg-[#F5F0EB] hover:bg-[#E9E0D6] text-xs font-semibold text-[#1C1917] transition-colors"
        >
          Add More Items to Bill
        </button>
      </div>
    </div>
  );
};
