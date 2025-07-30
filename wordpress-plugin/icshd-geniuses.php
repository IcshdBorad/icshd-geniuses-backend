<?php
/**
 * Plugin Name: ICSHD GENIUSES - منصة العباقرة للحساب الذهني
 * Plugin URI: https://icshd.com/geniuses
 * Description: منصة ذكية لتوليد تمارين الحساب الذهني المتدرجة الصعوبة مع نظام تقييم تكيفي وتخصيص عميق لتجربة تعليمية متميزة
 * Version: 1.0.0
 * Author: ICSHD Team
 * Author URI: https://icshd.com
 * Text Domain: icshd-geniuses
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('ICSHD_GENIUSES_VERSION', '1.0.0');
define('ICSHD_GENIUSES_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ICSHD_GENIUSES_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('ICSHD_GENIUSES_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Main plugin class
class ICSHD_Geniuses_Plugin {
    
    /**
     * Plugin instance
     */
    private static $instance = null;
    
    /**
     * API base URL
     */
    private $api_base_url;
    
    /**
     * Plugin settings
     */
    private $settings;
    
    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * Initialize plugin
     */
    private function init() {
        // Load plugin settings
        $this->load_settings();
        
        // Initialize hooks
        add_action('init', array($this, 'init_plugin'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_ajax_icshd_geniuses_auth', array($this, 'handle_auth_ajax'));
        add_action('wp_ajax_nopriv_icshd_geniuses_auth', array($this, 'handle_auth_ajax'));
        
        // Register shortcodes
        add_shortcode('icshd_geniuses_app', array($this, 'render_app_shortcode'));
        add_shortcode('icshd_geniuses_login', array($this, 'render_login_shortcode'));
        add_shortcode('icshd_geniuses_dashboard', array($this, 'render_dashboard_shortcode'));
        add_shortcode('icshd_geniuses_training', array($this, 'render_training_shortcode'));
        
        // Register activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Load text domain
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        
        // Add user role capabilities
        add_action('init', array($this, 'add_user_capabilities'));
        
        // Custom user fields
        add_action('show_user_profile', array($this, 'add_user_profile_fields'));
        add_action('edit_user_profile', array($this, 'add_user_profile_fields'));
        add_action('personal_options_update', array($this, 'save_user_profile_fields'));
        add_action('edit_user_profile_update', array($this, 'save_user_profile_fields'));
    }
    
    /**
     * Load plugin settings
     */
    private function load_settings() {
        $this->settings = get_option('icshd_geniuses_settings', array(
            'api_base_url' => 'http://localhost:5000/api',
            'frontend_url' => 'http://localhost:3000',
            'jwt_secret' => wp_generate_password(32, false),
            'enable_sso' => true,
            'default_curriculum' => 'soroban',
            'auto_create_users' => true,
            'allowed_roles' => array('student', 'trainer', 'administrator')
        ));
        
        $this->api_base_url = $this->settings['api_base_url'];
    }
    
    /**
     * Initialize plugin
     */
    public function init_plugin() {
        // Load required files
        $this->load_includes();
        
        // Initialize components
        $this->init_auth_handler();
        $this->init_api_client();
        $this->init_user_sync();
    }
    
    /**
     * Load required files
     */
    private function load_includes() {
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-auth-handler.php';
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-api-client.php';
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-user-sync.php';
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/class-shortcodes.php';
        require_once ICSHD_GENIUSES_PLUGIN_PATH . 'includes/functions.php';
    }
    
    /**
     * Initialize authentication handler
     */
    private function init_auth_handler() {
        new ICSHD_Geniuses_Auth_Handler($this->settings);
    }
    
    /**
     * Initialize API client
     */
    private function init_api_client() {
        new ICSHD_Geniuses_API_Client($this->settings);
    }
    
    /**
     * Initialize user synchronization
     */
    private function init_user_sync() {
        new ICSHD_Geniuses_User_Sync($this->settings);
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_scripts() {
        // Only load on pages with shortcodes or specific pages
        if (!$this->should_load_assets()) {
            return;
        }
        
        // Enqueue React app bundle
        wp_enqueue_script(
            'icshd-geniuses-app',
            $this->settings['frontend_url'] . '/static/js/main.js',
            array(),
            ICSHD_GENIUSES_VERSION,
            true
        );
        
        wp_enqueue_style(
            'icshd-geniuses-app',
            $this->settings['frontend_url'] . '/static/css/main.css',
            array(),
            ICSHD_GENIUSES_VERSION
        );
        
        // Localize script with WordPress data
        wp_localize_script('icshd-geniuses-app', 'icshd_geniuses_wp', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('icshd_geniuses_nonce'),
            'api_base_url' => $this->api_base_url,
            'current_user' => $this->get_current_user_data(),
            'settings' => $this->get_public_settings()
        ));
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function admin_enqueue_scripts($hook) {
        // Only load on plugin admin pages
        if (strpos($hook, 'icshd-geniuses') === false) {
            return;
        }
        
        wp_enqueue_script(
            'icshd-geniuses-admin',
            ICSHD_GENIUSES_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            ICSHD_GENIUSES_VERSION,
            true
        );
        
        wp_enqueue_style(
            'icshd-geniuses-admin',
            ICSHD_GENIUSES_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            ICSHD_GENIUSES_VERSION
        );
        
        wp_localize_script('icshd-geniuses-admin', 'icshd_geniuses_admin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('icshd_geniuses_admin_nonce')
        ));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('ICSHD GENIUSES', 'icshd-geniuses'),
            __('ICSHD GENIUSES', 'icshd-geniuses'),
            'manage_options',
            'icshd-geniuses',
            array($this, 'admin_page'),
            'dashicons-graduation-cap',
            30
        );
        
        add_submenu_page(
            'icshd-geniuses',
            __('Settings', 'icshd-geniuses'),
            __('Settings', 'icshd-geniuses'),
            'manage_options',
            'icshd-geniuses-settings',
            array($this, 'settings_page')
        );
        
        add_submenu_page(
            'icshd-geniuses',
            __('Users Sync', 'icshd-geniuses'),
            __('Users Sync', 'icshd-geniuses'),
            'manage_options',
            'icshd-geniuses-users',
            array($this, 'users_page')
        );
        
        add_submenu_page(
            'icshd-geniuses',
            __('Reports', 'icshd-geniuses'),
            __('Reports', 'icshd-geniuses'),
            'manage_options',
            'icshd-geniuses-reports',
            array($this, 'reports_page')
        );
    }
    
    /**
     * Render main app shortcode
     */
    public function render_app_shortcode($atts) {
        $atts = shortcode_atts(array(
            'mode' => 'full',
            'curriculum' => $this->settings['default_curriculum'],
            'height' => '600px',
            'width' => '100%'
        ), $atts);
        
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        return sprintf(
            '<div id="icshd-geniuses-app" data-mode="%s" data-curriculum="%s" style="height: %s; width: %s;"></div>',
            esc_attr($atts['mode']),
            esc_attr($atts['curriculum']),
            esc_attr($atts['height']),
            esc_attr($atts['width'])
        );
    }
    
    /**
     * Render login shortcode
     */
    public function render_login_shortcode($atts) {
        if (is_user_logged_in()) {
            return '<p>' . __('You are already logged in.', 'icshd-geniuses') . '</p>';
        }
        
        return $this->render_login_form();
    }
    
    /**
     * Render dashboard shortcode
     */
    public function render_dashboard_shortcode($atts) {
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        $user_role = $this->get_user_geniuses_role();
        
        return sprintf(
            '<div id="icshd-geniuses-dashboard" data-role="%s"></div>',
            esc_attr($user_role)
        );
    }
    
    /**
     * Render training shortcode
     */
    public function render_training_shortcode($atts) {
        $atts = shortcode_atts(array(
            'curriculum' => $this->settings['default_curriculum'],
            'level' => '1',
            'auto_start' => 'false'
        ), $atts);
        
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        return sprintf(
            '<div id="icshd-geniuses-training" data-curriculum="%s" data-level="%s" data-auto-start="%s"></div>',
            esc_attr($atts['curriculum']),
            esc_attr($atts['level']),
            esc_attr($atts['auto_start'])
        );
    }
    
    /**
     * Handle AJAX authentication
     */
    public function handle_auth_ajax() {
        check_ajax_referer('icshd_geniuses_nonce', 'nonce');
        
        $action = sanitize_text_field($_POST['auth_action']);
        
        switch ($action) {
            case 'login':
                $this->handle_login();
                break;
            case 'register':
                $this->handle_register();
                break;
            case 'logout':
                $this->handle_logout();
                break;
            default:
                wp_send_json_error('Invalid action');
        }
    }
    
    /**
     * Handle login
     */
    private function handle_login() {
        $username = sanitize_user($_POST['username']);
        $password = $_POST['password'];
        
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            wp_send_json_error($user->get_error_message());
        }
        
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID);
        
        // Sync user with GENIUSES backend
        $this->sync_user_to_backend($user);
        
        wp_send_json_success(array(
            'user' => $this->get_user_data($user),
            'redirect_url' => $this->get_redirect_url($user)
        ));
    }
    
    /**
     * Handle registration
     */
    private function handle_register() {
        if (!$this->settings['auto_create_users']) {
            wp_send_json_error(__('Registration is disabled', 'icshd-geniuses'));
        }
        
        $username = sanitize_user($_POST['username']);
        $email = sanitize_email($_POST['email']);
        $password = $_POST['password'];
        $role = sanitize_text_field($_POST['role']);
        
        // Validate role
        if (!in_array($role, $this->settings['allowed_roles'])) {
            $role = 'student';
        }
        
        $user_id = wp_create_user($username, $password, $email);
        
        if (is_wp_error($user_id)) {
            wp_send_json_error($user_id->get_error_message());
        }
        
        // Set user role
        $user = new WP_User($user_id);
        $user->set_role($role);
        
        // Add GENIUSES specific meta
        update_user_meta($user_id, 'icshd_geniuses_role', $role);
        update_user_meta($user_id, 'icshd_geniuses_curriculum', $this->settings['default_curriculum']);
        update_user_meta($user_id, 'icshd_geniuses_level', 1);
        
        // Sync user with GENIUSES backend
        $this->sync_user_to_backend($user);
        
        wp_send_json_success(array(
            'message' => __('Registration successful', 'icshd-geniuses'),
            'user' => $this->get_user_data($user)
        ));
    }
    
    /**
     * Handle logout
     */
    private function handle_logout() {
        wp_logout();
        wp_send_json_success(array(
            'message' => __('Logged out successfully', 'icshd-geniuses')
        ));
    }
    
    /**
     * Add user capabilities
     */
    public function add_user_capabilities() {
        // Add custom capabilities for GENIUSES roles
        $roles = array('student', 'trainer', 'administrator');
        
        foreach ($roles as $role_name) {
            $role = get_role($role_name);
            if ($role) {
                $role->add_cap('access_icshd_geniuses');
                
                if ($role_name === 'trainer' || $role_name === 'administrator') {
                    $role->add_cap('manage_icshd_geniuses_students');
                    $role->add_cap('create_icshd_geniuses_exercises');
                }
                
                if ($role_name === 'administrator') {
                    $role->add_cap('manage_icshd_geniuses_settings');
                }
            }
        }
    }
    
    /**
     * Add user profile fields
     */
    public function add_user_profile_fields($user) {
        if (!current_user_can('edit_user', $user->ID)) {
            return;
        }
        
        $geniuses_role = get_user_meta($user->ID, 'icshd_geniuses_role', true);
        $curriculum = get_user_meta($user->ID, 'icshd_geniuses_curriculum', true);
        $level = get_user_meta($user->ID, 'icshd_geniuses_level', true);
        ?>
        <h3><?php _e('ICSHD GENIUSES Settings', 'icshd-geniuses'); ?></h3>
        <table class="form-table">
            <tr>
                <th><label for="icshd_geniuses_role"><?php _e('GENIUSES Role', 'icshd-geniuses'); ?></label></th>
                <td>
                    <select name="icshd_geniuses_role" id="icshd_geniuses_role">
                        <option value="student" <?php selected($geniuses_role, 'student'); ?>><?php _e('Student', 'icshd-geniuses'); ?></option>
                        <option value="trainer" <?php selected($geniuses_role, 'trainer'); ?>><?php _e('Trainer', 'icshd-geniuses'); ?></option>
                        <option value="admin" <?php selected($geniuses_role, 'admin'); ?>><?php _e('Admin', 'icshd-geniuses'); ?></option>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="icshd_geniuses_curriculum"><?php _e('Default Curriculum', 'icshd-geniuses'); ?></label></th>
                <td>
                    <select name="icshd_geniuses_curriculum" id="icshd_geniuses_curriculum">
                        <option value="soroban" <?php selected($curriculum, 'soroban'); ?>><?php _e('Soroban', 'icshd-geniuses'); ?></option>
                        <option value="vedic" <?php selected($curriculum, 'vedic'); ?>><?php _e('Vedic Math', 'icshd-geniuses'); ?></option>
                        <option value="logic" <?php selected($curriculum, 'logic'); ?>><?php _e('Logic', 'icshd-geniuses'); ?></option>
                        <option value="iqgames" <?php selected($curriculum, 'iqgames'); ?>><?php _e('IQ Games', 'icshd-geniuses'); ?></option>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="icshd_geniuses_level"><?php _e('Current Level', 'icshd-geniuses'); ?></label></th>
                <td>
                    <input type="number" name="icshd_geniuses_level" id="icshd_geniuses_level" 
                           value="<?php echo esc_attr($level ?: 1); ?>" min="1" max="10" />
                </td>
            </tr>
        </table>
        <?php
    }
    
    /**
     * Save user profile fields
     */
    public function save_user_profile_fields($user_id) {
        if (!current_user_can('edit_user', $user_id)) {
            return;
        }
        
        if (isset($_POST['icshd_geniuses_role'])) {
            update_user_meta($user_id, 'icshd_geniuses_role', sanitize_text_field($_POST['icshd_geniuses_role']));
        }
        
        if (isset($_POST['icshd_geniuses_curriculum'])) {
            update_user_meta($user_id, 'icshd_geniuses_curriculum', sanitize_text_field($_POST['icshd_geniuses_curriculum']));
        }
        
        if (isset($_POST['icshd_geniuses_level'])) {
            update_user_meta($user_id, 'icshd_geniuses_level', intval($_POST['icshd_geniuses_level']));
        }
        
        // Sync updated user data with backend
        $user = get_user_by('ID', $user_id);
        if ($user) {
            $this->sync_user_to_backend($user);
        }
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create default settings
        if (!get_option('icshd_geniuses_settings')) {
            update_option('icshd_geniuses_settings', $this->settings);
        }
        
        // Create database tables if needed
        $this->create_tables();
        
        // Add user capabilities
        $this->add_user_capabilities();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up temporary data
        delete_transient('icshd_geniuses_api_status');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Load text domain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'icshd-geniuses',
            false,
            dirname(ICSHD_GENIUSES_PLUGIN_BASENAME) . '/languages'
        );
    }
    
    /**
     * Helper methods
     */
    
    private function should_load_assets() {
        global $post;
        
        if (is_admin()) {
            return false;
        }
        
        // Check if current page has GENIUSES shortcodes
        if ($post && has_shortcode($post->post_content, 'icshd_geniuses_app')) {
            return true;
        }
        
        if ($post && (
            has_shortcode($post->post_content, 'icshd_geniuses_login') ||
            has_shortcode($post->post_content, 'icshd_geniuses_dashboard') ||
            has_shortcode($post->post_content, 'icshd_geniuses_training')
        )) {
            return true;
        }
        
        return false;
    }
    
    private function get_current_user_data() {
        if (!is_user_logged_in()) {
            return null;
        }
        
        return $this->get_user_data(wp_get_current_user());
    }
    
    private function get_user_data($user) {
        return array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'role' => $this->get_user_geniuses_role($user),
            'curriculum' => get_user_meta($user->ID, 'icshd_geniuses_curriculum', true),
            'level' => get_user_meta($user->ID, 'icshd_geniuses_level', true)
        );
    }
    
    private function get_user_geniuses_role($user = null) {
        if (!$user) {
            $user = wp_get_current_user();
        }
        
        $role = get_user_meta($user->ID, 'icshd_geniuses_role', true);
        
        if (!$role) {
            // Fallback to WordPress role
            if (user_can($user, 'manage_options')) {
                $role = 'admin';
            } elseif (user_can($user, 'edit_posts')) {
                $role = 'trainer';
            } else {
                $role = 'student';
            }
        }
        
        return $role;
    }
    
    private function get_public_settings() {
        return array(
            'api_base_url' => $this->api_base_url,
            'default_curriculum' => $this->settings['default_curriculum'],
            'enable_sso' => $this->settings['enable_sso']
        );
    }
    
    private function render_login_form() {
        ob_start();
        ?>
        <div id="icshd-geniuses-login-form">
            <form class="icshd-login-form">
                <h3><?php _e('Login to ICSHD GENIUSES', 'icshd-geniuses'); ?></h3>
                <p>
                    <label for="username"><?php _e('Username', 'icshd-geniuses'); ?></label>
                    <input type="text" name="username" id="username" required />
                </p>
                <p>
                    <label for="password"><?php _e('Password', 'icshd-geniuses'); ?></label>
                    <input type="password" name="password" id="password" required />
                </p>
                <p>
                    <button type="submit"><?php _e('Login', 'icshd-geniuses'); ?></button>
                </p>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    private function sync_user_to_backend($user) {
        // Implementation will be in the API client class
        $api_client = new ICSHD_Geniuses_API_Client($this->settings);
        return $api_client->sync_user($user);
    }
    
    private function get_redirect_url($user) {
        $role = $this->get_user_geniuses_role($user);
        
        // Return appropriate redirect URL based on role
        switch ($role) {
            case 'admin':
                return admin_url('admin.php?page=icshd-geniuses');
            case 'trainer':
                return home_url('/trainer-dashboard/');
            default:
                return home_url('/student-dashboard/');
        }
    }
    
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // User sync table
        $table_name = $wpdb->prefix . 'icshd_geniuses_user_sync';
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            wp_user_id bigint(20) UNSIGNED NOT NULL,
            geniuses_user_id varchar(255) NOT NULL,
            last_sync datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            sync_status varchar(20) DEFAULT 'pending',
            PRIMARY KEY (id),
            UNIQUE KEY wp_user_id (wp_user_id),
            UNIQUE KEY geniuses_user_id (geniuses_user_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Admin page methods (will be implemented in separate files)
     */
    public function admin_page() {
        include ICSHD_GENIUSES_PLUGIN_PATH . 'admin/admin-page.php';
    }
    
    public function settings_page() {
        include ICSHD_GENIUSES_PLUGIN_PATH . 'admin/settings-page.php';
    }
    
    public function users_page() {
        include ICSHD_GENIUSES_PLUGIN_PATH . 'admin/users-page.php';
    }
    
    public function reports_page() {
        include ICSHD_GENIUSES_PLUGIN_PATH . 'admin/reports-page.php';
    }
}

// Initialize the plugin
ICSHD_Geniuses_Plugin::get_instance();
