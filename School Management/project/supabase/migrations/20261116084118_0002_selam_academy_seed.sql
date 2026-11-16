/*
# Selam Academy — Demo Auth Users + Profile + Data Seed

Creates demo auth.users with FIXED UUIDs, matching profiles, staff, students,
parent-student links, subjects, grades, attendance, announcements, fee records,
and sample messages/feedback.

Demo accounts (password for all: SelamAcademy2026!):
  director@selamacademy.edu.et  — Director portal
  ict@selamacademy.edu.et       — ICT Manager portal
  teacher@selamacademy.edu.et   — Teacher portal
  parent@selamacademy.edu.et    — Family/Parent portal

All UUIDs are fixed so this migration is deterministic on rebuild.
*/

-- === AUTH USERS (fixed UUIDs) ===
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'director@selamacademy.edu.et', crypt('SelamAcademy2026!', gen_salt('bf')), now(), now(), now(), '{"role":"director"}'::jsonb, '{"full_name":"Dawit Tadesse"}'::jsonb),
  ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ict@selamacademy.edu.et', crypt('SelamAcademy2026!', gen_salt('bf')), now(), now(), now(), '{"role":"ict"}'::jsonb, '{"full_name":"Ekram Mohammad"}'::jsonb),
  ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher@selamacademy.edu.et', crypt('SelamAcademy2026!', gen_salt('bf')), now(), now(), now(), '{"role":"teacher"}'::jsonb, '{"full_name":"Tigist Alemu"}'::jsonb),
  ('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent@selamacademy.edu.et', crypt('SelamAcademy2026!', gen_salt('bf')), now(), now(), now(), '{"role":"parent"}'::jsonb, '{"full_name":"Ahmad Kedir"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- identities (provider_id NOT NULL, email is generated from identity_data)
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
SELECT gen_random_uuid(), id, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now()
FROM auth.users
WHERE id IN ('11111111-1111-1111-1111-111111111101','11111111-1111-1111-1111-111111111102','11111111-1111-1111-1111-111111111103','11111111-1111-1111-1111-111111111104')
ON CONFLICT DO NOTHING;

-- === PROFILES ===
INSERT INTO profiles (id, email, full_name, role, phone, status) VALUES
  ('11111111-1111-1111-1111-111111111101','director@selamacademy.edu.et','Dawit Tadesse','director','+251911200301','active'),
  ('11111111-1111-1111-1111-111111111102','ict@selamacademy.edu.et','Ekram Mohammad','ict','+251911200302','active'),
  ('11111111-1111-1111-1111-111111111103','teacher@selamacademy.edu.et','Tigist Alemu','teacher','+251911200303','active'),
  ('11111111-1111-1111-1111-111111111104','parent@selamacademy.edu.et','Ahmad Kedir','parent','+251911200304','active')
ON CONFLICT (id) DO NOTHING;

-- === STAFF ===
INSERT INTO staff (id, employee_id, full_name, phone, role_department, assigned_grades_subjects, qualification, employment_status, monthly_salary, user_id) VALUES
  ('22222222-2222-2222-2222-222222222201','SA-EMP-001','Tigist Alemu','+251911200303','Teacher — Mathematics','Grade 9 A, Grade 10 A — Mathematics','BSc Mathematics, Addis Ababa Univ.','active',18000,'11111111-1111-1111-1111-111111111103'),
  ('22222222-2222-2222-2222-222222222202','SA-EMP-002','Dawit Tadesse','+251911200301','Director / Principal','School Leadership','MA Educational Leadership','active',45000,'11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222203','SA-EMP-003','Ekram Mohammad','+251911200302','ICT Manager','ICT / Systems','BSc Computer Science','active',22000,'11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222204','SA-EMP-004','Hanan Ahmed','+251911200310','Teacher — English','Grade 9 A/B, Grade 11 A — English','BA English Literature','active',17000,NULL),
  ('22222222-2222-2222-2222-222222222205','SA-EMP-005','Liya Yakub','+251911200311','Teacher — Science','Grade 8 A — Biology, Chemistry','BSc Biology','active',17500,NULL),
  ('22222222-2222-2222-2222-222222222206','SA-EMP-006','Abdurahman Yasin','+251911200312','Support — Librarian','Library','Diploma Library Science','active',9000,NULL),
  ('22222222-2222-2222-2222-222222222207','SA-EMP-007','Sara Bekele','+251911200313','Support — Accountant','Finance','BSc Accounting','active',16000,NULL)
ON CONFLICT (id) DO NOTHING;

-- === STUDENTS ===
INSERT INTO students (id, student_id, full_name, gender, grade, section, guardian_name, guardian_phone, sub_city, emergency_contact, enrollment_status) VALUES
  ('33333333-3333-3333-3333-333333333301','SA-2026-0101','Hanan Kedir','F','9','A','Ahmad Kedir','+251911200304','Addis Ketema','+251911200304','active'),
  ('33333333-3333-3333-3333-333333333302','SA-2026-0102','Yusuf Kedir','M','7','B','Ahmad Kedir','+251911200304','Addis Ketema','+251911200304','active'),
  ('33333333-3333-3333-3333-333333333303','SA-2026-0103','Tigist Haile','F','9','A','Haile Girma','+251911200320','Tabor','+251911200320','active'),
  ('33333333-3333-3333-3333-333333333304','SA-2026-0104','Dawit Bekele','M','9','A','Bekele Tesfaye','+251911200321','Menehariya','+251911200321','active'),
  ('33333333-3333-3333-3333-333333333305','SA-2026-0105','Ekram Yasin','F','9','A','Yasin Ali','+251911200322','Misrak','+251911200322','active'),
  ('33333333-3333-3333-3333-333333333306','SA-2026-0106','Liya Tadesse','F','9','A','Tadesse Wolde','+251911200323','Hayk Dar','+251911200323','active'),
  ('33333333-3333-3333-3333-333333333307','SA-2026-0107','Ahmad Mustafa','M','9','A','Mustafa Omar','+251911200324','Bahil Adarash','+251911200324','active'),
  ('33333333-3333-3333-3333-333333333308','SA-2026-0108','Sara Girma','F','9','A','Girma Alemu','+251911200325','Tabor','+251911200325','active'),
  ('33333333-3333-3333-3333-333333333309','SA-2026-0109','Nathan Dawit','M','10','A','Dawit Solomon','+251911200326','Addis Ketema','+251911200326','active'),
  ('33333333-3333-3333-3333-333333333310','SA-2026-0110','Mahlet Tesfaye','F','10','A','Tesfaye Bekele','+251911200327','Misrak','+251911200327','active'),
  ('33333333-3333-3333-3333-333333333311','SA-2026-0111','Robel Alemu','M','8','A','Alemu Kebede','+251911200328','Hayk Dar','+251911200328','active'),
  ('33333333-3333-3333-3333-333333333312','SA-2026-0112','Betlehem Yohannes','F','8','A','Yohannes Haile','+251911200329','Bahil Adarash','+251911200329','active')
ON CONFLICT (id) DO NOTHING;

-- === PARENT-STUDENT LINKS ===
INSERT INTO parent_student_links (parent_id, student_id, relationship) VALUES
  ('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333301','Father'),
  ('11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333302','Father')
ON CONFLICT (parent_id, student_id) DO NOTHING;

-- === SUBJECTS ===
INSERT INTO subjects (id, name, code, grade, teacher_id) VALUES
  ('44444444-4444-4444-4444-444444444401','Mathematics','MATH09','9','22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444402','English','ENG09','9','22222222-2222-2222-2222-222222222204'),
  ('44444444-4444-4444-4444-444444444403','Biology','BIO09','9',NULL),
  ('44444444-4444-4444-4444-444444444404','Chemistry','CHE09','9',NULL),
  ('44444444-4444-4444-4444-444444444405','Physics','PHY09','9',NULL),
  ('44444444-4444-4444-4444-444444444406','Amharic','AMH09','9',NULL),
  ('44444444-4444-4444-4444-444444444407','Social Studies','SOC09','9',NULL),
  ('44444444-4444-4444-4444-444444444408','Mathematics','MATH10','10','22222222-2222-2222-2222-222222222201'),
  ('44444444-4444-4444-4444-444444444409','English','ENG10','10','22222222-2222-2222-2222-222222222204')
ON CONFLICT (id) DO NOTHING;

-- === GRADES ===
INSERT INTO grades (student_id, subject_id, semester, quiz, assignment, mid_exam, final_exam, conduct, remarks, published, teacher_id) VALUES
  ('33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444401','1',9,14,22,45,'A','Excellent progress',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333302','44444444-4444-4444-4444-444444444401','1',8,12,20,42,'B','Good work',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333303','44444444-4444-4444-4444-444444444401','1',10,15,24,48,'A','Outstanding',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333304','44444444-4444-4444-4444-444444444401','1',7,10,18,38,'C','Needs improvement',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333305','44444444-4444-4444-4444-444444444401','1',9,13,22,44,'B','Consistent effort',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333306','44444444-4444-4444-4444-444444444401','1',8,14,21,43,'A','Good understanding',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333307','44444444-4444-4444-4444-444444444401','1',6,11,17,35,'C','Must study more',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333308','44444444-4444-4444-4444-444444444401','1',9,14,23,46,'A','Very good',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444402','1',8,13,20,41,'B','Good',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333303','44444444-4444-4444-4444-444444444402','1',9,14,22,44,'A','Excellent',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333304','44444444-4444-4444-4444-444444444402','1',7,12,19,40,'B','Satisfactory',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444403','1',10,14,23,47,'A','Strong lab work',true,'11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333302','44444444-4444-4444-4444-444444444403','1',8,13,21,42,'B','Good',true,'11111111-1111-1111-1111-111111111103')
ON CONFLICT (student_id, subject_id, semester) DO NOTHING;

-- === ATTENDANCE ===
INSERT INTO attendance (student_id, date, status, recorded_by) VALUES
  ('33333333-3333-3333-3333-333333333301',CURRENT_DATE,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333302',CURRENT_DATE,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333303',CURRENT_DATE,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333304',CURRENT_DATE,'late','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333305',CURRENT_DATE,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333306',CURRENT_DATE,'absent','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333307',CURRENT_DATE,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333308',CURRENT_DATE,'excused','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333301',CURRENT_DATE - 1,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333301',CURRENT_DATE - 2,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333301',CURRENT_DATE - 3,'present','11111111-1111-1111-1111-111111111103'),
  ('33333333-3333-3333-3333-333333333301',CURRENT_DATE - 4,'late','11111111-1111-1111-1111-111111111103')
ON CONFLICT (student_id, date) DO NOTHING;

-- === ANNOUNCEMENTS ===
INSERT INTO announcements (title, body, audience, posted_by) VALUES
  ('Semester 1 Mid-Exam Schedule','Mid-exams begin Monday. Students must arrive by 8:00 AM. Check the notice board for room assignments.','all','11111111-1111-1111-1111-111111111101'),
  ('Parent-Teacher Conference','PTC is scheduled for Friday 2:00 PM at the 01 Campus main hall. All parents are welcome.','parents','11111111-1111-1111-1111-111111111101'),
  ('Staff Meeting','Mandatory staff meeting Thursday 3:30 PM in the staff room.','staff','11111111-1111-1111-1111-111111111101'),
  ('Tuition Fee Reminder','Semester 1 tuition is due by the 15th. Payments accepted at the finance office or via CBE account.','parents','11111111-1111-1111-1111-111111111101')
ON CONFLICT DO NOTHING;

-- === FEE RECORDS ===
INSERT INTO fee_records (student_id, description, amount_due, amount_paid, due_date) VALUES
  ('33333333-3333-3333-3333-333333333301','Semester 1 Tuition',12000,9000,CURRENT_DATE + 15),
  ('33333333-3333-3333-3333-333333333301','Transport — Semester 1',3000,3000,CURRENT_DATE + 15),
  ('33333333-3333-3333-3333-333333333302','Semester 1 Tuition',10000,5000,CURRENT_DATE + 15),
  ('33333333-3333-3333-3333-333333333302','Transport — Semester 1',3000,0,CURRENT_DATE + 15),
  ('33333333-3333-3333-3333-333333333303','Semester 1 Tuition',12000,12000,CURRENT_DATE + 15)
ON CONFLICT DO NOTHING;

-- === MESSAGES ===
INSERT INTO messages (sender_id, recipient_id, student_id, body, read) VALUES
  ('11111111-1111-1111-1111-111111111103','11111111-1111-1111-1111-111111111104','33333333-3333-3333-3333-333333333301','Hello Mr. Kedir, Hanan is doing very well in Mathematics this semester. Keep encouraging her at home.',true),
  ('11111111-1111-1111-1111-111111111104','11111111-1111-1111-1111-111111111103','33333333-3333-3333-3333-333333333301','Thank you Ms. Tigist, we are very happy to hear this. We will keep supporting her.',false)
ON CONFLICT DO NOTHING;

-- === PARENT FEEDBACK ===
INSERT INTO parent_feedback (parent_id, subject, category, body, status, response, responded_by) VALUES
  ('11111111-1111-1111-1111-111111111104','Request for extra English tutoring','Academic','My daughter Hanan could benefit from extra English practice after school. Is there a club or tutoring available?','resolved','Thank you for the suggestion. We have started an after-school English club on Wednesdays 3:30-4:30 PM. Hanan is welcome to join.','11111111-1111-1111-1111-111111111101'),
  ('11111111-1111-1111-1111-111111111104','Library opening hours','Facilities','Could the library stay open until 5 PM? Many parents pick up children after work.','submitted',NULL,NULL)
ON CONFLICT DO NOTHING;
