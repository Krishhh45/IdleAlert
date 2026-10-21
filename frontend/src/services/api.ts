import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor to inject session token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_classroom_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    register: (full_name: string, username: string, password: string, phone: string) =>
      apiClient.post('/api/register', { full_name, username, password, phone }),

    login: (username: string, password: string) =>
      apiClient.post('/api/login', { username, password }),

    me: () => apiClient.get('/api/me'),

    updatePhone: (phone: string) =>
      apiClient.put('/api/user/phone', { phone }),

    logout: () => apiClient.post('/api/logout'),
  },

  sms: {
    getStatus: () => apiClient.get('/api/sms/status'),
    test: (phone?: string, message?: string) =>
      apiClient.post('/api/sms/test', { phone, message }),
  },

  classroom: {
    get: () => apiClient.get('/api/classroom'),
    set: (name: string) => apiClient.post('/api/classroom', { name }),
  },

  monitoring: {
    startSession: (classroom_name: string) =>
      apiClient.post('/api/monitoring/session/start', { classroom_name }),

    stopSession: (session_id: number) =>
      apiClient.post('/api/monitoring/session/stop', { session_id }),

    processFrame: (frame: string, session_id?: number | null, classroom_name?: string | null, user_phone?: string | null) =>
      apiClient.post('/api/monitoring/frame', {
        frame,
        session_id: session_id || undefined,
        classroom_name: classroom_name || undefined,
        user_phone: user_phone || undefined
      }),
  },

  analysis: {
    image: (file: File, classroom_name?: string | null, user_phone?: string | null) => {
      const formData = new FormData();
      formData.append('file', file);
      if (classroom_name) formData.append('classroom_name', classroom_name);
      if (user_phone) formData.append('user_phone', user_phone);
      return apiClient.post('/api/analysis/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    video: (file: File, classroom_name?: string | null, user_phone?: string | null) => {
      const formData = new FormData();
      formData.append('file', file);
      if (classroom_name) formData.append('classroom_name', classroom_name);
      if (user_phone) formData.append('user_phone', user_phone);
      return apiClient.post('/api/analysis/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min timeout for video processing
      });
    },
  },

  alerts: {
    getAll: (status?: string) =>
      apiClient.get('/api/alerts', { params: status ? { status } : {} }),
    acknowledge: (id: number) =>
      apiClient.patch(`/api/alerts/${id}/acknowledge`),
    resolve: (id: number) =>
      apiClient.patch(`/api/alerts/${id}/resolve`),
  },

  analytics: {
    get: () => apiClient.get('/api/analytics'),
  },

  modelInfo: () => apiClient.get('/api/model-info'),
};
