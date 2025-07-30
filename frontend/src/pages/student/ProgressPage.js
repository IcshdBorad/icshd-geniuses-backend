/**
 * Progress Page Component for ICSHD GENIUSES
 * Shows detailed student progress and analytics
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  Timer,
  Speed,
  Calculate,
  Psychology,
  School,
  Games,
  Star,
  Visibility,
  CalendarToday,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { studentAPI, assessmentAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend, ArcElement);

const ProgressPage = () => {
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('month');

  // Fetch student progress data
  const { data: progressData, isLoading } = useQuery(
    ['studentProgress', timeRange],
    () => studentAPI.getProgress(timeRange)
  );

  // Fetch session history
  const { data: sessionHistory } = useQuery(
    'sessionHistory',
    studentAPI.getSessionHistory
  );

  // Fetch achievements
  const { data: achievements } = useQuery(
    'studentAchievements',
    studentAPI.getAchievements
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getCurriculumIcon = (curriculum) => {
    const icons = {
      soroban: <Calculate />,
      vedic: <Psychology />,
      logic: <School />,
      iqgames: <Games />,
    };
    return icons[curriculum] || <School />;
  };

  const getCurriculumLabel = (curriculum) => {
    const labels = {
      soroban: 'السوروبان',
      vedic: 'الرياضيات الفيدية',
      logic: 'المنطق الرياضي',
      iqgames: 'ألعاب الذكاء',
    };
    return labels[curriculum] || curriculum;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>جاري التحميل...</Typography>
      </Box>
    );
  }

  const stats = progressData?.stats || {};
  const chartData = progressData?.chartData || {};
  const recentSessions = sessionHistory?.slice(0, 10) || [];

  // Progress over time chart
  const progressChartData = {
    labels: chartData.labels || [],
    datasets: [
      {
        label: 'الدقة (%)',
        data: chartData.accuracy || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'السرعة (ثانية)',
        data: chartData.speed || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  // Curriculum performance chart
  const curriculumChartData = {
    labels: ['السوروبان', 'الرياضيات الفيدية', 'المنطق الرياضي', 'ألعاب الذكاء'],
    datasets: [
      {
        label: 'متوسط الدقة (%)',
        data: [
          stats.curriculumStats?.soroban?.accuracy || 0,
          stats.curriculumStats?.vedic?.accuracy || 0,
          stats.curriculumStats?.logic?.accuracy || 0,
          stats.curriculumStats?.iqgames?.accuracy || 0,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Level distribution chart
  const levelDistributionData = {
    labels: Object.keys(stats.levelDistribution || {}),
    datasets: [
      {
        data: Object.values(stats.levelDistribution || {}),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              تقدمي في التعلم
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              تتبع أداءك وإنجازاتك في الحساب الذهني
            </Typography>
          </Box>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>الفترة الزمنية</InputLabel>
            <Select
              value={timeRange}
              label="الفترة الزمنية"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">هذا الأسبوع</MenuItem>
              <MenuItem value="month">هذا الشهر</MenuItem>
              <MenuItem value="quarter">هذا الربع</MenuItem>
              <MenuItem value="year">هذا العام</MenuItem>
            </Select>
          </FormControl>
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
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.overallAccuracy || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      الدقة الإجمالية
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
                    <EmojiEvents />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalSessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إجمالي الجلسات
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
                    <Timer />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatTime(stats.totalTime || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إجمالي وقت التدريب
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
                    <Speed />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.averageSpeed || 0}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      متوسط سرعة الإجابة
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
            <Tab label="التقدم العام" />
            <Tab label="أداء المناهج" />
            <Tab label="تاريخ الجلسات" />
            <Tab label="الإنجازات" />
          </Tabs>
        </Box>

        {/* Overall Progress Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  تطور الأداء عبر الوقت
                </Typography>
                <Box sx={{ height: 400 }}>
                  <Line
                    data={progressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      scales: {
                        x: {
                          display: true,
                          title: {
                            display: true,
                            text: 'التاريخ',
                          },
                        },
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                            display: true,
                            text: 'الدقة (%)',
                          },
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: 'السرعة (ثانية)',
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  توزيع المستويات
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={levelDistributionData}
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
            </Grid>

            {/* Current Levels */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                المستويات الحالية
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(stats.currentLevels || {}).map(([curriculum, level]) => (
                  <Grid item xs={12} sm={6} md={3} key={curriculum}>
                    <Card sx={{ bgcolor: 'grey.50' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{ mb: 2 }}>
                          {getCurriculumIcon(curriculum)}
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                          المستوى {level}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getCurriculumLabel(curriculum)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={((level - 1) / 10) * 100}
                          sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </CardContent>
        )}

        {/* Curriculum Performance Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              أداء المناهج المختلفة
            </Typography>
            <Box sx={{ height: 400, mb: 4 }}>
              <Bar
                data={curriculumChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'متوسط الدقة لكل منهج',
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

            {/* Detailed Curriculum Stats */}
            <Grid container spacing={3}>
              {Object.entries(stats.curriculumStats || {}).map(([curriculum, data]) => (
                <Grid item xs={12} sm={6} md={3} key={curriculum}>
                  <Card sx={{ bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {getCurriculumIcon(curriculum)}
                        <Typography variant="h6" fontWeight="bold">
                          {getCurriculumLabel(curriculum)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ space: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">الدقة:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {data.accuracy || 0}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">الجلسات:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {data.sessions || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">المستوى:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {data.level || 1}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Session History Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              تاريخ الجلسات الأخيرة
            </Typography>
            
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>المنهج</TableCell>
                    <TableCell>المستوى</TableCell>
                    <TableCell>الدقة</TableCell>
                    <TableCell>الوقت</TableCell>
                    <TableCell>النقاط</TableCell>
                    <TableCell>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSessions.map((session, index) => (
                    <motion.tr
                      key={session._id}
                      component={TableRow}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(session.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getCurriculumIcon(session.curriculum)}
                          <Typography variant="body2">
                            {getCurriculumLabel(session.curriculum)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`المستوى ${session.level}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {session.accuracy}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(session.totalTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${session.score} نقطة`}
                          size="small"
                          color="warning"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {recentSessions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  لا توجد جلسات سابقة
                </Typography>
              </Box>
            )}
          </CardContent>
        )}

        {/* Achievements Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              الإنجازات والشارات
            </Typography>
            
            <Grid container spacing={3}>
              {achievements?.map((achievement, index) => (
                <Grid item xs={12} sm={6} md={4} key={achievement._id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="custom-card"
                      sx={{ 
                        bgcolor: achievement.unlocked ? 'warning.light' : 'grey.100',
                        opacity: achievement.unlocked ? 1 : 0.6,
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: achievement.unlocked ? 'warning.main' : 'grey.400',
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          {achievement.unlocked ? <Star /> : <EmojiEvents />}
                        </Avatar>
                        
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {achievement.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {achievement.description}
                        </Typography>
                        
                        {achievement.unlocked ? (
                          <Chip
                            label={`تم الحصول عليه في ${formatDate(achievement.unlockedAt)}`}
                            size="small"
                            color="success"
                          />
                        ) : (
                          <LinearProgress
                            variant="determinate"
                            value={achievement.progress || 0}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {(!achievements || achievements.length === 0) && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  لا توجد إنجازات متاحة حالياً
                </Typography>
              </Box>
            )}
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default ProgressPage;
