import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Settings,
  Palette,
  Person,
  Notifications,
  Security,
  Save,
  Close,
  Check,
  Lock,
  Star,
  EmojiEvents
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { gamificationAPI } from '../../services/api';

const ProfileCustomization = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [customization, setCustomization] = useState({});
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [availableThemes, setAvailableThemes] = useState([]);
  const [availableTitles, setAvailableTitles] = useState([]);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await gamificationAPI.getUserProfile();
      
      if (response.success) {
        const profileData = response.data.profile;
        setProfile(profileData);
        setPreferences(profileData.preferences || {});
        setCustomization({
          avatar: profileData.avatar?.current,
          theme: profileData.theme?.current,
          title: profileData.titles?.current
        });
        setAvailableAvatars(profileData.avatar?.unlocked || []);
        setAvailableThemes(profileData.theme?.unlocked || []);
        setAvailableTitles(profileData.titles?.unlocked || []);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      showSnackbar(t('errors.loading_profile'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCustomizationChange = (key, value) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await gamificationAPI.updatePreferences({ preferences });
      
      if (response.success) {
        showSnackbar(t('gamification.preferences_saved'), 'success');
      } else {
        showSnackbar(response.message || t('errors.saving_preferences'), 'error');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showSnackbar(t('errors.saving_preferences'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveCustomization = async () => {
    try {
      setSaving(true);
      const response = await gamificationAPI.updateCustomization(customization);
      
      if (response.success) {
        showSnackbar(t('gamification.customization_saved'), 'success');
        loadProfileData(); // Refresh profile data
      } else {
        showSnackbar(response.message || t('errors.saving_customization'), 'error');
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      showSnackbar(t('errors.saving_customization'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" color="primary" mb={3}>
        {t('gamification.profile_customization')}
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Preview */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ height: 'fit-content', position: 'sticky', top: 20 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                  {t('gamification.profile_preview')}
                </Typography>
                
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mx: 'auto', 
                    mb: 2,
                    border: '4px solid',
                    borderColor: 'primary.main'
                  }}
                  src={customization.avatar}
                >
                  {profile?.user_id?.display_name?.charAt(0)}
                </Avatar>
                
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  {profile?.user_id?.display_name}
                </Typography>
                
                {customization.title && (
                  <Chip 
                    label={customization.title[i18n.language] || customization.title.en}
                    sx={{ 
                      backgroundColor: 'primary.main', 
                      color: 'white',
                      mb: 2
                    }}
                  />
                )}

                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {profile?.level?.current}
                  </Typography>
                  <Typography variant="h6" ml={1}>
                    {t('gamification.level')}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {t('gamification.theme')}: {customization.theme || t('gamification.default')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Customization Options */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Avatar Selection */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {t('gamification.avatar')}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setAvatarDialogOpen(true)}
                        startIcon={<Person />}
                      >
                        {t('gamification.change_avatar')}
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {t('gamification.avatar_description')}
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {availableAvatars.slice(0, 5).map((avatar, index) => (
                        <Avatar
                          key={index}
                          src={avatar}
                          sx={{ 
                            width: 40, 
                            height: 40,
                            cursor: 'pointer',
                            border: customization.avatar === avatar ? '2px solid' : 'none',
                            borderColor: 'primary.main'
                          }}
                          onClick={() => handleCustomizationChange('avatar', avatar)}
                        />
                      ))}
                      {availableAvatars.length > 5 && (
                        <Avatar
                          sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: 'action.hover',
                            cursor: 'pointer'
                          }}
                          onClick={() => setAvatarDialogOpen(true)}
                        >
                          +{availableAvatars.length - 5}
                        </Avatar>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Theme Selection */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {t('gamification.theme')}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setThemeDialogOpen(true)}
                        startIcon={<Palette />}
                      >
                        {t('gamification.change_theme')}
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {t('gamification.theme_description')}
                    </Typography>
                    
                    <Typography variant="body1">
                      {t('gamification.current_theme')}: {customization.theme || t('gamification.default')}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Title Selection */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {t('gamification.title')}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setTitleDialogOpen(true)}
                        startIcon={<EmojiEvents />}
                      >
                        {t('gamification.change_title')}
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {t('gamification.title_description')}
                    </Typography>
                    
                    {customization.title ? (
                      <Chip 
                        label={customization.title[i18n.language] || customization.title.en}
                        color="primary"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('gamification.no_title_selected')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Preferences */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                      {t('gamification.preferences')}
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Notifications />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('gamification.challenge_notifications')}
                          secondary={t('gamification.challenge_notifications_desc')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={preferences.receive_challenge_notifications || false}
                            onChange={(e) => handlePreferenceChange('receive_challenge_notifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <Divider />
                      
                      <ListItem>
                        <ListItemIcon>
                          <Security />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('gamification.public_profile')}
                          secondary={t('gamification.public_profile_desc')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={preferences.public_profile || false}
                            onChange={(e) => handlePreferenceChange('public_profile', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <Divider />
                      
                      <ListItem>
                        <ListItemIcon>
                          <Star />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('gamification.show_leaderboard')}
                          secondary={t('gamification.show_leaderboard_desc')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={preferences.show_leaderboard !== false}
                            onChange={(e) => handlePreferenceChange('show_leaderboard', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Save Buttons */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={savePreferences}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : <Settings />}
                  >
                    {t('gamification.save_preferences')}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={saveCustomization}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                  >
                    {t('gamification.save_customization')}
                  </Button>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Avatar Selection Dialog */}
      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('gamification.select_avatar')}</Typography>
            <IconButton onClick={() => setAvatarDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {availableAvatars.map((avatar, index) => (
              <Grid item xs={3} sm={2} key={index}>
                <Avatar
                  src={avatar}
                  sx={{ 
                    width: 60, 
                    height: 60,
                    cursor: 'pointer',
                    border: customization.avatar === avatar ? '3px solid' : '1px solid',
                    borderColor: customization.avatar === avatar ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => {
                    handleCustomizationChange('avatar', avatar);
                    setAvatarDialogOpen(false);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Theme Selection Dialog */}
      <Dialog
        open={themeDialogOpen}
        onClose={() => setThemeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('gamification.select_theme')}</Typography>
            <IconButton onClick={() => setThemeDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {availableThemes.map((theme, index) => (
              <ListItem
                key={index}
                button
                onClick={() => {
                  handleCustomizationChange('theme', theme);
                  setThemeDialogOpen(false);
                }}
                selected={customization.theme === theme}
              >
                <ListItemIcon>
                  <Palette />
                </ListItemIcon>
                <ListItemText primary={theme} />
                {customization.theme === theme && (
                  <ListItemSecondaryAction>
                    <Check color="primary" />
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Title Selection Dialog */}
      <Dialog
        open={titleDialogOpen}
        onClose={() => setTitleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('gamification.select_title')}</Typography>
            <IconButton onClick={() => setTitleDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem
              button
              onClick={() => {
                handleCustomizationChange('title', null);
                setTitleDialogOpen(false);
              }}
              selected={!customization.title}
            >
              <ListItemText primary={t('gamification.no_title')} />
              {!customization.title && (
                <ListItemSecondaryAction>
                  <Check color="primary" />
                </ListItemSecondaryAction>
              )}
            </ListItem>
            {availableTitles.map((title, index) => (
              <ListItem
                key={index}
                button
                onClick={() => {
                  handleCustomizationChange('title', title);
                  setTitleDialogOpen(false);
                }}
                selected={customization.title === title}
              >
                <ListItemIcon>
                  <EmojiEvents />
                </ListItemIcon>
                <ListItemText 
                  primary={title[i18n.language] || title.en}
                  secondary={title.description?.[i18n.language] || title.description?.en}
                />
                {customization.title === title && (
                  <ListItemSecondaryAction>
                    <Check color="primary" />
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileCustomization;
