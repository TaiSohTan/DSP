import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, electionAPI } from '../../services/api';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Alert from '../common/feedback/Alert';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, verified: 0, pending: 0 },
    elections: { total: 0, active: 0, upcoming: 0, completed: 0 },
    votes: { total: 0, verified: 0 },
    system: { status: 'healthy', lastSync: null }
  });
  const [recentElections, setRecentElections] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch dashboard stats
        const statsResponse = await adminAPI.getDashboardStats();
        setStats(statsResponse.data);
        
        // Fetch recent elections (limit to 5)
        const electionsResponse = await electionAPI.getElections({ limit: 5 });
        setRecentElections(electionsResponse.data);
        
        // Fetch recent users (limit to 5)
        const usersResponse = await adminAPI.getUsers({ limit: 5 });
        setRecentUsers(usersResponse.data);

        // In a real implementation, you would fetch activity logs
        // For now we'll generate some sample activity data
        setRecentActivity(generateSampleActivity());
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Generate sample activity data
  const generateSampleActivity = () => {
    const activities = [
      { id: 1, type: 'user_verified', user: 'Emily Johnson', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 2, type: 'election_created', election: 'Student Council Elections 2025', admin: 'Admin', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 3, type: 'vote_cast', election: 'City Mayor Election', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: 4, type: 'system_update', message: 'System updated to version 2.3.0', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
      { id: 5, type: 'user_registration', user: 'Michael Rodriguez', timestamp: new Date(Date.now() - 18 * 3600000).toISOString() }
    ];
    return activities;
  };

  // Prepare chart data for users
  const usersChartData = {
    labels: ['Verified', 'Pending'],
    datasets: [
      {
        data: [stats.users.verified, stats.users.pending],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  // Prepare chart data for elections
  const electionsChartData = {
    labels: ['Active', 'Upcoming', 'Completed'],
    datasets: [
      {
        data: [stats.elections.active, stats.elections.upcoming, stats.elections.completed],
        backgroundColor: ['#10B981', '#3B82F6', '#6B7280'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  // Prepare chart data for votes trend
  const votesTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Votes',
        data: [65, 82, 91, 70, 95, 110, 120], // Sample data
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 2
      }
    ]
  };

  // Chart options
  const doughnutOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8
        }
      }
    },
    maintainAspectRatio: false
  };

  const barOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false
  };

  // Format date for readable display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'user_verified':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
      case 'election_created':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'vote_cast':
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
        );
      case 'system_update':
        return (
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'user_registration':
        return (
          <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Get activity message based on type
  const getActivityMessage = (activity) => {
    switch(activity.type) {
      case 'user_verified':
        return (
          <span>User <span className="font-medium text-gray-900">{activity.user}</span> was verified</span>
        );
      case 'election_created':
        return (
          <span><span className="font-medium text-gray-900">{activity.election}</span> was created by {activity.admin}</span>
        );
      case 'vote_cast':
        return (
          <span>New vote cast in <span className="font-medium text-gray-900">{activity.election}</span></span>
        );
      case 'system_update':
        return (
          <span>{activity.message}</span>
        );
      case 'user_registration':
        return (
          <span>New user <span className="font-medium text-gray-900">{activity.user}</span> registered</span>
        );
      default:
        return <span>Unknown activity</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <motion.h1 variants={fadeIn} className="text-3xl font-bold text-gray-900">Admin Dashboard</motion.h1>
        
        <motion.div variants={fadeIn} className="flex items-center space-x-4">
          <div className="bg-white rounded-lg shadow px-3 py-2 flex items-center space-x-2">
            <div className="text-sm text-gray-500">Time Range:</div>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm font-medium text-gray-800 border-none focus:ring-0"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <Link 
            to="/admin/reports" 
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors px-4 py-2 rounded-lg text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Report
          </Link>
        </motion.div>
      </div>
      
      {/* Quick Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={staggerContainer}
      >
        {/* Users stats */}
        <motion.div variants={fadeIn} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-gray-500 text-sm uppercase font-semibold">Users</h2>
                <p className="text-3xl font-bold mt-2 text-gray-900">{stats.users.total.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-green-600">
                <span className="font-medium">{stats.users.verified.toLocaleString()}</span> Verified
              </div>
              <div className="text-yellow-600">
                <span className="font-medium">{stats.users.pending.toLocaleString()}</span> Pending
              </div>
            </div>
          </div>
          <div className="bg-blue-50 px-6 py-3">
            <Link to="/admin/users" className="text-blue-700 hover:text-blue-800 text-sm font-medium flex items-center">
              Manage Users
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
        
        {/* Elections stats */}
        <motion.div variants={fadeIn} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-gray-500 text-sm uppercase font-semibold">Elections</h2>
                <p className="text-3xl font-bold mt-2 text-gray-900">{stats.elections.total.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="text-green-600">
                <span className="font-medium block">{stats.elections.active.toLocaleString()}</span> Active
              </div>
              <div className="text-blue-600">
                <span className="font-medium block">{stats.elections.upcoming.toLocaleString()}</span> Upcoming
              </div>
              <div className="text-gray-600">
                <span className="font-medium block">{stats.elections.completed.toLocaleString()}</span> Completed
              </div>
            </div>
          </div>
          <div className="bg-purple-50 px-6 py-3">
            <Link to="/admin/elections" className="text-purple-700 hover:text-purple-800 text-sm font-medium flex items-center">
              Manage Elections
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
        
        {/* Votes stats */}
        <motion.div variants={fadeIn} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-gray-500 text-sm uppercase font-semibold">Votes</h2>
                <p className="text-3xl font-bold mt-2 text-gray-900">{stats.votes.total.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-green-600">
                <span className="font-medium">{stats.votes.verified.toLocaleString()}</span> Verified
              </div>
              <div className="text-gray-600">
                <span className="font-medium">{(stats.votes.total - stats.votes.verified).toLocaleString()}</span> Pending
              </div>
            </div>
          </div>
          <div className="bg-green-50 px-6 py-3">
            <Link to="/admin/votes" className="text-green-700 hover:text-green-800 text-sm font-medium flex items-center">
              View Votes
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
        
        {/* System status */}
        <motion.div variants={fadeIn} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-gray-500 text-sm uppercase font-semibold">System Status</h2>
                <p className={`text-lg font-bold mt-2 capitalize ${
                  stats.system.status === 'healthy' ? 'text-green-600' : 
                  stats.system.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.system.status}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                stats.system.status === 'healthy' ? 'bg-green-100' : 
                stats.system.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  stats.system.status === 'healthy' ? 'text-green-600' : 
                  stats.system.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Last blockchain sync:</p>
              <p className="font-medium">
                {stats.system.lastSync 
                  ? new Date(stats.system.lastSync).toLocaleString() 
                  : 'Not available'}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link to="/admin/system" className="text-gray-700 hover:text-gray-800 text-sm font-medium flex items-center">
              System Settings
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts and Data Visualization */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Votes Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Voting Activity</h2>
          <div className="h-64">
            <Bar data={votesTrendData} options={barOptions} />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Users Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Users</h2>
            <div className="h-48">
              <Doughnut data={usersChartData} options={doughnutOptions} />
            </div>
          </div>

          {/* Elections Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Elections</h2>
            <div className="h-48">
              <Doughnut data={electionsChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeIn} className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/elections/new" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Create Election</h3>
                <p className="text-sm text-gray-500">Set up a new election</p>
              </div>
            </div>
          </Link>
          
          <Link to="/admin/users/verification" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Verify Users</h3>
                <p className="text-sm text-gray-500">{stats.users.pending} pending verifications</p>
              </div>
            </div>
          </Link>
          
          <Link to="/admin/votes/nullification" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Review Nullifications</h3>
                <p className="text-sm text-gray-500">Manage contested votes</p>
              </div>
            </div>
          </Link>
          
          <Link to="/admin/blockchain" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Blockchain Status</h3>
                <p className="text-sm text-gray-500">Monitor blockchain health</p>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Timeline */}
        <motion.div variants={fadeIn} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center text-gray-500">No recent activity</div>
            ) : (
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className="py-4">
                      <div className="flex items-start space-x-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600">
                            {getActivityMessage(activity)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/admin/activity" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View all activity
              </Link>
            </div>
          </div>
        </motion.div>
        
        {/* Recent elections and users tabs */}
        <motion.div variants={fadeIn} className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button 
                className="px-6 py-4 text-sm font-medium border-b-2 border-indigo-500 text-indigo-600"
              >
                Recent Elections
              </button>
              <button 
                className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Recent Users
              </button>
            </nav>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentElections.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No elections found</div>
            ) : (
              recentElections.map((election) => (
                <div key={election.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link to={`/admin/elections/${election.id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                        {election.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      election.status === 'active' ? 'bg-green-100 text-green-800' : 
                      election.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {election.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                    {election.description || 'No description available.'}
                  </p>
                </div>
              ))
            )}
            
            <div className="p-4 text-center">
              <Link to="/admin/elections" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View all elections
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;