import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Alert from '../common/feedback/Alert';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import componentStyles from '../../theme/componentStyles';
import theme from '../../theme';
import { authAPI } from '../../services/api';

// Use the standardized form styles
const { form: styles } = componentStyles;

const RegisterForm = () => {
    const [fullName, setFullName] = useState(''); 
    const [email, setEmail] = useState('');
    const [governmentId, setGovernmentId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validate passwords match
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
        
        // Extract registration ID and redirect to OTP verification page with correct property names
        const { registration_id, phone_number } = response.data;
        
        // Use the exact property names expected by OTPVerificationForm
        navigate('/verify', {
          state: {
            registration_id: registration_id,
            phone_number: phone_number
          }
        });
      } catch (err) {
        // Process registration errors
        if (err.response?.data) {
          // Format backend validation errors
          const errorData = err.response.data;
          if (typeof errorData === 'object' && !errorData.error) {
            const formattedError = Object.keys(errorData)
              .map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${errorData[key].join(' ')}`)
              .join('\n');
            setError(formattedError);
          } else {
            // Direct error message from the backend
            setError(errorData.error || 'Registration failed! Please try again.');
          }
        } else {
          setError('Registration failed! Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const footer = (
      <p style={styles.footerText}>
        Already have an account?{' '}
        <Link to="/login" style={styles.link}>
          Sign in
        </Link>
      </p>
    );

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <Card
            title="Create an Account"
            subtitle="Fill in your details to get started"
            footer={footer}
            style={{ maxWidth: '28rem', margin: '0 auto', border: `1px solid ${theme.colors.neutral[200]}` }}
          >
            {error && <Alert type="error" message={error} />}
            {passwordError && <Alert type="error" message={passwordError} />}
            
            <form onSubmit={handleSubmit}>
              <div style={styles.group}>
                <label htmlFor="full_name" style={styles.label}>
                  Full Name<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your Full Name"
                />
              </div>
              
              <div style={styles.group}>
                <label htmlFor="email" style={styles.label}>
                  Email Address<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              
              <div style={styles.group}>
                <label htmlFor="government_id" style={styles.label}>
                  Government ID<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  id="government_id"
                  type="text"
                  value={governmentId}
                  onChange={(e) => setGovernmentId(e.target.value)}
                  required
                  placeholder="DLXXXXXX"
                />
              </div>
              
              <div style={styles.group}>
                <label htmlFor="phone_number" style={styles.label}>
                  Phone Number<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  id="phone_number"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="Your Phone Number"
                />
              </div>
              
              <div style={styles.group}>
                <label htmlFor="password" style={styles.label}>
                  Password<span style={styles.required}>*</span>
                </label>
                <input
                  style={styles.input}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>
              
              <div style={styles.group}>
                <label htmlFor="confirm_password" style={styles.label}>
                  Confirm Password<span style={styles.required}>*</span>
                </label>
                <input
                  style={{
                    ...styles.input,
                    ...(passwordError ? { borderColor: theme.colors.error[500] } : {})
                  }}
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              
              <div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
};

export default RegisterForm;