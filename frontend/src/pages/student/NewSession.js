/**
 * New Session Component for ICSHD GENIUSES
 * Allows students to create and customize new training sessions
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Calculate,
  Psychology,
  School,
  Games,
  Timer,
  Speed,
  TrendingUp,
  PlayArrow,
  Settings,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { sessionAPI, studentAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';

const NewSession = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createSession } = useSessionStore();
  
  const [activeStep, setActiveStep] = useState(0);
  const [sessionConfig, setSessionConfig] = useState({
    curriculum: '',
    level: 1,
    duration: 15,
    questionCount: 10,
    difficulty: 'auto',
    timeLimit: 60,
    enableHints: true,
    adaptiveDifficulty: true,
    focusAreas: [],
  });
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Fetch student's current levels and recommendations
  const { data: studentData } = useQuery(
    'studentLevels',
    studentAPI.getCurrentLevels
  );

  // Fetch available curricula and their details
  const { data: curriculaData } = useQuery(
    'availableCurricula',
    sessionAPI.getAvailableCurricula
  );

  // Create session mutation
  const createSessionMutation = useMutation(sessionAPI.create, {
    onSuccess: (data) => {
      navigate(`/student/session/${data.sessionId}`);
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
    },
  });

  const steps = [
    'اختيار المنهج',
    'تحديد المستوى',
    'إعدادات الجلسة',
    'مراجعة وبدء',
  ];

  const curriculumOptions = [
    {
      value: 'soroban',
      label: 'السوروبان',
      icon: <Calculate />,
      description: 'تعلم الحساب الذهني باستخدام السوروبان الياباني',
      color: '#ff6b6b',
    },
    {
      value: 'vedic',
      label: 'الرياضيات الفيدية',
      icon: <Psychology />,
      description: 'تقنيات الحساب السريع من الرياضيات الفيدية القديمة',
      color: '#4ecdc4',
    },
    {
      value: 'logic',
      label: 'المنطق الرياضي',
      icon: <School />,
      description: 'تطوير مهارات التفكير المنطقي وحل المسائل',
      color: '#45b7d1',
    },
    {
      value: 'iqgames',
      label: 'ألعاب الذكاء',
      icon: <Games />,
      description: 'ألعاب تفاعلية لتنمية القدرات الذهنية',
      color: '#96ceb4',
    },
  ];

  const difficultyOptions = [
    { value: 'auto', label: 'تلقائي (موصى به)', description: 'يتم تحديد الصعوبة تلقائياً حسب أداءك' },
    { value: 'easy', label: 'سهل', description: 'للمبتدئين أو المراجعة' },
    { value: 'medium', label: 'متوسط', description: 'للتحدي المعتدل' },
    { value: 'hard', label: 'صعب', description: 'للتحدي المتقدم' },
  ];

  const focusAreaOptions = {
    soroban: ['الجمع', 'الطرح', 'الضرب', 'القسمة', 'الأرقام الكبيرة'],
    vedic: ['الضرب السريع', 'القسمة', 'المربعات', 'الجذور', 'النسب المئوية'],
    logic: ['الأنماط', 'التسلسل', 'الاستنتاج', 'حل المسائل', 'التفكير النقدي'],
    iqgames: ['الذاكرة', 'التركيز', 'السرعة', 'التحليل', 'الإبداع'],
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCurriculumSelect = (curriculum) => {
    setSessionConfig({
      ...sessionConfig,
      curriculum,
      level: studentData?.currentLevels?.[curriculum] || 1,
      focusAreas: [],
    });
    handleNext();
  };

  const handleCreateSession = () => {
    setConfirmDialog(true);
  };

  const handleConfirmCreate = () => {
    createSessionMutation.mutate(sessionConfig);
    setConfirmDialog(false);
  };

  const getCurrentCurriculum = () => {
    return curriculumOptions.find(c => c.value === sessionConfig.curriculum);
  };

  const getRecommendedLevel = () => {
    return studentData?.currentLevels?.[sessionConfig.curriculum] || 1;
  };

  const getEstimatedDuration = () => {
    const baseTime = sessionConfig.questionCount * (sessionConfig.timeLimit / 60);
    return Math.round(baseTime + 5); // Add 5 minutes for transitions
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            إنشاء جلسة تدريب جديدة
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            اختر المنهج والإعدادات المناسبة لك
          </Typography>
        </Box>
      </motion.div>

      {/* Stepper */}
      <Card className="custom-card" sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Step 1: Curriculum Selection */}
        {activeStep === 0 && (
          <Card className="custom-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                اختر المنهج الذي تريد التدرب عليه
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {curriculumOptions.map((curriculum, index) => (
                  <Grid item xs={12} sm={6} md={3} key={curriculum.value}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                          border: sessionConfig.curriculum === curriculum.value ? 2 : 1,
                          borderColor: sessionConfig.curriculum === curriculum.value ? 'primary.main' : 'divider',
                        }}
                        onClick={() => handleCurriculumSelect(curriculum.value)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              bgcolor: curriculum.color,
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            {curriculum.icon}
                          </Avatar>
                          
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {curriculum.label}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {curriculum.description}
                          </Typography>

                          {studentData?.currentLevels?.[curriculum.value] && (
                            <Chip
                              label={`المستوى الحالي: ${studentData.currentLevels[curriculum.value]}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Level Selection */}
        {activeStep === 1 && (
          <Card className="custom-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                اختر المستوى المناسب
              </Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      المستوى: {sessionConfig.level}
                    </Typography>
                    <Slider
                      value={sessionConfig.level}
                      onChange={(e, value) => setSessionConfig({ ...sessionConfig, level: value })}
                      min={1}
                      max={10}
                      marks
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  {getRecommendedLevel() && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>المستوى الموصى به:</strong> {getRecommendedLevel()} بناءً على أداءك السابق
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    وصف المستوى {sessionConfig.level}:
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Typography variant="body2">
                      {sessionConfig.level <= 3 && 'مستوى مبتدئ - تمارين أساسية وبسيطة'}
                      {sessionConfig.level > 3 && sessionConfig.level <= 6 && 'مستوى متوسط - تمارين متنوعة ومتوسطة الصعوبة'}
                      {sessionConfig.level > 6 && sessionConfig.level <= 8 && 'مستوى متقدم - تمارين معقدة وتحديات أكبر'}
                      {sessionConfig.level > 8 && 'مستوى خبير - تمارين عالية الصعوبة للمحترفين'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={handleBack}>
                  السابق
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  التالي
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Session Settings */}
        {activeStep === 2 && (
          <Card className="custom-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                إعدادات الجلسة
              </Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>مدة الجلسة (دقيقة)</InputLabel>
                    <Select
                      value={sessionConfig.duration}
                      label="مدة الجلسة (دقيقة)"
                      onChange={(e) => setSessionConfig({ ...sessionConfig, duration: e.target.value })}
                    >
                      <MenuItem value={10}>10 دقائق</MenuItem>
                      <MenuItem value={15}>15 دقيقة</MenuItem>
                      <MenuItem value={20}>20 دقيقة</MenuItem>
                      <MenuItem value={30}>30 دقيقة</MenuItem>
                      <MenuItem value={45}>45 دقيقة</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      عدد الأسئلة: {sessionConfig.questionCount}
                    </Typography>
                    <Slider
                      value={sessionConfig.questionCount}
                      onChange={(e, value) => setSessionConfig({ ...sessionConfig, questionCount: value })}
                      min={5}
                      max={50}
                      marks={[
                        { value: 5, label: '5' },
                        { value: 10, label: '10' },
                        { value: 20, label: '20' },
                        { value: 30, label: '30' },
                        { value: 50, label: '50' },
                      ]}
                      step={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      الوقت المحدد لكل سؤال: {sessionConfig.timeLimit} ثانية
                    </Typography>
                    <Slider
                      value={sessionConfig.timeLimit}
                      onChange={(e, value) => setSessionConfig({ ...sessionConfig, timeLimit: value })}
                      min={30}
                      max={180}
                      marks={[
                        { value: 30, label: '30s' },
                        { value: 60, label: '1m' },
                        { value: 120, label: '2m' },
                        { value: 180, label: '3m' },
                      ]}
                      step={15}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>مستوى الصعوبة</InputLabel>
                    <Select
                      value={sessionConfig.difficulty}
                      label="مستوى الصعوبة"
                      onChange={(e) => setSessionConfig({ ...sessionConfig, difficulty: e.target.value })}
                    >
                      {difficultyOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sessionConfig.enableHints}
                          onChange={(e) => setSessionConfig({ ...sessionConfig, enableHints: e.target.checked })}
                        />
                      }
                      label="تفعيل التلميحات"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sessionConfig.adaptiveDifficulty}
                          onChange={(e) => setSessionConfig({ ...sessionConfig, adaptiveDifficulty: e.target.checked })}
                        />
                      }
                      label="تعديل الصعوبة تلقائياً"
                    />
                  </Box>

                  {focusAreaOptions[sessionConfig.curriculum] && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        مجالات التركيز (اختياري):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {focusAreaOptions[sessionConfig.curriculum].map((area) => (
                          <Chip
                            key={area}
                            label={area}
                            clickable
                            color={sessionConfig.focusAreas.includes(area) ? 'primary' : 'default'}
                            onClick={() => {
                              const newFocusAreas = sessionConfig.focusAreas.includes(area)
                                ? sessionConfig.focusAreas.filter(a => a !== area)
                                : [...sessionConfig.focusAreas, area];
                              setSessionConfig({ ...sessionConfig, focusAreas: newFocusAreas });
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={handleBack}>
                  السابق
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  التالي
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review and Start */}
        {activeStep === 3 && (
          <Card className="custom-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                مراجعة إعدادات الجلسة
              </Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {getCurrentCurriculum()?.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary="المنهج"
                        secondary={getCurrentCurriculum()?.label}
                      />
                    </ListItem>
                    
                    <Divider />
                    
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp />
                      </ListItemIcon>
                      <ListItemText
                        primary="المستوى"
                        secondary={`المستوى ${sessionConfig.level}`}
                      />
                    </ListItem>
                    
                    <Divider />
                    
                    <ListItem>
                      <ListItemIcon>
                        <Timer />
                      </ListItemIcon>
                      <ListItemText
                        primary="مدة الجلسة"
                        secondary={`${sessionConfig.duration} دقيقة (تقديري: ${getEstimatedDuration()} دقيقة)`}
                      />
                    </ListItem>
                    
                    <Divider />
                    
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle />
                      </ListItemIcon>
                      <ListItemText
                        primary="عدد الأسئلة"
                        secondary={`${sessionConfig.questionCount} سؤال`}
                      />
                    </ListItem>
                    
                    <Divider />
                    
                    <ListItem>
                      <ListItemIcon>
                        <Speed />
                      </ListItemIcon>
                      <ListItemText
                        primary="الوقت المحدد لكل سؤال"
                        secondary={`${sessionConfig.timeLimit} ثانية`}
                      />
                    </ListItem>
                    
                    {sessionConfig.focusAreas.length > 0 && (
                      <>
                        <Divider />
                        <ListItem>
                          <ListItemIcon>
                            <Settings />
                          </ListItemIcon>
                          <ListItemText
                            primary="مجالات التركيز"
                            secondary={
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {sessionConfig.focusAreas.map((area) => (
                                  <Chip key={area} label={area} size="small" />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      نصائح للجلسة
                    </Typography>
                    <Typography variant="body2">
                      • تأكد من وجودك في مكان هادئ
                      <br />
                      • ركز على الدقة أكثر من السرعة
                      <br />
                      • استخدم التلميحات عند الحاجة
                      <br />
                      • لا تتردد في أخذ استراحة قصيرة
                    </Typography>
                  </Box>

                  {sessionConfig.adaptiveDifficulty && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      سيتم تعديل صعوبة الأسئلة تلقائياً حسب أداءك
                    </Alert>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={handleBack}>
                  السابق
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleCreateSession}
                  disabled={createSessionMutation.isLoading}
                >
                  {createSessionMutation.isLoading ? 'جاري الإنشاء...' : 'بدء الجلسة'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>تأكيد بدء الجلسة</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            هل أنت مستعد لبدء جلسة {getCurrentCurriculum()?.label} في المستوى {sessionConfig.level}؟
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ستستغرق الجلسة حوالي {getEstimatedDuration()} دقيقة.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleConfirmCreate}
            variant="contained"
            disabled={createSessionMutation.isLoading}
          >
            {createSessionMutation.isLoading ? 'جاري الإنشاء...' : 'بدء الجلسة'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewSession;
