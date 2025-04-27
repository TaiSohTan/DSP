import theme from './index';

/**
 * Component Style Generators
 * 
 * This utility file provides functions that generate styles for common components
 * based on the application theme, ensuring styling consistency across the app.
 */

// Form related styles
export const formStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: theme.colors.neutral[50],
    padding: `${theme.spacing[12]} ${theme.spacing[4]}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: theme.spacing[96],
    ...theme.layout.card,
  },
  content: {
    padding: theme.spacing[6],
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  subtitle: {
    marginTop: theme.spacing[1],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  group: {
    marginBottom: theme.spacing[5],
  },
  label: {
    ...theme.forms.label.default,
  },
  required: {
    color: theme.colors.error[500],
    marginLeft: theme.spacing[0.5],
  },
  input: {
    ...theme.forms.input.default,
  },
  footer: {
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    backgroundColor: theme.colors.neutral[50],
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
    textAlign: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  link: {
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary[600],
    textDecoration: 'none',
    transition: `color ${theme.transitions.duration[200]} ${theme.transitions.timing.inOut}`,
    ':hover': {
      color: theme.colors.primary[700],
    },
  },
  checkbox: {
    marginRight: theme.spacing[2],
  },
  flexBetween: {
    ...theme.layout.flexBetween,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  button: {
    ...theme.forms.button.base,
    ...theme.forms.button.primary,
    width: '100%',
  },
  errorContainer: {
    marginBottom: theme.spacing[4],
  },
};

// Card layout styles
export const cardStyles = {
  container: {
    ...theme.layout.card,
    padding: theme.spacing[6],
  },
  header: {
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  content: {
    marginTop: theme.spacing[4],
  },
  footer: {
    marginTop: theme.spacing[6],
    paddingTop: theme.spacing[4],
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
    display: 'flex',
    justifyContent: 'flex-end',
  },
};

// Table styles
export const tableStyles = {
  container: {
    width: '100%',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  header: {
    backgroundColor: theme.colors.neutral[50],
    borderBottom: `1px solid ${theme.colors.neutral[200]}`,
  },
  headerCell: {
    padding: theme.spacing[3],
    textAlign: 'left',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[700],
  },
  row: {
    borderBottom: `1px solid ${theme.colors.neutral[200]}`,
    transition: `background-color ${theme.transitions.duration[200]} ${theme.transitions.timing.inOut}`,
    ':hover': {
      backgroundColor: theme.colors.neutral[50],
    },
  },
  cell: {
    padding: theme.spacing[3],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[800],
  },
};

// Button styles
export const buttonStyles = {
  primary: {
    ...theme.forms.button.base,
    ...theme.forms.button.primary,
  },
  secondary: {
    ...theme.forms.button.base,
    ...theme.forms.button.secondary,
  },
  danger: {
    ...theme.forms.button.base,
    ...theme.forms.button.danger,
  },
  outline: {
    ...theme.forms.button.base,
    ...theme.forms.button.outline,
  },
  white: {
    ...theme.forms.button.base,
    backgroundColor: theme.colors.white,
    color: theme.colors.primary[600],
    border: 'none',
    ':hover': {
      backgroundColor: theme.colors.neutral[100],
    },
  },
  disabled: {
    ...theme.forms.button.disabled,
  },
};

// Navigation styles
export const navStyles = {
  container: {
    backgroundColor: theme.colors.white,
    borderBottom: `1px solid ${theme.colors.neutral[200]}`,
    padding: `${theme.spacing[2]} ${theme.spacing[6]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
  },
  nav: {
    display: 'flex',
    gap: theme.spacing[6],
  },
  navItem: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[700],
    textDecoration: 'none',
    transition: `color ${theme.transitions.duration[200]} ${theme.transitions.timing.inOut}`,
    ':hover': {
      color: theme.colors.primary[600],
    },
  },
  navItemActive: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.semibold,
  },
};

// Alert styles
export const alertStyles = {
  base: {
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[4],
  },
  info: {
    backgroundColor: theme.colors.primary[50],
    borderLeft: `4px solid ${theme.colors.primary[600]}`,
    color: theme.colors.primary[900],
  },
  success: {
    backgroundColor: theme.colors.success[50] || '#ecfdf5', // Fallback if not in theme
    borderLeft: `4px solid ${theme.colors.success[600]}`,
    color: theme.colors.success[900] || '#064e3b', // Fallback if not in theme
  },
  warning: {
    backgroundColor: theme.colors.warning[50] || '#fffbeb', // Fallback if not in theme
    borderLeft: `4px solid ${theme.colors.warning[600]}`,
    color: theme.colors.warning[900] || '#78350f', // Fallback if not in theme
  },
  error: {
    backgroundColor: '#fef2f2', // Light red
    borderLeft: `4px solid ${theme.colors.error[500]}`,
    color: theme.colors.error[900] || '#7f1d1d', // Fallback if not in theme
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
  },
  message: {
    fontSize: theme.typography.fontSize.sm,
  },
};

// Page layout styles
export const pageStyles = {
  container: {
    width: '100%',
    maxWidth: theme.layout.container.maxWidth.xl,
    margin: '0 auto',
    padding: theme.layout.container.padding.DEFAULT,
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[2],
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral[500],
    maxWidth: theme.spacing[96],
  },
  content: {
    marginTop: theme.spacing[6],
  },
};

// Merge all styles
const componentStyles = {
  form: formStyles,
  card: cardStyles,
  table: tableStyles,
  button: buttonStyles,
  nav: navStyles,
  alert: alertStyles,
  page: pageStyles,
};

export default componentStyles;