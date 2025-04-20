import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/layout/Card';
import Alert from '../../components/common/feedback/Alert';
import LoadingSpinner from '../../components/common/feedback/LoadingSpinner';
import { adminAPI } from '../../services/api';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    users: { total: 0, verified: 0, unverified: 0 },
    elections: { total: 0, active: 0, upcoming: 0, completed: 0 },
    votes: { total: 0, today: 0 },
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        setStats(response.data);
      } catch (err) {
        setError('Failed to load admin statistics. Please try again.');
        console.error('Error fetching admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link 
          to="/admin/elections/new"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Create New Election
        </Link>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Users" className="bg-white">
          <div className="p-4">
            <div className="text-4xl font-bold text-primary-600">{stats.users.total}</div>
            <div className="text-gray-500">Total Users</div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="font-bold text-green-800">{stats.users.verified}</div>
                <div className="text-sm text-green-600">Verified</div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <div className="font-bold text-red-800">{stats.users.unverified}</div>
                <div className="text-sm text-red-600">Unverified</div>
              </div>
            </div>
            
            <div className="mt-4">
              <Link 
                to="/admin/users"
                className="text-primary-600 hover:underline text-sm"
              >
                Manage Users →
              </Link>
            </div>
          </div>
        </Card>
        
        <Card title="Elections" className="bg-white">
          <div className="p-4">
            <div className="text-4xl font-bold text-primary-600">{stats.elections.total}</div>
            <div className="text-gray-500">Total Elections</div>
            
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="font-bold text-blue-800">{stats.elections.active}</div>
                <div className="text-sm text-blue-600">Active</div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <div className="font-bold text-yellow-800">{stats.elections.upcoming}</div>
                <div className="text-sm text-yellow-600">Upcoming</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="font-bold text-gray-800">{stats.elections.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
            
            <div className="mt-4">
              <Link 
                to="/admin/elections"
                className="text-primary-600 hover:underline text-sm"
              >
                Manage Elections →
              </Link>
            </div>
          </div>
        </Card>
        
        <Card title="Votes" className="bg-white">
          <div className="p-4">
            <div className="text-4xl font-bold text-primary-600">{stats.votes.total}</div>
            <div className="text-gray-500">Total Votes</div>
            
            <div className="mt-4 bg-indigo-100 p-3 rounded-lg">
              <div className="font-bold text-indigo-800">{stats.votes.today}</div>
              <div className="text-sm text-indigo-600">Today's Votes</div>
            </div>
            
            <div className="mt-4">
              <Link 
                to="/admin/votes"
                className="text-primary-600 hover:underline text-sm"
              >
                View Vote History →
              </Link>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card title="Quick Actions" className="mb-8">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/admin/elections/new" 
            className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <div className="text-3xl mb-2">🗳️</div>
            <div className="font-medium">Create Election</div>
          </Link>
          
          <Link 
            to="/admin/users/verify" 
            className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <div className="text-3xl mb-2">✓</div>
            <div className="font-medium">Verify Users</div>
          </Link>
          
          <Link 
            to="/admin/blockchain/status" 
            className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <div className="text-3xl mb-2">⛓️</div>
            <div className="font-medium">Blockchain Status</div>
          </Link>
          
          <Link 
            to="/admin/settings" 
            className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg flex flex-col items-center justify-center text-center"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-medium">System Settings</div>
          </Link>
        </div>
      </Card>
      
      {/* Recent Activity */}
      <Card title="Recent Activity" className="mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Activity</th>
                <th className="py-2 px-4 text-left">User</th>
                <th className="py-2 px-4 text-left">Time</th>
                <th className="py-2 px-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-2 px-4">New Election Created</td>
                <td className="py-2 px-4">admin@example.com</td>
                <td className="py-2 px-4">Just now</td>
                <td className="py-2 px-4">
                  <Link to="/admin/elections/1" className="text-primary-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">User Verified</td>
                <td className="py-2 px-4">admin@example.com</td>
                <td className="py-2 px-4">2 hours ago</td>
                <td className="py-2 px-4">
                  <Link to="/admin/users/5" className="text-primary-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Election Deployed to Blockchain</td>
                <td className="py-2 px-4">admin@example.com</td>
                <td className="py-2 px-4">Yesterday</td>
                <td className="py-2 px-4">
                  <Link to="/admin/elections/2" className="text-primary-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;