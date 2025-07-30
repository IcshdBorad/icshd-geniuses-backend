import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  Speed,
  Target,
  TrendingUp,
  LocalFireDepartment,
  Refresh,
  Crown,
  Medal,
  WorkspacePremium
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { gamificationAPI } from '../../services/api';
import { formatNumber, formatTime } from '../../utils/helpers';

const LeaderboardPage = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [leaderboards, setLeaderboards] = useState([]);
  const [leaderboardTypes, setLeaderboardTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('global');
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedCategory, setSelectedCategory] = useState('points');
  const [userRank, setUserRank] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboardTypes();
  }, []);

  useEffect(() => {
    loadLeaderboard();
    loadUserRank();
  }, [selectedType, selectedPeriod, selectedCategory]);

  const loadLeaderboardTypes = async () => {
    try {
      const response = await gamificationAPI.getLeaderboardTypes();
      if (response.success) {
        setLeaderboardTypes(response.data.types);
      }
    } catch (error) {
      console.error('Error loading leaderboard types:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await gamificationAPI.getLeaderboards({
        type: selectedType,
        period: selectedPeriod,
        category: selectedCategory,
        limit: 50
      });

      if (response.success) {
        setLeaderboards(response.data.leaderboards);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    try {
      const response = await gamificationAPI.getUserRank(selectedType, selectedPeriod, selectedCategory);
      if (response.success) {
        setUserRank(response.data);
      }
    } catch (error) {
      console.error('Error loading user rank:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLeaderboard(), loadUserRank()]);
    setRefreshing(false);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown sx={{ color: '#FFD700', fontSize: 24 }} />;
    if (rank === 2) return <Medal sx={{ color: '#C0C0C0', fontSize: 24 }} />;
    if (rank === 3) return <WorkspacePremium sx={{ color: '#CD7F32', fontSize: 24 }} />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return 'inherit';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      points: Star,
      accuracy: Target,
      speed: Speed,
      streak: LocalFireDepartment,
      exercises_completed: TrendingUp
    };
    return icons[category] || Star;
  };

  const formatScore = (score, category) => {
    switch (category) {
      case 'accuracy':
        return `${score.toFixed(1)}%`;
      case 'speed':
        return `${score.toFixed(2)}s`;
      case 'points':
      case 'exercises_completed':
      case 'streak':
      default:
        return formatNumber(score);
    }
  };

  const currentType = leaderboardTypes.find(type => type.type === selectedType);
  const availablePeriods = currentType?.periods || ['weekly'];
  const availableCategories = currentType?.categories || ['points'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {t('gamification.leaderboard')}
        </Typography>
        <IconButton 
          onClick={handleRefresh} 
          disabled={refreshing}
          color="primary"
        >
          <Refresh sx={{ transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 1s' }} />
        </IconButton>
      </Box>

      {/* User Rank Card */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    {userRank.rank && getRankIcon(userRank.rank)}
                    {!userRank.rank && <EmojiEvents />}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h6" fontWeight="bold">
                    {t('gamification.your_rank')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {userRank.rank ? `#${userRank.rank}` : t('gamification.not_ranked')}
                  </Typography>
                  {userRank.percentile && (
                    <Typography variant="body2">
                      {t('gamification.top_percentile', { percentile: userRank.percentile })}
                    </Typography>
                  )}
                </Grid>
                <Grid item>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold">
                      {formatScore(userRank.score, selectedCategory)}
                    </Typography>
                    <Typography variant="body2">
                      {t(`gamification.${selectedCategory}`)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(userRank.total_participants)}
                    </Typography>
                    <Typography variant="body2">
                      {t('gamification.participants')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Type Filter */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>{t('gamification.leaderboard_type')}</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label={t('gamification.leaderboard_type')}
                >
                  {leaderboardTypes.map(type => (
                    <MenuItem key={type.type} value={type.type}>
                      {type.name[i18n.language] || type.name.en}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Period Filter */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>{t('gamification.period')}</InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  label={t('gamification.period')}
                >
                  {availablePeriods.map(period => (
                    <MenuItem key={period} value={period}>
                      {t(`gamification.period_${period}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>{t('gamification.category')}</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label={t('gamification.category')}
                >
                  {availableCategories.map(category => (
                    <MenuItem key={category} value={category}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {React.createElement(getCategoryIcon(category), { fontSize: 'small' })}
                        {t(`gamification.${category}`)}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                        {t('gamification.rank')}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                        {t('gamification.player')}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        {t(`gamification.${selectedCategory}`)}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        {t('gamification.level')}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        {t('gamification.streak')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {leaderboards.map((leaderboard, index) => 
                        leaderboard.entries.map((entry, entryIndex) => {
                          const rank = entryIndex + 1;
                          const isCurrentUser = entry.user_id === userRank?.user_id;
                          
                          return (
                            <motion.tr
                              key={`${entry.user_id}-${rank}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3, delay: entryIndex * 0.05 }}
                              component={TableRow}
                              sx={{
                                bgcolor: isCurrentUser ? 'primary.light' : 'inherit',
                                '&:hover': {
                                  bgcolor: isCurrentUser ? 'primary.light' : 'action.hover'
                                }
                              }}
                            >
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {getRankIcon(rank)}
                                  <Typography 
                                    variant="h6" 
                                    fontWeight="bold"
                                    color={getRankColor(rank)}
                                  >
                                    #{rank}
                                  </Typography>
                                </Box>
                              </TableCell>
                              
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar 
                                    src={entry.user_details?.avatar}
                                    sx={{ width: 40, height: 40 }}
                                  >
                                    {entry.user_details?.display_name?.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1" fontWeight="bold">
                                      {entry.user_details?.display_name}
                                      {isCurrentUser && (
                                        <Chip 
                                          label={t('gamification.you')} 
                                          size="small" 
                                          color="primary"
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                    </Typography>
                                    {entry.user_details?.title && (
                                      <Typography variant="caption" color="text.secondary">
                                        {entry.user_details.title[i18n.language] || entry.user_details.title.en}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                  {formatScore(entry.score, selectedCategory)}
                                </Typography>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Chip
                                  label={entry.metadata?.level || 1}
                                  size="small"
                                  color="secondary"
                                />
                              </TableCell>
                              
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                  <LocalFireDepartment 
                                    sx={{ 
                                      color: entry.metadata?.streak >= 7 ? '#FF5722' : '#FFC107',
                                      fontSize: 20 
                                    }} 
                                  />
                                  <Typography variant="body2" fontWeight="bold">
                                    {entry.metadata?.streak || 0}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {leaderboards.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    {t('gamification.no_leaderboard_data')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Period Information */}
      <Box mt={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          {t('gamification.leaderboard_updated')}: {formatTime(new Date())}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('gamification.leaderboard_refresh_info')}
        </Typography>
      </Box>
    </Box>
  );
};

export default LeaderboardPage;
