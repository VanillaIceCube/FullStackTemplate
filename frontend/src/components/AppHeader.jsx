import useNotifications from '../hooks/useNotifications';
import useSession from '../hooks/useSession';
import { getSessionVersion } from '../services/sessionState';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ClearIcon from '@mui/icons-material/Clear';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  AppBar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import {
  clearAllNotifications,
  clearNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApiClient';
import { logout } from '../services/requestClient';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const notificationApi = {
  fetchNotifications,
  markNotificationRead,
  clearNotification,
  markAllNotificationsRead,
  clearAllNotifications,
};

export default function AppHeader({ title, setDrawerOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const session = useSession();
  const { username: profileUsername, email: profileEmail } = session;
  const profilePrimary = profileUsername || profileEmail.split?.('@')?.[0] || 'username';
  const profileSecondary =
    profileEmail || (profilePrimary === 'username' ? 'username@gmail.com' : null);
  const {
    notifications,
    notificationsLoading,
    notificationError,
    actionPending,
    pendingIds,
    unreadCount,
    loadNotifications,
    markRead,
    clearNotification: handleClearNotification,
    markAllRead: handleMarkAllRead,
    clearAll: handleClearAll,
  } = useNotifications(notificationApi);

  const handleOpenNotification = async (notification) => {
    if (!(await markRead(notification)) || getSessionVersion() !== session.version) return;
    if (notification.target_path) {
      setNotificationAnchorEl(null);
      navigate(notification.target_path);
    }
  };

  if (AUTH_PATHS.includes(location.pathname)) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton
            size="large"
            color="inherit"
            aria-label="notifications"
            onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Popover
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={() => setNotificationAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  width: { xs: 320, sm: 380 },
                  maxWidth: 'calc(100vw - 24px)',
                },
              },
            }}
          >
            <Box sx={{ p: 1.5 }}>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                {notifications.length > 0 && (
                  <Button
                    size="small"
                    disabled={actionPending || pendingIds.size > 0}
                    sx={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}
                    onClick={unreadCount > 0 ? handleMarkAllRead : handleClearAll}
                  >
                    {unreadCount > 0 ? 'Mark all read' : 'Clear all'}
                  </Button>
                )}
              </Stack>
              <Divider sx={{ my: 1 }} />
              {notificationsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {!notificationsLoading && notificationError && notifications.length === 0 && (
                <Stack spacing={1} sx={{ py: 2, alignItems: 'flex-start' }}>
                  <Typography role="status" variant="body2">
                    {notificationError}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={loadNotifications}
                  >
                    Retry
                  </Button>
                </Stack>
              )}
              {!notificationsLoading && !notificationError && notifications.length === 0 && (
                <Typography variant="body2">No notifications yet.</Typography>
              )}
              {!notificationsLoading && notifications.length > 0 && (
                <>
                  {notificationError && (
                    <Typography role="status" variant="body2" sx={{ pb: 1, color: 'error.main' }}>
                      {notificationError}
                    </Typography>
                  )}
                  <List dense disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.map((notification, index) => (
                      <ListItem
                        key={notification.id}
                        disablePadding
                        divider={index < notifications.length - 1}
                      >
                        <ListItemButton
                          disabled={actionPending || pendingIds.has(notification.id)}
                          onClick={() => handleOpenNotification(notification)}
                          sx={{
                            alignItems: 'flex-start',
                            bgcolor: notification.is_read ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          <ListItemText
                            primary={notification.title}
                            secondary={notification.message}
                            slotProps={{
                              primary: {
                                sx: {
                                  color: 'var(--secondary-color)',
                                  fontWeight: notification.is_read ? 500 : 'bold',
                                },
                              },
                              secondary: { sx: { color: 'var(--secondary-color)' } },
                            }}
                          />
                          <Tooltip title="Clear notification">
                            <IconButton
                              aria-label="Clear notification"
                              size="small"
                              disabled={actionPending || pendingIds.has(notification.id)}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleClearNotification(notification.id);
                              }}
                              sx={{
                                width: 40,
                                height: 40,
                                ml: 1,
                                alignSelf: 'center',
                                flexShrink: 0,
                                color: 'var(--secondary-color)',
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          </Popover>
          <IconButton
            size="large"
            color="inherit"
            aria-label="user profile"
            onClick={(event) => setProfileAnchorEl(event.currentTarget)}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={() => setProfileAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 220,
                },
              },
            }}
          >
            <MenuItem
              disableRipple
              sx={{
                cursor: 'default',
                '&:hover': { backgroundColor: 'transparent' },
                py: 0.75,
              }}
            >
              <ListItemText
                primary={profilePrimary}
                secondary={profileSecondary}
                slotProps={{
                  primary: { sx: { fontWeight: 'bold', color: 'var(--secondary-color)' } },
                  secondary: { sx: { color: 'var(--secondary-color)', opacity: 1 } },
                }}
              />
            </MenuItem>
            <Divider
              variant="middle"
              sx={{ my: 0.25, mx: 1, borderBottomWidth: 2, bgcolor: 'var(--secondary-color)' }}
            />
            {import.meta.env.VITE_MCP_ENABLED === '1' && (
              <MenuItem
                component={RouterLink}
                to="/connections"
                onClick={() => setProfileAnchorEl(null)}
              >
                Connected Apps
              </MenuItem>
            )}
            <MenuItem
              sx={{
                py: 0.5,
                px: 1.5,
                minHeight: 'auto',
                fontWeight: 'bold',
                color: 'var(--secondary-color)',
              }}
              onClick={() => {
                setProfileAnchorEl(null);
                logout();
              }}
            >
              Logout
            </MenuItem>
          </Menu>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen((current) => !current)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
