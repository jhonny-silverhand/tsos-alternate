import React, { useState, useEffect } from 'react';
import { useTsosStore } from '../../lib/store';
import { Order, OrderStatus } from '../../types';
import { playChime } from '../../lib/sound';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Play,
  Bell,
  Utensils,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Timer,
  Flame,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Target SLA thresholds in minutes based on order type
const SLA_SETTINGS = {
  standard: {
    label: 'Standard Pace',
    takeaway: 7, // 7 minutes
    dine_in: 12, // 12 minutes
  },
  rush: {
    label: 'Rush Hour (Speed)',
    takeaway: 5, // 5 minutes
    dine_in: 9, // 9 minutes
  },
  relaxed: {
    label: 'Relaxed Pace',
    takeaway: 10,
    dine_in: 16,
  },
};

export const KdsScreen: React.FC = () => {
  const { orders, advanceOrderStatus, cancelOrder, audioEnabled } = useTsosStore();
  const [, setNow] = useState(Date.now());
  const [slaMode, setSlaMode] = useState<keyof typeof SLA_SETTINGS>('standard');

  // Real-time ticking every second for countdown and elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeSla = SLA_SETTINGS[slaMode];

  // Helper to calculate order countdown and SLA status
  const getOrderSlaTimer = (order: Order) => {
    const targetMins = order.order_type === 'takeaway' ? activeSla.takeaway : activeSla.dine_in;
    const targetSec = targetMins * 60;
    const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000));
    const remainingSec = targetSec - elapsedSec;

    const elapsedMins = Math.floor(elapsedSec / 60);
    const elapsedRemainderSec = elapsedSec % 60;

    const isBreached = remainingSec < 0;
    const isWarning = !isBreached && remainingSec <= targetSec * 0.35; // Under 35% time left
    const isHealthy = !isBreached && !isWarning;

    const absRemaining = Math.abs(remainingSec);
    const remMins = Math.floor(absRemaining / 60);
    const remSecs = absRemaining % 60;

    const percentElapsed = Math.min(100, Math.round((elapsedSec / targetSec) * 100));

    return {
      targetMins,
      targetSec,
      elapsedSec,
      elapsedText: `${elapsedMins}m ${elapsedRemainderSec}s`,
      remainingSec,
      countdownText: isBreached
        ? `+${remMins}m ${String(remSecs).padStart(2, '0')}s OVERDUE`
        : `${remMins}m ${String(remSecs).padStart(2, '0')}s left`,
      isBreached,
      isWarning,
      isHealthy,
      percentElapsed,
    };
  };

  const handleAdvance = (order: Order) => {
    advanceOrderStatus(order.id);

    if (audioEnabled) {
      if (order.status === 'new') playChime('click');
      else if (order.status === 'preparing') playChime('ready');
      else if (order.status === 'ready') playChime('complete');
    }

    if (order.status === 'ready') {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#17803D', '#F97316'],
      });
    }
  };

  const newOrders = orders.filter((o) => o.status === 'new');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  // Count breached active orders (new or preparing)
  const activeUnfinishedOrders = orders.filter((o) => o.status === 'new' || o.status === 'preparing');
  const breachedCount = activeUnfinishedOrders.filter((o) => getOrderSlaTimer(o).isBreached).length;

  const renderTicket = (order: Order) => {
    const sla = getOrderSlaTimer(order);

    return (
      <div
        key={order.id}
        className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
          sla.isBreached
            ? 'border-[#B42318] ring-2 ring-[#B42318]/40 shadow-sm'
            : sla.isWarning
            ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/30'
            : 'border-[#E9E0D6]'
        }`}
      >
        {/* Top SLA Alert Banner when breached */}
        {sla.isBreached && order.status !== 'ready' && (
          <div className="bg-[#B42318] text-white px-3 py-1 text-[11px] font-bold flex items-center justify-between tracking-wide animate-pulse">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 fill-white text-[#B42318]" />
              <span>SLA BREACHED • PREP DELAYED</span>
            </span>
            <span className="font-mono text-xs">{sla.countdownText}</span>
          </div>
        )}

        {/* Ticket Header */}
        <div
          className={`p-3 border-b flex items-start justify-between gap-2 ${
            sla.isBreached
              ? 'bg-[#FEF2F2]'
              : order.status === 'new'
              ? 'bg-[#FFF9F2] border-[#E9E0D6]'
              : order.status === 'preparing'
              ? 'bg-[#FFF4E5] border-[#FED7AA]'
              : 'bg-[#E8F5EC] border-[#A7F3D0]'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-base text-[#1C1917]">
                #{order.order_number}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  order.order_type === 'dine_in'
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-white text-[#57534E] border border-[#E9E0D6]'
                }`}
              >
                {order.order_type === 'dine_in' ? (
                  <>
                    <Utensils className="w-3 h-3" />
                    <span>{order.table_label || 'Dine-In'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3 h-3 text-[#F97316]" />
                    <span>Takeaway</span>
                  </>
                )}
              </span>

              <span className="text-[10px] font-medium text-[#78716C] bg-white/70 px-1.5 py-0.5 rounded border border-[#E9E0D6]">
                Target: {sla.targetMins}m
              </span>
            </div>
            <div className="text-[11px] text-[#57534E] mt-0.5">
              {order.customer_name ? order.customer_name : 'Guest'} • {order.placed_by}
            </div>
          </div>

          {/* Countdown & Elapsed Box */}
          <div className="text-right shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-xl shadow-2xs ${
                sla.isBreached
                  ? 'bg-[#B42318] text-white'
                  : sla.isWarning
                  ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                  : 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
              }`}
            >
              <Timer className="w-3.5 h-3.5 shrink-0" />
              <span>{sla.countdownText}</span>
            </div>
            <div className="text-[10px] text-[#78716C] font-mono mt-0.5">
              Elapsed: {sla.elapsedText}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar (Target SLA vs Elapsed) */}
        <div className="w-full bg-[#E9E0D6]/50 h-1.5">
          <div
            className={`h-full transition-all duration-300 ${
              sla.isBreached
                ? 'bg-[#B42318]'
                : sla.isWarning
                ? 'bg-[#F59E0B]'
                : 'bg-[#15803D]'
            }`}
            style={{ width: `${sla.percentElapsed}%` }}
          />
        </div>

        {/* Ticket Items List */}
        <div className="p-3.5 space-y-2.5 flex-1">
          {order.items.map((item) => (
            <div key={item.id} className="text-xs text-[#1C1917] border-b border-[#F5F0EB] pb-2 last:border-0 last:pb-0">
              <div className="flex items-start justify-between font-bold">
                <span className="text-sm">
                  {item.qty} × {item.menu_item_name}
                </span>
              </div>
              {item.variant_name && (
                <div className="text-[11px] text-[#57534E] pl-3 font-medium">
                  Size: {item.variant_name}
                </div>
              )}
              {item.addons && item.addons.length > 0 && (
                <div className="text-[11px] text-[#57534E] pl-3">
                  + {item.addons.map((a) => a.name).join(', ')}
                </div>
              )}
              {item.notes && (
                <div className="text-[11px] text-[#B45309] font-medium italic pl-3 mt-0.5">
                  ★ Note: "{item.notes}"
                </div>
              )}
            </div>
          ))}

          {order.notes && (
            <div className="p-2 bg-[#FFF4E5] rounded-xl text-xs text-[#B45309] font-medium border border-[#FED7AA]">
              Order Note: {order.notes}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-[#F5F0EB] border-t border-[#E9E0D6] flex items-center justify-between gap-2">
          <button
            onClick={() => {
              if (window.confirm(`Cancel order #${order.order_number}?`)) {
                cancelOrder(order.id, 'Kitchen cancelled');
              }
            }}
            className="text-[11px] text-[#A8A29E] hover:text-[#B42318] px-2 py-1 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => handleAdvance(order)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all ${
              order.status === 'new'
                ? 'bg-[#B45309] hover:bg-[#92400e]'
                : order.status === 'preparing'
                ? 'bg-[#17803D] hover:bg-[#156f35]'
                : 'bg-[#1C1917] hover:bg-black'
            }`}
          >
            {order.status === 'new' && (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Preparing</span>
              </>
            )}
            {order.status === 'preparing' && (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Mark as Ready</span>
              </>
            )}
            {order.status === 'ready' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Serve & Complete</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-[#FFF9F2]">
      {/* KDS Header Banner */}
      <div className="p-4 bg-white border-b border-[#E9E0D6] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1C1917] leading-tight">
                Kitchen Display System (KDS)
              </h2>
              {breachedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#B42318] border border-[#FECACA] flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {breachedCount} Delayed SLA
                </span>
              )}
            </div>
            <div className="text-xs text-[#57534E]">
              Real-time countdown SLA: <strong>{activeSla.takeaway}m</strong> Takeaway • <strong>{activeSla.dine_in}m</strong> Dine-In
            </div>
          </div>
        </div>

        {/* SLA Speed Presets & Metrics */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* SLA Presets Selector */}
          <div className="flex items-center gap-1 bg-[#F5F0EB] p-1 rounded-xl text-xs border border-[#E9E0D6]">
            <span className="text-[11px] text-[#78716C] font-semibold px-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#F97316]" />
              SLA:
            </span>
            {(['standard', 'rush', 'relaxed'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSlaMode(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  slaMode === key
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                {key === 'standard' ? 'Standard (7m/12m)' : key === 'rush' ? 'Rush (5m/9m)' : 'Relaxed (10m/16m)'}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#57534E] flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              <strong>{newOrders.length}</strong> New
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B45309]" />
              <strong>{preparingOrders.length}</strong> In Prep
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#17803D]" />
              <strong>{readyOrders.length}</strong> Ready
            </span>
            <span>•</span>
            <span className="text-[#A8A29E]">
              {completedCount} Completed
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column KDS Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-y-auto min-h-0">
        {/* Column 1: New Orders */}
        <div className="bg-[#F5F0EB]/60 rounded-2xl border border-[#E9E0D6] p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E0D6]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#1C1917]">
                1. New ({newOrders.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#A8A29E]">Needs Prep</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {newOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#A8A29E] text-xs">
                <span>No new incoming orders</span>
              </div>
            ) : (
              newOrders.map(renderTicket)
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="bg-[#FFF4E5]/50 rounded-2xl border border-[#FED7AA] p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#FED7AA]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#B45309]">
                2. Preparing ({preparingOrders.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#B45309]">Cooking / Brewing</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#A8A29E] text-xs">
                <span>No tickets cooking</span>
              </div>
            ) : (
              preparingOrders.map(renderTicket)
            )}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="bg-[#E8F5EC]/50 rounded-2xl border border-[#A7F3D0] p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#A7F3D0]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#17803D]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#17803D]">
                3. Ready ({readyOrders.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#17803D]">Call Customer / Waiter</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#A8A29E] text-xs">
                <span>No tickets waiting pickup</span>
              </div>
            ) : (
              readyOrders.map(renderTicket)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

