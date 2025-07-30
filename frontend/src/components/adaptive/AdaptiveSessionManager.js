/**
 * Adaptive Session Manager Component for ICSHD GENIUSES
 * Handles adaptive session creation, monitoring, and real-time adjustments
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Fade,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Target as TargetIcon,
  Lightbulb as LightbulbIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

const AdaptiveSessionManager = ({ 
  studentId, 
  onSessionStart, 
  onSessionComplete,
  initialConfig = {} 
}) => {
  const { user } = useAuthStore();
  const { currentSession, setCurrentSession } = useSessionStore();
  const queryClient = useQueryClient();

  // State management
  const [adaptiveProfile, setAdaptiveProfile] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [adaptationHistory, setAdaptationHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionConfig, setSessionConfig] = useState({
    curriculum: 'soroban',
    requestedLevel: 1,
    duration: 30,
    questionCount: 20,
    adaptiveMode: true,
    ...initialConfig
  });

  // Fetch adaptive profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['adaptiveProfile', studentId, sessionConfig.curriculum],
    queryFn: () => apiService.get(`/adaptive/students/${studentId}/profile?curriculum=${sessionConfig.curriculum}`),
    enabled: !!studentId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['adaptiveRecommendations', studentId, sessionConfig.curriculum],
    queryFn: () => apiService.get(`/adaptive/students/${studentId}/recommendations?curriculum=${sessionConfig.curriculum}`),
    enabled: !!studentId,
    refetchInterval: 60000 // Refresh every minute
  });

  // Create adaptive session mutation
  const createSessionMutation = useMutation({
    mutationFn: (config) => apiService.post(`/adaptive/sessions/${studentId}`, config),
    onSuccess: (data) => {
      setCurrentSession(data.data);
      if (onSessionStart) {
        onSessionStart(data.data);
      }
      // Start real-time monitoring
      startRealTimeMonitoring(data.data.sessionId);
    },
    onError: (error) => {
      console.error('Failed to create adaptive session:', error);
    }
  });

  // Force adaptation mutation
  const forceAdaptationMutation = useMutation({
    mutationFn: ({ sessionId, adaptationType, parameters }) => 
      apiService.post(`/adaptive/sessions/${sessionId}/force-adaptation`, {
        adaptationType,
        parameters
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['realTimeData']);
    }
  });

  // Socket event handlers
  useEffect(() => {
    if (!currentSession?.sessionId) return;

    const handleSessionAdapted = (data) => {
      setAdaptationHistory(prev => [...prev, data.adaptation]);
      setRealTimeData(prev => ({
        ...prev,
        adaptationCount: (prev?.adaptationCount || 0) + 1
      }));
    };

    const handleAdaptiveSessionCreated = (data) => {
      setRecommendations(data.personalization?.recommendations || []);
    };

    const handleAdaptiveSessionCompleted = (data) => {
      if (onSessionComplete) {
        onSessionComplete(data);
      }
      stopRealTimeMonitoring();
    };

    socketService.on('sessionAdapted', handleSessionAdapted);
    socketService.on('adaptiveSessionCreated', handleAdaptiveSessionCreated);
    socketService.on('adaptiveSessionCompleted', handleAdaptiveSessionCompleted);

    return () => {
      socketService.off('sessionAdapted', handleSessionAdapted);
      socketService.off('adaptiveSessionCreated', handleAdaptiveSessionCreated);
      socketService.off('adaptiveSessionCompleted', handleAdaptiveSessionCompleted);
    };
  }, [currentSession?.sessionId, onSessionComplete]);

  // Real-time monitoring
  const startRealTimeMonitoring = useCallback((sessionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiService.get(`/adaptive/sessions/${sessionId}/real-time-data`);
        setRealTimeData(response.data);
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const stopRealTimeMonitoring = useCallback(() => {
    setRealTimeData(null);
  }, []);

  // Update profile when data changes
  useEffect(() => {
    if (profileData?.data) {
      setAdaptiveProfile(profileData.data);
    }
  }, [profileData]);

  // Update recommendations when data changes
  useEffect(() => {
    if (recommendationsData?.data) {
      setRecommendations(recommendationsData.data.recommendations || []);
    }
  }, [recommendationsData]);

  // Handle session creation
  const handleCreateSession = () => {
    createSessionMutation.mutate(sessionConfig);
  };

  // Handle force adaptation
  const handleForceAdaptation = (adaptationType, parameters) => {
    if (!currentSession?.sessionId) return;
    
    forceAdaptationMutation.mutate({
      sessionId: currentSession.sessionId,
      adaptationType,
      parameters
    });
  };

  // Render adaptive insights
  const renderAdaptiveInsights = () => {
    if (!adaptiveProfile?.profile) return null;

    const { profile } = adaptiveProfile;
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
            الملف التكيفي للطالب
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {profile.currentLevel}
                </Typography>
                <Typography variant="caption">المستوى الحالي</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {Math.round(profile.difficultyScore * 100)}%
                </Typography>
                <Typography variant="caption">نقاط الصعوبة</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {Math.round(profile.averageAccuracy)}%
                </Typography>
                <Typography variant="caption">متوسط الدقة</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Chip 
                  label={profile.learningStyle === 'visual' ? 'بصري' : 
                        profile.learningStyle === 'auditory' ? 'سمعي' :
                        profile.learningStyle === 'kinesthetic' ? 'حركي' : 'مختلط'}
                  color="info"
                  size="small"
                />
                <Typography variant="caption" display="block">نمط التعلم</Typography>
              </Box>
            </Grid>
          </Grid>

          {profile.strengthAreas?.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>نقاط القوة:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.strengthAreas.map((area, index) => (
                  <Chip key={index} label={area} color="success" size="small" />
                ))}
              </Box>
            </Box>
          )}

          {profile.weaknessAreas?.length > 0 && (
            <Box mt={1}>
              <Typography variant="subtitle2" gutterBottom>مجالات التحسين:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.weaknessAreas.map((area, index) => (
                  <Chip key={index} label={area} color="warning" size="small" />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render recommendations
  const renderRecommendations = () => {
    if (!recommendations.length) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
            التوصيات التكيفية
          </Typography>
          
          {recommendations.map((rec, index) => (
            <Alert 
              key={index}
              severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">{rec.message}</Typography>
              {rec.suggestion && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {rec.suggestion}
                </Typography>
              )}
            </Alert>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Render real-time monitoring
  const renderRealTimeMonitoring = () => {
    if (!realTimeData) return null;

    const progress = (realTimeData.currentExercise / realTimeData.totalExercises) * 100;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
            مراقبة الجلسة المباشرة
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              التقدم: {realTimeData.currentExercise} / {realTimeData.totalExercises}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary">
                  {realTimeData.adaptationCount}
                </Typography>
                <Typography variant="caption">التكيفات المطبقة</Typography>
              </Box>
            </Grid>
            
            {realTimeData.currentMetrics && (
              <>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="success.main">
                      {Math.round(realTimeData.currentMetrics.accuracy)}%
                    </Typography>
                    <Typography variant="caption">الدقة الحالية</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="info.main">
                      {Math.round(realTimeData.currentMetrics.averageTime)}s
                    </Typography>
                    <Typography variant="caption">متوسط الوقت</Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>

          {realTimeData.recentResponses?.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>الإجابات الأخيرة:</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {realTimeData.recentResponses.slice(-5).map((response, index) => (
                  <Chip
                    key={index}
                    label={response.isCorrect ? '✓' : '✗'}
                    color={response.isCorrect ? 'success' : 'error'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render adaptation history
  const renderAdaptationHistory = () => {
    if (!adaptationHistory.length) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            تاريخ التكيفات
          </Typography>
          
          {adaptationHistory.map((adaptation, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>{adaptation.type}</strong> - {new Date(adaptation.appliedAt).toLocaleTimeString('ar')}
              </Typography>
              {adaptation.reason && (
                <Typography variant="caption" color="text.secondary">
                  السبب: {adaptation.reason}
                </Typography>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Render session controls
  const renderSessionControls = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            إدارة الجلسة التكيفية
          </Typography>
          
          {!currentSession ? (
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
                fullWidth
                sx={{ mb: 2 }}
              >
                {createSessionMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  'بدء جلسة تكيفية جديدة'
                )}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setShowSettings(true)}
                fullWidth
              >
                إعدادات الجلسة
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                جلسة تكيفية نشطة - ID: {currentSession.sessionId}
              </Alert>
              
              {user?.role === 'trainer' && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    size="small"
                    onClick={() => handleForceAdaptation('difficulty', { adjustment: 0.1 })}
                  >
                    زيادة الصعوبة
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleForceAdaptation('difficulty', { adjustment: -0.1 })}
                  >
                    تقليل الصعوبة
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleForceAdaptation('time', { adjustment: 10 })}
                  >
                    زيادة الوقت
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (profileLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderAdaptiveInsights()}
          {renderRecommendations()}
          {renderRealTimeMonitoring()}
          {renderAdaptationHistory()}
          {renderSessionControls()}
        </motion.div>
      </AnimatePresence>

      {/* Session Settings Dialog */}
      <Dialog 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>إعدادات الجلسة التكيفية</DialogTitle>
        <DialogContent>
          {/* Session configuration form would go here */}
          <Typography>إعدادات الجلسة ستكون متاحة قريباً</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>إلغاء</Button>
          <Button variant="contained">حفظ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdaptiveSessionManager;
