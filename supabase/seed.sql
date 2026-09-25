-- ==============================================================================
-- TSOS Starter Seed Data for Supabase
-- Populates demo cafe: TSOS Artisan Coffee & Roasters
-- ==============================================================================

-- 1. Insert Demo Business
INSERT INTO public.businesses (id, name, legal_name, slug, owner_email, owner_name, upi_id, subscription_plan, subscription_status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'TSOS Artisan Coffee & Roasters',
  'TSOS Hospitality Pvt Ltd',
  'artisan-roastery',
  'owner@artisanroasters.in',
  'Aditya Rao',
  'tsosartisan@icici',
  'growth',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Demo Location
INSERT INTO public.locations (id, business_id, name, slug, address, phone, gstin, fssai, currency, secret_key)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Indiranagar Flagship Cafe',
  'indiranagar',
  '12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
  '+91 80 4123 4567',
  '29ABCDE1234F1Z5',
  '11223344556677',
  'INR',
  '9f83b271c640e5a8d3b2c1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c'
) ON CONFLICT DO NOTHING;

-- 3. Insert Tables with Pre-generated QR Tokens
INSERT INTO public.dining_tables (id, location_id, label, seats, status, qr_token) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T1', 2, 'free', 'tok_t1_48e7b1a2'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'T2', 4, 'free', 'tok_t2_91c3d4f5'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'T3', 4, 'free', 'tok_t3_72b5a6c8'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'T4', 6, 'free', 'tok_t4_33f8e9d0'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'T5', 2, 'free', 'tok_t5_55a1b2c3'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'T6', 4, 'free', 'tok_t6_88d2e3f4')
ON CONFLICT DO NOTHING;

-- 4. Insert Fee Config
INSERT INTO public.location_fee_configs (location_id, monthly_fee, per_order_fee, default_fee_payer, customer_paid_order_limit, period_order_count, auto_flip_enabled)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  0,
  1.00,
  'cafe',
  100,
  14,
  true
) ON CONFLICT (location_id) DO NOTHING;

-- 5. Insert Categories
INSERT INTO public.categories (id, location_id, name, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Specialty Coffee', 1),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Manual Drips & Cold Brew', 2),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Artisanal Bakery', 3),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Savory Brunch', 4)
ON CONFLICT DO NOTHING;

-- 6. Insert Menu Items
INSERT INTO public.menu_items (id, location_id, category_id, name, description, base_price, is_veg, is_available, tax_rate) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Flat White', 'Double ristretto espresso shots blended with velvety microfoam milk.', 220.00, true, true, 5.00),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Cortado', '1:1 ratio of espresso and warm steamed milk.', 190.00, true, true, 5.00),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Nitro Cold Brew', '18-hour cold steeped single-origin coffee infused with pure nitrogen gas.', 240.00, true, true, 5.00),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Almond Croissant', 'Twice-baked French butter croissant filled with homemade frangipane.', 180.00, true, true, 5.00),
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Avocado Sourdough Toast', 'Hass avocado mash, cherry tomatoes, feta crumble, and chili flakes on fermented loaf.', 280.00, true, true, 5.00)
ON CONFLICT DO NOTHING;

-- 7. Insert Staff Members
INSERT INTO public.staff_members (id, location_id, name, role, phone, hourly_rate, pin_code, is_active) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Aditya (Owner)', 'manager', '+91 98765 43210', 0, '1234', true),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Priya (Head Barista)', 'barista', '+91 98765 43211', 250, '2222', true),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Rahul (Cashier)', 'cashier', '+91 98765 43212', 200, '3333', true)
ON CONFLICT DO NOTHING;
