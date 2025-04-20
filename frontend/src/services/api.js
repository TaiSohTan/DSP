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

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/token/', { email, password }),
  register: (userData) => api.post('/users/register/', userData),
  verifyEmail: (token) => api.post('/users/verify-email/', { token }),
};

// Election API
export const electionAPI = {
  getElections: () => api.get('/elections/'),
  getElection: (id) => api.get(`/elections/${id}/`),
  getElectionResults: (id) => api.get(`/elections/${id}/results/`),
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
};

export default api;
