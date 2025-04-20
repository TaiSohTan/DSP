import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
        const response = await axios.post(`${API_URL}/token/refresh/`, {
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

// Blockchain Wallet API
export const blockchainAPI = {
  // Get user's wallet information (address and redacted private key)
  getWalletInfo: () => api.get('/blockchain/wallet/info/'),
  
  // Verify wallet ownership with password before showing sensitive data
  verifyWalletAccess: (password) => api.post('/blockchain/wallet/verify/', { password }),
  
  // Get wallet full details including private key (requires prior verification)
  getWalletDetails: () => api.get('/blockchain/wallet/details/'),
  
  // Get wallet transaction history
  getTransactions: (page = 1) => api.get(`/blockchain/wallet/transactions/?page=${page}`),
  
  // Check wallet balance
  getWalletBalance: () => api.get('/blockchain/wallet/balance/'),
  
  // Rotate wallet encryption key (when changing password)
  rotateWalletKey: (oldPassword, newPassword) => api.post('/blockchain/wallet/rotate-key/', {
    old_password: oldPassword,
    new_password: newPassword
  }),
};

// Admin API 
export const adminAPI = {
  // Users management
  getUsers: (page = 1, limit = 10) => api.get(`/admin/users/?page=${page}&limit=${limit}`),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}/`),
  updateUser: (userId, userData) => api.patch(`/admin/users/${userId}/`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}/`),
  
  // Elections management
  createElection: (electionData) => api.post('/admin/elections/', electionData),
  updateElection: (electionId, electionData) => api.patch(`/admin/elections/${electionId}/`, electionData),
  deleteElection: (electionId) => api.delete(`/admin/elections/${electionId}/`),
  publishElection: (electionId) => api.post(`/admin/elections/${electionId}/publish/`),
  deployElection: (electionId) => api.post(`/admin/elections/${electionId}/deploy/`),
  
  // Candidates management
  addCandidate: (electionId, candidateData) => api.post(`/admin/elections/${electionId}/candidates/`, candidateData),
  updateCandidate: (candidateId, candidateData) => api.patch(`/admin/candidates/${candidateId}/`, candidateData),
  deleteCandidate: (candidateId) => api.delete(`/admin/candidates/${candidateId}/`),
  
  // Verification system
  searchVerificationUsers: (query) => api.get(`/admin/verification/users/search/?q=${query}`),
  verifyUserExists: (params) => api.get('/admin/verification/user-exists/', { params }),
  clearAuthDB: () => api.delete('/admin/verification/clear-db/'),
  
  // Dashboard stats
  getStats: () => api.get('/admin/stats/'),

  // Additional election methods
  getElections: (page = 1, query = '') => api.get(`/admin/elections/?page=${page}&search=${query}`),
  getElection: (id) => api.get(`/admin/elections/${id}/`),
  
  // User verification methods
  verifyUser: (userId) => api.post(`/admin/users/${userId}/verify/`),
  revokeVerification: (userId) => api.post(`/admin/users/${userId}/revoke-verification/`),
  
  // User eligibility methods
  setUserEligibility: (userId, isEligible) => api.patch(`/admin/users/${userId}/eligibility/`, {
    is_eligible_to_vote: isEligible
  }),
  
  // User search
  searchUsers: (query, page = 1) => api.get(`/admin/users/search/?q=${query}&page=${page}`),
  
  // Vote management
  getVotes: (page = 1, filters = {}) => api.get('/admin/votes/', { 
    params: { page, ...filters } 
  }),
  
  // Statistics and analytics
  getElectionStats: (electionId) => api.get(`/admin/elections/${electionId}/stats/`),
  getVoteDistribution: (electionId) => api.get(`/admin/elections/${electionId}/vote-distribution/`),
  getVotingTimeline: (electionId) => api.get(`/admin/elections/${electionId}/voting-timeline/`),
  
  // System settings
  getSystemSettings: () => api.get('/admin/settings/'),
  updateSystemSettings: (settings) => api.patch('/admin/settings/', settings),
  
  // Blockchain operations
  getBlockchainStatus: () => api.get('/admin/blockchain/status/'),
  syncBlockchain: () => api.post('/admin/blockchain/sync/'),
  verifyElectionIntegrity: (electionId) => api.get(`/admin/blockchain/verify-election/${electionId}/`),
  
  // Merkle tree operations
  checkElectionTampering: (electionId) => api.post(`/admin/elections/${electionId}/check-tampering/`),
  getElectionMerkleRoot: (electionId) => api.get(`/admin/elections/${electionId}/merkle-root/`),
  publishMerkleRoot: (electionId) => api.post(`/admin/elections/${electionId}/publish-merkle-root/`),
  
  // Nullification management
  getNullificationRequests: (electionId) => api.get(`/api/admin/nullification-requests/`, {
    params: { election_id: electionId }
  }),
  approveNullification: (voteId) => api.post(`/api/votes/${voteId}/approve_nullification/`),
  rejectNullification: (voteId, data) => api.post(`/api/votes/${voteId}/reject_nullification/`, data),
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/token/', { email, password }),
  register: (userData) => api.post('/users/register/', userData),
  refreshToken: (refreshToken) => api.post('/token/refresh/', { refresh: refreshToken }),
  verifyOTP: (email, otp) => api.post('/users/verify-otp/', { email, otp }),
  requestPasswordReset: (email) => api.post('/users/request-password-reset/', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password/', { token, password }),
  verifyEmail: (token) => api.post('/users/verify-email/', { token }),
  resendOTP: (registrationId) => api.post('/users/resend-otp/', { 
    registration_id: registrationId 
  }),
  completeRegistration: (registrationId, phoneNumber, otp) => api.post('/users/complete-registration/', {
    registration_id: registrationId,
    phone_number: phoneNumber,
    otp: otp
  }),
};

// Election API
export const electionAPI = {
  getElections: () => api.get('/elections/'),
  getElection: (id) => api.get(`/elections/${id}/`),
  getElectionResults: (id) => api.get(`/elections/${id}/results/`),
};

// User API
export const userAPI = {
  // Common methods
  getProfile: () => api.get('/users/me/'),
  updateProfile: (profileData) => api.patch('/users/me/', profileData),
  changePassword: (passwordData) => api.post('/users/change-password/', passwordData),
  
  // Blockchain wallet methods
  getWalletInfo: () => api.get('/users/me/wallet/'),
  verifyPasswordForWallet: (password) => api.post('/users/me/wallet/verify/', { password }),
  getWalletPrivateKey: (password) => api.post('/users/me/wallet/private-key/', { password }),
};

// Vote API
export const voteAPI = {
  createVote: (electionId, candidateId) => api.post('/votes/', {
    election_id: electionId,
    candidate_id: candidateId,
  }),
  confirmVote: (voteId, emailOtp) => api.post('/votes/confirm/', {
    vote_id: voteId,
    email_otp: emailOtp,
  }),
  getUserVotes: () => api.get('/votes/'),
  
  // Get a detailed vote receipt with cryptographic proof
  getVoteReceipt: (voteId) => api.get(`/votes/${voteId}/receipt/`),
  
  // Download a formal PDF receipt with verification instructions
  downloadReceiptPDF: (voteId) => api.get(`/votes/${voteId}/receipt_pdf/`, {
    responseType: 'blob'
  }),
  
  // Verify vote on blockchain and check if it's been counted correctly
  verifyVote: (voteId) => api.get(`/votes/${voteId}/verify/`),
  
  // Merkle tree verification methods
  getMerkleProof: (voteId) => api.get(`/votes/${voteId}/merkle-proof/`),
  verifyMerkleProof: (voteId) => api.post(`/votes/${voteId}/verify-merkle/`),
  
  // Vote Nullification
  requestNullification: (voteId, data) => api.post(`/api/votes/${voteId}/request_nullification/`, data),
};

export default api;
