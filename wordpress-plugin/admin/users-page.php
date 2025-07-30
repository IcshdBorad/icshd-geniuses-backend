<?php
/**
 * Users Management Page for ICSHD GENIUSES WordPress Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check user permissions
if (!current_user_can('manage_options')) {
    wp_die(__('You do not have sufficient permissions to access this page.'));
}

// Get sync statistics
$sync_stats = array();
if (class_exists('ICSHD_Geniuses_User_Sync')) {
    $user_sync = new ICSHD_Geniuses_User_Sync(icshd_geniuses_get_settings());
    $sync_stats = $user_sync->get_sync_statistics();
}

// Get GENIUSES users
$geniuses_users = get_users(array(
    'meta_key' => 'icshd_geniuses_role',
    'meta_compare' => 'EXISTS',
    'orderby' => 'registered',
    'order' => 'DESC'
));

// Handle bulk actions
if (isset($_POST['action']) && $_POST['action'] !== '-1' && isset($_POST['users']) && is_array($_POST['users'])) {
    $action = sanitize_text_field($_POST['action']);
    $user_ids = array_map('intval', $_POST['users']);
    
    if (wp_verify_nonce($_POST['bulk_action_nonce'], 'icshd_geniuses_bulk_action')) {
        switch ($action) {
            case 'sync':
                $synced = 0;
                foreach ($user_ids as $user_id) {
                    $user = get_user_by('ID', $user_id);
                    if ($user && $user_sync->sync_user_to_backend($user)) {
                        $synced++;
                    }
                }
                echo '<div class="notice notice-success"><p>' . 
                     sprintf(__('Successfully synced %d users.', 'icshd-geniuses'), $synced) . 
                     '</p></div>';
                break;
                
            case 'delete_geniuses_data':
                foreach ($user_ids as $user_id) {
                    delete_user_meta($user_id, 'icshd_geniuses_role');
                    delete_user_meta($user_id, 'icshd_geniuses_user_id');
                    delete_user_meta($user_id, 'icshd_geniuses_curriculum');
                    delete_user_meta($user_id, 'icshd_geniuses_level');
                    delete_user_meta($user_id, 'icshd_geniuses_last_sync');
                }
                echo '<div class="notice notice-success"><p>' . 
                     sprintf(__('Removed GENIUSES data for %d users.', 'icshd-geniuses'), count($user_ids)) . 
                     '</p></div>';
                break;
        }
    }
}
?>

<div class="wrap">
    <h1><?php _e('ICSHD GENIUSES Users', 'icshd-geniuses'); ?></h1>
    
    <!-- Sync Statistics -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Synchronization Statistics', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <div class="icshd-sync-stats">
                <div class="stat-item">
                    <span class="stat-number"><?php echo number_format($sync_stats['total_users'] ?? 0); ?></span>
                    <span class="stat-label"><?php _e('Total Users', 'icshd-geniuses'); ?></span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?php echo number_format($sync_stats['synced_users'] ?? 0); ?></span>
                    <span class="stat-label"><?php _e('Synced', 'icshd-geniuses'); ?></span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?php echo number_format($sync_stats['error_users'] ?? 0); ?></span>
                    <span class="stat-label"><?php _e('Errors', 'icshd-geniuses'); ?></span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?php echo number_format($sync_stats['pending_users'] ?? 0); ?></span>
                    <span class="stat-label"><?php _e('Pending', 'icshd-geniuses'); ?></span>
                </div>
            </div>
            
            <div class="sync-actions">
                <button type="button" class="button button-primary" onclick="syncAllUsers()">
                    <?php _e('Sync All Users', 'icshd-geniuses'); ?>
                </button>
                <button type="button" class="button" onclick="refreshStats()">
                    <?php _e('Refresh Statistics', 'icshd-geniuses'); ?>
                </button>
                <?php if (isset($sync_stats['last_sync']['timestamp'])): ?>
                <p class="description">
                    <?php 
                    printf(
                        __('Last sync: %s', 'icshd-geniuses'), 
                        date('Y-m-d H:i:s', strtotime($sync_stats['last_sync']['timestamp']))
                    ); 
                    ?>
                </p>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- Users List -->
    <form method="post" action="">
        <?php wp_nonce_field('icshd_geniuses_bulk_action', 'bulk_action_nonce'); ?>
        
        <div class="tablenav top">
            <div class="alignleft actions bulkactions">
                <select name="action" id="bulk-action-selector-top">
                    <option value="-1"><?php _e('Bulk Actions', 'icshd-geniuses'); ?></option>
                    <option value="sync"><?php _e('Sync with Backend', 'icshd-geniuses'); ?></option>
                    <option value="delete_geniuses_data"><?php _e('Remove GENIUSES Data', 'icshd-geniuses'); ?></option>
                </select>
                <input type="submit" class="button action" value="<?php _e('Apply', 'icshd-geniuses'); ?>" />
            </div>
            
            <div class="alignright">
                <input type="text" id="user-search" placeholder="<?php _e('Search users...', 'icshd-geniuses'); ?>" />
            </div>
        </div>
        
        <table class="wp-list-table widefat fixed striped users">
            <thead>
                <tr>
                    <td class="manage-column column-cb check-column">
                        <input type="checkbox" id="cb-select-all-1" />
                    </td>
                    <th class="manage-column column-username"><?php _e('User', 'icshd-geniuses'); ?></th>
                    <th class="manage-column column-role"><?php _e('GENIUSES Role', 'icshd-geniuses'); ?></th>
                    <th class="manage-column column-curriculum"><?php _e('Curriculum', 'icshd-geniuses'); ?></th>
                    <th class="manage-column column-level"><?php _e('Level', 'icshd-geniuses'); ?></th>
                    <th class="manage-column column-sync"><?php _e('Sync Status', 'icshd-geniuses'); ?></th>
                    <th class="manage-column column-actions"><?php _e('Actions', 'icshd-geniuses'); ?></th>
                </tr>
            </thead>
            <tbody id="the-list">
                <?php if (!empty($geniuses_users)): ?>
                    <?php foreach ($geniuses_users as $user): ?>
                        <?php
                        $geniuses_role = get_user_meta($user->ID, 'icshd_geniuses_role', true);
                        $curriculum = get_user_meta($user->ID, 'icshd_geniuses_curriculum', true);
                        $level = get_user_meta($user->ID, 'icshd_geniuses_level', true);
                        $geniuses_user_id = get_user_meta($user->ID, 'icshd_geniuses_user_id', true);
                        $last_sync = get_user_meta($user->ID, 'icshd_geniuses_last_sync', true);
                        $last_login = get_user_meta($user->ID, 'icshd_geniuses_last_login', true);
                        
                        // Get sync status
                        global $wpdb;
                        $sync_table = $wpdb->prefix . 'icshd_geniuses_user_sync';
                        $sync_status = 'never';
                        if ($wpdb->get_var("SHOW TABLES LIKE '$sync_table'") == $sync_table) {
                            $sync_record = $wpdb->get_row($wpdb->prepare(
                                "SELECT sync_status FROM $sync_table WHERE wp_user_id = %d",
                                $user->ID
                            ));
                            if ($sync_record) {
                                $sync_status = $sync_record->sync_status;
                            }
                        }
                        ?>
                        <tr class="user-row" data-user-id="<?php echo $user->ID; ?>">
                            <th scope="row" class="check-column">
                                <input type="checkbox" name="users[]" value="<?php echo $user->ID; ?>" />
                            </th>
                            <td class="username column-username">
                                <strong>
                                    <a href="<?php echo get_edit_user_link($user->ID); ?>">
                                        <?php echo esc_html($user->display_name); ?>
                                    </a>
                                </strong>
                                <br />
                                <span class="description"><?php echo esc_html($user->user_email); ?></span>
                                <?php if ($geniuses_user_id): ?>
                                <br />
                                <small>GENIUSES ID: <?php echo esc_html($geniuses_user_id); ?></small>
                                <?php endif; ?>
                            </td>
                            <td class="role column-role">
                                <span class="role-badge role-<?php echo esc_attr($geniuses_role); ?>">
                                    <?php echo esc_html(icshd_geniuses_get_role_name($geniuses_role)); ?>
                                </span>
                            </td>
                            <td class="curriculum column-curriculum">
                                <?php echo $curriculum ? esc_html(icshd_geniuses_get_curriculum_name($curriculum)) : '—'; ?>
                            </td>
                            <td class="level column-level">
                                <?php echo $level ? esc_html(icshd_geniuses_get_level_name($level)) : '—'; ?>
                            </td>
                            <td class="sync column-sync">
                                <span class="sync-status sync-<?php echo esc_attr($sync_status); ?>">
                                    <?php
                                    switch ($sync_status) {
                                        case 'success':
                                            echo '<span class="dashicons dashicons-yes-alt"></span> ' . __('Synced', 'icshd-geniuses');
                                            break;
                                        case 'error':
                                            echo '<span class="dashicons dashicons-dismiss"></span> ' . __('Error', 'icshd-geniuses');
                                            break;
                                        case 'pending':
                                            echo '<span class="dashicons dashicons-clock"></span> ' . __('Pending', 'icshd-geniuses');
                                            break;
                                        default:
                                            echo '<span class="dashicons dashicons-minus"></span> ' . __('Never', 'icshd-geniuses');
                                    }
                                    ?>
                                </span>
                                <?php if ($last_sync): ?>
                                <br />
                                <small><?php echo date('Y-m-d H:i', strtotime($last_sync)); ?></small>
                                <?php endif; ?>
                            </td>
                            <td class="actions column-actions">
                                <button type="button" class="button button-small" onclick="syncUser(<?php echo $user->ID; ?>)">
                                    <?php _e('Sync', 'icshd-geniuses'); ?>
                                </button>
                                <button type="button" class="button button-small" onclick="viewUserDetails(<?php echo $user->ID; ?>)">
                                    <?php _e('Details', 'icshd-geniuses'); ?>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="7" class="no-items">
                            <?php _e('No GENIUSES users found.', 'icshd-geniuses'); ?>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </form>
    
    <!-- Add New User -->
    <div class="postbox" style="margin-top: 20px;">
        <h2 class="hndle"><?php _e('Add New GENIUSES User', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <form id="add-user-form">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="new-user-select"><?php _e('Select WordPress User', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="new-user-select" name="user_id" style="width: 300px;">
                                <option value=""><?php _e('Select a user...', 'icshd-geniuses'); ?></option>
                                <?php
                                $non_geniuses_users = get_users(array(
                                    'meta_query' => array(
                                        array(
                                            'key' => 'icshd_geniuses_role',
                                            'compare' => 'NOT EXISTS'
                                        )
                                    )
                                ));
                                foreach ($non_geniuses_users as $user):
                                ?>
                                <option value="<?php echo $user->ID; ?>">
                                    <?php echo esc_html($user->display_name . ' (' . $user->user_email . ')'); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="new-user-role"><?php _e('GENIUSES Role', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="new-user-role" name="geniuses_role">
                                <option value="student"><?php _e('Student', 'icshd-geniuses'); ?></option>
                                <option value="trainer"><?php _e('Trainer', 'icshd-geniuses'); ?></option>
                                <option value="admin"><?php _e('Administrator', 'icshd-geniuses'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="new-user-curriculum"><?php _e('Default Curriculum', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="new-user-curriculum" name="curriculum">
                                <option value="soroban"><?php _e('Soroban (Abacus)', 'icshd-geniuses'); ?></option>
                                <option value="vedic"><?php _e('Vedic Mathematics', 'icshd-geniuses'); ?></option>
                                <option value="logic"><?php _e('Logic & Reasoning', 'icshd-geniuses'); ?></option>
                                <option value="iqgames"><?php _e('IQ Games', 'icshd-geniuses'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="new-user-level"><?php _e('Starting Level', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="new-user-level" name="level">
                                <?php for ($i = 1; $i <= 10; $i++): ?>
                                <option value="<?php echo $i; ?>" <?php selected($i, 1); ?>>
                                    <?php echo esc_html(icshd_geniuses_get_level_name($i)); ?>
                                </option>
                                <?php endfor; ?>
                            </select>
                        </td>
                    </tr>
                </table>
                <p class="submit">
                    <button type="button" class="button button-primary" onclick="addGeniusesUser()">
                        <?php _e('Add User', 'icshd-geniuses'); ?>
                    </button>
                </p>
            </form>
        </div>
    </div>
</div>

<!-- User Details Modal -->
<div id="user-details-modal" class="icshd-modal" style="display: none;">
    <div class="icshd-modal-content">
        <div class="icshd-modal-header">
            <h2><?php _e('User Details', 'icshd-geniuses'); ?></h2>
            <span class="icshd-modal-close" onclick="closeUserDetails()">&times;</span>
        </div>
        <div class="icshd-modal-body" id="user-details-content">
            <!-- Content will be loaded here -->
        </div>
    </div>
</div>

<style>
.icshd-sync-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 5px;
}

.stat-number {
    display: block;
    font-size: 2em;
    font-weight: bold;
    color: #0073aa;
}

.stat-label {
    display: block;
    color: #666;
    font-size: 0.9em;
}

.sync-actions {
    border-top: 1px solid #ddd;
    padding-top: 15px;
}

.role-badge {
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 0.85em;
    font-weight: bold;
}

.role-student { background: #e1f5fe; color: #0277bd; }
.role-trainer { background: #f3e5f5; color: #7b1fa2; }
.role-admin { background: #ffebee; color: #c62828; }

.sync-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.sync-success { color: #2e7d32; }
.sync-error { color: #d32f2f; }
.sync-pending { color: #f57c00; }
.sync-never { color: #666; }

.icshd-modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.icshd-modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 0;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
    border-radius: 5px;
}

.icshd-modal-header {
    padding: 15px 20px;
    background-color: #f1f1f1;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.icshd-modal-header h2 {
    margin: 0;
}

.icshd-modal-close {
    color: #aaa;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.icshd-modal-close:hover {
    color: #000;
}

.icshd-modal-body {
    padding: 20px;
}

#user-search {
    width: 200px;
    padding: 5px;
}
</style>

<script>
// Select all checkbox functionality
document.getElementById('cb-select-all-1').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('input[name="users[]"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});

// User search functionality
document.getElementById('user-search').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('.user-row');
    
    rows.forEach(row => {
        const username = row.querySelector('.username').textContent.toLowerCase();
        const email = row.querySelector('.username .description').textContent.toLowerCase();
        
        if (username.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

function syncAllUsers() {
    if (!confirm('<?php _e('Are you sure you want to sync all users?', 'icshd-geniuses'); ?>')) {
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
            alert(result.data.message);
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

function syncUser(userId) {
    const data = new FormData();
    data.append('action', 'icshd_sync_single_user');
    data.append('user_id', userId);
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('<?php _e('User synced successfully!', 'icshd-geniuses'); ?>');
            location.reload();
        } else {
            alert('<?php _e('Sync failed:', 'icshd-geniuses'); ?> ' + result.data);
        }
    })
    .catch(error => {
        alert('<?php _e('Sync failed. Please try again.', 'icshd-geniuses'); ?>');
        console.error('Sync error:', error);
    });
}

function viewUserDetails(userId) {
    const modal = document.getElementById('user-details-modal');
    const content = document.getElementById('user-details-content');
    
    content.innerHTML = '<p><?php _e('Loading...', 'icshd-geniuses'); ?></p>';
    modal.style.display = 'block';
    
    const data = new FormData();
    data.append('action', 'icshd_get_user_details');
    data.append('user_id', userId);
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            content.innerHTML = result.data.html;
        } else {
            content.innerHTML = '<p><?php _e('Failed to load user details.', 'icshd-geniuses'); ?></p>';
        }
    })
    .catch(error => {
        content.innerHTML = '<p><?php _e('Failed to load user details.', 'icshd-geniuses'); ?></p>';
        console.error('Error:', error);
    });
}

function closeUserDetails() {
    document.getElementById('user-details-modal').style.display = 'none';
}

function addGeniusesUser() {
    const form = document.getElementById('add-user-form');
    const formData = new FormData(form);
    formData.append('action', 'icshd_add_geniuses_user');
    formData.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('<?php _e('User added successfully!', 'icshd-geniuses'); ?>');
            location.reload();
        } else {
            alert('<?php _e('Failed to add user:', 'icshd-geniuses'); ?> ' + result.data);
        }
    })
    .catch(error => {
        alert('<?php _e('Failed to add user. Please try again.', 'icshd-geniuses'); ?>');
        console.error('Error:', error);
    });
}

function refreshStats() {
    location.reload();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('user-details-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
</script>
