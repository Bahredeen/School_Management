import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  KeyRound,
  Link2,
  Lock,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import {
  getDefaultPermissionsForRole,
  isSupabaseConfigured,
  supabase,
  type AccessLevel,
  type AccountPermissions,
  type GradeRecord,
  type Profile,
  type StaffMember,
  type Student,
  type UserRole,
} from '../../lib/supabase';
import { translations, type Language } from '../../lib/i18n';
import type { PortalUser } from '../../App';

interface ParentStudentLinkRow {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string | null;
  created_at: string;
}

const fallbackProfiles: Profile[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    email: 'director@selamacademy.edu.et',
    full_name: 'Dawit Tadesse',
    role: 'director',
    phone: '+251911200301',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    email: 'ict@selamacademy.edu.et',
    full_name: 'Ekram Mohammad',
    role: 'ict',
    phone: '+251911200302',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    email: 'registrar@selamacademy.edu.et',
    full_name: 'Meron Tesfaye',
    role: 'registrar',
    phone: '+251911200305',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    email: 'property@selamacademy.edu.et',
    full_name: 'Bereket Yohannes',
    role: 'property',
    phone: '+251911200306',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    email: 'teacher@selamacademy.edu.et',
    full_name: 'Tigist Alemu',
    role: 'teacher',
    phone: '+251911200303',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    email: 'parent@selamacademy.edu.et',
    full_name: 'Ahmad Kedir',
    role: 'parent',
    phone: '+251911200304',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

const fallbackLinks: ParentStudentLinkRow[] = [
  {
    id: 'link-1',
    parent_id: '11111111-1111-1111-1111-111111111104',
    student_id: '33333333-3333-3333-3333-333333333301',
    relationship: 'Father',
    created_at: new Date().toISOString(),
  },
  {
    id: 'link-2',
    parent_id: '11111111-1111-1111-1111-111111111104',
    student_id: '33333333-3333-3333-3333-333333333302',
    relationship: 'Father',
    created_at: new Date().toISOString(),
  },
];

function normalizeEthiopianPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.length === 10 && (digits.startsWith('09') || digits.startsWith('07'))) {
    return `+251${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('251')) {
    return `+${digits}`;
  }
  if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('7'))) {
    return `+251${digits}`;
  }
  return raw.trim();
}

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

export function IctPortal({
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
  const t = translations[language];
  const isAm = language === 'am';

  const [profiles, setProfiles] = useState<Profile[]>(fallbackProfiles);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, AccountPermissions>>(
    () => {
      const initial: Record<string, AccountPermissions> = {};
      fallbackProfiles.forEach((p) => {
        initial[p.id] = getDefaultPermissionsForRole(p.id, p.role);
      });
      return initial;
    }
  );
  const [students, setStudents] = useState<Student[]>(fallbackStudents);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [links, setLinks] = useState<ParentStudentLinkRow[]>(fallbackLinks);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Filters & Selected User for Permission Matrix
  const [accountQuery, setAccountQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPermissionUserId, setSelectedPermissionUserId] = useState<string>(
    '11111111-1111-1111-1111-111111111101'
  );
  const [savingPermissions, setSavingPermissions] = useState(false);

  // New Account Form (Supports any personal email domain, phone number, or both)
  const [newAccount, setNewAccount] = useState({
    full_name: '',
    email: '',
    phone: '+2519',
    role: 'parent' as UserRole,
    password: 'SelamFamily2026!',
  });
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  } | null>(null);

  // Family Linking Form
  const [linkForm, setLinkForm] = useState({
    parent_id: '',
    student_id: '',
    relationship: 'Father',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3400);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadIctData = async () => {
      const [profilesRes, permRes, studentsRes, linksRes, staffRes, gradesRes] =
        await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('account_permissions').select('*'),
          supabase.from('students').select('*').order('student_id', { ascending: true }),
          supabase
            .from('parent_student_links')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase.from('staff').select('*').order('employee_id', { ascending: true }),
          supabase.from('grades').select('*'),
        ]);

      if (profilesRes.data && profilesRes.data.length > 0) {
        const loadedProfiles = profilesRes.data as Profile[];
        setProfiles(loadedProfiles);
        setSelectedPermissionUserId(loadedProfiles[0].id);

        const nextPermMap: Record<string, AccountPermissions> = {};
        loadedProfiles.forEach((p) => {
          const found = (permRes.data as AccountPermissions[] | null)?.find(
            (row) => row.user_id === p.id
          );
          nextPermMap[p.id] = found || getDefaultPermissionsForRole(p.id, p.role);
        });
        setPermissionsMap(nextPermMap);
      }

      if (studentsRes.data && studentsRes.data.length > 0) {
        setStudents(studentsRes.data as Student[]);
      }
      if (linksRes.data) {
        setLinks(linksRes.data as ParentStudentLinkRow[]);
      }
      if (staffRes.data) {
        setStaff(staffRes.data as StaffMember[]);
      }
      if (gradesRes.data) {
        setGrades(gradesRes.data as GradeRecord[]);
      }
    };

    loadIctData();
  }, []);

  const parentAccounts = useMemo(
    () => profiles.filter((p) => p.role === 'parent'),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesQuery =
        p.full_name.toLowerCase().includes(accountQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(accountQuery.toLowerCase()) ||
        (p.phone || '').includes(accountQuery);
      const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [profiles, accountQuery, roleFilter, statusFilter]);

  // === CREATE PRIVATE ACCOUNT (ANY EMAIL DOMAIN AND/OR PHONE NUMBER) ===
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = newAccount.full_name.trim();
    const rawEmail = newAccount.email.trim().toLowerCase();
    const normalizedPhone = normalizeEthiopianPhone(newAccount.phone);
    const hasRealPhone = normalizedPhone.replace(/[^0-9]/g, '').length >= 9;

    if (!cleanName || newAccount.password.length < 6) {
      setErrorMsg(
        isAm
          ? 'እባክዎ ሙሉ ስም እና ቢያንስ 6 ፊደላት ያለው የይለፍ ቃል ያስገቡ።'
          : 'Please enter a full name and a password (min 6 characters).'
      );
      return;
    }

    if (!rawEmail && !hasRealPhone) {
      setErrorMsg(
        isAm
          ? 'እባክዎ ኢሜይል አድራሻ ወይም ስልክ ቁጥር ያስገቡ።'
          : 'Please provide at least an email address (any domain) or a valid phone number.'
      );
      return;
    }

    if (rawEmail && !rawEmail.includes('@')) {
      setErrorMsg(
        isAm
          ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ (ለምሳሌ፡ name@gmail.com)።'
          : 'Please enter a valid email address (e.g. name@gmail.com).'
      );
      return;
    }

    const phoneDigits = normalizedPhone.replace(/[^0-9]/g, '');
    const authEmail = rawEmail || `phone_${phoneDigits}@selamacademy.local`;

    setCreatingAccount(true);

    if (isSupabaseConfigured && supabase) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: signUpData, error: signUpError } = await ephemeralClient.auth.signUp({
        email: authEmail,
        password: newAccount.password,
        options: {
          data: {
            full_name: cleanName,
            role: newAccount.role,
            phone: hasRealPhone ? normalizedPhone : null,
          },
        },
      });

      if (signUpError || !signUpData.user) {
        setCreatingAccount(false);
        setErrorMsg(signUpError?.message || 'Could not create auth account.');
        return;
      }

      const newProfilePayload = {
        id: signUpData.user.id,
        email: authEmail,
        full_name: cleanName,
        role: newAccount.role,
        phone: hasRealPhone ? normalizedPhone : null,
        status: 'active' as const,
      };

      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert([newProfilePayload])
        .select()
        .single();

      if (profileError) {
        setCreatingAccount(false);
        setErrorMsg(
          `Auth user created, but profile insert failed: ${profileError.message}`
        );
        return;
      }

      const defaultPerms = getDefaultPermissionsForRole(signUpData.user.id, newAccount.role);
      await supabase
        .from('account_permissions')
        .upsert([{ ...defaultPerms, updated_by: user.id }]);

      setProfiles((prev) => [insertedProfile as Profile, ...prev]);
      setPermissionsMap((prev) => ({
        ...prev,
        [signUpData.user!.id]: defaultPerms,
      }));
      setSelectedPermissionUserId(signUpData.user.id);
    } else {
      const mockId = `local-user-${Date.now()}`;
      const mockProfile: Profile = {
        id: mockId,
        email: authEmail,
        full_name: cleanName,
        role: newAccount.role,
        phone: hasRealPhone ? normalizedPhone : null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const defaultPerms = getDefaultPermissionsForRole(mockId, newAccount.role);
      setProfiles((prev) => [mockProfile, ...prev]);
      setPermissionsMap((prev) => ({
        ...prev,
        [mockId]: defaultPerms,
      }));
      setSelectedPermissionUserId(mockId);
    }

    setCreatingAccount(false);
    setLastCreatedCredentials({
      name: cleanName,
      email: rawEmail,
      phone: hasRealPhone ? normalizedPhone : '',
      password: newAccount.password,
      role: newAccount.role,
    });
    setNewAccount({
      full_name: '',
      email: '',
      phone: '+2519',
      role: 'parent',
      password: 'SelamFamily2026!',
    });
    showToast(
      isAm
        ? 'የግል መለያ ተፈጥሯል፤ የፍቃድ ደረጃውን ከታች ማስተካከል ይችላሉ።'
        : 'Account created! You can customize its permissions below.'
    );
  };

  // === UPDATE PER-ACCOUNT PERMISSIONS (ICT AUTHORITY CONTROLLER) ===
  const activePermissionProfile =
    profiles.find((p) => p.id === selectedPermissionUserId) || profiles[0];

  const activePermissions: AccountPermissions = activePermissionProfile
    ? permissionsMap[activePermissionProfile.id] ||
      getDefaultPermissionsForRole(activePermissionProfile.id, activePermissionProfile.role)
    : getDefaultPermissionsForRole('', 'parent');

  const updateModulePermission = (
    moduleField:
      | 'students_access'
      | 'staff_access'
      | 'grades_access'
      | 'attendance_access'
      | 'finance_access'
      | 'property_access'
      | 'announcements_access',
    level: AccessLevel
  ) => {
    if (!activePermissionProfile) return;
    setPermissionsMap((prev) => ({
      ...prev,
      [activePermissionProfile.id]: {
        ...activePermissions,
        [moduleField]: level,
      },
    }));
  };

  const toggleActionPermission = (
    flagField:
      | 'can_comment_feedback'
      | 'can_send_messages'
      | 'can_verify_receipts'
      | 'can_publish_grades'
      | 'can_export_data'
  ) => {
    if (!activePermissionProfile) return;
    setPermissionsMap((prev) => ({
      ...prev,
      [activePermissionProfile.id]: {
        ...activePermissions,
        [flagField]: !activePermissions[flagField],
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!activePermissionProfile) return;
    setSavingPermissions(true);

    const payload = {
      ...activePermissions,
      user_id: activePermissionProfile.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('account_permissions')
        .upsert([payload], { onConflict: 'user_id' });

      if (error) {
        setSavingPermissions(false);
        showToast(error.message);
        return;
      }
    }

    setSavingPermissions(false);
    showToast(
      isAm
        ? `የ${activePermissionProfile.full_name} የመለያ ስልጣን እና ፍቃዶች ተቀምጠዋል!`
        : `Permissions & CRUD authorities saved for ${activePermissionProfile.full_name}!`
    );
  };

  // === TOGGLE ACCOUNT STATUS (ACTIVE / SUSPENDED) ===
  const handleToggleAccountStatus = async (profile: Profile) => {
    if (profile.id === user.id) {
      showToast(
        isAm
          ? 'የራስዎን የአይሲቲ መለያ ማገድ አይችሉም።'
          : 'You cannot suspend your own active ICT account.'
      );
      return;
    }

    const nextStatus: Profile['status'] =
      profile.status === 'active' ? 'suspended' : 'active';

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) {
        showToast(error.message);
        return;
      }
    }

    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profile.id
          ? { ...p, status: nextStatus, updated_at: new Date().toISOString() }
          : p
      )
    );
    showToast(
      nextStatus === 'suspended'
        ? isAm
          ? `${profile.full_name} ታግዷል።`
          : `${profile.full_name} has been suspended.`
        : isAm
        ? `${profile.full_name} እንደገና እንዲሰራ ተደርጓል።`
        : `${profile.full_name} has been reactivated.`
    );
  };

  // === FAMILY TO STUDENT LINKING ===
  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.parent_id || !linkForm.student_id) return;

    const alreadyLinked = links.some(
      (l) => l.parent_id === linkForm.parent_id && l.student_id === linkForm.student_id
    );
    if (alreadyLinked) {
      showToast(
        isAm
          ? 'ይህ ተማሪ ቀድሞውኑ ከዚህ ወላጅ ጋር ተገናኝቷል።'
          : 'This student is already linked to that parent account.'
      );
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('parent_student_links')
        .insert([
          {
            parent_id: linkForm.parent_id,
            student_id: linkForm.student_id,
            relationship: linkForm.relationship,
          },
        ])
        .select()
        .single();

      if (error) {
        showToast(error.message);
        return;
      }
      if (data) {
        setLinks((prev) => [data as ParentStudentLinkRow, ...prev]);
      }
    } else {
      setLinks((prev) => [
        {
          id: `link-${Date.now()}`,
          parent_id: linkForm.parent_id,
          student_id: linkForm.student_id,
          relationship: linkForm.relationship,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    setLinkForm({ ...linkForm, student_id: '' });
    showToast(
      isAm
        ? 'ተማሪው ከወላጅ መለያ ጋር ተገናኝቷል።'
        : 'Student securely linked to family account.'
    );
  };

  const handleUnlinkStudent = async (linkId: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('parent_student_links').delete().eq('id', linkId);
    }
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    showToast(isAm ? 'ትስስሩ ተቋርጧል።' : 'Family-student link removed.');
  };

  // === CSV EXPORTS ===
  const downloadCsv = (filename: string, rows: string[][]) => {
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(isAm ? `${filename} ወርዷል።` : `Exported ${filename}`);
  };

  const exportStudentsCsv = () => {
    const header = [
      'Student ID',
      'Full Name',
      'Gender',
      'Grade',
      'Section',
      'Guardian Name',
      'Guardian Phone',
      'Sub-City',
      'Status',
    ];
    const body = students.map((s) => [
      s.student_id,
      s.full_name,
      s.gender || '',
      s.grade,
      s.section,
      s.guardian_name || '',
      s.guardian_phone || '',
      s.sub_city || '',
      s.enrollment_status,
    ]);
    downloadCsv('selam_academy_students.csv', [header, ...body]);
  };

  const exportAccountsCsv = () => {
    const header = ['User ID', 'Full Name', 'Email', 'Role', 'Phone', 'Status'];
    const body = profiles.map((p) => [
      p.id,
      p.full_name,
      p.email,
      p.role,
      p.phone || '',
      p.status,
    ]);
    downloadCsv('selam_academy_accounts.csv', [header, ...body]);
  };

  const exportStaffCsv = () => {
    const header = [
      'Employee ID',
      'Full Name',
      'Department',
      'Assigned Grades/Subjects',
      'Qualification',
      'Monthly Salary (ETB)',
      'Status',
    ];
    const body = staff.map((m) => [
      m.employee_id,
      m.full_name,
      m.role_department,
      m.assigned_grades_subjects || '',
      m.qualification || '',
      String(m.monthly_salary),
      m.employment_status,
    ]);
    downloadCsv('selam_academy_staff.csv', [header, ...body]);
  };

  const activeAccountsCount = profiles.filter((p) => p.status === 'active').length;
  const suspendedAccountsCount = profiles.filter((p) => p.status === 'suspended').length;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#073c2f] px-4 py-3 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 size={16} className="text-[#e4b65e]" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 0: SYSTEM OVERVIEW */}
      {activeNavIndex === 0 && (
        <>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                {isAm ? 'የሲስተም አስተዳደር' : 'System Administration'}
              </p>
              <h1>
                {isAm ? 'የአይሲቲ መቆጣጠሪያ ማዕከል' : 'Systems at a glance'}
              </h1>
              <p className="subtle">
                {isAm
                  ? 'የሰላም አካዳሚ መለያዎችን፣ የስልጣን ደረጃዎችን (CRUD) እና የቤተሰብ ትስስሮችን ያስተዳድሩ።'
                  : 'Control user accounts, per-account CRUD authorities, and family-student links.'}
              </p>
            </div>
            <button className="primary-button" onClick={() => onNavigate(1)}>
              <UserPlus size={16} />{' '}
              {isAm ? 'መለያ እና ፍቃድ አስተዳድር' : 'Manage Accounts & Permissions'}
            </button>
          </div>

          <div className="stat-grid">
            <StatCard
              label={isAm ? 'ንቁ መለያዎች' : 'Active accounts'}
              value={String(activeAccountsCount)}
              detail={
                isAm
                  ? `${suspendedAccountsCount} የታገዱ መለያዎች`
                  : `${suspendedAccountsCount} suspended accounts`
              }
              icon={Users}
              accent="green"
            />
            <StatCard
              label={isAm ? 'የወላጅ መለያዎች' : 'Family accounts'}
              value={String(parentAccounts.length)}
              detail={isAm ? 'የግል መግቢያ ያላቸው ቤተሰቦች' : 'Private parent logins'}
              icon={ShieldCheck}
              accent="gold"
            />
            <StatCard
              label={isAm ? 'የተማሪ-ቤተሰብ ትስስር' : 'Family-student links'}
              value={String(links.length)}
              detail={isAm ? 'ከወላጆች ጋር የተገናኙ ልጆች' : 'Children linked to parents'}
              icon={Link2}
              accent="blue"
            />
            <StatCard
              label={isAm ? 'የስልጣን ቁጥጥር (RBAC)' : 'ICT Authority Control'}
              value="Enforced"
              detail={isAm ? 'ጥብቅ የCRUD እና RLS ፖሊሲ' : 'Per-account CRUD & RLS'}
              icon={Activity}
              accent="rose"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isAm ? 'ፈጣን እርምጃዎች' : 'Quick Provisioning'}</p>
                  <h2>{isAm ? 'የቅርብ ጊዜ መለያዎች' : 'Recently Provisioned Accounts'}</h2>
                </div>
                <button className="text-button" onClick={() => onNavigate(1)}>
                  {isAm ? 'ሁሉንም አስተዳድር →' : 'Manage all →'}
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{isAm ? 'ስም' : 'Full Name'}</th>
                      <th>{isAm ? 'ኢሜይል / ስልክ' : 'Email / Phone'}</th>
                      <th>{isAm ? 'ድርሻ' : 'Role'}</th>
                      <th>{isAm ? 'ሁኔታ' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.slice(0, 6).map((p) => (
                      <tr key={p.id}>
                        <td className="font-semibold text-[#19362b]">{p.full_name}</td>
                        <td className="muted-cell">
                          {p.email.endsWith('@selamacademy.local') ? p.phone : p.email}
                        </td>
                        <td>{t.roles[p.role]}</td>
                        <td>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              p.status === 'active'
                                ? 'bg-[#e9f5ed] text-[#3b805d]'
                                : 'bg-[#fae9e5] text-[#b34a3c]'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isAm ? 'የቤተሰብ ትስስር' : 'Access Control'}</p>
                  <h2>{isAm ? 'የቤተሰብ እና ተማሪ ትስስር' : 'Active Family Links'}</h2>
                </div>
                <button className="text-button" onClick={() => onNavigate(2)}>
                  {isAm ? 'አዲስ አገናኝ →' : 'Link child →'}
                </button>
              </div>
              <div className="space-y-3">
                {links.slice(0, 4).map((lnk) => {
                  const parent = profiles.find((p) => p.id === lnk.parent_id);
                  const student = students.find((s) => s.id === lnk.student_id);
                  return (
                    <div
                      key={lnk.id}
                      className="flex items-center justify-between rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-3 text-xs"
                    >
                      <div>
                        <b className="text-[#19362b]">
                          {parent?.full_name || 'Parent Account'}
                        </b>
                        <p className="text-[#71847b]">
                          → {student?.full_name || 'Student'} (
                          {student ? `Grade ${student.grade} ${student.section}` : ''})
                        </p>
                      </div>
                      <span className="rounded bg-[#e3f1e9] px-2 py-0.5 text-[10px] font-semibold text-[#277453]">
                        {lnk.relationship || 'Guardian'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}

      {/* TAB 1: ACCOUNT PROVISIONING & ICT PERMISSION / AUTHORITY MATRIX */}
      {activeNavIndex === 1 && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            {/* Create Account Card */}
            <section className="panel h-fit">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {isAm ? 'በኢሜይል ወይም በስልክ ቁጥር' : 'Any Email Domain or Phone'}
                  </p>
                  <h2>{isAm ? 'የግል መለያ ፍጠር' : 'Create Private Account'}</h2>
                </div>
              </div>
              <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'የተጠቃሚ ድርሻ' : 'Account Role'}
                  <select
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                    value={newAccount.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      setNewAccount({
                        ...newAccount,
                        role,
                        password:
                          role === 'parent'
                            ? 'SelamFamily2026!'
                            : role === 'teacher'
                            ? 'SelamTeacher2026!'
                            : 'SelamAcademy2026!',
                      });
                    }}
                  >
                    <option value="parent">{t.roles.parent}</option>
                    <option value="teacher">{t.roles.teacher}</option>
                    <option value="registrar">{t.roles.registrar}</option>
                    <option value="property">{t.roles.property}</option>
                    <option value="ict">{t.roles.ict}</option>
                    <option value="director">{t.roles.director}</option>
                  </select>
                </label>
                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ሙሉ ስም' : 'Full Name'}
                  <input
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                    placeholder={isAm ? 'ለምሳሌ፡ አቶ አበበ ከበደ' : 'e.g. Abebe Kebede'}
                    value={newAccount.full_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, full_name: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="block font-semibold text-[#3c5149]">
                  {isAm
                    ? 'ኢሜይል አድራሻ (Gmail, Yahoo ወይም ሌላ)'
                    : 'Email Address (Gmail, Yahoo, or School)'}
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                    placeholder="abebe.kebede@gmail.com"
                    value={newAccount.email}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, email: e.target.value })
                    }
                  />
                </label>
                <label className="block font-semibold text-[#3c5149]">
                  {isAm
                    ? 'ስልክ ቁጥር (ለመግቢያም ያገለግላል)'
                    : 'Phone Number (Can also be used to sign in)'}
                  <input
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                    placeholder="+251911223344 or 0911223344"
                    value={newAccount.phone}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, phone: e.target.value })
                    }
                  />
                </label>
                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ጊዜያዊ የይለፍ ቃል' : 'Temporary Password'}
                  <div className="relative mt-1">
                    <input
                      className="w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 pr-9 font-mono outline-none focus:border-[#157052]"
                      value={newAccount.password}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, password: e.target.value })
                      }
                      required
                    />
                    <KeyRound
                      size={14}
                      className="absolute right-3 top-3 text-[#749084]"
                    />
                  </div>
                </label>

                {errorMsg && <p className="text-[11px] font-medium text-[#b34a3c]">{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={creatingAccount}
                  className="primary-button w-full"
                >
                  <UserPlus size={15} />{' '}
                  {creatingAccount
                    ? isAm
                      ? 'በመፍጠር ላይ...'
                      : 'Provisioning...'
                    : isAm
                    ? 'መለያውን ፍጠር'
                    : 'Create & Activate Account'}
                </button>
              </form>

              {lastCreatedCredentials && (
                <div className="mt-4 rounded-lg border border-[#b8d9c5] bg-[#eff8f2] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#073c2f]">
                    <span>
                      {isAm ? 'የተፈጠረ መለያ መረጃ' : 'Ready to Share with User'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const lines = [
                          `Selam Academy Portal`,
                          `Name: ${lastCreatedCredentials.name}`,
                          lastCreatedCredentials.email
                            ? `Email: ${lastCreatedCredentials.email}`
                            : '',
                          lastCreatedCredentials.phone
                            ? `Phone: ${lastCreatedCredentials.phone}`
                            : '',
                          `Password: ${lastCreatedCredentials.password}`,
                        ]
                          .filter(Boolean)
                          .join('\n');
                        navigator.clipboard?.writeText(lines);
                        showToast(isAm ? 'መረጃው ተቀድቷል።' : 'Credentials copied.');
                      }}
                      className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] text-[#0b6248] border border-[#cde3d6]"
                    >
                      <Copy size={11} /> {isAm ? 'ቅዳ' : 'Copy'}
                    </button>
                  </div>
                  {lastCreatedCredentials.email && (
                    <p className="text-[#365247]">
                      <b>Email:</b> {lastCreatedCredentials.email}
                    </p>
                  )}
                  {lastCreatedCredentials.phone && (
                    <p className="text-[#365247]">
                      <b>Phone:</b> {lastCreatedCredentials.phone}
                    </p>
                  )}
                  <p className="text-[#365247]">
                    <b>Password:</b> <code>{lastCreatedCredentials.password}</code>
                  </p>
                </div>
              )}
            </section>

            {/* All Accounts Table */}
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isAm ? 'የተጠቃሚዎች ማውጫ' : 'Access Directory'}</p>
                  <h2>{isAm ? 'ሁሉም የሲስተም መለያዎች' : 'All School User Accounts'}</h2>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-[#d9e2dd] bg-[#fbfcfb] px-3 py-2 text-xs flex-1 min-w-[200px]">
                  <Search size={15} className="text-[#749084]" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder={
                      isAm ? 'በስም፣ በኢሜይል ወይም በስልክ ይፈልጉ...' : 'Search by name, email, or phone...'
                    }
                    value={accountQuery}
                    onChange={(e) => setAccountQuery(e.target.value)}
                  />
                </div>
                <select
                  className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">{isAm ? 'ሁሉም ድርሻዎች' : 'All Roles'}</option>
                  <option value="parent">{t.roles.parent}</option>
                  <option value="teacher">{t.roles.teacher}</option>
                  <option value="registrar">{t.roles.registrar}</option>
                  <option value="property">{t.roles.property}</option>
                  <option value="director">{t.roles.director}</option>
                  <option value="ict">{t.roles.ict}</option>
                </select>
                <select
                  className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">{isAm ? 'ሁሉም ሁኔታዎች' : 'All Status'}</option>
                  <option value="active">{isAm ? 'ንቁ (Active)' : 'Active'}</option>
                  <option value="suspended">{isAm ? 'የታገደ (Suspended)' : 'Suspended'}</option>
                </select>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{isAm ? 'ሙሉ ስም' : 'Full Name'}</th>
                      <th>{isAm ? 'ኢሜይል እና ስልክ' : 'Email & Phone'}</th>
                      <th>{isAm ? 'ድርሻ' : 'Role'}</th>
                      <th>{isAm ? 'ሁኔታ' : 'Status'}</th>
                      <th>{isAm ? 'ድርጊት' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((p) => {
                      const isPhoneOnlyAlias = p.email.endsWith('@selamacademy.local');
                      const isSelectedForPerms = p.id === selectedPermissionUserId;
                      return (
                        <tr
                          key={p.id}
                          className={isSelectedForPerms ? 'bg-[#f4faf6]' : ''}
                        >
                          <td className="font-semibold text-[#19362b]">{p.full_name}</td>
                          <td>
                            {!isPhoneOnlyAlias && <div>{p.email}</div>}
                            <small className="text-[#8a9992] font-mono">
                              {p.phone || (isPhoneOnlyAlias ? p.email : '—')}
                            </small>
                          </td>
                          <td>{t.roles[p.role]}</td>
                          <td>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                p.status === 'active'
                                  ? 'bg-[#e9f5ed] text-[#3b805d]'
                                  : 'bg-[#fae9e5] text-[#b34a3c]'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedPermissionUserId(p.id)}
                                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold border transition ${
                                  isSelectedForPerms
                                    ? 'bg-[#073c2f] text-white border-[#073c2f]'
                                    : 'bg-white text-[#23624d] border-[#d9e2dd] hover:border-[#0b6248]'
                                }`}
                              >
                                <Sliders size={12} /> {isAm ? 'ፍቃዶች' : 'Permissions'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAccountStatus(p)}
                                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                                  p.status === 'active'
                                    ? 'bg-[#fae9e5] text-[#b34a3c] hover:bg-[#f6d6cf]'
                                    : 'bg-[#e9f5ed] text-[#277453] hover:bg-[#d6eedf]'
                                }`}
                              >
                                {p.status === 'active' ? (
                                  <>
                                    <UserX size={13} /> {isAm ? 'አግድ' : 'Suspend'}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={13} /> {isAm ? 'ፍቀድ' : 'Activate'}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ICT AUTHORITY & GRANULAR PERMISSIONS MATRIX */}
          {activePermissionProfile && (
            <section className="panel border-2 border-[#cde3d6]">
              <div className="panel-heading border-b border-[#edf1ef] pb-4">
                <div>
                  <p className="eyebrow">
                    {isAm
                      ? 'በአይሲቲ መምሪያ የሚቆጣጠር የመለያ ስልጣን'
                      : 'ICT Authority & Access Governance'}
                  </p>
                  <h2>
                    {isAm
                      ? `የመለያ ፍቃድ እና CRUD ቁጥጥር — ${activePermissionProfile.full_name} (${t.roles[activePermissionProfile.role]})`
                      : `Account Permissions & CRUD Matrix — ${activePermissionProfile.full_name} (${t.roles[activePermissionProfile.role]})`}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs font-semibold"
                    value={selectedPermissionUserId}
                    onChange={(e) => setSelectedPermissionUserId(e.target.value)}
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} — {t.roles[p.role]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={savingPermissions}
                    onClick={handleSavePermissions}
                    className="primary-button"
                  >
                    <Save size={15} />{' '}
                    {savingPermissions
                      ? isAm
                        ? 'በማስቀመጥ ላይ...'
                        : 'Saving...'
                      : isAm
                      ? 'ስልጣን እና ፍቃዶችን አስቀምጥ'
                      : 'Save Account Authority'}
                  </button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                {/* Module CRUD Levels */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#365247]">
                    {isAm
                      ? 'የሞጁል CRUD መዳረሻ ደረጃዎች'
                      : 'Module Access & CRUD Authority Levels'}
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {(
                      [
                        [
                          'students_access',
                          isAm ? 'የተማሪዎች ምዝገባ እና መዝገብ' : 'Students & Enrollment',
                        ],
                        [
                          'staff_access',
                          isAm ? 'የሰራተኞች እና HR አስተዳደር' : 'Staff & HR Directory',
                        ],
                        [
                          'grades_access',
                          isAm ? 'የትምህርት ውጤት እና ምዘና' : 'Grades & Assessments',
                        ],
                        [
                          'attendance_access',
                          isAm ? 'የዕለት ተገኝነት' : 'Daily Attendance',
                        ],
                        [
                          'finance_access',
                          isAm ? 'ፋይናንስ እና ክፍያዎች' : 'Finance & Fee Billing',
                        ],
                        [
                          'property_access',
                          isAm ? 'ንብረት እና ስቶክ አስተዳደር' : 'Property & Stock Inventory',
                        ],
                        [
                          'announcements_access',
                          isAm ? 'ማስታወቂያዎች' : 'School Announcements',
                        ],
                      ] as const
                    ).map(([field, label]) => (
                      <label
                        key={field}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-3 text-xs"
                      >
                        <span className="font-semibold text-[#19362b]">{label}</span>
                        <select
                          className="rounded border border-[#d9e2dd] bg-white px-2 py-1 text-xs font-semibold text-[#073c2f]"
                          value={activePermissions[field]}
                          onChange={(e) =>
                            updateModulePermission(field, e.target.value as AccessLevel)
                          }
                        >
                          <option value="none">
                            {isAm ? 'የተከለከለ (None)' : 'No Access (None)'}
                          </option>
                          <option value="read_only">
                            {isAm ? 'እይታ ብቻ (Read Only)' : 'Read Only (View)'}
                          </option>
                          <option value="create_edit">
                            {isAm ? 'መፍጠርና ማስተካከል (Create/Edit)' : 'Create & Edit'}
                          </option>
                          <option value="full_crud">
                            {isAm ? 'ሙሉ ስልጣን (Full CRUD)' : 'Full CRUD (+ Delete)'}
                          </option>
                        </select>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specific Action Permissions */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#365247]">
                    {isAm
                      ? 'ልዩ የተግባር ፍቃዶች (Actions & Comments)'
                      : 'Action & Communication Authorities'}
                  </h3>
                  <div className="space-y-2.5">
                    {(
                      [
                        [
                          'can_comment_feedback',
                          isAm
                            ? 'በአስተያየቶች ላይ መጻፍ እና ምላሽ መስጠት'
                            : 'Comment & Reply on Parent Feedback',
                        ],
                        [
                          'can_send_messages',
                          isAm
                            ? 'ቀጥታ መልዕክቶችን መላክ (Messaging)'
                            : 'Send Direct Family / Teacher Messages',
                        ],
                        [
                          'can_verify_receipts',
                          isAm
                            ? 'የባንክ እና ቴሌብር ደረሰኝ ማረጋገጥ'
                            : 'Verify Bank & Telebirr Receipts',
                        ],
                        [
                          'can_publish_grades',
                          isAm
                            ? 'የተማሪዎችን ውጤት ለወላጆች መልቀቅ'
                            : 'Publish Student Grades to Families',
                        ],
                        [
                          'can_export_data',
                          isAm
                            ? 'መረጃዎችን በCSV ማውረድ (Export)'
                            : 'Export School Data (CSV)',
                        ],
                      ] as const
                    ).map(([flag, label]) => {
                      const enabled = activePermissions[flag];
                      return (
                        <button
                          key={flag}
                          type="button"
                          onClick={() => toggleActionPermission(flag)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs transition ${
                            enabled
                              ? 'border-[#b8d9c5] bg-[#eff8f2] text-[#073c2f]'
                              : 'border-[#e4ebe7] bg-white text-[#71847b]'
                          }`}
                        >
                          <span className="font-semibold">{label}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              enabled
                                ? 'bg-[#0b6248] text-white'
                                : 'bg-[#edf2ef] text-[#71847b]'
                            }`}
                          >
                            {enabled ? (
                              <>
                                <CheckCircle2 size={11} /> Allowed
                              </>
                            ) : (
                              <>
                                <Lock size={11} /> Blocked
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 2: FAMILY-TO-STUDENT LINKING */}
      {activeNavIndex === 2 && (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የወላጅ መዳረሻ' : 'Privacy Mapping'}</p>
                <h2>{isAm ? 'ወላጅ እና ተማሪ አገናኝ' : 'Link Family to Student'}</h2>
              </div>
            </div>
            <form onSubmit={handleLinkStudent} className="space-y-3 text-xs">
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'የወላጅ / ቤተሰብ መለያ ይምረጡ' : 'Select Parent Account'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                  value={linkForm.parent_id}
                  onChange={(e) => setLinkForm({ ...linkForm, parent_id: e.target.value })}
                  required
                >
                  <option value="">
                    {isAm ? '-- የወላጅ መለያ ይምረጡ --' : '-- Choose Parent Account --'}
                  </option>
                  {parentAccounts.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.full_name} (
                      {parent.phone ||
                        (parent.email.endsWith('@selamacademy.local')
                          ? 'Phone Account'
                          : parent.email)}
                      )
                    </option>
                  ))}
                </select>
              </label>

              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ተማሪ ይምረጡ' : 'Select Enrolled Student'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                  value={linkForm.student_id}
                  onChange={(e) => setLinkForm({ ...linkForm, student_id: e.target.value })}
                  required
                >
                  <option value="">
                    {isAm ? '-- ተማሪ ይምረጡ --' : '-- Choose Student --'}
                  </option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.student_id} — {stu.full_name} (Grade {stu.grade} {stu.section})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ዝምድና' : 'Relationship'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                  value={linkForm.relationship}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, relationship: e.target.value })
                  }
                >
                  <option value="Father">{isAm ? 'አባት (Father)' : 'Father'}</option>
                  <option value="Mother">{isAm ? 'እናት (Mother)' : 'Mother'}</option>
                  <option value="Guardian">{isAm ? 'አሳዳጊ (Guardian)' : 'Guardian'}</option>
                </select>
              </label>

              <button type="submit" className="primary-button w-full">
                <Plus size={15} /> {isAm ? 'ትስስሩን አረጋግጥ' : 'Link Student to Family'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የተገናኙ ቤተሰቦች' : 'Verified Permissions'}</p>
                <h2>
                  {isAm
                    ? 'የወላጅ እና ተማሪ ትስስር ዝርዝር'
                    : 'Linked Parent-Student Relationships'}
                </h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{isAm ? 'ወላጅ / ቤተሰብ' : 'Parent Account'}</th>
                    <th>{isAm ? 'ተማሪ' : 'Linked Student'}</th>
                    <th>{isAm ? 'ክፍል' : 'Class'}</th>
                    <th>{isAm ? 'ዝምድና' : 'Relationship'}</th>
                    <th>{isAm ? 'ድርጊት' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((lnk) => {
                    const parent = profiles.find((p) => p.id === lnk.parent_id);
                    const student = students.find((s) => s.id === lnk.student_id);
                    return (
                      <tr key={lnk.id}>
                        <td>
                          <div className="font-semibold text-[#19362b]">
                            {parent?.full_name || lnk.parent_id}
                          </div>
                          <small className="text-[#8a9992]">
                            {parent?.phone || parent?.email}
                          </small>
                        </td>
                        <td>
                          <div className="font-semibold text-[#19362b]">
                            {student?.full_name || lnk.student_id}
                          </div>
                          <small className="text-[#8a9992]">{student?.student_id}</small>
                        </td>
                        <td>
                          {student ? `${student.grade} ${student.section}` : '—'}
                        </td>
                        <td>
                          <span className="status active">
                            {lnk.relationship || 'Guardian'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleUnlinkStudent(lnk.id)}
                            className="rounded p-1.5 text-[#b34a3c] hover:bg-[#fae9e5]"
                            title="Unlink"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: AUDIT ACTIVITY */}
      {activeNavIndex === 3 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'የደህንነት መዝገብ' : 'Security & Compliance'}</p>
              <h2>{isAm ? 'የሲስተም እንቅስቃሴ እና ኦዲት' : 'System Activity & Security Audit'}</h2>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-3.5">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-[#277453]" />
                <div>
                  <b className="text-[#19362b]">
                    {isAm
                      ? 'የRow-Level Security (RLS) እና ICT CRUD ፖሊሲዎች ንቁ ናቸው'
                      : 'Row-Level Security (RLS) & ICT Permission Policies Enforced'}
                  </b>
                  <p className="text-[#71847b]">
                    {isAm
                      ? 'የተማሪ ምዝገባ እና የሰራተኛ ቅጥር በሬጅስትራር ብቻ ይከናወናል፤ ሁሉም ስልጣኖች በአይሲቲ መምሪያ ይቆጣጠራሉ።'
                      : 'Student enrollment and staff HR CRUD are restricted to Registrar; all account authorities are governed by ICT.'}
                  </p>
                </div>
              </div>
              <span className="status active">Verified</span>
            </div>

            {profiles.map((p) => {
              const perms =
                permissionsMap[p.id] || getDefaultPermissionsForRole(p.id, p.role);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e4ebe7] p-3.5"
                >
                  <div>
                    <b className="text-[#19362b]">{p.full_name}</b>{' '}
                    <span className="text-[#8a9992]">({p.phone || p.email})</span>
                    <p className="text-[#71847b]">
                      {t.roles[p.role]} · Students: <b>{perms.students_access}</b> · Staff:{' '}
                      <b>{perms.staff_access}</b> · Finance: <b>{perms.finance_access}</b> ·
                      Property: <b>{perms.property_access}</b>
                    </p>
                  </div>
                  <small className="text-[#9aa8a2]">
                    {new Date(p.updated_at || p.created_at).toLocaleString()}
                  </small>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: DATA EXPORTS */}
      {activeNavIndex === 4 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'መረጃ ማውጫ' : 'Backup & Reporting'}</p>
              <h2>{isAm ? 'የትምህርት ቤቱን መረጃዎች በCSV ያውርዱ' : 'Export School Data (CSV)'}</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#e4ebe7] bg-[#fbfcfb] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#e3f1e9] text-[#277453]">
                  <ClipboardCheck size={20} />
                </div>
                <h3 className="text-sm font-bold text-[#19362b]">
                  {isAm ? 'የተማሪዎች ዝርዝር (Roster)' : 'Student Directory CSV'}
                </h3>
                <p className="mt-1 text-xs text-[#71847b]">
                  {isAm
                    ? `${students.length} የተመዘገቡ ተማሪዎችን ከወላጅ ስልክ እና ክፍለ ከተማ ጋር ያውርዱ።`
                    : `Export all ${students.length} student records including grade, section, guardian phone, and Hawassa sub-city.`}
                </p>
              </div>
              <button type="button" onClick={exportStudentsCsv} className="primary-button w-full">
                <Download size={15} /> {isAm ? 'የተማሪዎችን ዝርዝር አውርድ' : 'Download Students CSV'}
              </button>
            </div>

            <div className="rounded-xl border border-[#e4ebe7] bg-[#fbfcfb] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf0d9] text-[#aa7623]">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-sm font-bold text-[#19362b]">
                  {isAm ? 'የተጠቃሚ መለያዎች ዝርዝር' : 'User Accounts CSV'}
                </h3>
                <p className="mt-1 text-xs text-[#71847b]">
                  {isAm
                    ? `${profiles.length} የወላጅ፣ የመምህር እና የአስተዳደር መለያዎችን ያውርዱ።`
                    : `Export all ${profiles.length} provisioned portal accounts with role and active/suspended status.`}
                </p>
              </div>
              <button type="button" onClick={exportAccountsCsv} className="secondary-button w-full">
                <Download size={15} /> {isAm ? 'መለያዎችን አውርድ' : 'Download Accounts CSV'}
              </button>
            </div>

            <div className="rounded-xl border border-[#e4ebe7] bg-[#fbfcfb] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#e4f0f5] text-[#397b98]">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-bold text-[#19362b]">
                  {isAm ? 'የሰራተኞች እና መምህራን ዝርዝር' : 'Staff & Payroll Roster CSV'}
                </h3>
                <p className="mt-1 text-xs text-[#71847b]">
                  {isAm
                    ? `የሰላም አካዳሚ መምህራን እና ሰራተኞች ዝርዝር (${grades.length} የውጤት መዝገቦች አሉ)።`
                    : `Export teaching and non-teaching staff roster (${grades.length} grade entries recorded).`}
                </p>
              </div>
              <button type="button" onClick={exportStaffCsv} className="secondary-button w-full">
                <Download size={15} /> {isAm ? 'የሰራተኞችን ዝርዝር አውርድ' : 'Download Staff CSV'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}