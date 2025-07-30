/**
 * Sidebar Component for ICSHD GENIUSES
 * Navigation sidebar with role-based menu items
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  School,
  Person,
  Assessment,
  TrendingUp,
  Settings,
  PlayArrow,
  EmojiEvents,
  Group,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore,
  Calculate,
  Psychology,
  Games,
  Speed,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

const DRAWER_WIDTH = 280;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState({});

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleExpandClick = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      {
        key: 'dashboard',
        label: 'لوحة التحكم',
        icon: <Dashboard />,
        path: '/dashboard',
      },
      {
        key: 'profile',
        label: 'الملف الشخصي',
        icon: <Person />,
        path: '/profile',
      },
    ];

    const studentItems = [
      {
        key: 'training',
        label: 'التدريب',
        icon: <PlayArrow />,
        children: [
          {
            key: 'soroban',
            label: 'السوروبان',
            icon: <Calculate />,
            path: '/training/soroban',
          },
          {
            key: 'vedic',
            label: 'الرياضيات الفيدية',
            icon: <Psychology />,
            path: '/training/vedic',
          },
          {
            key: 'logic',
            label: 'المنطق الرياضي',
            icon: <School />,
            path: '/training/logic',
          },
          {
            key: 'iqgames',
            label: 'ألعاب الذكاء',
            icon: <Games />,
            path: '/training/iqgames',
          },
        ],
      },
      {
        key: 'progress',
        label: 'التقدم والإحصائيات',
        icon: <TrendingUp />,
        path: '/progress',
      },
      {
        key: 'achievements',
        label: 'الإنجازات',
        icon: <EmojiEvents />,
        path: '/achievements',
      },
      {
        key: 'assessment',
        label: 'التقييم',
        icon: <Assessment />,
        path: '/assessment',
      },
    ];

    const trainerItems = [
      {
        key: 'students',
        label: 'الطلاب',
        icon: <Group />,
        children: [
          {
            key: 'student-list',
            label: 'قائمة الطلاب',
            icon: <Group />,
            path: '/trainer/students',
          },
          {
            key: 'student-progress',
            label: 'تقدم الطلاب',
            icon: <TrendingUp />,
            path: '/trainer/progress',
          },
          {
            key: 'promotions',
            label: 'الترقيات',
            icon: <EmojiEvents />,
            path: '/trainer/promotions',
          },
        ],
      },
      {
        key: 'sessions',
        label: 'الجلسات',
        icon: <PlayArrow />,
        children: [
          {
            key: 'active-sessions',
            label: 'الجلسات النشطة',
            icon: <Speed />,
            path: '/trainer/sessions/active',
          },
          {
            key: 'session-history',
            label: 'تاريخ الجلسات',
            icon: <Assessment />,
            path: '/trainer/sessions/history',
          },
        ],
      },
      {
        key: 'reports',
        label: 'التقارير',
        icon: <Assessment />,
        path: '/trainer/reports',
      },
    ];

    const adminItems = [
      {
        key: 'users',
        label: 'إدارة المستخدمين',
        icon: <AdminPanelSettings />,
        children: [
          {
            key: 'all-users',
            label: 'جميع المستخدمين',
            icon: <Group />,
            path: '/admin/users',
          },
          {
            key: 'trainers',
            label: 'المدربين',
            icon: <Person />,
            path: '/admin/trainers',
          },
          {
            key: 'students',
            label: 'الطلاب',
            icon: <School />,
            path: '/admin/students',
          },
        ],
      },
      {
        key: 'system',
        label: 'النظام',
        icon: <Settings />,
        children: [
          {
            key: 'system-stats',
            label: 'إحصائيات النظام',
            icon: <Assessment />,
            path: '/admin/system/stats',
          },
          {
            key: 'system-settings',
            label: 'إعدادات النظام',
            icon: <Settings />,
            path: '/admin/system/settings',
          },
        ],
      },
      {
        key: 'analytics',
        label: 'التحليلات',
        icon: <TrendingUp />,
        path: '/admin/analytics',
      },
    ];

    // Combine items based on user role
    let menuItems = [...commonItems];

    if (user?.role === 'student') {
      menuItems = [...menuItems, ...studentItems];
    } else if (user?.role === 'trainer') {
      menuItems = [...menuItems, ...trainerItems];
    } else if (user?.role === 'admin') {
      menuItems = [...menuItems, ...adminItems];
    }

    return menuItems;
  };

  const renderMenuItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.key];
    const active = item.path ? isActive(item.path) : false;

    return (
      <React.Fragment key={item.key}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleExpandClick(item.key);
              } else if (item.path) {
                handleMenuClick(item.path);
              }
            }}
            sx={{
              pl: 2 + depth * 2,
              pr: 2,
              py: 1,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              backgroundColor: active ? 'primary.main' : 'transparent',
              color: active ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: active ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: active ? 'primary.contrastText' : 'text.secondary',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <School sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" fontWeight="bold">
          ICSHD GENIUSES
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          منصة العباقرة للحساب الذهني
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {user?.fullName?.charAt(0)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role === 'student' && user?.studentCode}
              {user?.role === 'trainer' && 'مدرب'}
              {user?.role === 'admin' && 'مدير'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {getMenuItems().map(item => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuClick('/settings')}
            sx={{
              borderRadius: 1,
              color: 'text.secondary',
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              <Settings />
            </ListItemIcon>
            <ListItemText
              primary="الإعدادات"
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
