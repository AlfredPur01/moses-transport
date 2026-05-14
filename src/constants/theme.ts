export const Colors = {
  primary: '#1A4D2E',
  primaryLight: '#256B40',
  primaryDark: '#122D1C',
  background: '#FFFFFF',
  secondary: '#8A8A80',
  text: '#1A1A1A',
  textSecondary: '#8A8A80',
  textLight: '#FFFFFF',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  card: '#F9FAFB',
  cardGreen: '#EBF5EE',
  overlay: 'rgba(0,0,0,0.5)',
  inputBackground: '#F9FAFB',
  disabled: '#D1D5DB',
  badge: {
    pending: { bg: '#FEF3C7', text: '#92400E' },
    approved: { bg: '#D1FAE5', text: '#065F46' },
    rejected: { bg: '#FEE2E2', text: '#991B1B' },
    active: { bg: '#DBEAFE', text: '#1E40AF' },
  },
} as const;

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
