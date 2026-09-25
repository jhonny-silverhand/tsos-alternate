import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { useTsosStore } from './store';
import { Order, DineTable } from '../types';

class RealtimeService {
  private static instance: RealtimeService;
  private channel: any = null;
  private isSubscribed = false;

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public subscribeToTenant(businessId: string): void {
    if (typeof window === 'undefined') return;
    if (!isSupabaseConfigured()) return;
    if (this.isSubscribed && this.channel) {
      return;
    }

    try {
      const client = getSupabaseClient();
      const channelName = `pos-realtime-${businessId || 'default'}`;

      this.channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => {
            this.handleOrderChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'dining_tables' },
          (payload: any) => {
            this.handleTableChange(payload);
          }
        )
        .subscribe((status: string) => {
          const store = useTsosStore.getState();
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            store.setCloudSyncStatus('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isSubscribed = false;
          }
        });
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  private handleOrderChange(payload: any): void {
    const { eventType, new: newRecord } = payload;
    const store = useTsosStore.getState();

    if (eventType === 'INSERT' && newRecord) {
      // Avoid duplicate insert if already present in state
      const exists = store.orders.some(
        (o) => o.id === newRecord.id || o.order_number === parseInt(newRecord.order_number?.replace(/\D/g, '') || '0')
      );
      if (!exists) {
        const orderNumber = parseInt(newRecord.order_number?.replace(/\D/g, '') || '101');
        const parsedOrder: Order = {
          id: newRecord.id,
          order_number: orderNumber,
          location_id: newRecord.location_id || store.location.id,
          order_type: newRecord.order_type || 'dine_in',
          table_id: newRecord.table_id || 'tbl-1',
          table_label: newRecord.table_label || 'T-01',
          customer_name: newRecord.customer_name || 'Guest',
          customer_phone: newRecord.customer_phone || '',
          items: newRecord.items || [],
          subtotal: Number(newRecord.subtotal) || 0,
          tax_total: Number(newRecord.tax_total) || 0,
          discount_total: Number(newRecord.discount_total) || 0,
          platform_fee: Number(newRecord.platform_fee) || 0,
          fee_payer: newRecord.fee_payer || store.feeConfig.default_fee_payer || 'cafe',
          grand_total: Number(newRecord.grand_total) || 0,
          status: newRecord.status || 'new',
          payment_method: newRecord.payment_method || 'cash',
          payment_status: newRecord.payment_status || 'paid',
          placed_by: newRecord.placed_by || 'Staff',
          created_at: newRecord.created_at || new Date().toISOString(),
          updated_at: newRecord.updated_at || new Date().toISOString(),
          notes: newRecord.notes,
        };

        // Play alert sound if audio active
        if (store.audioEnabled) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          } catch (_) {}
        }

        useTsosStore.setState((s) => ({
          orders: [parsedOrder, ...s.orders],
        }));
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      useTsosStore.setState((s) => ({
        orders: s.orders.map((o) =>
          o.id === newRecord.id || o.order_number === parseInt(newRecord.order_number?.replace(/\D/g, '') || '0')
            ? {
                ...o,
                status: newRecord.status || o.status,
                payment_status: newRecord.payment_status || o.payment_status,
                updated_at: newRecord.updated_at || new Date().toISOString(),
              }
            : o
        ),
      }));
    }
  }

  private handleTableChange(payload: any): void {
    const { new: newTable } = payload;
    if (newTable) {
      useTsosStore.setState((s) => ({
        tables: s.tables.map((t) =>
          t.id === newTable.id
            ? {
                ...t,
                status: newTable.status || t.status,
                current_order_id: newTable.current_order_id,
                seats: newTable.seats || t.seats,
              }
            : t
        ),
      }));
    }
  }

  public unsubscribe(): void {
    if (this.channel) {
      try {
        const client = getSupabaseClient();
        client.removeChannel(this.channel);
        this.channel = null;
        this.isSubscribed = false;
      } catch (err) {
        console.warn('Error unsubscribing channel:', err);
      }
    }
  }
}

export const realtimeService = RealtimeService.getInstance();
