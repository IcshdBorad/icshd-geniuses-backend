<?php
/**
 * Settings Page for ICSHD GENIUSES WordPress Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check user permissions
if (!current_user_can('manage_options')) {
    wp_die(__('You do not have sufficient permissions to access this page.'));
}

// Handle form submission
if (isset($_POST['submit']) && wp_verify_nonce($_POST['icshd_geniuses_settings_nonce'], 'icshd_geniuses_settings')) {
    $settings = icshd_geniuses_sanitize_settings($_POST['icshd_geniuses']);
    
    if (icshd_geniuses_update_settings($settings)) {
        echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'icshd-geniuses') . '</p></div>';
        
        // Log the activity
        icshd_geniuses_log_activity('settings_updated', $settings);
        
        // Clear API status cache
        delete_transient('icshd_geniuses_api_status');
    } else {
        echo '<div class="notice notice-error"><p>' . __('Failed to save settings.', 'icshd-geniuses') . '</p></div>';
    }
}

// Handle reset settings
if (isset($_POST['reset']) && wp_verify_nonce($_POST['icshd_geniuses_reset_nonce'], 'icshd_geniuses_reset')) {
    if (icshd_geniuses_reset_settings()) {
        echo '<div class="notice notice-success"><p>' . __('Settings reset to defaults successfully!', 'icshd-geniuses') . '</p></div>';
        icshd_geniuses_log_activity('settings_reset');
    } else {
        echo '<div class="notice notice-error"><p>' . __('Failed to reset settings.', 'icshd-geniuses') . '</p></div>';
    }
}

$settings = icshd_geniuses_get_settings();
$api_status = icshd_geniuses_check_api_status();
?>

<div class="wrap">
    <h1><?php _e('ICSHD GENIUSES Settings', 'icshd-geniuses'); ?></h1>
    
    <form method="post" action="">
        <?php wp_nonce_field('icshd_geniuses_settings', 'icshd_geniuses_settings_nonce'); ?>
        
        <!-- API Configuration -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('API Configuration', 'icshd-geniuses'); ?></h2>
            <div class="inside">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="api_base_url"><?php _e('API Base URL', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <input type="url" 
                                   id="api_base_url" 
                                   name="icshd_geniuses[api_base_url]" 
                                   value="<?php echo esc_attr($settings['api_base_url']); ?>" 
                                   class="regular-text" 
                                   required />
                            <p class="description">
                                <?php _e('The base URL for the GENIUSES backend API (e.g., http://localhost:5000/api)', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="frontend_url"><?php _e('Frontend URL', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <input type="url" 
                                   id="frontend_url" 
                                   name="icshd_geniuses[frontend_url]" 
                                   value="<?php echo esc_attr($settings['frontend_url']); ?>" 
                                   class="regular-text" 
                                   required />
                            <p class="description">
                                <?php _e('The URL where the React frontend is hosted (e.g., http://localhost:3000)', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="jwt_secret"><?php _e('JWT Secret Key', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <input type="text" 
                                   id="jwt_secret" 
                                   name="icshd_geniuses[jwt_secret]" 
                                   value="<?php echo esc_attr($settings['jwt_secret']); ?>" 
                                   class="regular-text" 
                                   required />
                            <button type="button" class="button" onclick="generateJWTSecret()">
                                <?php _e('Generate New Secret', 'icshd-geniuses'); ?>
                            </button>
                            <p class="description">
                                <?php _e('Secret key used for JWT token encryption. Keep this secure!', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- API Connection Test -->
                <div class="icshd-api-test">
                    <h4><?php _e('Connection Test', 'icshd-geniuses'); ?></h4>
                    <p>
                        <button type="button" class="button" onclick="testConnection()">
                            <?php _e('Test API Connection', 'icshd-geniuses'); ?>
                        </button>
                        <span id="connection-result">
                            <?php if ($api_status['success']): ?>
                                <span style="color: green;">✓ <?php _e('Connected', 'icshd-geniuses'); ?></span>
                            <?php else: ?>
                                <span style="color: red;">✗ <?php _e('Disconnected', 'icshd-geniuses'); ?></span>
                            <?php endif; ?>
                        </span>
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Authentication Settings -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('Authentication Settings', 'icshd-geniuses'); ?></h2>
            <div class="inside">
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Enable SSO', 'icshd-geniuses'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" 
                                       name="icshd_geniuses[enable_sso]" 
                                       value="1" 
                                       <?php checked($settings['enable_sso']); ?> />
                                <?php _e('Enable Single Sign-On with GENIUSES backend', 'icshd-geniuses'); ?>
                            </label>
                            <p class="description">
                                <?php _e('When enabled, users can authenticate using their GENIUSES credentials.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Auto Create Users', 'icshd-geniuses'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" 
                                       name="icshd_geniuses[auto_create_users]" 
                                       value="1" 
                                       <?php checked($settings['auto_create_users']); ?> />
                                <?php _e('Automatically create WordPress users from GENIUSES users', 'icshd-geniuses'); ?>
                            </label>
                            <p class="description">
                                <?php _e('When enabled, new WordPress users will be created automatically when they log in via GENIUSES.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="allowed_roles"><?php _e('Allowed Roles', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <?php
                            $allowed_roles = $settings['allowed_roles'];
                            $available_roles = array(
                                'student' => __('Student', 'icshd-geniuses'),
                                'trainer' => __('Trainer', 'icshd-geniuses'),
                                'admin' => __('Administrator', 'icshd-geniuses')
                            );
                            ?>
                            <?php foreach ($available_roles as $role => $label): ?>
                            <label style="display: block; margin-bottom: 5px;">
                                <input type="checkbox" 
                                       name="icshd_geniuses[allowed_roles][]" 
                                       value="<?php echo esc_attr($role); ?>" 
                                       <?php checked(in_array($role, $allowed_roles)); ?> />
                                <?php echo esc_html($label); ?>
                            </label>
                            <?php endforeach; ?>
                            <p class="description">
                                <?php _e('Select which roles are allowed to access GENIUSES features.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Default Settings -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('Default Settings', 'icshd-geniuses'); ?></h2>
            <div class="inside">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="default_curriculum"><?php _e('Default Curriculum', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="default_curriculum" name="icshd_geniuses[default_curriculum]">
                                <option value="soroban" <?php selected($settings['default_curriculum'], 'soroban'); ?>>
                                    <?php _e('Soroban (Abacus)', 'icshd-geniuses'); ?>
                                </option>
                                <option value="vedic" <?php selected($settings['default_curriculum'], 'vedic'); ?>>
                                    <?php _e('Vedic Mathematics', 'icshd-geniuses'); ?>
                                </option>
                                <option value="logic" <?php selected($settings['default_curriculum'], 'logic'); ?>>
                                    <?php _e('Logic & Reasoning', 'icshd-geniuses'); ?>
                                </option>
                                <option value="iqgames" <?php selected($settings['default_curriculum'], 'iqgames'); ?>>
                                    <?php _e('IQ Games', 'icshd-geniuses'); ?>
                                </option>
                            </select>
                            <p class="description">
                                <?php _e('The default curriculum for new users and shortcodes.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Advanced Settings -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('Advanced Settings', 'icshd-geniuses'); ?></h2>
            <div class="inside">
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Debug Mode', 'icshd-geniuses'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" 
                                       name="icshd_geniuses[debug_mode]" 
                                       value="1" 
                                       <?php checked(isset($settings['debug_mode']) && $settings['debug_mode']); ?> />
                                <?php _e('Enable debug logging', 'icshd-geniuses'); ?>
                            </label>
                            <p class="description">
                                <?php _e('When enabled, detailed logs will be written to the WordPress error log.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="cache_duration"><?php _e('Cache Duration', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="cache_duration" name="icshd_geniuses[cache_duration]">
                                <option value="300" <?php selected($settings['cache_duration'] ?? 300, 300); ?>>
                                    <?php _e('5 minutes', 'icshd-geniuses'); ?>
                                </option>
                                <option value="600" <?php selected($settings['cache_duration'] ?? 300, 600); ?>>
                                    <?php _e('10 minutes', 'icshd-geniuses'); ?>
                                </option>
                                <option value="1800" <?php selected($settings['cache_duration'] ?? 300, 1800); ?>>
                                    <?php _e('30 minutes', 'icshd-geniuses'); ?>
                                </option>
                                <option value="3600" <?php selected($settings['cache_duration'] ?? 300, 3600); ?>>
                                    <?php _e('1 hour', 'icshd-geniuses'); ?>
                                </option>
                            </select>
                            <p class="description">
                                <?php _e('How long to cache API responses.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Submit Buttons -->
        <p class="submit">
            <input type="submit" name="submit" class="button-primary" value="<?php _e('Save Settings', 'icshd-geniuses'); ?>" />
            <button type="button" class="button" onclick="clearCache()">
                <?php _e('Clear Cache', 'icshd-geniuses'); ?>
            </button>
        </p>
    </form>
    
    <!-- Reset Settings Form -->
    <div class="postbox" style="margin-top: 20px;">
        <h2 class="hndle" style="color: #d63638;"><?php _e('Danger Zone', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <p><?php _e('Reset all settings to their default values. This action cannot be undone.', 'icshd-geniuses'); ?></p>
            <form method="post" action="" onsubmit="return confirm('<?php _e('Are you sure you want to reset all settings? This cannot be undone.', 'icshd-geniuses'); ?>')">
                <?php wp_nonce_field('icshd_geniuses_reset', 'icshd_geniuses_reset_nonce'); ?>
                <input type="submit" name="reset" class="button button-secondary" value="<?php _e('Reset to Defaults', 'icshd-geniuses'); ?>" />
            </form>
        </div>
    </div>
    
    <!-- Export/Import Settings -->
    <div class="postbox" style="margin-top: 20px;">
        <h2 class="hndle"><?php _e('Export/Import Settings', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <table class="form-table">
                <tr>
                    <th scope="row"><?php _e('Export Settings', 'icshd-geniuses'); ?></th>
                    <td>
                        <button type="button" class="button" onclick="exportSettings()">
                            <?php _e('Export Settings', 'icshd-geniuses'); ?>
                        </button>
                        <p class="description">
                            <?php _e('Download your current settings as a JSON file.', 'icshd-geniuses'); ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><?php _e('Import Settings', 'icshd-geniuses'); ?></th>
                    <td>
                        <input type="file" id="import-file" accept=".json" />
                        <button type="button" class="button" onclick="importSettings()">
                            <?php _e('Import Settings', 'icshd-geniuses'); ?>
                        </button>
                        <p class="description">
                            <?php _e('Upload a JSON file to import settings.', 'icshd-geniuses'); ?>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</div>

<style>
.icshd-api-test {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 5px;
    margin-top: 20px;
}

.icshd-loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #0073aa;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>

<script>
function generateJWTSecret() {
    const length = 32;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    
    for (let i = 0; i < length; i++) {
        secret += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    document.getElementById('jwt_secret').value = secret;
}

function testConnection() {
    const resultElement = document.getElementById('connection-result');
    resultElement.innerHTML = '<span class="icshd-loading"></span>';
    
    const apiUrl = document.getElementById('api_base_url').value;
    
    if (!apiUrl) {
        resultElement.innerHTML = '<span style="color: red;">✗ Please enter API URL first</span>';
        return;
    }
    
    const data = new FormData();
    data.append('action', 'icshd_test_connection');
    data.append('api_url', apiUrl);
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            resultElement.innerHTML = '<span style="color: green;">✓ ' + result.data.message + '</span>';
        } else {
            resultElement.innerHTML = '<span style="color: red;">✗ ' + result.data + '</span>';
        }
    })
    .catch(error => {
        resultElement.innerHTML = '<span style="color: red;">✗ Connection failed</span>';
        console.error('Connection test error:', error);
    });
}

function clearCache() {
    const data = new FormData();
    data.append('action', 'icshd_clear_cache');
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('<?php _e('Cache cleared successfully!', 'icshd-geniuses'); ?>');
        } else {
            alert('<?php _e('Failed to clear cache.', 'icshd-geniuses'); ?>');
        }
    })
    .catch(error => {
        alert('<?php _e('Failed to clear cache.', 'icshd-geniuses'); ?>');
        console.error('Clear cache error:', error);
    });
}

function exportSettings() {
    const data = new FormData();
    data.append('action', 'icshd_export_settings');
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'icshd-geniuses-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('<?php _e('Failed to export settings.', 'icshd-geniuses'); ?>');
        }
    })
    .catch(error => {
        alert('<?php _e('Failed to export settings.', 'icshd-geniuses'); ?>');
        console.error('Export error:', error);
    });
}

function importSettings() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('<?php _e('Please select a file to import.', 'icshd-geniuses'); ?>');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const settings = JSON.parse(e.target.result);
            
            const data = new FormData();
            data.append('action', 'icshd_import_settings');
            data.append('settings', JSON.stringify(settings));
            data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
            
            fetch(ajaxurl, {
                method: 'POST',
                body: data
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('<?php _e('Settings imported successfully!', 'icshd-geniuses'); ?>');
                    location.reload();
                } else {
                    alert('<?php _e('Failed to import settings:', 'icshd-geniuses'); ?> ' + result.data);
                }
            })
            .catch(error => {
                alert('<?php _e('Failed to import settings.', 'icshd-geniuses'); ?>');
                console.error('Import error:', error);
            });
        } catch (error) {
            alert('<?php _e('Invalid JSON file.', 'icshd-geniuses'); ?>');
        }
    };
    
    reader.readAsText(file);
}
</script>
