/**
 * Socket Service for ICSHD GENIUSES Frontend
 * Handles real-time communication with the backend
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔴 Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔴 Socket reconnection failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  // Event emission methods
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Event listening methods
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      if (event) {
        this.socket.removeAllListeners(event);
      } else {
        this.socket.removeAllListeners();
      }
    }
  }

  // User room management
  joinUserRoom(userId, userType) {
    this.emit('join_room', { userId, userType });
  }

  leaveUserRoom(userId, userType) {
    this.emit('leave_room', { userId, userType });
  }

  // Session-specific methods
  joinSessionRoom(sessionId) {
    this.emit('join_session', { sessionId });
  }

  leaveSessionRoom(sessionId) {
    this.emit('leave_session', { sessionId });
  }

  sendSessionHeartbeat(sessionId) {
    this.emit('session_heartbeat', { sessionId, timestamp: Date.now() });
  }

  // Trainer monitoring methods
  joinTrainerMonitor(trainerId) {
    this.emit('join_trainer_monitor', { trainerId });
  }

  monitorStudentSession(sessionId, trainerId) {
    this.emit('monitor_student_session', { sessionId, trainerId });
  }

  stopMonitoringSession(sessionId) {
    this.emit('stop_monitoring_session', { sessionId });
  }

  // Student session events
  notifyExerciseStart(sessionId, exerciseIndex) {
    this.emit('exercise_started', { sessionId, exerciseIndex, timestamp: Date.now() });
  }

  notifyAnswerSubmitted(sessionId, exerciseIndex, isCorrect, timeSpent) {
    this.emit('answer_submitted', {
      sessionId,
      exerciseIndex,
      isCorrect,
      timeSpent,
      timestamp: Date.now()
    });
  }

  notifyExerciseSkipped(sessionId, exerciseIndex, reason) {
    this.emit('exercise_skipped', {
      sessionId,
      exerciseIndex,
      reason,
      timestamp: Date.now()
    });
  }

  notifyHintRequested(sessionId, exerciseIndex, hintIndex) {
    this.emit('hint_requested', {
      sessionId,
      exerciseIndex,
      hintIndex,
      timestamp: Date.now()
    });
  }

  // Session control events
  requestSessionPause(sessionId, reason) {
    this.emit('request_session_pause', { sessionId, reason });
  }

  requestSessionResume(sessionId) {
    this.emit('request_session_resume', { sessionId });
  }

  requestSessionEnd(sessionId, reason) {
    this.emit('request_session_end', { sessionId, reason });
  }

  // Trainer intervention events
  sendTrainerMessage(sessionId, message, type = 'info') {
    this.emit('trainer_message', {
      sessionId,
      message,
      type,
      timestamp: Date.now()
    });
  }

  sendTrainerHint(sessionId, hint) {
    this.emit('trainer_hint', {
      sessionId,
      hint,
      timestamp: Date.now()
    });
  }

  adjustSessionDifficulty(sessionId, adjustment) {
    this.emit('adjust_difficulty', {
      sessionId,
      adjustment,
      timestamp: Date.now()
    });
  }

  // Notification events
  sendNotification(userId, notification) {
    this.emit('send_notification', {
      userId,
      notification,
      timestamp: Date.now()
    });
  }

  markNotificationRead(notificationId) {
    this.emit('notification_read', { notificationId });
  }

  // Achievement events
  notifyAchievementUnlocked(userId, achievement) {
    this.emit('achievement_unlocked', {
      userId,
      achievement,
      timestamp: Date.now()
    });
  }

  // Promotion events
  notifyPromotionAvailable(studentId, curriculum, level) {
    this.emit('promotion_available', {
      studentId,
      curriculum,
      level,
      timestamp: Date.now()
    });
  }

  notifyPromotionCompleted(studentId, curriculum, fromLevel, toLevel) {
    this.emit('promotion_completed', {
      studentId,
      curriculum,
      fromLevel,
      toLevel,
      timestamp: Date.now()
    });
  }

  // Admin events
  broadcastSystemMessage(message, type = 'info') {
    this.emit('system_broadcast', {
      message,
      type,
      timestamp: Date.now()
    });
  }

  notifySystemMaintenance(maintenanceInfo) {
    this.emit('system_maintenance', {
      ...maintenanceInfo,
      timestamp: Date.now()
    });
  }

  // Utility methods
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }

  // Event handler helpers
  onSessionEvent(event, callback) {
    const events = [
      'sessionCreated',
      'sessionStarted',
      'sessionPaused',
      'sessionResumed',
      'sessionCompleted',
      'sessionTimeout',
      'exerciseViewed',
      'answerSubmitted',
      'exerciseSkipped',
      'hintProvided',
      'sessionError'
    ];

    if (events.includes(event)) {
      this.on(event, callback);
    } else {
      console.warn('Unknown session event:', event);
    }
  }

  onTrainerEvent(event, callback) {
    const events = [
      'studentSessionStarted',
      'studentProgress',
      'studentSessionPaused',
      'studentSessionResumed',
      'studentSessionCompleted',
      'studentNeedsHelp',
      'promotionRequest'
    ];

    if (events.includes(event)) {
      this.on(event, callback);
    } else {
      console.warn('Unknown trainer event:', event);
    }
  }

  onSystemEvent(event, callback) {
    const events = [
      'systemMessage',
      'maintenanceNotice',
      'serverRestart',
      'newAnnouncement',
      'systemUpdate'
    ];

    if (events.includes(event)) {
      this.on(event, callback);
    } else {
      console.warn('Unknown system event:', event);
    }
  }

  // Cleanup method
  cleanup() {
    this.removeAllListeners();
    this.disconnect();
  }
}

// Create and export singleton instance
export const socketService = new SocketService();
export default socketService;
