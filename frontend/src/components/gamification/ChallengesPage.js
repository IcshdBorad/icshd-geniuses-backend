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
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Assignment,
  Star,
  Timer,
  Group,
  CheckCircle,
  Close,
  Refresh,
  PlayArrow,
  EmojiEvents,
  TrendingUp,
  LocalFireDepartment,
  Psychology,
  Speed
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { gamificationAPI } from '../../services/api';
import { formatNumber, formatTime, calculateTimeRemaining } from '../../utils/helpers';

const ChallengesPage = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [challengeTypes, setChallengeTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joiningChallenge, setJoiningChallenge] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadChallenges();
    loadChallengeTypes();
  }, [selectedType, selectedDifficulty]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

      const response = await gamificationAPI.getAvailableChallenges(params);
      if (response.success) {
        setChallenges(response.data.challenges);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
      showSnackbar(t('errors.loading_challenges'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadChallengeTypes = async () => {
    try {
      const response = await gamificationAPI.getChallengeTypes();
      if (response.success) {
        setChallengeTypes(response.data.types);
      }
    } catch (error) {
      console.error('Error loading challenge types:', error);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoiningChallenge(true);
      const response = await gamificationAPI.joinChallenge(challengeId);
      
      if (response.success) {
        showSnackbar(t('gamification.challenge_joined_successfully'), 'success');
        setDialogOpen(false);
        loadChallenges(); // Refresh challenges
      } else {
        showSnackbar(response.message || t('errors.joining_challenge'), 'error');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      showSnackbar(t('errors.joining_challenge'), 'error');
    } finally {
      setJoiningChallenge(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getTypeIcon = (type) => {
    const icons = {
      daily: Timer,
      weekly: Assignment,
      monthly: EmojiEvents,
      special: Star,
      community: Group
    };
    return icons[type] || Assignment;
  };

  const getTypeColor = (type) => {
    const colors = {
      daily: '#4CAF50',
      weekly: '#2196F3',
      monthly: '#FF9800',
      special: '#9C27B0',
      community: '#F44336'
    };
    return colors[type] || '#4CAF50';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#4CAF50',
      medium: '#FF9800',
      hard: '#F44336',
      expert: '#9C27B0'
    };
    return colors[difficulty] || '#4CAF50';
  };

  const getProgressPercentage = (challenge) => {
    if (!challenge.user_progress) return 0;
    const completed = challenge.user_progress.progress?.filter(p => p.completed).length || 0;
    const total = challenge.objectives?.length || 1;
    return (completed / total) * 100;
  };

  const isExpired = (challenge) => {
    return new Date(challenge.duration.end_date) < new Date();
  };

  const isActive = (challenge) => {
    const now = new Date();
    return new Date(challenge.duration.start_date) <= now && new Date(challenge.duration.end_date) >= now;
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (selectedType !== 'all' && challenge.type !== selectedType) {
      return false;
    }
    if (selectedDifficulty !== 'all' && challenge.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  });

  const activeChallenges = filteredChallenges.filter(c => isActive(c) && !isExpired(c));
  const upcomingChallenges = filteredChallenges.filter(c => new Date(c.duration.start_date) > new Date());
  const expiredChallenges = filteredChallenges.filter(c => isExpired(c));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {t('gamification.challenges')}
        </Typography>
        <IconButton onClick={loadChallenges} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {activeChallenges.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.active_challenges')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {upcomingChallenges.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.upcoming')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {challenges.filter(c => c.user_progress?.status === 'completed').length}
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
              <Typography variant="h4" fontWeight="bold">
                {challenges.filter(c => c.user_progress?.status === 'joined').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.joined')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {/* Type Filter */}
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {t('gamification.challenge_type')}
              </Typography>
              <Tabs
                value={selectedType}
                onChange={(e, value) => setSelectedType(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={t('common.all')} value="all" />
                {challengeTypes.map(type => (
                  <Tab
                    key={type.id}
                    label={type.name[i18n.language] || type.name.en}
                    value={type.id}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Difficulty Filter */}
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {t('gamification.difficulty')}
              </Typography>
              <Tabs
                value={selectedDifficulty}
                onChange={(e, value) => setSelectedDifficulty(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={t('common.all')} value="all" />
                <Tab label={t('gamification.easy')} value="easy" />
                <Tab label={t('gamification.medium')} value="medium" />
                <Tab label={t('gamification.hard')} value="hard" />
                <Tab label={t('gamification.expert')} value="expert" />
              </Tabs>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <Box mb={4}>
              <Typography variant="h5" fontWeight="bold" mb={2} color="success.main">
                {t('gamification.active_challenges')}
              </Typography>
              <Grid container spacing={3}>
                <AnimatePresence>
                  {activeChallenges.map((challenge, index) => (
                    <ChallengeCard
                      key={challenge._id}
                      challenge={challenge}
                      index={index}
                      onSelect={(challenge) => {
                        setSelectedChallenge(challenge);
                        setDialogOpen(true);
                      }}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                      getDifficultyColor={getDifficultyColor}
                      getProgressPercentage={getProgressPercentage}
                      isActive={true}
                      t={t}
                      i18n={i18n}
                    />
                  ))}
                </AnimatePresence>
              </Grid>
            </Box>
          )}

          {/* Upcoming Challenges */}
          {upcomingChallenges.length > 0 && (
            <Box mb={4}>
              <Typography variant="h5" fontWeight="bold" mb={2} color="warning.main">
                {t('gamification.upcoming_challenges')}
              </Typography>
              <Grid container spacing={3}>
                <AnimatePresence>
                  {upcomingChallenges.map((challenge, index) => (
                    <ChallengeCard
                      key={challenge._id}
                      challenge={challenge}
                      index={index}
                      onSelect={(challenge) => {
                        setSelectedChallenge(challenge);
                        setDialogOpen(true);
                      }}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                      getDifficultyColor={getDifficultyColor}
                      getProgressPercentage={getProgressPercentage}
                      isActive={false}
                      t={t}
                      i18n={i18n}
                    />
                  ))}
                </AnimatePresence>
              </Grid>
            </Box>
          )}

          {/* No Challenges */}
          {activeChallenges.length === 0 && upcomingChallenges.length === 0 && (
            <Box textAlign="center" py={8}>
              <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                {t('gamification.no_challenges_available')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('gamification.check_back_later')}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Challenge Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedChallenge && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: getTypeColor(selectedChallenge.type),
                      width: 56,
                      height: 56
                    }}
                  >
                    {React.createElement(getTypeIcon(selectedChallenge.type))}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedChallenge.name[i18n.language] || selectedChallenge.name.en}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip
                        label={selectedChallenge.type.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: getTypeColor(selectedChallenge.type),
                          color: 'white'
                        }}
                      />
                      <Chip
                        label={selectedChallenge.difficulty.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: getDifficultyColor(selectedChallenge.difficulty),
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" mb={3}>
                {selectedChallenge.description[i18n.language] || selectedChallenge.description.en}
              </Typography>

              {/* Duration */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.duration')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('gamification.starts')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatTime(selectedChallenge.duration.start_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('gamification.ends')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatTime(selectedChallenge.duration.end_date)}
                    </Typography>
                  </Grid>
                </Grid>
                
                {isActive(selectedChallenge) && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t('gamification.time_remaining')}: {calculateTimeRemaining(selectedChallenge.duration.end_date)}
                  </Alert>
                )}
              </Box>

              {/* Objectives */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.objectives')}
                </Typography>
                <List>
                  {selectedChallenge.objectives?.map((objective, index) => {
                    const isCompleted = selectedChallenge.user_progress?.progress?.[index]?.completed;
                    return (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle 
                            sx={{ 
                              color: isCompleted ? 'success.main' : 'text.secondary' 
                            }} 
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={objective.description[i18n.language] || objective.description.en}
                          secondary={`${t('gamification.target')}: ${objective.target_value}`}
                          sx={{
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.7 : 1
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>

              {/* Progress */}
              {selectedChallenge.user_progress && (
                <Box mb={3}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    {t('gamification.your_progress')}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressPercentage(selectedChallenge)}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(getProgressPercentage(selectedChallenge))}% {t('gamification.completed')}
                  </Typography>
                </Box>
              )}

              {/* Rewards */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('gamification.rewards')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Star sx={{ color: '#FFD700' }} />
                      <Typography variant="body1">
                        {formatNumber(selectedChallenge.rewards.points)} {t('gamification.points')}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {selectedChallenge.rewards.experience && (
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUp sx={{ color: '#4CAF50' }} />
                        <Typography variant="body1">
                          {formatNumber(selectedChallenge.rewards.experience)} {t('gamification.experience')}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {selectedChallenge.rewards.items && Object.keys(selectedChallenge.rewards.items).length > 0 && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {t('gamification.bonus_items')}:
                    </Typography>
                    {Object.entries(selectedChallenge.rewards.items).map(([item, quantity]) => (
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

              {/* Participants */}
              {selectedChallenge.participants_count && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('gamification.participants')}: {formatNumber(selectedChallenge.participants_count)}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions>
              {!selectedChallenge.user_progress && isActive(selectedChallenge) && (
                <Button
                  variant="contained"
                  onClick={() => handleJoinChallenge(selectedChallenge._id)}
                  disabled={joiningChallenge}
                  startIcon={joiningChallenge ? <CircularProgress size={16} /> : <PlayArrow />}
                >
                  {joiningChallenge ? t('gamification.joining') : t('gamification.join_challenge')}
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

// Challenge Card Component
const ChallengeCard = ({ 
  challenge, 
  index, 
  onSelect, 
  getTypeIcon, 
  getTypeColor, 
  getDifficultyColor, 
  getProgressPercentage,
  isActive,
  t,
  i18n 
}) => {
  const IconComponent = getTypeIcon(challenge.type);
  const hasUserProgress = !!challenge.user_progress;
  const isCompleted = challenge.user_progress?.status === 'completed';

  return (
    <Grid item xs={12} sm={6} md={4}>
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
            opacity: !isActive ? 0.8 : 1,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            },
            border: isCompleted ? '2px solid #4CAF50' : 'none'
          }}
          onClick={() => onSelect(challenge)}
        >
          <CardContent>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Avatar
                sx={{
                  bgcolor: getTypeColor(challenge.type),
                  width: 48,
                  height: 48
                }}
              >
                <IconComponent />
              </Avatar>
              
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Chip
                  label={challenge.type.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: getTypeColor(challenge.type),
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                />
                <Chip
                  label={challenge.difficulty.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: getDifficultyColor(challenge.difficulty),
                    color: 'white'
                  }}
                />
              </Box>
            </Box>

            {/* Title */}
            <Typography variant="h6" fontWeight="bold" mb={1} noWrap>
              {challenge.name[i18n.language] || challenge.name.en}
            </Typography>

            {/* Description */}
            <Typography variant="body2" color="text.secondary" mb={2} sx={{ height: 40, overflow: 'hidden' }}>
              {challenge.description[i18n.language] || challenge.description.en}
            </Typography>

            {/* Progress */}
            {hasUserProgress && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {t('gamification.progress')}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round(getProgressPercentage(challenge))}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage(challenge)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getTypeColor(challenge.type)
                    }
                  }}
                />
              </Box>
            )}

            {/* Footer */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <Star sx={{ color: '#FFD700', fontSize: 16 }} />
                <Typography variant="body2" fontWeight="bold">
                  {formatNumber(challenge.rewards.points)}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {isActive ? t('gamification.active') : t('gamification.upcoming')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  );
};

export default ChallengesPage;
