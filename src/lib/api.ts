// AnyFix – src/lib/api.ts
// Централен API клиент

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – добавя JWT токен
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – автоматичен refresh на токен
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken',  data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Typed API methods ────────────────────────────────────

export const authAPI = {
  login:    (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  register: (data: any)     => api.post('/api/auth/register', data),
  me:       ()              => api.get('/api/auth/me'),
  logout:   ()              => api.post('/api/auth/logout'),
  verifyOtp:(data: any)     => api.post('/api/auth/verify-otp', data),
  refresh:  (token: string) => api.post('/api/auth/refresh', { refreshToken: token }),
};

export const ordersAPI = {
  list:   (params?: any)   => api.get('/api/orders', { params }),
  get:    (id: string)     => api.get(`/api/orders/${id}`),
  create: (data: any)      => api.post('/api/orders', data),
  addOffer:    (id: string, data: any) => api.post(`/api/orders/${id}/offers`, data),
  acceptOffer: (id: string, offerId: string) => api.post(`/api/orders/${id}/accept-offer`, { offerId }),
  complete:    (id: string) => api.post(`/api/orders/${id}/complete`),
  uploadPhoto: (id: string, form: FormData) => api.post(`/api/orders/${id}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  openDispute: (id: string, data: any) => api.post(`/api/orders/${id}/dispute`, data),
};

export const mastersAPI = {
  list:   (params?: any) => api.get('/api/masters', { params }),
  get:    (id: string)   => api.get(`/api/masters/${id}`),
  update: (data: any)    => api.put('/api/masters/me', data),
  uploadDoc: (form: FormData) => api.post('/api/masters/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  stripeOnboard: () => api.post('/api/masters/stripe/onboard'),
};

export const paymentsAPI = {
  createIntent: (orderId: string) => api.post('/api/payments/intent', { orderId }),
  getStatus:    (orderId: string) => api.get(`/api/payments/${orderId}`),
};

export const reviewsAPI = {
  create: (orderId: string, data: any) => api.post(`/api/orders/${orderId}/review`, data),
  list:   (masterProfileId: string)    => api.get(`/api/reviews`, { params: { masterProfileId } }),
};

export const adminAPI = {
  getStats:       () => api.get('/api/admin/stats'),
  getMasters:     (params?: any) => api.get('/api/admin/masters', { params }),
  updateMaster:   (id: string, data: any) => api.patch(`/api/admin/masters/${id}`, data),
  getDisputes:    (params?: any) => api.get('/api/admin/disputes', { params }),
  resolveDispute: (id: string, data: any) => api.patch(`/api/admin/disputes/${id}`, data),
  getFraudLogs:   () => api.get('/api/admin/fraud-logs'),
};
