import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import theme from '../../theme';

const AdminSidebar = ({ onActionClick = () => {} }) => {
  const location = useLocation();

  // Helper function to determine active state
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  // Navigation items for the sidebar
  const navItems = [
    { 
      path: '/admin', 
      label: 'Dashboard', 
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      path: '/admin/elections', 
      label: 'Elections', 
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      path: '/admin/users', 
      label: 'Users', 
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      path: '/admin/settings', 
      label: 'Settings', 
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  // Quick actions section
  const quickActions = [
    { 
      action: 'createElection', 
      label: 'Create New Election',
      path: '/admin/elections/new',
      primary: true, 
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    { 
      action: 'checkTampering', 
      label: 'Check for Tampering',
      primary: false, 
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: theme.colors.white,
      borderRight: `1px solid ${theme.colors.neutral[200]}`,
      height: '100vh', // Full viewport height
      position: 'sticky', // Changed from fixed to sticky
      top: 0, // Stick to the top of the container
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      boxShadow: theme.boxShadow.sm,
      overflowY: 'auto' // Add scrolling to sidebar if content is too tall
    }}>
      {/* Navigation Section */}
      <div style={{ flex: 1 }}>
        <h3 style={{ 
          paddingLeft: theme.spacing[6], 
          paddingRight: theme.spacing[6],
          paddingTop: theme.spacing[6],
          marginBottom: theme.spacing[4],
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.neutral[500],
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Admin Navigation
        </h3>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
                    color: isActive(item.path) ? theme.colors.primary[600] : theme.colors.neutral[700],
                    backgroundColor: isActive(item.path) ? theme.colors.primary[50] : 'transparent',
                    borderLeft: isActive(item.path) ? `3px solid ${theme.colors.primary[600]}` : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ 
                    marginRight: theme.spacing[3],
                    color: isActive(item.path) ? theme.colors.primary[600] : theme.colors.neutral[500],
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: isActive(item.path) ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium
                  }}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Quick Actions Section */}
      <div style={{ 
        padding: theme.spacing[6],
        borderTop: `1px solid ${theme.colors.neutral[200]}`
      }}>
        <h3 style={{ 
          marginBottom: theme.spacing[4],
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.neutral[500],
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Quick Actions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          {quickActions.map((action) => (
            action.path ? (
              <Link 
                key={action.action}
                to={action.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: theme.spacing[3],
                  backgroundColor: action.primary ? theme.colors.primary[600] : theme.colors.white,
                  color: action.primary ? theme.colors.white : theme.colors.primary[600],
                  border: action.primary ? 'none' : `1px solid ${theme.colors.primary[600]}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ marginRight: theme.spacing[2] }}>
                  {action.icon}
                </span>
                {action.label}
              </Link>
            ) : (
              <button 
                key={action.action}
                onClick={() => onActionClick(action.action)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: theme.spacing[3],
                  backgroundColor: action.primary ? theme.colors.primary[600] : theme.colors.white,
                  color: action.primary ? theme.colors.white : theme.colors.primary[600],
                  border: action.primary ? 'none' : `1px solid ${theme.colors.primary[600]}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ marginRight: theme.spacing[2] }}>
                  {action.icon}
                </span>
                {action.label}
              </button>
            )
          ))}
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;