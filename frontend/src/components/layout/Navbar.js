/**
 * Navbar Component for ICSHD GENIUSES
 * Top navigation bar with user info and quick actions
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Box,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  ExitToApp,
  Person,
  Dashboard,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from 'react-query';
import { notificationAPI } from '../../services/api';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Fetch unread notifications count
  const { data: unreadCount } = useQuery(
    'unreadNotifications',
    notificationAPI.getUnreadCount,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const handleDashboardClick = () => {
    handleProfileMenuClose();
    
    // Navigate to role-specific dashboard
    switch (user?.role) {
      case 'student':
        navigate('/student');
        break;
      case 'trainer':
        navigate('/trainer');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'مدير',
      trainer: 'مدرب',
      student: 'طالب',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      trainer: '#2196f3',
      student: '#4caf50',
    };
    return colors[role] || '#757575';
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {/* Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <School sx={{ mr: 1, color: 'primary.main' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ICSHD GENIUSES
          </Typography>
        </Box>

        {/* User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* User Role Badge */}
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              bgcolor: getRoleColor(user?.role),
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {getRoleLabel(user?.role)}
          </Box>

          {/* Notifications */}
          <Tooltip title="الإشعارات">
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{ ml: 1 }}
            >
              <Badge
                badgeContent={unreadCount?.count || 0}
                color="error"
                max={99}
              >
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Avatar and Menu */}
          <Tooltip title="الملف الشخصي">
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
                src={user?.profile?.avatar}
              >
                {user?.fullName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 250,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="600">
              {user?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            {user?.studentCode && (
              <Typography variant="caption" color="text.secondary">
                كود الطالب: {user.studentCode}
              </Typography>
            )}
          </Box>

          <MenuItem onClick={handleDashboardClick}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText>لوحة التحكم</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>الملف الشخصي</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleSettingsClick}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>الإعدادات</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>
              <Typography color="error">تسجيل الخروج</Typography>
            </ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 300,
              maxHeight: 400,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">الإشعارات</Typography>
          </Box>

          {/* TODO: Add notification items here */}
          <MenuItem>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              لا توجد إشعارات جديدة
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
