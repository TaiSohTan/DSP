import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextInput from '../common/forms/TextInput';
import Select from '../common/forms/Select';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { adminAPI } from '../../services/api';

const UserFormComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [user, setUser] = useState({
    email: '',
    full_name: '',
    government_id: '',
    government_id_type: 'PASSPORT',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    role: 'USER',
    is_verified: false,
    is_eligible_to_vote: true,
    is_active: true,
  });
  
  const governmentIdTypes = [
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVERS_LICENSE', label: 'Driver\'s License' },
    { value: 'NATIONAL_ID', label: 'National ID' },
  ];
  
  const userRoles = [
    { value: 'USER', label: 'Regular User' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'ADMIN', label: 'Administrator' },
  ];
  
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await adminAPI.getUserDetails(id);
        setUser(response.data);
      } catch (err) {
        setError('Failed to load user data. Please try again.');
        console.error('Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      if (id) {
        // Update existing user
        await adminAPI.updateUser(id, user);
      } else {
        // Create new user
        // For new users, we need to include a password
        if (!user.password) {
          setError('Password is required for new users');
          setIsSaving(false);
          return;
        }
        
        await adminAPI.createUser(user);
      }
      
      setSuccess(true);
      
      // Redirect after successful save
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user. Please try again.');
      console.error('Error saving user:', err);
    } finally {
      setIsSaving(false);
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
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit User' : 'Create New User'}
      </h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message="User saved successfully!" className="mb-6" />}
      
      <form onSubmit={handleSubmit}>
        <Card title="User Information" className="mb-8">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={user.email}
                onChange={handleChange}
                required
                placeholder="Enter user email"
              />
              
              <TextInput
                label="Full Name"
                name="full_name"
                value={user.full_name}
                onChange={handleChange}
                required
                placeholder="Enter user full name"
              />
              
              {!id && (
                <TextInput
                  label="Password"
                  name="password"
                  type="password"
                  value={user.password || ''}
                  onChange={handleChange}
                  required={!id}
                  placeholder="Enter password"
                  helperText="Required for new users"
                />
              )}
              
              <TextInput
                label="Phone Number"
                name="phone_number"
                value={user.phone_number}
                onChange={handleChange}
                required
                placeholder="e.g. +441234567890"
              />
              
              <TextInput
                label="Government ID"
                name="government_id"
                value={user.government_id}
                onChange={handleChange}
                required
                placeholder="Enter government ID number"
              />
              
              <Select
                label="ID Type"
                name="government_id_type"
                value={user.government_id_type}
                onChange={handleChange}
                options={governmentIdTypes}
                required
              />
              
              <Select
                label="Role"
                name="role"
                value={user.role}
                onChange={handleChange}
                options={userRoles}
                required
              />
            </div>
          </div>
        </Card>
        
        <Card title="Address Information" className="mb-8">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Address"
                name="address"
                value={user.address}
                onChange={handleChange}
                placeholder="Enter street address"
              />
              
              <TextInput
                label="City"
                name="city"
                value={user.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
              
              <TextInput
                label="Postal Code"
                name="postal_code"
                value={user.postal_code}
                onChange={handleChange}
                placeholder="Enter postal code"
              />
              
              <TextInput
                label="Country"
                name="country"
                value={user.country}
                onChange={handleChange}
                placeholder="Enter country"
              />
            </div>
          </div>
        </Card>
        
        <Card title="Account Status" className="mb-8">
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={user.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="ml-2 text-gray-700">
                  Account Active
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_verified"
                  name="is_verified"
                  checked={user.is_verified}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <label htmlFor="is_verified" className="ml-2 text-gray-700">
                  Identity Verified
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_eligible_to_vote"
                  name="is_eligible_to_vote"
                  checked={user.is_eligible_to_vote}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <label htmlFor="is_eligible_to_vote" className="ml-2 text-gray-700">
                  Eligible to Vote
                </label>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/users')}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="small" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save User'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormComponent;