import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/layout/Card';
import TextInput from '../../components/common/forms/TextInput';
import Button from '../../components/common/buttons/Button';
import Alert from '../../components/common/feedback/Alert';
import LoadingSpinner from '../../components/common/feedback/LoadingSpinner';
import Badge from '../../components/common/layout/Badge';
import { adminAPI } from '../../services/api';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchUsers = async (page = 1, query = '') => {
    setIsLoading(true);
    try {
      let response;
      if (query) {
        response = await adminAPI.searchUsers(query, page);
      } else {
        response = await adminAPI.getUsers(page);
      }
      
      setUsers(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, searchQuery);
  };
  
  const handlePageChange = (page) => {
    fetchUsers(page, searchQuery);
  };
  
  const getUserRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="primary">Admin</Badge>;
      case 'STAFF':
        return <Badge variant="secondary">Staff</Badge>;
      default:
        return <Badge variant="default">User</Badge>;
    }
  };
  
  const getVerificationStatus = (isVerified) => {
    return isVerified 
      ? <Badge variant="success">Verified</Badge>
      : <Badge variant="error">Unverified</Badge>;
  };
  
  const handleVerifyUser = async (userId) => {
    try {
      await adminAPI.verifyUser(userId);
      fetchUsers(currentPage, searchQuery);
    } catch (err) {
      setError('Failed to verify user. Please try again.');
    }
  };
  
  const handleRevokeVerification = async (userId) => {
    try {
      await adminAPI.revokeVerification(userId);
      fetchUsers(currentPage, searchQuery);
    } catch (err) {
      setError('Failed to revoke verification. Please try again.');
    }
  };
  
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      fetchUsers(currentPage, searchQuery);
    } catch (err) {
      setError('Failed to delete user. Please try again.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link 
          to="/admin/users/new"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Add User
        </Link>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      <Card className="mb-8">
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <TextInput
              placeholder="Search users by name, email, or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              Search
            </Button>
          </form>
        </div>
      </Card>
      
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Government ID</th>
                  <th className="py-2 px-4 text-left">Role</th>
                  <th className="py-2 px-4 text-left">Verification</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4">{user.full_name}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">
                        {user.government_id} ({user.government_id_type})
                      </td>
                      <td className="py-2 px-4">
                        {getUserRoleBadge(user.role)}
                      </td>
                      <td className="py-2 px-4">
                        {getVerificationStatus(user.is_verified)}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex space-x-2">
                          <Link 
                            to={`/admin/users/${user.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          
                          {user.is_verified ? (
                            <button
                              className="text-orange-600 hover:text-orange-800"
                              onClick={() => handleRevokeVerification(user.id)}
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              className="text-green-600 hover:text-green-800"
                              onClick={() => handleVerifyUser(user.id)}
                            >
                              Verify
                            </button>
                          )}
                          
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4 border-t">
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="px-4 py-2 bg-gray-100 rounded">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UsersManagement;