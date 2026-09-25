-- ==============================================================================
-- TSOS (The Simple Operating System) - PostgreSQL / Supabase Initial Schema
-- Multi-Tenant Cafe POS, Kitchen Display System (KDS), Table QR & Inventory
-- Compatible with Supabase PostgreSQL 15+ and Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANT ENTITIES: BUSINESSES & LOCATIONS
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_type VARCHAR(50) DEFAULT 'cafe',
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  owner_phone VARCHAR(50),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  fssai_number VARCHAR(50),
  upi_id VARCHAR(100),
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  gstin VARCHAR(50),
  fssai VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'INR',
  secret_key VARCHAR(255) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_business_location_slug UNIQUE (business_id, slug)
);

-- 2. CAFE MEMBERSHIPS (RBAC FOR SUPABASE AUTH)
CREATE TABLE IF NOT EXISTS public.cafe_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- 'owner', 'manager', 'cashier', 'chef', 'server'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'invited', 'suspended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_business_location UNIQUE (user_id, business_id, location_id)
);

-- 3. DINING TABLES & CRYPTOGRAPHIC QR TOKENS
CREATE TABLE IF NOT EXISTS public.dining_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, -- 'T1', 'Table 4'
  seats INT NOT NULL DEFAULT 4,
  status VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'occupied', 'reserved', 'billing'
  qr_token VARCHAR(255) NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  current_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_location_table_label UNIQUE (location_id, label)
);

-- Active guest table sessions for anti-tamper ordering
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.dining_tables(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours')
);

-- 4. MENU CATEGORIES & ITEMS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  is_veg BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  tax_rate NUMERIC(5, 2) DEFAULT 5.00,
  variants JSONB DEFAULT '[]'::jsonb, -- [{ id, name, price_delta }]
  addons JSONB DEFAULT '[]'::jsonb,   -- [{ id, name, price }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVENTORY & RECIPES (AUTOMATED INGREDIENT DEDUCTION)
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- 'g', 'ml', 'pcs', 'kg', 'l'
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  min_alert_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(10, 2) DEFAULT 0,
  last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_used NUMERIC(10, 3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_recipe_item_ingredient UNIQUE (menu_item_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  change_qty NUMERIC(12, 3) NOT NULL,
  reason VARCHAR(50) NOT NULL, -- 'order_consumed', 'restock', 'spoilage', 'adjustment'
  ref_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS & TSOS CLUB LOYALTY
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  loyalty_points INT DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'Bronze', -- 'Bronze', 'Silver', 'Gold', 'Platinum'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_business_customer_phone UNIQUE (business_id, phone)
);

CREATE TABLE IF NOT EXISTS public.loyalty_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  ref_order_id UUID,
  points_delta INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  balance_after INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS & LINE ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  order_type VARCHAR(20) NOT NULL DEFAULT 'dine_in', -- 'dine_in', 'takeaway', 'delivery'
  table_id UUID REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  table_label VARCHAR(50),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0, -- 5% GST (2.5% CGST + 2.5% SGST)
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0, -- ₹1 per order
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  payment_method VARCHAR(20) NOT NULL DEFAULT 'upi', -- 'cash', 'upi', 'card', 'split'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid', -- 'pending', 'paid', 'refunded'
  notes TEXT,
  placed_by VARCHAR(50) DEFAULT 'pos', -- 'pos', 'storefront', 'waiter'
  kot_printed BOOLEAN DEFAULT FALSE,
  bill_printed BOOLEAN DEFAULT FALSE,
  loyalty_points_earned INT DEFAULT 0,
  loyalty_points_redeemed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  variant_name VARCHAR(100),
  addons JSONB DEFAULT '[]'::jsonb,
  item_total NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROMOTIONAL OFFERS & COUPONS
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'percent', -- 'percent', 'flat', 'bogo'
  value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_location_offer_code UNIQUE (location_id, code)
);

-- 9. FEE CONFIGURATION
CREATE TABLE IF NOT EXISTS public.location_fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL UNIQUE REFERENCES public.locations(id) ON DELETE CASCADE,
  monthly_fee NUMERIC(10, 2) DEFAULT 0,
  per_order_fee NUMERIC(10, 2) DEFAULT 1.00,
  default_fee_payer VARCHAR(20) DEFAULT 'cafe', -- 'cafe', 'customer'
  customer_paid_order_limit INT DEFAULT 100,
  period_order_count INT DEFAULT 0,
  auto_flip_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STAFF SHIFTS & CASH DRAWER RECONCILIATION
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier',
  phone VARCHAR(50),
  hourly_rate NUMERIC(10, 2) DEFAULT 0,
  pin_code VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  staff_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  break_minutes INT DEFAULT 0,
  hourly_rate NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed'
  opening_float NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drawer_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL,
  closed_by_name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  opening_float NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cash_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cash_drops NUMERIC(10, 2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
  actual_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discrepancy NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST QUERYING & TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_locations_business_id ON public.locations(business_id);
CREATE INDEX IF NOT EXISTS idx_dining_tables_location ON public.dining_tables(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_location ON public.menu_items(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_location ON public.orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON public.loyalty_ledgers(customer_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_location ON public.ingredients(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_location ON public.inventory_logs(location_id);
