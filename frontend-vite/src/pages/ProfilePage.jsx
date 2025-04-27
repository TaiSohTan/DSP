import React, { useState, useEffect } from 'react';
import TextInput from '../components/common/forms/TextInput';
import Button from '../components/common/buttons/Button';
import Card from '../components/common/layout/Card';
import Alert from '../components/common/feedback/Alert';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { authAPI, blockchainAPI } from '../services/api';
import Modal from '../components/common/feedback/Modal';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    government_id: '',
    government_id_type: '',
    is_verified: false,
    is_eligible_to_vote: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [walletDetails, setWalletDetails] = useState({
    address: '',
    balance: 0,
    privateKeyLastFour: '',
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRotateKeyModal, setShowRotateKeyModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the dedicated authAPI method to get the profile
        const response = await authAPI.getProfile();
        console.log("Profile API response:", response.data);
        
        // Set profile with data from API, using fallbacks only when necessary
        setProfile({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          address: response.data.address || '',
          city: response.data.city || '',
          postal_code: response.data.postal_code || '',
          country: response.data.country || '',
          government_id: response.data.government_id || '',
          government_id_type: response.data.government_id_type || '',
          is_verified: response.data.is_verified || false,
          is_eligible_to_vote: response.data.is_eligible_to_vote || false
        });

        // Set wallet details if available
        if (response.data.ethereum_address) {
          setWalletDetails({
            address: response.data.ethereum_address,
            balance: response.data.wallet_balance || 0,
            privateKeyLastFour: response.data.private_key_last_four || '****'
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
        
        // Populate with data from currentUser as fallback if available
        if (currentUser) {
          setProfile(prev => ({
            ...prev,
            full_name: currentUser.fullName || '',
            email: currentUser.email || ''
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [currentUser]);
  
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
      // Include all editable fields
      const updatedProfile = {
        full_name: profile.full_name,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        country: profile.country,
      };
      
      console.log('Sending profile update:', updatedProfile);
      
      // Use the dedicated authAPI method for profile updates
      const response = await authAPI.updateProfile(updatedProfile);
      console.log('Profile update response:', response.data);
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const toggleShowPrivateKey = () => {
    setShowPrivateKey(!showPrivateKey);
  };

  const handleRotateWalletKey = async () => {
    if (!confirmPassword) {
      setPasswordError('Password is required for security verification.');
      return;
    }
    
    setIsRotatingKey(true);
    setPasswordError('');
    setError(null);
    
    try {
      const response = await blockchainAPI.rotateUserWalletKey(confirmPassword);
      
      // Update wallet details with new information
      setWalletDetails({
        address: response.data.ethereum_address,
        balance: response.data.wallet_balance,
        privateKeyLastFour: response.data.private_key_last_four
      });
      
      // Close modal and show success message
      setShowRotateKeyModal(false);
      setConfirmPassword('');
      setSuccess('Wallet key rotated successfully! Your funds have been transferred to the new wallet.');
      
      // Auto-show the last 4 digits of new private key
      setShowPrivateKey(true);
    } catch (err) {
      console.error('Error rotating wallet key:', err);
      setPasswordError(err.response?.data?.error || 'Failed to rotate wallet key. Please check your password and try again.');
    } finally {
      setIsRotatingKey(false);
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
      <h1 className="text-2xl font-bold mb-8">User Profile</h1>
      
      <Card title="Personal Information" className="max-w-2xl mx-auto mb-8">
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
              onChange={() => {}} // Empty handler for disabled field
              disabled={true} // Email is not editable
              helperText="Email cannot be changed"
            />
            
            <TextInput
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              value={profile.phone_number}
              onChange={() => {}} // Empty handler for disabled field
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
            
            <TextInput
              label="Government ID"
              id="government_id"
              name="government_id"
              value={profile.government_id}
              onChange={() => {}} // Empty handler for disabled field
              disabled={true}
            />
            
            <TextInput
              label="Government ID Type"
              id="government_id_type"
              name="government_id_type"
              value={profile.government_id_type}
              onChange={() => {}} // Empty handler for disabled field
              disabled={true}
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
      
      <Card title="Account Status" className="max-w-2xl mx-auto mb-8">
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {profile.is_verified ? 'Verified' : 'Pending Verification'}
            </span>
            <span className="text-sm text-gray-500">
              {profile.is_verified 
                ? 'Your account is fully verified.' 
                : 'Your account verification is pending.'}
            </span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.is_eligible_to_vote ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {profile.is_eligible_to_vote ? 'Eligible to Vote' : 'Not Eligible to Vote'}
            </span>
            <span className="text-sm text-gray-500">
              {profile.is_eligible_to_vote 
                ? 'You are eligible to vote.' 
                : 'You are not eligible to vote.'}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Ethereum Wallet" className="max-w-2xl mx-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path fill="currentColor" d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
              </svg>
              Your Blockchain Identity
            </h3>
            <p className="text-sm text-gray-500 mt-1">This wallet is used for secure voting on the blockchain</p>
          </div>
          
          {!walletDetails.address ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No wallet address found. Contact support if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Wallet Address */}
              <div>
                <p className="text-sm font-medium text-gray-700">Wallet Address</p>
                <div className="mt-1 flex items-center">
                  <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 font-mono text-sm truncate">
                    {walletDetails.address}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(walletDetails.address)}
                    className="ml-2 p-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                    title="Copy to clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Balance */}
              <div>
                <p className="text-sm font-medium text-gray-700">Balance</p>
                <div className="mt-1 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <span className="font-semibold">{walletDetails.balance}</span> ETH
                </div>
              </div>
              
              {/* Private Key (masked) */}
              <div>
                <p className="text-sm font-medium text-gray-700">Private Key</p>
                <div className="mt-1 flex items-center">
                  <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 font-mono text-sm">
                    {showPrivateKey
                      ? `•••••••••••••••••••••••••••••••• ${walletDetails.privateKeyLastFour}` 
                      : '••••••••••••••••••••••••••••••••••••'}
                  </div>
                  <button 
                    onClick={toggleShowPrivateKey}
                    className="ml-2 p-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                    title={showPrivateKey ? "Hide private key" : "Show last 4 digits"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      {showPrivateKey ? (
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      ) : (
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      )}
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-red-500 mt-1">
                  Never share your private key with anyone. It gives complete control of your wallet.
                </p>
              </div>
              
              {/* Rotate Key Button */}
              <div className="pt-2">
                <Button 
                  variant="outline"
                  size="small"
                  onClick={() => setShowRotateKeyModal(true)}
                >
                  Rotate Wallet Key
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Rotating your key will generate a new private key for security purposes.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Wallet Key Rotation Modal */}
      <Modal
        isOpen={showRotateKeyModal}
        onClose={() => {
          if (!isRotatingKey) {
            setShowRotateKeyModal(false);
            setConfirmPassword('');
            setPasswordError('');
          }
        }}
        title="Rotate Ethereum Wallet Key"
        showCloseButton={!isRotatingKey}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRotateKeyModal(false);
                setConfirmPassword('');
                setPasswordError('');
              }}
              disabled={isRotatingKey}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRotateWalletKey}
              disabled={isRotatingKey}
            >
              {isRotatingKey ? <LoadingSpinner size="small" color="white" /> : 'Rotate Key'}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="mb-4">
            You are about to rotate your Ethereum wallet key. This will:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Generate a new private key for your wallet</li>
            <li>Transfer any existing funds to your new wallet address</li>
            <li>Replace your current wallet information</li>
          </ul>
          <p className="mb-4 text-yellow-700">
            <strong>Important:</strong> This action cannot be undone. Please confirm your password to continue.
          </p>
          
          <TextInput
            label="Confirm Password"
            id="confirm_password"
            name="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            error={passwordError}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;