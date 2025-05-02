import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/layout/Card';
import Badge from '../components/common/layout/Badge';
import Button from '../components/common/buttons/Button';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import AdminSidebar from '../components/admin/AdminSidebar';
import { electionAPI, adminAPI, blockchainAPI } from '../services/api';
import theme from '../theme';

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    users: {
      total: 0,
      verified: 0,
      unverified: 0,
      admins: 0,
      recent: 0
    },
    elections: {
      total: 0,
      active: 0,
      upcoming: 0,
      past: 0
    },
    votes: {
      total: 0,
      confirmed: 0,
      pending: 0
    },
    blockchain: {
      wallets: 0,
      transactions: 0
    }
  });
  const [recentElections, setRecentElections] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'unknown',
    message: 'Checking system status...'
  });
  const [blockchainStatus, setBlockchainStatus] = useState({
    connected: false,
    message: 'Checking blockchain connection...'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch system status
        try {
          const systemResponse = await adminAPI.checkSystemStatus();
          setSystemStatus({
            status: systemResponse.data.status || 'unknown',
            message: systemResponse.data.message || 'System status unknown'
          });
        } catch (err) {
          console.warn('Could not fetch system status:', err);
          setSystemStatus({
            status: 'error',
            message: 'Could not retrieve system status'
          });
        }
        
        // Fetch blockchain status
        try {
          const blockchainResponse = await blockchainAPI.checkConnection();
          setBlockchainStatus({
            connected: blockchainResponse.data.connected || false,
            message: blockchainResponse.data.message || 'Unknown blockchain status'
          });
        } catch (err) {
          console.warn('Could not fetch blockchain status:', err);
          setBlockchainStatus({
            connected: false,
            message: 'Could not connect to blockchain'
          });
        }
        
        // Fetch user statistics
        try {
          const usersResponse = await adminAPI.getUsers({ limit: 1 });
          setStats(prevStats => ({
            ...prevStats,
            users: {
              ...prevStats.users,
              total: usersResponse.data.count || 0,
              unverified: usersResponse.data.pending_verifications || 0
            }
          }));
          
          // Set recent users
          if (usersResponse.data.results && usersResponse.data.results.length > 0) {
            setRecentUsers(usersResponse.data.results);
          }
        } catch (err) {
          console.warn('Could not fetch user statistics:', err);
        }
        
        // Fetch election statistics
        try {
          const electionsResponse = await adminAPI.getElectionStats();
          console.log('Election stats response:', electionsResponse.data); // Debug log
          setStats(prevStats => ({
            ...prevStats,
            elections: {
              total: electionsResponse.data.elections?.total || 0,
              active: electionsResponse.data.elections?.active || 0,
              upcoming: electionsResponse.data.elections?.upcoming || 0,
              past: electionsResponse.data.elections?.past || 0
            },
            votes: {
              ...prevStats.votes,
              total: electionsResponse.data.votes?.total || 0
            }
          }));
        } catch (err) {
          console.warn('Could not fetch election statistics:', err);
        }
        
        // Get recent elections data
        try {
          const electionsResponse = await electionAPI.getElections(1);
          setRecentElections(electionsResponse.data.results || []);
        } catch (err) {
          console.warn('Could not fetch elections:', err);
          setRecentElections([]);
        }

      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError('Unable to load complete admin dashboard data. Some information may be missing.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminData();
    
    // Set up interval for periodic refresh (every 60 seconds)
    const interval = setInterval(fetchAdminData, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleCheckForTampering = async () => {
    // Call the vote tampering check API
    try {
      setBlockchainStatus({
        ...blockchainStatus,
        connected: false,
        message: "Checking for tampering..."
      });
      
      const response = await adminAPI.checkVoteTampering();
      const { status, message } = response.data;
      
      // Update blockchain status based on the response
      setBlockchainStatus({
        connected: true,
        message: message || "Tampering check completed"
      });
      
      // Display appropriate alert based on the results
      if (status === 'success') {
        alert("No tampering detected. All votes verified successfully.");
      } else if (status === 'error') {
        const tamperedCount = response.data.details?.tampered_votes?.length || 0;
        alert(`Tampering detected! ${tamperedCount} votes may have been tampered with. Check the Blockchain Status page for details.`);
      } else if (status === 'warning') {
        alert("No tampering detected, but some elections don't have Merkle trees for verification.");
      }
      
      setError(null);
    } catch (err) {
      console.error('Error checking for tampering:', err);
      setError('Failed to check for tampering. Please try again later.');
      setBlockchainStatus({
        connected: false,
        message: "Tampering check failed"
      });
    }
  };

  const handleSidebarAction = (action) => {
    if (action === 'checkTampering') {
      handleCheckForTampering();
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '64vh',
        marginLeft: '240px' // Offset for sidebar
      }}>
        <LoadingSpinner size="medium" />
        <p style={{ marginTop: '1rem', color: theme.colors.neutral[600] }}>Loading admin dashboard...</p>
      </div>
    );
  }

  const healthColors = {
    healthy: theme.colors.success[500],
    warning: theme.colors.warning[500],
    critical: theme.colors.error[500],
    unknown: theme.colors.neutral[400],
    operational: theme.colors.success[500],
    error: theme.colors.error[500]
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <AdminSidebar onActionClick={handleSidebarAction} />
      
      {/* Main Content */}
      <div style={{ 
        flexGrow: 1, 
        marginLeft: '240px', // Match sidebar width exactly
        padding: theme.layout.container.padding.DEFAULT,
        width: 'calc(100% - 240px)',
        boxSizing: 'border-box'
      }}>
        {/* Admin Dashboard Header */}
        <div style={{ 
          background: `linear-gradient(to right, ${theme.colors.primary[700]}, ${theme.colors.primary[900]})`,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.boxShadow.lg,
          padding: theme.spacing[6],
          marginBottom: theme.spacing[8]
        }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 style={{ fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing[2], color: theme.colors.white }}>
                Admin Dashboard
              </h1>
              <p style={{ color: theme.colors.primary[100] }}>
                System administration and management portal
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: theme.colors.primary[100],
                padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                borderRadius: theme.borderRadius.full,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                {new Date().toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div style={{ marginBottom: theme.spacing[6] }}>
            <Alert 
              type="error" 
              title="Dashboard Error"
              message={error} 
              dismissible={true}
            />
          </div>
        )}
        
        {/* Admin Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: System Overview */}
          <div style={{ 
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.boxShadow.md,
            padding: theme.spacing[6],
            borderLeft: `4px solid ${theme.colors.primary[500]}`
          }}>
            <h3 style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing[4], color: theme.colors.neutral[900] }}>
              System Overview
            </h3>
            
            <div style={{ marginBottom: theme.spacing[4] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing[2] }}>
                <span style={{ color: theme.colors.neutral[500] }}>System Status</span>
                <span style={{ 
                  fontWeight: theme.typography.fontWeight.medium,
                  color: healthColors[systemStatus.status] || healthColors.unknown,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: theme.spacing[2],
                    height: theme.spacing[2],
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: healthColors[systemStatus.status] || healthColors.unknown,
                    marginRight: theme.spacing[1]
                  }}></span>
                  {systemStatus.status === 'operational' || systemStatus.status === 'healthy' ? 'Operational' : 
                   systemStatus.status === 'warning' ? 'Performance Issues' : 
                   systemStatus.status === 'error' || systemStatus.status === 'critical' ? 'Critical Issues' : 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing[2] }}>
                <span style={{ color: theme.colors.neutral[500] }}>Blockchain Status</span>
                <span style={{ 
                  fontWeight: theme.typography.fontWeight.medium,
                  color: blockchainStatus.connected ? theme.colors.success[500] : theme.colors.error[500]
                }}>
                  {blockchainStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: theme.spacing[4] }}>
              <Link to="/admin/settings" style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                color: theme.colors.primary[600],
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                System Settings
                <svg style={{ marginLeft: theme.spacing[1], width: theme.spacing[4], height: theme.spacing[4] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Card 2: User Statistics */}
          <div style={{ 
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.boxShadow.md,
            padding: theme.spacing[6],
            borderLeft: `4px solid ${theme.colors.indigo[500]}`
          }}>
            <h3 style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing[4], color: theme.colors.neutral[900] }}>
              User Statistics
            </h3>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: theme.spacing[2] }}>
                <span style={{ color: theme.colors.neutral[500] }}>Total Users</span>
                <span style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                  {stats.users.total.toLocaleString()}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: theme.colors.neutral[500] }}>Pending Verifications</span>
                <span style={{ 
                  fontSize: theme.typography.fontSize.lg, 
                  fontWeight: theme.typography.fontWeight.bold,
                  color: stats.users.unverified > 0 ? theme.colors.warning[600] : theme.colors.neutral[800]
                }}>
                  {stats.users.unverified}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: theme.spacing[4] }}>
              <Link to="/admin/users" style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                color: theme.colors.indigo[600],
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Manage Users
                <svg style={{ marginLeft: theme.spacing[1], width: theme.spacing[4], height: theme.spacing[4] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Card 3: Election Stats */}
          <div style={{ 
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.boxShadow.md,
            padding: theme.spacing[6],
            borderLeft: `4px solid ${theme.colors.violet[500]}`
          }}>
            <h3 style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing[4], color: theme.colors.neutral[900] }}>
              Election Analytics
            </h3>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: theme.spacing[2] }}>
                <span style={{ color: theme.colors.neutral[500] }}>Total Elections</span>
                <span style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                  {stats.elections.total}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: theme.spacing[2] }}>
                <span style={{ color: theme.colors.neutral[500] }}>Active Elections</span>
                <span style={{ 
                  fontSize: theme.typography.fontSize.lg, 
                  fontWeight: theme.typography.fontWeight.bold,
                  color: stats.elections.active > 0 ? theme.colors.success[600] : theme.colors.neutral[800]
                }}>
                  {stats.elections.active}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: theme.colors.neutral[500] }}>Total Votes Cast</span>
                <span style={{ fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold }}>
                  {stats.votes.total.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: theme.spacing[4] }}>
              <Link to="/admin/elections" style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                color: theme.colors.violet[600],
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                View Elections
                <svg style={{ marginLeft: theme.spacing[1], width: theme.spacing[4], height: theme.spacing[4] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Recent Elections Table */}
        <Card 
          title="Recent Elections" 
          subtitle="Manage and monitor recent election activity"
          style={{ marginBottom: theme.spacing[6], borderTop: `4px solid ${theme.colors.violet[500]}` }}
        >
          {recentElections.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.neutral[200]}` }}>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Title</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Status</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Start Date</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>End Date</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentElections.map((election) => {
                    const now = new Date();
                    const startDate = new Date(election.start_date);
                    const endDate = new Date(election.end_date);
                    
                    let status = 'Upcoming';
                    let statusColor = theme.colors.blue[500];
                    
                    if (now >= startDate && now <= endDate) {
                      status = 'Active';
                      statusColor = theme.colors.green[500];
                    } else if (now > endDate) {
                      status = 'Ended';
                      statusColor = theme.colors.gray[500];
                    }
                    
                    const hasContract = !!election.contract_address;
                    
                    return (
                      <tr key={election.id} style={{ 
                        borderBottom: `1px solid ${theme.colors.neutral[200]}`,
                        ':hover': { backgroundColor: theme.colors.neutral[50] }
                      }}>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          <div style={{ fontWeight: theme.typography.fontWeight.medium }}>{election.title}</div>
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                            backgroundColor: `${statusColor}20`, // Using hex with 20% opacity
                            color: statusColor,
                            borderRadius: theme.borderRadius.full,
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.medium
                          }}>
                            {status}
                          </span>
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          {startDate.toLocaleDateString()}
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          {endDate.toLocaleDateString()}
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                            <Link 
                              to={`/admin/elections/${election.id}`}
                              style={{ color: theme.colors.blue[600], ':hover': { textDecoration: 'underline' } }}
                            >
                              Edit
                            </Link>
                            {!hasContract && (
                              <Link 
                                to={`/admin/elections/${election.id}/deploy`}
                                style={{ color: theme.colors.purple[600], ':hover': { textDecoration: 'underline' } }}
                              >
                                Deploy
                              </Link>
                            )}
                            <Link 
                              to={`/elections/${election.id}`}
                              style={{ color: theme.colors.green[600], ':hover': { textDecoration: 'underline' } }}
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              padding: `${theme.spacing[10]} ${theme.spacing[4]}`,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: theme.colors.neutral[500]
            }}>
              <svg style={{ 
                width: theme.spacing[12],
                height: theme.spacing[12],
                color: theme.colors.neutral[400],
                marginBottom: theme.spacing[3]
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No elections have been created yet</p>
              <Link 
                to="/admin/elections/new"
                style={{
                  display: 'inline-block',
                  marginTop: theme.spacing[4],
                  padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                  backgroundColor: theme.colors.primary[600],
                  color: theme.colors.white,
                  borderRadius: theme.borderRadius.md,
                  fontWeight: theme.typography.fontWeight.medium,
                  boxShadow: theme.boxShadow.sm,
                  ':hover': {
                    backgroundColor: theme.colors.primary[700]
                  }
                }}
              >
                Create First Election
              </Link>
            </div>
          )}
          {recentElections.length > 0 && (
            <div style={{ 
              marginTop: theme.spacing[4], 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <Link 
                to="/admin/elections"
                style={{ 
                  color: theme.colors.violet[600], 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                View All Elections
                <svg style={{ marginLeft: theme.spacing[1], width: theme.spacing[4], height: theme.spacing[4] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </Card>
        
        {/* Recent Users */}
        <Card 
          title="Recent Users" 
          subtitle="Recently registered users requiring verification"
          style={{ marginBottom: theme.spacing[6], borderTop: `4px solid ${theme.colors.indigo[500]}` }}
        >
          {recentUsers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.neutral[200]}` }}>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Name</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Email</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>ID Type</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Status</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Date Joined</th>
                    <th style={{ padding: theme.spacing[3], textAlign: 'left', fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => {
                    return (
                      <tr key={user.id} style={{ 
                        borderBottom: `1px solid ${theme.colors.neutral[200]}`,
                        ':hover': { backgroundColor: theme.colors.neutral[50] }
                      }}>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          <div style={{ fontWeight: theme.typography.fontWeight.medium }}>{user.full_name}</div>
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          {user.email}
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          {user.government_id_type || 'N/A'}
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                            backgroundColor: user.is_verified 
                              ? `${theme.colors.success[500]}20` 
                              : `${theme.colors.warning[500]}20`,
                            color: user.is_verified 
                              ? theme.colors.success[600] 
                              : theme.colors.warning[600],
                            borderRadius: theme.borderRadius.full,
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.medium
                          }}>
                            {user.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          {new Date(user.date_joined).toLocaleDateString()}
                        </td>
                        <td style={{ padding: theme.spacing[3], fontSize: theme.typography.fontSize.sm }}>
                          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                            <Link 
                              to={`/admin/users/${user.id}`}
                              style={{ color: theme.colors.blue[600], ':hover': { textDecoration: 'underline' } }}
                            >
                              View
                            </Link>
                            {!user.is_verified && (
                              <button
                                onClick={() => {
                                  alert(`This would verify user ${user.full_name} if the endpoint existed.`);
                                }}
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: theme.colors.green[600], 
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  ':hover': { textDecoration: 'underline' }
                                }}
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              padding: `${theme.spacing[10]} ${theme.spacing[4]}`,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: theme.colors.neutral[500]
            }}>
              <svg style={{ 
                width: theme.spacing[12],
                height: theme.spacing[12],
                color: theme.colors.neutral[400],
                marginBottom: theme.spacing[3]
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>No user data available</p>
            </div>
          )}
          {recentUsers.length > 0 && (
            <div style={{ 
              marginTop: theme.spacing[4], 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <Link 
                to="/admin/users"
                style={{ 
                  color: theme.colors.indigo[600], 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                Manage All Users
                <svg style={{ marginLeft: theme.spacing[1], width: theme.spacing[4], height: theme.spacing[4] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;