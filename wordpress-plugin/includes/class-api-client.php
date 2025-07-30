<?php
/**
 * API Client for ICSHD GENIUSES WordPress Plugin
 * Handles communication with the GENIUSES backend API
 */

if (!defined('ABSPATH')) {
    exit;
}

class ICSHD_Geniuses_API_Client {
    
    private $settings;
    private $api_base_url;
    private $timeout = 30;
    
    public function __construct($settings) {
        $this->settings = $settings;
        $this->api_base_url = rtrim($settings['api_base_url'], '/');
    }
    
    /**
     * Authenticate user with GENIUSES backend
     */
    public function authenticate($username, $password) {
        $endpoint = '/auth/login';
        
        $data = array(
            'username' => $username,
            'password' => $password,
            'source' => 'wordpress'
        );
        
        return $this->make_request('POST', $endpoint, $data);
    }
    
    /**
     * Verify JWT token with backend
     */
    public function verify_token($token) {
        $endpoint = '/auth/verify';
        
        $headers = array(
            'Authorization' => 'Bearer ' . $token
        );
        
        return $this->make_request('GET', $endpoint, null, $headers);
    }
    
    /**
     * Create user in GENIUSES backend
     */
    public function create_user($user_data) {
        $endpoint = '/auth/register';
        
        return $this->make_request('POST', $endpoint, $user_data);
    }
    
    /**
     * Sync user data with backend
     */
    public function sync_user($user) {
        $user_data = array(
            'wordpress_user_id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'first_name' => get_user_meta($user->ID, 'first_name', true),
            'last_name' => get_user_meta($user->ID, 'last_name', true),
            'role' => get_user_meta($user->ID, 'icshd_geniuses_role', true) ?: 'student',
            'curriculum' => get_user_meta($user->ID, 'icshd_geniuses_curriculum', true) ?: $this->settings['default_curriculum'],
            'level' => get_user_meta($user->ID, 'icshd_geniuses_level', true) ?: 1,
            'last_sync' => current_time('mysql')
        );
        
        $geniuses_user_id = get_user_meta($user->ID, 'icshd_geniuses_user_id', true);
        
        if ($geniuses_user_id) {
            // Update existing user
            $endpoint = '/users/' . $geniuses_user_id;
            return $this->make_request('PUT', $endpoint, $user_data);
        } else {
            // Create new user
            $result = $this->create_user($user_data);
            
            if ($result && isset($result['success']) && $result['success']) {
                // Store GENIUSES user ID
                update_user_meta($user->ID, 'icshd_geniuses_user_id', $result['data']['user']['id']);
            }
            
            return $result;
        }
    }
    
    /**
     * Update user login information
     */
    public function update_user_login($geniuses_user_id, $login_data) {
        $endpoint = '/users/' . $geniuses_user_id . '/login';
        
        return $this->make_request('POST', $endpoint, $login_data);
    }
    
    /**
     * Logout user from backend
     */
    public function logout_user($user_id) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if ($geniuses_user_id) {
            $endpoint = '/auth/logout';
            $token = get_user_meta($user_id, 'icshd_geniuses_token', true);
            
            if ($token) {
                $headers = array(
                    'Authorization' => 'Bearer ' . $token
                );
                
                return $this->make_request('POST', $endpoint, null, $headers);
            }
        }
        
        return false;
    }
    
    /**
     * Get user sessions
     */
    public function get_user_sessions($user_id, $params = array()) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if (!$geniuses_user_id) {
            return false;
        }
        
        $endpoint = '/sessions/user/' . $geniuses_user_id;
        
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }
        
        return $this->make_authenticated_request('GET', $endpoint, null, $user_id);
    }
    
    /**
     * Get user progress
     */
    public function get_user_progress($user_id, $curriculum = null) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if (!$geniuses_user_id) {
            return false;
        }
        
        $endpoint = '/progress/' . $geniuses_user_id;
        
        if ($curriculum) {
            $endpoint .= '?curriculum=' . $curriculum;
        }
        
        return $this->make_authenticated_request('GET', $endpoint, null, $user_id);
    }
    
    /**
     * Get adaptive analytics
     */
    public function get_adaptive_analytics($user_id, $params = array()) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if (!$geniuses_user_id) {
            return false;
        }
        
        $endpoint = '/adaptive/analytics/' . $geniuses_user_id;
        
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }
        
        return $this->make_authenticated_request('GET', $endpoint, null, $user_id);
    }
    
    /**
     * Create adaptive session
     */
    public function create_adaptive_session($user_id, $session_config) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if (!$geniuses_user_id) {
            return false;
        }
        
        $endpoint = '/adaptive/sessions/' . $geniuses_user_id;
        
        return $this->make_authenticated_request('POST', $endpoint, $session_config, $user_id);
    }
    
    /**
     * Get exercises
     */
    public function get_exercises($params = array()) {
        $endpoint = '/exercises';
        
        if (!empty($params)) {
            $endpoint .= '?' . http_build_query($params);
        }
        
        return $this->make_request('GET', $endpoint);
    }
    
    /**
     * Create exercise (for trainers)
     */
    public function create_exercise($user_id, $exercise_data) {
        $endpoint = '/exercises';
        
        return $this->make_authenticated_request('POST', $endpoint, $exercise_data, $user_id);
    }
    
    /**
     * Generate report
     */
    public function generate_report($user_id, $report_type, $params = array()) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if (!$geniuses_user_id) {
            return false;
        }
        
        $endpoint = '/reports/' . $report_type . '/' . $geniuses_user_id;
        
        return $this->make_authenticated_request('POST', $endpoint, $params, $user_id);
    }
    
    /**
     * Get system health status
     */
    public function get_health_status() {
        $endpoint = '/health';
        
        return $this->make_request('GET', $endpoint);
    }
    
    /**
     * Bulk sync users
     */
    public function bulk_sync_users($users_data) {
        $endpoint = '/users/bulk-sync';
        
        return $this->make_request('POST', $endpoint, array('users' => $users_data));
    }
    
    /**
     * Get curriculum data
     */
    public function get_curriculum_data($curriculum) {
        $endpoint = '/curriculum/' . $curriculum;
        
        return $this->make_request('GET', $endpoint);
    }
    
    /**
     * Make authenticated request
     */
    private function make_authenticated_request($method, $endpoint, $data = null, $user_id = null) {
        $token = null;
        
        if ($user_id) {
            $token = get_user_meta($user_id, 'icshd_geniuses_token', true);
        } elseif (is_user_logged_in()) {
            $token = get_user_meta(get_current_user_id(), 'icshd_geniuses_token', true);
        }
        
        $headers = array();
        if ($token) {
            $headers['Authorization'] = 'Bearer ' . $token;
        }
        
        return $this->make_request($method, $endpoint, $data, $headers);
    }
    
    /**
     * Make HTTP request to GENIUSES API
     */
    private function make_request($method, $endpoint, $data = null, $headers = array()) {
        $url = $this->api_base_url . $endpoint;
        
        // Default headers
        $default_headers = array(
            'Content-Type' => 'application/json',
            'User-Agent' => 'ICSHD-GENIUSES-WP/' . ICSHD_GENIUSES_VERSION,
            'X-WordPress-Site' => get_site_url()
        );
        
        $headers = array_merge($default_headers, $headers);
        
        // Prepare request arguments
        $args = array(
            'method' => $method,
            'headers' => $headers,
            'timeout' => $this->timeout,
            'sslverify' => false // For development - should be true in production
        );
        
        // Add body data for POST/PUT requests
        if ($data && in_array($method, array('POST', 'PUT', 'PATCH'))) {
            $args['body'] = json_encode($data);
        }
        
        // Log request for debugging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('ICSHD GENIUSES API Request: ' . $method . ' ' . $url);
            if ($data) {
                error_log('Request Data: ' . json_encode($data));
            }
        }
        
        // Make the request
        $response = wp_remote_request($url, $args);
        
        // Handle errors
        if (is_wp_error($response)) {
            error_log('ICSHD GENIUSES API Error: ' . $response->get_error_message());
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        // Log response for debugging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('ICSHD GENIUSES API Response: ' . $response_code . ' - ' . $response_body);
        }
        
        // Parse JSON response
        $decoded_response = json_decode($response_body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('ICSHD GENIUSES API JSON Error: ' . json_last_error_msg());
            return array(
                'success' => false,
                'message' => 'Invalid JSON response'
            );
        }
        
        // Handle HTTP error codes
        if ($response_code >= 400) {
            $error_message = isset($decoded_response['message']) ? $decoded_response['message'] : 'API request failed';
            error_log('ICSHD GENIUSES API HTTP Error: ' . $response_code . ' - ' . $error_message);
            
            return array(
                'success' => false,
                'message' => $error_message,
                'code' => $response_code
            );
        }
        
        return $decoded_response;
    }
    
    /**
     * Test API connection
     */
    public function test_connection() {
        $start_time = microtime(true);
        $result = $this->get_health_status();
        $end_time = microtime(true);
        
        $response_time = round(($end_time - $start_time) * 1000, 2); // in milliseconds
        
        if ($result && isset($result['success']) && $result['success']) {
            return array(
                'success' => true,
                'message' => 'Connection successful',
                'response_time' => $response_time,
                'api_version' => $result['data']['version'] ?? 'unknown'
            );
        } else {
            return array(
                'success' => false,
                'message' => $result['message'] ?? 'Connection failed',
                'response_time' => $response_time
            );
        }
    }
    
    /**
     * Get API statistics
     */
    public function get_api_stats() {
        // Get cached stats or fetch new ones
        $stats = get_transient('icshd_geniuses_api_stats');
        
        if (false === $stats) {
            $endpoint = '/stats';
            $stats = $this->make_request('GET', $endpoint);
            
            if ($stats && isset($stats['success']) && $stats['success']) {
                // Cache for 5 minutes
                set_transient('icshd_geniuses_api_stats', $stats, 5 * MINUTE_IN_SECONDS);
            }
        }
        
        return $stats;
    }
    
    /**
     * Clear API cache
     */
    public function clear_cache() {
        delete_transient('icshd_geniuses_api_stats');
        delete_transient('icshd_geniuses_api_status');
        
        // Clear user-specific caches
        $users = get_users(array(
            'meta_key' => 'icshd_geniuses_user_id',
            'fields' => 'ID'
        ));
        
        foreach ($users as $user_id) {
            delete_transient('icshd_geniuses_user_progress_' . $user_id);
            delete_transient('icshd_geniuses_user_sessions_' . $user_id);
        }
    }
    
    /**
     * Get cached user data
     */
    public function get_cached_user_data($user_id, $data_type, $params = array()) {
        $cache_key = 'icshd_geniuses_user_' . $data_type . '_' . $user_id . '_' . md5(serialize($params));
        $cached_data = get_transient($cache_key);
        
        if (false !== $cached_data) {
            return $cached_data;
        }
        
        // Fetch fresh data
        $fresh_data = null;
        switch ($data_type) {
            case 'progress':
                $fresh_data = $this->get_user_progress($user_id, $params['curriculum'] ?? null);
                break;
            case 'sessions':
                $fresh_data = $this->get_user_sessions($user_id, $params);
                break;
            case 'analytics':
                $fresh_data = $this->get_adaptive_analytics($user_id, $params);
                break;
        }
        
        if ($fresh_data && isset($fresh_data['success']) && $fresh_data['success']) {
            // Cache for 2 minutes
            set_transient($cache_key, $fresh_data, 2 * MINUTE_IN_SECONDS);
        }
        
        return $fresh_data;
    }
    
    /**
     * Handle API rate limiting
     */
    private function handle_rate_limit($response_code, $headers) {
        if ($response_code === 429) {
            $retry_after = isset($headers['Retry-After']) ? intval($headers['Retry-After']) : 60;
            
            // Store rate limit info
            set_transient('icshd_geniuses_rate_limited', true, $retry_after);
            
            return array(
                'success' => false,
                'message' => 'Rate limit exceeded. Please try again in ' . $retry_after . ' seconds.',
                'retry_after' => $retry_after
            );
        }
        
        return null;
    }
    
    /**
     * Check if rate limited
     */
    public function is_rate_limited() {
        return get_transient('icshd_geniuses_rate_limited') !== false;
    }
}
