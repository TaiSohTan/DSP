/**
 * Application Theme
 * 
 * This file contains all design tokens used throughout the application.
 * Using this centralized theme ensures consistent styling across all components.
 */

// Color palette
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    500: '#ef4444',
    600: '#dc2626',
  },
  white: '#ffffff',
  black: '#000000',
};

// Typography
const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// Spacing
const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Border radius
const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Shadows
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Transitions
const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  timing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Form elements styles
const forms = {
  input: {
    default: {
      backgroundColor: colors.white,
      borderColor: colors.neutral[300],
      borderWidth: '1px',
      borderRadius: borderRadius.md,
      padding: `${spacing[2.5]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.normal,
      width: '100%',
      outline: 'none',
      transition: `border-color ${transitions.duration[200]} ${transitions.timing.inOut}`,
    },
    focus: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 1px ${colors.primary[500]}`,
    },
    error: {
      borderColor: colors.error[500],
      boxShadow: `0 0 0 1px ${colors.error[500]}`,
    },
  },
  label: {
    default: {
      display: 'block',
      marginBottom: spacing[1],
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.neutral[700],
    },
  },
  button: {
    base: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      borderRadius: borderRadius.md,
      padding: `${spacing[2.5]} ${spacing[5]}`,
      cursor: 'pointer',
      transition: `all ${transitions.duration[200]} ${transitions.timing.inOut}`,
    },
    primary: {
      backgroundColor: colors.primary[600],
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: colors.primary[700],
      },
    },
    secondary: {
      backgroundColor: colors.neutral[200],
      color: colors.neutral[700],
      border: 'none',
      ':hover': {
        backgroundColor: colors.neutral[300],
      },
    },
    danger: {
      backgroundColor: colors.error[600],
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: colors.error[700],
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary[600],
      border: `1px solid ${colors.primary[600]}`,
      ':hover': {
        backgroundColor: colors.primary[50],
      },
    },
    disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  checkbox: {
    size: spacing[4],
    marginRight: spacing[2],
  },
};

// Layout components
const layout = {
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.neutral[200]}`,
    overflow: 'hidden',
  },
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    padding: {
      DEFAULT: spacing[4],
      sm: spacing[6],
      lg: spacing[8],
    },
  },
  header: {
    padding: spacing[6],
    borderBottom: `1px solid ${colors.neutral[200]}`,
    backgroundColor: colors.white,
  },
  footer: {
    padding: `${spacing[4]} ${spacing[6]}`,
    borderTop: `1px solid ${colors.neutral[200]}`,
    backgroundColor: colors.neutral[50],
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};

const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  forms,
  layout,
};

export default theme;