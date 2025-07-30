/**
 * Session Complete Component for ICSHD GENIUSES
 * Displays session results and achievements
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  Timer,
  CheckCircle,
  Cancel,
  Star,
  Share,
  Home,
  PlayArrow,
  Assessment,
  School,
  Speed,
  Lightbulb,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { assessmentAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SessionComplete = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shareDialog, setShareDialog] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const sessionData = location.state?.sessionData;

  // Fetch detailed session analysis
  const { data: analysis } = useQuery(
    ['sessionAnalysis', sessionData?._id],
    () => assessmentAPI.analyzeSession(sessionData._id),
    {
      enabled: !!sessionData?._id,
    }
  );

  useEffect(() => {
    if (!sessionData) {
      navigate('/student');
    }
  }, [sessionData, navigate]);

  if (!sessionData) {
    return null;
  }

  const {
    curriculum,
    level,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    totalTime,
    averageTime,
    accuracy,
    score,
    achievements,
    isPromotionEligible,
    nextLevel,
  } = sessionData;

  // Performance chart data
  const performanceData = {
    labels: ['الإجابات الصحيحة', 'الإجابات الخاطئة', 'الأسئلة المتخطاة'],
    datasets: [
      {
        label: 'الأداء',
        data: [correctAnswers, wrongAnswers, skippedQuestions],
        backgroundColor: [
          'rgba(76, 175, 80, 0.6)',
          'rgba(244, 67, 54, 0.6)',
          'rgba(158, 158, 158, 0.6)',
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(158, 158, 158, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const getGradeColor = (accuracy) => {
    if (accuracy >= 90) return 'success';
    if (accuracy >= 80) return 'info';
    if (accuracy >= 70) return 'warning';
    return 'error';
  };

  const getGradeLabel = (accuracy) => {
    if (accuracy >= 90) return 'ممتاز';
    if (accuracy >= 80) return 'جيد جداً';
    if (accuracy >= 70) return 'جيد';
    if (accuracy >= 60) return 'مقبول';
    return 'يحتاج تحسين';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleStartNewSession = () => {
    navigate('/student/new-session');
  };

  const handleViewProgress = () => {
    navigate('/student/progress');
  };

  const handleGoHome = () => {
    navigate('/student');
  };

  const handleShare = () => {
    setShareDialog(true);
  };

  const handleShowAnalysis = () => {
    setShowAnalysis(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: getGradeColor(accuracy) + '.main',
                mx: 'auto',
                mb: 2,
                fontSize: '3rem',
              }}
            >
              <EmojiEvents sx={{ fontSize: '4rem' }} />
            </Avatar>
          </motion.div>

          <Typography variant="h3" fontWeight="bold" gutterBottom>
            أحسنت! 🎉
          </Typography>
          
          <Typography variant="h5" color="text.secondary" gutterBottom>
            لقد أكملت جلسة {getCurriculumLabel(curriculum)}
          </Typography>

          <Chip
            label={getGradeLabel(accuracy)}
            color={getGradeColor(accuracy)}
            size="large"
            sx={{ fontSize: '1.1rem', px: 2, py: 1 }}
          />
        </Box>
      </motion.div>

      {/* Results Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="custom-card">
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  نتائج الجلسة
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {accuracy}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        الدقة
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {correctAnswers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        إجابات صحيحة
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {formatTime(totalTime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        إجمالي الوقت
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {score}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        النقاط المكتسبة
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Detailed Stats */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">الإجابات الصحيحة</Typography>
                        <Typography variant="body2">{correctAnswers}/{totalQuestions}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(correctAnswers / totalQuestions) * 100}
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">متوسط وقت الإجابة</Typography>
                        <Typography variant="body2">{formatTime(averageTime)}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((averageTime / 60) * 100, 100)}
                        color="info"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="إجابات صحيحة"
                          secondary={`${correctAnswers} من ${totalQuestions}`}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Cancel color="error" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="إجابات خاطئة"
                          secondary={`${wrongAnswers} من ${totalQuestions}`}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Speed color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="أسئلة متخطاة"
                          secondary={`${skippedQuestions} من ${totalQuestions}`}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Achievements & Promotion */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="custom-card">
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  الإنجازات والترقيات
                </Typography>

                {/* Promotion Status */}
                {isPromotionEligible && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                        textAlign: 'center',
                      }}
                    >
                      <Star sx={{ fontSize: 40, color: '#333', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="#333">
                        مؤهل للترقية!
                      </Typography>
                      <Typography variant="body2" color="#333">
                        إلى المستوى {nextLevel}
                      </Typography>
                    </Box>
                  </motion.div>
                )}

                {/* Achievements */}
                {achievements && achievements.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      إنجازات جديدة:
                    </Typography>
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + index * 0.2 }}
                      >
                        <Chip
                          icon={<EmojiEvents />}
                          label={achievement.title}
                          color="warning"
                          sx={{ mb: 1, mr: 1 }}
                        />
                      </motion.div>
                    ))}
                  </Box>
                )}

                {/* Performance Insights */}
                {analysis && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assessment />}
                      onClick={handleShowAnalysis}
                    >
                      عرض التحليل التفصيلي
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <Card className="custom-card">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              ماذا تريد أن تفعل الآن؟
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStartNewSession}
                  sx={{ py: 2 }}
                >
                  جلسة جديدة
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<TrendingUp />}
                  onClick={handleViewProgress}
                  sx={{ py: 2 }}
                >
                  عرض التقدم
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Share />}
                  onClick={handleShare}
                  sx={{ py: 2 }}
                >
                  مشاركة النتيجة
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Home />}
                  onClick={handleGoHome}
                  sx={{ py: 2 }}
                >
                  الصفحة الرئيسية
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onClose={() => setShareDialog(false)}>
        <DialogTitle>مشاركة النتيجة</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            شارك إنجازك مع الأصدقاء والعائلة!
          </Typography>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              حققت {accuracy}% دقة في {getCurriculumLabel(curriculum)}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              المستوى {level} - {score} نقطة
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>إغلاق</Button>
          <Button variant="contained">نسخ الرابط</Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog 
        open={showAnalysis} 
        onClose={() => setShowAnalysis(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>التحليل التفصيلي للجلسة</DialogTitle>
        <DialogContent>
          {analysis && (
            <Box>
              <Typography variant="h6" gutterBottom>
                نقاط القوة:
              </Typography>
              <List>
                {analysis.strengths?.map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                نقاط التحسين:
              </Typography>
              <List>
                {analysis.weaknesses?.map((weakness, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={weakness} />
                  </ListItem>
                ))}
              </List>

              {analysis.recommendations && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    التوصيات:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analysis.recommendations}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysis(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionComplete;
