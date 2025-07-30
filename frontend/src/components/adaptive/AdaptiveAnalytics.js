/**
 * Adaptive Analytics Component for ICSHD GENIUSES
 * Displays comprehensive adaptive learning analytics and insights
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Target as TargetIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Lightbulb as LightbulbIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/apiService';

const AdaptiveAnalytics = ({ studentId, curriculum = 'soroban' }) => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['adaptiveAnalytics', studentId, curriculum, timeRange],
    queryFn: () => apiService.get(`/adaptive/analytics/${studentId}?timeRange=${timeRange}&curriculum=${curriculum}`),
    enabled: !!studentId,
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch adaptive profile
  const { data: profileData } = useQuery({
    queryKey: ['adaptiveProfile', studentId, curriculum],
    queryFn: () => apiService.get(`/adaptive/students/${studentId}/profile?curriculum=${curriculum}`),
    enabled: !!studentId
  });

  // Colors for charts
  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    info: '#0288d1',
    error: '#d32f2f'
  };

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Process analytics data
  const analytics = analyticsData?.data || {};
  const profile = profileData?.data?.profile || {};

  // Prepare chart data
  const performanceData = analytics.recentPerformance?.map((session, index) => ({
    session: `جلسة ${index + 1}`,
    accuracy: session.accuracy,
    duration: Math.round(session.duration / 60), // Convert to minutes
    date: new Date(session.date).toLocaleDateString('ar')
  })) || [];

  const adaptiveProgressData = analytics.adaptiveProgress?.map(prog => ({
    curriculum: prog.curriculum === 'soroban' ? 'السوروبان' :
                prog.curriculum === 'vedic' ? 'الفيديك' :
                prog.curriculum === 'logic' ? 'المنطق' : 'ألعاب الذكاء',
    level: prog.currentLevel,
    difficulty: Math.round(prog.difficultyScore * 100),
    style: prog.learningStyle === 'visual' ? 'بصري' :
           prog.learningStyle === 'auditory' ? 'سمعي' :
           prog.learningStyle === 'kinesthetic' ? 'حركي' : 'مختلط'
  })) || [];

  // Learning style distribution
  const learningStyleData = [
    { name: 'بصري', value: profile.learningStyle === 'visual' ? 100 : 0 },
    { name: 'سمعي', value: profile.learningStyle === 'auditory' ? 100 : 0 },
    { name: 'حركي', value: profile.learningStyle === 'kinesthetic' ? 100 : 0 },
    { name: 'مختلط', value: profile.learningStyle === 'mixed' ? 100 : 0 }
  ].filter(item => item.value > 0);

  // Strengths and weaknesses radar data
  const skillsData = [
    { skill: 'الدقة', current: profile.averageAccuracy || 0, target: 90 },
    { skill: 'السرعة', current: Math.max(0, 100 - (profile.averageSpeed || 60)), target: 80 },
    { skill: 'الثبات', current: profile.averageConsistency || 0, target: 85 },
    { skill: 'التركيز', current: 75, target: 90 },
    { skill: 'التحسن', current: analytics.improvementTrend === 'improving' ? 90 : 
                            analytics.improvementTrend === 'stable' ? 70 : 50, target: 85 }
  ];

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon color="success" />;
      case 'declining':
        return <TrendingDownIcon color="error" />;
      default:
        return <TrendingFlatIcon color="info" />;
    }
  };

  // Get trend color
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'success.main';
      case 'declining':
        return 'error.main';
      default:
        return 'info.main';
    }
  };

  // Export analytics
  const handleExport = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 2, color: 'primary.main' }} />
            تحليل الأداء التكيفي
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>الفترة الزمنية</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="الفترة الزمنية"
              >
                <MenuItem value="week">أسبوع</MenuItem>
                <MenuItem value="month">شهر</MenuItem>
                <MenuItem value="quarter">ربع سنة</MenuItem>
                <MenuItem value="year">سنة</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="تحديث البيانات">
              <IconButton onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
            >
              تصدير
            </Button>
          </Box>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary">
                      {analytics.totalSessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إجمالي الجلسات
                    </Typography>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {Math.round(analytics.averageAccuracy || 0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      متوسط الدقة
                    </Typography>
                  </Box>
                  <TargetIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ color: getTrendColor(analytics.improvementTrend) }}>
                      {getTrendIcon(analytics.improvementTrend)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      اتجاه التحسن
                    </Typography>
                  </Box>
                  <TimelineIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="secondary">
                      {profile.currentLevel || 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      المستوى الحالي
                    </Typography>
                  </Box>
                  <EmojiEventsIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Chart */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تطور الأداء عبر الوقت
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke={colors.primary} 
                        strokeWidth={2}
                        name="الدقة (%)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke={colors.secondary} 
                        strokeWidth={2}
                        name="المدة (دقيقة)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  نمط التعلم
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={learningStyleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {learningStyleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Skills Radar Chart */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تحليل المهارات
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillsData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="الأداء الحالي"
                        dataKey="current"
                        stroke={colors.primary}
                        fill={colors.primary}
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="الهدف المطلوب"
                        dataKey="target"
                        stroke={colors.success}
                        fill={colors.success}
                        fillOpacity={0.1}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  نقاط القوة والضعف
                </Typography>
                
                {profile.strengthAreas?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      نقاط القوة:
                    </Typography>
                    <List dense>
                      {profile.strengthAreas.map((area, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <EmojiEventsIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={area} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {profile.weaknessAreas?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      مجالات التحسين:
                    </Typography>
                    <List dense>
                      {profile.weaknessAreas.map((area, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <LightbulbIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={area} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Adaptive Progress */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              التقدم التكيفي حسب المنهج
            </Typography>
            <Grid container spacing={2}>
              {adaptiveProgressData.map((prog, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {prog.curriculum}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          المستوى: {prog.level}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(prog.level / 10) * 100} 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          الصعوبة: {prog.difficulty}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={prog.difficulty} 
                          color="secondary"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Chip 
                        label={`نمط: ${prog.style}`} 
                        size="small" 
                        color="info"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {analytics.recommendations?.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
                التوصيات التكيفية
              </Typography>
              
              {analytics.recommendations.map((rec, index) => (
                <Alert 
                  key={index}
                  severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">{rec.title}</Typography>
                  <Typography variant="body2">{rec.description}</Typography>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Box>
  );
};

export default AdaptiveAnalytics;
