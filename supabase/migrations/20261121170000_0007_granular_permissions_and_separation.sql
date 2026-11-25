/*
# Selam Academy — Complete Catch-Up & Separation of Duties Migration (Idempotent)
Safely ensures:
1. payment_receipts and sms_logs tables exist (from 0004)
2. profiles.role allows 'registrar' and 'property' (from 0005)
3. property_assets and stock_movements tables exist (from 0005)
4. Registrar (...1105) and Property (...1106) auth users & profiles exist BEFORE permissions
5. account_permissions table & ICT-controlled RLS policies are applied cleanly
*/

-- === 1. ENSURE PAYMENT_RECEIPTS & SMS_LOGS EXIST ===
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_record_id uuid NOT NULL REFERENCES public.fee_records(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('Telebirr','CBE','Hijra Bank','ZemZem Bank','Rammis Bank')),
  transaction_ref text NOT NULL,
  amount_paid numeric(12,2) NOT NULL CHECK (amount_paid > 0),
  receipt_image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  review_note text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_receipts TO authenticated;

CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  recipient_name text,
  message_text text NOT NULL,
  alert_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','queued','failed')),
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_logs TO authenticated;

-- === 2. EXPAND ROLE CHECK CONSTRAINT ON PROFILES ===
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

-- === 3. SEED REGISTRAR & PROPERTY ACCOUNTS FIRST (BEFORE FOREIGN KEYS) ===
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

-- === 4. ENSURE PROPERTY & INVENTORY TABLES EXIST ===
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

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;

INSERT INTO public.property_assets (id, item_code, name, category, item_type, quantity, min_stock_level, unit_cost, location, condition, custodian) VALUES
  ('55555555-5555-5555-5555-555555555501','SA-AST-001','Student Dual Desks (Hardwood)','Furniture','fixed_asset',320,20,3800,'Grades 1–12 Classrooms','good','Bereket Yohannes'),
  ('55555555-5555-5555-5555-555555555502','SA-AST-002','Desktop Computers (Core i5)','IT & Electronics','fixed_asset',42,5,34000,'ICT Lab 01','good','Ekram Mohammad'),
  ('55555555-5555-5555-5555-555555555503','SA-AST-003','Compound Microscopes','Lab Equipment','fixed_asset',18,3,12500,'Biology & Chemistry Lab','good','Liya Yakub'),
  ('55555555-5555-5555-5555-555555555504','SA-STK-001','A4 Printing Paper (Reams)','Stationery & Consumables','consumable',14,20,650,'Main Store Room','good','Bereket Yohannes'),
  ('55555555-5555-5555-5555-555555555505','SA-STK-002','Whiteboard Markers (Boxes)','Stationery & Consumables','consumable',8,15,480,'Staff Room Store','good','Bereket Yohannes'),
  ('55555555-5555-5555-5555-555555555506','SA-AST-004','Grade 9 Mathematics Textbooks','Books & Library','fixed_asset',145,10,420,'Main Library','good','Abdurahman Yasin')
ON CONFLICT (id) DO NOTHING;

-- === 5. GRANULAR ACCOUNT PERMISSIONS TABLE (CONTROLLED BY ICT) ===
CREATE TABLE IF NOT EXISTS public.account_permissions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  students_access text NOT NULL DEFAULT 'read_only' CHECK (students_access IN ('none','read_only','create_edit','full_crud')),
  staff_access text NOT NULL DEFAULT 'none' CHECK (staff_access IN ('none','read_only','create_edit','full_crud')),
  grades_access text NOT NULL DEFAULT 'none' CHECK (grades_access IN ('none','read_only','create_edit','full_crud')),
  attendance_access text NOT NULL DEFAULT 'none' CHECK (attendance_access IN ('none','read_only','create_edit','full_crud')),
  finance_access text NOT NULL DEFAULT 'none' CHECK (finance_access IN ('none','read_only','create_edit','full_crud')),
  property_access text NOT NULL DEFAULT 'none' CHECK (property_access IN ('none','read_only','create_edit','full_crud')),
  announcements_access text NOT NULL DEFAULT 'read_only' CHECK (announcements_access IN ('none','read_only','create_edit','full_crud')),
  can_comment_feedback boolean NOT NULL DEFAULT true,
  can_send_messages boolean NOT NULL DEFAULT true,
  can_verify_receipts boolean NOT NULL DEFAULT false,
  can_publish_grades boolean NOT NULL DEFAULT false,
  can_export_data boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_permissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_permissions TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_module_access(p_module text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role text;
  v_level text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role = 'ict' THEN
    RETURN 'full_crud';
  END IF;

  EXECUTE format('SELECT %I FROM public.account_permissions WHERE user_id = $1', p_module || '_access')
    INTO v_level
    USING auth.uid();

  IF v_level IS NOT NULL THEN
    RETURN v_level;
  END IF;

  IF v_role = 'registrar' AND p_module IN ('students','staff','finance') THEN
    RETURN 'full_crud';
  ELSIF v_role = 'director' THEN
    IF p_module IN ('students','staff') THEN RETURN 'read_only';
    ELSE RETURN 'full_crud';
    END IF;
  ELSIF v_role = 'property' AND p_module = 'property' THEN
    RETURN 'full_crud';
  ELSIF v_role = 'teacher' AND p_module IN ('grades','attendance') THEN
    RETURN 'create_edit';
  END IF;

  RETURN 'read_only';
END;
$$;

-- === 6. APPLY ALL RLS POLICIES ===

-- account_permissions
DROP POLICY IF EXISTS "permissions_select" ON public.account_permissions;
CREATE POLICY "permissions_select" ON public.account_permissions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.fn_user_role() IN ('ict','director'));

DROP POLICY IF EXISTS "permissions_ict_write" ON public.account_permissions;
CREATE POLICY "permissions_ict_write" ON public.account_permissions FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() = 'ict');

DROP POLICY IF EXISTS "permissions_ict_update" ON public.account_permissions;
CREATE POLICY "permissions_ict_update" ON public.account_permissions FOR UPDATE
  TO authenticated USING (public.fn_user_role() = 'ict') WITH CHECK (public.fn_user_role() = 'ict');

DROP POLICY IF EXISTS "permissions_ict_delete" ON public.account_permissions;
CREATE POLICY "permissions_ict_delete" ON public.account_permissions FOR DELETE
  TO authenticated USING (public.fn_user_role() = 'ict');

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

-- students (Registrar owns enrollment CRUD; Director is read-only unless ICT grants permission)
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
  TO authenticated WITH CHECK (public.fn_module_access('students') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "students_update" ON public.students;
CREATE POLICY "students_update" ON public.students FOR UPDATE
  TO authenticated
  USING (public.fn_module_access('students') IN ('create_edit','full_crud'))
  WITH CHECK (public.fn_module_access('students') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "students_delete" ON public.students;
CREATE POLICY "students_delete" ON public.students FOR DELETE
  TO authenticated USING (public.fn_module_access('students') = 'full_crud');

-- staff (Registrar owns HR CRUD; Director is read-only unless ICT grants permission)
DROP POLICY IF EXISTS "staff_select" ON public.staff;
CREATE POLICY "staff_select" ON public.staff FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','registrar','property')
    OR (public.fn_user_role() = 'teacher' AND staff.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "staff_write" ON public.staff;
CREATE POLICY "staff_write" ON public.staff FOR INSERT
  TO authenticated WITH CHECK (public.fn_module_access('staff') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "staff_update" ON public.staff;
CREATE POLICY "staff_update" ON public.staff FOR UPDATE
  TO authenticated
  USING (public.fn_module_access('staff') IN ('create_edit','full_crud'))
  WITH CHECK (public.fn_module_access('staff') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "staff_delete" ON public.staff;
CREATE POLICY "staff_delete" ON public.staff FOR DELETE
  TO authenticated USING (public.fn_module_access('staff') = 'full_crud');

-- grades
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

-- fee_records
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
  TO authenticated WITH CHECK (public.fn_module_access('finance') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "fees_update" ON public.fee_records;
CREATE POLICY "fees_update" ON public.fee_records FOR UPDATE
  TO authenticated
  USING (public.fn_module_access('finance') IN ('create_edit','full_crud'))
  WITH CHECK (public.fn_module_access('finance') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "fees_delete" ON public.fee_records;
CREATE POLICY "fees_delete" ON public.fee_records FOR DELETE
  TO authenticated USING (public.fn_module_access('finance') = 'full_crud');

-- payment_receipts
DROP POLICY IF EXISTS "receipts_select" ON public.payment_receipts;
CREATE POLICY "receipts_select" ON public.payment_receipts FOR SELECT
  TO authenticated USING (
    parent_id = auth.uid()
    OR public.fn_user_role() IN ('director','ict','registrar')
  );

DROP POLICY IF EXISTS "receipts_insert" ON public.payment_receipts;
CREATE POLICY "receipts_insert" ON public.payment_receipts FOR INSERT
  TO authenticated WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = payment_receipts.student_id
    )
  );

DROP POLICY IF EXISTS "receipts_update" ON public.payment_receipts;
CREATE POLICY "receipts_update" ON public.payment_receipts FOR UPDATE
  TO authenticated
  USING (public.fn_user_role() IN ('director','ict','registrar'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','registrar'));

DROP POLICY IF EXISTS "receipts_delete" ON public.payment_receipts;
CREATE POLICY "receipts_delete" ON public.payment_receipts FOR DELETE
  TO authenticated USING (
    (parent_id = auth.uid() AND status = 'pending')
    OR public.fn_user_role() IN ('director','ict','registrar')
  );

-- sms_logs
DROP POLICY IF EXISTS "sms_select" ON public.sms_logs;
CREATE POLICY "sms_select" ON public.sms_logs FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','registrar','teacher')
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = sms_logs.student_id
    )
  );

DROP POLICY IF EXISTS "sms_insert" ON public.sms_logs;
CREATE POLICY "sms_insert" ON public.sms_logs FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','registrar','teacher'));

-- property_assets & stock_movements
DROP POLICY IF EXISTS "property_select" ON public.property_assets;
CREATE POLICY "property_select" ON public.property_assets FOR SELECT
  TO authenticated USING (public.fn_user_role() IN ('director','ict','property','registrar'));

DROP POLICY IF EXISTS "property_write" ON public.property_assets;
CREATE POLICY "property_write" ON public.property_assets FOR INSERT
  TO authenticated WITH CHECK (public.fn_module_access('property') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "property_update" ON public.property_assets;
CREATE POLICY "property_update" ON public.property_assets FOR UPDATE
  TO authenticated
  USING (public.fn_module_access('property') IN ('create_edit','full_crud'))
  WITH CHECK (public.fn_module_access('property') IN ('create_edit','full_crud'));

DROP POLICY IF EXISTS "property_delete" ON public.property_assets;
CREATE POLICY "property_delete" ON public.property_assets FOR DELETE
  TO authenticated USING (public.fn_module_access('property') = 'full_crud');

DROP POLICY IF EXISTS "movements_select" ON public.stock_movements;
CREATE POLICY "movements_select" ON public.stock_movements FOR SELECT
  TO authenticated USING (public.fn_user_role() IN ('director','ict','property','registrar'));

DROP POLICY IF EXISTS "movements_insert" ON public.stock_movements;
CREATE POLICY "movements_insert" ON public.stock_movements FOR INSERT
  TO authenticated WITH CHECK (public.fn_module_access('property') IN ('create_edit','full_crud'));

-- === 7. SEED DEFAULT PERMISSION MATRIX (ONLY FOR PROFILES THAT EXIST) ===
INSERT INTO public.account_permissions (
  user_id, students_access, staff_access, grades_access, attendance_access,
  finance_access, property_access, announcements_access,
  can_comment_feedback, can_send_messages, can_verify_receipts, can_publish_grades, can_export_data
)
SELECT
  p.id,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'registrar' THEN 'full_crud'
    WHEN 'director' THEN 'read_only'
    WHEN 'teacher' THEN 'read_only'
    WHEN 'parent' THEN 'read_only'
    ELSE 'none'
  END,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'registrar' THEN 'full_crud'
    WHEN 'director' THEN 'read_only'
    WHEN 'property' THEN 'read_only'
    ELSE 'none'
  END,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'teacher' THEN 'create_edit'
    WHEN 'director' THEN 'read_only'
    WHEN 'registrar' THEN 'read_only'
    WHEN 'parent' THEN 'read_only'
    ELSE 'none'
  END,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'teacher' THEN 'create_edit'
    WHEN 'director' THEN 'read_only'
    WHEN 'registrar' THEN 'read_only'
    WHEN 'parent' THEN 'read_only'
    ELSE 'none'
  END,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'registrar' THEN 'full_crud'
    WHEN 'director' THEN 'read_only'
    WHEN 'parent' THEN 'read_only'
    ELSE 'none'
  END,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'property' THEN 'full_crud'
    WHEN 'director' THEN 'read_only'
    ELSE 'none'
  END,
  CASE p.role
    WHEN 'ict' THEN 'full_crud'
    WHEN 'director' THEN 'full_crud'
    ELSE 'read_only'
  END,
  p.role IN ('ict','director','registrar','parent'),
  p.role IN ('ict','director','registrar','teacher','parent'),
  p.role IN ('ict','director','registrar'),
  p.role IN ('ict','teacher'),
  p.role IN ('ict','director','registrar','property')
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;