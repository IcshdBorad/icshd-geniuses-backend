/**
 * Protected Route Component for ICSHD GENIUSES
 * Handles route protection based on authentication and user roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Alert, Button } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import LoadingScreen from '../common/LoadingScreen';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  fallbackPath = '/login' 
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="جاري التحقق من الهوية..." />;
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
          }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              maxWidth: 500,
              '& .MuiAlert-action': {
                alignItems: 'center',
              }
            }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => window.history.back()}
              >
                العودة
              </Button>
            }
          >
            <strong>غير مصرح لك بالوصول لهذه الصفحة</strong>
            <br />
            يجب أن تكون {getRoleLabel(allowedRoles)} للوصول لهذا المحتوى.
          </Alert>
        </Box>
      );
    }
  }

  // User is authenticated and has required role
  return children;
};

// Helper function to get role labels in Arabic
const getRoleLabel = (roles) => {
  const roleLabels = {
    admin: 'مدير',
    trainer: 'مدرب',
    student: 'طالب',
  };

  if (roles.length === 1) {
    return roleLabels[roles[0]] || roles[0];
  }

  const labels = roles.map(role => roleLabels[role] || role);
  
  if (labels.length === 2) {
    return `${labels[0]} أو ${labels[1]}`;
  }
  
  return `${labels.slice(0, -1).join('، ')} أو ${labels[labels.length - 1]}`;
};

export default ProtectedRoute;
