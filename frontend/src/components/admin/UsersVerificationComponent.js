import React, { useState, useEffect } from 'react';
import Card from '../common/layout/Card';
import TextInput from '../common/forms/TextInput';
import Select from '../common/forms/Select';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { adminAPI } from '../../services/api';

const UsersVerificationComponent = () => {
  const [searchParams, setSearchParams] = useState({
    government_id: '',
    government_id_type: 'PASSPORT',
    full_name: '',
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const governmentIdTypes = [
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVERS_LICENSE', label: 'Driver\'s License' },
    { value: 'NATIONAL_ID', label: 'National ID' },
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    if (!searchParams.government_id && !searchParams.full_name) {
      setError('Please enter a government ID or full name to search.');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await adminAPI.searchVerificationUsers(
        searchParams.full_name || searchParams.government_id
      );
      setSearchResults(response.data.results || []);
      setSearchPerformed(true);
      
      if (response.data.results?.length === 0) {
        setError('No users found matching your search criteria.');
      }
    } catch (err) {
      setError('Failed to search users. Please try again.');
      console.error('Error searching users:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerify = async (userId) => {
    try {
      await adminAPI.verifyUser(userId);
      setSuccess('User verified successfully.');
      
      // Update the search results to reflect the change
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user.id === userId ? { ...user, is_verified: true } : user
        )
      );
    } catch (err) {
      setError('Failed to verify user. Please try again.');
      console.error('Error verifying user:', err);
    }
  };
  
  const handleRevoke = async (userId) => {
    try {
      await adminAPI.revokeVerification(userId);
      setSuccess('User verification revoked successfully.');
      
      // Update the search results to reflect the change
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user.id === userId ? { ...user, is_verified: false } : user
        )
      );
    } catch (err) {
      setError('Failed to revoke verification. Please try again.');
      console.error('Error revoking verification:', err);
    }
  };
  
  const verifyExternalId = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!searchParams.government_id || !searchParams.government_id_type) {
        setError('Please enter a government ID and select an ID type.');
        setIsLoading(false);
        return;
      }
      
      const response = await adminAPI.verifyUserExists({
        government_id: searchParams.government_id,
        government_id_type: searchParams.government_id_type,
      });
      
      if (response.data.exists) {
        setSuccess('Government ID verified successfully in external database.');
      } else {
        setError('Government ID not found in external database.');
      }
    } catch (err) {
      setError('Failed to verify government ID. Please try again.');
      console.error('Error verifying government ID:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Verification</h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      <Card title="Search Users" className="mb-8">
        <div className="p-4">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput
                label="Government ID"
                name="government_id"
                value={searchParams.government_id}
                onChange={handleChange}
                placeholder="Enter ID number"
              />
              
              <Select
                label="ID Type"
                name="government_id_type"
                value={searchParams.government_id_type}
                onChange={handleChange}
                options={governmentIdTypes}
              />
              
              <TextInput
                label="Full Name"
                name="full_name"
                value={searchParams.full_name}
                onChange={handleChange}
                placeholder="Enter user's full name"
              />
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={verifyExternalId}
                disabled={isLoading || !searchParams.government_id}
              >
                Verify ID in Database
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="small" color="white" className="mr-2" />
                    Searching...
                  </>
                ) : (
                  'Search Users'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
      
      {searchPerformed && (
        <Card title="Search Results" className="mb-8">
          <div className="p-4">
            {searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Name</th>
                      <th className="py-2 px-4 text-left">Email</th>
                      <th className="py-2 px-4 text-left">Government ID</th>
                      <th className="py-2 px-4 text-left">Verification Status</th>
                      <th className="py-2 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="py-2 px-4">{user.full_name}</td>
                        <td className="py-2 px-4">{user.email}</td>
                        <td className="py-2 px-4">
                          {user.government_id} ({user.government_id_type})
                        </td>
                        <td className="py-2 px-4">
                          {user.is_verified ? (
                            <span className="text-green-600 font-medium">Verified</span>
                          ) : (
                            <span className="text-red-600 font-medium">Unverified</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {user.is_verified ? (
                            <Button
                              variant="danger"
                              size="small"
                              onClick={() => handleRevoke(user.id)}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              size="small"
                              onClick={() => handleVerify(user.id)}
                            >
                              Verify
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found matching your criteria.
              </div>
            )}
          </div>
        </Card>
      )}
      
      <Card title="External Database Tools" className="mb-8">
        <div className="p-4">
          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={async () => {
                if (!window.confirm('Are you sure? This will clear the external verification database!')) {
                  return;
                }
                
                try {
                  await adminAPI.clearAuthDB();
                  setSuccess('External verification database cleared successfully.');
                } catch (err) {
                  setError('Failed to clear database. Please try again.');
                }
              }}
            >
              Clear External Database
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsersVerificationComponent;