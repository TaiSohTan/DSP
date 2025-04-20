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

// Import Authentication Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import OTPVerificationForm from './components/auth/OTPVerificationForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import ProtectedRoute from './components/auth/ProtectedRouteComponent';

// Import User Components
import SecuritySettings from './components/user/SecuritySettingsComponent';
import UserProfile from './components/user/UserProfileComponent';
import VotingHistory from './components/user/VotingHistory';

// Import Admin Components
import AdminDashboard from './components/admin/AdminDashboardComponent'; 
import UsersManagement from './components/admin/UsersManagementComponent'; 
import ElectionsManagement from './components/admin/ElectionsManagementComponent'; 
import ElectionForm from './components/admin/ElectionFormComponent';
import UserForm from './components/admin/UserFormComponent';
import UsersVerification from './components/admin/UsersVerificationComponent'; 
import BlockchainStatus from './components/admin/BlockchainStatusComponent'; 
import SystemSettings from './components/admin/SystemSettingsComponent'; 
import VotesManagement from './components/admin/VotesManagementComponent';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes (outside main layout) */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/verify" element={<OTPVerificationForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              {/* Dashboard as the default landing page */}
              <Route index element={<DashboardPage />} />
              
              {/* User profile and settings */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="my-votes" element={<VotingHistory />} />
              
              {/* Elections */}
              <Route path="elections" element={<ElectionsPage />} />
              <Route path="elections/:id" element={<ElectionDetailsPage />} />
            </Route>
          </Route>
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<AdminDashboard />} />
              
              {/* Admin user management routes */}
              <Route path="users" element={<UsersManagement />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/:id" element={<UserForm />} />
              <Route path="users/verify" element={<UsersVerification />} />
              
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;