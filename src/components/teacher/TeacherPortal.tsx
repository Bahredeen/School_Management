import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Plus,
  Save,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  DEFAULT_EVALUATION_SCHEME,
  isSupabaseConfigured,
  supabase,
  type AttendanceRecord,
  type EvaluationScheme,
  type GradeRecord,
  type MessageRecord,
  type Profile,
  type Student,
  type Subject,
} from '../../lib/supabase';
import { translations, type Language } from '../../lib/i18n';
import type { PortalUser } from '../../App';

interface ParentLinkWithProfile {
  student_id: string;
  parent_id: string;
  relationship: string | null;
  parent_name: string;
  parent_email: string;
}

const fallbackSubjects: Subject[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    name: 'Mathematics',
    code: 'MATH09',
    grade: '9',
    teacher_id: '22222222-2222-2222-2222-222222222201',
    evaluation_scheme: {
      quizWeights: [5, 5],
      assignmentWeights: [7.5, 7.5],
      midWeight: 25,
      finalWeight: 50,
    },
  },
  {
    id: '44444444-4444-4444-4444-444444444408',
    name: 'Mathematics',
    code: 'MATH10',
    grade: '10',
    teacher_id: '22222222-2222-2222-2222-222222222201',
    evaluation_scheme: DEFAULT_EVALUATION_SCHEME,
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
  {
    id: '33333333-3333-3333-3333-333333333305',
    student_id: 'SA-2026-0105',
    full_name: 'Ekram Yasin',
    gender: 'F',
    grade: '9',
    section: 'A',
    guardian_name: 'Yasin Ali',
    guardian_phone: '+251911200322',
    sub_city: 'Misrak',
    emergency_contact: '+251911200322',
    enrollment_status: 'active',
  },
  {
    id: '33333333-3333-3333-3333-333333333309',
    student_id: 'SA-2026-0109',
    full_name: 'Nathan Dawit',
    gender: 'M',
    grade: '10',
    section: 'A',
    guardian_name: 'Dawit Solomon',
    guardian_phone: '+251911200326',
    sub_city: 'Addis Ketema',
    emergency_contact: '+251911200326',
    enrollment_status: 'active',
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
    student_id: '33333333-3333-3333-3333-333333333303',
    subject_id: '44444444-4444-4444-4444-444444444401',
    semester: '1',
    quiz: 10,
    quiz_scores: [5, 5],
    assignment: 15,
    assignment_scores: [7.5, 7.5],
    mid_exam: 24,
    final_exam: 48,
    conduct: 'A',
    remarks: 'Outstanding',
    published: true,
    teacher_id: '11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'g-3',
    student_id: '33333333-3333-3333-3333-333333333304',
    subject_id: '44444444-4444-4444-4444-444444444401',
    semester: '1',
    quiz: 7,
    quiz_scores: [3, 4],
    assignment: 10,
    assignment_scores: [5, 5],
    mid_exam: 18,
    final_exam: 38,
    conduct: 'C',
    remarks: 'Needs improvement',
    published: true,
    teacher_id: '11111111-1111-1111-1111-111111111103',
  },
];

const fallbackParentLinks: ParentLinkWithProfile[] = [
  {
    student_id: '33333333-3333-3333-3333-333333333301',
    parent_id: '11111111-1111-1111-1111-111111111104',
    relationship: 'Father',
    parent_name: 'Ahmad Kedir',
    parent_email: 'parent@selamacademy.edu.et',
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

type GradeDraft = {
  quizScores: number[]; // length 1..5 matching scheme.quizWeights
  assignmentScores: number[]; // length 1..5 matching scheme.assignmentWeights
  mid_exam: number;
  final_exam: number;
  conduct: 'A' | 'B' | 'C' | 'D';
  remarks: string;
  published: boolean;
};

type AttendanceDraft = {
  status: AttendanceRecord['status'];
  note: string;
};

function computeLetterGrade(total: number): string {
  if (total >= 90) return 'A+';
  if (total >= 85) return 'A';
  if (total >= 80) return 'B+';
  if (total >= 75) return 'B';
  if (total >= 65) return 'C+';
  if (total >= 50) return 'C';
  return 'F';
}

function clampScore(value: number, max: number): number {
  if (Number.isNaN(value) || value < 0) return 0;
  if (value > max) return max;
  return Number(value);
}

function normalizeScheme(raw?: unknown): EvaluationScheme {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const quizWeights =
    Array.isArray(obj.quizWeights) && obj.quizWeights.length >= 1 && obj.quizWeights.length <= 5
      ? obj.quizWeights.map((w) => Number(w) || 0)
      : [...DEFAULT_EVALUATION_SCHEME.quizWeights];

  // Backward compatibility if an older record stored single assignmentWeight instead of assignmentWeights[]
  let assignmentWeights: number[] = [...DEFAULT_EVALUATION_SCHEME.assignmentWeights];
  if (
    Array.isArray(obj.assignmentWeights) &&
    obj.assignmentWeights.length >= 1 &&
    obj.assignmentWeights.length <= 5
  ) {
    assignmentWeights = obj.assignmentWeights.map((w) => Number(w) || 0);
  } else if (typeof obj.assignmentWeight === 'number') {
    assignmentWeights = [Number(obj.assignmentWeight) || 0];
  }

  return {
    quizWeights,
    assignmentWeights,
    midWeight:
      typeof obj.midWeight === 'number'
        ? Number(obj.midWeight)
        : DEFAULT_EVALUATION_SCHEME.midWeight,
    finalWeight:
      typeof obj.finalWeight === 'number'
        ? Number(obj.finalWeight)
        : DEFAULT_EVALUATION_SCHEME.finalWeight,
  };
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

export function TeacherPortal({
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

  const [subjects, setSubjects] = useState<Subject[]>(fallbackSubjects);
  const [students, setStudents] = useState<Student[]>(fallbackStudents);
  const [grades, setGrades] = useState<GradeRecord[]>(fallbackGrades);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [parentLinks, setParentLinks] = useState<ParentLinkWithProfile[]>(fallbackParentLinks);
  const [messages, setMessages] = useState<MessageRecord[]>(fallbackMessages);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  // Gradebook Filters
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('9');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    '44444444-4444-4444-4444-444444444401'
  );
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>('1');

  // Flexible Evaluation Scheme State (up to 5 quizzes, up to 5 assignments, Mid, Final)
  const [schemePanelOpen, setSchemePanelOpen] = useState(true);
  const [scheme, setScheme] = useState<EvaluationScheme>({
    quizWeights: [5, 5],
    assignmentWeights: [7.5, 7.5],
    midWeight: 25,
    finalWeight: 50,
  });

  const [gradeDrafts, setGradeDrafts] = useState<Record<string, GradeDraft>>({});

  // Attendance Filters & Drafts
  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, AttendanceDraft>>({});

  // Family Messaging State
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<string>(
    '33333333-3333-3333-3333-333333333301'
  );
  const [messageInput, setMessageInput] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3600);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadTeacherWorkspace = async () => {
      const { data: staffRow } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const subjectsQuery = staffRow
        ? supabase.from('subjects').select('*').eq('teacher_id', staffRow.id)
        : supabase.from('subjects').select('*');

      const [subjectsRes, studentsRes, gradesRes, attendanceRes, linksRes, profilesRes, messagesRes] =
        await Promise.all([
          subjectsQuery,
          supabase
            .from('students')
            .select('*')
            .eq('enrollment_status', 'active')
            .order('student_id', { ascending: true }),
          supabase.from('grades').select('*'),
          supabase.from('attendance').select('*'),
          supabase.from('parent_student_links').select('*'),
          supabase.from('profiles').select('*').eq('role', 'parent'),
          supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: true }),
        ]);

      if (subjectsRes.data && subjectsRes.data.length > 0) {
        const loadedSubjects = subjectsRes.data as Subject[];
        setSubjects(loadedSubjects);
        setSelectedGradeLevel(loadedSubjects[0].grade);
        setSelectedSubjectId(loadedSubjects[0].id);
        setScheme(normalizeScheme(loadedSubjects[0].evaluation_scheme));
      }

      if (studentsRes.data && studentsRes.data.length > 0) {
        const loadedStudents = studentsRes.data as Student[];
        setStudents(loadedStudents);
        setSelectedStudentForChat(loadedStudents[0].id);
      }

      if (gradesRes.data) {
        setGrades(gradesRes.data as GradeRecord[]);
      }

      if (attendanceRes.data) {
        setAttendanceRecords(attendanceRes.data as AttendanceRecord[]);
      }

      if (linksRes.data && profilesRes.data) {
        const parentProfiles = profilesRes.data as Profile[];
        const mergedLinks: ParentLinkWithProfile[] = linksRes.data.map((lnk) => {
          const p = parentProfiles.find((prof) => prof.id === lnk.parent_id);
          return {
            student_id: lnk.student_id,
            parent_id: lnk.parent_id,
            relationship: lnk.relationship,
            parent_name: p?.full_name || 'Linked Parent',
            parent_email: p?.email || '',
          };
        });
        setParentLinks(mergedLinks);
      }

      if (messagesRes.data) {
        setMessages(messagesRes.data as MessageRecord[]);
      }
    };

    loadTeacherWorkspace();
  }, [user.id]);

  // Keep grade filter aligned with subjects available for selected grade
  const subjectsForGrade = useMemo(() => {
    const filtered = subjects.filter((s) => s.grade === selectedGradeLevel);
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, selectedGradeLevel]);

  useEffect(() => {
    if (
      subjectsForGrade.length > 0 &&
      !subjectsForGrade.some((s) => s.id === selectedSubjectId)
    ) {
      const nextSub = subjectsForGrade[0];
      setSelectedSubjectId(nextSub.id);
      setScheme(normalizeScheme(nextSub.evaluation_scheme));
    }
  }, [subjectsForGrade, selectedSubjectId]);

  const classStudents = useMemo(() => {
    return students.filter(
      (s) => s.grade === selectedGradeLevel && s.section === selectedSection
    );
  }, [students, selectedGradeLevel, selectedSection]);

  // Load saved scheme for active subject + semester if available
  useEffect(() => {
    const sampleGradeWithScheme = grades.find(
      (g) =>
        g.subject_id === selectedSubjectId &&
        g.semester === selectedSemester &&
        g.evaluation_scheme &&
        classStudents.some((s) => s.id === g.student_id)
    );
    if (sampleGradeWithScheme?.evaluation_scheme) {
      setScheme(normalizeScheme(sampleGradeWithScheme.evaluation_scheme));
      return;
    }
    const activeSub = subjects.find((s) => s.id === selectedSubjectId);
    if (activeSub?.evaluation_scheme) {
      setScheme(normalizeScheme(activeSub.evaluation_scheme));
    }
  }, [selectedSubjectId, selectedSemester, subjects]);

  // Sync gradeDrafts whenever classStudents, selectedSubjectId, selectedSemester, scheme slots, or grades change
  useEffect(() => {
    const quizCount = scheme.quizWeights.length;
    const assignCount = scheme.assignmentWeights.length;
    const nextDrafts: Record<string, GradeDraft> = {};

    classStudents.forEach((stu) => {
      const existing = grades.find(
        (g) =>
          g.student_id === stu.id &&
          g.subject_id === selectedSubjectId &&
          g.semester === selectedSemester
      );

      let initialQuizScores: number[] = Array(quizCount).fill(0);
      if (existing) {
        if (Array.isArray(existing.quiz_scores) && existing.quiz_scores.length > 0) {
          initialQuizScores = Array.from({ length: quizCount }, (_, idx) =>
            clampScore(Number(existing.quiz_scores?.[idx] ?? 0), scheme.quizWeights[idx] ?? 100)
          );
        } else {
          initialQuizScores[0] = clampScore(
            Number(existing.quiz || 0),
            scheme.quizWeights[0] ?? 100
          );
        }
      }

      let initialAssignScores: number[] = Array(assignCount).fill(0);
      if (existing) {
        if (
          Array.isArray(existing.assignment_scores) &&
          existing.assignment_scores.length > 0
        ) {
          initialAssignScores = Array.from({ length: assignCount }, (_, idx) =>
            clampScore(
              Number(existing.assignment_scores?.[idx] ?? 0),
              scheme.assignmentWeights[idx] ?? 100
            )
          );
        } else {
          initialAssignScores[0] = clampScore(
            Number(existing.assignment || 0),
            scheme.assignmentWeights[0] ?? 100
          );
        }
      }

      nextDrafts[stu.id] = {
        quizScores: initialQuizScores,
        assignmentScores: initialAssignScores,
        mid_exam: existing ? clampScore(Number(existing.mid_exam), scheme.midWeight) : 0,
        final_exam: existing
          ? clampScore(Number(existing.final_exam), scheme.finalWeight)
          : 0,
        conduct: (existing?.conduct as GradeDraft['conduct']) || 'A',
        remarks: existing?.remarks || '',
        published: existing?.published ?? false,
      };
    });

    setGradeDrafts(nextDrafts);
  }, [classStudents, selectedSubjectId, selectedSemester, grades, scheme]);

  // Sync attendanceDrafts whenever classStudents, attendanceDate, or attendanceRecords change
  useEffect(() => {
    const nextAtt: Record<string, AttendanceDraft> = {};
    classStudents.forEach((stu) => {
      const existing = attendanceRecords.find(
        (a) => a.student_id === stu.id && a.date === attendanceDate
      );
      nextAtt[stu.id] = {
        status: existing?.status || 'present',
        note: existing?.note || '',
      };
    });
    setAttendanceDrafts(nextAtt);
  }, [classStudents, attendanceDate, attendanceRecords]);

  // Total Weight Validation
  const totalQuizWeight = useMemo(
    () => scheme.quizWeights.reduce((acc, w) => acc + Number(w || 0), 0),
    [scheme.quizWeights]
  );

  const totalAssignmentWeight = useMemo(
    () => scheme.assignmentWeights.reduce((acc, w) => acc + Number(w || 0), 0),
    [scheme.assignmentWeights]
  );

  const totalConfiguredWeight = useMemo(
    () =>
      Math.round(
        (totalQuizWeight +
          totalAssignmentWeight +
          Number(scheme.midWeight || 0) +
          Number(scheme.finalWeight || 0)) *
          100
      ) / 100,
    [totalQuizWeight, totalAssignmentWeight, scheme.midWeight, scheme.finalWeight]
  );

  const isWeightValid = Math.abs(totalConfiguredWeight - 100) < 0.01;

  // Quiz Slot Handlers (1 to 5)
  const handleAddQuizSlot = () => {
    if (scheme.quizWeights.length >= 5) return;
    setScheme((prev) => ({
      ...prev,
      quizWeights: [...prev.quizWeights, 5],
    }));
  };

  const handleRemoveQuizSlot = (indexToRemove: number) => {
    if (scheme.quizWeights.length <= 1) return;
    setScheme((prev) => ({
      ...prev,
      quizWeights: prev.quizWeights.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleQuizWeightChange = (index: number, newWeight: number) => {
    const safeWeight = clampScore(newWeight, 100);
    setScheme((prev) => ({
      ...prev,
      quizWeights: prev.quizWeights.map((w, idx) => (idx === index ? safeWeight : w)),
    }));
  };

  // Assignment Slot Handlers (1 to 5 — exact same UX as Quizzes)
  const handleAddAssignmentSlot = () => {
    if (scheme.assignmentWeights.length >= 5) return;
    setScheme((prev) => ({
      ...prev,
      assignmentWeights: [...prev.assignmentWeights, 5],
    }));
  };

  const handleRemoveAssignmentSlot = (indexToRemove: number) => {
    if (scheme.assignmentWeights.length <= 1) return;
    setScheme((prev) => ({
      ...prev,
      assignmentWeights: prev.assignmentWeights.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAssignmentWeightChange = (index: number, newWeight: number) => {
    const safeWeight = clampScore(newWeight, 100);
    setScheme((prev) => ({
      ...prev,
      assignmentWeights: prev.assignmentWeights.map((w, idx) =>
        idx === index ? safeWeight : w
      ),
    }));
  };

  const handleSaveSchemeOnly = async () => {
    if (!isWeightValid) {
      showToast(
        isAm
          ? `ጠቅላላ ክብደት 100% መሆን አለበት (አሁን ${totalConfiguredWeight}% ነው)።`
          : `Total evaluation weight must equal 100% (currently ${totalConfiguredWeight}%).`
      );
      return;
    }
    if (isSupabaseConfigured && supabase && selectedSubjectId) {
      await supabase
        .from('subjects')
        .update({ evaluation_scheme: scheme })
        .eq('id', selectedSubjectId);
    }
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === selectedSubjectId ? { ...s, evaluation_scheme: scheme } : s
      )
    );
    showToast(
      isAm
        ? 'የምዘና ክብደት ቅንብር ተቀምጧል።'
        : 'Evaluation weight scheme saved for this subject.'
    );
  };

  // Compute Totals & Section Ranks in real time
  const rankedGradeRows = useMemo(() => {
    const rows = classStudents.map((stu) => {
      const d = gradeDrafts[stu.id] || {
        quizScores: Array(scheme.quizWeights.length).fill(0),
        assignmentScores: Array(scheme.assignmentWeights.length).fill(0),
        mid_exam: 0,
        final_exam: 0,
        conduct: 'A' as const,
        remarks: '',
        published: false,
      };
      const quizSum = d.quizScores.reduce((acc, val) => acc + Number(val || 0), 0);
      const assignSum = d.assignmentScores.reduce((acc, val) => acc + Number(val || 0), 0);
      const total =
        Number(quizSum) +
        Number(assignSum) +
        Number(d.mid_exam || 0) +
        Number(d.final_exam || 0);
      const roundedTotal = Math.round(total * 100) / 100;
      return {
        student: stu,
        draft: d,
        quizSum: Math.round(quizSum * 100) / 100,
        assignSum: Math.round(assignSum * 100) / 100,
        total: roundedTotal,
        letter: computeLetterGrade(roundedTotal),
      };
    });

    const sortedTotals = [...rows].map((r) => r.total).sort((a, b) => b - a);

    return rows.map((r) => ({
      ...r,
      rank: sortedTotals.indexOf(r.total) + 1,
    }));
  }, [classStudents, gradeDrafts, scheme.quizWeights.length, scheme.assignmentWeights.length]);

  const updateQuizScore = (studentId: string, quizIndex: number, rawValue: number) => {
    const maxAllowed = scheme.quizWeights[quizIndex] ?? 100;
    const clamped = clampScore(rawValue, maxAllowed);

    setGradeDrafts((prev) => {
      const current = prev[studentId] || {
        quizScores: Array(scheme.quizWeights.length).fill(0),
        assignmentScores: Array(scheme.assignmentWeights.length).fill(0),
        mid_exam: 0,
        final_exam: 0,
        conduct: 'A' as const,
        remarks: '',
        published: false,
      };
      const nextQuizScores = Array.from({ length: scheme.quizWeights.length }, (_, idx) =>
        idx === quizIndex ? clamped : current.quizScores[idx] ?? 0
      );
      return {
        ...prev,
        [studentId]: {
          ...current,
          quizScores: nextQuizScores,
        },
      };
    });
  };

  const updateAssignmentScore = (
    studentId: string,
    assignIndex: number,
    rawValue: number
  ) => {
    const maxAllowed = scheme.assignmentWeights[assignIndex] ?? 100;
    const clamped = clampScore(rawValue, maxAllowed);

    setGradeDrafts((prev) => {
      const current = prev[studentId] || {
        quizScores: Array(scheme.quizWeights.length).fill(0),
        assignmentScores: Array(scheme.assignmentWeights.length).fill(0),
        mid_exam: 0,
        final_exam: 0,
        conduct: 'A' as const,
        remarks: '',
        published: false,
      };
      const nextAssignmentScores = Array.from(
        { length: scheme.assignmentWeights.length },
        (_, idx) => (idx === assignIndex ? clamped : current.assignmentScores[idx] ?? 0)
      );
      return {
        ...prev,
        [studentId]: {
          ...current,
          assignmentScores: nextAssignmentScores,
        },
      };
    });
  };

  const updateGradeField = <
    K extends keyof Omit<GradeDraft, 'quizScores' | 'assignmentScores'>
  >(
    studentId: string,
    field: K,
    value: GradeDraft[K]
  ) => {
    setGradeDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          quizScores: Array(scheme.quizWeights.length).fill(0),
          assignmentScores: Array(scheme.assignmentWeights.length).fill(0),
          mid_exam: 0,
          final_exam: 0,
          conduct: 'A',
          remarks: '',
          published: false,
        }),
        [field]: value,
      },
    }));
  };

  const handleSaveGrades = async (publishToFamilies: boolean) => {
    if (classStudents.length === 0 || !selectedSubjectId) return;

    if (!isWeightValid) {
      showToast(
        isAm
          ? `ውጤት ከማስቀመጥዎ በፊት ጠቅላላ ክብደቱን 100% ያድርጉ (አሁን ${totalConfiguredWeight}% ነው)።`
          : `Please adjust evaluation weights to equal 100% before saving (currently ${totalConfiguredWeight}%).`
      );
      return;
    }

    setSaving(true);

    const upsertRows = classStudents.map((stu) => {
      const d = gradeDrafts[stu.id] || {
        quizScores: Array(scheme.quizWeights.length).fill(0),
        assignmentScores: Array(scheme.assignmentWeights.length).fill(0),
        mid_exam: 0,
        final_exam: 0,
        conduct: 'A' as const,
        remarks: '',
        published: false,
      };

      const sanitizedQuizScores = scheme.quizWeights.map((maxW, idx) =>
        clampScore(d.quizScores[idx] ?? 0, maxW)
      );
      const quizTotal =
        Math.round(sanitizedQuizScores.reduce((acc, v) => acc + v, 0) * 100) / 100;

      const sanitizedAssignmentScores = scheme.assignmentWeights.map((maxW, idx) =>
        clampScore(d.assignmentScores[idx] ?? 0, maxW)
      );
      const assignmentTotal =
        Math.round(sanitizedAssignmentScores.reduce((acc, v) => acc + v, 0) * 100) / 100;

      return {
        student_id: stu.id,
        subject_id: selectedSubjectId,
        semester: selectedSemester,
        quiz: quizTotal,
        quiz_scores: sanitizedQuizScores,
        assignment: assignmentTotal,
        assignment_scores: sanitizedAssignmentScores,
        mid_exam: clampScore(d.mid_exam, scheme.midWeight),
        final_exam: clampScore(d.final_exam, scheme.finalWeight),
        evaluation_scheme: scheme,
        conduct: d.conduct,
        remarks: d.remarks.trim() || null,
        published: publishToFamilies ? true : d.published,
        teacher_id: user.id,
      };
    });

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('subjects')
        .update({ evaluation_scheme: scheme })
        .eq('id', selectedSubjectId);

      const { data, error } = await supabase
        .from('grades')
        .upsert(upsertRows, { onConflict: 'student_id,subject_id,semester' })
        .select();

      if (error) {
        setSaving(false);
        showToast(error.message);
        return;
      }

      if (data) {
        const returned = data as GradeRecord[];
        setGrades((prev) => {
          const remaining = prev.filter(
            (g) =>
              !(
                g.subject_id === selectedSubjectId &&
                g.semester === selectedSemester &&
                classStudents.some((s) => s.id === g.student_id)
              )
          );
          return [...remaining, ...returned];
        });
      }
    } else {
      setGrades((prev) => {
        const remaining = prev.filter(
          (g) =>
            !(
              g.subject_id === selectedSubjectId &&
              g.semester === selectedSemester &&
              classStudents.some((s) => s.id === g.student_id)
            )
        );
        const mockSaved: GradeRecord[] = upsertRows.map((r, idx) => ({
          id: `local-grade-${Date.now()}-${idx}`,
          ...r,
        }));
        return [...remaining, ...mockSaved];
      });
    }

    setSaving(false);
    showToast(
      publishToFamilies
        ? isAm
          ? 'ውጤቶች እና ስነ-ምግባር ተመዝግበው ለወላጆች ተለቀዋል!'
          : 'Results & conduct saved and published to families!'
        : isAm
        ? 'ውጤቶች በረቂቅነት ተቀምጠዋል።'
        : 'Gradebook draft saved.'
    );
  };

  // === SAVE DAILY ATTENDANCE ===
  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) return;
    setSaving(true);

    const upsertRows = classStudents.map((stu) => {
      const d = attendanceDrafts[stu.id] || { status: 'present' as const, note: '' };
      return {
        student_id: stu.id,
        date: attendanceDate,
        status: d.status,
        note: d.note.trim() || null,
        recorded_by: user.id,
      };
    });

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(upsertRows, { onConflict: 'student_id,date' })
        .select();

      if (error) {
        setSaving(false);
        showToast(error.message);
        return;
      }

      if (data) {
        const returned = data as AttendanceRecord[];
        setAttendanceRecords((prev) => {
          const remaining = prev.filter(
            (a) =>
              !(
                a.date === attendanceDate &&
                classStudents.some((s) => s.id === a.student_id)
              )
          );
          return [...remaining, ...returned];
        });
      }
    } else {
      setAttendanceRecords((prev) => {
        const remaining = prev.filter(
          (a) =>
            !(
              a.date === attendanceDate &&
              classStudents.some((s) => s.id === a.student_id)
            )
        );
        const mockAtt: AttendanceRecord[] = upsertRows.map((r, idx) => ({
          id: `local-att-${Date.now()}-${idx}`,
          ...r,
        }));
        return [...remaining, ...mockAtt];
      });
    }

    setSaving(false);
    showToast(
      isAm
        ? `የ${attendanceDate} ተገኝነት ተመዝግቧል።`
        : `Daily attendance saved for ${attendanceDate}.`
    );
  };

  // === SEND MESSAGE TO FAMILY ===
  const activeChatStudent = students.find((s) => s.id === selectedStudentForChat);
  const activeParentLink = parentLinks.find(
    (l) => l.student_id === selectedStudentForChat
  );

  const studentThreadMessages = useMemo(() => {
    return messages.filter((m) => m.student_id === selectedStudentForChat);
  }, [messages, selectedStudentForChat]);

  const handleSendMessageToParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeParentLink) return;

    const payload = {
      sender_id: user.id,
      recipient_id: activeParentLink.parent_id,
      student_id: selectedStudentForChat,
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
    showToast(
      isAm ? 'መልዕክቱ ለወላጅ ተልኳል።' : 'Message sent directly to student’s family.'
    );
  };

  const assignedGradeSet = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.grade))),
    [subjects]
  );

  const totalAssignedStudentsCount = useMemo(
    () => students.filter((s) => assignedGradeSet.includes(s.grade)).length,
    [students, assignedGradeSet]
  );

  const classAverageScore = useMemo(() => {
    if (rankedGradeRows.length === 0) return '0.0%';
    const sum = rankedGradeRows.reduce((acc, r) => acc + r.total, 0);
    return `${(sum / rankedGradeRows.length).toFixed(1)}%`;
  }, [rankedGradeRows]);

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#073c2f] px-4 py-3 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 size={16} className="text-[#e4b65e]" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 0: MY CLASSES DASHBOARD */}
      {activeNavIndex === 0 && (
        <>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                {isAm ? 'የመምህር የስራ ቦታ' : 'Your Teaching Workspace'}
              </p>
              <h1>
                {t.dashboard.goodMorning}, {user.name.split(' ')[0]}.
              </h1>
              <p className="subtle">
                {isAm
                  ? 'የተመደቡልዎትን ክፍሎች፣ የተማሪዎች ውጤት እና የቤተሰብ መልዕክቶችን ያስተዳድሩ።'
                  : 'Manage your assigned classes, enter student results & conduct, and message families.'}
              </p>
            </div>
            <button className="primary-button" onClick={() => onNavigate(1)}>
              <Sparkles size={16} /> {t.dashboard.openGradebook}
            </button>
          </div>

          <div className="stat-grid">
            <StatCard
              label={isAm ? 'የተመደቡ ትምህርቶች' : 'Assigned subjects'}
              value={String(subjects.length)}
              detail={
                isAm
                  ? `ክፍል ${assignedGradeSet.join(', ')}`
                  : `Grades ${assignedGradeSet.join(', ')}`
              }
              icon={BookOpen}
              accent="green"
            />
            <StatCard
              label={isAm ? 'የተመደቡ ተማሪዎች' : 'Assigned students'}
              value={String(totalAssignedStudentsCount)}
              detail={isAm ? 'በተመደቡ ክፍሎች ውስጥ' : 'Across your grade levels'}
              icon={GraduationCap}
              accent="gold"
            />
            <StatCard
              label={isAm ? 'የክፍል አማካይ ውጤት' : 'Selected class average'}
              value={classAverageScore}
              detail={`Grade ${selectedGradeLevel} ${selectedSection} · Sem ${selectedSemester}`}
              icon={ClipboardCheck}
              accent="blue"
            />
            <StatCard
              label={isAm ? 'የቤተሰብ መልዕክቶች' : 'Family messages'}
              value={String(messages.length)}
              detail={isAm ? 'ቀጥታ የወላጅ ውይይቶች' : 'Direct parent conversations'}
              icon={MessageSquare}
              accent="rose"
            />
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የተመደቡ ክፍሎች' : 'Teaching Load'}</p>
                <h2>{isAm ? 'የእኔ ክፍሎች እና የትምህርት ዓይነቶች' : 'My Assigned Subjects & Classes'}</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((sub) => {
                const count = students.filter((s) => s.grade === sub.grade).length;
                return (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-[#e4ebe7] bg-[#fbfcfb] p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-[#e3f1e9] px-2.5 py-0.5 text-[10px] font-bold text-[#277453]">
                          {sub.code}
                        </span>
                        <span className="text-xs font-semibold text-[#71847b]">
                          {isAm ? `ክፍል ${sub.grade}` : `Grade ${sub.grade}`}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-[#19362b]">{sub.name}</h3>
                      <p className="mt-1 text-xs text-[#71847b]">
                        {isAm
                          ? `${count} ተማሪዎች በዚህ የክፍል ደረጃ ይገኛሉ`
                          : `${count} active students in Grade ${sub.grade}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="primary-button flex-1 !h-9"
                        onClick={() => {
                          setSelectedGradeLevel(sub.grade);
                          setSelectedSubjectId(sub.id);
                          setScheme(normalizeScheme(sub.evaluation_scheme));
                          onNavigate(1);
                        }}
                      >
                        <ClipboardCheck size={14} />{' '}
                        {isAm ? 'ውጤት መዝግብ' : 'Enter Results'}
                      </button>
                      <button
                        type="button"
                        className="secondary-button !h-9"
                        onClick={() => {
                          setSelectedGradeLevel(sub.grade);
                          onNavigate(2);
                        }}
                      >
                        <CalendarDays size={14} />{' '}
                        {isAm ? 'ተገኝነት' : 'Attendance'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* TAB 1: FLEXIBLE RESULT & CONDUCT ENTRY SHEET */}
      {activeNavIndex === 1 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {isAm
                  ? `ኩዊዝ (${totalQuizWeight}%) + አሳይመንት (${totalAssignmentWeight}%) + ሚድ (${scheme.midWeight}%) + ፋይናል (${scheme.finalWeight}%)`
                  : `Quizzes (${totalQuizWeight}%) + Assignments (${totalAssignmentWeight}%) + Mid (${scheme.midWeight}%) + Final (${scheme.finalWeight}%)`}
              </p>
              <h2>
                {isAm
                  ? 'የተማሪዎች ውጤት እና ስነ-ምግባር መመዝገቢያ'
                  : 'Result & Conduct Entry Sheet'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSchemePanelOpen((prev) => !prev)}
                className="secondary-button"
              >
                <SlidersHorizontal size={15} />{' '}
                {isAm ? 'የምዘና ክብደት አስተካክል' : 'Evaluation Weights'}
              </button>
              <button
                type="button"
                disabled={saving || !isWeightValid}
                onClick={() => handleSaveGrades(false)}
                className="secondary-button"
              >
                <Save size={15} /> {isAm ? 'ረቂቅ አስቀምጥ' : 'Save Draft'}
              </button>
              <button
                type="button"
                disabled={saving || !isWeightValid}
                onClick={() => handleSaveGrades(true)}
                className="primary-button"
              >
                <CheckCircle2 size={15} />{' '}
                {isAm ? 'አስቀምጥና ለቤተሰብ ልቀቅ' : 'Save & Publish to Families'}
              </button>
            </div>
          </div>

          {/* Class & Subject Filter Bar */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'ክፍል' : 'Grade'}
              <select
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
              >
                {['KG-1', 'KG-2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(
                  (g) => (
                    <option key={g} value={g}>
                      {isAm ? `ክፍል ${g}` : `Grade ${g}`}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'ሴክሽን' : 'Section'}
              <select
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {['A', 'B', 'C', 'D'].map((sec) => (
                  <option key={sec} value={sec}>
                    {isAm ? `ሴክሽን ${sec}` : `Section ${sec}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'የትምህርት ዓይነት' : 'Subject'}
              <select
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={selectedSubjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedSubjectId(id);
                  const found = subjects.find((s) => s.id === id);
                  if (found?.evaluation_scheme) {
                    setScheme(normalizeScheme(found.evaluation_scheme));
                  }
                }}
              >
                {subjectsForGrade.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'ሴሚስተር' : 'Semester'}
              <select
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
              >
                <option value="1">{isAm ? '1ኛ ሴሚስተር' : 'Semester 1'}</option>
                <option value="2">{isAm ? '2ኛ ሴሚስተር' : 'Semester 2'}</option>
              </select>
            </label>
          </div>

          {/* FLEXIBLE EVALUATION WEIGHTS BUILDER (UP TO 5 QUIZZES, UP TO 5 ASSIGNMENTS, MID, FINAL) */}
          {schemePanelOpen && (
            <div className="mb-5 rounded-xl border border-[#dbe4df] bg-[#f8fbf9] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4ebe7] pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#073c2f]">
                    {isAm
                      ? 'የምዘና ክብደት ማስተካከያ (እስከ 5 ኩዊዝ እና 5 አሳይመንት)'
                      : 'Flexible Evaluation Setup (Up to 5 Quizzes & 5 Assignments)'}
                  </h3>
                  <p className="text-[11px] text-[#71847b] mt-0.5">
                    {isAm
                      ? 'የእያንዳንዱን ኩዊዝ፣ አሳይመንት፣ ሚድ እና ፋይናል ክብደት ይወስኑ። ድምሩ 100% መሆን አለበት።'
                      : 'Customize quiz count (1–5), assignment count (1–5), and individual percentage weights. Total must equal 100%.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                      isWeightValid
                        ? 'bg-[#e3f1e9] text-[#0b6248]'
                        : 'bg-[#fae9e5] text-[#b34a3c]'
                    }`}
                  >
                    {!isWeightValid && <AlertTriangle size={13} />}
                    {isAm ? 'ጠቅላላ ክብደት፡' : 'Total Weight:'} {totalConfiguredWeight}%
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveSchemeOnly}
                    disabled={!isWeightValid}
                    className="secondary-button !h-8 !px-3 !text-[11px]"
                  >
                    {isAm ? 'ክብደቱን አስቀምጥ' : 'Save Scheme'}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Quizzes (1 to 5) */}
                <div className="rounded-lg border border-[#e4ebe7] bg-white p-3">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19362b]">
                      {isAm
                        ? `ኩዊዞች (${scheme.quizWeights.length} / 5) — ድምር ${totalQuizWeight}%`
                        : `Quizzes (${scheme.quizWeights.length} of 5) — Subtotal ${totalQuizWeight}%`}
                    </span>
                    {scheme.quizWeights.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddQuizSlot}
                        className="inline-flex items-center gap-1 rounded-md bg-[#e3f1e9] px-2.5 py-1 text-[11px] font-bold text-[#0b6248] hover:bg-[#d2e9dc]"
                      >
                        <Plus size={12} /> {isAm ? 'ኩዊዝ ጨምር' : 'Add Quiz'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {scheme.quizWeights.map((qWeight, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[#e2e9e5] bg-[#fbfcfb] p-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#365247]">Quiz {idx + 1}</span>
                          {scheme.quizWeights.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuizSlot(idx)}
                              className="text-[#b34a3c] hover:opacity-80"
                              title="Remove quiz"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            step="0.5"
                            className="w-full rounded border border-[#d9e2dd] bg-white px-2 py-1 pr-5 text-xs font-semibold text-[#19362b]"
                            value={qWeight}
                            onChange={(e) =>
                              handleQuizWeightChange(idx, parseFloat(e.target.value))
                            }
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-[#8a9992]">
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignments (1 to 5 — exact same flexible slots as Quizzes) */}
                <div className="rounded-lg border border-[#e4ebe7] bg-white p-3">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19362b]">
                      {isAm
                        ? `አሳይመንቶች (${scheme.assignmentWeights.length} / 5) — ድምር ${totalAssignmentWeight}%`
                        : `Assignments (${scheme.assignmentWeights.length} of 5) — Subtotal ${totalAssignmentWeight}%`}
                    </span>
                    {scheme.assignmentWeights.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddAssignmentSlot}
                        className="inline-flex items-center gap-1 rounded-md bg-[#e3f1e9] px-2.5 py-1 text-[11px] font-bold text-[#0b6248] hover:bg-[#d2e9dc]"
                      >
                        <Plus size={12} /> {isAm ? 'አሳይመንት ጨምር' : 'Add Assign'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {scheme.assignmentWeights.map((aWeight, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[#e2e9e5] bg-[#fbfcfb] p-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#365247]">Assign {idx + 1}</span>
                          {scheme.assignmentWeights.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignmentSlot(idx)}
                              className="text-[#b34a3c] hover:opacity-80"
                              title="Remove assignment"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            step="0.5"
                            className="w-full rounded border border-[#d9e2dd] bg-white px-2 py-1 pr-5 text-xs font-semibold text-[#19362b]"
                            value={aWeight}
                            onChange={(e) =>
                              handleAssignmentWeightChange(idx, parseFloat(e.target.value))
                            }
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-[#8a9992]">
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mid-Exam & Final Exam Weights */}
              <div className="rounded-lg border border-[#e4ebe7] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#19362b]">
                    {isAm
                      ? 'የሚድ እና ፋይናል ፈተና ክብደት'
                      : 'Mid-Exam & Final Exam Weights'}
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs w-full sm:w-auto sm:min-w-[300px]">
                    <label className="rounded-lg border border-[#e2e9e5] bg-[#fbfcfb] p-2">
                      <span className="block font-bold text-[#365247] mb-1">
                        {isAm ? 'ሚድ ፈተና' : 'Mid Exam'}
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          className="w-full rounded border border-[#d9e2dd] bg-white px-2 py-1 pr-5 font-semibold text-[#19362b]"
                          value={scheme.midWeight}
                          onChange={(e) =>
                            setScheme((prev) => ({
                              ...prev,
                              midWeight: clampScore(parseFloat(e.target.value), 100),
                            }))
                          }
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-[#8a9992]">
                          %
                        </span>
                      </div>
                    </label>

                    <label className="rounded-lg border border-[#e2e9e5] bg-[#fbfcfb] p-2">
                      <span className="block font-bold text-[#365247] mb-1">
                        {isAm ? 'ፋይናል ፈተና' : 'Final Exam'}
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          className="w-full rounded border border-[#d9e2dd] bg-white px-2 py-1 pr-5 font-semibold text-[#19362b]"
                          value={scheme.finalWeight}
                          onChange={(e) =>
                            setScheme((prev) => ({
                              ...prev,
                              finalWeight: clampScore(parseFloat(e.target.value), 100),
                            }))
                          }
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-[#8a9992]">
                          %
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rankedGradeRows.length === 0 ? (
            <div className="empty-content">
              <p>
                {isAm
                  ? `በክፍል ${selectedGradeLevel} ${selectedSection} የተመዘገበ ተማሪ አልተገኘም።`
                  : `No active students found in Grade ${selectedGradeLevel} ${selectedSection}.`}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{isAm ? 'ተማሪ' : 'Student'}</th>
                    {scheme.quizWeights.map((w, idx) => (
                      <th key={`q-head-${idx}`}>
                        Q{idx + 1} ({w}%)
                      </th>
                    ))}
                    {scheme.assignmentWeights.map((w, idx) => (
                      <th key={`a-head-${idx}`}>
                        A{idx + 1} ({w}%)
                      </th>
                    ))}
                    <th>Mid ({scheme.midWeight}%)</th>
                    <th>Final ({scheme.finalWeight}%)</th>
                    <th>{isAm ? 'ድምር (100%)' : 'Total'}</th>
                    <th>{isAm ? 'ደረጃ' : 'Grade / Rank'}</th>
                    <th>{isAm ? 'ስነ-ምግባር' : 'Conduct'}</th>
                    <th>{isAm ? 'የመምህር አስተያየት' : 'Teacher Remarks'}</th>
                    <th>{isAm ? 'ሁኔታ' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedGradeRows.map(({ student, draft, total, letter, rank }) => (
                    <tr key={student.id}>
                      <td>
                        <div className="font-semibold text-[#19362b]">{student.full_name}</div>
                        <small className="text-[#8a9992]">{student.student_id}</small>
                      </td>

                      {scheme.quizWeights.map((maxW, qIdx) => (
                        <td key={`q-cell-${qIdx}`}>
                          <input
                            type="number"
                            min={0}
                            max={maxW}
                            step="0.5"
                            className="w-14 rounded border border-[#d9e2dd] px-2 py-1 text-center text-xs"
                            value={draft.quizScores[qIdx] ?? 0}
                            onChange={(e) =>
                              updateQuizScore(
                                student.id,
                                qIdx,
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </td>
                      ))}

                      {scheme.assignmentWeights.map((maxW, aIdx) => (
                        <td key={`a-cell-${aIdx}`}>
                          <input
                            type="number"
                            min={0}
                            max={maxW}
                            step="0.5"
                            className="w-14 rounded border border-[#d9e2dd] px-2 py-1 text-center text-xs"
                            value={draft.assignmentScores[aIdx] ?? 0}
                            onChange={(e) =>
                              updateAssignmentScore(
                                student.id,
                                aIdx,
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </td>
                      ))}

                      <td>
                        <input
                          type="number"
                          min={0}
                          max={scheme.midWeight}
                          step="0.5"
                          className="w-14 rounded border border-[#d9e2dd] px-2 py-1 text-center text-xs"
                          value={draft.mid_exam}
                          onChange={(e) =>
                            updateGradeField(
                              student.id,
                              'mid_exam',
                              clampScore(parseFloat(e.target.value), scheme.midWeight)
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={scheme.finalWeight}
                          step="0.5"
                          className="w-14 rounded border border-[#d9e2dd] px-2 py-1 text-center text-xs"
                          value={draft.final_exam}
                          onChange={(e) =>
                            updateGradeField(
                              student.id,
                              'final_exam',
                              clampScore(parseFloat(e.target.value), scheme.finalWeight)
                            )
                          }
                        />
                      </td>
                      <td>
                        <strong className="text-sm text-[#073c2f]">{total}</strong>
                      </td>
                      <td>
                        <span className="rounded bg-[#e3f1e9] px-2 py-0.5 text-[10px] font-bold text-[#277453] mr-1">
                          {letter}
                        </span>
                        <span className="text-[11px] font-bold text-[#aa7623]">#{rank}</span>
                      </td>
                      <td>
                        <select
                          className="rounded border border-[#d9e2dd] bg-white px-2 py-1 text-xs font-semibold"
                          value={draft.conduct}
                          onChange={(e) =>
                            updateGradeField(
                              student.id,
                              'conduct',
                              e.target.value as GradeDraft['conduct']
                            )
                          }
                        >
                          <option value="A">A (Excellent)</option>
                          <option value="B">B (Good)</option>
                          <option value="C">C (Fair)</option>
                          <option value="D">D (Needs Work)</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="w-40 rounded border border-[#d9e2dd] px-2.5 py-1 text-xs"
                          placeholder={
                            isAm ? 'ስለ ተማሪው አስተያየት...' : 'Remark for family...'
                          }
                          value={draft.remarks}
                          onChange={(e) =>
                            updateGradeField(student.id, 'remarks', e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            draft.published
                              ? 'bg-[#e9f5ed] text-[#3b805d]'
                              : 'bg-[#fbf0d9] text-[#aa7623]'
                          }`}
                        >
                          {draft.published
                            ? isAm
                              ? 'የተለቀቀ'
                              : 'Published'
                            : isAm
                            ? 'ረቂቅ'
                            : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: DAILY ATTENDANCE TRACKER */}
      {activeNavIndex === 2 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'የክፍል ክትትል' : 'Classroom Roll Call'}</p>
              <h2>{isAm ? 'የዕለት ተገኝነት መመዝገቢያ' : 'Daily Attendance Tracker'}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const allPresent: Record<string, AttendanceDraft> = {};
                  classStudents.forEach((stu) => {
                    allPresent[stu.id] = {
                      status: 'present',
                      note: attendanceDrafts[stu.id]?.note || '',
                    };
                  });
                  setAttendanceDrafts(allPresent);
                }}
              >
                <UserCheck size={15} />{' '}
                {isAm ? 'ሁሉንም ተገኝተዋል በል' : 'Mark All Present'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAttendance}
                className="primary-button"
              >
                <Save size={15} /> {isAm ? 'ተገኝነት አስቀምጥ' : 'Save Attendance'}
              </button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'ቀን' : 'Date'}
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'ክፍል' : 'Grade'}
              <select
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
              >
                {['KG-1', 'KG-2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(
                  (g) => (
                    <option key={g} value={g}>
                      {isAm ? `ክፍል ${g}` : `Grade ${g}`}
                    </option>
                  )
                )}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#3c5149]">
              {isAm ? 'ሴክሽን' : 'Section'}
              <select
                className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {['A', 'B', 'C', 'D'].map((sec) => (
                  <option key={sec} value={sec}>
                    {isAm ? `ሴክሽን ${sec}` : `Section ${sec}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isAm ? 'መለያ ቁጥር' : 'Student ID'}</th>
                  <th>{isAm ? 'የተማሪ ስም' : 'Student Name'}</th>
                  <th>{isAm ? 'የተገኝነት ሁኔታ' : 'Attendance Status'}</th>
                  <th>{isAm ? 'ማስታወሻ (ለቤተሰብ የሚታይ)' : 'Note (Visible to Family)'}</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((stu) => {
                  const draft = attendanceDrafts[stu.id] || {
                    status: 'present' as const,
                    note: '',
                  };
                  return (
                    <tr key={stu.id}>
                      <td className="muted-cell font-mono">{stu.student_id}</td>
                      <td className="font-semibold text-[#19362b]">{stu.full_name}</td>
                      <td>
                        <div className="inline-flex flex-wrap gap-1.5">
                          {(
                            [
                              ['present', isAm ? 'ተገኝቷል' : 'Present'],
                              ['absent', isAm ? 'ቀርቷል' : 'Absent'],
                              ['late', isAm ? 'ዘግይቷል' : 'Late'],
                              ['excused', isAm ? 'በፈቃድ' : 'Excused'],
                            ] as const
                          ).map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setAttendanceDrafts((prev) => ({
                                  ...prev,
                                  [stu.id]: { ...draft, status: val },
                                }))
                              }
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold border transition ${
                                draft.status === val
                                  ? val === 'present'
                                    ? 'bg-[#0b6248] text-white border-[#0b6248]'
                                    : val === 'absent'
                                    ? 'bg-[#b34a3c] text-white border-[#b34a3c]'
                                    : 'bg-[#c88c28] text-white border-[#c88c28]'
                                  : 'bg-white text-[#587066] border-[#d9e2dd]'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <input
                          className="w-full min-w-[200px] rounded border border-[#d9e2dd] px-2.5 py-1 text-xs"
                          placeholder={
                            isAm ? 'ምክንያት ወይም ማስታወሻ...' : 'Optional note for parents...'
                          }
                          value={draft.note}
                          onChange={(e) =>
                            setAttendanceDrafts((prev) => ({
                              ...prev,
                              [stu.id]: { ...draft, note: e.target.value },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: DIRECT FAMILY MESSAGING */}
      {activeNavIndex === 3 && (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <section className="panel h-fit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'ተማሪ ይምረጡ' : 'Student Roster'}</p>
                <h2>{isAm ? 'የተማሪ ቤተሰቦች' : 'Select Student'}</h2>
              </div>
            </div>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {students.map((stu) => {
                const link = parentLinks.find((l) => l.student_id === stu.id);
                const selected = stu.id === selectedStudentForChat;
                return (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => setSelectedStudentForChat(stu.id)}
                    className={`w-full rounded-lg border p-3 text-left text-xs transition ${
                      selected
                        ? 'border-[#0b6248] bg-[#eff8f2]'
                        : 'border-[#e4ebe7] bg-white hover:border-[#9dc2b4]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-[#19362b]">{stu.full_name}</b>
                      <span className="text-[10px] font-semibold text-[#71847b]">
                        {stu.grade} {stu.section}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#587066]">
                      {link
                        ? `${isAm ? 'ወላጅ፡' : 'Family:'} ${link.parent_name}`
                        : isAm
                        ? 'የወላጅ መለያ አልተገናኘም'
                        : 'No linked parent account yet'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="panel-heading border-b border-[#edf1ef] pb-4">
                <div>
                  <p className="eyebrow">
                    {isAm ? 'የግል የቤተሰብ ውይይት' : 'Private Family Thread'}
                  </p>
                  <h2>
                    {activeChatStudent?.full_name} —{' '}
                    {activeParentLink
                      ? `${activeParentLink.parent_name} (${activeParentLink.relationship || 'Parent'})`
                      : isAm
                      ? 'የተገናኘ ወላጅ የለም'
                      : 'Unlinked Family'}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto py-2">
                {studentThreadMessages.length === 0 ? (
                  <p className="text-xs text-[#82928a] py-8 text-center">
                    {isAm
                      ? 'ስለ ተማሪው ትምህርት ወይም ስነ-ምግባር ለቤተሰብ መልዕክት ይላኩ።'
                      : 'No messages yet. Send an academic or conduct update to this student’s family.'}
                  </p>
                ) : (
                  studentThreadMessages.map((msg) => {
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
                          {isMine
                            ? isAm
                              ? 'እርስዎ (መምህር)'
                              : 'You (Teacher)'
                            : activeParentLink?.parent_name || 'Parent'}{' '}
                          ·{' '}
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

            {activeParentLink ? (
              <form
                onSubmit={handleSendMessageToParent}
                className="mt-4 flex gap-2 border-t border-[#edf1ef] pt-4"
              >
                <input
                  className="flex-1 rounded-lg border border-[#d9e2dd] px-3.5 py-2.5 text-xs outline-none focus:border-[#157052]"
                  placeholder={
                    isAm
                      ? `ስለ ${activeChatStudent?.full_name} ለ${activeParentLink.parent_name} መልዕክት ይጻፉ...`
                      : `Write a private update about ${activeChatStudent?.full_name} to ${activeParentLink.parent_name}...`
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button type="submit" className="primary-button">
                  <Send size={15} /> {isAm ? 'ላክ' : 'Send'}
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-lg bg-[#fcf7e9] border border-[#f3e8c8] p-3 text-xs text-[#6c5427]">
                {isAm
                  ? 'ይህ ተማሪ ከወላጅ መለያ ጋር አልተገናኘም። የአይሲቲ ኃላፊው እንዲያገናኘው ይጠይቁ።'
                  : 'This student does not have a linked parent account yet. Ask the ICT Manager to link the family account.'}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}