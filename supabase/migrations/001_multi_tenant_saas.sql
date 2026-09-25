-- ==============================================================================
-- TSOS (The Simple Operating System) - PostgreSQL / Supabase Complete Schema
-- Multi-Tenant Cafe POS, Kitchen Display System (KDS), Table QR & Inventory
-- Compatible with Supabase PostgreSQL 15+ and Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANT ENTITIES
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
  subscription_plan VARCHAR(50) DEFAULT 'growth',
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

CREATE TABLE IF NOT EXISTS public.cafe_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_business_location UNIQUE (user_id, business_id, location_id)
);

-- 2. DINING TABLES & CRYPTOGRAPHIC QR TOKENS
CREATE TABLE IF NOT EXISTS public.dining_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  seats INT NOT NULL DEFAULT 4,
  status VARCHAR(20) NOT NULL DEFAULT 'free',
  qr_token VARCHAR(255) NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  current_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_location_table_label UNIQUE (location_id, label)
);

CREATE TABLE IF NOT EXISTS public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.dining_tables(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours')
);

-- 3. MENU CATEGORIES & ITEMS
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
  variants JSONB DEFAULT '[]'::jsonb,
  addons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY & RECIPES
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
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
  reason VARCHAR(50) NOT NULL,
  ref_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS & LOYALTY LEDGER
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  loyalty_points INT DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'Bronze',
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

-- 6. ORDERS & LINE ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  order_type VARCHAR(20) NOT NULL DEFAULT 'dine_in',
  table_id UUID REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  table_label VARCHAR(50),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'upi',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
  notes TEXT,
  placed_by VARCHAR(50) DEFAULT 'pos',
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

-- 7. OFFERS & FEE ENGINE
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'percent',
  value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_location_offer_code UNIQUE (location_id, code)
);

CREATE TABLE IF NOT EXISTS public.location_fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL UNIQUE REFERENCES public.locations(id) ON DELETE CASCADE,
  monthly_fee NUMERIC(10, 2) DEFAULT 0,
  per_order_fee NUMERIC(10, 2) DEFAULT 1.00,
  default_fee_payer VARCHAR(20) DEFAULT 'cafe',
  customer_paid_order_limit INT DEFAULT 100,
  period_order_count INT DEFAULT 0,
  auto_flip_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STAFF & SHIFTS
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
  status VARCHAR(20) DEFAULT 'active',
  opening_float NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_ledgers ENABLE ROW LEVEL SECURITY;

-- 10. POLICIES
CREATE POLICY "Public read dining tables" ON public.dining_tables FOR SELECT USING (TRUE);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public read active offers" ON public.offers FOR SELECT USING (is_active = TRUE);

CREATE OR REPLACE FUNCTION public.auth_user_has_location_access(target_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.cafe_memberships cm
    WHERE cm.user_id = auth.uid()
      AND cm.location_id = target_location_id
      AND cm.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Staff manage location orders" ON public.orders FOR ALL TO authenticated
USING (public.auth_user_has_location_access(location_id));
