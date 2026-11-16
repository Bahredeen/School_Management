/*
# Selam Academy — Core Schema
Full schema for Selam Academy (Hawassa, Ethiopia) K-12 School Management System.
Tables: profiles, staff, students, parent_student_links, subjects, grades,
attendance, messages, parent_feedback, announcements, fee_records.
RLS: authenticated, role-based via fn_user_role() helper.

Order: all tables created first, then helper function, then RLS + policies.
*/

-- === TABLES (created first so cross-table policies resolve) ===

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('director','ict','teacher','parent')),
  phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role_department text NOT NULL,
  assigned_grades_subjects text,
  qualification text,
  employment_status text NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','on_leave','terminated')),
  monthly_salary numeric(12,2) NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  gender text CHECK (gender IN ('M','F')),
  grade text NOT NULL,
  section text NOT NULL,
  guardian_name text,
  guardian_phone text,
  sub_city text,
  emergency_contact text,
  enrollment_status text NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('active','transferred','graduated','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  grade text NOT NULL,
  teacher_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester text NOT NULL CHECK (semester IN ('1','2')),
  quiz numeric(5,2) NOT NULL DEFAULT 0 CHECK (quiz BETWEEN 0 AND 10),
  assignment numeric(5,2) NOT NULL DEFAULT 0 CHECK (assignment BETWEEN 0 AND 15),
  mid_exam numeric(5,2) NOT NULL DEFAULT 0 CHECK (mid_exam BETWEEN 0 AND 25),
  final_exam numeric(5,2) NOT NULL DEFAULT 0 CHECK (final_exam BETWEEN 0 AND 50),
  conduct text CHECK (conduct IN ('A','B','C','D')),
  remarks text,
  published boolean NOT NULL DEFAULT false,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, semester)
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  note text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parent_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','resolved')),
  response text,
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','staff','parents')),
  posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount_due numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- === HELPER FUNCTION ===

CREATE OR REPLACE FUNCTION public.fn_user_role()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- === RLS + GRANTS + POLICIES ===

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, INSERT, DELETE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_or_staff_profile" ON profiles;
CREATE POLICY "select_own_or_staff_profile" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR public.fn_user_role() IN ('director','ict')
    OR (
      public.fn_user_role() = 'teacher'
      AND EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = profiles.id AND p2.role IN ('teacher','parent'))
    )
  );

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_insert_profile" ON profiles;
CREATE POLICY "admin_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "admin_update_profile_status" ON profiles;
CREATE POLICY "admin_update_profile_status" ON profiles FOR UPDATE
  TO authenticated
  USING (public.fn_user_role() IN ('director','ict'))
  WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "admin_delete_profile" ON profiles;
CREATE POLICY "admin_delete_profile" ON profiles FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff TO authenticated;

DROP POLICY IF EXISTS "staff_select" ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict')
    OR (public.fn_user_role() = 'teacher' AND staff.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "staff_write" ON staff;
CREATE POLICY "staff_write" ON staff FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "staff_update" ON staff;
CREATE POLICY "staff_update" ON staff FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'))
  WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "staff_delete" ON staff;
CREATE POLICY "staff_delete" ON staff FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO authenticated;

DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','teacher')
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = students.id
    )
  );

DROP POLICY IF EXISTS "students_write" ON students;
CREATE POLICY "students_write" ON students FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'))
  WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_delete" ON students FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- parent_student_links
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON parent_student_links TO authenticated;

DROP POLICY IF EXISTS "links_select" ON parent_student_links;
CREATE POLICY "links_select" ON parent_student_links FOR SELECT
  TO authenticated USING (
    parent_id = auth.uid()
    OR public.fn_user_role() IN ('director','ict')
  );

DROP POLICY IF EXISTS "links_write" ON parent_student_links;
CREATE POLICY "links_write" ON parent_student_links FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "links_delete" ON parent_student_links;
CREATE POLICY "links_delete" ON parent_student_links FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON subjects TO authenticated;

DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "subjects_write" ON subjects;
CREATE POLICY "subjects_write" ON subjects FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'))
  WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- grades
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON grades TO authenticated;

DROP POLICY IF EXISTS "grades_select" ON grades;
CREATE POLICY "grades_select" ON grades FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict')
    OR grades.teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = grades.student_id
    )
  );

DROP POLICY IF EXISTS "grades_write" ON grades;
CREATE POLICY "grades_write" ON grades FOR INSERT
  TO authenticated WITH CHECK (
    public.fn_user_role() IN ('director','ict','teacher')
  );

DROP POLICY IF EXISTS "grades_update" ON grades;
CREATE POLICY "grades_update" ON grades FOR UPDATE
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict')
    OR grades.teacher_id = auth.uid()
  )
  WITH CHECK (public.fn_user_role() IN ('director','ict','teacher'));

DROP POLICY IF EXISTS "grades_delete" ON grades;
CREATE POLICY "grades_delete" ON grades FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;

DROP POLICY IF EXISTS "attendance_select" ON attendance;
CREATE POLICY "attendance_select" ON attendance FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict','teacher')
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = attendance.student_id
    )
  );

DROP POLICY IF EXISTS "attendance_write" ON attendance;
CREATE POLICY "attendance_write" ON attendance FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict','teacher'));

DROP POLICY IF EXISTS "attendance_update" ON attendance;
CREATE POLICY "attendance_update" ON attendance FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','teacher'))
  WITH CHECK (public.fn_user_role() IN ('director','ict','teacher'));

DROP POLICY IF EXISTS "attendance_delete" ON attendance;
CREATE POLICY "attendance_delete" ON attendance FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict','teacher'));

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT
  TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE
  TO authenticated USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid());

-- parent_feedback
ALTER TABLE parent_feedback ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON parent_feedback TO authenticated;

DROP POLICY IF EXISTS "feedback_select" ON parent_feedback;
CREATE POLICY "feedback_select" ON parent_feedback FOR SELECT
  TO authenticated USING (
    parent_id = auth.uid()
    OR public.fn_user_role() IN ('director','ict')
  );

DROP POLICY IF EXISTS "feedback_insert" ON parent_feedback;
CREATE POLICY "feedback_insert" ON parent_feedback FOR INSERT
  TO authenticated WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "feedback_update" ON parent_feedback;
CREATE POLICY "feedback_update" ON parent_feedback FOR UPDATE
  TO authenticated USING (
    parent_id = auth.uid()
    OR public.fn_user_role() IN ('director','ict')
  )
  WITH CHECK (
    parent_id = auth.uid()
    OR public.fn_user_role() IN ('director','ict')
  );

DROP POLICY IF EXISTS "feedback_delete" ON parent_feedback;
CREATE POLICY "feedback_delete" ON parent_feedback FOR DELETE
  TO authenticated USING (parent_id = auth.uid());

-- announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON announcements TO authenticated;

DROP POLICY IF EXISTS "ann_select" ON announcements;
CREATE POLICY "ann_select" ON announcements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "ann_write" ON announcements;
CREATE POLICY "ann_write" ON announcements FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "ann_update" ON announcements;
CREATE POLICY "ann_update" ON announcements FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'))
  WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "ann_delete" ON announcements;
CREATE POLICY "ann_delete" ON announcements FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- fee_records
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_records TO authenticated;

DROP POLICY IF EXISTS "fees_select" ON fee_records;
CREATE POLICY "fees_select" ON fee_records FOR SELECT
  TO authenticated USING (
    public.fn_user_role() IN ('director','ict')
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = fee_records.student_id
    )
  );

DROP POLICY IF EXISTS "fees_write" ON fee_records;
CREATE POLICY "fees_write" ON fee_records FOR INSERT
  TO authenticated WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "fees_update" ON fee_records;
CREATE POLICY "fees_update" ON fee_records FOR UPDATE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'))
  WITH CHECK (public.fn_user_role() IN ('director','ict'));

DROP POLICY IF EXISTS "fees_delete" ON fee_records;
CREATE POLICY "fees_delete" ON fee_records FOR DELETE
  TO authenticated USING (public.fn_user_role() IN ('director','ict'));

-- === INDEXES ===
CREATE INDEX IF NOT EXISTS idx_students_grade_section ON students(grade, section);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fee_records(student_id);
