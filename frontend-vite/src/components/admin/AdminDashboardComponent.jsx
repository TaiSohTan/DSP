import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, electionAPI } from '../../services/api';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Alert from '../common/feedback/Alert';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, verified: 0, pending: 0 },
    elections: { total: 0, active: 0, upcoming: 0, completed: 0 },
    votes: { total: 0, verified: 0 },
    system: { status: 'healthy', lastSync: null }
  });
  const [recentElections, setRecentElections] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-semibold">Users</h2>
              <p className="text-3xl font-bold mt-2">{stats.users.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-green-600">
              <span className="font-medium">{stats.users.verified}</span> Verified
            </div>
            <div className="text-yellow-600">
              <span className="font-medium">{stats.users.pending}</span> Pending
            </div>
          </div>
        </div>
        
        {/* Elections stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-semibold">Elections</h2>
              <p className="text-3xl font-bold mt-2">{stats.elections.total}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="text-green-600">
              <span className="font-medium block">{stats.elections.active}</span> Active
            </div>
            <div className="text-blue-600">
              <span className="font-medium block">{stats.elections.upcoming}</span> Upcoming
            </div>
            <div className="text-gray-600">
              <span className="font-medium block">{stats.elections.completed}</span> Completed
            </div>
          </div>
        </div>
        
        {/* Votes stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-semibold">Votes</h2>
              <p className="text-3xl font-bold mt-2">{stats.votes.total}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-green-600">
              <span className="font-medium">{stats.votes.verified}</span> Verified
            </div>
            <div className="text-gray-600">
              <span className="font-medium">{stats.votes.total - stats.votes.verified}</span> Pending
            </div>
          </div>
        </div>
        
        {/* System status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
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
      </div>
      
      {/* Recent elections */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Elections</h2>
          <Link to="/admin/elections" className="text-primary-600 hover:text-primary-800 text-sm">
            View All Elections
          </Link>
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
        </div>
      </div>
      
      {/* Recent users */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Users</h2>
          <Link to="/admin/users" className="text-primary-600 hover:text-primary-800 text-sm">
            View All Users
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No users found</div>
          ) : (
            recentUsers.map((user) => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <Link to={`/admin/users/${user.id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                    {user.full_name || user.email}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;