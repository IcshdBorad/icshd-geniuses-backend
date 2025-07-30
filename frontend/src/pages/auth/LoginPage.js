/**
 * Login Page Component for ICSHD GENIUSES
 * Handles user authentication and login
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  School,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../stores/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError('');
    
    const result = await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.success) {
      // Redirect based on user role
      const userRole = result.user.role;
      switch (userRole) {
        case 'student':
          navigate('/student');
          break;
        case 'trainer':
          navigate('/trainer');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white',
                padding: 4,
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <School sx={{ fontSize: 60, mb: 2 }} />
              </motion.div>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                ICSHD GENIUSES
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                منصة العباقرة للحساب الذهني
              </Typography>
            </Box>

            <CardContent sx={{ padding: 4 }}>
              <Typography variant="h5" textAlign="center" gutterBottom fontWeight="600">
                تسجيل الدخول
              </Typography>
              <Typography
                variant="body2"
                textAlign="center"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                أدخل بياناتك للوصول إلى حسابك
              </Typography>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  fullWidth
                  label="البريد الإلكتروني"
                  type="email"
                  margin="normal"
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'البريد الإلكتروني غير صالح',
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="كلمة المرور"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  {...register('password', {
                    required: 'كلمة المرور مطلوبة',
                    minLength: {
                      value: 6,
                      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 2,
                    mb: 3,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...register('rememberMe')}
                        color="primary"
                        size="small"
                      />
                    }
                    label="تذكرني"
                  />
                  <Link
                    to="/forgot-password"
                    style={{
                      color: '#1976d2',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                    }}
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1BA3D3 90%)',
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    أو
                  </Typography>
                </Divider>

                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    ليس لديك حساب؟{' '}
                    <Link
                      to="/register"
                      style={{
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      إنشاء حساب جديد
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography
                variant="h6"
                color="white"
                gutterBottom
                fontWeight="600"
              >
                لماذا ICSHD GENIUSES؟
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 2,
                  mt: 2,
                }}
              >
                {[
                  { title: 'تمارين ذكية', desc: 'تمارين متكيفة حسب مستواك' },
                  { title: 'تقييم فوري', desc: 'تحليل أدائك لحظياً' },
                  { title: 'ترقية تلقائية', desc: 'انتقل للمستوى التالي تلقائياً' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <Card
                      sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        textAlign: 'center',
                        p: 2,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="600">
                        {feature.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {feature.desc}
                      </Typography>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;
