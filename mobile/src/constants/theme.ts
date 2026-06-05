// Light mode colors (default)
export const Colors = {
  primary: '#1D4ED8', primaryLight: '#3B82F6', primaryDark: '#1E3A8A',
  primaryBg: '#EFF6FF', primaryBorder: '#BFDBFE',
  white: '#FFFFFF', offWhite: '#F8FAFC',
  background: '#F8FAFC', card: '#FFFFFF',
  gray50: '#F8FAFC', gray100: '#F1F5F9', gray200: '#E2E8F0',
  gray300: '#CBD5E1', gray400: '#94A3B8', gray500: '#64748B',
  gray600: '#475569', gray700: '#334155', gray800: '#1E293B', gray900: '#0F172A',
  text: '#1E293B', textMuted: '#64748B',
  border: '#F1F5F9', inputBg: '#F8FAFC', inputBorder: '#E2E8F0',
  success: '#10B981', successBg: '#D1FAE5', successDark: '#065F46',
  warning: '#F59E0B', warningBg: '#FEF3C7', warningDark: '#92400E',
  danger: '#EF4444', dangerBg: '#FEE2E2', dangerDark: '#991B1B',
  orange: '#F97316', orangeBg: '#FFEDD5',
  purple: '#8B5CF6', purpleBg: '#EDE9FE',
  teal: '#14B8A6', tealBg: '#CCFBF1',
};

// Dark mode overrides
export const DarkColors: typeof Colors = {
  primary: '#60A5FA', primaryLight: '#93C5FD', primaryDark: '#3B82F6',
  primaryBg: '#1E3A8A', primaryBorder: '#1E40AF',
  white: '#1E293B', offWhite: '#0F172A',
  background: '#0F172A', card: '#1E293B',
  gray50: '#1E293B', gray100: '#334155', gray200: '#475569',
  gray300: '#64748B', gray400: '#94A3B8', gray500: '#CBD5E1',
  gray600: '#E2E8F0', gray700: '#F1F5F9', gray800: '#F8FAFC', gray900: '#FFFFFF',
  text: '#F1F5F9', textMuted: '#94A3B8',
  border: '#334155', inputBg: '#1E293B', inputBorder: '#475569',
  success: '#34D399', successBg: '#064E3B', successDark: '#A7F3D0',
  warning: '#FBBF24', warningBg: '#78350F', warningDark: '#FDE68A',
  danger: '#F87171', dangerBg: '#7F1D1D', dangerDark: '#FECACA',
  orange: '#FB923C', orangeBg: '#7C2D12',
  purple: '#C4B5FD', purpleBg: '#4C1D95',
  teal: '#2DD4BF', tealBg: '#134E4A',
};

export const Typography = { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 28, '3xl': 34 };
export const Spacing    = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 48 };
export const Radius     = { sm: 6, md: 10, lg: 16, xl: 22, full: 999 };

// Shadow — elevation only (works on Android; iOS uses flat CSS)
export const Shadow = {
  sm: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3 },
  md: { elevation: 4, shadowColor: '#1D4ED8', shadowOpacity: 0.10, shadowRadius: 8 },
  lg: { elevation: 8, shadowColor: '#1D4ED8', shadowOpacity: 0.18, shadowRadius: 16 },
};
