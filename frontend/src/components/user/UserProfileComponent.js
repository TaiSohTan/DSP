import React, { useState, useEffect } from 'react';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProfileComponent = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me/');
        setProfile({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          address: response.data.address || '',
          city: response.data.city || '',
          postal_code: response.data.postal_code || '',
          country: response.data.country || '',
        });
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Only send fields that are editable
      const updatedProfile = {
        full_name: profile.full_name,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        country: profile.country,
      };
      
      await api.patch('/users/me/', updatedProfile);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
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
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      
      <Card className="max-w-2xl mx-auto">
        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              id="full_name"
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
            
            <TextInput
              label="Email"
              id="email"
              name="email"
              value={profile.email}
              disabled={true} // Email is not editable
              helperText="Email cannot be changed"
            />
            
            <TextInput
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              value={profile.phone_number}
              disabled={true} // Phone is not editable
              helperText="Phone number cannot be changed"
            />
            
            <TextInput
              label="Address"
              id="address"
              name="address"
              value={profile.address}
              onChange={handleChange}
              disabled={!isEditing}
            />
            
            <TextInput
              label="City"
              id="city"
              name="city"
              value={profile.city}
              onChange={handleChange}
              disabled={!isEditing}
            />
            
            <TextInput
              label="Postal Code"
              id="postal_code"
              name="postal_code"
              value={profile.postal_code}
              onChange={handleChange}
              disabled={!isEditing}
            />
            
            <TextInput
              label="Country"
              id="country"
              name="country"
              value={profile.country}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                >
                  {isSaving ? <LoadingSpinner size="small" color="white" /> : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileComponent;