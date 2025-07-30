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
  IconButton,
  Tooltip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  TrendingUp,
  LocalFireDepartment,
  Speed,
  Target,
  Psychology,
  Group,
  Inventory,
  Settings,
  Refresh,
  Timeline,
  Assignment,
  Leaderboard
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { gamificationAPI } from '../../services/api';
import { formatNumber, formatTime } from '../../utils/helpers';

const GamificationDashboard = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        gamificationAPI.getUserProfile(),
        gamificationAPI.getGamificationStats()
      ]);

      if (profileRes.success) {
        setProfile(profileRes.data.profile);
        setRecentAchievements(profileRes.data.recent_achievements || []);
        setActiveChallenges(profileRes.data.active_challenges || []);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGamificationData();
    setRefreshing(false);
  };

  const getExperiencePercentage = () => {
    if (!profile) return 0;
    return (profile.level.experience / profile.level.experience_to_next) * 100;
  };

  const getLevelColor = (level) => {
    if (level >= 50) return '#FFD700'; // Gold
    if (level >= 30) return '#C0C0C0'; // Silver
    if (level >= 15) return '#CD7F32'; // Bronze
    return '#4CAF50'; // Green
  };

  const getStreakColor = (streak) => {
    if (streak >= 30) return '#FF5722'; // Red hot
    if (streak >= 14) return '#FF9800'; // Orange
    if (streak >= 7) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {t('gamification.dashboard.title')}
        </Typography>
        <IconButton 
          onClick={handleRefresh} 
          disabled={refreshing}
          color="primary"
        >
          <Refresh sx={{ transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 1s' }} />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <CardContent sx={{ color: 'white', textAlign: 'center' }}>
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    border: '4px solid rgba(255,255,255,0.3)'
                  }}
                  src={profile?.avatar?.current}
                >
                  {profile?.user_id?.display_name?.charAt(0)}
                </Avatar>
                
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  {profile?.user_id?.display_name}
                </Typography>
                
                {profile?.titles?.current && (
                  <Chip 
                    label={profile.titles.current[i18n.language] || profile.titles.current.en}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      mb: 2
                    }}
                  />
                )}

                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                  <Typography variant="h3" fontWeight="bold" color={getLevelColor(profile?.level?.current)}>
                    {profile?.level?.current}
                  </Typography>
                  <Typography variant="h6" ml={1}>
                    {t('gamification.level')}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" mb={1}>
                    {t('gamification.experience')}: {formatNumber(profile?.level?.experience)} / {formatNumber(profile?.level?.experience_to_next)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getExperiencePercentage()}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#FFD700'
                      }
                    }}
                  />
                </Box>

                <Box display="flex" justifyContent="space-around">
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(profile?.points?.current_balance)}
                    </Typography>
                    <Typography variant="caption">
                      {t('gamification.points')}
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {profile?.statistics?.achievements_earned}
                    </Typography>
                    <Typography variant="caption">
                      {t('gamification.achievements')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Streak Card */}
            <Grid item xs={12} sm={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <LocalFireDepartment 
                        sx={{ 
                          fontSize: 40, 
                          color: getStreakColor(stats?.profile_summary?.current_streak),
                          mr: 2 
                        }} 
                      />
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {stats?.profile_summary?.current_streak || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('gamification.current_streak')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('gamification.best')}: {stats?.profile_summary?.longest_streak || 0} {t('gamification.days')}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Total Points Card */}
            <Grid item xs={12} sm={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Star sx={{ fontSize: 40, color: '#FFD700', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {formatNumber(stats?.profile_summary?.total_points)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('gamification.total_points')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('gamification.balance')}: {formatNumber(stats?.profile_summary?.current_balance)}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Achievements Card */}
            <Grid item xs={12} sm={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <EmojiEvents sx={{ fontSize: 40, color: '#FF9800', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {stats?.profile_summary?.achievements_earned}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('gamification.achievements_earned')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Challenges Card */}
            <Grid item xs={12} sm={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Assignment sx={{ fontSize: 40, color: '#9C27B0', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {stats?.profile_summary?.challenges_completed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('gamification.challenges_completed')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Achievements */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    {t('gamification.recent_achievements')}
                  </Typography>
                  <Button size="small" href="/achievements">
                    {t('common.view_all')}
                  </Button>
                </Box>
                
                {recentAchievements.length > 0 ? (
                  <List>
                    {recentAchievements.slice(0, 3).map((achievement, index) => (
                      <motion.div
                        key={achievement._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ListItem>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: '#FFD700', width: 32, height: 32 }}>
                              <EmojiEvents fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={achievement.achievement_details?.name?.[i18n.language] || achievement.achievement_details?.name?.en}
                            secondary={formatTime(achievement.earned_at)}
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    {t('gamification.no_achievements_yet')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Active Challenges */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    {t('gamification.active_challenges')}
                  </Typography>
                  <Button size="small" href="/challenges">
                    {t('common.view_all')}
                  </Button>
                </Box>
                
                {activeChallenges.length > 0 ? (
                  <List>
                    {activeChallenges.slice(0, 3).map((challenge, index) => (
                      <motion.div
                        key={challenge._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ListItem>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: '#9C27B0', width: 32, height: 32 }}>
                              <Assignment fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={challenge.challenge_id}
                            secondary={`${challenge.progress?.filter(p => p.completed).length || 0} / ${challenge.progress?.length || 0} ${t('gamification.objectives')}`}
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    {t('gamification.no_active_challenges')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Inventory */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.inventory')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={2}>
                      <Psychology sx={{ fontSize: 32, color: '#2196F3', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {profile?.inventory?.hint_tokens || 0}
                      </Typography>
                      <Typography variant="caption">
                        {t('gamification.hint_tokens')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={2}>
                      <Speed sx={{ fontSize: 32, color: '#FF9800', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {profile?.inventory?.skip_tokens || 0}
                      </Typography>
                      <Typography variant="caption">
                        {t('gamification.skip_tokens')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={2}>
                      <LocalFireDepartment sx={{ fontSize: 32, color: '#F44336', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {profile?.inventory?.freeze_tokens || 0}
                      </Typography>
                      <Typography variant="caption">
                        {t('gamification.freeze_tokens')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={2}>
                      <TrendingUp sx={{ fontSize: 32, color: '#4CAF50', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {profile?.inventory?.bonus_multipliers || 0}
                      </Typography>
                      <Typography variant="caption">
                        {t('gamification.multipliers')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.quick_actions')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EmojiEvents />}
                      href="/achievements"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {t('gamification.view_achievements')}
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Leaderboard />}
                      href="/leaderboard"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {t('gamification.view_leaderboard')}
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      href="/challenges"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {t('gamification.view_challenges')}
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Settings />}
                      href="/profile/customization"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {t('gamification.customize_profile')}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GamificationDashboard;
