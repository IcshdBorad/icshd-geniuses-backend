/**
 * Student Dashboard Component for ICSHD GENIUSES
 * Main dashboard for students showing progress, sessions, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  TrendingUp,
  EmojiEvents,
  School,
  Speed,
  Accuracy,
  Timer,
  Star,
  Settings,
  Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { studentAPI, assessmentAPI } from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const { createSession } = useSessionStore();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState('soroban');
  const [selectedLevel, setSelectedLevel] = useState('');

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'studentDashboard',
    studentAPI.getDashboard,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch progress data
  const { data: progressData } = useQuery(
    ['studentProgress', selectedCurriculum],
    () => studentAPI.getProgress(selectedCurriculum),
    {
      enabled: !!selectedCurriculum,
    }
  );

  // Fetch recent sessions
  const { data: recentSessions } = useQuery(
    'recentSessions',
    () => studentAPI.getRecentSessions({ limit: 5 }),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  // Fetch achievements
  const { data: achievements } = useQuery(
    'achievements',
    studentAPI.getAchievements
  );

  useEffect(() => {
    if (user?.currentLevel && user.currentLevel[selectedCurriculum]) {
      setSelectedLevel(user.currentLevel[selectedCurriculum]);
    }
  }, [user, selectedCurriculum]);

  const handleStartSession = async () => {
    if (!selectedCurriculum || !selectedLevel) {
      return;
    }

    const sessionConfig = {
      curriculum: selectedCurriculum,
      level: selectedLevel,
      ageGroup: user?.profile?.ageGroup,
      sessionType: 'practice',
    };

    const result = await createSession(sessionConfig);
    if (result.success) {
      setSessionDialogOpen(false);
      // Navigate to session page
      window.location.href = `/session/${result.sessionId}`;
    }
  };

  const curricula = [
    { value: 'soroban', label: 'السوروبان', icon: '🧮' },
    { value: 'vedic', label: 'الرياضيات الفيدية', icon: '🕉️' },
    { value: 'logic', label: 'المنطق الرياضي', icon: '🧠' },
    { value: 'iqgames', label: 'ألعاب الذكاء', icon: '🎯' },
  ];

  const levels = {
    soroban: ['beginner', 'elementary', 'intermediate', 'advanced'],
    vedic: ['beginner', 'elementary', 'intermediate', 'advanced'],
    logic: ['grade1-2', 'grade3-4', 'grade5-6', 'grade7-8'],
    iqgames: ['easy', 'medium', 'hard', 'expert'],
  };

  const getLevelLabel = (curriculum, level) => {
    const labels = {
      soroban: {
        beginner: 'مبتدئ',
        elementary: 'أساسي',
        intermediate: 'متوسط',
        advanced: 'متقدم',
      },
      vedic: {
        beginner: 'مبتدئ',
        elementary: 'أساسي',
        intermediate: 'متوسط',
        advanced: 'متقدم',
      },
      logic: {
        'grade1-2': 'الصف 1-2',
        'grade3-4': 'الصف 3-4',
        'grade5-6': 'الصف 5-6',
        'grade7-8': 'الصف 7-8',
      },
      iqgames: {
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        expert: 'خبير',
      },
    };
    return labels[curriculum]?.[level] || level;
  };

  if (dashboardLoading) {
    return <LoadingScreen />;
  }

  const stats = dashboardData?.stats || {};
  const progressChartData = {
    labels: progressData?.sessions?.map(s => new Date(s.date).toLocaleDateString('ar-SA')) || [],
    datasets: [
      {
        label: 'الدقة (%)',
        data: progressData?.sessions?.map(s => s.accuracy) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const performanceData = {
    labels: ['صحيح', 'خطأ', 'متخطى'],
    datasets: [
      {
        data: [stats.correctAnswers || 0, stats.incorrectAnswers || 0, stats.skippedQuestions || 0],
        backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: '2rem',
                  }}
                >
                  {user?.fullName?.charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  مرحباً {user?.fullName}!
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  كود الطالب: {user?.studentCode}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
                  استمر في التدريب لتحقيق أهدافك في الحساب الذهني
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={() => setSessionDialogOpen(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  بدء جلسة تدريب
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {[
              {
                title: 'إجمالي الجلسات',
                value: stats.totalSessions || 0,
                icon: <School />,
                color: '#2196f3',
              },
              {
                title: 'متوسط الدقة',
                value: `${Math.round(stats.averageAccuracy || 0)}%`,
                icon: <Accuracy />,
                color: '#4caf50',
              },
              {
                title: 'متوسط السرعة',
                value: `${Math.round(stats.averageSpeed || 0)}ث`,
                icon: <Speed />,
                color: '#ff9800',
              },
              {
                title: 'الإنجازات',
                value: achievements?.total || 0,
                icon: <EmojiEvents />,
                color: '#9c27b0',
              },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: stat.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color={stat.color}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Current Levels */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                مستوياتك الحالية
              </Typography>
              {curricula.map((curriculum) => (
                <Box key={curriculum.value} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {curriculum.icon}
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {curriculum.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={getLevelLabel(
                      curriculum.value,
                      user?.currentLevel?.[curriculum.value] || 'غير محدد'
                    )}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                تقدمك في {curricula.find(c => c.value === selectedCurriculum)?.label}
              </Typography>
              <Box sx={{ height: 300 }}>
                {progressData?.sessions?.length > 0 ? (
                  <Line
                    data={progressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'تطور الأداء خلال الجلسات الأخيرة',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography color="text.secondary">
                      لا توجد بيانات كافية لعرض الرسم البياني
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                توزيع الأداء
              </Typography>
              <Box sx={{ height: 250 }}>
                <Doughnut
                  data={performanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sessions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                الجلسات الأخيرة
              </Typography>
              {recentSessions?.sessions?.length > 0 ? (
                <Grid container spacing={2}>
                  {recentSessions.sessions.map((session, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">
                              {curricula.find(c => c.value === session.curriculum)?.label}
                            </Typography>
                            <Chip
                              label={session.result}
                              size="small"
                              color={
                                session.result === 'excellent' ? 'success' :
                                session.result === 'good' ? 'primary' : 'default'
                              }
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {new Date(session.date).toLocaleDateString('ar-SA')}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Typography variant="caption">
                              دقة: {Math.round(session.accuracy)}%
                            </Typography>
                            <Typography variant="caption">
                              وقت: {Math.round(session.averageTime)}ث
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={session.accuracy}
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  لم تقم بأي جلسات تدريبية بعد. ابدأ أول جلسة لك الآن!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Start Session Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>بدء جلسة تدريب جديدة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>المنهج</InputLabel>
                <Select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  label="المنهج"
                >
                  {curricula.map((curriculum) => (
                    <MenuItem key={curriculum.value} value={curriculum.value}>
                      {curriculum.icon} {curriculum.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>المستوى</InputLabel>
                <Select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  label="المستوى"
                  disabled={!selectedCurriculum}
                >
                  {levels[selectedCurriculum]?.map((level) => (
                    <MenuItem key={level} value={level}>
                      {getLevelLabel(selectedCurriculum, level)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleStartSession}
            variant="contained"
            disabled={!selectedCurriculum || !selectedLevel}
          >
            بدء الجلسة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDashboard;
