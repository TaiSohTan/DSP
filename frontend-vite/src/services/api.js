import axios from 'axios';

// Vite uses import.meta.env instead of process.env
// Updated to prevent double '/api' prefixing - now the backend paths will be properly constructed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to get a new token
        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
          refresh: refreshToken
        });
        
        // Store the new token
        localStorage.setItem('access_token', response.data.access);
        
        // Retry the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Failed to refresh, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API - Matches actual endpoints in api/urls.py
export const authAPI = {
  login: (email, password, rememberMe = false) => api.post('/api/login/', { email, password, remember_me: rememberMe }),
  register: (userData) => api.post('/api/register/', userData),
  completeRegistration: (userData) => api.post('/api/register/confirm/', userData),
  resendRegistrationOTP: (registrationId) => api.post('/api/resend-registration-otp/', { registration_id: registrationId }),
  sendPhoneOTP: (phoneNumber) => api.post('/api/send-phone-otp/', { phone_number: phoneNumber }),
  sendEmailOTP: () => api.post('/api/send-email-otp/'),
  verifyPhoneOTP: (phoneNumber, otp) => api.post('/api/verify-phone-otp/', { phone_number: phoneNumber, otp: otp }),
  resetPasswordRequest: (email) => api.post('/api/users/request-password-reset/', { email }),
  resetPassword: (token, password, email) => api.post('/api/users/reset-password/', { token, password, email }),
  refreshToken: (refreshToken) => api.post('/api/token/refresh/', { refresh: refreshToken }),
  getProfile: () => api.get('/api/profile/'),
  getCurrentUser: () => api.get('/api/profile/'), // Add this method to get current user data
  updateProfile: (profileData) => api.patch('/api/profile/', profileData),
  
  // Add these methods to match what your OTPVerificationForm is expecting
  verifyOtp: (data) => api.post('/api/verify-phone-otp/', { phone_number: data.email, otp: data.otp_code }),
  resendOtp: (data) => api.post('/api/resend-registration-otp/', { registration_id: data.registrationId, phone_number: data.email })
};

// Election API - Matches the router in api/urls.py
export const electionAPI = {
  getElections: (pageOrOptions = 1) => {
    const page = typeof pageOrOptions === 'object' ? pageOrOptions.page || 1 : pageOrOptions;
    return api.get(`/api/elections/?page=${page}`);
  },
  getElection: (id) => api.get(`/api/elections/${id}/`),
  createElection: (electionData) => api.post('/api/elections/', electionData),
  updateElection: (id, electionData) => api.put(`/api/elections/${id}/`, electionData),
  deleteElection: (id) => api.delete(`/api/elections/${id}/`),
  // Custom actions defined in ElectionViewSet with improved pagination handling
  getUpcomingElections: (pageOrOptions = 1) => {
    const page = typeof pageOrOptions === 'object' ? pageOrOptions.page || 1 : pageOrOptions;
    return api.get(`/api/elections/upcoming/?page=${page}`);
  },
  getActiveElections: (pageOrOptions = 1) => {
    const page = typeof pageOrOptions === 'object' ? pageOrOptions.page || 1 : pageOrOptions;
    return api.get(`/api/elections/active/?page=${page}`);
  },
  getPastElections: (pageOrOptions = 1) => {
    const page = typeof pageOrOptions === 'object' ? pageOrOptions.page || 1 : pageOrOptions;
    return api.get(`/api/elections/past/?page=${page}`);
  },
  getCandidates: (electionId) => api.get(`/api/elections/${electionId}/candidates/`),
  getResults: (electionId) => api.get(`/api/elections/${electionId}/results/`),
  // Admin-only actions
  deployContract: (electionId) => api.post(`/api/elections/${electionId}/deploy_contract/`),
};

// Vote API - Matches the router in api/urls.py
export const voteAPI = {
  castVote: (electionId, candidateId) => api.post('/api/votes/', { 
    election_id: electionId,
    candidate_id: candidateId
  }),
  confirmVote: (voteId, emailOtp) => api.post('/api/votes/confirm/', {
    vote_id: voteId,
    email_otp: emailOtp
  }),
  verifyVote: (voteId) => api.get(`/api/votes/${voteId}/verify/`),
  verifyMerkleProof: (voteId) => api.get(`/api/votes/${voteId}/verify-merkle/`),
  getUserVotes: () => api.get('/api/votes/my_votes/'),
  getVoteDetails: (voteId) => api.get(`/api/votes/${voteId}/`),
  // Updated to match the correct endpoint path with query parameters
  checkUserVote: (electionId) => api.get(`/api/votes/election/?election_id=${electionId}`),
  sendEmailOtp: () => api.post('/api/send-email-otp/'), // Added method for resending OTP during voting
  // New method for downloading PDF receipt
  downloadReceiptPDF: (voteId) => api.get(`/api/votes/${voteId}/receipt_pdf/`, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf',
    },
    // Don't use withCredentials when using Bearer token auth
    withCredentials: false,
    timeout: 30000, // 30 seconds timeout
  }),
};

// Blockchain Wallet API - Only contains the rotate-key endpoint
export const blockchainAPI = {
  rotateWalletKey: (oldPassword, newPassword) => api.post('/api/wallet/rotate-key/', {
    old_password: oldPassword,
    new_password: newPassword
  }),
  // New method for regular users to rotate their wallet keys
  rotateUserWalletKey: (password) => api.post('/api/wallet/rotate-user-key/', {
    password: password
  }),
  // Check blockchain connection status
  checkConnection: () => api.get('/api/blockchain/status/'),
  // Sync blockchain manually
  syncBlockchain: () => api.post('/api/blockchain/sync/'),
  // Get detailed blockchain status
  getStatus: () => api.get('/api/blockchain/status/'),
};

// Verification API - Matches endpoints in verification/urls.py
export const verificationAPI = {
  verifyUser: () => api.post('/api/verification/verify-user/'),
  // Admin endpoints
  searchVerificationUsers: (query) => api.get(`/api/verification/admin/auth-search/?q=${query}`),
  verifyUserExists: (params) => api.get('/api/verification/admin/verify-citizen/', { params }),
  clearAuthDB: () => api.delete('/api/verification/admin/clear-auth-db/'),
};

// Admin API - For administrative functions
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard/'),
  getUsers: (params) => api.get('/api/admin/users/', { params }),
  getUser: (userId) => api.get(`/api/admin/users/${userId}/`),
  createUser: (userData) => api.post('/api/admin/users/', userData),
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}/`, userData),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}/`),
  verifyUser: (userId) => api.post(`/api/admin/users/${userId}/verify/`),
  // System Settings methods
  getSystemSettings: () => api.get('/api/admin/settings/'),
  updateSystemSettings: (settings, password) => api.put('/api/admin/settings/', { 
    settings,
    password 
  }),
  resetSystemSettings: () => api.post('/api/admin/settings/reset/'),
  // New methods for admin dashboard statistics
  checkSystemStatus: () => api.get('/api/admin/status/'),
  getElectionStats: () => api.get('/api/admin/election-stats/'),
  // Blockchain related methods
  getBlockchainStatus: () => api.get('/api/blockchain/status/'),
  checkVoteTampering: () => api.get('/api/admin/check-tampering/'),
};

export default api;