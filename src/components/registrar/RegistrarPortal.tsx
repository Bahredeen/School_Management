import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Edit3,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  getDefaultPermissionsForRole,
  isSupabaseConfigured,
  supabase,
  type AccountPermissions,
  type FeeRecord,
  type GradeRecord,
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
];

const GRADES_LIST = ['KG-1', 'KG-2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS_LIST = ['A', 'B', 'C', 'D'];
const HAWASSA_SUBCITIES = [
  'Tabor',
  'Menehariya',
  'Misrak',
  'Hayk Dar',
  'Bahil Adarash',
  'Addis Ketema',
  'Mehal Ketema',
  'Tula',
];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${accent}`}>
          <Icon size={18} />
        </span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function RegistrarPortal({
  user,
  activeNavIndex,
  language,
  onNavigate,
}: {
  user: PortalUser;
  activeNavIndex: number;
  language: Language;
  onNavigate: (index: number) => void;
}) {
  const t = translations[language].dashboard;
  const isAm = language === 'am';

  const [permissions, setPermissions] = useState<AccountPermissions>(() =>
    getDefaultPermissionsForRole(user.id, user.role)
  );
  const [students, setStudents] = useState<Student[]>(fallbackStudents);
  const [staff, setStaff] = useState<StaffMember[]>(fallbackStaff);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [toast, setToast] = useState('');

  // Filters
  const [studentQuery, setStudentQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [archiveFilter, setArchiveFilter] = useState('ALL');
  const [staffQuery, setStaffQuery] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('ALL');
  const [receiptRejectNotes, setReceiptRejectNotes] = useState<Record<string, string>>({});
  const [previewReceiptImage, setPreviewReceiptImage] = useState<string | null>(null);

  // Official Student Record / Transcript Certificate Modal
  const [recordStudent, setRecordStudent] = useState<Student | null>(null);

  // Student Modal State
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    student_id: '',
    full_name: '',
    gender: 'F' as 'M' | 'F',
    grade: '9',
    section: 'A',
    guardian_name: '',
    guardian_phone: '+2519',
    sub_city: 'Tabor',
    emergency_contact: '+2519',
    enrollment_status: 'active' as Student['enrollment_status'],
  });

  // Staff Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    employee_id: '',
    full_name: '',
    phone: '+2519',
    role_department: 'Teacher — Mathematics',
    assigned_grades_subjects: '',
    qualification: '',
    employment_status: 'active' as StaffMember['employment_status'],
    monthly_salary: 18000,
  });

  // New Fee Invoice Form
  const [feeForm, setFeeForm] = useState({
    student_id: '',
    description: 'Semester 1 Tuition',
    amount_due: 12000,
    amount_paid: 0,
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3400);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadRegistrarData = async () => {
      const [
        permRes,
        studentsRes,
        staffRes,
        feesRes,
        receiptsRes,
        gradesRes,
        subjectsRes,
      ] = await Promise.all([
        supabase
          .from('account_permissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('students').select('*').order('student_id', { ascending: true }),
        supabase.from('staff').select('*').order('employee_id', { ascending: true }),
        supabase.from('fee_records').select('*').order('created_at', { ascending: false }),
        supabase
          .from('payment_receipts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('grades').select('*'),
        supabase.from('subjects').select('*'),
      ]);

      if (permRes.data) setPermissions(permRes.data as AccountPermissions);
      if (studentsRes.data && studentsRes.data.length > 0) {
        const loaded = studentsRes.data as Student[];
        setStudents(loaded);
        setFeeForm((prev) => ({ ...prev, student_id: loaded[0].id }));
      }
      if (staffRes.data && staffRes.data.length > 0) setStaff(staffRes.data as StaffMember[]);
      if (feesRes.data) setFees(feesRes.data as FeeRecord[]);
      if (receiptsRes.data) setReceipts(receiptsRes.data as PaymentReceipt[]);
      if (gradesRes.data) setGrades(gradesRes.data as GradeRecord[]);
      if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
    };

    loadRegistrarData();
  }, [user.id]);

  const canCreateEditStudents =
    permissions.students_access === 'create_edit' ||
    permissions.students_access === 'full_crud';
  const canDeleteStudents = permissions.students_access === 'full_crud';

  const canCreateEditStaff =
    permissions.staff_access === 'create_edit' ||
    permissions.staff_access === 'full_crud';
  const canDeleteStaff = permissions.staff_access === 'full_crud';

  const canCreateEditFinance =
    permissions.finance_access === 'create_edit' ||
    permissions.finance_access === 'full_crud';

  // Active vs Archived Students
  const activeStudents = useMemo(
    () => students.filter((s) => s.enrollment_status === 'active'),
    [students]
  );

  const archivedStudents = useMemo(
    () => students.filter((s) => s.enrollment_status !== 'active'),
    [students]
  );

  const filteredActiveStudents = useMemo(() => {
    return activeStudents.filter((s) => {
      const matchesQuery =
        s.full_name.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.student_id.toLowerCase().includes(studentQuery.toLowerCase()) ||
        (s.guardian_name || '').toLowerCase().includes(studentQuery.toLowerCase());
      const matchesGrade = gradeFilter === 'ALL' || s.grade === gradeFilter;
      const matchesSection = sectionFilter === 'ALL' || s.section === sectionFilter;
      return matchesQuery && matchesGrade && matchesSection;
    });
  }, [activeStudents, studentQuery, gradeFilter, sectionFilter]);

  const filteredArchivedStudents = useMemo(() => {
    return archivedStudents.filter((s) => {
      const matchesStatus = archiveFilter === 'ALL' || s.enrollment_status === archiveFilter;
      const matchesQuery =
        s.full_name.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.student_id.toLowerCase().includes(studentQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [archivedStudents, archiveFilter, studentQuery]);

  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      const matchesQuery =
        m.full_name.toLowerCase().includes(staffQuery.toLowerCase()) ||
        m.employee_id.toLowerCase().includes(staffQuery.toLowerCase()) ||
        m.role_department.toLowerCase().includes(staffQuery.toLowerCase());
      const matchesStatus =
        staffStatusFilter === 'ALL' || m.employment_status === staffStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [staff, staffQuery, staffStatusFilter]);

  const filteredReceipts = useMemo(
    () =>
      receipts.filter(
        (r) => receiptStatusFilter === 'ALL' || r.status === receiptStatusFilter
      ),
    [receipts, receiptStatusFilter]
  );

  // Metrics
  const monthlyPayrollTotal = useMemo(
    () =>
      staff
        .filter((m) => m.employment_status === 'active')
        .reduce((acc, m) => acc + Number(m.monthly_salary || 0), 0),
    [staff]
  );

  const totalFeesCollected = useMemo(
    () => fees.reduce((acc, f) => acc + Number(f.amount_paid || 0), 0),
    [fees]
  );

  const pendingReceiptsCount = useMemo(
    () => receipts.filter((r) => r.status === 'pending').length,
    [receipts]
  );

  // === STUDENT ENROLLMENT & ARCHIVE CRUD ===
  const openAddStudentModal = () => {
    if (!canCreateEditStudents) return;
    setEditingStudent(null);
    const nextNum = String(students.length + 101).padStart(4, '0');
    setStudentForm({
      student_id: `SA-2026-${nextNum}`,
      full_name: '',
      gender: 'F',
      grade: '9',
      section: 'A',
      guardian_name: '',
      guardian_phone: '+2519',
      sub_city: 'Tabor',
      emergency_contact: '+2519',
      enrollment_status: 'active',
    });
    setStudentModalOpen(true);
  };

  const openEditStudentModal = (student: Student) => {
    if (!canCreateEditStudents) return;
    setEditingStudent(student);
    setStudentForm({
      student_id: student.student_id,
      full_name: student.full_name,
      gender: student.gender || 'F',
      grade: student.grade,
      section: student.section,
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '+2519',
      sub_city: student.sub_city || 'Tabor',
      emergency_contact: student.emergency_contact || '+2519',
      enrollment_status: student.enrollment_status,
    });
    setStudentModalOpen(true);
  };

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.full_name.trim() || !studentForm.student_id.trim()) return;

    if (editingStudent) {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('students')
          .update(studentForm)
          .eq('id', editingStudent.id)
          .select()
          .single();
        if (error) {
          showToast(error.message);
          return;
        }
        if (data) {
          setStudents((prev) =>
            prev.map((s) => (s.id === editingStudent.id ? (data as Student) : s))
          );
        }
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? { ...s, ...studentForm } : s))
        );
      }
      showToast(isAm ? 'የተማሪ መረጃ ተዘምኗል።' : 'Student record updated.');
    } else {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('students')
          .insert([studentForm])
          .select()
          .single();
        if (error) {
          showToast(error.message);
          return;
        }
        if (data) {
          setStudents((prev) => [...prev, data as Student]);
        }
      } else {
        setStudents((prev) => [
          ...prev,
          { id: `local-stu-${Date.now()}`, ...studentForm },
        ]);
      }
      showToast(isAm ? 'አዲስ ተማሪ ተመዝግቧል።' : 'New student enrolled successfully.');
    }
    setStudentModalOpen(false);
  };

  const handleArchiveOrRestoreStudent = async (
    student: Student,
    newStatus: Student['enrollment_status']
  ) => {
    if (!canCreateEditStudents) return;
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('students')
        .update({ enrollment_status: newStatus })
        .eq('id', student.id);
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, enrollment_status: newStatus } : s))
    );
    showToast(
      newStatus === 'active'
        ? isAm
          ? `${student.full_name} ወደ ንቁ ተማሪዎች ተመልሷል።`
          : `${student.full_name} restored to active enrollment.`
        : isAm
        ? `${student.full_name} ወደ ማህደር (${newStatus}) ተዛውሯል።`
        : `${student.full_name} archived as ${newStatus}.`
    );
  };

  const deleteStudent = async (id: string) => {
    if (!canDeleteStudents) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('students').delete().eq('id', id);
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showToast(isAm ? 'የተማሪ መዝገብ ተሰርዟል።' : 'Student record deleted.');
  };

  // === HR & STAFF CRUD ===
  const openAddStaffModal = () => {
    if (!canCreateEditStaff) return;
    setEditingStaff(null);
    const nextNum = String(staff.length + 1).padStart(3, '0');
    setStaffForm({
      employee_id: `SA-EMP-${nextNum}`,
      full_name: '',
      phone: '+2519',
      role_department: 'Teacher — Mathematics',
      assigned_grades_subjects: '',
      qualification: '',
      employment_status: 'active',
      monthly_salary: 18000,
    });
    setStaffModalOpen(true);
  };

  const openEditStaffModal = (member: StaffMember) => {
    if (!canCreateEditStaff) return;
    setEditingStaff(member);
    setStaffForm({
      employee_id: member.employee_id,
      full_name: member.full_name,
      phone: member.phone || '+2519',
      role_department: member.role_department,
      assigned_grades_subjects: member.assigned_grades_subjects || '',
      qualification: member.qualification || '',
      employment_status: member.employment_status,
      monthly_salary: Number(member.monthly_salary) || 0,
    });
    setStaffModalOpen(true);
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.full_name.trim() || !staffForm.employee_id.trim()) return;

    if (editingStaff) {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('staff')
          .update(staffForm)
          .eq('id', editingStaff.id)
          .select()
          .single();
        if (error) {
          showToast(error.message);
          return;
        }
        if (data) {
          setStaff((prev) =>
            prev.map((m) => (m.id === editingStaff.id ? (data as StaffMember) : m))
          );
        }
      } else {
        setStaff((prev) =>
          prev.map((m) => (m.id === editingStaff.id ? { ...m, ...staffForm } : m))
        );
      }
      showToast(isAm ? 'የሰራተኛ መረጃ ተዘምኗል።' : 'HR staff record updated.');
    } else {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('staff')
          .insert([staffForm])
          .select()
          .single();
        if (error) {
          showToast(error.message);
          return;
        }
        if (data) {
          setStaff((prev) => [...prev, data as StaffMember]);
        }
      } else {
        setStaff((prev) => [
          ...prev,
          { id: `local-staff-${Date.now()}`, user_id: null, ...staffForm },
        ]);
      }
      showToast(isAm ? 'አዲስ ሰራተኛ ተቀጥሯል።' : 'New employee added to HR & Payroll.');
    }
    setStaffModalOpen(false);
  };

  const deleteStaff = async (id: string) => {
    if (!canDeleteStaff) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('staff').delete().eq('id', id);
    }
    setStaff((prev) => prev.filter((m) => m.id !== id));
    showToast(isAm ? 'የሰራተኛ መዝገብ ተሰርዟል።' : 'Staff record removed.');
  };

  // === FINANCE: CREATE FEE INVOICE & VERIFY RECEIPTS ===
  const handleCreateFeeInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateEditFinance || !feeForm.student_id || !feeForm.description.trim()) return;

    const payload = {
      student_id: feeForm.student_id,
      description: feeForm.description.trim(),
      amount_due: Number(feeForm.amount_due),
      amount_paid: Number(feeForm.amount_paid),
      due_date: feeForm.due_date || null,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('fee_records')
        .insert([payload])
        .select()
        .single();
      if (error) {
        showToast(error.message);
        return;
      }
      if (data) {
        setFees((prev) => [data as FeeRecord, ...prev]);
      }
    } else {
      setFees((prev) => [{ id: `fee-${Date.now()}`, ...payload }, ...prev]);
    }
    showToast(isAm ? 'አዲስ የክፍያ መጠየቂያ ተፈጥሯል።' : 'Student fee invoice created.');
  };

  const handleVerifyReceipt = async (receipt: PaymentReceipt) => {
    if (!permissions.can_verify_receipts || receipt.status !== 'pending') return;

    const targetFee = fees.find((f) => f.id === receipt.fee_record_id);
    const updatedAmountPaid = targetFee
      ? Number(targetFee.amount_paid || 0) + Number(receipt.amount_paid || 0)
      : Number(receipt.amount_paid || 0);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('payment_receipts')
        .update({
          status: 'verified',
          verified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);

      if (error) {
        showToast(error.message);
        return;
      }

      if (targetFee) {
        await supabase
          .from('fee_records')
          .update({ amount_paid: updatedAmountPaid })
          .eq('id', targetFee.id);
      }
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id ? { ...r, status: 'verified', verified_by: user.id } : r
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
        ? `${receipt.provider} (${receipt.transaction_ref}) ደረሰኝ ተረጋግጧል።`
        : `${receipt.provider} receipt verified and credited.`
    );
  };

  const handleRejectReceipt = async (receipt: PaymentReceipt) => {
    if (!permissions.can_verify_receipts || receipt.status !== 'pending') return;
    const note =
      receiptRejectNotes[receipt.id]?.trim() ||
      (isAm ? 'የግብይት መለያ ቁጥሩ አልተገኘም' : 'Transaction reference not matched');

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('payment_receipts')
        .update({
          status: 'rejected',
          review_note: note,
          verified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id
          ? { ...r, status: 'rejected', review_note: note, verified_by: user.id }
          : r
      )
    );
    showToast(isAm ? 'ደረሰኙ ተመልሷል።' : 'Payment receipt rejected.');
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#073c2f] px-4 py-3 text-xs font-semibold text-white shadow-lg no-print">
          <CheckCircle2 size={16} className="text-[#e4b65e]" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 0: REGISTRAR, FINANCE & HR OVERVIEW */}
      {activeNavIndex === 0 && (
        <>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                {isAm ? 'ሬጅስትራር፣ ፋይናንስ እና የሰው ኃይል' : 'Registrar, Finance & HR Office'}
              </p>
              <h1>
                {t.goodMorning}, {user.name.split(' ')[0]}.
              </h1>
              <p className="subtle">
                {isAm
                  ? 'የተማሪዎችን ምዝገባ፣ ማህደር፣ የትምህርት ቤት ክፍያ እና የሰራተኞች ደመወዝ ያስተዳድሩ።'
                  : 'Manage student enrollment, academic archives, tuition billing, and staff HR payroll.'}
              </p>
            </div>
            {canCreateEditStudents && (
              <button className="primary-button" onClick={openAddStudentModal}>
                <UserPlus size={16} /> {isAm ? 'አዲስ ተማሪ መዝግብ' : 'Enroll New Student'}
              </button>
            )}
          </div>

          <div className="stat-grid">
            <StatCard
              label={isAm ? 'ንቁ ተማሪዎች' : 'Active Enrolled Students'}
              value={String(activeStudents.length)}
              detail={
                isAm
                  ? `${archivedStudents.length} በማህደር (Archive) ያሉ`
                  : `${archivedStudents.length} in archive`
              }
              icon={GraduationCap}
              accent="green"
            />
            <StatCard
              label={isAm ? 'የተሰበሰበ ክፍያ (ETB)' : 'Total Fees Collected'}
              value={`${totalFeesCollected.toLocaleString()} ETB`}
              detail={
                isAm
                  ? `${pendingReceiptsCount} ደረሰኞች ማረጋገጫ ይጠብቃሉ`
                  : `${pendingReceiptsCount} pending receipts`
              }
              icon={CircleDollarSign}
              accent="gold"
            />
            <StatCard
              label={isAm ? 'ጠቅላላ ሰራተኞች' : 'Active Staff & Faculty'}
              value={String(staff.filter((m) => m.employment_status === 'active').length)}
              detail={isAm ? 'መምህራን እና ድጋፍ ሰጪ ሰራተኞች' : 'Teaching & support staff'}
              icon={Users}
              accent="blue"
            />
            <StatCard
              label={isAm ? 'ወርሃዊ የደመወዝ ወጪ' : 'Monthly Payroll (ETB)'}
              value={`${monthlyPayrollTotal.toLocaleString()} ETB`}
              detail={isAm ? 'የንቁ ሰራተኞች ጠቅላላ ደመወዝ' : 'Active staff monthly total'}
              icon={FileText}
              accent="rose"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="panel flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#19362b]">
                  {isAm ? 'የተማሪዎች ምዝገባ' : 'Student Enrollment'}
                </h3>
                <p className="mt-1 text-xs text-[#71847b]">
                  {isAm
                    ? 'አዲስ ተማሪዎችን ይመዝግቡ፣ ክፍል ይመድቡ እና የወላጅ መረጃ ያስተካክሉ።'
                    : 'Register new students, assign sections, and update guardian records.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(1)}
                className="primary-button w-full"
              >
                {isAm ? 'ምዝገባ ክፈት' : 'Open Enrollment'}
              </button>
            </div>

            <div className="panel flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#19362b]">
                  {isAm ? 'ፋይናንስ እና ደረሰኝ ማረጋገጫ' : 'Finance & Receipt Verification'}
                </h3>
                <p className="mt-1 text-xs text-[#71847b]">
                  {isAm
                    ? 'የክፍያ ደረሰኞችን ያረጋግጡ እና ለተማሪዎች የክፍያ መጠየቂያ ያዘጋጁ።'
                    : 'Verify Telebirr/Bank receipts and issue student fee invoices.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(3)}
                className="secondary-button w-full"
              >
                {isAm ? 'ፋይናንስ ክፈት' : 'Open Finance & Billing'}
              </button>
            </div>

            <div className="panel flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#19362b]">
                  {isAm ? 'የሰው ኃይል (HR) እና ደመወዝ' : 'HR & Staff Payroll'}
                </h3>
                <p className="mt-1 text-xs text-[#71847b]">
                  {isAm
                    ? 'አዲስ መምህራንን እና ሰራተኞችን ይቅጠሩ፣ ፈቃድ እና ደመወዝ ያስተዳድሩ።'
                    : 'Hire new teachers/staff, manage employment status, and track payroll.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(4)}
                className="secondary-button w-full"
              >
                {isAm ? 'HR ክፈት' : 'Open HR & Payroll'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 1: STUDENT ENROLLMENT (FULL CRUD FOR REGISTRAR) */}
      {activeNavIndex === 1 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'የሬጅስትራር ጽ/ቤት' : 'Registrar Office'}</p>
              <h2>{isAm ? 'የተማሪዎች ምዝገባ እና መዝገብ' : 'Active Student Enrollment'}</h2>
            </div>
            {canCreateEditStudents && (
              <button className="primary-button" onClick={openAddStudentModal}>
                <Plus size={16} /> {isAm ? 'አዲስ ተማሪ መዝግብ' : 'Enroll New Student'}
              </button>
            )}
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
                  <th>{isAm ? 'ድርጊት' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveStudents.map((stu) => (
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
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRecordStudent(stu)}
                          className="rounded p-1.5 text-[#397b98] hover:bg-[#e4f0f5]"
                          title={isAm ? 'ኦፊሴላዊ መዝገብ' : 'Official Record'}
                        >
                          <FileText size={14} />
                        </button>
                        {canCreateEditStudents && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditStudentModal(stu)}
                              className="rounded p-1.5 text-[#23624d] hover:bg-[#e9f5ed]"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleArchiveOrRestoreStudent(stu, 'graduated')
                              }
                              className="rounded p-1.5 text-[#aa7623] hover:bg-[#fbf0d9]"
                              title={isAm ? 'ወደ ማህደር አስገባ' : 'Archive Student'}
                            >
                              <Archive size={14} />
                            </button>
                          </>
                        )}
                        {canDeleteStudents && (
                          <button
                            type="button"
                            onClick={() => deleteStudent(stu.id)}
                            className="rounded p-1.5 text-[#b34a3c] hover:bg-[#fae9e5]"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: ARCHIVE & OFFICIAL RECORDS */}
      {activeNavIndex === 2 && (
        <div className="space-y-5">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {isAm ? 'የተማሪዎች ማህደር እና ትራንስክሪፕት' : 'Historical Registry & Certificates'}
                </p>
                <h2>
                  {isAm
                    ? 'የተመረቁ፣ የተዛወሩ እና የለቀቁ ተማሪዎች ማህደር'
                    : 'Archived Student Records (Graduated / Transferred / Withdrawn)'}
                </h2>
              </div>
              <select
                value={archiveFilter}
                onChange={(e) => setArchiveFilter(e.target.value)}
              >
                <option value="ALL">{isAm ? 'ሁሉም ማህደሮች' : 'All Archived'}</option>
                <option value="graduated">{isAm ? 'የተመረቁ (Graduated)' : 'Graduated'}</option>
                <option value="transferred">
                  {isAm ? 'የተዛወሩ (Transferred)' : 'Transferred'}
                </option>
                <option value="withdrawn">{isAm ? 'የለቀቁ (Withdrawn)' : 'Withdrawn'}</option>
              </select>
            </div>

            {filteredArchivedStudents.length === 0 ? (
              <div className="empty-content">
                <p>
                  {isAm
                    ? 'በማህደር ውስጥ የተቀመጠ ተማሪ የለም።'
                    : 'No archived student records match the current filter.'}
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t.studentId}</th>
                      <th>{t.studentName}</th>
                      <th>{isAm ? 'የመጨረሻ ክፍል' : 'Last Grade'}</th>
                      <th>{isAm ? 'የማህደር ሁኔታ' : 'Archive Status'}</th>
                      <th>{isAm ? 'ድርጊት' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchivedStudents.map((stu) => (
                      <tr key={stu.id}>
                        <td className="muted-cell font-mono">{stu.student_id}</td>
                        <td className="font-semibold text-[#19362b]">{stu.full_name}</td>
                        <td>
                          {stu.grade} {stu.section}
                        </td>
                        <td>
                          <span className="rounded bg-[#fbf0d9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#aa7623]">
                            {stu.enrollment_status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRecordStudent(stu)}
                              className="inline-flex items-center gap-1 rounded bg-[#e4f0f5] px-2.5 py-1 text-[11px] font-semibold text-[#397b98]"
                            >
                              <Printer size={12} />{' '}
                              {isAm ? 'ትራንስክሪፕት' : 'Transcript'}
                            </button>
                            {canCreateEditStudents && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleArchiveOrRestoreStudent(stu, 'active')
                                }
                                className="inline-flex items-center gap-1 rounded bg-[#e9f5ed] px-2.5 py-1 text-[11px] font-semibold text-[#277453]"
                              >
                                <RotateCcw size={12} />{' '}
                                {isAm ? 'ወደ ንቁ መልስ' : 'Restore Active'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: FINANCE, BILLING & RECEIPT VERIFICATION */}
      {activeNavIndex === 3 && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            {canCreateEditFinance && (
              <section className="panel h-fit">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{isAm ? 'የክፍያ መጠየቂያ' : 'Student Billing'}</p>
                    <h2>{isAm ? 'አዲስ ክፍያ ፍጠር' : 'Create Fee Invoice'}</h2>
                  </div>
                </div>
                <form onSubmit={handleCreateFeeInvoice} className="space-y-3 text-xs">
                  <label className="block font-semibold text-[#3c5149]">
                    {isAm ? 'ተማሪ ይምረጡ' : 'Select Student'}
                    <select
                      className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                      value={feeForm.student_id}
                      onChange={(e) =>
                        setFeeForm({ ...feeForm, student_id: e.target.value })
                      }
                      required
                    >
                      <option value="">
                        {isAm ? '-- ተማሪ ይምረጡ --' : '-- Choose Student --'}
                      </option>
                      {activeStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.student_id} — {s.full_name} (Grade {s.grade})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block font-semibold text-[#3c5149]">
                    {isAm ? 'የክፍያ ዓይነት' : 'Fee Description'}
                    <input
                      className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5"
                      placeholder="e.g. Semester 2 Tuition"
                      value={feeForm.description}
                      onChange={(e) =>
                        setFeeForm({ ...feeForm, description: e.target.value })
                      }
                      required
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block font-semibold text-[#3c5149]">
                      {isAm ? 'ጠቅላላ ክፍያ (ETB)' : 'Amount Due (ETB)'}
                      <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                        value={feeForm.amount_due}
                        onChange={(e) =>
                          setFeeForm({ ...feeForm, amount_due: Number(e.target.value) })
                        }
                        required
                      />
                    </label>
                    <label className="block font-semibold text-[#3c5149]">
                      {isAm ? 'ቀድሞ የተከፈለ' : 'Initial Paid'}
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                        value={feeForm.amount_paid}
                        onChange={(e) =>
                          setFeeForm({ ...feeForm, amount_paid: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <label className="block font-semibold text-[#3c5149]">
                    {isAm ? 'የመክፈያ ቀን' : 'Due Date'}
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                      value={feeForm.due_date}
                      onChange={(e) =>
                        setFeeForm({ ...feeForm, due_date: e.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="primary-button w-full">
                    <Plus size={15} /> {isAm ? 'ክፍያውን መዝግብ' : 'Issue Invoice'}
                  </button>
                </form>
              </section>
            )}

            {/* Digital Receipts Verification Queue */}
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    Telebirr · CBE · Hijra · ZemZem · Rammis Bank
                  </p>
                  <h2>
                    {isAm
                      ? 'የክፍያ ደረሰኞች ማረጋገጫ'
                      : 'Submitted Payment Receipts'}
                  </h2>
                </div>
                <select
                  value={receiptStatusFilter}
                  onChange={(e) => setReceiptStatusFilter(e.target.value)}
                >
                  <option value="ALL">{isAm ? 'ሁሉም ደረሰኞች' : 'All Receipts'}</option>
                  <option value="pending">{isAm ? 'በመጠባበቅ ላይ' : 'Pending'}</option>
                  <option value="verified">{isAm ? 'የተረጋገጡ' : 'Verified'}</option>
                  <option value="rejected">{isAm ? 'የተመለሱ' : 'Rejected'}</option>
                </select>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{isAm ? 'ተማሪ' : 'Student'}</th>
                      <th>{isAm ? 'ባንክ / ቴሌብር' : 'Provider'}</th>
                      <th>{isAm ? 'የግብይት መለያ' : 'Ref No.'}</th>
                      <th>{isAm ? 'መጠን' : 'Amount'}</th>
                      <th>{isAm ? 'ደረሰኝ' : 'Proof'}</th>
                      <th>{isAm ? 'ድርጊት' : 'Verification'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((rcpt) => {
                      const stu = students.find((s) => s.id === rcpt.student_id);
                      return (
                        <tr key={rcpt.id}>
                          <td className="font-semibold text-[#19362b]">
                            {stu?.full_name || 'Student'}
                          </td>
                          <td>
                            <span className="rounded bg-[#e4f0f5] px-2 py-0.5 text-[10px] font-bold text-[#397b98]">
                              {rcpt.provider}
                            </span>
                          </td>
                          <td className="font-mono font-bold">{rcpt.transaction_ref}</td>
                          <td className="font-bold text-[#073c2f]">
                            {Number(rcpt.amount_paid).toLocaleString()} ETB
                          </td>
                          <td>
                            {rcpt.receipt_image_url ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewReceiptImage(rcpt.receipt_image_url)
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0b6248]"
                              >
                                <ImageIcon size={13} /> {isAm ? 'እይ' : 'View'}
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {rcpt.status === 'pending' &&
                            permissions.can_verify_receipts ? (
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleVerifyReceipt(rcpt)}
                                  className="rounded bg-[#0b6248] px-2 py-1 text-[10px] font-bold text-white"
                                >
                                  {isAm ? 'አረጋግጥ' : 'Verify'}
                                </button>
                                <input
                                  className="w-24 rounded border border-[#d9e2dd] px-1.5 py-0.5 text-[10px]"
                                  placeholder="Note..."
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
                                  className="rounded bg-[#fae9e5] px-2 py-1 text-[10px] font-bold text-[#b34a3c]"
                                >
                                  {isAm ? 'መልስ' : 'Reject'}
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  rcpt.status === 'verified'
                                    ? 'bg-[#e9f5ed] text-[#3b805d]'
                                    : rcpt.status === 'rejected'
                                    ? 'bg-[#fae9e5] text-[#b34a3c]'
                                    : 'bg-[#faead0] text-[#a9691f]'
                                }`}
                              >
                                {rcpt.status === 'verified' ? (
                                  <CheckCircle2 size={11} />
                                ) : rcpt.status === 'rejected' ? (
                                  <XCircle size={11} />
                                ) : (
                                  <Clock size={11} />
                                )}
                                {rcpt.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 4: HR & STAFF PAYROLL (FULL CRUD FOR REGISTRAR & HR) */}
      {activeNavIndex === 4 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {isAm ? 'የሰው ኃይል እና ደመወዝ አስተዳደር' : 'Human Resources & Payroll'}
              </p>
              <h2>
                {isAm ? 'መምህራን እና ሰራተኞች (ቅጥር እና HR)' : 'Staff Contracts, Leave & Payroll'}
              </h2>
            </div>
            {canCreateEditStaff && (
              <button className="primary-button" onClick={openAddStaffModal}>
                <Plus size={16} /> {isAm ? 'አዲስ ሰራተኛ ቅጠር' : 'Hire / Add Staff'}
              </button>
            )}
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#d9e2dd] bg-[#fbfcfb] px-3 py-2 text-xs flex-1 min-w-[220px]">
              <Search size={15} className="text-[#749084]" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder={
                  isAm
                    ? 'በስም፣ በመለያ ቁጥር ወይም በስራ ክፍል ይፈልጉ...'
                    : 'Search by employee name, ID, or department...'
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
                  <th>{isAm ? 'ድርጊት' : 'Actions'}</th>
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
                    <td>
                      <div className="flex items-center gap-2">
                        {canCreateEditStaff && (
                          <button
                            type="button"
                            onClick={() => openEditStaffModal(member)}
                            className="rounded p-1.5 text-[#23624d] hover:bg-[#e9f5ed]"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {canDeleteStaff && (
                          <button
                            type="button"
                            onClick={() => deleteStaff(member.id)}
                            className="rounded p-1.5 text-[#b34a3c] hover:bg-[#fae9e5]"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* OFFICIAL STUDENT ENROLLMENT / ARCHIVE RECORD MODAL */}
      {recordStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white p-7 shadow-2xl print-area">
            <div className="mb-4 flex items-center justify-between no-print">
              <span className="text-xs font-bold uppercase text-[#71847b]">
                {isAm ? 'ኦፊሴላዊ የተማሪ መዝገብ' : 'Official Registrar Record'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="primary-button !h-9"
                >
                  <Printer size={15} /> {isAm ? 'አትም / PDF' : 'Print Record'}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordStudent(null)}
                  className="rounded-lg border border-[#d9e2dd] p-2 text-[#587066]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="border-2 border-[#073c2f] rounded-lg p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b-2 border-[#073c2f] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#073c2f]">
                    SELAM ACADEMY — OFFICE OF THE REGISTRAR
                  </h2>
                  <p className="text-[#547268]">
                    ሰላም አካዳሚ — ሀዋሳ፣ ሲዳማ ክልል፣ ኢትዮጵያ
                  </p>
                </div>
                <span className="rounded bg-[#e3f1e9] px-2.5 py-1 font-bold uppercase text-[#073c2f]">
                  {recordStudent.enrollment_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#f8fbf9] p-4 border border-[#e4ebe7]">
                <div>
                  <span className="text-[#71847b]">Student Name: </span>
                  <b>{recordStudent.full_name}</b>
                </div>
                <div>
                  <span className="text-[#71847b]">Student ID: </span>
                  <b className="font-mono">{recordStudent.student_id}</b>
                </div>
                <div>
                  <span className="text-[#71847b]">Grade & Section: </span>
                  <b>
                    Grade {recordStudent.grade} — {recordStudent.section}
                  </b>
                </div>
                <div>
                  <span className="text-[#71847b]">Sub-City: </span>
                  <b>{recordStudent.sub_city || 'Hawassa'}</b>
                </div>
                <div>
                  <span className="text-[#71847b]">Guardian: </span>
                  <b>{recordStudent.guardian_name || '—'}</b>
                </div>
                <div>
                  <span className="text-[#71847b]">Guardian Phone: </span>
                  <b>{recordStudent.guardian_phone || '—'}</b>
                </div>
              </div>

              <div>
                <b className="block mb-2 text-[#073c2f]">
                  Recorded Academic Grades ({grades.filter((g) => g.student_id === recordStudent.id).length} entries)
                </b>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#073c2f] text-white">
                      <th className="p-2 text-left text-white">Subject</th>
                      <th className="p-2 text-center text-white">Sem</th>
                      <th className="p-2 text-center text-white">Total</th>
                      <th className="p-2 text-center text-white">Conduct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades
                      .filter((g) => g.student_id === recordStudent.id)
                      .map((g) => {
                        const sub = subjects.find((s) => s.id === g.subject_id);
                        const tot =
                          Number(g.quiz) +
                          Number(g.assignment) +
                          Number(g.mid_exam) +
                          Number(g.final_exam);
                        return (
                          <tr key={g.id} className="border-b border-[#e4ebe7]">
                            <td className="p-2 font-semibold">{sub?.name || 'Subject'}</td>
                            <td className="p-2 text-center">Sem {g.semester}</td>
                            <td className="p-2 text-center font-bold">{tot}%</td>
                            <td className="p-2 text-center">{g.conduct || 'A'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 flex justify-between text-[#587066]">
                <div className="border-t border-[#9aa8a2] pt-1.5">
                  Registrar Signature & Seal
                </div>
                <div className="border-t border-[#9aa8a2] pt-1.5">
                  Date: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
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
              <b className="text-xs text-[#19362b]">Payment Receipt</b>
              <button
                type="button"
                onClick={() => setPreviewReceiptImage(null)}
                className="rounded p-1 text-[#587066]"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={previewReceiptImage}
              alt="Receipt"
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* STUDENT ENROLLMENT MODAL */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#19362b]">
                {editingStudent
                  ? isAm
                    ? 'የተማሪ መረጃ አስተካክል'
                    : 'Edit Student Record'
                  : isAm
                  ? 'አዲስ ተማሪ መዝግብ'
                  : 'Enroll New Student'}
              </h3>
              <button
                type="button"
                onClick={() => setStudentModalOpen(false)}
                className="text-[#749084]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveStudent} className="grid grid-cols-2 gap-3 text-xs">
              <label className="font-semibold text-[#3c5149]">
                {t.studentId}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={studentForm.student_id}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, student_id: e.target.value })
                  }
                  required
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ፆታ' : 'Gender'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={studentForm.gender}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, gender: e.target.value as 'M' | 'F' })
                  }
                >
                  <option value="F">{isAm ? 'ሴት (F)' : 'Female (F)'}</option>
                  <option value="M">{isAm ? 'ወንድ (M)' : 'Male (M)'}</option>
                </select>
              </label>
              <label className="col-span-2 font-semibold text-[#3c5149]">
                {t.studentName}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={studentForm.full_name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, full_name: e.target.value })
                  }
                  required
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ክፍል' : 'Grade'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={studentForm.grade}
                  onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                >
                  {GRADES_LIST.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ሴክሽን' : 'Section'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={studentForm.section}
                  onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                >
                  {SECTIONS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'የወላጅ / አሳዳጊ ስም' : 'Guardian Name'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={studentForm.guardian_name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, guardian_name: e.target.value })
                  }
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'የወላጅ ስልክ' : 'Guardian Phone'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={studentForm.guardian_phone}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, guardian_phone: e.target.value })
                  }
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {t.subCity}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={studentForm.sub_city}
                  onChange={(e) => setStudentForm({ ...studentForm, sub_city: e.target.value })}
                >
                  {HAWASSA_SUBCITIES.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-semibold text-[#3c5149]">
                {t.status}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={studentForm.enrollment_status}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      enrollment_status: e.target.value as Student['enrollment_status'],
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="transferred">Transferred (Archive)</option>
                  <option value="graduated">Graduated (Archive)</option>
                  <option value="withdrawn">Withdrawn (Archive)</option>
                </select>
              </label>
              <div className="col-span-2 mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStudentModalOpen(false)}
                >
                  {isAm ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button type="submit" className="primary-button">
                  {isAm ? 'መረጃውን አስቀምጥ' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR & STAFF MODAL */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#19362b]">
                {editingStaff
                  ? isAm
                    ? 'የሰራተኛ መረጃ አስተካክል'
                    : 'Edit Staff Member'
                  : isAm
                  ? 'አዲስ ሰራተኛ ቅጠር'
                  : 'Hire / Add Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="text-[#749084]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveStaff} className="grid grid-cols-2 gap-3 text-xs">
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'የሰራተኛ መለያ' : 'Employee ID'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={staffForm.employee_id}
                  onChange={(e) => setStaffForm({ ...staffForm, employee_id: e.target.value })}
                  required
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ስልክ ቁጥር' : 'Phone'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </label>
              <label className="col-span-2 font-semibold text-[#3c5149]">
                {isAm ? 'ሙሉ ስም' : 'Full Name'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={staffForm.full_name}
                  onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                  required
                />
              </label>
              <label className="col-span-2 font-semibold text-[#3c5149]">
                {isAm ? 'የስራ ድርሻ / ክፍል' : 'Role / Department'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  placeholder="e.g. Teacher — Physics or Support — Storekeeper"
                  value={staffForm.role_department}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, role_department: e.target.value })
                  }
                  required
                />
              </label>
              <label className="col-span-2 font-semibold text-[#3c5149]">
                {isAm ? 'የተመደበባቸው ክፍሎች እና ትምህርቶች' : 'Assigned Grades & Subjects'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={staffForm.assigned_grades_subjects}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, assigned_grades_subjects: e.target.value })
                  }
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'የትምህርት ደረጃ' : 'Qualification'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={staffForm.qualification}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, qualification: e.target.value })
                  }
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ወርሃዊ ደመወዝ (ETB)' : 'Monthly Salary (ETB)'}
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={staffForm.monthly_salary}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, monthly_salary: Number(e.target.value) })
                  }
                />
              </label>
              <label className="col-span-2 font-semibold text-[#3c5149]">
                {t.status}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={staffForm.employment_status}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      employment_status: e.target.value as StaffMember['employment_status'],
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </label>
              <div className="col-span-2 mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStaffModalOpen(false)}
                >
                  {isAm ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button type="submit" className="primary-button">
                  {isAm ? 'መረጃውን አስቀምጥ' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}