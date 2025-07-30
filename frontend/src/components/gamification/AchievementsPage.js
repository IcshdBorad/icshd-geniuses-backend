import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  Speed,
  Target,
  TrendingUp,
  Psychology,
  Group,
  Lock,
  CheckCircle,
  Close,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { gamificationAPI } from '../../services/api';
import { formatNumber, formatTime } from '../../utils/helpers';

const AchievementsPage = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadAchievements();
    loadCategories();
  }, [selectedCategory, selectedStatus]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await gamificationAPI.getUserAchievements(params);
      if (response.success) {
        setAchievements(response.data.achievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      showSnackbar(t('errors.loading_achievements'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await gamificationAPI.getAchievementCategories();
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleClaimReward = async (achievementId) => {
    try {
      setClaimingReward(true);
      const response = await gamificationAPI.claimAchievementReward(achievementId);
      
      if (response.success) {
        showSnackbar(t('gamification.reward_claimed_successfully'), 'success');
        setDialogOpen(false);
        loadAchievements(); // Refresh achievements
      } else {
        showSnackbar(response.message || t('errors.claiming_reward'), 'error');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      showSnackbar(t('errors.claiming_reward'), 'error');
    } finally {
      setClaimingReward(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      accuracy: Target,
      speed: Speed,
      consistency: TrendingUp,
      progression: Star,
      special: EmojiEvents,
      social: Group
    };
    return icons[category] || EmojiEvents;
  };

  const getTypeColor = (type) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF'
    };
    return colors[type] || '#4CAF50';
  };

  const getProgressPercentage = (achievement) => {
    if (achievement.status === 'completed') return 100;
    if (!achievement.progress) return 0;
    return Math.min((achievement.progress / achievement.achievement_details.criteria.threshold) * 100, 100);
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.achievement_details.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'all' && achievement.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const statusCounts = {
    all: achievements.length,
    completed: achievements.filter(a => a.status === 'completed').length,
    in_progress: achievements.filter(a => a.status === 'in_progress').length,
    locked: achievements.filter(a => a.status === 'locked').length
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {t('gamification.achievements')}
        </Typography>
        <IconButton onClick={loadAchievements} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {statusCounts.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.completed')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {statusCounts.in_progress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.in_progress')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="text.secondary">
                {statusCounts.locked}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.locked')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                {statusCounts.all}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.total')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FilterList color="action" />
            
            {/* Category Filter */}
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {t('gamification.category')}
              </Typography>
              <Tabs
                value={selectedCategory}
                onChange={(e, value) => setSelectedCategory(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={t('common.all')} value="all" />
                {categories.map(category => (
                  <Tab
                    key={category.id}
                    label={category.name[i18n.language] || category.name.en}
                    value={category.id}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Status Filter */}
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {t('gamification.status')}
              </Typography>
              <Tabs
                value={selectedStatus}
                onChange={(e, value) => setSelectedStatus(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={t('common.all')} value="all" />
                <Tab label={t('gamification.completed')} value="completed" />
                <Tab label={t('gamification.in_progress')} value="in_progress" />
                <Tab label={t('gamification.locked')} value="locked" />
              </Tabs>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredAchievements.map((achievement, index) => {
              const IconComponent = getCategoryIcon(achievement.achievement_details.category);
              const isCompleted = achievement.status === 'completed';
              const isLocked = achievement.status === 'locked';
              const canClaim = isCompleted && !achievement.reward_claimed;

              return (
                <Grid item xs={12} sm={6} md={4} key={achievement._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isLocked ? 0.6 : 1,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        },
                        border: isCompleted ? `2px solid ${getTypeColor(achievement.achievement_details.type)}` : 'none'
                      }}
                      onClick={() => {
                        setSelectedAchievement(achievement);
                        setDialogOpen(true);
                      }}
                    >
                      <CardContent>
                        {/* Header */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Avatar
                            sx={{
                              bgcolor: getTypeColor(achievement.achievement_details.type),
                              width: 48,
                              height: 48
                            }}
                          >
                            {isLocked ? <Lock /> : <IconComponent />}
                          </Avatar>
                          
                          <Box display="flex" flexDirection="column" alignItems="flex-end">
                            <Chip
                              label={achievement.achievement_details.type.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: getTypeColor(achievement.achievement_details.type),
                                color: 'white',
                                fontWeight: 'bold',
                                mb: 1
                              }}
                            />
                            {isCompleted && (
                              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                            )}
                            {canClaim && (
                              <Chip
                                label={t('gamification.claim')}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Title and Description */}
                        <Typography variant="h6" fontWeight="bold" mb={1} noWrap>
                          {achievement.achievement_details.name[i18n.language] || achievement.achievement_details.name.en}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" mb={2} sx={{ height: 40, overflow: 'hidden' }}>
                          {achievement.achievement_details.description[i18n.language] || achievement.achievement_details.description.en}
                        </Typography>

                        {/* Progress */}
                        {!isLocked && (
                          <Box mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                {t('gamification.progress')}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {isCompleted ? '100%' : `${Math.round(getProgressPercentage(achievement))}%`}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getProgressPercentage(achievement)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getTypeColor(achievement.achievement_details.type)
                                }
                              }}
                            />
                            {!isCompleted && (
                              <Typography variant="caption" color="text.secondary" mt={1}>
                                {achievement.progress || 0} / {achievement.achievement_details.criteria.threshold}
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* Rewards */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Star sx={{ color: '#FFD700', fontSize: 16 }} />
                            <Typography variant="body2" fontWeight="bold">
                              {formatNumber(achievement.achievement_details.rewards.points)} {t('gamification.points')}
                            </Typography>
                          </Box>
                          
                          {achievement.earned_at && (
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(achievement.earned_at)}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>
      )}

      {/* Achievement Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: getTypeColor(selectedAchievement.achievement_details.type),
                      width: 56,
                      height: 56
                    }}
                  >
                    {React.createElement(getCategoryIcon(selectedAchievement.achievement_details.category))}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedAchievement.achievement_details.name[i18n.language] || selectedAchievement.achievement_details.name.en}
                    </Typography>
                    <Chip
                      label={selectedAchievement.achievement_details.type.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: getTypeColor(selectedAchievement.achievement_details.type),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" mb={3}>
                {selectedAchievement.achievement_details.description[i18n.language] || selectedAchievement.achievement_details.description.en}
              </Typography>

              {/* Progress Details */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.progress_details')}
                </Typography>
                
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage(selectedAchievement)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1
                  }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {selectedAchievement.status === 'completed' 
                    ? t('gamification.achievement_completed')
                    : `${selectedAchievement.progress || 0} / ${selectedAchievement.achievement_details.criteria.threshold} ${t('gamification.criteria_unit')}`
                  }
                </Typography>
              </Box>

              {/* Rewards */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.rewards')}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Star sx={{ color: '#FFD700' }} />
                  <Typography variant="body1">
                    {formatNumber(selectedAchievement.achievement_details.rewards.points)} {t('gamification.points')}
                  </Typography>
                </Box>

                {selectedAchievement.achievement_details.rewards.experience && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <TrendingUp sx={{ color: '#4CAF50' }} />
                    <Typography variant="body1">
                      {formatNumber(selectedAchievement.achievement_details.rewards.experience)} {t('gamification.experience')}
                    </Typography>
                  </Box>
                )}

                {selectedAchievement.achievement_details.rewards.items && Object.keys(selectedAchievement.achievement_details.rewards.items).length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {t('gamification.bonus_items')}:
                    </Typography>
                    {Object.entries(selectedAchievement.achievement_details.rewards.items).map(([item, quantity]) => (
                      <Chip
                        key={item}
                        label={`${quantity}x ${t(`gamification.${item}`)}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* Completion Date */}
              {selectedAchievement.earned_at && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('gamification.completed_on')}: {formatTime(selectedAchievement.earned_at)}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions>
              {selectedAchievement.status === 'completed' && !selectedAchievement.reward_claimed && (
                <Button
                  variant="contained"
                  onClick={() => handleClaimReward(selectedAchievement._id)}
                  disabled={claimingReward}
                  startIcon={claimingReward ? <CircularProgress size={16} /> : <EmojiEvents />}
                >
                  {claimingReward ? t('gamification.claiming') : t('gamification.claim_reward')}
                </Button>
              )}
              <Button onClick={() => setDialogOpen(false)}>
                {t('common.close')}
              </Button>
            </DialogActions>
          </>
        )}
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

export default AchievementsPage;
