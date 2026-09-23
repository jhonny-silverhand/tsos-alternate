# TSOS — Cafe POS & Operations Platform

> Modern, offline-resilient Point of Sale and Operations platform tailored for cafes, quick-service restaurants (QSR), and specialty coffee shops. Built with React 18, TypeScript, Tailwind CSS, and Zustand.

---

## 📚 Technical Documentation

Detailed architectural and operational documentation is available in the [`/docs`](/docs) directory:

1. **[Loyalty Points System Architecture](/docs/LOYALTY_SYSTEM_ARCHITECTURE.md)**
   - Mathematical point accrual model (1 pt per ₹10 spent).
   - Point redemption at POS (1 pt = ₹1 discount) with subtotal capping.
   - Dynamic tier thresholds (Bronze, Silver, Gold, Platinum).
   - Welcome registration bonus (+25 pts).
   - Double-entry immutable audit ledger (`loyaltyLedgers`).
   - Manager point adjustments and service recovery workflows.

2. **[Cloud Database Synchronization & Offline Resilience](/docs/CLOUD_SYNC_AND_OFFLINE_RESILIENCE.md)**
   - Real-time connection status indicator in the header.
   - Live heartbeat latency monitoring (ping in ms) and cloud database endpoint tracking.
   - Offline-first local state buffering and pending change queue counter.
   - Persistent warning banner on synchronization loss.
   - Force Sync and one-click Offline Simulation toggle for testing.

---

## 🌟 Key Functional Modules

### 1. Point of Sale (POS)
- Fast menu item selector with categories, search, and variants/add-ons.
- Order type selection: Dine-In (with visual table selector), Takeaway, and Delivery.
- Cart Drawer with dynamic discount calculation, coupon codes, and platform fee engine.
- **Loyalty Redemption:** 1-click presets (`₹25`, `₹50`, `₹100`, `Max`) directly reducing the bill, customer tier badge display, and projected points to earn on completion.
- Multi-mode Payment: UPI QR code generator, Cash with quick currency tender calculation, and Card terminal integration.
- Thermal receipt preview with loyalty earnings and redemption breakdown.

### 2. Kitchen Display System (KDS)
- Real-time color-coded order cards based on preparation stage (`new`, `preparing`, `ready`, `completed`).
- SLA countdown timers and visual progress bars warning kitchen staff of overdue tickets.
- Automated inventory deduction based on item ingredient recipes upon completion.

### 3. Customer CRM & Loyalty Engine (`CustomersScreen`)
- Search by name, phone, or email across guest records.
- Tier filter tabs: All Tiers, Bronze (<100 pts), Silver (100–249 pts), Gold (250–499 pts), Platinum (500+ pts).
- Tier progression progress bars displaying exact points needed to reach the next milestone.
- Full points ledger audit trail modal displaying date, points delta (+/-), order reference, and balance after.
- Manager points adjustment form for bonuses, birthdays, and customer satisfaction recovery.
- "Start POS Order" quick action to ring up returning guests instantly.

### 4. Cloud Database Health & Offline Cache
- Header status pill: 🟢 `Cloud Synced (24ms)`, 🟡 `Syncing DB...`, 🔴 `Offline (X queued)`.
- Interactive diagnostics modal with latency, last synced timestamp, pending offline queue, and force sync.
- Built-in simulation toggle to test offline resilience without disabling internet connectivity.
- Automatic online/offline browser listeners for seamless re-sync.

### 5. Staff & Shift Management
- Clock-in / clock-out tracking with break times, regular hours, and overtime calculations.
- Shift Reconciliation and Drawer Audit with expected cash vs actual counted cash variance.

---

## 🛠️ Tech Stack & Architecture

- **UI Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (warm neutral cafe palette `#FFF9F2`, `#1C1917`, `#F97316`, `#7C3AED`)
- **State Management:** Zustand with localStorage auto-hydration (`useTsosStore`)
- **Icons:** Lucide React
- **Audio Feedback:** Synthesized Web Audio chimes for order events
- **Reporting & Visualization:** Recharts, CSV Data Exporter
