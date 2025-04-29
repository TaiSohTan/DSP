import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Import layout components
import Layout from './components/layout/Layout';

// Import AuthProvider
import { AuthProvider } from './context/AuthContext';

// Import pages and components
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ElectionsPage from './pages/ElectionsPage';
import ElectionDetailsPage from './pages/ElectionDetailsPage';
import ElectionResultsPage from './pages/ElectionResultsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VoteDetailsPage from './pages/VoteDetailsPage';
import VerifyVotePage from './pages/VerifyVotePage';

// Import Static Pages
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DocumentationPage from './pages/DocumentationPage';
import ApiDocsPage from './pages/ApiDocsPage';

// Import Authentication Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import OTPVerificationForm from './components/auth/OTPVerificationForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import ProtectedRoute from './components/auth/ProtectedRouteComponent';
import RedirectAuthenticatedUser from './components/auth/RedirectAuthenticatedUser';

// Import User Components
import SecuritySettings from './components/user/SecuritySettingsComponent';
import VotingHistory from './components/user/VotingHistory';

// Import Admin Components
import UsersManagement from './components/admin/UsersManagementComponent'; 
import ElectionsManagement from './components/admin/ElectionsManagementComponent'; 
import ElectionForm from './components/admin/ElectionFormComponent';
import UserForm from './components/admin/UserFormComponent';
import BlockchainStatus from './components/admin/BlockchainStatusComponent'; 
import SystemSettings from './components/admin/SystemSettingsComponent'; 
import VotesManagement from './components/admin/VotesManagementComponent';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes that redirect authenticated users */}
          <Route element={<RedirectAuthenticatedUser />}>
            {/* Public home page */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
            </Route>
            
            {/* Auth routes (outside main layout) */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
          </Route>
          
          {/* Verification route - no redirect, as users need to complete verification */}
          <Route path="/verify" element={<OTPVerificationForm />} />
          
          {/* Public verify vote route - anyone can access this route */}
          <Route path="/verify-vote/:id" element={<VerifyVotePage />} />
          
          {/* Public Static Pages */}
          <Route element={<Layout />}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/api-docs" element={<ApiDocsPage />} />
          </Route>
          
          {/* Public Election routes - accessible to everyone */}
          <Route element={<Layout />}>
            <Route path="elections" element={<ElectionsPage />} />
            <Route path="elections/:id" element={<ElectionDetailsPage />} />
            {/* New dedicated route for election results - accessible to everyone */}
            <Route path="elections/:id/results" element={<ElectionResultsPage />} />
            {/* Redirect /elections/:id/preview to /elections/:id */}
            <Route path="elections/:id/preview" element={<ElectionDetailsPage />} />
          </Route>
          
          {/* Protected user-only routes - prevent admin access */}
          <Route element={<ProtectedRoute userOnly={true} />}>
            <Route element={<Layout />}>
              {/* Dashboard as user's landing page */}
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Voting history - accessible only to regular users */}
              <Route path="my-votes" element={<VotingHistory />} />
              <Route path="my-votes/:id" element={<VoteDetailsPage />} />
            </Route>
          </Route>
          
          {/* Protected routes for both users and admins */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* User profile and settings */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="security" element={<SecuritySettings />} />
              
              {/* Vote details route */}
              <Route path="vote/:id/details" element={<VoteDetailsPage />} />
              <Route path="votes/:id/receipt" element={<VoteDetailsPage />} />
              <Route path="verify-vote" element={<VerifyVotePage />} />
            </Route>
          </Route>
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<AdminDashboardPage />} />
              
              {/* Admin user management routes */}
              <Route path="users" element={<UsersManagement />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/:id" element={<UserForm />} />
              
              {/* Admin election management routes */}
              <Route path="elections" element={<ElectionsManagement />} />
              <Route path="elections/new" element={<ElectionForm />} />
              <Route path="elections/:id" element={<ElectionForm />} />
              
              {/* Admin system routes */}
              <Route path="blockchain/status" element={<BlockchainStatus />} />
              <Route path="settings" element={<SystemSettings />} />
              <Route path="votes" element={<VotesManagement />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
