import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import TextInput from '../common/forms/TextInput';
import Checkbox from '../common/forms/Checkbox';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Card from '../common/layout/Card';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [user, setUser] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    government_id: '',
    government_id_type: '',
    is_verified: false,
    is_eligible_to_vote: false,
    is_staff: false,
    role: '',
    date_joined: '',
    ethereum_address: ''
  });
  
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Fetch user data if editing
  useEffect(() => {
    if (isEditing) {
      fetchUserData();
    }
  }, [id]);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.getUser(id);
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerificationChange = async (checked) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (checked) {
        // Call the verify user API
        await adminAPI.verifyUser(id);
        setSuccess('User verified successfully');
      }
      
      // Update the local state
      setUser({
        ...user,
        is_verified: checked
      });
      
      // Update the user data
      await adminAPI.updateUser(id, { is_verified: checked });
    } catch (err) {
      console.error('Error updating user verification status:', err);
      setError('Failed to update verification status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAdminChange = async (checked) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the local state
      setUser({
        ...user,
        is_staff: checked
      });
      
      // Update the user data
      await adminAPI.updateUser(id, { is_staff: checked });
      setSuccess('Administrator access updated successfully');
    } catch (err) {
      console.error('Error updating administrator access:', err);
      setError('Failed to update administrator access. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Details</h1>
        
        <Button
          variant="outline"
          onClick={() => navigate('/admin/users')}
          size="small"
        >
          Back to Users
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}
      
      <Card title="Personal Information" className="max-w-2xl mx-auto mb-8">
        <form className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              id="full_name"
              name="full_name"
              value={user.full_name || ''}
              disabled={true}
            />
            
            <TextInput
              label="Email"
              id="email"
              name="email"
              value={user.email || ''}
              disabled={true}
            />
            
            <TextInput
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              value={user.phone_number || ''}
              disabled={true}
            />
            
            <TextInput
              label="Address"
              id="address"
              name="address"
              value={user.address || ''}
              disabled={true}
            />
            
            <TextInput
              label="City"
              id="city"
              name="city"
              value={user.city || ''}
              disabled={true}
            />
            
            <TextInput
              label="Postal Code"
              id="postal_code"
              name="postal_code"
              value={user.postal_code || ''}
              disabled={true}
            />
            
            <TextInput
              label="Country"
              id="country"
              name="country"
              value={user.country || ''}
              disabled={true}
            />
            
            <TextInput
              label="Government ID"
              id="government_id"
              name="government_id"
              value={user.government_id || ''}
              disabled={true}
            />
            
            <TextInput
              label="Government ID Type"
              id="government_id_type"
              name="government_id_type"
              value={user.government_id_type || ''}
              disabled={true}
            />

            <TextInput
              label="Date Joined"
              id="date_joined"
              name="date_joined"
              value={new Date(user.date_joined).toLocaleString() || ''}
              disabled={true}
            />
          </div>
        </form>
      </Card>
      
      {/* Admin Controls Card - Only in admin view */}
      <Card title="Administrative Controls" className="max-w-2xl mx-auto mb-8">
        <div className="p-4">
          <div className="flex flex-col space-y-6">
            <Checkbox
              id="is_staff"
              name="is_staff"
              checked={user.is_staff || false}
              onChange={(e) => handleAdminChange(e.target.checked)}
              label="Administrator Access"
              description="Grant full administrative privileges to this user"
              disabled={isSubmitting}
            />
            
            <Checkbox
              id="is_verified"
              name="is_verified"
              checked={user.is_verified || false}
              onChange={(e) => handleVerificationChange(e.target.checked)}
              label="Verified Account"
              description="Mark user account as verified, allowing them to participate in elections"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>
      
      <Card title="Account Status" className="max-w-2xl mx-auto mb-8">
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {user.is_verified ? 'Verified' : 'Pending Verification'}
            </span>
            <span className="text-sm text-gray-500">
              {user.is_verified 
                ? 'This account is fully verified.' 
                : 'This account verification is pending.'}
            </span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_eligible_to_vote ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {user.is_eligible_to_vote ? 'Eligible to Vote' : 'Not Eligible to Vote'}
            </span>
            <span className="text-sm text-gray-500">
              {user.is_eligible_to_vote 
                ? 'This user is eligible to vote.' 
                : 'This user is not eligible to vote.'}
            </span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_staff ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {user.is_staff ? 'Administrator' : 'Regular User'}
            </span>
            <span className="text-sm text-gray-500">
              {user.is_staff 
                ? 'This user has administrative privileges.' 
                : 'This user has standard permissions.'}
            </span>
          </div>
        </div>
      </Card>

      {/* Ethereum Wallet Card */}
      {user.ethereum_address && (
        <Card title="Ethereum Wallet" className="max-w-2xl mx-auto">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path fill="currentColor" d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                </svg>
                Blockchain Identity
              </h3>
              <p className="text-sm text-gray-500 mt-1">This wallet is used for secure voting on the blockchain</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Wallet Address</p>
              <div className="mt-1 bg-gray-50 px-3 py-2 rounded border border-gray-200 font-mono text-sm break-all">
                {user.ethereum_address}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserForm;