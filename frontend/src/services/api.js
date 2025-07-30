/**
 * API Service for ICSHD GENIUSES Frontend
 * Handles all HTTP requests to the backend API
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data.tokens;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('خطأ في الخادم، يرجى المحاولة لاحقاً');
    } else if (error.response?.status === 403) {
      toast.error('غير مصرح لك بهذا الإجراء');
    } else if (error.response?.status === 404) {
      toast.error('المورد المطلوب غير موجود');
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  refreshToken: (data) => api.post('/auth/refresh', data),
  requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

// Session API
export const sessionAPI = {
  createSession: (sessionConfig) => api.post('/sessions/create', sessionConfig),
  getCurrentExercise: (sessionId) => api.get(`/sessions/${sessionId}/current-exercise`),
  submitAnswer: (sessionId, answerData) => api.post(`/sessions/${sessionId}/submit-answer`, answerData),
  skipExercise: (sessionId, data) => api.post(`/sessions/${sessionId}/skip`, data),
  requestHint: (sessionId, data) => api.post(`/sessions/${sessionId}/hint`, data),
  pauseSession: (sessionId, data) => api.post(`/sessions/${sessionId}/pause`, data),
  resumeSession: (sessionId) => api.post(`/sessions/${sessionId}/resume`),
  completeSession: (sessionId, data) => api.post(`/sessions/${sessionId}/complete`, data),
  getSessionStatus: (sessionId) => api.get(`/sessions/${sessionId}/status`),
  getActiveSessions: () => api.get('/sessions/active'),
  cleanupInactiveSessions: (data) => api.post('/sessions/cleanup-inactive', data),
};

// Assessment API
export const assessmentAPI = {
  getSessionAnalysis: (sessionId) => api.get(`/assessment/session/${sessionId}`),
  getStudentReport: (studentId, params) => api.get(`/assessment/student/${studentId}/report`, { params }),
  checkPromotionEligibility: (studentId, curriculum) => api.get(`/assessment/promotion/check/${studentId}/${curriculum}`),
  processPromotion: (studentId, curriculum) => api.post(`/assessment/promotion/process/${studentId}/${curriculum}`),
  getPendingPromotions: (params) => api.get('/assessment/promotion/pending', { params }),
  approvePromotion: (promotionId, data) => api.post(`/assessment/promotion/${promotionId}/approve`, data),
  rejectPromotion: (promotionId, data) => api.post(`/assessment/promotion/${promotionId}/reject`, data),
  getPromotionHistory: (studentId, params) => api.get(`/assessment/promotion/history/${studentId}`, { params }),
  getPromotionStatistics: (params) => api.get('/assessment/promotion/statistics', { params }),
  getAdaptiveData: (studentId, curriculum) => api.get(`/assessment/adaptive/${studentId}/${curriculum}`),
};

// Admin API
export const adminAPI = {
  getAllUsers: (params) => api.get('/auth/admin/users', { params }),
  toggleUserStatus: (userId) => api.put(`/auth/admin/users/${userId}/toggle-status`),
  getSystemStats: () => api.get('/admin/stats'),
  getSystemHealth: () => api.get('/health'),
  getSystemInfo: () => api.get('/info'),
};

// Student API
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getProgress: (curriculum) => api.get(`/student/progress/${curriculum}`),
  getRecentSessions: (params) => api.get('/student/sessions', { params }),
  getAchievements: () => api.get('/student/achievements'),
  getLeaderboard: (curriculum) => api.get(`/student/leaderboard/${curriculum}`),
};

// Trainer API
export const trainerAPI = {
  getDashboard: () => api.get('/trainer/dashboard'),
  getAssignedStudents: () => api.get('/trainer/students'),
  getStudentProgress: (studentId) => api.get(`/trainer/students/${studentId}/progress`),
  assignStudent: (studentId) => api.post(`/trainer/students/${studentId}/assign`),
  unassignStudent: (studentId) => api.delete(`/trainer/students/${studentId}/assign`),
  createCustomSession: (data) => api.post('/trainer/sessions/custom', data),
  getSessionReports: (params) => api.get('/trainer/reports/sessions', { params }),
};

// Exercise Generation API
export const exerciseAPI = {
  generatePreview: (config) => api.post('/exercises/preview', config),
  getExerciseTypes: (curriculum) => api.get(`/exercises/types/${curriculum}`),
  getExerciseTemplates: (curriculum) => api.get(`/exercises/templates/${curriculum}`),
  validateExercise: (exercise) => api.post('/exercises/validate', exercise),
};

// File Upload API
export const uploadAPI = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadDocument: (file, type) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    return api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Reports API
export const reportsAPI = {
  generateStudentReport: (studentId, params) => api.get(`/reports/student/${studentId}`, { params }),
  generateClassReport: (classId, params) => api.get(`/reports/class/${classId}`, { params }),
  generatePerformanceReport: (params) => api.get('/reports/performance', { params }),
  exportReport: (reportId, format) => api.get(`/reports/${reportId}/export/${format}`, {
    responseType: 'blob',
  }),
  downloadReport: (reportId) => api.get(`/reports/${reportId}/download`, {
    responseType: 'blob',
  }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Format error message
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'حدث خطأ غير متوقع';
  },

  // Check if request was successful
  isSuccess: (response) => {
    return response.status >= 200 && response.status < 300;
  },

  // Get pagination info from response
  getPaginationInfo: (response) => {
    return response.data.pagination || null;
  },

  // Build query string from params
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  },
};

export default api;
