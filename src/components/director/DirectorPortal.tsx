import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Plus,
  Receipt,
  Search,
  Send,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  getDefaultPermissionsForRole,
  isSupabaseConfigured,
  supabase,
  type AccountPermissions,
  type Announcement,
  type FeeRecord,
  type ParentFeedback,
  type PaymentReceipt,
  type StaffMember,
  type Student,
  type Subject,
} from '../../lib/supabase';
import { translations, type Language } from '../../lib/i18n';
import type { PortalUser } from '../../App';

const fallbackStudents: Student[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    student_id: 'SA-2026-0101',
    full_name: 'Hanan Kedir',
    gender: 'F',
    grade: '9',
    section: 'A',
    guardian_name: 'Ahmad Kedir',
    guardian_phone: '+251911200304',
    sub_city: 'Addis Ketema',
    emergency_contact: '+251911200304',
    enrollment_status: 'active',
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    student_id: 'SA-2026-0102',
    full_name: 'Yusuf Kedir',
    gender: 'M',
    grade: '7',
    section: 'B',
    guardian_name: 'Ahmad Kedir',
    guardian_phone: '+251911200304',
    sub_city: 'Addis Ketema',
    emergency_contact: '+251911200304',
    enrollment_status: 'active',
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    student_id: 'SA-2026-0103',
    full_name: 'Tigist Haile',
    gender: 'F',
    grade: '9',
    section: 'A',
    guardian_name: 'Haile Girma',
    guardian_phone: '+251911200320',
    sub_city: 'Tabor',
    emergency_contact: '+251911200320',
    enrollment_status: 'active',
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    student_id: 'SA-2026-0104',
    full_name: 'Dawit Bekele',
    gender: 'M',
    grade: '9',
    section: 'A',
    guardian_name: 'Bekele Tesfaye',
    guardian_phone: '+251911200321',
    sub_city: 'Menehariya',
    emergency_contact: '+251911200321',
    enrollment_status: 'active',
  },
];

const fallbackStaff: StaffMember[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    employee_id: 'SA-EMP-001',
    full_name: 'Tigist Alemu',
    phone: '+251911200303',
    role_department: 'Teacher — Mathematics',
    assigned_grades_subjects: 'Grade 9 A, Grade 10 A — Mathematics',
    qualification: 'BSc Mathematics, Addis Ababa Univ.',
    employment_status: 'active',
    monthly_salary: 18000,
    user_id: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    employee_id: 'SA-EMP-002',
    full_name: 'Dawit Tadesse',
    phone: '+251911200301',
    role_department: 'Director / Principal',
    assigned_grades_subjects: 'School Leadership',
    qualification: 'MA Educational Leadership',
    employment_status: 'active',
    monthly_salary: 45000,
    user_id: '11111111-1111-1111-1111-111111111101',
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    employee_id: 'SA-EMP-004',
    full_name: 'Hanan Ahmed',
    phone: '+251911200310',
    role_department: 'Teacher — English',
    assigned_grades_subjects: 'Grade 9 A/B, Grade 11 A — English',
    qualification: 'BA English Literature',
    employment_status: 'active',
    monthly_salary: 17000,
    user_id: null,
  },
  {
    id: '22222222-2222-2222-2222-222222222207',
    employee_id: 'SA-EMP-007',
    full_name: 'Sara Bekele',
    phone: '+251911200313',
    role_department: 'Support — Accountant',
    assigned_grades_subjects: 'Finance',
    qualification: 'BSc Accounting',
    employment_status: 'active',
    monthly_salary: 16000,
    user_id: null,
  },
];

const fallbackSubjects: Subject[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    name: 'Mathematics',
    code: 'MATH09',
    grade: '9',
    teacher_id: '22222222-2222-2222-2222-222222222201',
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    name: 'English',
    code: 'ENG09',
    grade: '9',
    teacher_id: '22222222-2222-2222-2222-222222222204',
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    name: 'Biology',
    code: 'BIO09',
    grade: '9',
    teacher_id: null,
  },
];

const fallbackAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Semester 1 Mid-Exam Schedule',
    body: 'Mid-exams begin Monday. Students must arrive by 8:00 AM. Check the notice board for room assignments.',
    audience: 'all',
    posted_by: '11111111-1111-1111-1111-111111111101',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    title: 'Parent-Teacher Conference',
    body: 'PTC is scheduled for Friday 2:00 PM at the 01 Campus main hall. All parents are welcome.',
    audience: 'parents',
    posted_by: '11111111-1111-1111-1111-111111111101',
    created_at: new Date().toISOString(),
  },
];

const fallbackFeedback: ParentFeedback[] = [
  {
    id: 'fb-1',
    parent_id: '11111111-1111-1111-1111-111111111104',
    subject: 'Library opening hours',
    category: 'Facilities',
    body: 'Could the library stay open until 5 PM? Many parents pick up children after work.',
    status: 'submitted',
    response: null,
    responded_by: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fb-2',
    parent_id: '11111111-1111-1111-1111-111111111104',
    subject: 'Request for extra English tutoring',
    category: 'Academic',
    body: 'My daughter Hanan could benefit from extra English practice after school. Is there a club or tutoring available?',
    status: 'resolved',
    response:
      'Thank you for the suggestion. We have started an after-school English club on Wednesdays 3:30-4:30 PM. Hanan is welcome to join.',
    responded_by: '11111111-1111-1111-1111-111111111101',
    created_at: new Date().toISOString(),
  },
];

const fallbackFees: FeeRecord[] = [
  {
    id: 'fee-1',
    student_id: '33333333-3333-3333-3333-333333333301',
    description: 'Semester 1 Tuition',
    amount_due: 12000,
    amount_paid: 9000,
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
  },
  {
    id: 'fee-2',
    student_id: '33333333-3333-3333-3333-333333333302',
    description: 'Semester 1 Tuition',
    amount_due: 10000,
    amount_paid: 5000,
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
  },
];

const fallbackReceipts: PaymentReceipt[] = [
  {
    id: 'rcpt-1',
    fee_record_id: 'fee-1',
    student_id: '33333333-3333-3333-3333-333333333301',
    parent_id: '11111111-1111-1111-1111-111111111104',
    provider: 'Telebirr',
    transaction_ref: 'TBR-98234109',
    amount_paid: 3000,
    receipt_image_url: null,
    status: 'pending',
    review_note: null,
    verified_by: null,
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
];

const GRADES_LIST = ['KG-1', 'KG-2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS_LIST = ['A', 'B', 'C', 'D'];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  accent: string;
  trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${accent}`}>
          <Icon size={18} />
        </span>
        {trend && <span className="trend">{trend}</span>}
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function DirectorPortal({
  user,
  activeNavIndex,
  language,
  onNavigate,
  onPendingFeedbackCountChange,
}: {
  user: PortalUser;
  activeNavIndex: number;
  language: Language;
  onNavigate: (index: number) => void;
  onPendingFeedbackCountChange?: (count: number) => void;
}) {
  const t = translations[language].dashboard;
  const isAm = language === 'am';

  const [permissions, setPermissions] = useState<AccountPermissions>(() =>
    getDefaultPermissionsForRole(user.id, user.role)
  );
  const [students, setStudents] = useState<Student[]>(fallbackStudents);
  const [staff, setStaff] = useState<StaffMember[]>(fallbackStaff);
  const [subjects, setSubjects] = useState<Subject[]>(fallbackSubjects);
  const [announcements, setAnnouncements] = useState<Announcement[]>(fallbackAnnouncements);
  const [feedbackList, setFeedbackList] = useState<ParentFeedback[]>(fallbackFeedback);
  const [fees, setFees] = useState<FeeRecord[]>(fallbackFees);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(fallbackReceipts);
  const [attendanceTodayRate, setAttendanceTodayRate] = useState<string>('94.6%');
  const [toast, setToast] = useState<string>('');
  const [previewReceiptImage, setPreviewReceiptImage] = useState<string | null>(null);

  // Filters
  const [studentQuery, setStudentQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [staffQuery, setStaffQuery] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('ALL');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('ALL');
  const [receiptRejectNotes, setReceiptRejectNotes] = useState<Record<string, string>>({});

  // Subject Form State
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    grade: '9',
    teacher_id: '',
  });

  // Announcement Form State
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    audience: 'all' as Announcement['audience'],
  });

  // Feedback Response Drafts
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, ParentFeedback['status']>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3400);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadAllDirectorData = async () => {
      const [
        permRes,
        studentsRes,
        staffRes,
        subjectsRes,
        announcementsRes,
        feedbackRes,
        feesRes,
        receiptsRes,
        attendanceRes,
      ] = await Promise.all([
        supabase
          .from('account_permissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('students').select('*').order('student_id', { ascending: true }),
        supabase.from('staff').select('*').order('employee_id', { ascending: true }),
        supabase.from('subjects').select('*').order('grade', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('parent_feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('fee_records').select('*'),
        supabase
          .from('payment_receipts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('attendance')
          .select('status')
          .eq('date', new Date().toISOString().slice(0, 10)),
      ]);

      if (permRes.data) setPermissions(permRes.data as AccountPermissions);
      if (studentsRes.data && studentsRes.data.length > 0) setStudents(studentsRes.data as Student[]);
      if (staffRes.data && staffRes.data.length > 0) setStaff(staffRes.data as StaffMember[]);
      if (subjectsRes.data && subjectsRes.data.length > 0) setSubjects(subjectsRes.data as Subject[]);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as Announcement[]);
      if (feedbackRes.data) {
        const fb = feedbackRes.data as ParentFeedback[];
        setFeedbackList(fb);
        const openCount = fb.filter((item) => item.status !== 'resolved').length;
        onPendingFeedbackCountChange?.(openCount);
      }
      if (feesRes.data) setFees(feesRes.data as FeeRecord[]);
      if (receiptsRes.data) setReceipts(receiptsRes.data as PaymentReceipt[]);
      if (attendanceRes.data && attendanceRes.data.length > 0) {
        const presentOrLate = attendanceRes.data.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length;
        const rate = ((presentOrLate / attendanceRes.data.length) * 100).toFixed(1);
        setAttendanceTodayRate(`${rate}%`);
      }
    };

    loadAllDirectorData();
  }, [user.id, onPendingFeedbackCountChange]);

  // Derived metrics
  const activeStudentsCount = students.filter((s) => s.enrollment_status === 'active').length;
  const activeTeachersCount = staff.filter(
    (m) => m.employment_status === 'active' && m.role_department.toLowerCase().includes('teacher')
  ).length;
  const totalStaffCount = staff.filter((m) => m.employment_status === 'active').length;
  const totalFeeCollected = useMemo(() => {
    if (fees.length === 0) return 38000;
    return fees.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  }, [fees]);
  const totalFeeDue = useMemo(() => {
    if (fees.length === 0) return 50000;
    return fees.reduce((sum, item) => sum + Number(item.amount_due || 0), 0);
  }, [fees]);

  const pendingReceiptsCount = useMemo(
    () => receipts.filter((r) => r.status === 'pending').length,
    [receipts]
  );

  // Filtered Lists
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        s.full_name.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.student_id.toLowerCase().includes(studentQuery.toLowerCase()) ||
        (s.guardian_name || '').toLowerCase().includes(studentQuery.toLowerCase());
      const matchesGrade = gradeFilter === 'ALL' || s.grade === gradeFilter;
      const matchesSection = sectionFilter === 'ALL' || s.section === sectionFilter;
      return matchesQuery && matchesGrade && matchesSection;
    });
  }, [students, studentQuery, gradeFilter, sectionFilter]);

  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      const matchesQuery =
        m.full_name.toLowerCase().includes(staffQuery.toLowerCase()) ||
        m.employee_id.toLowerCase().includes(staffQuery.toLowerCase()) ||
        m.role_department.toLowerCase().includes(staffQuery.toLowerCase());
      const matchesStatus = staffStatusFilter === 'ALL' || m.employment_status === staffStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [staff, staffQuery, staffStatusFilter]);

  const filteredFeedback = useMemo(() => {
    return feedbackList.filter(
      (f) => feedbackStatusFilter === 'ALL' || f.status === feedbackStatusFilter
    );
  }, [feedbackList, feedbackStatusFilter]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(
      (r) => receiptStatusFilter === 'ALL' || r.status === receiptStatusFilter
    );
  }, [receipts, receiptStatusFilter]);

  // === SUBJECTS ===
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) return;
    const payload = {
      name: subjectForm.name.trim(),
      code: subjectForm.code.trim().toUpperCase(),
      grade: subjectForm.grade,
      teacher_id: subjectForm.teacher_id || null,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .insert([payload])
        .select()
        .single();
      if (!error && data) {
        setSubjects((prev) => [...prev, data as Subject]);
      }
    } else {
      setSubjects((prev) => [...prev, { id: `sub-${Date.now()}`, ...payload }]);
    }
    setSubjectForm({ name: '', code: '', grade: '9', teacher_id: '' });
    showToast(isAm ? 'የትምህርት ዓይነት ታክሏል።' : 'Subject created.');
  };

  const handleAssignTeacherToSubject = async (subjectId: string, teacherId: string) => {
    const normalizedTeacherId = teacherId || null;
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('subjects')
        .update({ teacher_id: normalizedTeacherId })
        .eq('id', subjectId);
    }
    setSubjects((prev) =>
      prev.map((sub) => (sub.id === subjectId ? { ...sub, teacher_id: normalizedTeacherId } : sub))
    );
    showToast(isAm ? 'መምህር ተመድቧል።' : 'Teacher assignment updated.');
  };

  // === ANNOUNCEMENTS ===
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) return;
    const payload = {
      title: announcementForm.title.trim(),
      body: announcementForm.body.trim(),
      audience: announcementForm.audience,
      posted_by: user.id,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([payload])
        .select()
        .single();
      if (!error && data) {
        setAnnouncements((prev) => [data as Announcement, ...prev]);
      }
    } else {
      setAnnouncements((prev) => [
        { id: `ann-${Date.now()}`, created_at: new Date().toISOString(), ...payload },
        ...prev,
      ]);
    }
    setAnnouncementForm({ title: '', body: '', audience: 'all' });
    showToast(isAm ? 'ማስታወቂያው ተለጥፏል።' : 'Announcement published.');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('announcements').delete().eq('id', id);
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast(isAm ? 'ማስታወቂያው ተሰርዟል።' : 'Announcement deleted.');
  };

  // === PARENT FEEDBACK ===
  const handleRespondFeedback = async (item: ParentFeedback) => {
    if (!permissions.can_comment_feedback) {
      showToast(
        isAm
          ? 'በአይሲቲ መምሪያ የምላሽ ፍቃድ አልተሰጠዎትም።'
          : 'Your account does not have permission to respond to feedback.'
      );
      return;
    }

    const newStatus = statusDrafts[item.id] || 'resolved';
    const newResponse =
      responseDrafts[item.id] !== undefined ? responseDrafts[item.id] : item.response || '';

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('parent_feedback')
        .update({
          status: newStatus,
          response: newResponse,
          responded_by: user.id,
        })
        .eq('id', item.id);
    }

    const updated = feedbackList.map((fb) =>
      fb.id === item.id ? { ...fb, status: newStatus, response: newResponse } : fb
    );
    setFeedbackList(updated);
    const openCount = updated.filter((fb) => fb.status !== 'resolved').length;
    onPendingFeedbackCountChange?.(openCount);
    showToast(isAm ? 'ምላሽዎ ተልኳል።' : 'Feedback response saved.');
  };

  // === VERIFY OR REJECT PAYMENT RECEIPT ===
  const handleVerifyReceipt = async (receipt: PaymentReceipt) => {
    if (!permissions.can_verify_receipts) {
      showToast(
        isAm
          ? 'ደረሰኝ የማረጋገጥ ፍቃድ አልተሰጠዎትም።'
          : 'Your account does not have receipt verification permission.'
      );
      return;
    }
    if (receipt.status !== 'pending') return;

    const targetFee = fees.find((f) => f.id === receipt.fee_record_id);
    const updatedAmountPaid = targetFee
      ? Number(targetFee.amount_paid || 0) + Number(receipt.amount_paid || 0)
      : Number(receipt.amount_paid || 0);

    if (isSupabaseConfigured && supabase) {
      const { error: rcptErr } = await supabase
        .from('payment_receipts')
        .update({
          status: 'verified',
          verified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);

      if (rcptErr) {
        showToast(rcptErr.message);
        return;
      }

      if (targetFee) {
        await supabase
          .from('fee_records')
          .update({
            amount_paid: updatedAmountPaid,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetFee.id);
      }
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id
          ? { ...r, status: 'verified', verified_by: user.id }
          : r
      )
    );

    if (targetFee) {
      setFees((prev) =>
        prev.map((f) =>
          f.id === targetFee.id ? { ...f, amount_paid: updatedAmountPaid } : f
        )
      );
    }

    showToast(
      isAm
        ? `${receipt.provider} (${receipt.transaction_ref}) ደረሰኝ ተረጋግጧል! ሂሳቡ ተዘምኗል።`
        : `${receipt.provider} (${receipt.transaction_ref}) verified! Student balance updated.`
    );
  };

  const handleRejectReceipt = async (receipt: PaymentReceipt) => {
    if (!permissions.can_verify_receipts || receipt.status !== 'pending') return;
    const note =
      receiptRejectNotes[receipt.id]?.trim() ||
      (isAm ? 'የግብይት መለያ ቁጥሩ አልተገኘም' : 'Transaction reference could not be matched');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('payment_receipts')
        .update({
          status: 'rejected',
          review_note: note,
          verified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);

      if (error) {
        showToast(error.message);
        return;
      }
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id
          ? { ...r, status: 'rejected', review_note: note, verified_by: user.id }
          : r
      )
    );

    showToast(isAm ? 'ደረሰኙ ተመልሷል።' : 'Receipt marked as rejected.');
  };

  const teachingStaff = staff.filter((m) =>
    m.role_department.toLowerCase().includes('teacher')
  );

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#073c2f] px-4 py-3 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 size={16} className="text-[#e4b65e]" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 0: EXECUTIVE OVERVIEW */}
      {activeNavIndex === 0 && (
        <>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                {isAm ? 'ቅዳሜ፣ ህዳር 12 ቀን 2019 ዓ.ም' : 'Saturday, 21 November 2026'}
              </p>
              <h1>
                {t.goodMorning}, {user.name.split(' ')[0]}.
              </h1>
              <p className="subtle">{t.directorSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="secondary-button" onClick={() => onNavigate(6)}>
                <Receipt size={16} />{' '}
                {isAm
                  ? `ደረሰኝ ማረጋገጫ (${pendingReceiptsCount})`
                  : `Verify Receipts (${pendingReceiptsCount})`}
              </button>
              <button className="primary-button" onClick={() => onNavigate(4)}>
                <Bell size={16} /> {isAm ? 'ማስታወቂያ ይለጥፉ' : 'Post announcement'}
              </button>
            </div>
          </div>

          <div className="stat-grid">
            <StatCard
              label={t.totalStudents}
              value={String(activeStudentsCount)}
              detail={t.acrossGrades}
              icon={GraduationCap}
              accent="green"
              trend="+4.8%"
            />
            <StatCard
              label={t.activeTeachers}
              value={`${activeTeachersCount} / ${totalStaffCount}`}
              detail={isAm ? 'መምህራን / ጠቅላላ ሰራተኞች' : 'Teachers / Total active staff'}
              icon={Users}
              accent="gold"
            />
            <StatCard
              label={t.dailyAttendance}
              value={attendanceTodayRate}
              detail={isAm ? 'የዛሬ የተማሪዎች ተገኝነት' : 'Recorded student attendance'}
              icon={ClipboardCheck}
              accent="blue"
            />
            <StatCard
              label={t.feeCollection}
              value={`${totalFeeCollected.toLocaleString()} ETB`}
              detail={
                isAm
                  ? `ከጠቅላላ ${totalFeeDue.toLocaleString()} ETB`
                  : `Out of ${totalFeeDue.toLocaleString()} ETB billed`
              }
              icon={CircleDollarSign}
              accent="rose"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel performance-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{t.academicHealth}</p>
                  <h2>{t.performanceByGrade}</h2>
                </div>
                <select defaultValue="semester">
                  <option value="semester">{t.semester1Avg}</option>
                  <option>{t.semester2Avg}</option>
                </select>
              </div>
              <div className="bars">
                {[
                  ['KG–2', 78],
                  ['G3–5', 84],
                  ['G6–8', 76],
                  ['G9–10', 88],
                  ['G11–12', 81],
                ].map(([grade, score]) => (
                  <div className="bar-row" key={String(grade)}>
                    <span>{grade}</span>
                    <div className="bar-track">
                      <div style={{ width: `${score}%` }} />
                    </div>
                    <b>{score}%</b>
                  </div>
                ))}
              </div>
              <div className="panel-foot">
                <span>
                  <i className="legend-dot green-dot" /> {t.aboveTarget}
                </span>
                <span>{t.targetLabel}</span>
              </div>
            </section>

            <section className="panel alerts-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{t.needsAttention}</p>
                  <h2>{t.recentAlerts}</h2>
                </div>
                <button className="text-button" onClick={() => onNavigate(6)}>
                  {t.viewAll}
                </button>
              </div>
              <div className="alert-list">
                {pendingReceiptsCount > 0 && (
                  <div
                    className="alert-item cursor-pointer"
                    onClick={() => onNavigate(6)}
                  >
                    <span className="alert-avatar orange">ETB</span>
                    <div>
                      <b>
                        {isAm
                          ? `${pendingReceiptsCount} የክፍያ ደረሰኞች ማረጋገጫ ይጠብቃሉ`
                          : `${pendingReceiptsCount} payment receipt(s) awaiting verification`}
                      </b>
                      <p>Telebirr / CBE / Hijra / ZemZem / Rammis Bank</p>
                      <small>{isAm ? 'አሁን ይመልከቱ' : 'Review now'}</small>
                    </div>
                    <span className="alert-chevron">›</span>
                  </div>
                )}
                {feedbackList.slice(0, 2).map((fb) => (
                  <div
                    className="alert-item cursor-pointer"
                    key={fb.id}
                    onClick={() => onNavigate(5)}
                  >
                    <span
                      className={`alert-avatar ${
                        fb.status === 'resolved' ? 'green' : 'blue'
                      }`}
                    >
                      FB
                    </span>
                    <div>
                      <b>{fb.subject}</b>
                      <p className="line-clamp-1">{fb.body}</p>
                      <small>
                        {fb.category || 'General'} · {fb.status.replace('_', ' ')}
                      </small>
                    </div>
                    <span className="alert-chevron">›</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.directorySnapshot}</p>
                <h2>{t.recentlyEnrolled}</h2>
              </div>
              <button className="secondary-button small" onClick={() => onNavigate(1)}>
                {isAm ? 'ዝርዝር ይመልከቱ' : 'View directory'} <span>→</span>
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.studentId}</th>
                    <th>{t.studentName}</th>
                    <th>{t.classLabel}</th>
                    <th>{t.subCity}</th>
                    <th>{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map((student) => (
                    <tr key={student.id}>
                      <td className="muted-cell">{student.student_id}</td>
                      <td>
                        <span className="table-person">
                          <span className="mini-avatar">
                            {student.full_name
                              .split(' ')
                              .map((name) => name[0])
                              .join('')}
                          </span>
                          {student.full_name}
                        </span>
                      </td>
                      <td>
                        {student.grade} {student.section}
                      </td>
                      <td>{student.sub_city || 'Hawassa'}</td>
                      <td>
                        <span className="status active">{student.enrollment_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* TAB 1: STUDENT DIRECTORY (READ-ONLY FOR DIRECTOR; ENROLLMENT OWNED BY REGISTRAR) */}
      {activeNavIndex === 1 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {isAm ? 'የተማሪዎች መዝገብ (እይታ ብቻ)' : 'Student Directory (Executive Read-Only)'}
              </p>
              <h2>{isAm ? 'የተመዘገቡ ተማሪዎች ዝርዝር' : 'Enrolled Students Directory'}</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe4df] bg-[#f8fbf9] px-3 py-2 text-[11px] font-semibold text-[#547268]">
              <Lock size={13} className="text-[#aa7623]" />
              {isAm
                ? 'አዲስ ምዝገባ በሬጅስትራር ፖርታል ብቻ ይከናወናል'
                : 'Enrollment & edits managed by Registrar'}
            </span>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#d9e2dd] bg-[#fbfcfb] px-3 py-2 text-xs flex-1 min-w-[220px]">
              <Search size={15} className="text-[#749084]" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder={
                  isAm
                    ? 'በስም፣ በመለያ ቁጥር ወይም በወላጅ ስም ይፈልጉ...'
                    : 'Search by student name, ID, or guardian...'
                }
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs font-medium text-[#365247]"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="ALL">{isAm ? 'ሁሉም ክፍሎች' : 'All Grades'}</option>
              {GRADES_LIST.map((g) => (
                <option key={g} value={g}>
                  {isAm ? `ክፍል ${g}` : `Grade ${g}`}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs font-medium text-[#365247]"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="ALL">{isAm ? 'ሁሉም ሴክሽኖች' : 'All Sections'}</option>
              {SECTIONS_LIST.map((sec) => (
                <option key={sec} value={sec}>
                  {isAm ? `ሴክሽን ${sec}` : `Section ${sec}`}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.studentId}</th>
                  <th>{t.studentName}</th>
                  <th>{isAm ? 'ፆታ' : 'Gender'}</th>
                  <th>{t.classLabel}</th>
                  <th>{isAm ? 'ወላጅ / አሳዳጊ' : 'Guardian'}</th>
                  <th>{t.subCity}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stu) => (
                  <tr key={stu.id}>
                    <td className="muted-cell font-mono">{stu.student_id}</td>
                    <td>
                      <span className="table-person">{stu.full_name}</span>
                    </td>
                    <td>{stu.gender || '—'}</td>
                    <td>
                      {stu.grade} {stu.section}
                    </td>
                    <td>
                      <div>{stu.guardian_name || '—'}</div>
                      <small className="text-[#8a9992]">{stu.guardian_phone}</small>
                    </td>
                    <td>{stu.sub_city || '—'}</td>
                    <td>
                      <span className="status active">{stu.enrollment_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: STAFF DIRECTORY (READ-ONLY FOR DIRECTOR; HR CRUD OWNED BY REGISTRAR) */}
      {activeNavIndex === 2 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {isAm ? 'የሰራተኞች ማውጫ (እይታ ብቻ)' : 'Staff Directory (Executive Read-Only)'}
              </p>
              <h2>{isAm ? 'መምህራን እና ሰራተኞች' : 'Teachers & Employees Directory'}</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe4df] bg-[#f8fbf9] px-3 py-2 text-[11px] font-semibold text-[#547268]">
              <Lock size={13} className="text-[#aa7623]" />
              {isAm
                ? 'ቅጥር እና HR በሬጅስትራር እና HR ፖርታል ይከናወናል'
                : 'Hiring & HR managed by Registrar & HR'}
            </span>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#d9e2dd] bg-[#fbfcfb] px-3 py-2 text-xs flex-1 min-w-[220px]">
              <Search size={15} className="text-[#749084]" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder={
                  isAm
                    ? 'በስም፣ በመለያ ቁጥር ወይም በስራ ክፍል ይፈልጉ...'
                    : 'Search by name, employee ID, or department...'
                }
                value={staffQuery}
                onChange={(e) => setStaffQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs font-medium text-[#365247]"
              value={staffStatusFilter}
              onChange={(e) => setStaffStatusFilter(e.target.value)}
            >
              <option value="ALL">{isAm ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
              <option value="active">{isAm ? 'ንቁ (Active)' : 'Active'}</option>
              <option value="on_leave">{isAm ? 'በፈቃድ ላይ (On Leave)' : 'On Leave'}</option>
              <option value="terminated">{isAm ? 'የለቀቀ (Terminated)' : 'Terminated'}</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isAm ? 'መለያ' : 'Emp ID'}</th>
                  <th>{isAm ? 'ሙሉ ስም' : 'Full Name'}</th>
                  <th>{isAm ? 'የስራ ድርሻ' : 'Role / Department'}</th>
                  <th>{isAm ? 'የተመደበበት ክፍል' : 'Assigned Grades/Subjects'}</th>
                  <th>{isAm ? 'የትምህርት ደረጃ' : 'Qualification'}</th>
                  <th>{isAm ? 'ወርሃዊ ደመወዝ' : 'Salary (ETB)'}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td className="muted-cell font-mono">{member.employee_id}</td>
                    <td>
                      <div className="table-person">{member.full_name}</div>
                      <small className="text-[#8a9992]">{member.phone}</small>
                    </td>
                    <td>{member.role_department}</td>
                    <td>{member.assigned_grades_subjects || '—'}</td>
                    <td>{member.qualification || '—'}</td>
                    <td className="font-semibold text-[#19362b]">
                      {Number(member.monthly_salary).toLocaleString()} ETB
                    </td>
                    <td>
                      <span className="status active">{member.employment_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: CLASSES & SUBJECTS */}
      {activeNavIndex === 3 && (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <section className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'አዲስ ትምህርት' : 'Curriculum Setup'}</p>
                <h2>{isAm ? 'የትምህርት ዓይነት ጨምር' : 'Add Subject'}</h2>
              </div>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'የትምህርት ስም' : 'Subject Name'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                  placeholder="e.g. Physics"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ኮድ' : 'Subject Code'}
                  <input
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                    placeholder="PHY09"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    required
                  />
                </label>
                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ክፍል' : 'Grade'}
                  <select
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                    value={subjectForm.grade}
                    onChange={(e) => setSubjectForm({ ...subjectForm, grade: e.target.value })}
                  >
                    {GRADES_LIST.map((g) => (
                      <option key={g} value={g}>
                        {isAm ? `ክፍል ${g}` : `Grade ${g}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'መምህር ይመድቡ' : 'Assign Teacher'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                  value={subjectForm.teacher_id}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}
                >
                  <option value="">{isAm ? '-- ያልተመደበ --' : '-- Unassigned --'}</option>
                  {teachingStaff.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.role_department})
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="primary-button w-full">
                <Plus size={15} /> {isAm ? 'ትምህርቱን መዝግብ' : 'Save Subject'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የመምህራን ምደባ' : 'Teacher Allocation'}</p>
                <h2>{isAm ? 'ክፍሎች እና የትምህርት ዓይነቶች' : 'Subjects & Assigned Teachers'}</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{isAm ? 'ኮድ' : 'Code'}</th>
                    <th>{isAm ? 'የትምህርት ዓይነት' : 'Subject'}</th>
                    <th>{isAm ? 'ክፍል' : 'Grade'}</th>
                    <th>{isAm ? 'የተመደበ መምህር' : 'Assigned Teacher'}</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id}>
                      <td className="muted-cell font-mono">{sub.code}</td>
                      <td className="font-semibold text-[#19362b]">{sub.name}</td>
                      <td>{isAm ? `ክፍል ${sub.grade}` : `Grade ${sub.grade}`}</td>
                      <td>
                        <select
                          className="rounded-lg border border-[#d9e2dd] bg-white px-2.5 py-1.5 text-xs text-[#234037]"
                          value={sub.teacher_id || ''}
                          onChange={(e) => handleAssignTeacherToSubject(sub.id, e.target.value)}
                        >
                          <option value="">{isAm ? 'ያልተመደበ' : 'Unassigned'}</option>
                          {teachingStaff.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeNavIndex === 4 && (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'መልዕክት ማስተላለፊያ' : 'School Broadcast'}</p>
                <h2>{isAm ? 'አዲስ ማስታወቂያ ይለጥፉ' : 'Publish Announcement'}</h2>
              </div>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ርዕስ' : 'Announcement Title'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                  placeholder={isAm ? 'ለምሳሌ፡ የወላጆች ስብሰባ' : 'e.g. Parent-Teacher Conference'}
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, title: e.target.value })
                  }
                  required
                />
              </label>
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ተመልካቾች' : 'Target Audience'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                  value={announcementForm.audience}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      audience: e.target.value as Announcement['audience'],
                    })
                  }
                >
                  <option value="all">{isAm ? 'ለሁሉም (ወላጆች እና ሰራተኞች)' : 'All (Parents & Staff)'}</option>
                  <option value="parents">{isAm ? 'ለወላጆች ብቻ' : 'Parents Only'}</option>
                  <option value="staff">{isAm ? 'ለሰራተኞች ብቻ' : 'Staff Only'}</option>
                </select>
              </label>
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ዝርዝር መልዕክት' : 'Message Details'}
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] p-3 outline-none focus:border-[#157052]"
                  placeholder={
                    isAm ? 'የማስታወቂያውን ዝርዝር እዚህ ይጻፉ...' : 'Write your announcement message...'
                  }
                  value={announcementForm.body}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, body: e.target.value })
                  }
                  required
                />
              </label>
              <button type="submit" className="primary-button w-full">
                <Send size={15} /> {isAm ? 'ማስታወቂያውን ልቀቅ' : 'Broadcast Notice'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የተለጠፉ ማስታወቂያዎች' : 'Notice Board'}</p>
                <h2>{isAm ? 'ንቁ የትምህርት ቤት ማስታወቂያዎች' : 'Active School Announcements'}</h2>
              </div>
            </div>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm text-[#19362b]">{ann.title}</b>
                      <span className="rounded bg-[#e3f1e9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#277453]">
                        {ann.audience}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#587066]">{ann.body}</p>
                    <small className="mt-2 block text-[10px] text-[#9aa8a2]">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="rounded p-1.5 text-[#b34a3c] hover:bg-[#fae9e5]"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: PARENT FEEDBACK REVIEW */}
      {activeNavIndex === 5 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'የቤተሰብ ግንኙነት' : 'Family Engagement'}</p>
              <h2>{isAm ? 'የወላጆች አስተያየት እና ጥያቄዎች' : 'Parent Feedback & Inquiries'}</h2>
            </div>
            <select
              value={feedbackStatusFilter}
              onChange={(e) => setFeedbackStatusFilter(e.target.value)}
            >
              <option value="ALL">{isAm ? 'ሁሉም ሁኔታዎች' : 'All Feedback'}</option>
              <option value="submitted">{isAm ? 'አዲስ የቀረበ (Submitted)' : 'Submitted'}</option>
              <option value="under_review">{isAm ? 'በመታየት ላይ (Under Review)' : 'Under Review'}</option>
              <option value="resolved">{isAm ? 'ምላሽ የተሰጠው (Resolved)' : 'Resolved'}</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredFeedback.map((fb) => {
              const draftText =
                responseDrafts[fb.id] !== undefined ? responseDrafts[fb.id] : fb.response || '';
              const draftStatus = statusDrafts[fb.id] || fb.status;

              return (
                <div
                  key={fb.id}
                  className="rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="rounded bg-[#fbf0d9] px-2 py-0.5 text-[10px] font-bold text-[#aa7623] mr-2">
                        {fb.category || 'General'}
                      </span>
                      <b className="text-sm text-[#19362b]">{fb.subject}</b>
                    </div>
                    <span
                      className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase ${
                        fb.status === 'resolved'
                          ? 'bg-[#e9f5ed] text-[#3b805d]'
                          : 'bg-[#faead0] text-[#a9691f]'
                      }`}
                    >
                      {fb.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#415b50]">{fb.body}</p>

                  {permissions.can_comment_feedback && (
                    <div className="grid gap-2 pt-2 border-t border-[#e8efeb] sm:grid-cols-[1fr_160px_auto]">
                      <input
                        className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs outline-none focus:border-[#157052]"
                        placeholder={
                          isAm
                            ? 'የትምህርት ቤቱን ምላሽ እዚህ ይጻፉ...'
                            : 'Write official management response...'
                        }
                        value={draftText}
                        onChange={(e) =>
                          setResponseDrafts({ ...responseDrafts, [fb.id]: e.target.value })
                        }
                      />
                      <select
                        className="rounded-lg border border-[#d9e2dd] bg-white px-2.5 py-2 text-xs"
                        value={draftStatus}
                        onChange={(e) =>
                          setStatusDrafts({
                            ...statusDrafts,
                            [fb.id]: e.target.value as ParentFeedback['status'],
                          })
                        }
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button
                        type="button"
                        className="primary-button !h-9"
                        onClick={() => handleRespondFeedback(fb)}
                      >
                        <MessageSquare size={14} /> {isAm ? 'ምላሽ ላክ' : 'Save Reply'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 6: FEES & DIGITAL RECEIPT VERIFICATION */}
      {activeNavIndex === 6 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                Telebirr · CBE · Hijra Bank · ZemZem Bank · Rammis Bank
              </p>
              <h2>
                {isAm
                  ? 'የክፍያ ደረሰኞች ማረጋገጫ'
                  : 'Bank & Telebirr Receipt Verification'}
              </h2>
            </div>
            <select
              value={receiptStatusFilter}
              onChange={(e) => setReceiptStatusFilter(e.target.value)}
            >
              <option value="ALL">{isAm ? 'ሁሉም ደረሰኞች' : 'All Receipts'}</option>
              <option value="pending">{isAm ? 'ማረጋገጫ የሚጠብቁ (Pending)' : 'Pending Review'}</option>
              <option value="verified">{isAm ? 'የተረጋገጡ (Verified)' : 'Verified'}</option>
              <option value="rejected">{isAm ? 'የተመለሱ (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isAm ? 'ተማሪ' : 'Student'}</th>
                  <th>{isAm ? 'የክፍያ ዓይነት' : 'Fee Item'}</th>
                  <th>{isAm ? 'ባንክ / ቴሌብር' : 'Provider'}</th>
                  <th>{isAm ? 'የግብይት መለያ' : 'Transaction Ref'}</th>
                  <th>{isAm ? 'መጠን (ETB)' : 'Amount'}</th>
                  <th>{isAm ? 'ደረሰኝ ምስል' : 'Proof'}</th>
                  <th>{isAm ? 'ሁኔታ / ማረጋገጫ' : 'Verification Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((rcpt) => {
                  const stu = students.find((s) => s.id === rcpt.student_id);
                  const fee = fees.find((f) => f.id === rcpt.fee_record_id);
                  return (
                    <tr key={rcpt.id}>
                      <td>
                        <div className="font-semibold text-[#19362b]">
                          {stu?.full_name || 'Student'}
                        </div>
                        <small className="text-[#8a9992]">
                          {stu ? `${stu.student_id} · Grade ${stu.grade} ${stu.section}` : ''}
                        </small>
                      </td>
                      <td>{fee?.description || 'Tuition Fee'}</td>
                      <td>
                        <span className="rounded bg-[#e4f0f5] px-2 py-0.5 text-[10px] font-bold text-[#397b98]">
                          {rcpt.provider}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-[#19362b]">
                        {rcpt.transaction_ref}
                      </td>
                      <td className="font-bold text-[#073c2f]">
                        {Number(rcpt.amount_paid).toLocaleString()} ETB
                      </td>
                      <td>
                        {rcpt.receipt_image_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptImage(rcpt.receipt_image_url)}
                            className="inline-flex items-center gap-1 rounded bg-[#f4f7f5] px-2.5 py-1 text-[11px] font-semibold text-[#0b6248] hover:bg-[#e3f1e9]"
                          >
                            <ImageIcon size={13} /> {isAm ? 'ደረሰኝ እይ' : 'View Image'}
                          </button>
                        ) : (
                          <span className="muted-cell">
                            {isAm ? 'ምስል የለም' : 'No image'}
                          </span>
                        )}
                      </td>
                      <td>
                        {rcpt.status === 'pending' && permissions.can_verify_receipts ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleVerifyReceipt(rcpt)}
                              className="inline-flex items-center gap-1 rounded bg-[#0b6248] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#084f3a]"
                            >
                              <CheckCircle2 size={12} /> {isAm ? 'አረጋግጥ' : 'Verify'}
                            </button>
                            <input
                              className="w-32 rounded border border-[#d9e2dd] px-2 py-1 text-[11px]"
                              placeholder={isAm ? 'የመመለሻ ምክንያት...' : 'Reject note...'}
                              value={receiptRejectNotes[rcpt.id] || ''}
                              onChange={(e) =>
                                setReceiptRejectNotes({
                                  ...receiptRejectNotes,
                                  [rcpt.id]: e.target.value,
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => handleRejectReceipt(rcpt)}
                              className="inline-flex items-center gap-1 rounded bg-[#fae9e5] px-2.5 py-1 text-[11px] font-bold text-[#b34a3c] hover:bg-[#f6d6cf]"
                            >
                              <XCircle size={12} /> {isAm ? 'መልስ' : 'Reject'}
                            </button>
                          </div>
                        ) : rcpt.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[#e9f5ed] px-2.5 py-0.5 text-[10px] font-bold text-[#3b805d]">
                            <CheckCircle2 size={11} /> {isAm ? 'ተረጋግጧል' : 'Verified'}
                          </span>
                        ) : rcpt.status === 'rejected' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded bg-[#fae9e5] px-2.5 py-0.5 text-[10px] font-bold text-[#b34a3c]">
                              <Clock size={11} /> {isAm ? 'ተመልሷል' : 'Rejected'}
                            </span>
                            {rcpt.review_note && (
                              <small className="block text-[10px] text-[#b34a3c]">
                                {rcpt.review_note}
                              </small>
                            )}
                          </div>
                        ) : (
                          <span className="muted-cell">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* RECEIPT IMAGE PREVIEW MODAL */}
      {previewReceiptImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewReceiptImage(null)}
        >
          <div
            className="relative max-w-xl w-full rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <b className="text-xs text-[#19362b]">
                {isAm ? 'የወላጅ የክፍያ ደረሰኝ' : 'Submitted Payment Receipt'}
              </b>
              <button
                type="button"
                onClick={() => setPreviewReceiptImage(null)}
                className="rounded p-1 text-[#587066] hover:bg-[#f4f7f5]"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={previewReceiptImage}
              alt="Payment receipt"
              className="max-h-[75vh] w-full rounded-lg object-contain border border-[#e4ebe7]"
            />
          </div>
        </div>
      )}
    </div>
  );
}