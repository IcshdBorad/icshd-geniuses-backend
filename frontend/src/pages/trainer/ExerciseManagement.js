/**
 * Exercise Management Component for ICSHD GENIUSES
 * Allows trainers to manage and customize exercises
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Preview,
  Save,
  Cancel,
  Calculate,
  Psychology,
  School,
  Games,
  PlayArrow,
  Settings,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { exerciseAPI } from '../../services/api';

const ExerciseManagement = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    curriculum: '',
    level: 1,
    type: '',
    difficulty: 1,
    timeLimit: 60,
    pattern: '',
    metadata: {},
    isActive: true,
  });

  // Fetch exercises
  const { data: exercises, isLoading } = useQuery(
    'exercises',
    exerciseAPI.getAll
  );

  // Create exercise mutation
  const createMutation = useMutation(exerciseAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('exercises');
      setCreateDialog(false);
      resetForm();
    },
  });

  // Update exercise mutation
  const updateMutation = useMutation(exerciseAPI.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('exercises');
      setEditDialog(false);
      resetForm();
    },
  });

  // Delete exercise mutation
  const deleteMutation = useMutation(exerciseAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('exercises');
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const resetForm = () => {
    setExerciseForm({
      curriculum: '',
      level: 1,
      type: '',
      difficulty: 1,
      timeLimit: 60,
      pattern: '',
      metadata: {},
      isActive: true,
    });
    setSelectedExercise(null);
  };

  const handleCreateExercise = () => {
    setCreateDialog(true);
    resetForm();
  };

  const handleEditExercise = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseForm({
      curriculum: exercise.curriculum,
      level: exercise.level,
      type: exercise.type,
      difficulty: exercise.difficulty,
      timeLimit: exercise.timeLimit || 60,
      pattern: exercise.pattern,
      metadata: exercise.metadata || {},
      isActive: exercise.isActive !== false,
    });
    setEditDialog(true);
  };

  const handleDeleteExercise = (exerciseId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التمرين؟')) {
      deleteMutation.mutate(exerciseId);
    }
  };

  const handlePreviewExercise = (exercise) => {
    setSelectedExercise(exercise);
    setPreviewDialog(true);
  };

  const handleSaveExercise = () => {
    if (selectedExercise) {
      updateMutation.mutate({
        id: selectedExercise._id,
        data: exerciseForm,
      });
    } else {
      createMutation.mutate(exerciseForm);
    }
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

  const getTypeLabel = (type) => {
    const labels = {
      addition: 'الجمع',
      subtraction: 'الطرح',
      multiplication: 'الضرب',
      division: 'القسمة',
      mixed: 'مختلط',
      pattern: 'الأنماط',
      logic: 'المنطق',
      memory: 'الذاكرة',
    };
    return labels[type] || type;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      1: 'success',
      2: 'info',
      3: 'warning',
      4: 'error',
      5: 'error',
    };
    return colors[difficulty] || 'default';
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      1: 'سهل',
      2: 'متوسط',
      3: 'صعب',
      4: 'صعب جداً',
      5: 'خبير',
    };
    return labels[difficulty] || difficulty;
  };

  const filteredExercises = exercises?.filter(exercise => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return exercise.curriculum === 'soroban';
    if (tabValue === 2) return exercise.curriculum === 'vedic';
    if (tabValue === 3) return exercise.curriculum === 'logic';
    if (tabValue === 4) return exercise.curriculum === 'iqgames';
    return true;
  }) || [];

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>جاري التحميل...</Typography>
      </Box>
    );
  }

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
              إدارة التمارين
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              إنشاء وتخصيص تمارين الحساب الذهني
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateExercise}
            size="large"
          >
            إنشاء تمرين جديد
          </Button>
        </Box>
      </motion.div>

      {/* Curriculum Tabs */}
      <Card className="custom-card" sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="جميع التمارين" />
            <Tab label="السوروبان" />
            <Tab label="الرياضيات الفيدية" />
            <Tab label="المنطق الرياضي" />
            <Tab label="ألعاب الذكاء" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Exercise Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.contrastText">
                  {filteredExercises.length}
                </Typography>
                <Typography variant="body2" color="primary.contrastText">
                  إجمالي التمارين
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="success.contrastText">
                  {filteredExercises.filter(e => e.isActive !== false).length}
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  التمارين النشطة
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="warning.contrastText">
                  {filteredExercises.filter(e => e.difficulty >= 4).length}
                </Typography>
                <Typography variant="body2" color="warning.contrastText">
                  التمارين المتقدمة
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="info.contrastText">
                  {Math.round(filteredExercises.reduce((sum, e) => sum + (e.usageCount || 0), 0) / filteredExercises.length) || 0}
                </Typography>
                <Typography variant="body2" color="info.contrastText">
                  متوسط الاستخدام
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Exercise Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>المنهج</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>المستوى</TableCell>
                  <TableCell>الصعوبة</TableCell>
                  <TableCell>الوقت المحدد</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>الاستخدام</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExercises.map((exercise, index) => (
                  <motion.tr
                    key={exercise._id}
                    component={TableRow}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCurriculumIcon(exercise.curriculum)}
                        <Typography variant="body2">
                          {getCurriculumLabel(exercise.curriculum)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getTypeLabel(exercise.type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`المستوى ${exercise.level}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDifficultyLabel(exercise.difficulty)}
                        size="small"
                        color={getDifficultyColor(exercise.difficulty)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {exercise.timeLimit || 60} ثانية
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exercise.isActive !== false ? 'نشط' : 'غير نشط'}
                        size="small"
                        color={exercise.isActive !== false ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {exercise.usageCount || 0} مرة
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewExercise(exercise)}
                          title="معاينة"
                        >
                          <Preview />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditExercise(exercise)}
                          title="تعديل"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExercise(exercise._id)}
                          title="حذف"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredExercises.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                لا توجد تمارين متاحة
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Exercise Dialog */}
      <Dialog
        open={createDialog || editDialog}
        onClose={() => {
          setCreateDialog(false);
          setEditDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedExercise ? 'تعديل التمرين' : 'إنشاء تمرين جديد'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>المنهج</InputLabel>
                <Select
                  value={exerciseForm.curriculum}
                  label="المنهج"
                  onChange={(e) => setExerciseForm({ ...exerciseForm, curriculum: e.target.value })}
                >
                  <MenuItem value="soroban">السوروبان</MenuItem>
                  <MenuItem value="vedic">الرياضيات الفيدية</MenuItem>
                  <MenuItem value="logic">المنطق الرياضي</MenuItem>
                  <MenuItem value="iqgames">ألعاب الذكاء</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>نوع التمرين</InputLabel>
                <Select
                  value={exerciseForm.type}
                  label="نوع التمرين"
                  onChange={(e) => setExerciseForm({ ...exerciseForm, type: e.target.value })}
                >
                  <MenuItem value="addition">الجمع</MenuItem>
                  <MenuItem value="subtraction">الطرح</MenuItem>
                  <MenuItem value="multiplication">الضرب</MenuItem>
                  <MenuItem value="division">القسمة</MenuItem>
                  <MenuItem value="mixed">مختلط</MenuItem>
                  <MenuItem value="pattern">الأنماط</MenuItem>
                  <MenuItem value="logic">المنطق</MenuItem>
                  <MenuItem value="memory">الذاكرة</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المستوى"
                type="number"
                value={exerciseForm.level}
                onChange={(e) => setExerciseForm({ ...exerciseForm, level: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الوقت المحدد (ثانية)"
                type="number"
                value={exerciseForm.timeLimit}
                onChange={(e) => setExerciseForm({ ...exerciseForm, timeLimit: parseInt(e.target.value) })}
                inputProps={{ min: 10, max: 300 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>مستوى الصعوبة: {getDifficultyLabel(exerciseForm.difficulty)}</Typography>
              <Slider
                value={exerciseForm.difficulty}
                onChange={(e, value) => setExerciseForm({ ...exerciseForm, difficulty: value })}
                min={1}
                max={5}
                marks
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="نمط التمرين"
                multiline
                rows={4}
                value={exerciseForm.pattern}
                onChange={(e) => setExerciseForm({ ...exerciseForm, pattern: e.target.value })}
                placeholder="أدخل نمط التمرين أو القواعد..."
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exerciseForm.isActive}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, isActive: e.target.checked })}
                  />
                }
                label="تمرين نشط"
              />
            </Grid>
          </Grid>

          {(createMutation.isError || updateMutation.isError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              حدث خطأ أثناء حفظ التمرين. يرجى المحاولة مرة أخرى.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateDialog(false);
              setEditDialog(false);
              resetForm();
            }}
            startIcon={<Cancel />}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSaveExercise}
            variant="contained"
            startIcon={<Save />}
            disabled={!exerciseForm.curriculum || !exerciseForm.type || createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Exercise Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>معاينة التمرين</DialogTitle>
        <DialogContent>
          {selectedExercise && (
            <Box sx={{ space: 2 }}>
              <Typography variant="h6" gutterBottom>
                {getCurriculumLabel(selectedExercise.curriculum)} - {getTypeLabel(selectedExercise.type)}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={`المستوى ${selectedExercise.level}`} size="small" />
                <Chip 
                  label={getDifficultyLabel(selectedExercise.difficulty)} 
                  size="small" 
                  color={getDifficultyColor(selectedExercise.difficulty)}
                />
                <Chip label={`${selectedExercise.timeLimit || 60} ثانية`} size="small" />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                نمط التمرين:
              </Typography>
              <Typography variant="body1" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                {selectedExercise.pattern || 'لا يوجد نمط محدد'}
              </Typography>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  <strong>إحصائيات الاستخدام:</strong> تم استخدام هذا التمرين {selectedExercise.usageCount || 0} مرة
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>إغلاق</Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => {
              // TODO: Implement exercise test run
              setPreviewDialog(false);
            }}
          >
            تجربة التمرين
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExerciseManagement;
