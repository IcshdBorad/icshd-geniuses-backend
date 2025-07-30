<?php
/**
 * User Synchronization Handler for ICSHD GENIUSES WordPress Plugin
 * Handles bidirectional sync between WordPress and GENIUSES backend
 */

if (!defined('ABSPATH')) {
    exit;
}

class ICSHD_Geniuses_User_Sync {
    
    private $settings;
    private $api_client;
    
    public function __construct($settings) {
        $this->settings = $settings;
        $this->init();
    }
    
    private function init() {
        // Initialize API client
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-api-client.php';
        $this->api_client = new ICSHD_Geniuses_API_Client($this->settings);
        
        // WordPress user hooks
        add_action('profile_update', array($this, 'on_user_update'), 10, 2);
        add_action('delete_user', array($this, 'on_user_delete'));
        add_action('set_user_role', array($this, 'on_user_role_change'), 10, 3);
        
        // Scheduled sync
        add_action('icshd_geniuses_sync_users', array($this, 'scheduled_sync'));
        
        // Admin AJAX handlers
        add_action('wp_ajax_icshd_sync_single_user', array($this, 'ajax_sync_single_user'));
        add_action('wp_ajax_icshd_sync_all_users', array($this, 'ajax_sync_all_users'));
        add_action('wp_ajax_icshd_get_sync_status', array($this, 'ajax_get_sync_status'));
        
        // Schedule sync if not already scheduled
        if (!wp_next_scheduled('icshd_geniuses_sync_users')) {
            wp_schedule_event(time(), 'hourly', 'icshd_geniuses_sync_users');
        }
    }
    
    /**
     * Handle user profile update
     */
    public function on_user_update($user_id, $old_user_data) {
        $user = get_user_by('ID', $user_id);
        
        if ($user) {
            $this->sync_user_to_backend($user);
        }
    }
    
    /**
     * Handle user deletion
     */
    public function on_user_delete($user_id) {
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        if ($geniuses_user_id) {
            // Soft delete in GENIUSES backend
            $this->api_client->make_authenticated_request('DELETE', '/users/' . $geniuses_user_id);
        }
        
        // Clean up sync table
        global $wpdb;
        $table_name = $wpdb->prefix . 'icshd_geniuses_user_sync';
        $wpdb->delete($table_name, array('wp_user_id' => $user_id));
    }
    
    /**
     * Handle user role change
     */
    public function on_user_role_change($user_id, $role, $old_roles) {
        // Map WordPress role to GENIUSES role
        $geniuses_role = $this->map_wp_role_to_geniuses($role);
        
        // Update GENIUSES role meta
        update_user_meta($user_id, 'icshd_geniuses_role', $geniuses_role);
        
        // Sync with backend
        $user = get_user_by('ID', $user_id);
        if ($user) {
            $this->sync_user_to_backend($user);
        }
    }
    
    /**
     * Scheduled user synchronization
     */
    public function scheduled_sync() {
        $this->sync_all_users(false); // Silent sync
    }
    
    /**
     * Sync single user to backend
     */
    public function sync_user_to_backend($user) {
        try {
            $result = $this->api_client->sync_user($user);
            
            if ($result && isset($result['success']) && $result['success']) {
                // Update sync status
                $this->update_sync_status($user->ID, 'success', 'User synced successfully');
                
                // Update last sync time
                update_user_meta($user->ID, 'icshd_geniuses_last_sync', current_time('mysql'));
                
                return true;
            } else {
                $error_message = isset($result['message']) ? $result['message'] : 'Unknown error';
                $this->update_sync_status($user->ID, 'error', $error_message);
                
                return false;
            }
        } catch (Exception $e) {
            $this->update_sync_status($user->ID, 'error', $e->getMessage());
            error_log('ICSHD GENIUSES User Sync Error: ' . $e->getMessage());
            
            return false;
        }
    }
    
    /**
     * Sync all users
     */
    public function sync_all_users($verbose = true) {
        $users = get_users(array(
            'meta_key' => 'icshd_geniuses_role',
            'meta_compare' => 'EXISTS'
        ));
        
        $results = array(
            'total' => count($users),
            'success' => 0,
            'errors' => 0,
            'skipped' => 0
        );
        
        foreach ($users as $user) {
            // Check if user needs sync
            if (!$this->user_needs_sync($user->ID)) {
                $results['skipped']++;
                continue;
            }
            
            if ($this->sync_user_to_backend($user)) {
                $results['success']++;
            } else {
                $results['errors']++;
            }
            
            // Prevent timeout
            if ($verbose) {
                usleep(100000); // 100ms delay
            }
        }
        
        // Update sync statistics
        update_option('icshd_geniuses_last_sync', array(
            'timestamp' => current_time('mysql'),
            'results' => $results
        ));
        
        return $results;
    }
    
    /**
     * Bulk sync users data
     */
    public function bulk_sync_users($user_ids = null) {
        if (!$user_ids) {
            $users = get_users(array(
                'meta_key' => 'icshd_geniuses_role',
                'meta_compare' => 'EXISTS',
                'fields' => 'ID'
            ));
            $user_ids = $users;
        }
        
        $users_data = array();
        
        foreach ($user_ids as $user_id) {
            $user = get_user_by('ID', $user_id);
            if ($user) {
                $users_data[] = $this->prepare_user_data($user);
            }
        }
        
        if (!empty($users_data)) {
            $result = $this->api_client->bulk_sync_users($users_data);
            
            if ($result && isset($result['success']) && $result['success']) {
                // Update sync status for all users
                foreach ($user_ids as $user_id) {
                    $this->update_sync_status($user_id, 'success', 'Bulk sync successful');
                    update_user_meta($user_id, 'icshd_geniuses_last_sync', current_time('mysql'));
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Sync from backend to WordPress
     */
    public function sync_from_backend($geniuses_user_id) {
        try {
            // Get user data from backend
            $result = $this->api_client->make_request('GET', '/users/' . $geniuses_user_id);
            
            if ($result && isset($result['success']) && $result['success']) {
                $geniuses_user = $result['data']['user'];
                
                // Find WordPress user
                $wp_user = $this->find_wp_user_by_geniuses_id($geniuses_user_id);
                
                if ($wp_user) {
                    // Update WordPress user
                    $this->update_wp_user_from_geniuses($wp_user->ID, $geniuses_user);
                } else {
                    // Create new WordPress user
                    $wp_user = $this->create_wp_user_from_geniuses($geniuses_user);
                }
                
                return $wp_user;
            }
        } catch (Exception $e) {
            error_log('ICSHD GENIUSES Sync from Backend Error: ' . $e->getMessage());
        }
        
        return false;
    }
    
    /**
     * AJAX: Sync single user
     */
    public function ajax_sync_single_user() {
        check_ajax_referer('icshd_geniuses_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }
        
        $user_id = intval($_POST['user_id']);
        $user = get_user_by('ID', $user_id);
        
        if (!$user) {
            wp_send_json_error('User not found');
        }
        
        if ($this->sync_user_to_backend($user)) {
            wp_send_json_success('User synced successfully');
        } else {
            $sync_status = $this->get_sync_status($user_id);
            wp_send_json_error($sync_status['message'] ?? 'Sync failed');
        }
    }
    
    /**
     * AJAX: Sync all users
     */
    public function ajax_sync_all_users() {
        check_ajax_referer('icshd_geniuses_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }
        
        $results = $this->sync_all_users(true);
        
        wp_send_json_success(array(
            'message' => sprintf(
                'Sync completed: %d successful, %d errors, %d skipped out of %d total users',
                $results['success'],
                $results['errors'],
                $results['skipped'],
                $results['total']
            ),
            'results' => $results
        ));
    }
    
    /**
     * AJAX: Get sync status
     */
    public function ajax_get_sync_status() {
        check_ajax_referer('icshd_geniuses_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }
        
        $user_id = intval($_POST['user_id']);
        $status = $this->get_sync_status($user_id);
        
        wp_send_json_success($status);
    }
    
    /**
     * Check if user needs synchronization
     */
    private function user_needs_sync($user_id) {
        $last_sync = get_user_meta($user_id, 'icshd_geniuses_last_sync', true);
        $last_modified = get_user_meta($user_id, 'icshd_geniuses_last_modified', true);
        
        if (!$last_sync) {
            return true; // Never synced
        }
        
        if ($last_modified && strtotime($last_modified) > strtotime($last_sync)) {
            return true; // Modified since last sync
        }
        
        // Check if sync is older than 24 hours
        $sync_age = time() - strtotime($last_sync);
        return $sync_age > (24 * 60 * 60);
    }
    
    /**
     * Prepare user data for API
     */
    private function prepare_user_data($user) {
        return array(
            'wordpress_user_id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'first_name' => get_user_meta($user->ID, 'first_name', true),
            'last_name' => get_user_meta($user->ID, 'last_name', true),
            'role' => get_user_meta($user->ID, 'icshd_geniuses_role', true),
            'curriculum' => get_user_meta($user->ID, 'icshd_geniuses_curriculum', true),
            'level' => get_user_meta($user->ID, 'icshd_geniuses_level', true),
            'profile' => get_user_meta($user->ID, 'icshd_geniuses_profile', true),
            'last_login' => get_user_meta($user->ID, 'icshd_geniuses_last_login', true),
            'login_count' => get_user_meta($user->ID, 'icshd_geniuses_login_count', true),
            'registered' => $user->user_registered,
            'status' => 'active'
        );
    }
    
    /**
     * Update sync status in database
     */
    private function update_sync_status($user_id, $status, $message = '') {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'icshd_geniuses_user_sync';
        $geniuses_user_id = get_user_meta($user_id, 'icshd_geniuses_user_id', true);
        
        $data = array(
            'wp_user_id' => $user_id,
            'geniuses_user_id' => $geniuses_user_id ?: '',
            'sync_status' => $status,
            'last_sync' => current_time('mysql')
        );
        
        // Check if record exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table_name WHERE wp_user_id = %d",
            $user_id
        ));
        
        if ($existing) {
            $wpdb->update($table_name, $data, array('wp_user_id' => $user_id));
        } else {
            $wpdb->insert($table_name, $data);
        }
        
        // Store detailed message in user meta
        if ($message) {
            update_user_meta($user_id, 'icshd_geniuses_sync_message', $message);
        }
    }
    
    /**
     * Get sync status for user
     */
    private function get_sync_status($user_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'icshd_geniuses_user_sync';
        $sync_record = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE wp_user_id = %d",
            $user_id
        ));
        
        $status = array(
            'status' => $sync_record ? $sync_record->sync_status : 'never',
            'last_sync' => $sync_record ? $sync_record->last_sync : null,
            'geniuses_user_id' => $sync_record ? $sync_record->geniuses_user_id : null,
            'message' => get_user_meta($user_id, 'icshd_geniuses_sync_message', true)
        );
        
        return $status;
    }
    
    /**
     * Find WordPress user by GENIUSES user ID
     */
    private function find_wp_user_by_geniuses_id($geniuses_user_id) {
        $users = get_users(array(
            'meta_key' => 'icshd_geniuses_user_id',
            'meta_value' => $geniuses_user_id,
            'number' => 1
        ));
        
        return !empty($users) ? $users[0] : null;
    }
    
    /**
     * Update WordPress user from GENIUSES data
     */
    private function update_wp_user_from_geniuses($user_id, $geniuses_user) {
        // Update user basic info
        wp_update_user(array(
            'ID' => $user_id,
            'display_name' => $geniuses_user['displayName'] ?? '',
            'first_name' => $geniuses_user['firstName'] ?? '',
            'last_name' => $geniuses_user['lastName'] ?? ''
        ));
        
        // Update GENIUSES specific meta
        update_user_meta($user_id, 'icshd_geniuses_role', $geniuses_user['role']);
        update_user_meta($user_id, 'icshd_geniuses_curriculum', $geniuses_user['curriculum'] ?? '');
        update_user_meta($user_id, 'icshd_geniuses_level', $geniuses_user['level'] ?? 1);
        update_user_meta($user_id, 'icshd_geniuses_profile', $geniuses_user['profile'] ?? array());
        update_user_meta($user_id, 'icshd_geniuses_last_sync', current_time('mysql'));
        
        // Update sync status
        $this->update_sync_status($user_id, 'success', 'Synced from backend');
    }
    
    /**
     * Create WordPress user from GENIUSES data
     */
    private function create_wp_user_from_geniuses($geniuses_user) {
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
            return false;
        }
        
        // Set user role
        $wp_role = $this->map_geniuses_role_to_wp($geniuses_user['role']);
        $user = new WP_User($user_id);
        $user->set_role($wp_role);
        
        // Update user data
        $this->update_wp_user_from_geniuses($user_id, $geniuses_user);
        
        return $user;
    }
    
    /**
     * Map WordPress role to GENIUSES role
     */
    private function map_wp_role_to_geniuses($wp_role) {
        $role_mapping = array(
            'administrator' => 'admin',
            'editor' => 'trainer',
            'author' => 'trainer',
            'contributor' => 'student',
            'subscriber' => 'student'
        );
        
        return isset($role_mapping[$wp_role]) ? $role_mapping[$wp_role] : 'student';
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
     * Get sync statistics
     */
    public function get_sync_statistics() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'icshd_geniuses_user_sync';
        
        $stats = array(
            'total_users' => $wpdb->get_var("SELECT COUNT(*) FROM $table_name"),
            'synced_users' => $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE sync_status = 'success'"),
            'error_users' => $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE sync_status = 'error'"),
            'pending_users' => $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE sync_status = 'pending'"),
            'last_sync' => get_option('icshd_geniuses_last_sync')
        );
        
        return $stats;
    }
    
    /**
     * Clean up old sync records
     */
    public function cleanup_old_sync_records() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'icshd_geniuses_user_sync';
        
        // Remove records for deleted WordPress users
        $wpdb->query("
            DELETE s FROM $table_name s 
            LEFT JOIN {$wpdb->users} u ON s.wp_user_id = u.ID 
            WHERE u.ID IS NULL
        ");
        
        // Clean up old error messages (older than 30 days)
        $wpdb->query($wpdb->prepare("
            DELETE FROM {$wpdb->usermeta} 
            WHERE meta_key = 'icshd_geniuses_sync_message' 
            AND user_id IN (
                SELECT wp_user_id FROM $table_name 
                WHERE sync_status = 'error' 
                AND last_sync < %s
            )
        ", date('Y-m-d H:i:s', strtotime('-30 days'))));
    }
}
