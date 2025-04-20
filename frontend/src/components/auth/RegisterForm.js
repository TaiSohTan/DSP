import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';

const RegisterForm = () => {
    const [full_name, setFullName] = useState(''); 
    const [email, setEmail] = useState('');
    const [government_id, setGovernmentId] = useState('');
    const [phone_number , setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const { register, isLoading, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setPasswordError('');
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Submit registration form
        const response = await authAPI.register({
          email,
          password,
          full_name: fullName,
          government_id: governmentId,
          phone_number: phoneNumber,
          confirm_password: confirmPassword,
        });
        
        // Extract registration ID and redirect to OTP verification page
        const { registration_id, phone_number } = response.data;
        
        navigate('/verify', {
          state: {
            registrationId: registration_id,
            phoneNumber: phone_number
          }
        });
      } catch (err) {
        // Process registration errors
        if (err.response?.data) {
          // Format backend validation errors
          const errorData = err.response.data;
          const formattedError = Object.keys(errorData)
            .map(key => `${key}: ${errorData[key].join(' ')}`)
            .join('\n');
          setError(formattedError);
        } else {
          setError('Registration failed! Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card title="Sign Up" className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} className="mb-4" />}
          {passwordError && <Alert type="error" message={passwordError} className="mb-4" />}
          
          <TextInput
            label="Full Name"
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Your Full Name"
          />

          <TextInput
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          <TextInput
            label="Government ID"
            id="government_id"
            type="text"
            value={government_id}
            onChange={(e) => setGovernmentId(e.target.value)}
            required
            placeholder="DLXXXXXX"
          />

          <TextInput
            label="Phone Number"
            id="phone_number"
            type="text"
            value={phone_number}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            placeholder="Your Phone Number"
          />
          
          <TextInput
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />

          <TextInput
            label="Confirm Password"
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            error={passwordError} // Show error directly on the field
          />
          
          <Button 
            type="submit" 
            fullWidth 
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Sign Up'}
          </Button>
          
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default RegisterForm;