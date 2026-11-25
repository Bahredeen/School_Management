import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type UserRole =
  | 'director'
  | 'ict'
  | 'registrar'
  | 'property'
  | 'teacher'
  | 'parent';

export type AccessLevel = 'none' | 'read_only' | 'create_edit' | 'full_crud';

export interface AccountPermissions {
  user_id: string;
  students_access: AccessLevel;
  staff_access: AccessLevel;
  grades_access: AccessLevel;
  attendance_access: AccessLevel;
  finance_access: AccessLevel;
  property_access: AccessLevel;
  announcements_access: AccessLevel;
  can_comment_feedback: boolean;
  can_send_messages: boolean;
  can_verify_receipts: boolean;
  can_publish_grades: boolean;
  can_export_data: boolean;
}

export function getDefaultPermissionsForRole(
  userId: string,
  role: UserRole
): AccountPermissions {
  switch (role) {
    case 'ict':
      return {
        user_id: userId,
        students_access: 'full_crud',
        staff_access: 'full_crud',
        grades_access: 'full_crud',
        attendance_access: 'full_crud',
        finance_access: 'full_crud',
        property_access: 'full_crud',
        announcements_access: 'full_crud',
        can_comment_feedback: true,
        can_send_messages: true,
        can_verify_receipts: true,
        can_publish_grades: true,
        can_export_data: true,
      };
    case 'registrar':
      return {
        user_id: userId,
        students_access: 'full_crud',
        staff_access: 'full_crud',
        grades_access: 'read_only',
        attendance_access: 'read_only',
        finance_access: 'full_crud',
        property_access: 'none',
        announcements_access: 'read_only',
        can_comment_feedback: true,
        can_send_messages: true,
        can_verify_receipts: true,
        can_publish_grades: false,
        can_export_data: true,
      };
    case 'director':
      return {
        user_id: userId,
        students_access: 'read_only',
        staff_access: 'read_only',
        grades_access: 'read_only',
        attendance_access: 'read_only',
        finance_access: 'read_only',
        property_access: 'read_only',
        announcements_access: 'full_crud',
        can_comment_feedback: true,
        can_send_messages: true,
        can_verify_receipts: true,
        can_publish_grades: false,
        can_export_data: true,
      };
    case 'property':
      return {
        user_id: userId,
        students_access: 'none',
        staff_access: 'read_only',
        grades_access: 'none',
        attendance_access: 'none',
        finance_access: 'none',
        property_access: 'full_crud',
        announcements_access: 'read_only',
        can_comment_feedback: false,
        can_send_messages: false,
        can_verify_receipts: false,
        can_publish_grades: false,
        can_export_data: true,
      };
    case 'teacher':
      return {
        user_id: userId,
        students_access: 'read_only',
        staff_access: 'none',
        grades_access: 'create_edit',
        attendance_access: 'create_edit',
        finance_access: 'none',
        property_access: 'none',
        announcements_access: 'read_only',
        can_comment_feedback: false,
        can_send_messages: true,
        can_verify_receipts: false,
        can_publish_grades: true,
        can_export_data: false,
      };
    case 'parent':
    default:
      return {
        user_id: userId,
        students_access: 'read_only',
        staff_access: 'none',
        grades_access: 'read_only',
        attendance_access: 'read_only',
        finance_access: 'read_only',
        property_access: 'none',
        announcements_access: 'read_only',
        can_comment_feedback: true,
        can_send_messages: true,
        can_verify_receipts: false,
        can_publish_grades: false,
        can_export_data: false,
      };
  }
}

export type PaymentProvider =
  | 'Telebirr'
  | 'CBE'
  | 'Hijra Bank'
  | 'ZemZem Bank'
  | 'Rammis Bank';

export const PAYMENT_PROVIDERS: {
  name: PaymentProvider;
  accountNumber: string;
  accountTitle: string;
}[] = [
  {
    name: 'Telebirr',
    accountNumber: '0911-200-301 (Merchant ID: 884210)',
    accountTitle: 'Selam Academy Hawassa',
  },
  {
    name: 'CBE',
    accountNumber: '1000284910234',
    accountTitle: 'Selam Academy PLC',
  },
  {
    name: 'Hijra Bank',
    accountNumber: '1004920184721',
    accountTitle: 'Selam Academy Hawassa',
  },
  {
    name: 'ZemZem Bank',
    accountNumber: '0029184720101',
    accountTitle: 'Selam Academy Hawassa',
  },
  {
    name: 'Rammis Bank',
    accountNumber: '3019284710293',
    accountTitle: 'Selam Academy Hawassa',
  },
];

export interface EvaluationScheme {
  quizWeights: number[];
  assignmentWeights: number[];
  midWeight: number;
  finalWeight: number;
}

export const DEFAULT_EVALUATION_SCHEME: EvaluationScheme = {
  quizWeights: [10],
  assignmentWeights: [15],
  midWeight: 25,
  finalWeight: 50,
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  employee_id: string;
  full_name: string;
  phone: string | null;
  role_department: string;
  assigned_grades_subjects: string | null;
  qualification: string | null;
  employment_status: 'active' | 'on_leave' | 'terminated';
  monthly_salary: number;
  user_id: string | null;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  gender: 'M' | 'F' | null;
  grade: string;
  section: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  sub_city: string | null;
  emergency_contact: string | null;
  enrollment_status: 'active' | 'transferred' | 'graduated' | 'withdrawn';
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  grade: string;
  teacher_id: string | null;
  evaluation_scheme?: EvaluationScheme | null;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  subject_id: string;
  semester: '1' | '2';
  quiz: number;
  quiz_scores?: number[] | null;
  assignment: number;
  assignment_scores?: number[] | null;
  mid_exam: number;
  final_exam: number;
  evaluation_scheme?: EvaluationScheme | null;
  conduct: 'A' | 'B' | 'C' | 'D' | null;
  remarks: string | null;
  published: boolean;
  teacher_id: string | null;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note: string | null;
  recorded_by: string | null;
}

export interface MessageRecord {
  id: string;
  sender_id: string;
  recipient_id: string;
  student_id: string | null;
  body: string;
  read: boolean;
  created_at: string;
}

export interface ParentFeedback {
  id: string;
  parent_id: string;
  subject: string;
  category: string | null;
  body: string;
  status: 'submitted' | 'under_review' | 'resolved';
  response: string | null;
  responded_by: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'staff' | 'parents';
  posted_by: string | null;
  created_at: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  description: string;
  amount_due: number;
  amount_paid: number;
  due_date: string | null;
}

export interface PaymentReceipt {
  id: string;
  fee_record_id: string;
  student_id: string;
  parent_id: string;
  provider: PaymentProvider;
  transaction_ref: string;
  amount_paid: number;
  receipt_image_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  review_note: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SmsLog {
  id: string;
  student_id: string;
  recipient_phone: string;
  recipient_name: string | null;
  message_text: string;
  alert_date: string;
  status: 'sent' | 'queued' | 'failed';
  triggered_by: string | null;
  created_at: string;
}

export type AssetCategory =
  | 'Furniture'
  | 'IT & Electronics'
  | 'Lab Equipment'
  | 'Books & Library'
  | 'Stationery & Consumables'
  | 'Sports & Facilities';

export interface PropertyAsset {
  id: string;
  item_code: string;
  name: string;
  category: AssetCategory;
  item_type: 'fixed_asset' | 'consumable';
  quantity: number;
  min_stock_level: number;
  unit_cost: number;
  location: string | null;
  condition: 'good' | 'needs_repair' | 'damaged' | 'disposed';
  custodian: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  asset_id: string;
  movement_type: 'stock_in' | 'issued' | 'returned' | 'damaged_writeoff';
  quantity: number;
  recipient_or_source: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}