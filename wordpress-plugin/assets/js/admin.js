/**
 * ICSHD GENIUSES WordPress Plugin - Admin JavaScript
 */

(function($) {
    'use strict';

    // Global admin object
    window.ICSHD_ADMIN = {
        config: window.icshd_admin_config || {},
        
        init: function() {
            this.bindEvents();
            this.initializeComponents();
            this.loadDashboardData();
        },
        
        bindEvents: function() {
            // Connection test
            $(document).on('click', '.icshd-test-connection', this.testConnection.bind(this));
            
            // User sync actions
            $(document).on('click', '.icshd-sync-all-users', this.syncAllUsers.bind(this));
            $(document).on('click', '.icshd-sync-single-user', this.syncSingleUser.bind(this));
            
            // Settings actions
            $(document).on('click', '.icshd-generate-jwt', this.generateJWTSecret.bind(this));
            $(document).on('click', '.icshd-clear-cache', this.clearCache.bind(this));
            $(document).on('click', '.icshd-export-settings', this.exportSettings.bind(this));
            $(document).on('change', '.icshd-import-file', this.importSettings.bind(this));
            
            // Report actions
            $(document).on('click', '.icshd-generate-report', this.generateReport.bind(this));
            $(document).on('click', '.icshd-preview-report', this.previewReport.bind(this));
            $(document).on('click', '.icshd-download-report', this.downloadReport.bind(this));
            
            // Modal actions
            $(document).on('click', '.icshd-modal-close, .icshd-modal-backdrop', this.closeModal.bind(this));
            $(document).on('click', '.icshd-open-modal', this.openModal.bind(this));
            
            // Form validation
            $(document).on('submit', '.icshd-admin-form', this.validateForm.bind(this));
            
            // Auto-refresh dashboard
            setInterval(this.refreshDashboard.bind(this), 300000); // Every 5 minutes
        },
        
        initializeComponents: function() {
            // Initialize tooltips
            this.initTooltips();
            
            // Initialize charts if available
            this.initCharts();
            
            // Initialize data tables
            this.initDataTables();
            
            // Set up auto-save for settings
            this.setupAutoSave();
        },
        
        loadDashboardData: function() {
            this.updateConnectionStatus();
            this.loadQuickStats();
            this.loadRecentActivity();
        },
        
        // Connection testing
        testConnection: function(e) {
            e.preventDefault();
            
            const $button = $(e.target);
            const $status = $('.icshd-connection-status');
            const originalText = $button.text();
            
            $button.prop('disabled', true).text(this.config.strings.testing || 'Testing...');
            $status.removeClass('connected disconnected').addClass('testing')
                   .html('<span class="icshd-loading-spinner"></span>' + (this.config.strings.testing_connection || 'Testing connection...'));
            
            this.apiCall('icshd_test_connection', {
                api_url: $('#api_base_url').val()
            })
            .done(function(response) {
                if (response.success) {
                    $status.removeClass('testing').addClass('connected')
                           .html('<span class="dashicons dashicons-yes-alt"></span>' + response.data.message);
                    this.showNotification(response.data.message, 'success');
                } else {
                    $status.removeClass('testing').addClass('disconnected')
                           .html('<span class="dashicons dashicons-dismiss"></span>' + response.data);
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                $status.removeClass('testing').addClass('disconnected')
                       .html('<span class="dashicons dashicons-dismiss"></span>' + (this.config.strings.connection_failed || 'Connection failed'));
                this.showNotification(this.config.strings.connection_failed || 'Connection test failed', 'error');
            }.bind(this))
            .always(function() {
                $button.prop('disabled', false).text(originalText);
            });
        },
        
        updateConnectionStatus: function() {
            this.apiCall('icshd_get_connection_status')
            .done(function(response) {
                if (response.success) {
                    $('.icshd-api-status').removeClass('error').addClass('success')
                                         .find('.icshd-status-value').text(this.config.strings.connected || 'Connected');
                } else {
                    $('.icshd-api-status').removeClass('success').addClass('error')
                                         .find('.icshd-status-value').text(this.config.strings.disconnected || 'Disconnected');
                }
            }.bind(this));
        },
        
        // User synchronization
        syncAllUsers: function(e) {
            e.preventDefault();
            
            if (!confirm(this.config.strings.confirm_sync_all || 'Are you sure you want to sync all users? This may take a while.')) {
                return;
            }
            
            const $button = $(e.target);
            const originalText = $button.text();
            
            $button.prop('disabled', true).text(this.config.strings.syncing || 'Syncing...');
            
            this.apiCall('icshd_sync_all_users')
            .done(function(response) {
                if (response.success) {
                    this.showNotification(response.data.message, 'success');
                    this.refreshUserTable();
                    this.loadQuickStats();
                } else {
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                this.showNotification(this.config.strings.sync_failed || 'Sync failed', 'error');
            }.bind(this))
            .always(function() {
                $button.prop('disabled', false).text(originalText);
            });
        },
        
        syncSingleUser: function(e) {
            e.preventDefault();
            
            const $button = $(e.target);
            const userId = $button.data('user-id');
            const originalText = $button.text();
            
            $button.prop('disabled', true).text(this.config.strings.syncing || 'Syncing...');
            
            this.apiCall('icshd_sync_single_user', { user_id: userId })
            .done(function(response) {
                if (response.success) {
                    this.showNotification(response.data.message, 'success');
                    this.refreshUserRow(userId);
                } else {
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                this.showNotification(this.config.strings.sync_failed || 'Sync failed', 'error');
            }.bind(this))
            .always(function() {
                $button.prop('disabled', false).text(originalText);
            });
        },
        
        // Settings management
        generateJWTSecret: function(e) {
            e.preventDefault();
            
            const length = 32;
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let secret = '';
            
            for (let i = 0; i < length; i++) {
                secret += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            
            $('#jwt_secret').val(secret);
            this.showNotification(this.config.strings.jwt_generated || 'New JWT secret generated', 'success');
        },
        
        clearCache: function(e) {
            e.preventDefault();
            
            const $button = $(e.target);
            const originalText = $button.text();
            
            $button.prop('disabled', true).text(this.config.strings.clearing || 'Clearing...');
            
            this.apiCall('icshd_clear_cache')
            .done(function(response) {
                if (response.success) {
                    this.showNotification(response.data.message, 'success');
                } else {
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                this.showNotification(this.config.strings.clear_failed || 'Failed to clear cache', 'error');
            }.bind(this))
            .always(function() {
                $button.prop('disabled', false).text(originalText);
            });
        },
        
        exportSettings: function(e) {
            e.preventDefault();
            
            this.apiCall('icshd_export_settings')
            .done(function(response) {
                if (response.success) {
                    const blob = new Blob([JSON.stringify(response.data, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'icshd-geniuses-settings.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.showNotification(this.config.strings.settings_exported || 'Settings exported successfully', 'success');
                } else {
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                this.showNotification(this.config.strings.export_failed || 'Export failed', 'error');
            }.bind(this));
        },
        
        importSettings: function(e) {
            const file = e.target.files[0];
            
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const settings = JSON.parse(e.target.result);
                    
                    this.apiCall('icshd_import_settings', { settings: JSON.stringify(settings) })
                    .done(function(response) {
                        if (response.success) {
                            this.showNotification(response.data.message, 'success');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        } else {
                            this.showNotification(response.data, 'error');
                        }
                    }.bind(this))
                    .fail(function() {
                        this.showNotification(this.config.strings.import_failed || 'Import failed', 'error');
                    }.bind(this));
                } catch (error) {
                    this.showNotification(this.config.strings.invalid_json || 'Invalid JSON file', 'error');
                }
            }.bind(this);
            
            reader.readAsText(file);
        },
        
        // Report generation
        generateReport: function(e) {
            e.preventDefault();
            
            const $form = $(e.target).closest('form');
            const formData = $form.serialize();
            const $button = $(e.target);
            const originalText = $button.text();
            
            $button.prop('disabled', true).text(this.config.strings.generating || 'Generating...');
            
            this.apiCall('icshd_generate_report', formData)
            .done(function(response) {
                if (response.success) {
                    this.showNotification(response.data.message, 'success');
                    if (response.data.download_url) {
                        window.open(response.data.download_url, '_blank');
                    }
                } else {
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                this.showNotification(this.config.strings.report_failed || 'Report generation failed', 'error');
            }.bind(this))
            .always(function() {
                $button.prop('disabled', false).text(originalText);
            });
        },
        
        previewReport: function(e) {
            e.preventDefault();
            
            const $form = $(e.target).closest('form');
            const formData = $form.serialize();
            
            this.apiCall('icshd_preview_report', formData)
            .done(function(response) {
                if (response.success) {
                    this.showModal('report-preview', response.data.html);
                } else {
                    this.showNotification(response.data, 'error');
                }
            }.bind(this))
            .fail(function() {
                this.showNotification(this.config.strings.preview_failed || 'Preview failed', 'error');
            }.bind(this));
        },
        
        downloadReport: function(e) {
            e.preventDefault();
            
            const reportId = $(e.target).data('report-id');
            const format = $(e.target).data('format') || 'pdf';
            
            this.apiCall('icshd_download_report', { report_id: reportId, format: format }, 'blob')
            .done(function(blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `geniuses-report-${reportId}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .fail(function() {
                this.showNotification(this.config.strings.download_failed || 'Download failed', 'error');
            }.bind(this));
        },
        
        // Dashboard data loading
        loadQuickStats: function() {
            this.apiCall('icshd_get_quick_stats')
            .done(function(response) {
                if (response.success) {
                    this.updateStatsDisplay(response.data);
                }
            }.bind(this));
        },
        
        loadRecentActivity: function() {
            this.apiCall('icshd_get_recent_activity')
            .done(function(response) {
                if (response.success) {
                    this.updateActivityLog(response.data);
                }
            }.bind(this));
        },
        
        updateStatsDisplay: function(stats) {
            $('.icshd-total-users .icshd-status-value').text(this.formatNumber(stats.total_users || 0));
            $('.icshd-active-sessions .icshd-status-value').text(this.formatNumber(stats.active_sessions || 0));
            $('.icshd-completed-exercises .icshd-status-value').text(this.formatNumber(stats.completed_exercises || 0));
            $('.icshd-avg-performance .icshd-status-value').text((stats.avg_performance || 0) + '%');
        },
        
        updateActivityLog: function(activities) {
            const $log = $('.icshd-activity-log');
            $log.empty();
            
            if (activities.length === 0) {
                $log.append('<div class="icshd-no-activity">' + (this.config.strings.no_activity || 'No recent activity') + '</div>');
                return;
            }
            
            activities.forEach(function(activity) {
                const $item = $(`
                    <div class="icshd-activity-item">
                        <div class="icshd-activity-icon ${activity.type}">
                            <span class="dashicons ${this.getActivityIcon(activity.type)}"></span>
                        </div>
                        <div class="icshd-activity-content">
                            <div class="icshd-activity-title">${activity.title}</div>
                            <div class="icshd-activity-description">${activity.description}</div>
                            <div class="icshd-activity-time">${this.formatTime(activity.timestamp)}</div>
                        </div>
                    </div>
                `);
                $log.append($item);
            }.bind(this));
        },
        
        // Modal management
        showModal: function(modalId, content) {
            let $modal = $('#' + modalId);
            
            if (!$modal.length) {
                $modal = $(`
                    <div id="${modalId}" class="icshd-modal">
                        <div class="icshd-modal-backdrop"></div>
                        <div class="icshd-modal-content">
                            <div class="icshd-modal-header">
                                <h2>${this.config.strings.modal_title || 'Modal'}</h2>
                                <button class="icshd-modal-close">&times;</button>
                            </div>
                            <div class="icshd-modal-body"></div>
                        </div>
                    </div>
                `);
                $('body').append($modal);
            }
            
            $modal.find('.icshd-modal-body').html(content);
            $modal.show();
            
            // Focus management
            $modal.find('.icshd-modal-close').focus();
        },
        
        closeModal: function(e) {
            if ($(e.target).hasClass('icshd-modal-close') || $(e.target).hasClass('icshd-modal-backdrop')) {
                $(e.target).closest('.icshd-modal').hide();
            }
        },
        
        openModal: function(e) {
            e.preventDefault();
            const modalId = $(e.target).data('modal');
            const content = $(e.target).data('content') || '';
            this.showModal(modalId, content);
        },
        
        // Form validation
        validateForm: function(e) {
            const $form = $(e.target);
            let isValid = true;
            
            // Clear previous errors
            $form.find('.icshd-field-error').remove();
            $form.find('.icshd-field').removeClass('error');
            
            // Validate required fields
            $form.find('[required]').each(function() {
                const $field = $(this);
                const value = $field.val().trim();
                
                if (!value) {
                    this.showFieldError($field, this.config.strings.field_required || 'This field is required');
                    isValid = false;
                }
            }.bind(this));
            
            // Validate URLs
            $form.find('input[type="url"]').each(function() {
                const $field = $(this);
                const value = $field.val().trim();
                
                if (value && !this.isValidUrl(value)) {
                    this.showFieldError($field, this.config.strings.invalid_url || 'Please enter a valid URL');
                    isValid = false;
                }
            }.bind(this));
            
            // Validate emails
            $form.find('input[type="email"]').each(function() {
                const $field = $(this);
                const value = $field.val().trim();
                
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError($field, this.config.strings.invalid_email || 'Please enter a valid email address');
                    isValid = false;
                }
            }.bind(this));
            
            if (!isValid) {
                e.preventDefault();
                this.showNotification(this.config.strings.form_errors || 'Please correct the errors below', 'error');
            }
        },
        
        showFieldError: function($field, message) {
            $field.addClass('error');
            $field.after(`<div class="icshd-field-error">${message}</div>`);
        },
        
        // Utility functions
        refreshDashboard: function() {
            this.loadQuickStats();
            this.updateConnectionStatus();
        },
        
        refreshUserTable: function() {
            // Reload the user management page if we're on it
            if ($('.icshd-users-page').length) {
                location.reload();
            }
        },
        
        refreshUserRow: function(userId) {
            // Update specific user row
            const $row = $(`.icshd-user-row[data-user-id="${userId}"]`);
            if ($row.length) {
                // Add visual feedback
                $row.addClass('icshd-updated');
                setTimeout(function() {
                    $row.removeClass('icshd-updated');
                }, 2000);
            }
        },
        
        setupAutoSave: function() {
            let timeout;
            
            $('.icshd-auto-save').on('input change', function() {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    // Auto-save logic here
                    console.log('Auto-saving...');
                }, 2000);
            });
        },
        
        initTooltips: function() {
            $('[data-tooltip]').each(function() {
                const $element = $(this);
                const tooltip = $element.data('tooltip');
                
                $element.attr('title', tooltip);
            });
        },
        
        initCharts: function() {
            // Initialize charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                $('.icshd-chart').each(function() {
                    const $canvas = $(this);
                    const chartData = $canvas.data('chart');
                    
                    if (chartData) {
                        new Chart($canvas[0], chartData);
                    }
                });
            }
        },
        
        initDataTables: function() {
            // Initialize DataTables if available
            if ($.fn.DataTable) {
                $('.icshd-data-table').DataTable({
                    responsive: true,
                    pageLength: 25,
                    language: {
                        url: this.config.datatables_language_url || ''
                    }
                });
            }
        },
        
        // Notification system
        showNotification: function(message, type = 'info', duration = 5000) {
            const $notification = $(`
                <div class="notice notice-${type} is-dismissible icshd-notification">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">${this.config.strings.dismiss || 'Dismiss'}</span>
                    </button>
                </div>
            `);
            
            $('.icshd-admin-wrap').prepend($notification);
            
            // Auto-remove
            setTimeout(function() {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, duration);
            
            // Manual dismiss
            $notification.find('.notice-dismiss').on('click', function() {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            });
        },
        
        // API helper
        apiCall: function(action, data = {}, responseType = 'json') {
            const requestData = {
                action: action,
                nonce: this.config.nonce,
                ...data
            };
            
            const ajaxOptions = {
                url: this.config.ajax_url,
                type: 'POST',
                data: requestData
            };
            
            if (responseType === 'blob') {
                ajaxOptions.xhrFields = { responseType: 'blob' };
            }
            
            return $.ajax(ajaxOptions);
        },
        
        // Helper functions
        formatNumber: function(number) {
            return new Intl.NumberFormat().format(number);
        },
        
        formatTime: function(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString();
        },
        
        isValidUrl: function(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        },
        
        isValidEmail: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },
        
        getActivityIcon: function(type) {
            const icons = {
                'user_sync': 'dashicons-update',
                'settings_update': 'dashicons-admin-settings',
                'report_generated': 'dashicons-chart-bar',
                'login': 'dashicons-admin-users',
                'error': 'dashicons-warning',
                'success': 'dashicons-yes-alt'
            };
            
            return icons[type] || 'dashicons-admin-generic';
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        ICSHD_ADMIN.init();
    });
    
    // Handle escape key for modals
    $(document).keydown(function(e) {
        if (e.keyCode === 27) { // Escape key
            $('.icshd-modal:visible').hide();
        }
    });

})(jQuery);
