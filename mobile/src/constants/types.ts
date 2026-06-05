// Static configuration constants — not mock data, these are enum definitions.

export const BREAK_TYPES = [
  { type: 'LUNCH',       label: 'Lunch Break',    icon: 'restaurant',    maxMinutes: 60, color: '#F97316' },
  { type: 'SHORT_BREAK', label: 'Short Break',     icon: 'cafe',          maxMinutes: 15, color: '#1D4ED8' },
  { type: 'PRAYER',      label: 'Prayer Break',    icon: 'partly-sunny',  maxMinutes: 20, color: '#8B5CF6' },
  { type: 'PERSONAL',    label: 'Personal Break',  icon: 'person',        maxMinutes: 15, color: '#14B8A6' },
  { type: 'NURSING',     label: 'Nursing Break',   icon: 'heart',         maxMinutes: 30, color: '#EC4899' },
];

export const LEAVE_TYPES = [
  { type: 'ANNUAL',         label: 'Annual Leave' },
  { type: 'SICK',           label: 'Sick Leave' },
  { type: 'CASUAL',         label: 'Casual Leave' },
  { type: 'MATERNITY',      label: 'Maternity Leave' },
  { type: 'PATERNITY',      label: 'Paternity Leave' },
  { type: 'UNPAID',         label: 'Unpaid Leave' },
  { type: 'COMPASSIONATE',  label: 'Compassionate Leave' },
];
