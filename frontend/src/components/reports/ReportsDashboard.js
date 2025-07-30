import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Assessment,
  PictureAsPdf,
  TableChart,
  Download,
  Schedule,
  TrendingUp,
  Group,
  EmojiEvents,
  School,
  Analytics,
  FilterList,
  Refresh,
  Settings,
  Share,
  Print,
  Email,
  MoreVert
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';

// API service
import { reportsAPI } from '../../services/api';

const ReportsDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State management
  const [reportTypes, setReportTypes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Report generation state
  const [reportConfig, setReportConfig] = useState({
    type: '',
    format: 'pdf',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    includeGamification: true,
    includeSessions: true,
    includeAchievements: true,
    includeCharts: true,
    studentId: '',
    classId: '',
    curriculum: ''
  });

  // Quick filters
  const quickFilters = [
    { label: 'آخر 7 أيام', days: 7 },
    { label: 'آخر 30 يوم', days: 30 },
    { label: 'آخر 3 أشهر', days: 90 },
    { label: 'السنة الحالية', days: 365 }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [typesResponse, statsResponse] = await Promise.all([
        reportsAPI.getReportTypes(),
        reportsAPI.getStatistics({ type: 'overview' })
      ]);

      setReportTypes(typesResponse.data);
      setStatistics(statsResponse.data);
    } catch (error) {
      console.error('Error loading reports data:', error);
      showSnackbar('خطأ في تحميل بيانات التقارير', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = async () => {
    try {
      const response = await reportsAPI.getStatistics({
        type: 'overview',
        startDate: reportConfig.startDate.toISOString(),
        endDate: reportConfig.endDate.toISOString()
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error refreshing statistics:', error);
      showSnackbar('خطأ في تحديث الإحصائيات', 'error');
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      
      let response;
      const params = {
        format: reportConfig.format,
        startDate: reportConfig.startDate.toISOString(),
        endDate: reportConfig.endDate.toISOString(),
        includeGamification: reportConfig.includeGamification,
        includeSessions: reportConfig.includeSessions,
        includeAchievements: reportConfig.includeAchievements
      };

      switch (reportConfig.type) {
        case 'student_progress':
          if (!reportConfig.studentId) {
            showSnackbar('يرجى تحديد الطالب', 'warning');
            return;
          }
          response = await reportsAPI.generateStudentReport(reportConfig.studentId, params);
          break;
        
        case 'class_performance':
          if (!reportConfig.classId) {
            showSnackbar('يرجى تحديد الفصل', 'warning');
            return;
          }
          response = await reportsAPI.generateClassReport(reportConfig.classId, params);
          break;
        
        case 'gamification_summary':
          response = await reportsAPI.generateGamificationReport(params);
          break;
        
        default:
          showSnackbar('نوع التقرير غير مدعوم', 'error');
          return;
      }

      if (reportConfig.format === 'json') {
        // Display JSON data in a new window or dialog
        console.log('Report data:', response.data);
        showSnackbar('تم إنشاء التقرير بنجاح', 'success');
      } else {
        // Download file
        const blob = new Blob([response.data], { 
          type: reportConfig.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${reportConfig.type}_${format(new Date(), 'yyyy-MM-dd')}.${reportConfig.format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSnackbar('تم تحميل التقرير بنجاح', 'success');
      }

      setReportDialog(false);
    } catch (error) {
      console.error('Error generating report:', error);
      showSnackbar('خطأ في إنشاء التقرير', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleQuickFilter = (days) => {
    setReportConfig(prev => ({
      ...prev,
      startDate: subDays(new Date(), days),
      endDate: new Date()
    }));
  };

  const openReportDialog = (reportType) => {
    setSelectedReport(reportType);
    setReportConfig(prev => ({ ...prev, type: reportType.id }));
    setReportDialog(true);
  };

  // Statistics cards data
  const statisticsCards = [
    {
      title: 'إجمالي الطلاب',
      value: statistics?.totalStudents || 0,
      icon: Group,
      color: '#2196F3',
      trend: '+12%'
    },
    {
      title: 'الطلاب النشطون',
      value: statistics?.activeStudents || 0,
      icon: TrendingUp,
      color: '#4CAF50',
      trend: '+8%'
    },
    {
      title: 'إجمالي الجلسات',
      value: statistics?.totalSessions || 0,
      icon: School,
      color: '#FF9800',
      trend: '+15%'
    },
    {
      title: 'معدل الإكمال',
      value: `${statistics?.completionRate?.toFixed(1) || 0}%`,
      icon: EmojiEvents,
      color: '#9C27B0',
      trend: '+5%'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
      <Box sx={{ p: 3, direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              📊 لوحة التقارير
            </Typography>
            <Typography variant="body1" color="text.secondary">
              إنشاء وإدارة التقارير التحليلية للمنصة
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshStatistics}
            >
              تحديث
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterDialog(true)}
            >
              فلترة
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => setScheduleDialog(true)}
            >
              جدولة
            </Button>
          </Box>
        </Box>

        {/* Quick Filters */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>فلاتر سريعة</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {quickFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter.label}
                onClick={() => handleQuickFilter(filter.days)}
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statisticsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>
                          {stat.trend} من الشهر الماضي
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                        <stat.icon sx={{ fontSize: 30 }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Report Types */}
        <Typography variant="h6" sx={{ mb: 2 }}>أنواع التقارير المتاحة</Typography>
        <Grid container spacing={3}>
          {reportTypes.map((reportType, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => openReportDialog(reportType)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Assessment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {reportType.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reportType.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {reportType.formats.map((format) => (
                        <Chip
                          key={format}
                          label={format.toUpperCase()}
                          size="small"
                          variant="outlined"
                          icon={format === 'pdf' ? <PictureAsPdf /> : <TableChart />}
                        />
                      ))}
                    </Box>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Download />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openReportDialog(reportType);
                      }}
                    >
                      إنشاء التقرير
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Report Generation Dialog */}
        <Dialog
          open={reportDialog}
          onClose={() => setReportDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { direction: isRTL ? 'rtl' : 'ltr' }
          }}
        >
          <DialogTitle>
            إنشاء {selectedReport?.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Format Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>صيغة التقرير</InputLabel>
                  <Select
                    value={reportConfig.format}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
                    label="صيغة التقرير"
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="تاريخ البداية"
                  value={reportConfig.startDate}
                  onChange={(date) => setReportConfig(prev => ({ ...prev, startDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="تاريخ النهاية"
                  value={reportConfig.endDate}
                  onChange={(date) => setReportConfig(prev => ({ ...prev, endDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              {/* Conditional Fields */}
              {selectedReport?.id === 'student_progress' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="معرف الطالب"
                    value={reportConfig.studentId}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="أدخل معرف الطالب"
                  />
                </Grid>
              )}

              {selectedReport?.id === 'class_performance' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="معرف الفصل"
                    value={reportConfig.classId}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, classId: e.target.value }))}
                    placeholder="أدخل معرف الفصل"
                  />
                </Grid>
              )}

              {/* Options */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>خيارات التقرير</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportConfig.includeGamification}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeGamification: e.target.checked }))}
                      />
                    }
                    label="تضمين بيانات التحفيز"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportConfig.includeSessions}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeSessions: e.target.checked }))}
                      />
                    }
                    label="تضمين بيانات الجلسات"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportConfig.includeAchievements}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeAchievements: e.target.checked }))}
                      />
                    }
                    label="تضمين الإنجازات"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportConfig.includeCharts}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      />
                    }
                    label="تضمين الرسوم البيانية"
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="contained"
              onClick={generateReport}
              disabled={generating}
              startIcon={generating ? <LinearProgress size={20} /> : <Download />}
            >
              {generating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportsDashboard;
