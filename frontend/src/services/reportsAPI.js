import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/reports`,
  timeout: 30000, // 30 seconds for report generation
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const reportsAPI = {
  // Get available report types
  getReportTypes: async () => {
    try {
      const response = await apiClient.get('/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching report types:', error);
      throw error;
    }
  },

  // Get report statistics
  getStatistics: async (params = {}) => {
    try {
      const response = await apiClient.get('/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },

  // Generate student progress report
  generateStudentReport: async (studentId, params = {}) => {
    try {
      const response = await apiClient.get(`/student/${studentId}`, {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating student report:', error);
      throw error;
    }
  },

  // Generate class performance report
  generateClassReport: async (classId, params = {}) => {
    try {
      const response = await apiClient.get(`/class/${classId}`, {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating class report:', error);
      throw error;
    }
  },

  // Generate gamification report
  generateGamificationReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/gamification', {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating gamification report:', error);
      throw error;
    }
  },

  // Generate achievements report
  generateAchievementsReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/achievements', {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating achievements report:', error);
      throw error;
    }
  },

  // Generate sessions analytics report
  generateSessionsReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/sessions', {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating sessions report:', error);
      throw error;
    }
  },

  // Generate curriculum progress report
  generateCurriculumReport: async (curriculum, params = {}) => {
    try {
      const response = await apiClient.get(`/curriculum/${curriculum}`, {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating curriculum report:', error);
      throw error;
    }
  },

  // Generate adaptive learning report
  generateAdaptiveReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/adaptive', {
        params,
        responseType: params.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating adaptive report:', error);
      throw error;
    }
  },

  // Generate custom report
  generateCustomReport: async (reportData) => {
    try {
      const response = await apiClient.post('/custom', reportData, {
        responseType: reportData.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  },

  // Get export templates
  getExportTemplates: async () => {
    try {
      const response = await apiClient.get('/export/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching export templates:', error);
      throw error;
    }
  },

  // Schedule automatic report
  scheduleReport: async (scheduleData) => {
    try {
      const response = await apiClient.post('/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  },

  // Export report with specific options
  exportReport: async (exportData) => {
    try {
      const response = await apiClient.post('/export', exportData, {
        responseType: exportData.format === 'json' ? 'json' : 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  // Email report
  emailReport: async (emailData) => {
    try {
      const response = await apiClient.post('/email', emailData);
      return response.data;
    } catch (error) {
      console.error('Error emailing report:', error);
      throw error;
    }
  },

  // Share report
  shareReport: async (shareData) => {
    try {
      const response = await apiClient.post('/share', shareData);
      return response.data;
    } catch (error) {
      console.error('Error sharing report:', error);
      throw error;
    }
  },

  // Get shared report
  getSharedReport: async (shareId) => {
    try {
      const response = await apiClient.get(`/shared/${shareId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shared report:', error);
      throw error;
    }
  },

  // Get report history
  getReportHistory: async (params = {}) => {
    try {
      const response = await apiClient.get('/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching report history:', error);
      throw error;
    }
  },

  // Delete report from history
  deleteReport: async (reportId) => {
    try {
      const response = await apiClient.delete(`/history/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  // Get report preview
  getReportPreview: async (reportConfig) => {
    try {
      const response = await apiClient.post('/preview', reportConfig);
      return response.data;
    } catch (error) {
      console.error('Error generating report preview:', error);
      throw error;
    }
  },

  // Validate report configuration
  validateReportConfig: async (config) => {
    try {
      const response = await apiClient.post('/validate', config);
      return response.data;
    } catch (error) {
      console.error('Error validating report config:', error);
      throw error;
    }
  },

  // Get report status (for async generation)
  getReportStatus: async (jobId) => {
    try {
      const response = await apiClient.get(`/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report status:', error);
      throw error;
    }
  },

  // Cancel report generation
  cancelReport: async (jobId) => {
    try {
      const response = await apiClient.delete(`/cancel/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling report:', error);
      throw error;
    }
  },

  // Get report metrics
  getReportMetrics: async (params = {}) => {
    try {
      const response = await apiClient.get('/metrics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching report metrics:', error);
      throw error;
    }
  },

  // Batch generate reports
  batchGenerateReports: async (batchData) => {
    try {
      const response = await apiClient.post('/batch', batchData);
      return response.data;
    } catch (error) {
      console.error('Error batch generating reports:', error);
      throw error;
    }
  },

  // Get user preferences for reports
  getUserPreferences: async () => {
    try {
      const response = await apiClient.get('/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  // Update user preferences for reports
  updateUserPreferences: async (preferences) => {
    try {
      const response = await apiClient.put('/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  // Search reports
  searchReports: async (query, filters = {}) => {
    try {
      const response = await apiClient.get('/search', {
        params: { q: query, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching reports:', error);
      throw error;
    }
  },

  // Get report comments/annotations
  getReportComments: async (reportId) => {
    try {
      const response = await apiClient.get(`/${reportId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report comments:', error);
      throw error;
    }
  },

  // Add comment to report
  addReportComment: async (reportId, comment) => {
    try {
      const response = await apiClient.post(`/${reportId}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error('Error adding report comment:', error);
      throw error;
    }
  },

  // Get report permissions
  getReportPermissions: async (reportId) => {
    try {
      const response = await apiClient.get(`/${reportId}/permissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report permissions:', error);
      throw error;
    }
  },

  // Update report permissions
  updateReportPermissions: async (reportId, permissions) => {
    try {
      const response = await apiClient.put(`/${reportId}/permissions`, permissions);
      return response.data;
    } catch (error) {
      console.error('Error updating report permissions:', error);
      throw error;
    }
  }
};

// Helper functions for file downloads
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get report type display name
export const getReportTypeDisplayName = (type) => {
  const displayNames = {
    'student_progress': 'تقرير تقدم الطالب',
    'class_performance': 'تقرير أداء الفصل',
    'gamification_summary': 'تقرير نظام التحفيز',
    'achievement_report': 'تقرير الإنجازات',
    'session_analytics': 'تحليلات الجلسات',
    'curriculum_progress': 'تقرير تقدم المنهج',
    'adaptive_learning': 'تقرير التعلم التكيفي'
  };
  return displayNames[type] || type;
};

// Helper function to validate email addresses
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate date range
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { valid: false, message: 'يرجى تحديد تاريخ البداية والنهاية' };
  }
  
  if (startDate > endDate) {
    return { valid: false, message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' };
  }
  
  const maxRange = 365; // Maximum 1 year
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > maxRange) {
    return { valid: false, message: `الفترة الزمنية لا يمكن أن تتجاوز ${maxRange} يوم` };
  }
  
  return { valid: true };
};

export default reportsAPI;
