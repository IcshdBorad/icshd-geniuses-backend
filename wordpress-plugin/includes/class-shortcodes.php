<?php
/**
 * Shortcodes Handler for ICSHD GENIUSES WordPress Plugin
 * Handles all shortcode functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class ICSHD_Geniuses_Shortcodes {
    
    private $settings;
    
    public function __construct($settings) {
        $this->settings = $settings;
        $this->init();
    }
    
    private function init() {
        // Register shortcodes
        add_shortcode('icshd_geniuses_app', array($this, 'render_app'));
        add_shortcode('icshd_geniuses_login', array($this, 'render_login'));
        add_shortcode('icshd_geniuses_dashboard', array($this, 'render_dashboard'));
        add_shortcode('icshd_geniuses_training', array($this, 'render_training'));
        add_shortcode('icshd_geniuses_progress', array($this, 'render_progress'));
        add_shortcode('icshd_geniuses_leaderboard', array($this, 'render_leaderboard'));
        add_shortcode('icshd_geniuses_exercise', array($this, 'render_exercise'));
        add_shortcode('icshd_geniuses_stats', array($this, 'render_stats'));
    }
    
    /**
     * Main app shortcode
     */
    public function render_app($atts, $content = '') {
        $atts = shortcode_atts(array(
            'mode' => 'full',
            'curriculum' => $this->settings['default_curriculum'],
            'height' => '600px',
            'width' => '100%',
            'theme' => 'default',
            'language' => 'ar',
            'auto_login' => 'false'
        ), $atts);
        
        // Check if user is logged in
        if (!is_user_logged_in() && $atts['auto_login'] !== 'true') {
            return $this->render_login_form($atts);
        }
        
        // Enqueue necessary scripts
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-app-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-container" 
             data-mode="<?php echo esc_attr($atts['mode']); ?>"
             data-curriculum="<?php echo esc_attr($atts['curriculum']); ?>"
             data-theme="<?php echo esc_attr($atts['theme']); ?>"
             data-language="<?php echo esc_attr($atts['language']); ?>"
             style="height: <?php echo esc_attr($atts['height']); ?>; width: <?php echo esc_attr($atts['width']); ?>;">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Loading ICSHD GENIUSES...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.init('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Login shortcode
     */
    public function render_login($atts, $content = '') {
        $atts = shortcode_atts(array(
            'redirect' => '',
            'style' => 'default',
            'show_register' => 'true',
            'title' => __('Login to ICSHD GENIUSES', 'icshd-geniuses')
        ), $atts);
        
        if (is_user_logged_in()) {
            $redirect_url = !empty($atts['redirect']) ? $atts['redirect'] : home_url('/dashboard/');
            return sprintf(
                '<p>%s <a href="%s">%s</a></p>',
                __('You are already logged in.', 'icshd-geniuses'),
                esc_url($redirect_url),
                __('Go to Dashboard', 'icshd-geniuses')
            );
        }
        
        return $this->render_login_form($atts);
    }
    
    /**
     * Dashboard shortcode
     */
    public function render_dashboard($atts, $content = '') {
        $atts = shortcode_atts(array(
            'role' => 'auto',
            'show_sidebar' => 'true',
            'default_view' => 'overview'
        ), $atts);
        
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        $user_role = $this->get_user_role();
        if ($atts['role'] !== 'auto' && $atts['role'] !== $user_role) {
            return '<p>' . __('Access denied. Insufficient permissions.', 'icshd-geniuses') . '</p>';
        }
        
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-dashboard-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-dashboard" 
             data-role="<?php echo esc_attr($user_role); ?>"
             data-show-sidebar="<?php echo esc_attr($atts['show_sidebar']); ?>"
             data-default-view="<?php echo esc_attr($atts['default_view']); ?>">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Loading Dashboard...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.initDashboard('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Training session shortcode
     */
    public function render_training($atts, $content = '') {
        $atts = shortcode_atts(array(
            'curriculum' => $this->settings['default_curriculum'],
            'level' => 'auto',
            'mode' => 'adaptive',
            'duration' => '30',
            'question_count' => '20',
            'auto_start' => 'false',
            'show_timer' => 'true',
            'show_progress' => 'true'
        ), $atts);
        
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-training-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-training" 
             data-curriculum="<?php echo esc_attr($atts['curriculum']); ?>"
             data-level="<?php echo esc_attr($atts['level']); ?>"
             data-mode="<?php echo esc_attr($atts['mode']); ?>"
             data-duration="<?php echo esc_attr($atts['duration']); ?>"
             data-question-count="<?php echo esc_attr($atts['question_count']); ?>"
             data-auto-start="<?php echo esc_attr($atts['auto_start']); ?>"
             data-show-timer="<?php echo esc_attr($atts['show_timer']); ?>"
             data-show-progress="<?php echo esc_attr($atts['show_progress']); ?>">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Preparing Training Session...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.initTraining('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Progress display shortcode
     */
    public function render_progress($atts, $content = '') {
        $atts = shortcode_atts(array(
            'user_id' => get_current_user_id(),
            'curriculum' => 'all',
            'period' => 'month',
            'show_charts' => 'true',
            'show_achievements' => 'true',
            'compact' => 'false'
        ), $atts);
        
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        // Permission check
        if ($atts['user_id'] != get_current_user_id() && !current_user_can('manage_icshd_geniuses_students')) {
            return '<p>' . __('Access denied.', 'icshd-geniuses') . '</p>';
        }
        
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-progress-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-progress" 
             data-user-id="<?php echo esc_attr($atts['user_id']); ?>"
             data-curriculum="<?php echo esc_attr($atts['curriculum']); ?>"
             data-period="<?php echo esc_attr($atts['period']); ?>"
             data-show-charts="<?php echo esc_attr($atts['show_charts']); ?>"
             data-show-achievements="<?php echo esc_attr($atts['show_achievements']); ?>"
             data-compact="<?php echo esc_attr($atts['compact']); ?>">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Loading Progress...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.initProgress('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Leaderboard shortcode
     */
    public function render_leaderboard($atts, $content = '') {
        $atts = shortcode_atts(array(
            'curriculum' => 'all',
            'period' => 'month',
            'limit' => '10',
            'show_avatars' => 'true',
            'show_scores' => 'true',
            'anonymous' => 'false'
        ), $atts);
        
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-leaderboard-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-leaderboard" 
             data-curriculum="<?php echo esc_attr($atts['curriculum']); ?>"
             data-period="<?php echo esc_attr($atts['period']); ?>"
             data-limit="<?php echo esc_attr($atts['limit']); ?>"
             data-show-avatars="<?php echo esc_attr($atts['show_avatars']); ?>"
             data-show-scores="<?php echo esc_attr($atts['show_scores']); ?>"
             data-anonymous="<?php echo esc_attr($atts['anonymous']); ?>">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Loading Leaderboard...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.initLeaderboard('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Single exercise shortcode
     */
    public function render_exercise($atts, $content = '') {
        $atts = shortcode_atts(array(
            'exercise_id' => '',
            'curriculum' => $this->settings['default_curriculum'],
            'difficulty' => 'medium',
            'show_solution' => 'false',
            'interactive' => 'true'
        ), $atts);
        
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-exercise-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-exercise" 
             data-exercise-id="<?php echo esc_attr($atts['exercise_id']); ?>"
             data-curriculum="<?php echo esc_attr($atts['curriculum']); ?>"
             data-difficulty="<?php echo esc_attr($atts['difficulty']); ?>"
             data-show-solution="<?php echo esc_attr($atts['show_solution']); ?>"
             data-interactive="<?php echo esc_attr($atts['interactive']); ?>">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Loading Exercise...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.initExercise('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Statistics shortcode
     */
    public function render_stats($atts, $content = '') {
        $atts = shortcode_atts(array(
            'type' => 'overview',
            'user_id' => get_current_user_id(),
            'curriculum' => 'all',
            'period' => 'month',
            'chart_type' => 'line'
        ), $atts);
        
        if (!is_user_logged_in()) {
            return $this->render_login_form();
        }
        
        // Permission check
        if ($atts['user_id'] != get_current_user_id() && !current_user_can('manage_icshd_geniuses_students')) {
            return '<p>' . __('Access denied.', 'icshd-geniuses') . '</p>';
        }
        
        $this->enqueue_app_assets();
        
        $container_id = 'icshd-geniuses-stats-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             class="icshd-geniuses-stats" 
             data-type="<?php echo esc_attr($atts['type']); ?>"
             data-user-id="<?php echo esc_attr($atts['user_id']); ?>"
             data-curriculum="<?php echo esc_attr($atts['curriculum']); ?>"
             data-period="<?php echo esc_attr($atts['period']); ?>"
             data-chart-type="<?php echo esc_attr($atts['chart_type']); ?>">
            
            <div class="icshd-loading">
                <div class="icshd-spinner"></div>
                <p><?php _e('Loading Statistics...', 'icshd-geniuses'); ?></p>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (window.ICShDGeniuses) {
                window.ICShDGeniuses.initStats('<?php echo esc_js($container_id); ?>', <?php echo json_encode($atts); ?>);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Render login form
     */
    private function render_login_form($atts = array()) {
        $atts = wp_parse_args($atts, array(
            'title' => __('Login to ICSHD GENIUSES', 'icshd-geniuses'),
            'style' => 'default',
            'show_register' => 'true',
            'redirect' => ''
        ));
        
        ob_start();
        ?>
        <div class="icshd-geniuses-login-form" data-style="<?php echo esc_attr($atts['style']); ?>">
            <form class="icshd-login-form" method="post">
                <h3><?php echo esc_html($atts['title']); ?></h3>
                
                <div class="icshd-form-group">
                    <label for="icshd-username"><?php _e('Username or Email', 'icshd-geniuses'); ?></label>
                    <input type="text" name="username" id="icshd-username" required />
                </div>
                
                <div class="icshd-form-group">
                    <label for="icshd-password"><?php _e('Password', 'icshd-geniuses'); ?></label>
                    <input type="password" name="password" id="icshd-password" required />
                </div>
                
                <div class="icshd-form-group">
                    <label>
                        <input type="checkbox" name="remember" value="1" />
                        <?php _e('Remember Me', 'icshd-geniuses'); ?>
                    </label>
                </div>
                
                <div class="icshd-form-group">
                    <button type="submit" class="icshd-btn icshd-btn-primary">
                        <?php _e('Login', 'icshd-geniuses'); ?>
                    </button>
                </div>
                
                <?php if ($atts['show_register'] === 'true'): ?>
                <div class="icshd-form-footer">
                    <p>
                        <?php _e("Don't have an account?", 'icshd-geniuses'); ?>
                        <a href="#" class="icshd-register-link"><?php _e('Register', 'icshd-geniuses'); ?></a>
                    </p>
                </div>
                <?php endif; ?>
                
                <input type="hidden" name="redirect_to" value="<?php echo esc_attr($atts['redirect']); ?>" />
                <?php wp_nonce_field('icshd_geniuses_login', 'icshd_login_nonce'); ?>
            </form>
        </div>
        
        <style>
        .icshd-geniuses-login-form {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #fff;
        }
        
        .icshd-form-group {
            margin-bottom: 15px;
        }
        
        .icshd-form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .icshd-form-group input[type="text"],
        .icshd-form-group input[type="password"],
        .icshd-form-group input[type="email"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .icshd-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
        }
        
        .icshd-btn-primary {
            background: #0073aa;
            color: white;
            width: 100%;
        }
        
        .icshd-btn-primary:hover {
            background: #005a87;
        }
        
        .icshd-form-footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .icshd-loading {
            text-align: center;
            padding: 40px;
        }
        
        .icshd-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0073aa;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: icshd-spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes icshd-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.querySelector('.icshd-login-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(form);
                    formData.append('action', 'icshd_geniuses_auth');
                    formData.append('auth_action', 'login');
                    formData.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_nonce'); ?>');
                    
                    fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.reload();
                        } else {
                            alert(data.data || 'Login failed');
                        }
                    })
                    .catch(error => {
                        console.error('Login error:', error);
                        alert('Login failed. Please try again.');
                    });
                });
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Enqueue app assets
     */
    private function enqueue_app_assets() {
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
            'api_base_url' => $this->settings['api_base_url'],
            'current_user' => $this->get_current_user_data(),
            'settings' => $this->get_public_settings()
        ));
    }
    
    /**
     * Get current user data
     */
    private function get_current_user_data() {
        if (!is_user_logged_in()) {
            return null;
        }
        
        $user = wp_get_current_user();
        
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
     * Get user role
     */
    private function get_user_role() {
        if (!is_user_logged_in()) {
            return 'guest';
        }
        
        $user = wp_get_current_user();
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
    
    /**
     * Get public settings
     */
    private function get_public_settings() {
        return array(
            'api_base_url' => $this->settings['api_base_url'],
            'default_curriculum' => $this->settings['default_curriculum'],
            'enable_sso' => $this->settings['enable_sso']
        );
    }
}
