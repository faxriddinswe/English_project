export interface FinancePoint {
  date: string;
  received: string;
  refunded: string;
  net: string;
  observed?: boolean;
  registrations?: number;
}
export interface ChartSlice {
  key: string;
  label: string;
  value: number;
  color: string;
  display?: string;
}
export interface DashboardAnalytics {
  generated_at: string;
  daily_finance: FinancePoint[];
  monthly: FinancePoint[];
  student_groups: { kind: string; count: number }[];
  student_total: number;
  groups: {
    id: string;
    name: string;
    course_name: string;
    capacity: number;
    students: number;
  }[];
  group_totals: { groups: number; capacity: number; occupied: number };
  attendance: { status: string; count: number }[];
  payment_methods: { method: string; amount: string }[];
  lead_status: { status: string; count: number }[];
}
export interface DashboardData {
  month: string;
  timezone: string;
  student_count: number;
  group_count: number;
  today_lessons: number;
  received: string;
  refunded: string;
  net_receipts: string;
  overdue: string;
  pending_students: number;
  new_leads: number;
  attendance_percent: number | null;
  marked_attendance: number;
  unmarked_attendance: number;
  telegram_configured: boolean;
  attention?: { label: string; href: string }[];
  consecutive_absences?: { id: string; full_name: string }[];
  absence_threshold?: number;
  analytics?: DashboardAnalytics;
}
