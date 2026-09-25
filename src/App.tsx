/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTsosStore } from './lib/store';
import { Header } from './components/common/Header';
import { WebNavbar } from './components/common/WebNavbar';
import { PosScreen } from './components/pos/PosScreen';
import { KdsScreen } from './components/kds/KdsScreen';
import { OrdersScreen } from './components/orders/OrdersScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { MenuScreen } from './components/menu/MenuScreen';
import { TablesScreen } from './components/tables/TablesScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { OffersScreen } from './components/offers/OffersScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { ShiftsScreen } from './components/shifts/ShiftsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { StorefrontScreen } from './components/storefront/StorefrontScreen';
import { OrderTrackingScreen } from './components/storefront/OrderTrackingScreen';
import { WindowsAppClient } from './components/native/WindowsAppClient';
import { AndroidAppClient } from './components/native/AndroidAppClient';
import { SuperAdminScreen } from './components/superadmin/SuperAdminScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { CafeOnboardingWizard } from './components/auth/CafeOnboardingWizard';
import { realtimeService } from './lib/realtimeService';

export default function App() {
  const { activeSurface, activeWebTab, currentProfile } = useTsosStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Realtime subscription setup
  useEffect(() => {
    if (currentProfile?.business_id) {
      realtimeService.subscribeToTenant(currentProfile.business_id);
    }
    return () => {
      realtimeService.unsubscribe();
    };
  }, [currentProfile?.business_id]);

  // Public customer surfaces (Table QR Self Ordering & Live Order Tracking)
  // do not require staff authentication
  if (activeSurface === 'storefront') {
    return (
      <main className="min-h-screen bg-[#FFF9F2] flex flex-col min-h-0 overflow-y-auto">
        <StorefrontScreen />
      </main>
    );
  }

  if (activeSurface === 'order_track') {
    return (
      <main className="min-h-screen bg-[#FFF9F2] flex flex-col min-h-0 overflow-y-auto">
        <OrderTrackingScreen />
      </main>
    );
  }

  // SuperAdmin Platform Master Console
  if (activeSurface === 'superadmin') {
    return <SuperAdminScreen />;
  }

  // Authentication Guard for Staff & Terminal interfaces
  const isAuthenticated = Boolean(currentProfile?.id && currentProfile?.is_active);

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen
          onSuccess={() => {}}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />
        <CafeOnboardingWizard
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onCompleted={() => setShowOnboarding(false)}
        />
      </>
    );
  }

  const renderWebContent = () => {
    switch (activeWebTab) {
      case 'pos':
        return <PosScreen />;
      case 'kds':
        return <KdsScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'menu':
        return <MenuScreen />;
      case 'tables':
        return <TablesScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'offers':
        return <OffersScreen />;
      case 'shifts':
        return <ShiftsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <PosScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#1C1917] flex flex-col font-sans">
      <Header />

      {activeSurface === 'web' && (
        <div className="flex-1 flex flex-col min-h-0">
          <WebNavbar />
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {renderWebContent()}
          </main>
        </div>
      )}

      {activeSurface === 'windows' && (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <WindowsAppClient />
        </main>
      )}

      {activeSurface === 'android' && (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AndroidAppClient />
        </main>
      )}

      {/* Cafe Onboarding Wizard for new outlet registrations */}
      <CafeOnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCompleted={() => setShowOnboarding(false)}
      />
    </div>
  );
}
