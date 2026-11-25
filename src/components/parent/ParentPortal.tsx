import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  supabase,
  type Announcement,
  type AttendanceRecord,
  type FeeRecord,
  type GradeRecord,
  type MessageRecord,
  type ParentFeedback,
  type Profile,
  type Student,
  type Subject,
} from '../../lib/supabase';
import { translations, type Language } from '../../lib/i18n';
import type { PortalUser } from '../../App';

const fallbackChildren: Student[] = [
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

const fallbackGrades: GradeRecord[] = [
  {
    id: 'g-1',
    student_id: '33333333-3333-3333-3333-333333333301',
    subject_id: '44444444-4444-4444-4444-444444444401',
    semester: '1',
    quiz: 9,
    quiz_scores: [4.5, 4.5],
    assignment: 14,
    assignment_scores: [7, 7],
    mid_exam: 22,
    final_exam: 45,
    conduct: 'A',
    remarks: 'Excellent progress',
    published: true,
    teacher_id: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'g-2',
    student_id: '33333333-3333-3333-3333-333333333301',
    subject_id: '44444444-4444-4444-4444-444444444402',
    semester: '1',
    quiz: 8,
    quiz_scores: [8],
    assignment: 13,
    assignment_scores: [13],
    mid_exam: 20,
    final_exam: 41,
    conduct: 'B',
    remarks: 'Good participation in class',
    published: true,
    teacher_id: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'g-3',
    student_id: '33333333-3333-3333-3333-333333333301',
    subject_id: '44444444-4444-4444-4444-444444444403',
    semester: '1',
    quiz: 10,
    quiz_scores: [10],
    assignment: 14,
    assignment_scores: [14],
    mid_exam: 23,
    final_exam: 47,
    conduct: 'A',
    remarks: 'Strong lab work',
    published: true,
    teacher_id: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'g-4',
    student_id: '33333333-3333-3333-3333-333333333302',
    subject_id: '44444444-4444-4444-4444-444444444401',
    semester: '1',
    quiz: 8,
    quiz_scores: [8],
    assignment: 12,
    assignment_scores: [12],
    mid_exam: 20,
    final_exam: 42,
    conduct: 'B',
    remarks: 'Good work',
    published: true,
    teacher_id: '11111111-1111-1111-1111-111111111103',
  },
];

const fallbackAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    student_id: '33333333-3333-3333-3333-333333333301',
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
    note: null,
    recorded_by: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'att-2',
    student_id: '33333333-3333-3333-3333-333333333301',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    status: 'present',
    note: null,
    recorded_by: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'att-3',
    student_id: '33333333-3333-3333-3333-333333333301',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    status: 'late',
    note: 'Arrived 10 minutes late due to morning rain',
    recorded_by: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'att-4',
    student_id: '33333333-3333-3333-3333-333333333302',
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
    note: null,
    recorded_by: '11111111-1111-1111-1111-111111111103',
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
    student_id: '33333333-3333-3333-3333-333333333301',
    description: 'Transport — Semester 1',
    amount_due: 3000,
    amount_paid: 3000,
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
  },
  {
    id: 'fee-3',
    student_id: '33333333-3333-3333-3333-333333333302',
    description: 'Semester 1 Tuition',
    amount_due: 10000,
    amount_paid: 5000,
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
  },
  {
    id: 'fee-4',
    student_id: '33333333-3333-3333-3333-333333333302',
    description: 'Transport — Semester 1',
    amount_due: 3000,
    amount_paid: 0,
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
  },
];

const fallbackTeachers: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>[] = [
  {
    id: '11111111-1111-1111-1111-111111111103',
    full_name: 'Tigist Alemu',
    email: 'teacher@selamacademy.edu.et',
    role: 'teacher',
  },
];

const fallbackMessages: MessageRecord[] = [
  {
    id: 'msg-1',
    sender_id: '11111111-1111-1111-1111-111111111103',
    recipient_id: '11111111-1111-1111-1111-111111111104',
    student_id: '33333333-3333-3333-3333-333333333301',
    body: 'Hello Mr. Kedir, Hanan is doing very well in Mathematics this semester. Keep encouraging her at home.',
    read: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: 'msg-2',
    sender_id: '11111111-1111-1111-1111-111111111104',
    recipient_id: '11111111-1111-1111-1111-111111111103',
    student_id: '33333333-3333-3333-3333-333333333301',
    body: 'Thank you Ms. Tigist, we are very happy to hear this. We will keep supporting her.',
    read: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
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
    subject: 'Request for extra English tutoring',
    category: 'Academic',
    body: 'My daughter Hanan could benefit from extra English practice after school. Is there a club or tutoring available?',
    status: 'resolved',
    response:
      'Thank you for the suggestion. We have started an after-school English club on Wednesdays 3:30-4:30 PM. Hanan is welcome to join.',
    responded_by: '11111111-1111-1111-1111-111111111101',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'fb-2',
    parent_id: '11111111-1111-1111-1111-111111111104',
    subject: 'Library opening hours',
    category: 'Facilities',
    body: 'Could the library stay open until 5 PM? Many parents pick up children after work.',
    status: 'submitted',
    response: null,
    responded_by: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

function computeLetterGrade(total: number): string {
  if (total >= 90) return 'A+';
  if (total >= 85) return 'A';
  if (total >= 80) return 'B+';
  if (total >= 75) return 'B';
  if (total >= 65) return 'C+';
  if (total >= 50) return 'C';
  return 'F';
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

export function ParentPortal({
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

  const [children, setChildren] = useState<Student[]>(fallbackChildren);
  const [selectedChildId, setSelectedChildId] = useState<string>(fallbackChildren[0].id);
  const [subjects, setSubjects] = useState<Subject[]>(fallbackSubjects);
  const [grades, setGrades] = useState<GradeRecord[]>(fallbackGrades);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(fallbackAttendance);
  const [fees, setFees] = useState<FeeRecord[]>(fallbackFees);
  const [teachers, setTeachers] = useState<
    Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>[]
  >(fallbackTeachers);
  const [messages, setMessages] = useState<MessageRecord[]>(fallbackMessages);
  const [announcements, setAnnouncements] = useState<Announcement[]>(fallbackAnnouncements);
  const [feedbackList, setFeedbackList] = useState<ParentFeedback[]>(fallbackFeedback);

  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>('1');
  const [reportCardOpen, setReportCardOpen] = useState(false);
  const [toast, setToast] = useState('');

  // Teacher Messaging State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    '11111111-1111-1111-1111-111111111103'
  );
  const [messageInput, setMessageInput] = useState('');

  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    category: 'Academic',
    subject: '',
    body: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3400);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadParentPortalData = async () => {
      // 1. Load linked students for this parent
      const { data: linksData } = await supabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_id', user.id);

      const linkedStudentIds = (linksData || []).map((l) => l.student_id);

      if (linkedStudentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .in('id', linkedStudentIds)
          .order('student_id', { ascending: true });

        if (studentsData && studentsData.length > 0) {
          const loadedKids = studentsData as Student[];
          setChildren(loadedKids);
          setSelectedChildId(loadedKids[0].id);
        }

        const [gradesRes, attRes, feesRes] = await Promise.all([
          supabase
            .from('grades')
            .select('*')
            .in('student_id', linkedStudentIds)
            .eq('published', true),
          supabase
            .from('attendance')
            .select('*')
            .in('student_id', linkedStudentIds)
            .order('date', { ascending: false }),
          supabase.from('fee_records').select('*').in('student_id', linkedStudentIds),
        ]);

        if (gradesRes.data) setGrades(gradesRes.data as GradeRecord[]);
        if (attRes.data) setAttendance(attRes.data as AttendanceRecord[]);
        if (feesRes.data) setFees(feesRes.data as FeeRecord[]);
      }

      const [subjectsRes, messagesRes, annRes, feedbackRes] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true }),
        supabase
          .from('announcements')
          .select('*')
          .in('audience', ['all', 'parents'])
          .order('created_at', { ascending: false }),
        supabase
          .from('parent_feedback')
          .select('*')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
      if (messagesRes.data) {
        const loadedMsgs = messagesRes.data as MessageRecord[];
        setMessages(loadedMsgs);
        // Resolve teacher IDs from messages or grades
        const teacherIds = new Set<string>(['11111111-1111-1111-1111-111111111103']);
        loadedMsgs.forEach((m) => {
          if (m.sender_id !== user.id) teacherIds.add(m.sender_id);
          if (m.recipient_id !== user.id) teacherIds.add(m.recipient_id);
        });
        const { data: teacherProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', Array.from(teacherIds));
        if (teacherProfiles && teacherProfiles.length > 0) {
          setTeachers(teacherProfiles as Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>[]);
          setSelectedTeacherId(teacherProfiles[0].id);
        }
      }
      if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
      if (feedbackRes.data) setFeedbackList(feedbackRes.data as ParentFeedback[]);
    };

    loadParentPortalData();
  }, [user.id]);

  const activeChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) || children[0],
    [children, selectedChildId]
  );

  // Published Grades for Active Child & Selected Semester
  const childSemesterGrades = useMemo(() => {
    if (!activeChild) return [];
    return grades
      .filter(
        (g) =>
          g.student_id === activeChild.id &&
          g.semester === selectedSemester &&
          g.published
      )
      .map((g) => {
        const subject = subjects.find((s) => s.id === g.subject_id);
        const total =
          Math.round(
            (Number(g.quiz || 0) +
              Number(g.assignment || 0) +
              Number(g.mid_exam || 0) +
              Number(g.final_exam || 0)) *
              100
          ) / 100;
        return {
          ...g,
          subjectName: subject?.name || 'Subject',
          subjectCode: subject?.code || '',
          total,
          letter: computeLetterGrade(total),
        };
      });
  }, [activeChild, grades, selectedSemester, subjects]);

  const semesterAverage = useMemo(() => {
    if (childSemesterGrades.length === 0) return 0;
    const sum = childSemesterGrades.reduce((acc, item) => acc + item.total, 0);
    return Math.round((sum / childSemesterGrades.length) * 10) / 10;
  }, [childSemesterGrades]);

  const overallConduct = useMemo(() => {
    if (childSemesterGrades.length === 0) return 'A';
    const conducts = childSemesterGrades.map((g) => g.conduct || 'A');
    if (conducts.includes('D')) return 'D';
    if (conducts.includes('C')) return 'C';
    if (conducts.includes('B')) return 'B';
    return 'A';
  }, [childSemesterGrades]);

  // Attendance for Active Child
  const childAttendance = useMemo(() => {
    if (!activeChild) return [];
    return attendance.filter((a) => a.student_id === activeChild.id);
  }, [attendance, activeChild]);

  const attendanceRate = useMemo(() => {
    if (childAttendance.length === 0) return '100%';
    const presentOrLate = childAttendance.filter(
      (a) => a.status === 'present' || a.status === 'late'
    ).length;
    return `${((presentOrLate / childAttendance.length) * 100).toFixed(1)}%`;
  }, [childAttendance]);

  // Fees for Active Child
  const childFees = useMemo(() => {
    if (!activeChild) return [];
    return fees.filter((f) => f.student_id === activeChild.id);
  }, [fees, activeChild]);

  const childFeeSummary = useMemo(() => {
    const due = childFees.reduce((acc, f) => acc + Number(f.amount_due || 0), 0);
    const paid = childFees.reduce((acc, f) => acc + Number(f.amount_paid || 0), 0);
    return { due, paid, balance: Math.max(0, due - paid) };
  }, [childFees]);

  // Messages for Active Child & Selected Teacher
  const childMessages = useMemo(() => {
    if (!activeChild) return [];
    return messages.filter(
      (m) =>
        m.student_id === activeChild.id &&
        (m.sender_id === selectedTeacherId || m.recipient_id === selectedTeacherId)
    );
  }, [messages, activeChild, selectedTeacherId]);

  const handleSendMessageToTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChild || !selectedTeacherId) return;

    const payload = {
      sender_id: user.id,
      recipient_id: selectedTeacherId,
      student_id: activeChild.id,
      body: messageInput.trim(),
      read: false,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('messages')
        .insert([payload])
        .select()
        .single();

      if (error) {
        showToast(error.message);
        return;
      }
      if (data) {
        setMessages((prev) => [...prev, data as MessageRecord]);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...payload,
        },
      ]);
    }

    setMessageInput('');
    showToast(isAm ? 'መልዕክትዎ ለመምህሩ ተልኳል።' : 'Message sent to teacher.');
  };

  // Submit Feedback to School Management
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.subject.trim() || !feedbackForm.body.trim()) return;

    const payload = {
      parent_id: user.id,
      category: feedbackForm.category,
      subject: feedbackForm.subject.trim(),
      body: feedbackForm.body.trim(),
      status: 'submitted' as const,
      response: null,
      responded_by: null,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('parent_feedback')
        .insert([payload])
        .select()
        .single();

      if (error) {
        showToast(error.message);
        return;
      }
      if (data) {
        setFeedbackList((prev) => [data as ParentFeedback, ...prev]);
      }
    } else {
      setFeedbackList((prev) => [
        {
          id: `fb-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...payload,
        },
        ...prev,
      ]);
    }

    setFeedbackForm({ category: 'Academic', subject: '', body: '' });
    showToast(
      isAm
        ? 'አስተያየትዎ ለሰላም አካዳሚ አስተዳደር ተልኳል።'
        : 'Feedback submitted to Selam Academy management.'
    );
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#073c2f] px-4 py-3 text-xs font-semibold text-white shadow-lg no-print">
          <CheckCircle2 size={16} className="text-[#e4b65e]" />
          <span>{toast}</span>
        </div>
      )}

      {/* CHILD SWITCHER BAR (Visible across all Parent tabs) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe4df] bg-white px-4 py-3 no-print">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#547268]">
          <ShieldCheck size={16} className="text-[#0b6248]" />
          <span>
            {isAm ? 'የተመዘገቡ ልጆችዎ (የግል መረጃ)፡' : 'Viewing private student record:'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {children.map((child) => {
            const selected = child.id === activeChild?.id;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  selected
                    ? 'bg-[#073c2f] text-white shadow-sm'
                    : 'bg-[#f4f7f5] text-[#365247] hover:bg-[#e5eee9]'
                }`}
              >
                <GraduationCap size={14} />
                <span>{child.full_name}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    selected ? 'bg-white/15 text-[#e4b65e]' : 'bg-white text-[#71847b]'
                  }`}
                >
                  {isAm ? `ክፍል ${child.grade} ${child.section}` : `Grade ${child.grade} ${child.section}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 0: FAMILY OVERVIEW */}
      {activeNavIndex === 0 && activeChild && (
        <>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                {isAm ? 'የቤተሰብ የግል መለያ' : 'Private Family Account'} · {activeChild.student_id}
              </p>
              <h1>
                {t.dashboard.welcome}, {user.name.split(' ')[0]}.
              </h1>
              <p className="subtle">
                {isAm
                  ? `የ${activeChild.full_name} (ክፍል ${activeChild.grade} ${activeChild.section}) የትምህርት ውጤት፣ ስነ-ምግባር እና ተገኝነት።`
                  : `Tracking ${activeChild.full_name} (Grade ${activeChild.grade} ${activeChild.section}) — academics, conduct, and attendance.`}
              </p>
            </div>
            <button className="primary-button" onClick={() => setReportCardOpen(true)}>
              <Printer size={16} />{' '}
              {isAm ? 'ሪፖርት ካርድ አትም' : 'Print Official Report Card'}
            </button>
          </div>

          <div className="stat-grid">
            <StatCard
              label={
                isAm
                  ? `የ${activeChild.full_name.split(' ')[0]} አማካይ ውጤት`
                  : `${activeChild.full_name.split(' ')[0]}’s Semester Avg`
              }
              value={childSemesterGrades.length > 0 ? `${semesterAverage}%` : 'Pending'}
              detail={
                isAm
                  ? `ሴሚስተር ${selectedSemester} · ${childSemesterGrades.length} ትምህርቶች`
                  : `Semester ${selectedSemester} · ${childSemesterGrades.length} published subjects`
              }
              icon={GraduationCap}
              accent="green"
            />
            <StatCard
              label={isAm ? 'ስነ-ምግባር (Conduct)' : 'Conduct / Manner'}
              value={`Grade ${overallConduct}`}
              detail={
                overallConduct === 'A'
                  ? isAm
                    ? 'በጣም ጥሩ ስነ-ምግባር'
                    : 'Exemplary school conduct'
                  : isAm
                  ? 'ጥሩ ስነ-ምግባር'
                  : 'Good classroom behavior'
              }
              icon={UserCheck}
              accent="gold"
            />
            <StatCard
              label={isAm ? 'የተገኝነት መጠን' : 'Attendance Rate'}
              value={attendanceRate}
              detail={
                isAm
                  ? `${childAttendance.length} የተመዘገቡ ቀናት`
                  : `Across ${childAttendance.length} recorded days`
              }
              icon={CalendarDays}
              accent="blue"
            />
            <StatCard
              label={isAm ? 'ቀሪ የትምህርት ቤት ክፍያ' : 'Fee Balance Due'}
              value={`${childFeeSummary.balance.toLocaleString()} ETB`}
              detail={
                isAm
                  ? `የተከፈለ፡ ${childFeeSummary.paid.toLocaleString()} ETB`
                  : `Paid: ${childFeeSummary.paid.toLocaleString()} ETB`
              }
              icon={CircleDollarSign}
              accent="rose"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isAm ? 'የቅርብ ጊዜ ውጤቶች' : 'Academic Snapshot'}</p>
                  <h2>
                    {isAm
                      ? `የ${activeChild.full_name} የትምህርት ውጤቶች`
                      : `${activeChild.full_name}’s Published Subjects`}
                  </h2>
                </div>
                <button className="text-button" onClick={() => onNavigate(1)}>
                  {isAm ? 'ሙሉ ዝርዝር →' : 'Full grade sheet →'}
                </button>
              </div>
              {childSemesterGrades.length === 0 ? (
                <div className="empty-content">
                  <p>
                    {isAm
                      ? 'ለዚህ ሴሚስተር የተለቀቀ ውጤት ገና የለም።'
                      : 'No published grades available for this semester yet.'}
                  </p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{isAm ? 'የትምህርት ዓይነት' : 'Subject'}</th>
                        <th>{isAm ? 'ድምር (100%)' : 'Total'}</th>
                        <th>{isAm ? 'ደረጃ' : 'Grade'}</th>
                        <th>{isAm ? 'ስነ-ምግባር' : 'Conduct'}</th>
                        <th>{isAm ? 'የመምህር አስተያየት' : 'Teacher Remark'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {childSemesterGrades.map((g) => (
                        <tr key={g.id}>
                          <td className="font-semibold text-[#19362b]">{g.subjectName}</td>
                          <td className="font-bold text-[#073c2f]">{g.total}%</td>
                          <td>
                            <span className="status active">{g.letter}</span>
                          </td>
                          <td className="font-bold">{g.conduct || 'A'}</td>
                          <td className="text-[#587066]">{g.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isAm ? 'የትምህርት ቤት ማስታወቂያዎች' : 'School Updates'}</p>
                  <h2>{isAm ? 'ለወላጆች የተላኩ ማስታወቂያዎች' : 'Notices for Families'}</h2>
                </div>
                <Bell size={18} className="gold-icon" />
              </div>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="notice-card">
                    <span className="notice-mark">
                      <Bell size={16} />
                    </span>
                    <div>
                      <b>{ann.title}</b>
                      <p>{ann.body}</p>
                      <small>{new Date(ann.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {/* TAB 1: ACADEMIC RESULTS & REPORT CARD */}
      {activeNavIndex === 1 && activeChild && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {activeChild.full_name} · {activeChild.student_id} · Grade {activeChild.grade}{' '}
                {activeChild.section}
              </p>
              <h2>
                {isAm
                  ? 'የትምህርት ውጤት ዝርዝር እና ሪፖርት ካርድ'
                  : 'Academic Results & Assessment Breakdown'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
              >
                <option value="1">{isAm ? '1ኛ ሴሚስተር' : 'Semester 1'}</option>
                <option value="2">{isAm ? '2ኛ ሴሚስተር' : 'Semester 2'}</option>
              </select>
              <button
                type="button"
                className="primary-button"
                onClick={() => setReportCardOpen(true)}
              >
                <Printer size={15} />{' '}
                {isAm ? 'ኦፊሴላዊ ሪፖርት ካርድ አትም' : 'Print Report Card'}
              </button>
            </div>
          </div>

          {childSemesterGrades.length === 0 ? (
            <div className="empty-content">
              <span className="empty-icon">
                <BookOpen size={24} />
              </span>
              <h3>
                {isAm
                  ? 'ለዚህ ሴሚስተር የተለቀቀ ውጤት አልተገኘም'
                  : 'No published results for this semester yet'}
              </h3>
              <p>
                {isAm
                  ? 'መምህራን ውጤቶችን ሲያጸድቁ እዚህ ይታያሉ።'
                  : 'Results will appear here as soon as teachers publish them.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{isAm ? 'የትምህርት ዓይነት' : 'Subject'}</th>
                      <th>{isAm ? 'ኩዊዞች (Quizzes)' : 'Quizzes Breakdown'}</th>
                      <th>{isAm ? 'አሳይመንት (Assignments)' : 'Assignments Breakdown'}</th>
                      <th>{isAm ? 'ሚድ ፈተና' : 'Mid Exam'}</th>
                      <th>{isAm ? 'ፋይናል ፈተና' : 'Final Exam'}</th>
                      <th>{isAm ? 'ጠቅላላ (100%)' : 'Total'}</th>
                      <th>{isAm ? 'ደረጃ' : 'Grade'}</th>
                      <th>{isAm ? 'ስነ-ምግባር' : 'Conduct'}</th>
                      <th>{isAm ? 'የመምህር አስተያየት' : 'Teacher Remarks'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childSemesterGrades.map((g) => {
                      const qBreakdown =
                        Array.isArray(g.quiz_scores) && g.quiz_scores.length > 0
                          ? g.quiz_scores.map((s, i) => `Q${i + 1}: ${s}`).join(', ')
                          : `${g.quiz}`;
                      const aBreakdown =
                        Array.isArray(g.assignment_scores) && g.assignment_scores.length > 0
                          ? g.assignment_scores.map((s, i) => `A${i + 1}: ${s}`).join(', ')
                          : `${g.assignment}`;

                      return (
                        <tr key={g.id}>
                          <td>
                            <div className="font-semibold text-[#19362b]">{g.subjectName}</div>
                            <small className="text-[#8a9992]">{g.subjectCode}</small>
                          </td>
                          <td>
                            <div className="font-semibold text-[#19362b]">{g.quiz}</div>
                            <small className="text-[#71847b]">{qBreakdown}</small>
                          </td>
                          <td>
                            <div className="font-semibold text-[#19362b]">{g.assignment}</div>
                            <small className="text-[#71847b]">{aBreakdown}</small>
                          </td>
                          <td>{g.mid_exam}</td>
                          <td>{g.final_exam}</td>
                          <td>
                            <strong className="text-sm text-[#073c2f]">{g.total}</strong>
                          </td>
                          <td>
                            <span className="status active">{g.letter}</span>
                          </td>
                          <td className="font-bold text-[#aa7623]">{g.conduct || 'A'}</td>
                          <td className="max-w-[220px] text-[#587066]">
                            {g.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dbe4df] bg-[#f8fbf9] p-4 text-xs">
                <div>
                  <span className="text-[#71847b]">
                    {isAm ? 'የሴሚስተር አማካይ ውጤት፡ ' : 'Semester Average: '}
                  </span>
                  <strong className="text-base text-[#073c2f]">{semesterAverage}%</strong>
                </div>
                <div>
                  <span className="text-[#71847b]">
                    {isAm ? 'አጠቃላይ ስነ-ምግባር፡ ' : 'Overall Conduct / Manner: '}
                  </span>
                  <strong className="text-sm text-[#aa7623]">Grade {overallConduct}</strong>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* TAB 2: MANNER, CONDUCT & ATTENDANCE FEED */}
      {activeNavIndex === 2 && activeChild && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የዕለት ክትትል' : 'Attendance History'}</p>
                <h2>
                  {isAm
                    ? `የ${activeChild.full_name} የተገኝነት መዝገብ`
                    : `${activeChild.full_name}’s Daily Attendance`}
                </h2>
              </div>
              <span className="status active">{attendanceRate}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{isAm ? 'ቀን' : 'Date'}</th>
                    <th>{isAm ? 'ሁኔታ' : 'Status'}</th>
                    <th>{isAm ? 'የመምህር ማስታወሻ' : 'Teacher Note'}</th>
                  </tr>
                </thead>
                <tbody>
                  {childAttendance.map((att) => (
                    <tr key={att.id}>
                      <td className="font-mono text-xs">{att.date}</td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            att.status === 'present'
                              ? 'bg-[#e9f5ed] text-[#3b805d]'
                              : att.status === 'absent'
                              ? 'bg-[#fae9e5] text-[#b34a3c]'
                              : 'bg-[#faead0] text-[#a9691f]'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="text-[#587066]">{att.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'ባህሪ እና ተሳትፎ' : 'Behavioral & Manner Notes'}</p>
                <h2>
                  {isAm
                    ? 'የመምህራን የስነ-ምግባር ግምገማ'
                    : 'Subject Conduct & Teacher Remarks'}
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {childSemesterGrades.map((g) => (
                <div
                  key={g.id}
                  className="rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <b className="text-[#19362b]">{g.subjectName}</b>
                    <span className="rounded bg-[#fbf0d9] px-2.5 py-0.5 text-[10px] font-bold text-[#aa7623]">
                      {isAm ? 'ስነ-ምግባር፡' : 'Conduct:'} {g.conduct || 'A'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[#587066]">
                    {g.remarks ||
                      (isAm
                        ? 'ምንም ልዩ አስተያየት አልተጻፈም።'
                        : 'No additional behavioral remark recorded.')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: DIRECT TEACHER MESSAGING */}
      {activeNavIndex === 3 && activeChild && (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <section className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'መምህራን' : 'School Faculty'}</p>
                <h2>{isAm ? 'መምህር ይምረጡ' : 'Select Teacher'}</h2>
              </div>
            </div>
            <div className="space-y-2">
              {teachers.map((teacher) => {
                const selected = teacher.id === selectedTeacherId;
                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    className={`w-full rounded-lg border p-3 text-left text-xs transition ${
                      selected
                        ? 'border-[#0b6248] bg-[#eff8f2]'
                        : 'border-[#e4ebe7] bg-white hover:border-[#9dc2b4]'
                    }`}
                  >
                    <b className="text-[#19362b]">{teacher.full_name}</b>
                    <p className="mt-0.5 text-[11px] text-[#71847b]">{teacher.email}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel flex flex-col justify-between min-h-[440px]">
            <div>
              <div className="panel-heading border-b border-[#edf1ef] pb-4">
                <div>
                  <p className="eyebrow">
                    {isAm
                      ? `ስለ ${activeChild.full_name} የግል ውይይት`
                      : `Private Thread Regarding ${activeChild.full_name}`}
                  </p>
                  <h2>
                    {teachers.find((tItem) => tItem.id === selectedTeacherId)?.full_name ||
                      'Teacher'}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto py-3">
                {childMessages.length === 0 ? (
                  <p className="text-xs text-[#82928a] py-8 text-center">
                    {isAm
                      ? 'ስለ ልጅዎ ትምህርት ወይም ስነ-ምግባር ለመምህሩ መልዕክት ይላኩ።'
                      : 'No messages in this thread yet. Send a message to your child’s teacher below.'}
                  </p>
                ) : (
                  childMessages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] rounded-xl px-4 py-3 text-xs ${
                          isMine
                            ? 'ml-auto bg-[#073c2f] text-white'
                            : 'mr-auto bg-[#f0f5f2] text-[#19362b]'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.body}</p>
                        <small
                          className={`mt-1.5 text-[9px] ${
                            isMine ? 'text-[#9bbdb0]' : 'text-[#82928a]'
                          }`}
                        >
                          {isMine ? (isAm ? 'እርስዎ' : 'You') : 'Teacher'} ·{' '}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <form
              onSubmit={handleSendMessageToTeacher}
              className="mt-4 flex gap-2 border-t border-[#edf1ef] pt-4"
            >
              <input
                className="flex-1 rounded-lg border border-[#d9e2dd] px-3.5 py-2.5 text-xs outline-none focus:border-[#157052]"
                placeholder={
                  isAm
                    ? `ስለ ${activeChild.full_name} መልዕክት ይጻፉ...`
                    : `Write a message regarding ${activeChild.full_name}...`
                }
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button type="submit" className="primary-button">
                <Send size={15} /> {isAm ? 'ላክ' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 4: TUITION & FEE STATUS */}
      {activeNavIndex === 4 && activeChild && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {activeChild.full_name} · {activeChild.student_id}
              </p>
              <h2>{isAm ? 'የትምህርት ቤት ክፍያ ሁኔታ (ETB)' : 'Tuition & Transport Fee Status'}</h2>
            </div>
            <div className="text-right text-xs">
              <span className="text-[#71847b]">
                {isAm ? 'ጠቅላላ ቀሪ ክፍያ፡ ' : 'Remaining Balance: '}
              </span>
              <strong className="text-base text-[#b34a3c]">
                {childFeeSummary.balance.toLocaleString()} ETB
              </strong>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isAm ? 'የክፍያ ዓይነት' : 'Fee Description'}</th>
                  <th>{isAm ? 'ጠቅላላ ክፍያ' : 'Amount Due'}</th>
                  <th>{isAm ? 'የተከፈለ' : 'Amount Paid'}</th>
                  <th>{isAm ? 'ቀሪ ሂሳብ' : 'Balance'}</th>
                  <th>{isAm ? 'የመክፈያ ቀን' : 'Due Date'}</th>
                  <th>{isAm ? 'ሁኔታ' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {childFees.map((fee) => {
                  const bal = Math.max(0, Number(fee.amount_due) - Number(fee.amount_paid));
                  return (
                    <tr key={fee.id}>
                      <td className="font-semibold text-[#19362b]">{fee.description}</td>
                      <td>{Number(fee.amount_due).toLocaleString()} ETB</td>
                      <td className="text-[#277453] font-semibold">
                        {Number(fee.amount_paid).toLocaleString()} ETB
                      </td>
                      <td className="font-bold text-[#19362b]">
                        {bal.toLocaleString()} ETB
                      </td>
                      <td className="muted-cell">{fee.due_date || '—'}</td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            bal === 0
                              ? 'bg-[#e9f5ed] text-[#3b805d]'
                              : 'bg-[#faead0] text-[#a9691f]'
                          }`}
                        >
                          {bal === 0
                            ? isAm
                              ? 'ተከፍሏል'
                              : 'Paid'
                            : isAm
                            ? 'ቀሪ አለው'
                            : 'Partial / Due'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: FAMILY FEEDBACK TO SCHOOL MANAGEMENT */}
      {activeNavIndex === 5 && (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'ለአስተዳደሩ መልዕክት' : 'Direct Voice'}</p>
                <h2>
                  {isAm
                    ? 'ለሰላም አካዳሚ አስተያየት ይላኩ'
                    : 'Submit Feedback to Management'}
                </h2>
              </div>
            </div>
            <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'የአስተያየት ዘርፍ' : 'Category'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5 outline-none focus:border-[#157052]"
                  value={feedbackForm.category}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, category: e.target.value })
                  }
                >
                  <option value="Academic">{isAm ? 'ትምህርታዊ (Academic)' : 'Academic'}</option>
                  <option value="Conduct & Care">
                    {isAm ? 'ስነ-ምግባር እና እንክብካቤ' : 'Conduct & Student Care'}
                  </option>
                  <option value="Facilities">
                    {isAm ? 'መገልገያዎች (Facilities)' : 'Facilities & Transport'}
                  </option>
                  <option value="Finance">{isAm ? 'ክፍያ (Finance)' : 'Fees & Finance'}</option>
                </select>
              </label>

              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ርዕስ' : 'Subject'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5 outline-none focus:border-[#157052]"
                  placeholder={
                    isAm ? 'የአስተያየትዎ ዋና ርዕስ...' : 'Brief summary of your feedback...'
                  }
                  value={feedbackForm.subject}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, subject: e.target.value })
                  }
                  required
                />
              </label>

              <label className="block font-semibold text-[#3c5149]">
                {isAm ? 'ዝርዝር ሀሳብ' : 'Details'}
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] p-3 outline-none focus:border-[#157052]"
                  placeholder={
                    isAm
                      ? 'ሀሳብዎን ወይም ጥያቄዎን እዚህ ይጻፉ...'
                      : 'Share your suggestion, question, or concern with school leadership...'
                  }
                  value={feedbackForm.body}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, body: e.target.value })
                  }
                  required
                />
              </label>

              <button type="submit" className="primary-button w-full">
                <Sparkles size={15} /> {isAm ? 'አስተያየቱን ላክ' : 'Submit Feedback'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የተላኩ አስተያየቶች' : 'Submission History'}</p>
                <h2>
                  {isAm
                    ? 'የእርስዎ አስተያየቶች እና የትምህርት ቤቱ ምላሽ'
                    : 'Your Submitted Feedback & School Responses'}
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-lg border border-[#e4ebe7] bg-[#fbfcfb] p-4 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="rounded bg-[#fbf0d9] px-2 py-0.5 text-[10px] font-bold text-[#aa7623] mr-2">
                        {fb.category || 'General'}
                      </span>
                      <b className="text-sm text-[#19362b]">{fb.subject}</b>
                    </div>
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        fb.status === 'resolved'
                          ? 'bg-[#e9f5ed] text-[#3b805d]'
                          : 'bg-[#faead0] text-[#a9691f]'
                      }`}
                    >
                      {fb.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[#415b50] leading-relaxed">{fb.body}</p>

                  {fb.response && (
                    <div className="mt-2 rounded-lg border border-[#cde3d6] bg-[#eff8f2] p-3 text-[#19362b]">
                      <b className="block text-[11px] text-[#073c2f] mb-1">
                        {isAm
                          ? 'የሰላም አካዳሚ አስተዳደር ምላሽ፡'
                          : 'Official Response from Selam Academy:'}
                      </b>
                      <p>{fb.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* OFFICIAL PRINTABLE SELAM ACADEMY REPORT CARD MODAL */}
      {reportCardOpen && activeChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-2xl print-area">
            <div className="mb-4 flex items-center justify-between no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71847b]">
                {isAm ? 'የሪፖርት ካርድ ቅድመ-እይታ' : 'Official Report Card Preview'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="primary-button !h-9"
                >
                  <Printer size={15} /> {isAm ? 'አትም / PDF አውርድ' : 'Print / Save PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardOpen(false)}
                  className="rounded-lg border border-[#d9e2dd] p-2 text-[#587066] hover:bg-[#f4f7f5]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Official Header */}
            <div className="border-2 border-[#073c2f] rounded-lg p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#073c2f] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#c88c28] bg-[#073c2f] text-[#e6b963] font-serif font-bold text-lg">
                    SA
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-wide text-[#073c2f]">
                      SELAM ACADEMY — HAWASSA
                    </h2>
                    <p className="text-xs font-semibold text-[#547268]">
                      ሰላም አካዳሚ — ሀዋሳ፣ ሲዳማ ክልል፣ ኢትዮጵያ
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <b className="block text-[#073c2f] uppercase">
                    Student Academic Report Card
                  </b>
                  <span className="text-[#71847b]">
                    2018 E.C. (2025/26) · Semester {selectedSemester}
                  </span>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#f8fbf9] p-3.5 text-xs sm:grid-cols-4 border border-[#e4ebe7]">
                <div>
                  <span className="block text-[10px] text-[#71847b]">
                    Student Name / የተማሪ ስም
                  </span>
                  <b className="text-[#19362b]">{activeChild.full_name}</b>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71847b]">
                    Student ID / መለያ
                  </span>
                  <b className="font-mono text-[#19362b]">{activeChild.student_id}</b>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71847b]">
                    Grade & Section / ክፍል
                  </span>
                  <b className="text-[#19362b]">
                    Grade {activeChild.grade} — {activeChild.section}
                  </b>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71847b]">
                    Guardian / ወላጅ
                  </span>
                  <b className="text-[#19362b]">{activeChild.guardian_name || user.name}</b>
                </div>
              </div>

              {/* Grades Table */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#073c2f] text-white">
                    <th className="p-2.5 text-left text-white">Subject / የትምህርት ዓይነት</th>
                    <th className="p-2.5 text-center text-white">Quizzes</th>
                    <th className="p-2.5 text-center text-white">Assign</th>
                    <th className="p-2.5 text-center text-white">Mid</th>
                    <th className="p-2.5 text-center text-white">Final</th>
                    <th className="p-2.5 text-center text-white">Total (100)</th>
                    <th className="p-2.5 text-center text-white">Grade</th>
                    <th className="p-2.5 text-center text-white">Conduct</th>
                  </tr>
                </thead>
                <tbody>
                  {childSemesterGrades.map((g) => (
                    <tr key={g.id} className="border-b border-[#e4ebe7]">
                      <td className="p-2.5 font-semibold text-[#19362b]">{g.subjectName}</td>
                      <td className="p-2.5 text-center">{g.quiz}</td>
                      <td className="p-2.5 text-center">{g.assignment}</td>
                      <td className="p-2.5 text-center">{g.mid_exam}</td>
                      <td className="p-2.5 text-center">{g.final_exam}</td>
                      <td className="p-2.5 text-center font-bold text-[#073c2f]">{g.total}</td>
                      <td className="p-2.5 text-center font-bold">{g.letter}</td>
                      <td className="p-2.5 text-center font-bold text-[#aa7623]">
                        {g.conduct || 'A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary & Signatures */}
              <div className="grid grid-cols-3 gap-3 rounded-lg border border-[#dbe4df] bg-[#fbfcfb] p-3 text-xs">
                <div>
                  <span className="text-[#71847b]">Semester Average: </span>
                  <strong className="text-sm text-[#073c2f]">{semesterAverage}%</strong>
                </div>
                <div>
                  <span className="text-[#71847b]">Overall Conduct: </span>
                  <strong className="text-sm text-[#aa7623]">Grade {overallConduct}</strong>
                </div>
                <div>
                  <span className="text-[#71847b]">Attendance Rate: </span>
                  <strong className="text-sm text-[#073c2f]">{attendanceRate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-[#587066]">
                <div className="border-t border-[#9aa8a2] pt-2">
                  Homeroom Teacher Signature / የክፍል ኃላፊ ፊርማ
                </div>
                <div className="border-t border-[#9aa8a2] pt-2 text-right">
                  School Director Signature & Stamp / የርዕሰ መምህር ፊርማና ማህተም
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
