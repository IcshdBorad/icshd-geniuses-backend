/**
 * Trainer Dashboard Component for ICSHD GENIUSES
 * Main dashboard for trainers to monitor students and sessions
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Group,
  TrendingUp,
  PlayArrow,
  EmojiEvents,
  Visibility,
  Assessment,
  Add,
  School,
  Timer,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { trainerAPI, sessionAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const TrainerDashboard = () => {
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [createSessionDialog, setCreateSessionDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');

  // Fetch trainer dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'trainerDashboard',
    trainerAPI.getDashboard,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch active sessions
  const { data: activeSessions } = useQuery(
    'activeSessions',
    sessionAPI.getActiveSessions,
    {
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  // Fetch students list
  const { data: students } = useQuery(
    'trainerStudents',
    trainerAPI.getStudents
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateSession = () => {
    setCreateSessionDialog(true);
  };

  const handleCloseCreateSession = () => {
    setCreateSessionDialog(false);
    setSelectedStudent('');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      paused: 'warning',
      completed: 'info',
      abandoned: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'نشط',
      paused: 'متوقف',
      completed: 'مكتمل',
      abandoned: 'متروك',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>جاري التحميل...</Typography>
      </Box>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentSessions = dashboardData?.recentSessions || [];
  const topStudents = dashboardData?.topStudents || [];

  // Chart data for student performance
  const performanceChartData = {
    labels: topStudents.map(student => student.name),
    datasets: [
      {
        label: 'متوسط الدقة (%)',
        data: topStudents.map(student => student.averageAccuracy),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Doughnut chart for curriculum distribution
  const curriculumData = {
    labels: ['السوروبان', 'الرياضيات الفيدية', 'المنطق الرياضي', 'ألعاب الذكاء'],
    datasets: [
      {
        data: [
          stats.curriculumStats?.soroban || 0,
          stats.curriculumStats?.vedic || 0,
          stats.curriculumStats?.logic || 0,
          stats.curriculumStats?.iqgames || 0,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
        ],
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            مرحباً، {user?.fullName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            لوحة تحكم المدرب - إدارة ومتابعة الطلاب
          </Typography>
        </Box>
      </motion.div>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="custom-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Group />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalStudents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إجمالي الطلاب
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="custom-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <PlayArrow />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.activeSessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      الجلسات النشطة
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="custom-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <EmojiEvents />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.pendingPromotions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ترقيات معلقة
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="custom-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.averageAccuracy || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      متوسط الدقة
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card className="custom-card">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="الجلسات النشطة" />
            <Tab label="أداء الطلاب" />
            <Tab label="الإحصائيات" />
          </Tabs>
        </Box>

        {/* Active Sessions Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                الجلسات النشطة ({activeSessions?.length || 0})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateSession}
              >
                إنشاء جلسة جديدة
              </Button>
            </Box>

            <List>
              {activeSessions?.map((session, index) => (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <School />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {session.student?.fullName}
                          </Typography>
                          <Chip
                            size="small"
                            label={getStatusLabel(session.status)}
                            color={getStatusColor(session.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {session.curriculum} - المستوى {session.level}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Timer fontSize="small" />
                              <Typography variant="caption">
                                {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CheckCircle fontSize="small" />
                              <Typography variant="caption">
                                {session.correctAnswers}/{session.totalQuestions}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end">
                        <Visibility />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </motion.div>
              ))}
              
              {(!activeSessions || activeSessions.length === 0) && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    لا توجد جلسات نشطة حالياً
                  </Typography>
                </Box>
              )}
            </List>
          </CardContent>
        )}

        {/* Student Performance Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              أداء أفضل الطلاب
            </Typography>
            
            {topStudents.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <Bar
                  data={performanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'متوسط دقة الطلاب',
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
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  لا توجد بيانات أداء متاحة
                </Typography>
              </Box>
            )}
          </CardContent>
        )}

        {/* Statistics Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  توزيع المناهج
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={curriculumData}
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
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  إحصائيات عامة
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      متوسط وقت الجلسة
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.averageSessionTime || 0) / 60 * 100 / 30} // Assuming max 30 minutes
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.floor((stats.averageSessionTime || 0) / 60)} دقيقة
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      معدل إكمال الجلسات
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.completionRate || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {stats.completionRate || 0}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      معدل التحسن الشهري
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.improvementRate || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {stats.improvementRate || 0}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Create Session Dialog */}
      <Dialog
        open={createSessionDialog}
        onClose={handleCloseCreateSession}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>إنشاء جلسة تدريب جديدة</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="اختر الطالب"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            sx={{ mt: 2 }}
          >
            {students?.map((student) => (
              <MenuItem key={student._id} value={student._id}>
                {student.fullName} - {student.studentCode}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateSession}>إلغاء</Button>
          <Button variant="contained" disabled={!selectedStudent}>
            إنشاء الجلسة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerDashboard;
