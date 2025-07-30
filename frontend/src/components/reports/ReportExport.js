import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Download,
  Share,
  Email,
  Print,
  Cloud,
  Schedule,
  Delete,
  Edit,
  Visibility,
  GetApp,
  PictureAsPdf,
  TableChart,
  Code,
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
  Send,
  Save,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// API service
import { reportsAPI } from '../../services/api';

const ReportExport = ({ open, onClose, reportData, reportType }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State management
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeRawData: false,
    compressImages: true,
    watermark: false,
    password: '',
    emailRecipients: [],
    cloudStorage: false,
    scheduledExport: false
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [emailDialog, setEmailDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);

  // Export history
  const [exportHistory, setExportHistory] = useState([
    {
      id: 1,
      format: 'pdf',
      size: '2.3 MB',
      createdAt: new Date(),
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 2,
      format: 'excel',
      size: '1.8 MB',
      createdAt: new Date(Date.now() - 86400000),
      status: 'completed',
      downloadUrl: '#'
    }
  ]);

  const handleExport = async () => {
    try {
      setLoading(true);
      setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare export parameters
      const exportParams = {
        format: exportFormat,
        ...exportOptions,
        reportType,
        reportData
      };

      // Call export API
      const response = await reportsAPI.exportReport(exportParams);
      
      setProgress(100);
      
      // Handle different export formats
      if (exportFormat === 'json') {
        // Display JSON data
        const jsonWindow = window.open();
        jsonWindow.document.write(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
      } else {
        // Download file
        const blob = new Blob([response.data], { 
          type: exportFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      // Add to export history
      const newExport = {
        id: Date.now(),
        format: exportFormat,
        size: '2.1 MB', // Placeholder
        createdAt: new Date(),
        status: 'completed',
        downloadUrl: '#'
      };
      setExportHistory(prev => [newExport, ...prev]);

      showSnackbar('تم تصدير التقرير بنجاح', 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('خطأ في تصدير التقرير', 'error');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleEmailSend = async (recipients, subject, message) => {
    try {
      setLoading(true);
      
      await reportsAPI.emailReport({
        reportType,
        reportData,
        format: exportFormat,
        recipients,
        subject,
        message
      });

      showSnackbar('تم إرسال التقرير بالبريد الإلكتروني', 'success');
      setEmailDialog(false);
    } catch (error) {
      console.error('Email error:', error);
      showSnackbar('خطأ في إرسال البريد الإلكتروني', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return <PictureAsPdf />;
      case 'excel':
        return <TableChart />;
      case 'json':
        return <Code />;
      default:
        return <GetApp />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { direction: isRTL ? 'rtl' : 'ltr' }
      }}
    >
      <DialogTitle>
        📤 تصدير التقرير
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Export Options */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  خيارات التصدير
                </Typography>
                
                {/* Format Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>صيغة التصدير</InputLabel>
                  <Select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    label="صيغة التصدير"
                  >
                    <MenuItem value="pdf">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PictureAsPdf sx={{ mr: 1 }} />
                        PDF
                      </Box>
                    </MenuItem>
                    <MenuItem value="excel">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TableChart sx={{ mr: 1 }} />
                        Excel
                      </Box>
                    </MenuItem>
                    <MenuItem value="json">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Code sx={{ mr: 1 }} />
                        JSON
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Export Options */}
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeCharts}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeCharts: e.target.checked
                        }))}
                      />
                    }
                    label="تضمين الرسوم البيانية"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeRawData}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeRawData: e.target.checked
                        }))}
                      />
                    }
                    label="تضمين البيانات الخام"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.watermark}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          watermark: e.target.checked
                        }))}
                      />
                    }
                    label="إضافة علامة مائية"
                  />
                </Box>

                {/* Password Protection */}
                {exportFormat === 'pdf' && (
                  <TextField
                    fullWidth
                    type="password"
                    label="كلمة مرور الحماية (اختيارية)"
                    value={exportOptions.password}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    sx={{ mb: 2 }}
                  />
                )}

                {/* Progress Bar */}
                {loading && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      جاري التصدير... {progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleExport}
                    disabled={loading}
                  >
                    تصدير
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => setEmailDialog(true)}
                  >
                    إرسال
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrint}
                  >
                    طباعة
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={() => setShareDialog(true)}
                  >
                    مشاركة
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Export History */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    سجل التصدير
                  </Typography>
                  <IconButton size="small" onClick={() => {}}>
                    <Refresh />
                  </IconButton>
                </Box>

                <List>
                  {exportHistory.map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemIcon>
                        {getFormatIcon(item.format)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {item.format.toUpperCase()}
                            </Typography>
                            <Chip
                              label={item.status === 'completed' ? 'مكتمل' : 'معالجة'}
                              color={getStatusColor(item.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              الحجم: {item.size}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(item.createdAt, 'yyyy/MM/dd HH:mm', { locale: ar })}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="تحميل">
                          <IconButton
                            size="small"
                            onClick={() => window.open(item.downloadUrl, '_blank')}
                            disabled={item.status !== 'completed'}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                {exportHistory.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      لا يوجد سجل تصدير
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          إغلاق
        </Button>
      </DialogActions>

      {/* Email Dialog */}
      <EmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        onSend={handleEmailSend}
        loading={loading}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialog}
        onClose={() => setShareDialog(false)}
        reportData={reportData}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// Email Dialog Component
const EmailDialog = ({ open, onClose, onSend, loading }) => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('تقرير ICSHD GENIUSES');
  const [message, setMessage] = useState('مرفق تقرير من منصة ICSHD GENIUSES للحساب الذهني.');

  const handleSend = () => {
    const recipientList = recipients.split(',').map(email => email.trim()).filter(email => email);
    onSend(recipientList, subject, message);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>📧 إرسال التقرير بالبريد الإلكتروني</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="المستلمون (مفصولة بفاصلة)"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          fullWidth
          label="الموضوع"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          label="الرسالة"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !recipients.trim()}
          startIcon={loading ? <LinearProgress size={20} /> : <Send />}
        >
          {loading ? 'جاري الإرسال...' : 'إرسال'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Share Dialog Component
const ShareDialog = ({ open, onClose, reportData }) => {
  const [shareUrl, setShareUrl] = useState('https://icshd-geniuses.com/reports/shared/abc123');
  const [expiryDays, setExpiryDays] = useState(7);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>🔗 مشاركة التقرير</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          سيتم إنشاء رابط مشاركة آمن للتقرير
        </Alert>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>مدة انتهاء الصلاحية</InputLabel>
          <Select
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            label="مدة انتهاء الصلاحية"
          >
            <MenuItem value={1}>يوم واحد</MenuItem>
            <MenuItem value={7}>أسبوع</MenuItem>
            <MenuItem value={30}>شهر</MenuItem>
            <MenuItem value={0}>بدون انتهاء</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="رابط المشاركة"
          value={shareUrl}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Button onClick={copyToClipboard} size="small">
                نسخ
              </Button>
            )
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
        <Button variant="contained">إنشاء الرابط</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportExport;
