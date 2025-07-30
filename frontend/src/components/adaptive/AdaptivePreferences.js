/**
 * Adaptive Preferences Component for ICSHD GENIUSES
 * Allows students and trainers to customize adaptive learning preferences
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Switch,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  Snackbar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Target as TargetIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  VolumeUp as VolumeUpIcon,
  TouchApp as TouchAppIcon,
  Shuffle as ShuffleIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/apiService';

const AdaptivePreferences = ({ studentId, curriculum = 'soroban', onSave }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State for preferences
  const [preferences, setPreferences] = useState({
    learningStyle: 'mixed',
    preferredDifficulty: 0.5,
    timePreferences: {
      preferredSessionDuration: 30,
      maxQuestionTime: 60,
      breakFrequency: 10,
      adaptiveTimeAdjustment: true
    },
    focusAreas: [],
    adaptationSettings: {
      enableRealTimeAdaptation: true,
      adaptationSensitivity: 0.5,
      minResponsesForAdaptation: 3,
      allowDifficultyIncrease: true,
      allowDifficultyDecrease: true
    },
    uiPreferences: {
      showHints: true,
      showProgress: true,
      enableSounds: true,
      animationSpeed: 'normal'
    }
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Available focus areas by curriculum
  const focusAreasBycurriculum = {
    soroban: [
      'الجمع البسيط',
      'الطرح البسيط', 
      'الجمع المركب',
      'الطرح المركب',
      'الضرب',
      'القسمة',
      'الأرقام الكبيرة',
      'العمليات المختلطة'
    ],
    vedic: [
      'الضرب السريع',
      'القسمة السريعة',
      'المربعات',
      'الجذور التربيعية',
      'النسب والتناسب',
      'الكسور',
      'النسب المئوية'
    ],
    logic: [
      'الأنماط العددية',
      'التسلسل المنطقي',
      'المقارنات',
      'التصنيف',
      'الاستنتاج',
      'حل المشكلات'
    ],
    iqgames: [
      'الذاكرة البصرية',
      'التركيز',
      'سرعة المعالجة',
      'التفكير المكاني',
      'التخطيط',
      'المرونة المعرفية'
    ]
  };

  // Fetch current preferences
  const { data: currentPreferences, isLoading } = useQuery({
    queryKey: ['adaptiveProfile', studentId, curriculum],
    queryFn: () => apiService.get(`/adaptive/students/${studentId}/profile?curriculum=${curriculum}`),
    enabled: !!studentId
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: (prefs) => apiService.post(`/adaptive/students/${studentId}/preferences?curriculum=${curriculum}`, prefs),
    onSuccess: () => {
      setShowSuccess(true);
      setHasChanges(false);
      queryClient.invalidateQueries(['adaptiveProfile', studentId, curriculum]);
      if (onSave) onSave(preferences);
    },
    onError: (error) => {
      console.error('Failed to save preferences:', error);
    }
  });

  // Load current preferences when data is available
  useEffect(() => {
    if (currentPreferences?.data?.profile) {
      const profile = currentPreferences.data.profile;
      setPreferences(prev => ({
        ...prev,
        learningStyle: profile.learningStyle || 'mixed',
        preferredDifficulty: profile.preferredDifficulty || 0.5,
        timePreferences: {
          ...prev.timePreferences,
          ...profile.timePreferences
        },
        focusAreas: profile.preferredExerciseTypes || []
      }));
    }
  }, [currentPreferences]);

  // Handle preference changes
  const handlePreferenceChange = (category, key, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      if (category) {
        newPrefs[category] = { ...newPrefs[category], [key]: value };
      } else {
        newPrefs[key] = value;
      }
      return newPrefs;
    });
    setHasChanges(true);
  };

  // Handle focus area toggle
  const handleFocusAreaToggle = (area) => {
    setPreferences(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
    setHasChanges(true);
  };

  // Save preferences
  const handleSave = () => {
    savePreferencesMutation.mutate(preferences);
  };

  // Reset to defaults
  const handleReset = () => {
    setPreferences({
      learningStyle: 'mixed',
      preferredDifficulty: 0.5,
      timePreferences: {
        preferredSessionDuration: 30,
        maxQuestionTime: 60,
        breakFrequency: 10,
        adaptiveTimeAdjustment: true
      },
      focusAreas: [],
      adaptationSettings: {
        enableRealTimeAdaptation: true,
        adaptationSensitivity: 0.5,
        minResponsesForAdaptation: 3,
        allowDifficultyIncrease: true,
        allowDifficultyDecrease: true
      },
      uiPreferences: {
        showHints: true,
        showProgress: true,
        enableSounds: true,
        animationSpeed: 'normal'
      }
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography>جاري تحميل الإعدادات...</Typography>
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
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PsychologyIcon sx={{ mr: 2, color: 'primary.main' }} />
            إعدادات التعلم التكيفي
          </Typography>

          {/* Learning Style Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">نمط التعلم المفضل</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={preferences.learningStyle}
                  onChange={(e) => handlePreferenceChange(null, 'learningStyle', e.target.value)}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, border: preferences.learningStyle === 'visual' ? 2 : 1, borderColor: preferences.learningStyle === 'visual' ? 'primary.main' : 'grey.300' }}>
                        <FormControlLabel
                          value="visual"
                          control={<Radio />}
                          label={
                            <Box textAlign="center">
                              <VisibilityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                              <Typography variant="subtitle1">بصري</Typography>
                              <Typography variant="caption" color="text.secondary">
                                يفضل الرسوم والألوان والمخططات
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, border: preferences.learningStyle === 'auditory' ? 2 : 1, borderColor: preferences.learningStyle === 'auditory' ? 'primary.main' : 'grey.300' }}>
                        <FormControlLabel
                          value="auditory"
                          control={<Radio />}
                          label={
                            <Box textAlign="center">
                              <VolumeUpIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                              <Typography variant="subtitle1">سمعي</Typography>
                              <Typography variant="caption" color="text.secondary">
                                يفضل الأصوات والتعليمات الصوتية
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, border: preferences.learningStyle === 'kinesthetic' ? 2 : 1, borderColor: preferences.learningStyle === 'kinesthetic' ? 'primary.main' : 'grey.300' }}>
                        <FormControlLabel
                          value="kinesthetic"
                          control={<Radio />}
                          label={
                            <Box textAlign="center">
                              <TouchAppIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                              <Typography variant="subtitle1">حركي</Typography>
                              <Typography variant="caption" color="text.secondary">
                                يفضل التفاعل والحركة
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, border: preferences.learningStyle === 'mixed' ? 2 : 1, borderColor: preferences.learningStyle === 'mixed' ? 'primary.main' : 'grey.300' }}>
                        <FormControlLabel
                          value="mixed"
                          control={<Radio />}
                          label={
                            <Box textAlign="center">
                              <ShuffleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                              <Typography variant="subtitle1">مختلط</Typography>
                              <Typography variant="caption" color="text.secondary">
                                مزيج من جميع الأنماط
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Card>
                    </Grid>
                  </Grid>
                </RadioGroup>
              </FormControl>
            </AccordionDetails>
          </Accordion>

          {/* Difficulty Preferences */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">مستوى الصعوبة المفضل</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ px: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  اختر مستوى الصعوبة الذي تشعر بالراحة معه
                </Typography>
                <Slider
                  value={preferences.preferredDifficulty}
                  onChange={(e, value) => handlePreferenceChange(null, 'preferredDifficulty', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: 'سهل جداً' },
                    { value: 0.3, label: 'سهل' },
                    { value: 0.5, label: 'متوسط' },
                    { value: 0.7, label: 'صعب' },
                    { value: 1.0, label: 'صعب جداً' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Time Preferences */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">إعدادات الوقت</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="مدة الجلسة المفضلة (دقيقة)"
                    type="number"
                    value={preferences.timePreferences.preferredSessionDuration}
                    onChange={(e) => handlePreferenceChange('timePreferences', 'preferredSessionDuration', parseInt(e.target.value))}
                    inputProps={{ min: 10, max: 120 }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="الحد الأقصى لوقت السؤال (ثانية)"
                    type="number"
                    value={preferences.timePreferences.maxQuestionTime}
                    onChange={(e) => handlePreferenceChange('timePreferences', 'maxQuestionTime', parseInt(e.target.value))}
                    inputProps={{ min: 10, max: 300 }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="تكرار الاستراحة (كل كم سؤال)"
                    type="number"
                    value={preferences.timePreferences.breakFrequency}
                    onChange={(e) => handlePreferenceChange('timePreferences', 'breakFrequency', parseInt(e.target.value))}
                    inputProps={{ min: 5, max: 50 }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.timePreferences.adaptiveTimeAdjustment}
                        onChange={(e) => handlePreferenceChange('timePreferences', 'adaptiveTimeAdjustment', e.target.checked)}
                      />
                    }
                    label="تعديل الوقت تلقائياً حسب الأداء"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Focus Areas */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">مجالات التركيز</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                اختر المجالات التي تريد التركيز عليها أكثر
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {focusAreasBycurriculum[curriculum]?.map((area) => (
                  <Chip
                    key={area}
                    label={area}
                    onClick={() => handleFocusAreaToggle(area)}
                    color={preferences.focusAreas.includes(area) ? 'primary' : 'default'}
                    variant={preferences.focusAreas.includes(area) ? 'filled' : 'outlined'}
                    clickable
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Adaptation Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">إعدادات التكيف</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.adaptationSettings.enableRealTimeAdaptation}
                        onChange={(e) => handlePreferenceChange('adaptationSettings', 'enableRealTimeAdaptation', e.target.checked)}
                      />
                    }
                    label="تفعيل التكيف في الوقت الفعلي"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    حساسية التكيف
                  </Typography>
                  <Slider
                    value={preferences.adaptationSettings.adaptationSensitivity}
                    onChange={(e, value) => handlePreferenceChange('adaptationSettings', 'adaptationSensitivity', value)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    marks={[
                      { value: 0.1, label: 'منخفض' },
                      { value: 0.5, label: 'متوسط' },
                      { value: 1.0, label: 'عالي' }
                    ]}
                    disabled={!preferences.adaptationSettings.enableRealTimeAdaptation}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.adaptationSettings.allowDifficultyIncrease}
                        onChange={(e) => handlePreferenceChange('adaptationSettings', 'allowDifficultyIncrease', e.target.checked)}
                      />
                    }
                    label="السماح بزيادة الصعوبة"
                    disabled={!preferences.adaptationSettings.enableRealTimeAdaptation}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.adaptationSettings.allowDifficultyDecrease}
                        onChange={(e) => handlePreferenceChange('adaptationSettings', 'allowDifficultyDecrease', e.target.checked)}
                      />
                    }
                    label="السماح بتقليل الصعوبة"
                    disabled={!preferences.adaptationSettings.enableRealTimeAdaptation}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* UI Preferences */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">إعدادات الواجهة</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.uiPreferences.showHints}
                        onChange={(e) => handlePreferenceChange('uiPreferences', 'showHints', e.target.checked)}
                      />
                    }
                    label="إظهار التلميحات"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.uiPreferences.showProgress}
                        onChange={(e) => handlePreferenceChange('uiPreferences', 'showProgress', e.target.checked)}
                      />
                    }
                    label="إظهار شريط التقدم"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.uiPreferences.enableSounds}
                        onChange={(e) => handlePreferenceChange('uiPreferences', 'enableSounds', e.target.checked)}
                      />
                    }
                    label="تفعيل الأصوات"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>سرعة الحركة</InputLabel>
                    <Select
                      value={preferences.uiPreferences.animationSpeed}
                      onChange={(e) => handlePreferenceChange('uiPreferences', 'animationSpeed', e.target.value)}
                      label="سرعة الحركة"
                    >
                      <MenuItem value="slow">بطيء</MenuItem>
                      <MenuItem value="normal">عادي</MenuItem>
                      <MenuItem value="fast">سريع</MenuItem>
                      <MenuItem value="none">بدون حركة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
            >
              إعادة تعيين
            </Button>
            
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>

          {hasChanges && (
            <Alert severity="info" sx={{ mt: 2 }}>
              لديك تغييرات غير محفوظة. لا تنس حفظ إعداداتك.
            </Alert>
          )}
        </Paper>
      </motion.div>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        message="تم حفظ الإعدادات بنجاح"
      />
    </Box>
  );
};

export default AdaptivePreferences;
