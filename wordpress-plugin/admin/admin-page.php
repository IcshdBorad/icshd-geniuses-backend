<?php
/**
 * Main Admin Page for ICSHD GENIUSES WordPress Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check user permissions
if (!current_user_can('manage_options')) {
    wp_die(__('You do not have sufficient permissions to access this page.'));
}

// Get plugin statistics
$stats = icshd_geniuses_get_statistics();
$api_status = icshd_geniuses_check_api_status();
$settings = icshd_geniuses_get_settings();
?>

<div class="wrap">
    <h1><?php _e('ICSHD GENIUSES Dashboard', 'icshd-geniuses'); ?></h1>
    
    <?php
    // Display configuration issues if any
    $issues = icshd_geniuses_get_config_issues();
    if (!empty($issues)) {
        echo '<div class="notice notice-error"><p>';
        echo '<strong>' . __('Configuration Issues:', 'icshd-geniuses') . '</strong><br>';
        echo implode('<br>', $issues);
        echo '</p></div>';
    }
    ?>
    
    <!-- API Status -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('API Connection Status', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <table class="form-table">
                <tr>
                    <th><?php _e('Status', 'icshd-geniuses'); ?></th>
                    <td>
                        <?php if ($api_status['success']): ?>
                            <span class="dashicons dashicons-yes-alt" style="color: green;"></span>
                            <strong style="color: green;"><?php _e('Connected', 'icshd-geniuses'); ?></strong>
                        <?php else: ?>
                            <span class="dashicons dashicons-dismiss" style="color: red;"></span>
                            <strong style="color: red;"><?php _e('Disconnected', 'icshd-geniuses'); ?></strong>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th><?php _e('API URL', 'icshd-geniuses'); ?></th>
                    <td><code><?php echo esc_html($settings['api_base_url']); ?></code></td>
                </tr>
                <?php if ($api_status['success']): ?>
                <tr>
                    <th><?php _e('Response Time', 'icshd-geniuses'); ?></th>
                    <td><?php echo esc_html($api_status['response_time']); ?> ms</td>
                </tr>
                <tr>
                    <th><?php _e('API Version', 'icshd-geniuses'); ?></th>
                    <td><?php echo esc_html($api_status['api_version'] ?? 'Unknown'); ?></td>
                </tr>
                <?php else: ?>
                <tr>
                    <th><?php _e('Error Message', 'icshd-geniuses'); ?></th>
                    <td style="color: red;"><?php echo esc_html($api_status['message']); ?></td>
                </tr>
                <?php endif; ?>
            </table>
            
            <p>
                <button type="button" class="button" onclick="testApiConnection()">
                    <?php _e('Test Connection', 'icshd-geniuses'); ?>
                </button>
                <span id="api-test-result"></span>
            </p>
        </div>
    </div>
    
    <!-- Statistics Overview -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Statistics Overview', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <div class="icshd-stats-grid">
                <div class="icshd-stat-card">
                    <h3><?php echo number_format($stats['users']['total']); ?></h3>
                    <p><?php _e('Total Users', 'icshd-geniuses'); ?></p>
                </div>
                
                <div class="icshd-stat-card">
                    <h3><?php echo number_format($stats['users']['students']); ?></h3>
                    <p><?php _e('Students', 'icshd-geniuses'); ?></p>
                </div>
                
                <div class="icshd-stat-card">
                    <h3><?php echo number_format($stats['users']['trainers']); ?></h3>
                    <p><?php _e('Trainers', 'icshd-geniuses'); ?></p>
                </div>
                
                <div class="icshd-stat-card">
                    <h3><?php echo number_format($stats['sync']['synced']); ?></h3>
                    <p><?php _e('Synced Users', 'icshd-geniuses'); ?></p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Quick Actions', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <div class="icshd-actions-grid">
                <div class="icshd-action-card">
                    <h4><?php _e('User Management', 'icshd-geniuses'); ?></h4>
                    <p><?php _e('Manage users and synchronization', 'icshd-geniuses'); ?></p>
                    <a href="<?php echo admin_url('admin.php?page=icshd-geniuses-users'); ?>" class="button button-primary">
                        <?php _e('Manage Users', 'icshd-geniuses'); ?>
                    </a>
                </div>
                
                <div class="icshd-action-card">
                    <h4><?php _e('Settings', 'icshd-geniuses'); ?></h4>
                    <p><?php _e('Configure plugin settings', 'icshd-geniuses'); ?></p>
                    <a href="<?php echo admin_url('admin.php?page=icshd-geniuses-settings'); ?>" class="button button-primary">
                        <?php _e('Settings', 'icshd-geniuses'); ?>
                    </a>
                </div>
                
                <div class="icshd-action-card">
                    <h4><?php _e('Reports', 'icshd-geniuses'); ?></h4>
                    <p><?php _e('View reports and analytics', 'icshd-geniuses'); ?></p>
                    <a href="<?php echo admin_url('admin.php?page=icshd-geniuses-reports'); ?>" class="button button-primary">
                        <?php _e('View Reports', 'icshd-geniuses'); ?>
                    </a>
                </div>
                
                <div class="icshd-action-card">
                    <h4><?php _e('Sync All Users', 'icshd-geniuses'); ?></h4>
                    <p><?php _e('Synchronize all users with backend', 'icshd-geniuses'); ?></p>
                    <button type="button" class="button button-secondary" onclick="syncAllUsers()">
                        <?php _e('Sync Now', 'icshd-geniuses'); ?>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Recent Activity', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <?php
            $recent_logs = icshd_geniuses_get_activity_logs(10);
            if (!empty($recent_logs)):
            ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Time', 'icshd-geniuses'); ?></th>
                        <th><?php _e('User', 'icshd-geniuses'); ?></th>
                        <th><?php _e('Action', 'icshd-geniuses'); ?></th>
                        <th><?php _e('Details', 'icshd-geniuses'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_logs as $log): ?>
                    <tr>
                        <td><?php echo esc_html(date('Y-m-d H:i:s', strtotime($log['timestamp']))); ?></td>
                        <td>
                            <?php
                            $user = get_user_by('ID', $log['user_id']);
                            echo $user ? esc_html($user->display_name) : __('Unknown', 'icshd-geniuses');
                            ?>
                        </td>
                        <td><?php echo esc_html($log['action']); ?></td>
                        <td><?php echo esc_html(is_array($log['details']) ? json_encode($log['details']) : $log['details']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else: ?>
            <p><?php _e('No recent activity found.', 'icshd-geniuses'); ?></p>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- System Information -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('System Information', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <table class="form-table">
                <tr>
                    <th><?php _e('Plugin Version', 'icshd-geniuses'); ?></th>
                    <td><?php echo ICSHD_GENIUSES_VERSION; ?></td>
                </tr>
                <tr>
                    <th><?php _e('WordPress Version', 'icshd-geniuses'); ?></th>
                    <td><?php echo get_bloginfo('version'); ?></td>
                </tr>
                <tr>
                    <th><?php _e('PHP Version', 'icshd-geniuses'); ?></th>
                    <td><?php echo PHP_VERSION; ?></td>
                </tr>
                <tr>
                    <th><?php _e('Frontend URL', 'icshd-geniuses'); ?></th>
                    <td><code><?php echo esc_html($settings['frontend_url']); ?></code></td>
                </tr>
                <tr>
                    <th><?php _e('SSO Enabled', 'icshd-geniuses'); ?></th>
                    <td><?php echo $settings['enable_sso'] ? __('Yes', 'icshd-geniuses') : __('No', 'icshd-geniuses'); ?></td>
                </tr>
                <tr>
                    <th><?php _e('Default Curriculum', 'icshd-geniuses'); ?></th>
                    <td><?php echo esc_html(icshd_geniuses_get_curriculum_name($settings['default_curriculum'])); ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

<style>
.icshd-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.icshd-stat-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #ddd;
}

.icshd-stat-card h3 {
    font-size: 2em;
    margin: 0 0 10px 0;
    color: #0073aa;
}

.icshd-stat-card p {
    margin: 0;
    color: #666;
}

.icshd-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.icshd-action-card {
    background: #fff;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.icshd-action-card h4 {
    margin: 0 0 10px 0;
    color: #23282d;
}

.icshd-action-card p {
    margin: 0 0 15px 0;
    color: #666;
}

#api-test-result {
    margin-left: 10px;
    font-weight: bold;
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
function testApiConnection() {
    const resultElement = document.getElementById('api-test-result');
    resultElement.innerHTML = '<span class="icshd-loading"></span>';
    
    const data = new FormData();
    data.append('action', 'icshd_test_api_connection');
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
        
        // Refresh page after 2 seconds to update status
        setTimeout(() => {
            location.reload();
        }, 2000);
    })
    .catch(error => {
        resultElement.innerHTML = '<span style="color: red;">✗ Connection test failed</span>';
        console.error('API test error:', error);
    });
}

function syncAllUsers() {
    if (!confirm('<?php _e('Are you sure you want to sync all users? This may take some time.', 'icshd-geniuses'); ?>')) {
        return;
    }
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '<?php _e('Syncing...', 'icshd-geniuses'); ?>';
    button.disabled = true;
    
    const data = new FormData();
    data.append('action', 'icshd_sync_all_users');
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('<?php _e('Sync completed successfully!', 'icshd-geniuses'); ?>\n' + result.data.message);
            location.reload();
        } else {
            alert('<?php _e('Sync failed:', 'icshd-geniuses'); ?> ' + result.data);
        }
    })
    .catch(error => {
        alert('<?php _e('Sync failed. Please try again.', 'icshd-geniuses'); ?>');
        console.error('Sync error:', error);
    })
    .finally(() => {
        button.textContent = originalText;
        button.disabled = false;
    });
}

// Add AJAX handlers
jQuery(document).ready(function($) {
    // Test API connection handler
    $(document).on('wp_ajax_icshd_test_api_connection', function() {
        // This will be handled by the API client
    });
});
</script>
