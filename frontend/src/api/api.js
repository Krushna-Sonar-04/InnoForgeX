import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ========== Auth APIs ==========
export const loginApi = (email, password) =>
    apiClient.post('/auth/login', { email, password });

// ========== Claims APIs ==========
export const fetchClaimsApi = (params = {}) =>
    apiClient.get('/claims', { params });

export const fetchClaimByIdApi = (id) =>
    apiClient.get(`/claims/${id}`);

export const fetchClaimFraudExplanationApi = (id) =>
    apiClient.get(`/claims/${id}/fraud-explanation`);

export const submitClaimApi = (claimData) =>
    apiClient.post('/claims', claimData);

export const updateClaimStatusApi = (id, status, auditNotes = '') =>
    apiClient.patch(`/claims/${id}/status`, { status, auditNotes });

// ========== Fraud scoring & analytics ==========
export const fetchFraudSummaryApi = (period = 'week') =>
    apiClient.get('/analytics/fraud-summary', { params: { period } });

// ========== Admin ==========
export const deleteAllClaimsApi = () =>
    apiClient.delete('/claims');

export default apiClient;