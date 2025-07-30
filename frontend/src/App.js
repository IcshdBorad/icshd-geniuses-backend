/**
 * Main App Component for ICSHD GENIUSES Frontend
 * Handles routing, authentication, and global state management
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Import stores
import { useAuthStore } from './stores/authStore';
import { useSessionStore } from './stores/sessionStore';

// Import components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentDashboard from './pages/student/StudentDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import SessionPage from './pages/session/SessionPage';
import AssessmentPage from './pages/assessment/AssessmentPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Import services
import { socketService } from './services/socketService';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create Material-UI theme
const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

function App() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const { initializeSocket, disconnectSocket } = useSessionStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Initialize socket connection when user is authenticated
    if (user) {
      socketService.connect();
      initializeSocket();
      
      // Join user-specific room
      socketService.joinUserRoom(user.id, user.role);
    } else {
      socketService.disconnect();
      disconnectSocket();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [user, initializeSocket, disconnectSocket]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  key="authenticated"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', width: '100%' }}
                >
                  <Sidebar />
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <Routes>
                        {/* Dashboard Routes */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <DashboardPage />
                            </ProtectedRoute>
                          }
                        />
                        
                        {/* Role-specific Dashboards */}
                        <Route
                          path="/student"
                          element={
                            <ProtectedRoute allowedRoles={['student']}>
                              <StudentDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/trainer"
                          element={
                            <ProtectedRoute allowedRoles={['trainer']}>
                              <TrainerDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute allowedRoles={['admin']}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          }
                        />

                        {/* Session Routes */}
                        <Route
                          path="/session/:sessionId"
                          element={
                            <ProtectedRoute>
                              <SessionPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Assessment Routes */}
                        <Route
                          path="/assessment"
                          element={
                            <ProtectedRoute>
                              <AssessmentPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Profile Routes */}
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <ProfilePage />
                            </ProtectedRoute>
                          }
                        />

                        {/* 404 Route */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Box>
                  </Box>
                </motion.div>
              ) : (
                <motion.div
                  key="unauthenticated"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ width: '100%' }}
                >
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Router>
        
        {/* Global Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontFamily: theme.typography.fontFamily,
            },
            success: {
              style: {
                background: '#2e7d32',
              },
            },
            error: {
              style: {
                background: '#d32f2f',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
