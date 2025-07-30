<?php
/**
 * Helper Functions for ICSHD GENIUSES WordPress Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get plugin settings
 */
function icshd_geniuses_get_settings() {
    return get_option('icshd_geniuses_settings', array(
        'api_base_url' => 'http://localhost:5000/api',
        'frontend_url' => 'http://localhost:3000',
        'jwt_secret' => wp_generate_password(32, false),
        'enable_sso' => true,
        'default_curriculum' => 'soroban',
        'auto_create_users' => true,
        'allowed_roles' => array('student', 'trainer', 'administrator')
    ));
}

/**
 * Update plugin settings
 */
function icshd_geniuses_update_settings($settings) {
    return update_option('icshd_geniuses_settings', $settings);
}

/**
 * Get user's GENIUSES role
 */
function icshd_geniuses_get_user_role($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }
    
    if (!$user_id) {
        return 'guest';
    }
    
    $role = get_user_meta($user_id, 'icshd_geniuses_role', true);
    
    if (!$role) {
        $user = get_user_by('ID', $user_id);
        if ($user) {
            if (user_can($user, 'manage_options')) {
                $role = 'admin';
            } elseif (user_can($user, 'edit_posts')) {
                $role = 'trainer';
            } else {
                $role = 'student';
            }
            
            // Store the role for future use
            update_user_meta($user_id, 'icshd_geniuses_role', $role);
        }
    }
    
    return $role ?: 'student';
}

/**
 * Check if user has GENIUSES capability
 */
function icshd_geniuses_user_can($capability, $user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }
    
    if (!$user_id) {
        return false;
    }
    
    $user_role = icshd_geniuses_get_user_role($user_id);
    
    $capabilities = array(
        'admin' => array(
            'access_geniuses',
            'manage_students',
            'manage_trainers',
            'create_exercises',
            'view_reports',
            'manage_settings',
            'sync_users'
        ),
        'trainer' => array(
            'access_geniuses',
            'manage_students',
            'create_exercises',
            'view_reports'
        ),
        'student' => array(
            'access_geniuses'
        )
    );
    
    return isset($capabilities[$user_role]) && in_array($capability, $capabilities[$user_role]);
}

/**
 * Get user's GENIUSES profile
 */
function icshd_geniuses_get_user_profile($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }
    
    if (!$user_id) {
        return null;
    }
    
    return array(
        'id' => $user_id,
        'geniuses_user_id' => get_user_meta($user_id, 'icshd_geniuses_user_id', true),
        'role' => icshd_geniuses_get_user_role($user_id),
        'curriculum' => get_user_meta($user_id, 'icshd_geniuses_curriculum', true),
        'level' => get_user_meta($user_id, 'icshd_geniuses_level', true),
        'last_login' => get_user_meta($user_id, 'icshd_geniuses_last_login', true),
        'login_count' => get_user_meta($user_id, 'icshd_geniuses_login_count', true),
        'last_sync' => get_user_meta($user_id, 'icshd_geniuses_last_sync', true)
    );
}

/**
 * Get curriculum display name
 */
function icshd_geniuses_get_curriculum_name($curriculum) {
    $curricula = array(
        'soroban' => __('Soroban (Abacus)', 'icshd-geniuses'),
        'vedic' => __('Vedic Mathematics', 'icshd-geniuses'),
        'logic' => __('Logic & Reasoning', 'icshd-geniuses'),
        'iqgames' => __('IQ Games', 'icshd-geniuses')
    );
    
    return isset($curricula[$curriculum]) ? $curricula[$curriculum] : $curriculum;
}

/**
 * Get level display name
 */
function icshd_geniuses_get_level_name($level) {
    if ($level >= 1 && $level <= 3) {
        return sprintf(__('Beginner Level %d', 'icshd-geniuses'), $level);
    } elseif ($level >= 4 && $level <= 6) {
        return sprintf(__('Intermediate Level %d', 'icshd-geniuses'), $level);
    } elseif ($level >= 7 && $level <= 10) {
        return sprintf(__('Advanced Level %d', 'icshd-geniuses'), $level);
    }
    
    return sprintf(__('Level %d', 'icshd-geniuses'), $level);
}

/**
 * Format time duration
 */
function icshd_geniuses_format_duration($seconds) {
    if ($seconds < 60) {
        return sprintf(__('%d seconds', 'icshd-geniuses'), $seconds);
    } elseif ($seconds < 3600) {
        $minutes = floor($seconds / 60);
        $remaining_seconds = $seconds % 60;
        if ($remaining_seconds > 0) {
            return sprintf(__('%d minutes %d seconds', 'icshd-geniuses'), $minutes, $remaining_seconds);
        } else {
            return sprintf(__('%d minutes', 'icshd-geniuses'), $minutes);
        }
    } else {
        $hours = floor($seconds / 3600);
        $remaining_minutes = floor(($seconds % 3600) / 60);
        if ($remaining_minutes > 0) {
            return sprintf(__('%d hours %d minutes', 'icshd-geniuses'), $hours, $remaining_minutes);
        } else {
            return sprintf(__('%d hours', 'icshd-geniuses'), $hours);
        }
    }
}

/**
 * Format accuracy percentage
 */
function icshd_geniuses_format_accuracy($accuracy) {
    return number_format($accuracy, 1) . '%';
}

/**
 * Get role display name
 */
function icshd_geniuses_get_role_name($role) {
    $roles = array(
        'admin' => __('Administrator', 'icshd-geniuses'),
        'trainer' => __('Trainer', 'icshd-geniuses'),
        'student' => __('Student', 'icshd-geniuses')
    );
    
    return isset($roles[$role]) ? $roles[$role] : $role;
}

/**
 * Check API connection status
 */
function icshd_geniuses_check_api_status() {
    $settings = icshd_geniuses_get_settings();
    
    // Check cached status first
    $cached_status = get_transient('icshd_geniuses_api_status');
    if ($cached_status !== false) {
        return $cached_status;
    }
    
    // Test API connection
    require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-api-client.php';
    $api_client = new ICSHD_Geniuses_API_Client($settings);
    $status = $api_client->test_connection();
    
    // Cache status for 5 minutes
    set_transient('icshd_geniuses_api_status', $status, 5 * MINUTE_IN_SECONDS);
    
    return $status;
}

/**
 * Log GENIUSES activity
 */
function icshd_geniuses_log_activity($action, $details = array(), $user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }
    
    $log_entry = array(
        'timestamp' => current_time('mysql'),
        'user_id' => $user_id,
        'action' => $action,
        'details' => $details,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    );
    
    // Store in WordPress options (for simple logging)
    $logs = get_option('icshd_geniuses_activity_logs', array());
    $logs[] = $log_entry;
    
    // Keep only last 1000 entries
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }
    
    update_option('icshd_geniuses_activity_logs', $logs);
    
    // Also log to WordPress error log if debug is enabled
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('ICSHD GENIUSES Activity: ' . $action . ' - ' . json_encode($details));
    }
}

/**
 * Get activity logs
 */
function icshd_geniuses_get_activity_logs($limit = 50, $user_id = null) {
    $logs = get_option('icshd_geniuses_activity_logs', array());
    
    // Filter by user if specified
    if ($user_id) {
        $logs = array_filter($logs, function($log) use ($user_id) {
            return $log['user_id'] == $user_id;
        });
    }
    
    // Sort by timestamp (newest first)
    usort($logs, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Limit results
    return array_slice($logs, 0, $limit);
}

/**
 * Clear activity logs
 */
function icshd_geniuses_clear_activity_logs() {
    delete_option('icshd_geniuses_activity_logs');
}

/**
 * Get plugin statistics
 */
function icshd_geniuses_get_statistics() {
    global $wpdb;
    
    // Get user counts
    $total_users = $wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->users} u 
        INNER JOIN {$wpdb->usermeta} um ON u.ID = um.user_id 
        WHERE um.meta_key = 'icshd_geniuses_role'
    ");
    
    $students = $wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->usermeta} 
        WHERE meta_key = 'icshd_geniuses_role' AND meta_value = 'student'
    ");
    
    $trainers = $wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->usermeta} 
        WHERE meta_key = 'icshd_geniuses_role' AND meta_value = 'trainer'
    ");
    
    $admins = $wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->usermeta} 
        WHERE meta_key = 'icshd_geniuses_role' AND meta_value = 'admin'
    ");
    
    // Get sync statistics
    $sync_table = $wpdb->prefix . 'icshd_geniuses_user_sync';
    $synced_users = 0;
    $sync_errors = 0;
    
    if ($wpdb->get_var("SHOW TABLES LIKE '$sync_table'") == $sync_table) {
        $synced_users = $wpdb->get_var("SELECT COUNT(*) FROM $sync_table WHERE sync_status = 'success'");
        $sync_errors = $wpdb->get_var("SELECT COUNT(*) FROM $sync_table WHERE sync_status = 'error'");
    }
    
    // Get API status
    $api_status = icshd_geniuses_check_api_status();
    
    return array(
        'users' => array(
            'total' => intval($total_users),
            'students' => intval($students),
            'trainers' => intval($trainers),
            'admins' => intval($admins)
        ),
        'sync' => array(
            'synced' => intval($synced_users),
            'errors' => intval($sync_errors),
            'last_sync' => get_option('icshd_geniuses_last_sync')
        ),
        'api' => $api_status
    );
}

/**
 * Validate curriculum
 */
function icshd_geniuses_validate_curriculum($curriculum) {
    $valid_curricula = array('soroban', 'vedic', 'logic', 'iqgames');
    return in_array($curriculum, $valid_curricula);
}

/**
 * Validate level
 */
function icshd_geniuses_validate_level($level) {
    return is_numeric($level) && $level >= 1 && $level <= 10;
}

/**
 * Validate role
 */
function icshd_geniuses_validate_role($role) {
    $valid_roles = array('admin', 'trainer', 'student');
    return in_array($role, $valid_roles);
}

/**
 * Sanitize settings
 */
function icshd_geniuses_sanitize_settings($settings) {
    $sanitized = array();
    
    // API Base URL
    if (isset($settings['api_base_url'])) {
        $sanitized['api_base_url'] = esc_url_raw($settings['api_base_url']);
    }
    
    // Frontend URL
    if (isset($settings['frontend_url'])) {
        $sanitized['frontend_url'] = esc_url_raw($settings['frontend_url']);
    }
    
    // JWT Secret
    if (isset($settings['jwt_secret'])) {
        $sanitized['jwt_secret'] = sanitize_text_field($settings['jwt_secret']);
    }
    
    // Enable SSO
    if (isset($settings['enable_sso'])) {
        $sanitized['enable_sso'] = (bool) $settings['enable_sso'];
    }
    
    // Default Curriculum
    if (isset($settings['default_curriculum'])) {
        $curriculum = sanitize_text_field($settings['default_curriculum']);
        $sanitized['default_curriculum'] = icshd_geniuses_validate_curriculum($curriculum) ? $curriculum : 'soroban';
    }
    
    // Auto Create Users
    if (isset($settings['auto_create_users'])) {
        $sanitized['auto_create_users'] = (bool) $settings['auto_create_users'];
    }
    
    // Allowed Roles
    if (isset($settings['allowed_roles']) && is_array($settings['allowed_roles'])) {
        $sanitized['allowed_roles'] = array_filter($settings['allowed_roles'], 'icshd_geniuses_validate_role');
    }
    
    return $sanitized;
}

/**
 * Get default settings
 */
function icshd_geniuses_get_default_settings() {
    return array(
        'api_base_url' => 'http://localhost:5000/api',
        'frontend_url' => 'http://localhost:3000',
        'jwt_secret' => wp_generate_password(32, false),
        'enable_sso' => true,
        'default_curriculum' => 'soroban',
        'auto_create_users' => true,
        'allowed_roles' => array('student', 'trainer', 'admin')
    );
}

/**
 * Reset plugin settings to defaults
 */
function icshd_geniuses_reset_settings() {
    $default_settings = icshd_geniuses_get_default_settings();
    return icshd_geniuses_update_settings($default_settings);
}

/**
 * Export plugin data
 */
function icshd_geniuses_export_data() {
    $data = array(
        'settings' => icshd_geniuses_get_settings(),
        'statistics' => icshd_geniuses_get_statistics(),
        'activity_logs' => icshd_geniuses_get_activity_logs(500),
        'export_timestamp' => current_time('mysql'),
        'plugin_version' => ICSHD_GENIUSES_VERSION
    );
    
    return $data;
}

/**
 * Import plugin data
 */
function icshd_geniuses_import_data($data) {
    if (!is_array($data)) {
        return false;
    }
    
    $success = true;
    
    // Import settings
    if (isset($data['settings']) && is_array($data['settings'])) {
        $sanitized_settings = icshd_geniuses_sanitize_settings($data['settings']);
        if (!icshd_geniuses_update_settings($sanitized_settings)) {
            $success = false;
        }
    }
    
    // Import activity logs
    if (isset($data['activity_logs']) && is_array($data['activity_logs'])) {
        update_option('icshd_geniuses_activity_logs', $data['activity_logs']);
    }
    
    return $success;
}

/**
 * Check if plugin is properly configured
 */
function icshd_geniuses_is_configured() {
    $settings = icshd_geniuses_get_settings();
    
    // Check required settings
    if (empty($settings['api_base_url']) || empty($settings['frontend_url'])) {
        return false;
    }
    
    // Check API connection
    $api_status = icshd_geniuses_check_api_status();
    if (!$api_status['success']) {
        return false;
    }
    
    return true;
}

/**
 * Get configuration issues
 */
function icshd_geniuses_get_config_issues() {
    $issues = array();
    $settings = icshd_geniuses_get_settings();
    
    // Check API URL
    if (empty($settings['api_base_url'])) {
        $issues[] = __('API Base URL is not configured', 'icshd-geniuses');
    }
    
    // Check Frontend URL
    if (empty($settings['frontend_url'])) {
        $issues[] = __('Frontend URL is not configured', 'icshd-geniuses');
    }
    
    // Check JWT Secret
    if (empty($settings['jwt_secret'])) {
        $issues[] = __('JWT Secret is not configured', 'icshd-geniuses');
    }
    
    // Check API connection
    $api_status = icshd_geniuses_check_api_status();
    if (!$api_status['success']) {
        $issues[] = sprintf(__('API connection failed: %s', 'icshd-geniuses'), $api_status['message']);
    }
    
    return $issues;
}

/**
 * Display admin notice for configuration issues
 */
function icshd_geniuses_admin_notices() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    $issues = icshd_geniuses_get_config_issues();
    
    if (!empty($issues)) {
        echo '<div class="notice notice-error"><p>';
        echo '<strong>' . __('ICSHD GENIUSES Configuration Issues:', 'icshd-geniuses') . '</strong><br>';
        echo implode('<br>', $issues);
        echo '<br><a href="' . admin_url('admin.php?page=icshd-geniuses-settings') . '">';
        echo __('Configure Plugin', 'icshd-geniuses') . '</a>';
        echo '</p></div>';
    }
}

// Hook admin notices
add_action('admin_notices', 'icshd_geniuses_admin_notices');
