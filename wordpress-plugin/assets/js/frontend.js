/**
 * ICSHD GENIUSES WordPress Plugin - Frontend JavaScript
 */

(function($) {
    'use strict';

    // Global ICSHD GENIUSES object
    window.ICSHD_GENIUSES = {
        config: window.icshd_geniuses_config || {},
        currentUser: null,
        currentSession: null,
        timer: null,
        
        // Initialize the plugin
        init: function() {
            this.bindEvents();
            this.checkAuthStatus();
            this.initializeShortcodes();
            this.setupNotifications();
        },
        
        // Bind event listeners
        bindEvents: function() {
            $(document).on('submit', '.icshd-login-form', this.handleLogin.bind(this));
            $(document).on('click', '.icshd-logout-btn', this.handleLogout.bind(this));
            $(document).on('submit', '.icshd-exercise-form', this.handleExerciseSubmit.bind(this));
            $(document).on('click', '.icshd-start-session', this.startSession.bind(this));
            $(document).on('click', '.icshd-end-session', this.endSession.bind(this));
            $(document).on('click', '.icshd-skip-exercise', this.skipExercise.bind(this));
            $(document).on('click', '.icshd-hint-btn', this.requestHint.bind(this));
            $(document).on('keypress', '.icshd-exercise-input', this.handleKeyPress.bind(this));
            
            // Auto-save progress
            setInterval(this.autoSave.bind(this), 30000); // Every 30 seconds
        },
        
        // Check authentication status
        checkAuthStatus: function() {
            if (!this.config.ajax_url) return;
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_check_auth',
                    nonce: this.config.nonce
                },
                success: function(response) {
                    if (response.success && response.data.user) {
                        this.currentUser = response.data.user;
                        this.updateUserInterface();
                    }
                }.bind(this)
            });
        },
        
        // Handle login form submission
        handleLogin: function(e) {
            e.preventDefault();
            
            const $form = $(e.target);
            const $submitBtn = $form.find('button[type="submit"]');
            const originalText = $submitBtn.text();
            
            // Show loading state
            $submitBtn.prop('disabled', true).text(this.config.strings.logging_in || 'Logging in...');
            this.clearFormErrors($form);
            
            const formData = {
                action: 'icshd_login',
                nonce: this.config.nonce,
                username: $form.find('input[name="username"]').val(),
                password: $form.find('input[name="password"]').val()
            };
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        this.currentUser = response.data.user;
                        this.showNotification(response.data.message, 'success');
                        this.updateUserInterface();
                        
                        // Redirect if specified
                        if (response.data.redirect_url) {
                            window.location.href = response.data.redirect_url;
                        } else {
                            // Reload the page to show authenticated content
                            window.location.reload();
                        }
                    } else {
                        this.showFormError($form, response.data);
                    }
                }.bind(this),
                error: function() {
                    this.showFormError($form, this.config.strings.login_error || 'Login failed. Please try again.');
                }.bind(this),
                complete: function() {
                    $submitBtn.prop('disabled', false).text(originalText);
                }
            });
        },
        
        // Handle logout
        handleLogout: function(e) {
            e.preventDefault();
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_logout',
                    nonce: this.config.nonce
                },
                success: function(response) {
                    if (response.success) {
                        this.currentUser = null;
                        this.currentSession = null;
                        this.showNotification(response.data.message, 'success');
                        window.location.reload();
                    }
                }.bind(this)
            });
        },
        
        // Start a new training session
        startSession: function(e) {
            e.preventDefault();
            
            const $btn = $(e.target);
            const curriculum = $btn.data('curriculum') || this.config.default_curriculum;
            const level = $btn.data('level') || 1;
            
            $btn.prop('disabled', true).text(this.config.strings.starting_session || 'Starting...');
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_start_session',
                    nonce: this.config.nonce,
                    curriculum: curriculum,
                    level: level
                },
                success: function(response) {
                    if (response.success) {
                        this.currentSession = response.data.session;
                        this.loadExercise(response.data.exercise);
                        this.startTimer();
                        this.showNotification(this.config.strings.session_started || 'Session started!', 'success');
                    } else {
                        this.showNotification(response.data, 'error');
                    }
                }.bind(this),
                error: function() {
                    this.showNotification(this.config.strings.session_error || 'Failed to start session.', 'error');
                }.bind(this),
                complete: function() {
                    $btn.prop('disabled', false).text($btn.data('original-text') || 'Start Session');
                }
            });
        },
        
        // End current session
        endSession: function(e) {
            e.preventDefault();
            
            if (!this.currentSession) return;
            
            if (!confirm(this.config.strings.confirm_end_session || 'Are you sure you want to end this session?')) {
                return;
            }
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_end_session',
                    nonce: this.config.nonce,
                    session_id: this.currentSession.id
                },
                success: function(response) {
                    if (response.success) {
                        this.stopTimer();
                        this.currentSession = null;
                        this.showSessionResults(response.data.results);
                        this.showNotification(this.config.strings.session_ended || 'Session completed!', 'success');
                    }
                }.bind(this)
            });
        },
        
        // Handle exercise submission
        handleExerciseSubmit: function(e) {
            e.preventDefault();
            
            if (!this.currentSession) return;
            
            const $form = $(e.target);
            const $input = $form.find('.icshd-exercise-input');
            const answer = $input.val().trim();
            
            if (!answer) {
                $input.focus();
                return;
            }
            
            const startTime = $form.data('start-time') || Date.now();
            const timeSpent = Date.now() - startTime;
            
            $form.find('button').prop('disabled', true);
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_submit_answer',
                    nonce: this.config.nonce,
                    session_id: this.currentSession.id,
                    exercise_id: $form.data('exercise-id'),
                    answer: answer,
                    time_spent: timeSpent
                },
                success: function(response) {
                    if (response.success) {
                        this.showAnswerFeedback(response.data.correct, response.data.feedback);
                        
                        setTimeout(function() {
                            if (response.data.next_exercise) {
                                this.loadExercise(response.data.next_exercise);
                            } else {
                                this.endSession();
                            }
                        }.bind(this), 2000);
                    }
                }.bind(this),
                complete: function() {
                    $form.find('button').prop('disabled', false);
                }
            });
        },
        
        // Skip current exercise
        skipExercise: function(e) {
            e.preventDefault();
            
            if (!this.currentSession) return;
            
            const $form = $('.icshd-exercise-form');
            const exerciseId = $form.data('exercise-id');
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_skip_exercise',
                    nonce: this.config.nonce,
                    session_id: this.currentSession.id,
                    exercise_id: exerciseId
                },
                success: function(response) {
                    if (response.success && response.data.next_exercise) {
                        this.loadExercise(response.data.next_exercise);
                    }
                }.bind(this)
            });
        },
        
        // Request hint for current exercise
        requestHint: function(e) {
            e.preventDefault();
            
            if (!this.currentSession) return;
            
            const $form = $('.icshd-exercise-form');
            const exerciseId = $form.data('exercise-id');
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_get_hint',
                    nonce: this.config.nonce,
                    session_id: this.currentSession.id,
                    exercise_id: exerciseId
                },
                success: function(response) {
                    if (response.success) {
                        this.showHint(response.data.hint);
                    }
                }.bind(this)
            });
        },
        
        // Handle key press in exercise input
        handleKeyPress: function(e) {
            if (e.which === 13) { // Enter key
                $(e.target).closest('form').submit();
            }
        },
        
        // Load and display exercise
        loadExercise: function(exercise) {
            const $container = $('.icshd-exercise-container');
            
            if (!$container.length) return;
            
            const exerciseHtml = this.buildExerciseHtml(exercise);
            $container.html(exerciseHtml).addClass('icshd-fade-in');
            
            // Focus on input
            setTimeout(function() {
                $('.icshd-exercise-input').focus();
            }, 100);
            
            // Store start time
            $('.icshd-exercise-form').data('start-time', Date.now());
        },
        
        // Build exercise HTML
        buildExerciseHtml: function(exercise) {
            return `
                <div class="icshd-exercise">
                    <div class="icshd-exercise-question">${exercise.question}</div>
                    <form class="icshd-exercise-form" data-exercise-id="${exercise.id}">
                        <input type="text" class="icshd-exercise-input" placeholder="${this.config.strings.enter_answer || 'Enter your answer'}" autocomplete="off" />
                        <div class="icshd-exercise-buttons">
                            <button type="submit" class="icshd-btn icshd-btn-primary">
                                ${this.config.strings.submit || 'Submit'}
                            </button>
                            <button type="button" class="icshd-btn icshd-btn-secondary icshd-skip-exercise">
                                ${this.config.strings.skip || 'Skip'}
                            </button>
                            <button type="button" class="icshd-btn icshd-btn-secondary icshd-hint-btn">
                                ${this.config.strings.hint || 'Hint'}
                            </button>
                        </div>
                    </form>
                </div>
            `;
        },
        
        // Show answer feedback
        showAnswerFeedback: function(correct, feedback) {
            const $container = $('.icshd-exercise');
            const feedbackClass = correct ? 'success' : 'error';
            const icon = correct ? '✓' : '✗';
            
            $container.append(`
                <div class="icshd-feedback icshd-feedback-${feedbackClass}">
                    <span class="icshd-feedback-icon">${icon}</span>
                    <span class="icshd-feedback-text">${feedback}</span>
                </div>
            `);
            
            // Disable form
            $container.find('input, button').prop('disabled', true);
        },
        
        // Show hint
        showHint: function(hint) {
            const $container = $('.icshd-exercise');
            
            if ($container.find('.icshd-hint').length) return;
            
            $container.append(`
                <div class="icshd-hint">
                    <strong>${this.config.strings.hint || 'Hint'}:</strong> ${hint}
                </div>
            `);
        },
        
        // Start session timer
        startTimer: function() {
            if (this.timer) {
                clearInterval(this.timer);
            }
            
            let seconds = 0;
            const $timer = $('.icshd-timer');
            
            this.timer = setInterval(function() {
                seconds++;
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                
                if ($timer.length) {
                    $timer.text(timeString);
                }
            }, 1000);
        },
        
        // Stop session timer
        stopTimer: function() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        
        // Show session results
        showSessionResults: function(results) {
            const $container = $('.icshd-session-container');
            
            const resultsHtml = `
                <div class="icshd-session-results">
                    <h3>${this.config.strings.session_complete || 'Session Complete!'}</h3>
                    <div class="icshd-results-stats">
                        <div class="icshd-stat">
                            <span class="icshd-stat-number">${results.total_exercises}</span>
                            <span class="icshd-stat-label">${this.config.strings.total_exercises || 'Total Exercises'}</span>
                        </div>
                        <div class="icshd-stat">
                            <span class="icshd-stat-number">${results.correct_answers}</span>
                            <span class="icshd-stat-label">${this.config.strings.correct_answers || 'Correct'}</span>
                        </div>
                        <div class="icshd-stat">
                            <span class="icshd-stat-number">${Math.round(results.accuracy)}%</span>
                            <span class="icshd-stat-label">${this.config.strings.accuracy || 'Accuracy'}</span>
                        </div>
                        <div class="icshd-stat">
                            <span class="icshd-stat-number">${results.average_time}s</span>
                            <span class="icshd-stat-label">${this.config.strings.avg_time || 'Avg Time'}</span>
                        </div>
                    </div>
                    <div class="icshd-results-actions">
                        <button type="button" class="icshd-btn icshd-btn-primary icshd-start-session">
                            ${this.config.strings.start_new_session || 'Start New Session'}
                        </button>
                        <a href="${this.config.progress_url || '#'}" class="icshd-btn icshd-btn-secondary">
                            ${this.config.strings.view_progress || 'View Progress'}
                        </a>
                    </div>
                </div>
            `;
            
            $container.html(resultsHtml);
        },
        
        // Update user interface based on authentication
        updateUserInterface: function() {
            if (this.currentUser) {
                $('.icshd-logged-out').hide();
                $('.icshd-logged-in').show();
                $('.icshd-user-name').text(this.currentUser.display_name);
                $('.icshd-user-role').text(this.currentUser.geniuses_role);
            } else {
                $('.icshd-logged-out').show();
                $('.icshd-logged-in').hide();
            }
        },
        
        // Initialize shortcodes
        initializeShortcodes: function() {
            // Initialize React components for shortcodes
            $('.icshd-geniuses-app[data-component]').each(function() {
                const $element = $(this);
                const component = $element.data('component');
                const props = $element.data('props') || {};
                
                // This would initialize React components
                // For now, we'll just add a placeholder
                if (typeof window.ICSHD_REACT !== 'undefined') {
                    window.ICSHD_REACT.render(component, this, props);
                }
            });
        },
        
        // Auto-save progress
        autoSave: function() {
            if (!this.currentSession) return;
            
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'icshd_auto_save',
                    nonce: this.config.nonce,
                    session_id: this.currentSession.id
                },
                success: function(response) {
                    if (response.success) {
                        console.log('Progress auto-saved');
                    }
                }
            });
        },
        
        // Notification system
        setupNotifications: function() {
            // Create notification container if it doesn't exist
            if (!$('#icshd-notifications').length) {
                $('body').append('<div id="icshd-notifications"></div>');
            }
        },
        
        showNotification: function(message, type = 'info', duration = 5000) {
            const $container = $('#icshd-notifications');
            const id = 'notification-' + Date.now();
            
            const $notification = $(`
                <div id="${id}" class="icshd-notification ${type}">
                    ${message}
                </div>
            `);
            
            $container.append($notification);
            
            // Auto-remove after duration
            setTimeout(function() {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, duration);
            
            // Click to dismiss
            $notification.click(function() {
                $(this).fadeOut(300, function() {
                    $(this).remove();
                });
            });
        },
        
        // Form error handling
        showFormError: function($form, message) {
            this.clearFormErrors($form);
            
            const $errorDiv = $('<div class="icshd-form-error">' + message + '</div>');
            $form.prepend($errorDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(function() {
                $errorDiv.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        },
        
        clearFormErrors: function($form) {
            $form.find('.icshd-form-error').remove();
            $form.find('.icshd-form-group').removeClass('error');
        },
        
        // Utility functions
        formatTime: function(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },
        
        formatNumber: function(number) {
            return new Intl.NumberFormat().format(number);
        },
        
        // API helper
        apiCall: function(action, data = {}, options = {}) {
            const defaultOptions = {
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: action,
                    nonce: this.config.nonce,
                    ...data
                }
            };
            
            return $.ajax({...defaultOptions, ...options});
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        ICSHD_GENIUSES.init();
    });
    
    // Handle page visibility changes (pause/resume)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden, pause timer if running
            if (ICSHD_GENIUSES.timer && ICSHD_GENIUSES.currentSession) {
                ICSHD_GENIUSES.apiCall('icshd_pause_session', {
                    session_id: ICSHD_GENIUSES.currentSession.id
                });
            }
        } else {
            // Page is visible, resume timer if session exists
            if (ICSHD_GENIUSES.currentSession) {
                ICSHD_GENIUSES.apiCall('icshd_resume_session', {
                    session_id: ICSHD_GENIUSES.currentSession.id
                });
            }
        }
    });
    
    // Handle beforeunload (warn about unsaved progress)
    window.addEventListener('beforeunload', function(e) {
        if (ICSHD_GENIUSES.currentSession) {
            const message = ICSHD_GENIUSES.config.strings.unsaved_progress || 
                          'You have an active session. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    });

})(jQuery);
