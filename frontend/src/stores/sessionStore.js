/**
 * Session Store for ICSHD GENIUSES
 * Manages training session state and real-time updates
 */

import { create } from 'zustand';
import { sessionAPI } from '../services/api';
import { socketService } from '../services/socketService';
import toast from 'react-hot-toast';

export const useSessionStore = create((set, get) => ({
  // State
  currentSession: null,
  currentExercise: null,
  sessionProgress: {
    current: 0,
    total: 0,
    percentage: 0,
  },
  sessionStats: {
    accuracy: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedQuestions: 0,
    averageTime: 0,
  },
  timeRemaining: 0,
  isSessionActive: false,
  isSessionPaused: false,
  isLoading: false,
  error: null,

  // Socket connection state
  isSocketConnected: false,
  activeSessions: [], // For trainers/admins

  // Actions
  createSession: async (sessionConfig) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionAPI.createSession(sessionConfig);
      const { session, sessionId } = response.data;

      set({
        currentSession: session,
        isSessionActive: true,
        isSessionPaused: false,
        isLoading: false,
        sessionProgress: {
          current: 0,
          total: session.totalQuestions,
          percentage: 0,
        },
        sessionStats: {
          accuracy: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          skippedQuestions: 0,
          averageTime: 0,
        },
        timeRemaining: session.duration,
      });

      // Start session timer
      get().startSessionTimer();

      toast.success('تم إنشاء الجلسة بنجاح');
      return { success: true, sessionId };

    } catch (error) {
      set({ isLoading: false, error: error.message });
      const message = error.response?.data?.message || 'خطأ في إنشاء الجلسة';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  getCurrentExercise: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionAPI.getCurrentExercise(sessionId);
      const data = response.data;

      if (data.completed) {
        set({
          currentExercise: null,
          isSessionActive: false,
          isLoading: false,
        });
        return { completed: true };
      }

      set({
        currentExercise: data.exercise,
        sessionProgress: data.progress,
        timeRemaining: data.session.timeRemaining,
        isLoading: false,
      });

      return { success: true, exercise: data.exercise };

    } catch (error) {
      set({ isLoading: false, error: error.message });
      const message = error.response?.data?.message || 'خطأ في جلب التمرين';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  submitAnswer: async (sessionId, answer, timeSpent) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionAPI.submitAnswer(sessionId, { answer, timeSpent });
      const data = response.data;

      // Update session stats
      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          sessionStats: {
            accuracy: data.accuracy || 0,
            correctAnswers: (currentSession.correctAnswers || 0) + (data.correct ? 1 : 0),
            incorrectAnswers: (currentSession.incorrectAnswers || 0) + (data.correct ? 0 : 1),
            skippedQuestions: currentSession.skippedQuestions || 0,
            averageTime: data.averageTime || 0,
          },
        });
      }

      set({ isLoading: false });

      // Show feedback
      if (data.correct) {
        toast.success('إجابة صحيحة! 🎉');
      } else {
        toast.error('إجابة خاطئة');
      }

      // Check if session is complete
      if (data.sessionComplete) {
        get().completeSession(data.sessionSummary);
      }

      return { success: true, ...data };

    } catch (error) {
      set({ isLoading: false, error: error.message });
      const message = error.response?.data?.message || 'خطأ في إرسال الإجابة';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  skipExercise: async (sessionId, reason = 'student_choice') => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionAPI.skipExercise(sessionId, { reason });
      const data = response.data;

      // Update session stats
      const currentSession = get().currentSession;
      if (currentSession) {
        set({
          sessionStats: {
            ...get().sessionStats,
            skippedQuestions: (currentSession.skippedQuestions || 0) + 1,
          },
        });
      }

      set({ isLoading: false });

      toast.info('تم تخطي التمرين');

      // Check if session is complete
      if (data.sessionComplete) {
        get().completeSession(data.sessionSummary);
      }

      return { success: true, ...data };

    } catch (error) {
      set({ isLoading: false, error: error.message });
      const message = error.response?.data?.message || 'خطأ في تخطي التمرين';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  requestHint: async (sessionId, hintIndex = 0) => {
    try {
      const response = await sessionAPI.requestHint(sessionId, { hintIndex });
      const data = response.data;

      toast.success('تم عرض التلميح');
      return { success: true, ...data };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في طلب التلميح';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  pauseSession: async (sessionId, reason = 'student_request') => {
    try {
      const response = await sessionAPI.pauseSession(sessionId, { reason });
      
      set({
        isSessionPaused: true,
        isSessionActive: false,
      });

      // Stop session timer
      get().stopSessionTimer();

      toast.info('تم إيقاف الجلسة مؤقتاً');
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في إيقاف الجلسة';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  resumeSession: async (sessionId) => {
    try {
      const response = await sessionAPI.resumeSession(sessionId);
      const data = response.data;

      set({
        isSessionPaused: false,
        isSessionActive: true,
        timeRemaining: data.timeRemaining,
      });

      // Restart session timer
      get().startSessionTimer();

      toast.success('تم استئناف الجلسة');
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في استئناف الجلسة';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  completeSession: (sessionSummary) => {
    set({
      currentSession: null,
      currentExercise: null,
      isSessionActive: false,
      isSessionPaused: false,
      timeRemaining: 0,
    });

    // Stop session timer
    get().stopSessionTimer();

    // Show completion message
    if (sessionSummary?.result === 'excellent') {
      toast.success('أداء ممتاز! 🌟');
    } else if (sessionSummary?.result === 'good') {
      toast.success('أداء جيد! 👍');
    } else {
      toast.success('تم إنهاء الجلسة');
    }

    return sessionSummary;
  },

  // Timer management
  sessionTimer: null,

  startSessionTimer: () => {
    const timer = setInterval(() => {
      const timeRemaining = get().timeRemaining;
      if (timeRemaining > 0) {
        set({ timeRemaining: timeRemaining - 1 });
      } else {
        // Time's up
        get().stopSessionTimer();
        set({ isSessionActive: false });
        toast.warning('انتهى وقت الجلسة');
      }
    }, 1000);

    set({ sessionTimer: timer });
  },

  stopSessionTimer: () => {
    const timer = get().sessionTimer;
    if (timer) {
      clearInterval(timer);
      set({ sessionTimer: null });
    }
  },

  // Socket event handlers
  initializeSocket: () => {
    socketService.on('sessionCreated', (data) => {
      console.log('Session created:', data);
    });

    socketService.on('exerciseViewed', (data) => {
      console.log('Exercise viewed:', data);
    });

    socketService.on('answerSubmitted', (data) => {
      set({
        sessionProgress: data.progress,
        sessionStats: {
          ...get().sessionStats,
          accuracy: data.accuracy,
        },
      });
    });

    socketService.on('sessionPaused', (data) => {
      set({
        isSessionPaused: true,
        isSessionActive: false,
      });
      get().stopSessionTimer();
    });

    socketService.on('sessionResumed', (data) => {
      set({
        isSessionPaused: false,
        isSessionActive: true,
        timeRemaining: data.timeRemaining,
      });
      get().startSessionTimer();
    });

    socketService.on('sessionCompleted', (data) => {
      get().completeSession(data);
    });

    // For trainers - monitor student sessions
    socketService.on('studentSessionStarted', (data) => {
      const activeSessions = get().activeSessions;
      set({
        activeSessions: [...activeSessions, data],
      });
    });

    socketService.on('studentProgress', (data) => {
      const activeSessions = get().activeSessions.map(session =>
        session.sessionId === data.sessionId
          ? { ...session, ...data }
          : session
      );
      set({ activeSessions });
    });

    socketService.on('studentSessionCompleted', (data) => {
      const activeSessions = get().activeSessions.filter(
        session => session.sessionId !== data.sessionId
      );
      set({ activeSessions });
    });

    set({ isSocketConnected: true });
  },

  disconnectSocket: () => {
    socketService.removeAllListeners();
    set({ isSocketConnected: false });
  },

  // Utility functions
  getSessionStatus: async (sessionId) => {
    try {
      const response = await sessionAPI.getSessionStatus(sessionId);
      return response.data;
    } catch (error) {
      console.error('Error getting session status:', error);
      return null;
    }
  },

  sendHeartbeat: (sessionId) => {
    if (get().isSocketConnected) {
      socketService.emit('session_heartbeat', { sessionId });
    }
  },

  // Reset store
  resetSession: () => {
    get().stopSessionTimer();
    set({
      currentSession: null,
      currentExercise: null,
      sessionProgress: {
        current: 0,
        total: 0,
        percentage: 0,
      },
      sessionStats: {
        accuracy: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedQuestions: 0,
        averageTime: 0,
      },
      timeRemaining: 0,
      isSessionActive: false,
      isSessionPaused: false,
      isLoading: false,
      error: null,
    });
  },

  // Getters
  getFormattedTime: () => {
    const timeRemaining = get().timeRemaining;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  getProgressPercentage: () => {
    const progress = get().sessionProgress;
    return progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  },

  isTimeRunningOut: () => {
    return get().timeRemaining <= 300; // 5 minutes
  },

  canRequestHint: () => {
    const exercise = get().currentExercise;
    return exercise?.allowHints && exercise?.hints?.length > 0;
  },

  canSkipExercise: () => {
    const session = get().currentSession;
    return session?.settings?.allowSkip;
  },
}));
