import { Utensils, Coffee, Sunrise, User, Heart, type LucideIcon } from "lucide-react";

// Mirrors mobile/src/constants/types.ts BREAK_TYPES (icons mapped to lucide).
export interface BreakType {
  type: string;
  label: string;
  icon: LucideIcon;
  maxMinutes: number;
  color: string;
}

export const BREAK_TYPES: BreakType[] = [
  { type: "LUNCH", label: "Lunch Break", icon: Utensils, maxMinutes: 60, color: "#F97316" },
  { type: "SHORT_BREAK", label: "Short Break", icon: Coffee, maxMinutes: 15, color: "#1D4ED8" },
  { type: "PRAYER", label: "Prayer Break", icon: Sunrise, maxMinutes: 20, color: "#8B5CF6" },
  { type: "PERSONAL", label: "Personal Break", icon: User, maxMinutes: 15, color: "#14B8A6" },
  { type: "NURSING", label: "Nursing Break", icon: Heart, maxMinutes: 30, color: "#EC4899" },
];

export const LEAVE_TYPES = [
  { type: "ANNUAL", label: "Annual Leave" },
  { type: "SICK", label: "Sick Leave" },
  { type: "CASUAL", label: "Casual Leave" },
  { type: "MATERNITY", label: "Maternity Leave" },
  { type: "PATERNITY", label: "Paternity Leave" },
  { type: "UNPAID", label: "Unpaid Leave" },
  { type: "COMPASSIONATE", label: "Compassionate Leave" },
];

// Mirrors mobile StatusBadge STATUS_MAP.
export const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  PRESENT: { bg: "#D1FAE5", text: "#065F46", label: "Present" },
  LATE: { bg: "#FEF3C7", text: "#92400E", label: "Late" },
  ABSENT: { bg: "#FEE2E2", text: "#991B1B", label: "Absent" },
  ON_LEAVE: { bg: "#EFF6FF", text: "#1E3A8A", label: "On Leave" },
  HALF_DAY: { bg: "#FFEDD5", text: "#F97316", label: "Half Day" },
  WEEKEND: { bg: "#F1F5F9", text: "#64748B", label: "Weekend" },
  HOLIDAY: { bg: "#CCFBF1", text: "#14B8A6", label: "Holiday" },
  ACTIVE: { bg: "#D1FAE5", text: "#065F46", label: "Active" },
  SUSPENDED: { bg: "#FEE2E2", text: "#991B1B", label: "Suspended" },
  REVIEW_REQUIRED: { bg: "#FFEDD5", text: "#F97316", label: "Under Review" },
};

export const LEAVE_COLORS: Record<string, string> = {
  ANNUAL: "#1D4ED8", SICK: "#10B981", CASUAL: "#F59E0B",
  MATERNITY: "#EC4899", PATERNITY: "#8B5CF6", UNPAID: "#64748B", COMPASSIONATE: "#F97316",
};
export const LEAVE_LABELS: Record<string, string> = {
  ANNUAL: "Annual Leave", SICK: "Sick Leave", CASUAL: "Casual Leave",
  MATERNITY: "Maternity", PATERNITY: "Paternity", UNPAID: "Unpaid Leave", COMPASSIONATE: "Compassionate",
};
