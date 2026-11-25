/*
# Selam Academy — Registrar/Finance/HR & Property/Inventory Portals
1. Expands profiles.role to allow 'registrar' and 'property'.
2. Updates RLS policies so 'registrar' can manage students, staff, fees, and receipts.
3. Creates 'property_assets' and 'stock_movements' tables with RLS for 'property', 'director', and 'ict'.
4. Seeds demo auth users & profiles for registrar@selamacademy.edu.et and property@selamacademy.edu.et.
*/

-- === 1. EXPAND ROLE CHECK CONSTRAINT ON PROFILES ===
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('director','ict','registrar','property','teacher','parent'));

-- === 2. UPDATE EXISTING RLS POLICIES TO INCLUDE REGISTRAR ===

-- profiles
DROP POLICY IF EXISTS "select_own_or_staff_profile" ON public.profiles;
CREATE POLICY "select_own_or_staff_profile" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR public.fn_user_role() IN ('director','ict','registrar')
    OR (
      public.fn_user_role() = 'teacher'
      AND EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = profiles.id AND p2.role IN ('teacher','parent'))
    )
  );

-- staff (HR management by Director, ICT, Registrar)
DROP POLICY IF EXISTS "staff_select" ON public.staff;
CREATE POLICY "staff_select" ON public.staff FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','registrar','property')
    OR (public.fn_user_role() = 'teacher' AND staff.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "staff_write" ON public.staff;
CREATE POLICY "staff_write" ON public.staff FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "staff_update" ON public.staff;
CREATE POLICY "staff_update" ON public.staff FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','registrar'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "staff_delete" ON public.staff;
CREATE POLICY "staff_delete" ON public.staff FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','registrar'));

-- students (Registrar manages enrollment & archive)
DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','registrar','teacher')
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = students.id
    )
  );

DROP POLICY IF EXISTS "students_write" ON public.students;
CREATE POLICY "students_write" ON public.students FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "students_update" ON public.students;
CREATE POLICY "students_update" ON public.students FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','registrar'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "students_delete" ON public.students;
CREATE POLICY "students_delete" ON public.students FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','registrar'));

-- grades (Registrar can view grades for official transcripts/records)
DROP POLICY IF EXISTS "grades_select" ON public.grades;
CREATE POLICY "grades_select" ON public.grades FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','registrar')
    OR grades.teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = grades.student_id
    )
  );

-- fee_records (Registrar manages school billing & finance)
DROP POLICY IF EXISTS "fees_select" ON public.fee_records;
CREATE POLICY "fees_select" ON public.fee_records FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','registrar')
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = fee_records.student_id
    )
  );

DROP POLICY IF EXISTS "fees_write" ON public.fee_records;
CREATE POLICY "fees_write" ON public.fee_records FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "fees_update" ON public.fee_records;
CREATE POLICY "fees_update" ON public.fee_records FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','registrar'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "fees_delete" ON public.fee_records;
CREATE POLICY "fees_delete" ON public.fee_records FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','registrar'));

-- payment_receipts (Registrar can also verify receipts)
DROP POLICY IF EXISTS "receipts_select" ON public.payment_receipts;
CREATE POLICY "receipts_select" ON public.payment_receipts FOR SELECT
  TO authenticated USING (
    parent_id = auth.uid()
    OR public.fn_user_role() IN ('director','ict','registrar')
  );

DROP POLICY IF EXISTS "receipts_update" ON public.payment_receipts;
CREATE POLICY "receipts_update" ON public.payment_receipts FOR UPDATE
  TO authenticated
  USING (public.fn_user_role() IN ('director','ict','registrar'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

-- === 3. PROPERTY & INVENTORY MANAGEMENT TABLES ===

CREATE TABLE IF NOT EXISTS public.property_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Furniture','IT & Electronics','Lab Equipment','Books & Library','Stationery & Consumables','Sports & Facilities')),
  item_type text NOT NULL DEFAULT 'fixed_asset' CHECK (item_type IN ('fixed_asset','consumable')),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock_level integer NOT NULL DEFAULT 5 CHECK (min_stock_level >= 0),
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  location text,
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('good','needs_repair','damaged','disposed')),
  custodian text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.property_assets(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('stock_in','issued','returned','damaged_writeoff')),
  quantity integer NOT NULL CHECK (quantity > 0),
  recipient_or_source text NOT NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_assets ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_assets TO authenticated;

DROP POLICY IF EXISTS "property_select" ON public.property_assets;
CREATE POLICY "property_select" ON public.property_assets FOR SELECT
  TO authenticated USING (public.fn_user_role() IN ('director','ict','property','registrar'));

DROP POLICY IF EXISTS "property_write" ON public.property_assets;
CREATE POLICY "property_write" ON public.property_assets FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','property'));

DROP POLICY IF EXISTS "property_update" ON public.property_assets;
CREATE POLICY "property_update" ON public.property_assets FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','property'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','property'));

DROP POLICY IF EXISTS "property_delete" ON public.property_assets;
CREATE POLICY "property_delete" ON public.property_assets FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','property'));

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;

DROP POLICY IF EXISTS "movements_select" ON public.stock_movements;
CREATE POLICY "movements_select" ON public.stock_movements FOR SELECT
  TO authenticated USING (public.fn_user_role() IN ('director','ict','property','registrar'));

DROP POLICY IF EXISTS "movements_insert" ON public.stock_movements;
CREATE POLICY "movements_insert" ON public.stock_movements FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','property'));

CREATE INDEX IF NOT EXISTS idx_property_category ON public.property_assets(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_asset ON public.stock_movements(asset_id);

-- === 4. SEED DEMO USERS FOR REGISTRAR & PROPERTY PORTALS ===
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'registrar@selamacademy.edu.et', crypt('SelamAcademy2026!', gen_salt('bf')), now(), now(), now(), '{"role":"registrar"}'::jsonb, '{"full_name":"Meron Tesfaye"}'::jsonb),
  ('11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'property@selamacademy.edu.et', crypt('SelamAcademy2026!', gen_salt('bf')), now(), now(), now(), '{"role":"property"}'::jsonb, '{"full_name":"Bereket Yohannes"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
SELECT gen_random_uuid(), id, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now()
FROM auth.users
WHERE id IN ('11111111-1111-1111-1111-111111111105','11111111-1111-1111-1111-111111111106')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, phone, status) VALUES
  ('11111111-1111-1111-1111-111111111105','registrar@selamacademy.edu.et','Meron Tesfaye','registrar','+251911200305','active'),
  ('11111111-1111-1111-1111-111111111106','property@selamacademy.edu.et','Bereket Yohannes','property','+251911200306','active')
ON CONFLICT (id) DO NOTHING;

-- === 5. SEED INITIAL PROPERTY & INVENTORY ITEMS ===
INSERT INTO public.property_assets (id, item_code, name, category, item_type, quantity, min_stock_level, unit_cost, location, condition, custodian) VALUES
  ('55555555-5555-5555-5555-555555555501','SA-AST-001','Student Dual Desks (Hardwood)','Furniture','fixed_asset',320,20,3800,'Grades 1–12 Classrooms','good','Bereket Yohannes'),
  ('55555555-5555-5555-5555-555555555502','SA-AST-002','Desktop Computers (Core i5)','IT & Electronics','fixed_asset',42,5,34000,'ICT Lab 01','good','Ekram Mohammad'),
  ('55555555-5555-5555-5555-555555555503','SA-AST-003','Compound Microscopes','Lab Equipment','fixed_asset',18,3,12500,'Biology & Chemistry Lab','good','Liya Yakub'),
  ('55555555-5555-5555-5555-555555555504','SA-STK-001','A4 Printing Paper (Reams)','Stationery & Consumables','consumable',14,20,650,'Main Store Room','good','Bereket Yohannes'),
  ('55555555-5555-5555-5555-555555555505','SA-STK-002','Whiteboard Markers (Boxes)','Stationery & Consumables','consumable',8,15,480,'Staff Room Store','good','Bereket Yohannes'),
  ('55555555-5555-5555-5555-555555555506','SA-AST-004','Grade 9 Mathematics Textbooks','Books & Library','fixed_asset',145,10,420,'Main Library','good','Abdurahman Yasin')
ON CONFLICT (id) DO NOTHING;