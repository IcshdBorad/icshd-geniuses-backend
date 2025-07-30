import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  FormGroup,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore,
  Assessment,
  FilterList,
  Schedule,
  Preview,
  Download,
  Settings,
  Help,
  Add,
  Remove,
  Edit,
  Save,
  Cancel,
  CheckCircle,
  Error,
  Warning,
  Info
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

const ReportGenerator = ({ open, onClose, onGenerate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});

  // Report configuration
  const [reportConfig, setReportConfig] = useState({
    type: '',
    title: '',
    description: '',
    format: 'pdf',
    dateRange: {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      preset: 'last30days'
    },
    filters: {
      students: [],
      classes: [],
      curricula: [],
      levels: [],
      achievements: [],
      minAccuracy: 0,
      maxAccuracy: 100,
      minSessions: 0,
      includeInactive: false
    },
    sections: {
      overview: true,
      statistics: true,
      charts: true,
      tables: true,
      achievements: true,
      recommendations: true
    },
    customization: {
      theme: 'default',
      language: 'ar',
      includeHeader: true,
      includeFooter: true,
      includeWatermark: false,
      pageNumbers: true
    },
    scheduling: {
      enabled: false,
      frequency: 'weekly',
      recipients: [],
      time: '09:00'
    }
  });

  // Available options
  const [reportTypes, setReportTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [typesResponse] = await Promise.all([
        reportsAPI.getReportTypes()
      ]);
      setReportTypes(typesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Steps configuration
  const steps = [
    {
      label: 'نوع التقرير',
      description: 'اختر نوع التقرير المطلوب إنشاؤه',
      component: 'reportType'
    },
    {
      label: 'الفترة الزمنية',
      description: 'حدد الفترة الزمنية للتقرير',
      component: 'dateRange'
    },
    {
      label: 'المرشحات',
      description: 'طبق المرشحات المطلوبة',
      component: 'filters'
    },
    {
      label: 'المحتوى',
      description: 'اختر الأقسام المراد تضمينها',
      component: 'sections'
    },
    {
      label: 'التخصيص',
      description: 'خصص مظهر وإعدادات التقرير',
      component: 'customization'
    },
    {
      label: 'المراجعة',
      description: 'راجع الإعدادات وأنشئ التقرير',
      component: 'review'
    }
  ];

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setCompleted(prev => ({ ...prev, [activeStep]: true }));
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStepClick = (step) => {
    if (completed[step] || step <= activeStep) {
      setActiveStep(step);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Report Type
        if (!reportConfig.type) {
          newErrors.type = 'يرجى اختيار نوع التقرير';
        }
        break;
      case 1: // Date Range
        if (!reportConfig.dateRange.startDate || !reportConfig.dateRange.endDate) {
          newErrors.dateRange = 'يرجى تحديد الفترة الزمنية';
        }
        if (reportConfig.dateRange.startDate > reportConfig.dateRange.endDate) {
          newErrors.dateRange = 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية';
        }
        break;
      case 2: // Filters
        if (reportConfig.type === 'student_progress' && reportConfig.filters.students.length === 0) {
          newErrors.students = 'يرجى اختيار طالب واحد على الأقل';
        }
        if (reportConfig.type === 'class_performance' && reportConfig.filters.classes.length === 0) {
          newErrors.classes = 'يرجى اختيار فصل واحد على الأقل';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Prepare report data
      const reportData = {
        ...reportConfig,
        generatedAt: new Date(),
        generatedBy: 'current_user' // Replace with actual user
      };

      // Call the generation function
      await onGenerate(reportData);
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      setErrors({ general: 'خطأ في إنشاء التقرير' });
    } finally {
      setLoading(false);
    }
  };

  // Step components
  const renderReportTypeStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        اختر نوع التقرير
      </Typography>
      <Grid container spacing={2}>
        {reportTypes.map((type) => (
          <Grid item xs={12} sm={6} md={4} key={type.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: reportConfig.type === type.id ? 2 : 1,
                borderColor: reportConfig.type === type.id ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2
                }
              }}
              onClick={() => setReportConfig(prev => ({ ...prev, type: type.id }))}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    {type.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {type.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {type.formats.map((format) => (
                    <Chip key={format} label={format.toUpperCase()} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {errors.type && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.type}
        </Alert>
      )}
    </Box>
  );

  const renderDateRangeStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        حدد الفترة الزمنية
      </Typography>
      
      {/* Preset Options */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          خيارات سريعة:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'آخر 7 أيام', value: 'last7days', days: 7 },
            { label: 'آخر 30 يوم', value: 'last30days', days: 30 },
            { label: 'آخر 3 أشهر', value: 'last3months', days: 90 },
            { label: 'السنة الحالية', value: 'thisyear', days: 365 }
          ].map((preset) => (
            <Chip
              key={preset.value}
              label={preset.label}
              variant={reportConfig.dateRange.preset === preset.value ? 'filled' : 'outlined'}
              onClick={() => {
                const endDate = new Date();
                const startDate = subDays(endDate, preset.days);
                setReportConfig(prev => ({
                  ...prev,
                  dateRange: {
                    startDate,
                    endDate,
                    preset: preset.value
                  }
                }));
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Custom Date Range */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="تاريخ البداية"
            value={reportConfig.dateRange.startDate}
            onChange={(date) => setReportConfig(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, startDate: date, preset: 'custom' }
            }))}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="تاريخ النهاية"
            value={reportConfig.dateRange.endDate}
            onChange={(date) => setReportConfig(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, endDate: date, preset: 'custom' }
            }))}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
      </Grid>

      {errors.dateRange && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.dateRange}
        </Alert>
      )}
    </Box>
  );

  const renderFiltersStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        طبق المرشحات
      </Typography>

      <Grid container spacing={3}>
        {/* Student Selection */}
        {(reportConfig.type === 'student_progress' || reportConfig.type === 'custom') && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>الطلاب</InputLabel>
              <Select
                multiple
                value={reportConfig.filters.students}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  filters: { ...prev.filters, students: e.target.value }
                }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.students && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.students}
              </Alert>
            )}
          </Grid>
        )}

        {/* Class Selection */}
        {(reportConfig.type === 'class_performance' || reportConfig.type === 'custom') && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>الفصول</InputLabel>
              <Select
                multiple
                value={reportConfig.filters.classes}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  filters: { ...prev.filters, classes: e.target.value }
                }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.classes && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.classes}
              </Alert>
            )}
          </Grid>
        )}

        {/* Performance Filters */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="الحد الأدنى للدقة (%)"
            value={reportConfig.filters.minAccuracy}
            onChange={(e) => setReportConfig(prev => ({
              ...prev,
              filters: { ...prev.filters, minAccuracy: parseInt(e.target.value) || 0 }
            }))}
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="الحد الأعلى للدقة (%)"
            value={reportConfig.filters.maxAccuracy}
            onChange={(e) => setReportConfig(prev => ({
              ...prev,
              filters: { ...prev.filters, maxAccuracy: parseInt(e.target.value) || 100 }
            }))}
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={reportConfig.filters.includeInactive}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  filters: { ...prev.filters, includeInactive: e.target.checked }
                }))}
              />
            }
            label="تضمين الطلاب غير النشطين"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderSectionsStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        اختر المحتوى المراد تضمينه
      </Typography>

      <FormGroup>
        {Object.entries({
          overview: 'نظرة عامة',
          statistics: 'الإحصائيات',
          charts: 'الرسوم البيانية',
          tables: 'الجداول التفصيلية',
          achievements: 'الإنجازات',
          recommendations: 'التوصيات'
        }).map(([key, label]) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={reportConfig.sections[key]}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  sections: { ...prev.sections, [key]: e.target.checked }
                }))}
              />
            }
            label={label}
          />
        ))}
      </FormGroup>
    </Box>
  );

  const renderCustomizationStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        خصص التقرير
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>صيغة التقرير</InputLabel>
            <Select
              value={reportConfig.format}
              onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>اللغة</InputLabel>
            <Select
              value={reportConfig.customization.language}
              onChange={(e) => setReportConfig(prev => ({
                ...prev,
                customization: { ...prev.customization, language: e.target.value }
              }))}
            >
              <MenuItem value="ar">العربية</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="عنوان التقرير"
            value={reportConfig.title}
            onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="وصف التقرير"
            value={reportConfig.description}
            onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            خيارات إضافية:
          </Typography>
          <FormGroup>
            {Object.entries({
              includeHeader: 'تضمين الرأس',
              includeFooter: 'تضمين التذييل',
              includeWatermark: 'تضمين العلامة المائية',
              pageNumbers: 'ترقيم الصفحات'
            }).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={reportConfig.customization[key]}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      customization: { ...prev.customization, [key]: e.target.checked }
                    }))}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        مراجعة إعدادات التقرير
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                معلومات أساسية
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="نوع التقرير"
                    secondary={reportTypes.find(t => t.id === reportConfig.type)?.name || reportConfig.type}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="الصيغة"
                    secondary={reportConfig.format.toUpperCase()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="الفترة الزمنية"
                    secondary={`${format(reportConfig.dateRange.startDate, 'yyyy/MM/dd', { locale: ar })} - ${format(reportConfig.dateRange.endDate, 'yyyy/MM/dd', { locale: ar })}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                المحتوى المحدد
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(reportConfig.sections)
                  .filter(([, included]) => included)
                  .map(([section]) => (
                    <Chip
                      key={section}
                      label={section}
                      color="primary"
                      size="small"
                    />
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {errors.general && (
          <Grid item xs={12}>
            <Alert severity="error">
              {errors.general}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderStepContent = (step) => {
    switch (steps[step].component) {
      case 'reportType':
        return renderReportTypeStep();
      case 'dateRange':
        return renderDateRangeStep();
      case 'filters':
        return renderFiltersStep();
      case 'sections':
        return renderSectionsStep();
      case 'customization':
        return renderCustomizationStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { direction: isRTL ? 'rtl' : 'ltr', height: '90vh' }
        }}
      >
        <DialogTitle>
          🔧 مولد التقارير المتقدم
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Stepper */}
            <Box sx={{ width: 300, pr: 3, borderRight: 1, borderColor: 'divider' }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={index} completed={completed[index]}>
                    <StepLabel
                      onClick={() => handleStepClick(index)}
                      sx={{ cursor: completed[index] || index <= activeStep ? 'pointer' : 'default' }}
                    >
                      <Typography variant="subtitle1">
                        {step.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, pl: 3 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent(activeStep)}
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            السابق
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={generateReport}
              disabled={loading}
              startIcon={loading ? <LinearProgress size={20} /> : <Download />}
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              التالي
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ReportGenerator;
