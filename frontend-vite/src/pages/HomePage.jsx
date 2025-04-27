import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/buttons/Button';
import theme from '../theme';

const HomePage = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: theme.colors.neutral[50]
    }}>
      {/* Hero Section */}
      <div style={{ 
        background: `linear-gradient(to right, ${theme.colors.primary[700]}, ${theme.colors.primary[900]})`,
        padding: `${theme.spacing[12]} ${theme.spacing[4]}`,
        color: theme.colors.white,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: theme.typography.fontSize['4xl'], 
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing[4]
          }}>
            Secure Blockchain Voting System
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.xl,
            maxWidth: '800px',
            margin: '0 auto',
            marginBottom: theme.spacing[8],
            lineHeight: 1.5,
            color: theme.colors.primary[100]
          }}>
            A modern, transparent, and tamper-proof electronic voting platform powered by blockchain technology
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: theme.spacing[4] }}>
            <Link to="/register">
              <Button variant="white" size="large">
                Register to Vote
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="large" style={{ color: 'white', borderColor: 'white' }}>
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: `${theme.spacing[16]} ${theme.spacing[4]}`, maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ 
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          textAlign: 'center',
          marginBottom: theme.spacing[12],
          color: theme.colors.neutral[900]
        }}>
          Key Features
        </h2>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: theme.spacing[8]
        }}>
          {/* Feature 1 */}
          <div style={{ 
            padding: theme.spacing[6],
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ 
              backgroundColor: `${theme.colors.primary[500]}20`, 
              borderRadius: '50%', 
              width: '64px', 
              height: '64px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: theme.spacing[4]
            }}>
              <svg style={{ width: '32px', height: '32px', color: theme.colors.primary[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 style={{ 
              fontSize: theme.typography.fontSize.xl, 
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing[2],
              color: theme.colors.neutral[900]
            }}>
              Secure Authentication
            </h3>
            <p style={{ color: theme.colors.neutral[600], lineHeight: 1.6 }}>
              Multi-factor authentication, secure identity verification, and encryption ensure only legitimate voters can participate.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ 
            padding: theme.spacing[6],
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ 
              backgroundColor: `${theme.colors.primary[700]}20`, 
              borderRadius: '50%', 
              width: '64px', 
              height: '64px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: theme.spacing[4]
            }}>
              <svg style={{ width: '32px', height: '32px', color: theme.colors.primary[700] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 style={{ 
              fontSize: theme.typography.fontSize.xl, 
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing[2],
              color: theme.colors.neutral[900]
            }}>
              Blockchain Technology
            </h3>
            <p style={{ color: theme.colors.neutral[600], lineHeight: 1.6 }}>
              Votes are securely recorded on a decentralized blockchain, ensuring transparency and immutability of election results.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ 
            padding: theme.spacing[6],
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ 
              backgroundColor: '#10b98120', /* Hardcoded success color with opacity */
              borderRadius: '50%', 
              width: '64px', 
              height: '64px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: theme.spacing[4]
            }}>
              <svg style={{ width: '32px', height: '32px', color: '#10b981' /* Hardcoded success color */ }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{ 
              fontSize: theme.typography.fontSize.xl, 
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing[2],
              color: theme.colors.neutral[900]
            }}>
              Verifiable Results
            </h3>
            <p style={{ color: theme.colors.neutral[600], lineHeight: 1.6 }}>
              Voters can independently verify that their vote was counted correctly while maintaining ballot secrecy.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        backgroundColor: theme.colors.neutral[100],
        padding: `${theme.spacing[12]} ${theme.spacing[4]}`,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing[4],
            color: theme.colors.neutral[900]
          }}>
            Ready to participate in secure elections?
          </h2>
          <p style={{ 
            color: theme.colors.neutral[600],
            marginBottom: theme.spacing[8],
            fontSize: theme.typography.fontSize.lg
          }}>
            Register now to participate in upcoming elections or log in to check your voter status and view active elections.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: theme.spacing[4] }}>
            <Link to="/register">
              <Button variant="primary" size="large">
                Get Started
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="secondary" size="large">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: theme.colors.neutral[800],
        color: theme.colors.neutral[300],
        padding: `${theme.spacing[8]} ${theme.spacing[4]}`,
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <p style={{ marginBottom: theme.spacing[4] }}>
            © 2025 Blockchain Voting System. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: theme.spacing[6] }}>
            <Link to="/about" style={{ color: theme.colors.neutral[300], textDecoration: 'none' }}>About</Link>
            <Link to="/privacy" style={{ color: theme.colors.neutral[300], textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: theme.colors.neutral[300], textDecoration: 'none' }}>Terms of Service</Link>
            <Link to="/contact" style={{ color: theme.colors.neutral[300], textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;