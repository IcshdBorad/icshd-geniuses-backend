<?php
/**
 * Authentication Handler for ICSHD GENIUSES WordPress Plugin
 * Handles SSO integration with the GENIUSES backend
 */

if (!defined('ABSPATH')) {
    exit;
}

class ICSHD_Geniuses_Auth_Handler {
    
    private $settings;
    private $api_client;
    
    public function __construct($settings) {
        $this->settings = $settings;
        $this->init();
    }
    
    private function init() {
        // WordPress authentication hooks
        add_filter('authenticate', array($this, 'authenticate_user'), 30, 3);
        add_action('wp_login', array($this, 'on_user_login'), 10, 2);
        add_action('wp_logout', array($this, 'on_user_logout'));
        add_action('user_register', array($this, 'on_user_register'));
        
        // Custom authentication endpoints
        add_action('wp_ajax_icshd_sso_login', array($this, 'handle_sso_login'));
        add_action('wp_ajax_nopriv_icshd_sso_login', array($this, 'handle_sso_login'));
        add_action('wp_ajax_icshd_verify_token', array($this, 'verify_jwt_token'));
        add_action('wp_ajax_nopriv_icshd_verify_token', array($this, 'verify_jwt_token'));
        
        // Initialize API client
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-api-client.php';
        $this->api_client = new ICSHD_Geniuses_API_Client($this->settings);
    }
    
    /**
     * Authenticate user with GENIUSES backend
     */
    public function authenticate_user($user, $username, $password) {
        // Skip if already authenticated or if SSO is disabled
        if (is_a($user, 'WP_User') || !$this->settings['enable_sso']) {
            return $user;
        }
        
        // Skip if no username/password provided
        if (empty($username) || empty($password)) {
            return $user;
        }
        
        try {
            // Authenticate with GENIUSES backend
            $auth_result = $this->api_client->authenticate($username, $password);
            
            if ($auth_result && isset($auth_result['success']) && $auth_result['success']) {
                $geniuses_user = $auth_result['data']['user'];
                
                // Find or create WordPress user
                $wp_user = $this->find_or_create_wp_user($geniuses_user);
                
                if ($wp_user && !is_wp_error($wp_user)) {
                    // Store GENIUSES token
                    update_user_meta($wp_user->ID, 'icshd_geniuses_token', $auth_result['data']['token']);
                    update_user_meta($wp_user->ID, 'icshd_geniuses_user_id', $geniuses_user['id']);
                    
                    // Update last login
                    update_user_meta($wp_user->ID, 'icshd_geniuses_last_login', current_time('mysql'));
                    
                    return $wp_user;
                }
            }
        } catch (Exception $e) {
            error_log('ICSHD GENIUSES Auth Error: ' . $e->getMessage());
        }
        
        return $user;
    }
    
    /**
     * Handle user login
     */
    public function on_user_login($user_login, $user) {
        // Sync user data with GENIUSES backend
        $this->sync_user_login($user);
        
        // Update login statistics
        $login_count = get_user_meta($user->ID, 'icshd_geniuses_login_count', true);
        update_user_meta($user->ID, 'icshd_geniuses_login_count', intval($login_count) + 1);
        update_user_meta($user->ID, 'icshd_geniuses_last_login', current_time('mysql'));
    }
    
    /**
     * Handle user logout
     */
    public function on_user_logout() {
        $user_id = get_current_user_id();
        
        if ($user_id) {
            // Clear GENIUSES token
            delete_user_meta($user_id, 'icshd_geniuses_token');
            
            // Notify GENIUSES backend
            $this->api_client->logout_user($user_id);
        }
    }
    
    /**
     * Handle user registration
     */
    public function on_user_register($user_id) {
        $user = get_user_by('ID', $user_id);
        
        if ($user) {
            // Set default GENIUSES role
            update_user_meta($user_id, 'icshd_geniuses_role', 'student');
            update_user_meta($user_id, 'icshd_geniuses_curriculum', $this->settings['default_curriculum']);
            update_user_meta($user_id, 'icshd_geniuses_level', 1);
            
            // Sync with GENIUSES backend
            $this->sync_new_user($user);
        }
    }
    
    /**
     * Handle SSO login via AJAX
     */
    public function handle_sso_login() {
        check_ajax_referer('icshd_geniuses_nonce', 'nonce');
        
        $token = sanitize_text_field($_POST['token']);
        
        if (empty($token)) {
            wp_send_json_error('Token is required');
        }
        
        try {
            // Verify token with GENIUSES backend
            $user_data = $this->api_client->verify_token($token);
            
            if ($user_data && isset($user_data['success']) && $user_data['success']) {
                $geniuses_user = $user_data['data']['user'];
                
                // Find or create WordPress user
                $wp_user = $this->find_or_create_wp_user($geniuses_user);
                
                if ($wp_user && !is_wp_error($wp_user)) {
                    // Log in the user
                    wp_set_current_user($wp_user->ID);
                    wp_set_auth_cookie($wp_user->ID);
                    
                    // Store token
                    update_user_meta($wp_user->ID, 'icshd_geniuses_token', $token);
                    
                    wp_send_json_success(array(
                        'user' => $this->get_user_data($wp_user),
                        'redirect_url' => $this->get_redirect_url($wp_user)
                    ));
                } else {
                    wp_send_json_error('Failed to create WordPress user');
                }
            } else {
                wp_send_json_error('Invalid token');
            }
        } catch (Exception $e) {
            wp_send_json_error('Authentication failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Verify JWT token
     */
    public function verify_jwt_token() {
        check_ajax_referer('icshd_geniuses_nonce', 'nonce');
        
        $token = sanitize_text_field($_POST['token']);
        
        if (empty($token)) {
            wp_send_json_error('Token is required');
        }
        
        try {
            $result = $this->api_client->verify_token($token);
            
            if ($result && isset($result['success']) && $result['success']) {
                wp_send_json_success($result['data']);
            } else {
                wp_send_json_error('Invalid token');
            }
        } catch (Exception $e) {
            wp_send_json_error('Token verification failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Find or create WordPress user from GENIUSES user data
     */
    private function find_or_create_wp_user($geniuses_user) {
        // Try to find existing user by email
        $wp_user = get_user_by('email', $geniuses_user['email']);
        
        if (!$wp_user) {
            // Try to find by username
            $wp_user = get_user_by('login', $geniuses_user['username']);
        }
        
        if (!$wp_user) {
            // Try to find by GENIUSES user ID
            $users = get_users(array(
                'meta_key' => 'icshd_geniuses_user_id',
                'meta_value' => $geniuses_user['id'],
                'number' => 1
            ));
            
            if (!empty($users)) {
                $wp_user = $users[0];
            }
        }
        
        if (!$wp_user && $this->settings['auto_create_users']) {
            // Create new WordPress user
            $wp_user = $this->create_wp_user($geniuses_user);
        }
        
        if ($wp_user && !is_wp_error($wp_user)) {
            // Update user meta with GENIUSES data
            $this->update_user_meta_from_geniuses($wp_user->ID, $geniuses_user);
        }
        
        return $wp_user;
    }
    
    /**
     * Create WordPress user from GENIUSES user data
     */
    private function create_wp_user($geniuses_user) {
        $username = $geniuses_user['username'];
        $email = $geniuses_user['email'];
        
        // Ensure unique username
        $original_username = $username;
        $counter = 1;
        while (username_exists($username)) {
            $username = $original_username . $counter;
            $counter++;
        }
        
        // Create user
        $user_id = wp_create_user(
            $username,
            wp_generate_password(12, false),
            $email
        );
        
        if (is_wp_error($user_id)) {
            return $user_id;
        }
        
        $wp_user = get_user_by('ID', $user_id);
        
        // Set user role based on GENIUSES role
        $wp_role = $this->map_geniuses_role_to_wp($geniuses_user['role']);
        $wp_user->set_role($wp_role);
        
        // Update display name
        wp_update_user(array(
            'ID' => $user_id,
            'display_name' => $geniuses_user['displayName'] ?? $geniuses_user['username'],
            'first_name' => $geniuses_user['firstName'] ?? '',
            'last_name' => $geniuses_user['lastName'] ?? ''
        ));
        
        return $wp_user;
    }
    
    /**
     * Update user meta from GENIUSES data
     */
    private function update_user_meta_from_geniuses($user_id, $geniuses_user) {
        update_user_meta($user_id, 'icshd_geniuses_user_id', $geniuses_user['id']);
        update_user_meta($user_id, 'icshd_geniuses_role', $geniuses_user['role']);
        
        if (isset($geniuses_user['curriculum'])) {
            update_user_meta($user_id, 'icshd_geniuses_curriculum', $geniuses_user['curriculum']);
        }
        
        if (isset($geniuses_user['level'])) {
            update_user_meta($user_id, 'icshd_geniuses_level', $geniuses_user['level']);
        }
        
        if (isset($geniuses_user['profile'])) {
            update_user_meta($user_id, 'icshd_geniuses_profile', $geniuses_user['profile']);
        }
        
        // Update sync timestamp
        update_user_meta($user_id, 'icshd_geniuses_last_sync', current_time('mysql'));
    }
    
    /**
     * Map GENIUSES role to WordPress role
     */
    private function map_geniuses_role_to_wp($geniuses_role) {
        $role_mapping = array(
            'admin' => 'administrator',
            'trainer' => 'editor',
            'student' => 'subscriber'
        );
        
        return isset($role_mapping[$geniuses_role]) ? $role_mapping[$geniuses_role] : 'subscriber';
    }
    
    /**
     * Sync user login with GENIUSES backend
     */
    private function sync_user_login($user) {
        $geniuses_user_id = get_user_meta($user->ID, 'icshd_geniuses_user_id', true);
        
        if ($geniuses_user_id) {
            $this->api_client->update_user_login($geniuses_user_id, array(
                'last_login' => current_time('mysql'),
                'login_count' => get_user_meta($user->ID, 'icshd_geniuses_login_count', true)
            ));
        }
    }
    
    /**
     * Sync new user with GENIUSES backend
     */
    private function sync_new_user($user) {
        $user_data = array(
            'username' => $user->user_login,
            'email' => $user->user_email,
            'displayName' => $user->display_name,
            'firstName' => get_user_meta($user->ID, 'first_name', true),
            'lastName' => get_user_meta($user->ID, 'last_name', true),
            'role' => get_user_meta($user->ID, 'icshd_geniuses_role', true),
            'curriculum' => get_user_meta($user->ID, 'icshd_geniuses_curriculum', true),
            'level' => get_user_meta($user->ID, 'icshd_geniuses_level', true),
            'wordpress_user_id' => $user->ID
        );
        
        try {
            $result = $this->api_client->create_user($user_data);
            
            if ($result && isset($result['success']) && $result['success']) {
                // Store GENIUSES user ID
                update_user_meta($user->ID, 'icshd_geniuses_user_id', $result['data']['user']['id']);
                update_user_meta($user->ID, 'icshd_geniuses_last_sync', current_time('mysql'));
            }
        } catch (Exception $e) {
            error_log('ICSHD GENIUSES User Sync Error: ' . $e->getMessage());
        }
    }
    
    /**
     * Generate JWT token for WordPress user
     */
    public function generate_jwt_token($user) {
        $payload = array(
            'user_id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'role' => get_user_meta($user->ID, 'icshd_geniuses_role', true),
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        );
        
        return $this->jwt_encode($payload, $this->settings['jwt_secret']);
    }
    
    /**
     * Verify JWT token
     */
    public function verify_jwt_token_local($token) {
        try {
            $payload = $this->jwt_decode($token, $this->settings['jwt_secret']);
            
            if ($payload && isset($payload['user_id'])) {
                $user = get_user_by('ID', $payload['user_id']);
                
                if ($user) {
                    return array(
                        'success' => true,
                        'user' => $this->get_user_data($user)
                    );
                }
            }
        } catch (Exception $e) {
            error_log('JWT Verification Error: ' . $e->getMessage());
        }
        
        return array('success' => false, 'message' => 'Invalid token');
    }
    
    /**
     * Get user data for API response
     */
    private function get_user_data($user) {
        return array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'role' => get_user_meta($user->ID, 'icshd_geniuses_role', true),
            'curriculum' => get_user_meta($user->ID, 'icshd_geniuses_curriculum', true),
            'level' => get_user_meta($user->ID, 'icshd_geniuses_level', true),
            'geniuses_user_id' => get_user_meta($user->ID, 'icshd_geniuses_user_id', true)
        );
    }
    
    /**
     * Get redirect URL based on user role
     */
    private function get_redirect_url($user) {
        $role = get_user_meta($user->ID, 'icshd_geniuses_role', true);
        
        switch ($role) {
            case 'admin':
                return admin_url('admin.php?page=icshd-geniuses');
            case 'trainer':
                return home_url('/trainer-dashboard/');
            default:
                return home_url('/student-dashboard/');
        }
    }
    
    /**
     * Simple JWT encode (for basic implementation)
     */
    private function jwt_encode($payload, $secret) {
        $header = json_encode(array('typ' => 'JWT', 'alg' => 'HS256'));
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Simple JWT decode (for basic implementation)
     */
    private function jwt_decode($token, $secret) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0])), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        $signature = str_replace(['-', '_'], ['+', '/'], $parts[2]);
        
        // Verify signature
        $expectedSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], $secret, true);
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception('Invalid signature');
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        return $payload;
    }
}
