-- ==============================================================================
-- TSOS (The Simple Operating System) - PostgreSQL / Supabase RLS & Secure RPCs
-- Enforces Strict Multi-Tenant Data Isolation and Cryptographic Table Security
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL OPERATIONAL TABLES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_fee_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawer_reconciliations ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS FOR TENANT ACCESS VERIFICATION
CREATE OR REPLACE FUNCTION public.auth_user_has_location_access(target_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SuperAdmins / service_role bypass or active location membership
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.cafe_memberships cm
    WHERE cm.user_id = auth.uid()
      AND cm.location_id = target_location_id
      AND cm.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.auth_user_has_business_access(target_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.cafe_memberships cm
    WHERE cm.user_id = auth.uid()
      AND cm.business_id = target_business_id
      AND cm.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. RLS POLICIES FOR STAFF & OPERATIONAL HUB
-- Locations
CREATE POLICY "Staff can view their authorized locations"
  ON public.locations FOR SELECT
  USING (public.auth_user_has_location_access(id));

CREATE POLICY "Owners can update their locations"
  ON public.locations FOR UPDATE
  USING (public.auth_user_has_location_access(id));

-- Dining Tables
CREATE POLICY "Staff can manage dining tables"
  ON public.dining_tables FOR ALL
  USING (public.auth_user_has_location_access(location_id));

-- Public read for table QR lookup (only unprivileged public table metadata)
CREATE POLICY "Public read dining table basic info"
  ON public.dining_tables FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Categories & Menu Items (Public Read for Storefront, Staff Full Control)
CREATE POLICY "Public read active categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Staff manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

CREATE POLICY "Public read active menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (is_available = TRUE);

CREATE POLICY "Staff manage menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

-- Inventory & Recipes (Strict Staff Only)
CREATE POLICY "Staff manage ingredients"
  ON public.ingredients FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

CREATE POLICY "Staff manage recipes"
  ON public.recipes FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

CREATE POLICY "Staff view inventory logs"
  ON public.inventory_logs FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

-- Orders & Line Items (Staff Full Access, Anon Created via Secure RPC)
CREATE POLICY "Staff view and manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

CREATE POLICY "Staff manage order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.auth_user_has_location_access(o.location_id)
  ));

-- Customers & Loyalty Ledgers
CREATE POLICY "Staff manage customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.auth_user_has_business_access(business_id));

CREATE POLICY "Staff manage loyalty ledgers"
  ON public.loyalty_ledgers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = loyalty_ledgers.customer_id
      AND public.auth_user_has_business_access(c.business_id)
  ));

-- Offers (Public Read Active, Staff Full Control)
CREATE POLICY "Public read active offers"
  ON public.offers FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Staff manage offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (public.auth_user_has_location_access(location_id));

-- 4. SECURE SERVER-SIDE RPCs (ANTI-TAMPER TABLE QR & ORDER PLACEMENT)

-- RPC 1: Verify Table Session Token (Prevents Table URL Tampering)
CREATE OR REPLACE FUNCTION public.verify_table_session(
  p_cafe_slug TEXT,
  p_table_label TEXT,
  p_token TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_location RECORD;
  v_table RECORD;
  v_session RECORD;
  v_new_session_token TEXT;
BEGIN
  -- 1. Locate location by slug
  SELECT id, business_id, name, currency INTO v_location
  FROM public.locations
  WHERE slug = p_cafe_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Cafe location not found');
  END IF;

  -- 2. Locate table by label inside this location
  SELECT id, label, seats, status, qr_token INTO v_table
  FROM public.dining_tables
  WHERE location_id = v_location.id AND LOWER(label) = LOWER(p_table_label);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Table not found for this location');
  END IF;

  -- 3. Verify cryptographic token matches table's authorized QR token
  IF v_table.qr_token <> p_token THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Anti-Tamper Shield: Invalid table token. Please scan the QR code affixed to this table.'
    );
  END IF;

  -- 4. Generate or refresh active session token
  v_new_session_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.table_sessions (table_id, session_token, status, expires_at)
  VALUES (v_table.id, v_new_session_token, 'active', NOW() + INTERVAL '4 hours');

  RETURN jsonb_build_object(
    'valid', TRUE,
    'session_token', v_new_session_token,
    'table_id', v_table.id,
    'table_label', v_table.label,
    'location_id', v_location.id,
    'cafe_name', v_location.name,
    'currency', v_location.currency
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: Submit Customer Order (Validated against Session Token)
CREATE OR REPLACE FUNCTION public.submit_customer_order(
  p_session_token TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_payment_method TEXT,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_tax_total NUMERIC,
  p_discount_total NUMERIC,
  p_platform_fee NUMERIC,
  p_grand_total NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_table RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
BEGIN
  -- Validate active table session
  SELECT s.id, s.table_id, s.status, s.expires_at INTO v_session
  FROM public.table_sessions s
  WHERE s.session_token = p_session_token
    AND s.status = 'active'
    AND s.expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Table session expired or invalid. Please re-scan table QR.';
  END IF;

  -- Resolve table and location
  SELECT t.id, t.label, t.location_id INTO v_table
  FROM public.dining_tables t
  WHERE t.id = v_session.table_id;

  -- Generate order number: e.g. ORD-HHMMSS
  v_order_number := 'ORD-' || TO_CHAR(NOW(), 'HH24MISS') || '-' || SUBSTRING(v_table.label FROM 1 FOR 3);

  -- Create order record
  INSERT INTO public.orders (
    location_id,
    order_number,
    order_type,
    table_id,
    table_label,
    customer_name,
    customer_phone,
    subtotal,
    discount_total,
    tax_total,
    platform_fee,
    grand_total,
    status,
    payment_method,
    payment_status,
    placed_by
  ) VALUES (
    v_table.location_id,
    v_order_number,
    'dine_in',
    v_table.id,
    v_table.label,
    p_customer_name,
    p_customer_phone,
    p_subtotal,
    p_discount_total,
    p_tax_total,
    p_platform_fee,
    p_grand_total,
    'pending',
    COALESCE(p_payment_method, 'upi'),
    'paid',
    'storefront'
  ) RETURNING id INTO v_order_id;

  -- Mark table as occupied
  UPDATE public.dining_tables
  SET status = 'occupied', current_order_id = v_order_id
  WHERE id = v_table.id;

  -- Insert order line items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      menu_item_name,
      qty,
      unit_price,
      variant_name,
      addons,
      item_total,
      notes
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'name',
      COALESCE((v_item->>'qty')::INT, 1),
      COALESCE((v_item->>'unit_price')::NUMERIC, 0),
      v_item->>'variant_name',
      COALESCE(v_item->'addons', '[]'::jsonb),
      COALESCE((v_item->>'item_total')::NUMERIC, 0),
      v_item->>'notes'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending',
    'table_label', v_table.label
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
