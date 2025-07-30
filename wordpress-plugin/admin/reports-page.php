<?php
/**
 * Reports Page for ICSHD GENIUSES WordPress Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check user permissions
if (!current_user_can('manage_options')) {
    wp_die(__('You do not have sufficient permissions to access this page.'));
}

// Get API client
$api_client = new ICSHD_Geniuses_API_Client(icshd_geniuses_get_settings());

// Handle report generation
if (isset($_POST['generate_report']) && wp_verify_nonce($_POST['report_nonce'], 'icshd_geniuses_report')) {
    $report_type = sanitize_text_field($_POST['report_type']);
    $date_from = sanitize_text_field($_POST['date_from']);
    $date_to = sanitize_text_field($_POST['date_to']);
    $format = sanitize_text_field($_POST['format']);
    $filters = array();
    
    // Add filters based on report type
    if (isset($_POST['curriculum']) && !empty($_POST['curriculum'])) {
        $filters['curriculum'] = sanitize_text_field($_POST['curriculum']);
    }
    
    if (isset($_POST['level']) && !empty($_POST['level'])) {
        $filters['level'] = intval($_POST['level']);
    }
    
    if (isset($_POST['user_role']) && !empty($_POST['user_role'])) {
        $filters['user_role'] = sanitize_text_field($_POST['user_role']);
    }
    
    // Generate report
    $report_data = $api_client->generate_report($report_type, $date_from, $date_to, $filters);
    
    if ($report_data && isset($report_data['success']) && $report_data['success']) {
        // Store report for download
        $report_id = uniqid('report_');
        set_transient('icshd_geniuses_report_' . $report_id, $report_data['data'], 3600); // 1 hour
        
        echo '<div class="notice notice-success"><p>' . 
             __('Report generated successfully!', 'icshd-geniuses') . 
             ' <a href="#" onclick="downloadReport(\'' . $report_id . '\', \'' . $format . '\')">' . 
             __('Download Report', 'icshd-geniuses') . '</a></p></div>';
    } else {
        echo '<div class="notice notice-error"><p>' . 
             __('Failed to generate report. Please check API connection.', 'icshd-geniuses') . 
             '</p></div>';
    }
}

// Get recent reports
$recent_reports = get_option('icshd_geniuses_recent_reports', array());
?>

<div class="wrap">
    <h1><?php _e('ICSHD GENIUSES Reports', 'icshd-geniuses'); ?></h1>
    
    <!-- Quick Stats Dashboard -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Quick Statistics', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <div id="quick-stats-loading" class="icshd-loading-placeholder">
                <p><?php _e('Loading statistics...', 'icshd-geniuses'); ?></p>
            </div>
            <div id="quick-stats-content" style="display: none;">
                <!-- Stats will be loaded here via AJAX -->
            </div>
            <button type="button" class="button" onclick="loadQuickStats()">
                <?php _e('Refresh Statistics', 'icshd-geniuses'); ?>
            </button>
        </div>
    </div>
    
    <!-- Report Generation -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Generate New Report', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <form method="post" action="" id="report-form">
                <?php wp_nonce_field('icshd_geniuses_report', 'report_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="report_type"><?php _e('Report Type', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="report_type" name="report_type" onchange="updateReportOptions()">
                                <option value="performance"><?php _e('Performance Report', 'icshd-geniuses'); ?></option>
                                <option value="progress"><?php _e('Progress Report', 'icshd-geniuses'); ?></option>
                                <option value="sessions"><?php _e('Sessions Report', 'icshd-geniuses'); ?></option>
                                <option value="users"><?php _e('Users Report', 'icshd-geniuses'); ?></option>
                                <option value="adaptive"><?php _e('Adaptive Learning Report', 'icshd-geniuses'); ?></option>
                                <option value="curriculum"><?php _e('Curriculum Analysis', 'icshd-geniuses'); ?></option>
                            </select>
                            <p class="description" id="report-description">
                                <?php _e('Select the type of report you want to generate.', 'icshd-geniuses'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Date Range', 'icshd-geniuses'); ?></th>
                        <td>
                            <input type="date" name="date_from" id="date_from" required />
                            <span><?php _e('to', 'icshd-geniuses'); ?></span>
                            <input type="date" name="date_to" id="date_to" required />
                            <br />
                            <button type="button" class="button" onclick="setDateRange('week')">
                                <?php _e('Last Week', 'icshd-geniuses'); ?>
                            </button>
                            <button type="button" class="button" onclick="setDateRange('month')">
                                <?php _e('Last Month', 'icshd-geniuses'); ?>
                            </button>
                            <button type="button" class="button" onclick="setDateRange('quarter')">
                                <?php _e('Last Quarter', 'icshd-geniuses'); ?>
                            </button>
                        </td>
                    </tr>
                    
                    <tr id="curriculum-filter">
                        <th scope="row">
                            <label for="curriculum"><?php _e('Curriculum Filter', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="curriculum" name="curriculum">
                                <option value=""><?php _e('All Curricula', 'icshd-geniuses'); ?></option>
                                <option value="soroban"><?php _e('Soroban (Abacus)', 'icshd-geniuses'); ?></option>
                                <option value="vedic"><?php _e('Vedic Mathematics', 'icshd-geniuses'); ?></option>
                                <option value="logic"><?php _e('Logic & Reasoning', 'icshd-geniuses'); ?></option>
                                <option value="iqgames"><?php _e('IQ Games', 'icshd-geniuses'); ?></option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr id="level-filter">
                        <th scope="row">
                            <label for="level"><?php _e('Level Filter', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="level" name="level">
                                <option value=""><?php _e('All Levels', 'icshd-geniuses'); ?></option>
                                <?php for ($i = 1; $i <= 10; $i++): ?>
                                <option value="<?php echo $i; ?>">
                                    <?php echo esc_html(icshd_geniuses_get_level_name($i)); ?>
                                </option>
                                <?php endfor; ?>
                            </select>
                        </td>
                    </tr>
                    
                    <tr id="role-filter">
                        <th scope="row">
                            <label for="user_role"><?php _e('User Role Filter', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="user_role" name="user_role">
                                <option value=""><?php _e('All Roles', 'icshd-geniuses'); ?></option>
                                <option value="student"><?php _e('Students', 'icshd-geniuses'); ?></option>
                                <option value="trainer"><?php _e('Trainers', 'icshd-geniuses'); ?></option>
                                <option value="admin"><?php _e('Administrators', 'icshd-geniuses'); ?></option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="format"><?php _e('Export Format', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="format" name="format">
                                <option value="pdf"><?php _e('PDF Document', 'icshd-geniuses'); ?></option>
                                <option value="csv"><?php _e('CSV Spreadsheet', 'icshd-geniuses'); ?></option>
                                <option value="excel"><?php _e('Excel Workbook', 'icshd-geniuses'); ?></option>
                                <option value="json"><?php _e('JSON Data', 'icshd-geniuses'); ?></option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <input type="submit" name="generate_report" class="button-primary" 
                           value="<?php _e('Generate Report', 'icshd-geniuses'); ?>" />
                    <button type="button" class="button" onclick="previewReport()">
                        <?php _e('Preview Report', 'icshd-geniuses'); ?>
                    </button>
                </p>
            </form>
        </div>
    </div>
    
    <!-- Recent Reports -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Recent Reports', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <?php if (!empty($recent_reports)): ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Report Name', 'icshd-geniuses'); ?></th>
                        <th><?php _e('Type', 'icshd-geniuses'); ?></th>
                        <th><?php _e('Date Range', 'icshd-geniuses'); ?></th>
                        <th><?php _e('Generated', 'icshd-geniuses'); ?></th>
                        <th><?php _e('Actions', 'icshd-geniuses'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach (array_slice($recent_reports, 0, 10) as $report): ?>
                    <tr>
                        <td><?php echo esc_html($report['name']); ?></td>
                        <td><?php echo esc_html($report['type']); ?></td>
                        <td><?php echo esc_html($report['date_from'] . ' - ' . $report['date_to']); ?></td>
                        <td><?php echo esc_html(date('Y-m-d H:i', strtotime($report['generated_at']))); ?></td>
                        <td>
                            <?php if (isset($report['file_url'])): ?>
                            <a href="<?php echo esc_url($report['file_url']); ?>" class="button button-small">
                                <?php _e('Download', 'icshd-geniuses'); ?>
                            </a>
                            <?php endif; ?>
                            <button type="button" class="button button-small" 
                                    onclick="regenerateReport('<?php echo esc_js($report['id']); ?>')">
                                <?php _e('Regenerate', 'icshd-geniuses'); ?>
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else: ?>
            <p><?php _e('No reports generated yet.', 'icshd-geniuses'); ?></p>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Scheduled Reports -->
    <div class="postbox">
        <h2 class="hndle"><?php _e('Scheduled Reports', 'icshd-geniuses'); ?></h2>
        <div class="inside">
            <p><?php _e('Set up automatic report generation and delivery.', 'icshd-geniuses'); ?></p>
            
            <form id="schedule-form">
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="schedule_name"><?php _e('Schedule Name', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="schedule_name" name="schedule_name" class="regular-text" />
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="schedule_frequency"><?php _e('Frequency', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <select id="schedule_frequency" name="schedule_frequency">
                                <option value="daily"><?php _e('Daily', 'icshd-geniuses'); ?></option>
                                <option value="weekly"><?php _e('Weekly', 'icshd-geniuses'); ?></option>
                                <option value="monthly"><?php _e('Monthly', 'icshd-geniuses'); ?></option>
                                <option value="quarterly"><?php _e('Quarterly', 'icshd-geniuses'); ?></option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="schedule_email"><?php _e('Email Recipients', 'icshd-geniuses'); ?></label>
                        </th>
                        <td>
                            <textarea id="schedule_email" name="schedule_email" rows="3" class="large-text"
                                      placeholder="<?php _e('Enter email addresses, one per line', 'icshd-geniuses'); ?>"></textarea>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button type="button" class="button button-primary" onclick="createSchedule()">
                        <?php _e('Create Schedule', 'icshd-geniuses'); ?>
                    </button>
                </p>
            </form>
            
            <!-- Existing Schedules -->
            <div id="existing-schedules">
                <!-- Will be loaded via AJAX -->
            </div>
        </div>
    </div>
</div>

<!-- Report Preview Modal -->
<div id="report-preview-modal" class="icshd-modal" style="display: none;">
    <div class="icshd-modal-content" style="width: 90%; max-width: 1000px;">
        <div class="icshd-modal-header">
            <h2><?php _e('Report Preview', 'icshd-geniuses'); ?></h2>
            <span class="icshd-modal-close" onclick="closeReportPreview()">&times;</span>
        </div>
        <div class="icshd-modal-body" id="report-preview-content">
            <!-- Preview content will be loaded here -->
        </div>
        <div class="icshd-modal-footer">
            <button type="button" class="button button-primary" onclick="generateFromPreview()">
                <?php _e('Generate Report', 'icshd-geniuses'); ?>
            </button>
            <button type="button" class="button" onclick="closeReportPreview()">
                <?php _e('Close', 'icshd-geniuses'); ?>
            </button>
        </div>
    </div>
</div>

<style>
.icshd-loading-placeholder {
    text-align: center;
    padding: 40px;
    color: #666;
}

.quick-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.stat-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    border-left: 4px solid #0073aa;
}

.stat-card h3 {
    margin: 0 0 10px 0;
    font-size: 2em;
    color: #0073aa;
}

.stat-card p {
    margin: 0;
    color: #666;
}

.icshd-modal-footer {
    padding: 15px 20px;
    background-color: #f1f1f1;
    border-top: 1px solid #ddd;
    text-align: right;
}

.icshd-modal-footer .button {
    margin-left: 10px;
}

#report-preview-content {
    max-height: 500px;
    overflow-y: auto;
}

.report-preview-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.report-preview-table th,
.report-preview-table td {
    padding: 8px 12px;
    border: 1px solid #ddd;
    text-align: left;
}

.report-preview-table th {
    background-color: #f5f5f5;
    font-weight: bold;
}

.date-range-buttons {
    margin-top: 10px;
}

.date-range-buttons .button {
    margin-right: 10px;
}
</style>

<script>
// Set default date range to last month
document.addEventListener('DOMContentLoaded', function() {
    setDateRange('month');
    loadQuickStats();
    updateReportOptions();
});

function setDateRange(period) {
    const today = new Date();
    const dateFrom = document.getElementById('date_from');
    const dateTo = document.getElementById('date_to');
    
    dateTo.value = today.toISOString().split('T')[0];
    
    switch (period) {
        case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFrom.value = weekAgo.toISOString().split('T')[0];
            break;
        case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            dateFrom.value = monthAgo.toISOString().split('T')[0];
            break;
        case 'quarter':
            const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            dateFrom.value = quarterAgo.toISOString().split('T')[0];
            break;
    }
}

function updateReportOptions() {
    const reportType = document.getElementById('report_type').value;
    const description = document.getElementById('report-description');
    
    const descriptions = {
        'performance': '<?php _e('Analyze student performance metrics and achievements.', 'icshd-geniuses'); ?>',
        'progress': '<?php _e('Track student progress and level advancement.', 'icshd-geniuses'); ?>',
        'sessions': '<?php _e('Detailed analysis of training sessions and activities.', 'icshd-geniuses'); ?>',
        'users': '<?php _e('User statistics and engagement metrics.', 'icshd-geniuses'); ?>',
        'adaptive': '<?php _e('Adaptive learning algorithm effectiveness and adjustments.', 'icshd-geniuses'); ?>',
        'curriculum': '<?php _e('Curriculum effectiveness and completion rates.', 'icshd-geniuses'); ?>'
    };
    
    description.textContent = descriptions[reportType] || '';
}

function loadQuickStats() {
    const loadingDiv = document.getElementById('quick-stats-loading');
    const contentDiv = document.getElementById('quick-stats-content');
    
    loadingDiv.style.display = 'block';
    contentDiv.style.display = 'none';
    
    const data = new FormData();
    data.append('action', 'icshd_get_quick_stats');
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            contentDiv.innerHTML = result.data.html;
            contentDiv.style.display = 'block';
            loadingDiv.style.display = 'none';
        } else {
            loadingDiv.innerHTML = '<p><?php _e('Failed to load statistics.', 'icshd-geniuses'); ?></p>';
        }
    })
    .catch(error => {
        loadingDiv.innerHTML = '<p><?php _e('Failed to load statistics.', 'icshd-geniuses'); ?></p>';
        console.error('Stats error:', error);
    });
}

function previewReport() {
    const form = document.getElementById('report-form');
    const formData = new FormData(form);
    formData.append('action', 'icshd_preview_report');
    formData.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    const modal = document.getElementById('report-preview-modal');
    const content = document.getElementById('report-preview-content');
    
    content.innerHTML = '<p><?php _e('Loading preview...', 'icshd-geniuses'); ?></p>';
    modal.style.display = 'block';
    
    fetch(ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            content.innerHTML = result.data.html;
        } else {
            content.innerHTML = '<p><?php _e('Failed to generate preview.', 'icshd-geniuses'); ?></p>';
        }
    })
    .catch(error => {
        content.innerHTML = '<p><?php _e('Failed to generate preview.', 'icshd-geniuses'); ?></p>';
        console.error('Preview error:', error);
    });
}

function closeReportPreview() {
    document.getElementById('report-preview-modal').style.display = 'none';
}

function generateFromPreview() {
    closeReportPreview();
    document.getElementById('report-form').submit();
}

function downloadReport(reportId, format) {
    const data = new FormData();
    data.append('action', 'icshd_download_report');
    data.append('report_id', reportId);
    data.append('format', format);
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geniuses-report-${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        alert('<?php _e('Failed to download report.', 'icshd-geniuses'); ?>');
        console.error('Download error:', error);
    });
}

function regenerateReport(reportId) {
    if (!confirm('<?php _e('Are you sure you want to regenerate this report?', 'icshd-geniuses'); ?>')) {
        return;
    }
    
    const data = new FormData();
    data.append('action', 'icshd_regenerate_report');
    data.append('report_id', reportId);
    data.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('<?php _e('Report regenerated successfully!', 'icshd-geniuses'); ?>');
            location.reload();
        } else {
            alert('<?php _e('Failed to regenerate report.', 'icshd-geniuses'); ?>');
        }
    })
    .catch(error => {
        alert('<?php _e('Failed to regenerate report.', 'icshd-geniuses'); ?>');
        console.error('Regenerate error:', error);
    });
}

function createSchedule() {
    const form = document.getElementById('schedule-form');
    const formData = new FormData(form);
    formData.append('action', 'icshd_create_report_schedule');
    formData.append('nonce', '<?php echo wp_create_nonce('icshd_geniuses_admin_nonce'); ?>');
    
    fetch(ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('<?php _e('Schedule created successfully!', 'icshd-geniuses'); ?>');
            form.reset();
            loadExistingSchedules();
        } else {
            alert('<?php _e('Failed to create schedule.', 'icshd-geniuses'); ?>');
        }
    })
    .catch(error => {
        alert('<?php _e('Failed to create schedule.', 'icshd-geniuses'); ?>');
        console.error('Schedule error:', error);
    });
}

function loadExistingSchedules() {
    // Implementation for loading existing schedules
    // This would fetch and display current report schedules
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('report-preview-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
</script>
