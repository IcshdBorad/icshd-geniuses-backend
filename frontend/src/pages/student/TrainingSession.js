/**
 * Training Session Component for ICSHD GENIUSES
 * Interactive training session interface for students
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Divider,
  Alert,
  Fade,
  Zoom,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  Help,
  Timer,
  CheckCircle,
  Cancel,
  TrendingUp,
  EmojiEvents,
  Lightbulb,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { useAuthStore } from '../../stores/authStore';
import { socketService } from '../../services/socketService';

const TrainingSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentSession,
    currentExercise,
    sessionStats,
    isLoading,
    startSession,
    submitAnswer,
    skipExercise,
    requestHint,
    pauseSession,
    resumeSession,
    completeSession,
  } = useSessionStore();

  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [exitDialog, setExitDialog] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);

  // Timer effect for exercise time limit
  useEffect(() => {
    if (currentSession?.status === 'active' && currentExercise && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentSession?.status, currentExercise, timeLeft]);

  // Session timer effect
  useEffect(() => {
    if (currentSession?.status === 'active') {
      const timer = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentSession?.status]);

  // Initialize session on component mount
  useEffect(() => {
    if (sessionId && !currentSession) {
      startSession(sessionId);
    }
  }, [sessionId, currentSession, startSession]);

  // Set exercise time when new exercise loads
  useEffect(() => {
    if (currentExercise) {
      setTimeLeft(currentExercise.timeLimit || 60);
      setAnswer('');
      setShowHint(false);
      setShowResult(false);
    }
  }, [currentExercise]);

  // Socket event handlers
  useEffect(() => {
    const handleExerciseResult = (result) => {
      setLastResult(result);
      setShowResult(true);
      
      setTimeout(() => {
        setShowResult(false);
        setLastResult(null);
      }, 3000);
    };

    const handleSessionComplete = (sessionData) => {
      navigate('/student/session-complete', { 
        state: { sessionData } 
      });
    };

    socketService.onSessionEvent('exerciseResult', handleExerciseResult);
    socketService.onSessionEvent('sessionComplete', handleSessionComplete);

    return () => {
      socketService.offSessionEvent('exerciseResult', handleExerciseResult);
      socketService.offSessionEvent('sessionComplete', handleSessionComplete);
    };
  }, [navigate]);

  const handleTimeUp = useCallback(() => {
    if (currentExercise && !showResult) {
      submitAnswer(answer || '', true); // true indicates timeout
    }
  }, [currentExercise, answer, showResult, submitAnswer]);

  const handleSubmitAnswer = () => {
    if (answer.trim() && currentExercise) {
      submitAnswer(answer.trim());
    }
  };

  const handleSkip = () => {
    if (currentExercise) {
      skipExercise();
    }
  };

  const handleHint = () => {
    if (currentExercise) {
      requestHint();
      setShowHint(true);
    }
  };

  const handlePause = () => {
    pauseSession();
  };

  const handleResume = () => {
    resumeSession();
  };

  const handleExit = () => {
    setExitDialog(true);
  };

  const handleConfirmExit = () => {
    completeSession();
    navigate('/student');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!sessionStats) return 0;
    return Math.round((sessionStats.answeredQuestions / sessionStats.totalQuestions) * 100);
  };

  const getAccuracyPercentage = () => {
    if (!sessionStats || sessionStats.answeredQuestions === 0) return 0;
    return Math.round((sessionStats.correctAnswers / sessionStats.answeredQuestions) * 100);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
            <Timer sx={{ fontSize: 40 }} />
          </Avatar>
        </motion.div>
        <Typography variant="h6">جاري تحضير الجلسة...</Typography>
      </Box>
    );
  }

  if (!currentSession || !currentExercise) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          لم يتم العثور على الجلسة أو التمرين
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/student')}
          sx={{ mt: 2 }}
        >
          العودة للوحة التحكم
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 2 }}>
      {/* Session Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {currentSession.curriculum} - المستوى {currentSession.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  الجلسة: {sessionStats?.answeredQuestions + 1} من {sessionStats?.totalQuestions}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<Timer />}
                  label={formatTime(sessionTimer)}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<TrendingUp />}
                  label={`${getAccuracyPercentage()}% دقة`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">التقدم</Typography>
                <Typography variant="body2">{getProgressPercentage()}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgressPercentage()} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Exercise Card */}
      <motion.div
        key={currentExercise._id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ mb: 2, minHeight: 400 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            {/* Exercise Timer */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <motion.div
                animate={{ 
                  scale: timeLeft <= 10 ? [1, 1.1, 1] : 1,
                  color: timeLeft <= 10 ? '#f44336' : '#2196f3'
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: timeLeft <= 10 ? Infinity : 0 
                }}
              >
                <Typography 
                  variant="h3" 
                  fontWeight="bold"
                  color={timeLeft <= 10 ? 'error' : 'primary'}
                >
                  {formatTime(timeLeft)}
                </Typography>
              </motion.div>
            </Box>

            {/* Exercise Content */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {currentExercise.question}
              </Typography>
              
              {currentExercise.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {currentExercise.description}
                </Typography>
              )}

              {currentExercise.image && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <img 
                    src={currentExercise.image} 
                    alt="Exercise" 
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>

            {/* Answer Input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="إجابتك"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitAnswer();
                  }
                }}
                disabled={currentSession.status !== 'active'}
                sx={{ 
                  maxWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.5rem',
                    textAlign: 'center',
                  }
                }}
                autoFocus
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || currentSession.status !== 'active'}
                startIcon={<CheckCircle />}
              >
                إرسال الإجابة
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={handleSkip}
                disabled={currentSession.status !== 'active'}
                startIcon={<SkipNext />}
              >
                تخطي
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={handleHint}
                disabled={currentSession.status !== 'active' || showHint}
                startIcon={<Lightbulb />}
              >
                تلميح
              </Button>
            </Box>

            {/* Session Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {currentSession.status === 'active' ? (
                <IconButton onClick={handlePause} color="warning">
                  <Pause />
                </IconButton>
              ) : (
                <IconButton onClick={handleResume} color="success">
                  <PlayArrow />
                </IconButton>
              )}
              
              <IconButton onClick={handleExit} color="error">
                <Stop />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hint Display */}
      <AnimatePresence>
        {showHint && currentExercise.hint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity="info" 
              icon={<Lightbulb />}
              sx={{ mb: 2 }}
            >
              <strong>تلميح:</strong> {currentExercise.hint}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
            }}
          >
            <Card sx={{ p: 3, textAlign: 'center', minWidth: 300 }}>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: lastResult.isCorrect ? [0, 10, -10, 0] : 0
                }}
                transition={{ duration: 0.6 }}
              >
                {lastResult.isCorrect ? (
                  <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                ) : (
                  <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                )}
              </motion.div>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {lastResult.isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
              </Typography>
              
              {!lastResult.isCorrect && (
                <Typography variant="body1" color="text.secondary">
                  الإجابة الصحيحة: {lastResult.correctAnswer}
                </Typography>
              )}
              
              {lastResult.points && (
                <Chip 
                  icon={<EmojiEvents />}
                  label={`+${lastResult.points} نقطة`}
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <Dialog open={exitDialog} onClose={() => setExitDialog(false)}>
        <DialogTitle>إنهاء الجلسة</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من رغبتك في إنهاء الجلسة؟ سيتم حفظ تقدمك الحالي.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExitDialog(false)}>
            متابعة الجلسة
          </Button>
          <Button onClick={handleConfirmExit} color="error" variant="contained">
            إنهاء الجلسة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingSession;
