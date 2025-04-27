import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../common/feedback/Alert';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import componentStyles from '../../theme/componentStyles';
import theme from '../../theme';

// Use the standardized form styles
const { form: styles } = componentStyles;

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle form submission using the enhanced login method from useAuth
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const userData = await login(email, password);
      
      if (userData) {
        setLoginError(null);
        
        // Check if user is an admin and redirect accordingly
        if (userData.isAdmin || userData.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setLoginError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Set the error message locally with more details
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.detail || 'Login failed. Please check your credentials.';
      } else if (error.request) {
        errorMessage = 'No response received from server. Please try again later.';
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (loginError) {
      // Only clear error when user modifies input fields after an error
      setLoginError(null);
    }
  };

  const dismissError = () => {
    setLoginError(null);
  };

  const footer = (
    <p style={styles.footerText}>
      Don't have an account?{' '}
      <Link to="/register" style={styles.link}>
        Create an account
      </Link>
    </p>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Card
          title="Welcome Back"
          subtitle="Sign in to your account to continue"
          footer={footer}
          style={{ maxWidth: '28rem', margin: '0 auto', border: `1px solid ${theme.colors.neutral[200]}` }}
        >
          {loginError && (
            <Alert 
              type="error" 
              message={loginError} 
              dismissible={true}
              onDismiss={dismissError}
            />
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={styles.group}>
              <label htmlFor="email" style={styles.label}>
                Email Address<span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                id="email"
                type="email"
                value={email}
                onChange={handleInputChange(setEmail)}
                required
                placeholder="you@example.com"
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
                onChange={handleInputChange(setPassword)}
                required
                placeholder="••••••••"
              />
            </div>
            
            <div style={styles.flexBetween}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                <label htmlFor="remember-me" style={{fontSize: '0.875rem', color: theme.colors.neutral[500]}}>
                  Remember me
                </label>
              </div>
              
              <div>
                <Link to="/forgot-password" style={styles.link}>
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;