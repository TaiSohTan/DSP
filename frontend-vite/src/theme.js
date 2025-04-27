// Theme configuration for the application
const theme = {
  colors: {
    primary: {
      100: '#e6f0ff', // Light primary color
      500: '#2563eb', // Main primary color
      600: '#1e40af', // Additional primary shade
      700: '#1d4ed8', // Darker primary shade
      900: '#1e3a8a'  // Darkest primary shade
    },
    // Success colors (green)
    success: {
      500: '#10b981',
      600: '#059669'
    },
    // Warning colors (amber/yellow)
    warning: {
      500: '#f59e0b',
      600: '#d97706'
    },
    // Error colors (red)
    error: {
      500: '#ef4444',
      600: '#dc2626'
    },
    blue: {
      500: '#3b82f6',
      600: '#2563eb'
    },
    purple: {
      500: '#8b5cf6',
      600: '#7c3aed'
    },
    green: {
      500: '#22c55e',
      600: '#16a34a'
    },
    // Indigo colors
    indigo: {
      500: '#6366f1',
      600: '#4f46e5'
    },
    // Violet colors
    violet: {
      500: '#8b5cf6',
      600: '#7c3aed'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      500: '#6b7280',
      600: '#4b5563',
      800: '#1f2937'
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      800: '#262626',
      900: '#171717'
    },
    white: '#ffffff'
  },
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  layout: {
    container: {
      padding: {
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
      },
      maxWidth: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      }
    }
  }
};

export default theme;