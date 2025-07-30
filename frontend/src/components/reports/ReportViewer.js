import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Toolbar,
  AppBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Tabs,
  Tab,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close,
  Download,
  Print,
  Share,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  Refresh,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Remove,
  Assessment,
  BarChart,
  PieChart,
  Timeline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ReportViewer = ({ open, onClose, reportData, reportType }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isRTL ? 'right' : 'left',
        rtl: isRTL,
        labels: {
          font: {
            family: isRTL ? 'Cairo, sans-serif' : 'Roboto, sans-serif'
          }
        }
      },
      title: {
        display: true,
        font: {
          family: isRTL ? 'Cairo, sans-serif' : 'Roboto, sans-serif',
          size: 16
        }
      },
      tooltip: {
        rtl: isRTL,
        titleFont: {
          family: isRTL ? 'Cairo, sans-serif' : 'Roboto, sans-serif'
        },
        bodyFont: {
          family: isRTL ? 'Cairo, sans-serif' : 'Roboto, sans-serif'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: isRTL ? 'Cairo, sans-serif' : 'Roboto, sans-serif'
          }
        }
      },
      y: {
        ticks: {
          font: {
            family: isRTL ? 'Cairo, sans-serif' : 'Roboto, sans-serif'
          }
        }
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger download of the original report
    if (reportData?.downloadUrl) {
      window.open(reportData.downloadUrl, '_blank');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderStudentProgressReport = () => {
    if (!reportData?.student) return null;

    const { student, stats, sessions, achievements, gamificationData } = reportData;

    return (
      <Box>
        {/* Student Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}>
                {student.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {student.username}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {student.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  تاريخ التسجيل: {format(new Date(student.createdAt), 'yyyy/MM/dd', { locale: ar })}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  {stats.totalSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إجمالي الجلسات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {stats.averageAccuracy?.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  معدل الدقة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {stats.totalPoints || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إجمالي النقاط
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {stats.currentLevel || 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  المستوى الحالي
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Chart */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📈 تطور الأداء عبر الوقت
            </Typography>
            <Box sx={{ height: 300 }}>
              {sessions && sessions.length > 0 && (
                <Line
                  data={{
                    labels: sessions.slice(-10).map(session => 
                      format(new Date(session.createdAt), 'MM/dd', { locale: ar })
                    ),
                    datasets: [
                      {
                        label: 'الدقة (%)',
                        data: sessions.slice(-10).map(session => {
                          const correct = session.exercises.filter(ex => ex.isCorrect).length;
                          const total = session.exercises.length;
                          return total > 0 ? (correct / total) * 100 : 0;
                        }),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: true
                      }
                    ]
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'تطور الدقة في آخر 10 جلسات'
                      }
                    }
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📚 الجلسات الأخيرة
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>المنهج</TableCell>
                    <TableCell>التمارين</TableCell>
                    <TableCell>الدقة</TableCell>
                    <TableCell>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions?.slice(0, 10).map((session, index) => {
                    const correct = session.exercises.filter(ex => ex.isCorrect).length;
                    const total = session.exercises.length;
                    const accuracy = total > 0 ? (correct / total) * 100 : 0;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(session.createdAt), 'yyyy/MM/dd HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>{session.curriculum}</TableCell>
                        <TableCell>{total}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {accuracy.toFixed(1)}%
                            {accuracy >= 80 ? (
                              <TrendingUp sx={{ color: 'success.main', ml: 1 }} />
                            ) : accuracy >= 60 ? (
                              <Remove sx={{ color: 'warning.main', ml: 1 }} />
                            ) : (
                              <TrendingDown sx={{ color: 'error.main', ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.status === 'completed' ? 'مكتملة' : 'غير مكتملة'}
                            color={session.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🏆 الإنجازات المفتوحة
              </Typography>
              <Grid container spacing={2}>
                {achievements.slice(0, 6).map((achievement, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>
                          {achievement.achievementId.icon}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {achievement.achievementId.title.ar}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {achievement.achievementId.description.ar}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          +{achievement.achievementId.rewards.points} نقطة
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderClassPerformanceReport = () => {
    if (!reportData?.classStats) return null;

    const { classStats, students } = reportData;

    return (
      <Box>
        {/* Class Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              📊 نظرة عامة على الفصل
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {classStats.totalStudents}
                  </Typography>
                  <Typography variant="body2">إجمالي الطلاب</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">
                    {classStats.activeStudents}
                  </Typography>
                  <Typography variant="body2">الطلاب النشطون</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {classStats.averageAccuracy?.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">متوسط الدقة</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    {classStats.totalSessions}
                  </Typography>
                  <Typography variant="body2">إجمالي الجلسات</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              🌟 أفضل الطلاب أداءً
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الترتيب</TableCell>
                    <TableCell>الطالب</TableCell>
                    <TableCell>الجلسات</TableCell>
                    <TableCell>الدقة</TableCell>
                    <TableCell>النقاط</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classStats.topPerformers?.slice(0, 10).map((performer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={index + 1}
                          color={index < 3 ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{performer.student.username}</TableCell>
                      <TableCell>{performer.stats.totalSessions}</TableCell>
                      <TableCell>{performer.stats.averageAccuracy?.toFixed(1)}%</TableCell>
                      <TableCell>{performer.stats.totalPoints || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution Chart */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📈 توزيع الأداء
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={{
                  labels: ['ممتاز (90%+)', 'جيد جداً (80-89%)', 'جيد (70-79%)', 'مقبول (60-69%)', 'ضعيف (<60%)'],
                  datasets: [
                    {
                      label: 'عدد الطلاب',
                      data: [
                        classStats.topPerformers?.filter(p => p.stats.averageAccuracy >= 90).length || 0,
                        classStats.topPerformers?.filter(p => p.stats.averageAccuracy >= 80 && p.stats.averageAccuracy < 90).length || 0,
                        classStats.topPerformers?.filter(p => p.stats.averageAccuracy >= 70 && p.stats.averageAccuracy < 80).length || 0,
                        classStats.topPerformers?.filter(p => p.stats.averageAccuracy >= 60 && p.stats.averageAccuracy < 70).length || 0,
                        classStats.topPerformers?.filter(p => p.stats.averageAccuracy < 60).length || 0
                      ],
                      backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(139, 195, 74, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                      ]
                    }
                  ]
                }}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'توزيع الطلاب حسب مستوى الأداء'
                    }
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderGamificationReport = () => {
    if (!reportData?.gamificationStats) return null;

    const { gamificationStats, profiles } = reportData;

    return (
      <Box>
        {/* Gamification Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              🎮 نظرة عامة على نظام التحفيز
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {gamificationStats.totalActiveUsers}
                  </Typography>
                  <Typography variant="body2">المستخدمون النشطون</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">
                    {gamificationStats.totalPointsAwarded?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">إجمالي النقاط</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {gamificationStats.totalAchievementsUnlocked}
                  </Typography>
                  <Typography variant="body2">الإنجازات المفتوحة</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    {gamificationStats.averageLevel?.toFixed(1)}
                  </Typography>
                  <Typography variant="body2">متوسط المستوى</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📊 توزيع المستويات
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={{
                      labels: Object.keys(gamificationStats.levelDistribution || {}),
                      datasets: [
                        {
                          data: Object.values(gamificationStats.levelDistribution || {}),
                          backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40'
                          ]
                        }
                      ]
                    }}
                    options={chartOptions}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  💰 توزيع النقاط
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={{
                      labels: Object.keys(gamificationStats.pointsDistribution || {}),
                      datasets: [
                        {
                          label: 'عدد الطلاب',
                          data: Object.values(gamificationStats.pointsDistribution || {}),
                          backgroundColor: 'rgba(54, 162, 235, 0.8)'
                        }
                      ]
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'توزيع الطلاب حسب النقاط'
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Most Popular Achievements */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              🏆 أكثر الإنجازات شيوعاً
            </Typography>
            <Grid container spacing={2}>
              {gamificationStats.mostPopularAchievements?.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {item.achievement.icon}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {item.achievement.title.ar}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.achievement.description.ar}
                      </Typography>
                      <Chip
                        label={`${item.unlockedCount} طالب`}
                        color="primary"
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderReportContent = () => {
    switch (reportType) {
      case 'student_progress':
        return renderStudentProgressReport();
      case 'class_performance':
        return renderClassPerformanceReport();
      case 'gamification_summary':
        return renderGamificationReport();
      default:
        return (
          <Alert severity="info">
            نوع التقرير غير مدعوم في العارض
          </Alert>
        );
    }
  };

  if (!open || !reportData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={fullscreen}
      PaperProps={{
        sx: {
          direction: isRTL ? 'rtl' : 'ltr',
          width: fullscreen ? '100%' : '90%',
          height: fullscreen ? '100%' : '90%'
        }
      }}
    >
      {/* Toolbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            عارض التقارير - {reportData.reportTitle || 'تقرير'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" sx={{ alignSelf: 'center', mx: 1 }}>
              {zoom}%
            </Typography>
            <IconButton onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn />
            </IconButton>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <IconButton onClick={handlePrint}>
              <Print />
            </IconButton>
            <IconButton onClick={handleDownload}>
              <Download />
            </IconButton>
            <IconButton onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: `${10000 / zoom}%`,
            p: 3
          }}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderReportContent()}
            </motion.div>
          </AnimatePresence>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReportViewer;
