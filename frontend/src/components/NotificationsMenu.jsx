import ClearIcon from '@mui/icons-material/Clear';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
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
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import useNotifications from '../hooks/useNotifications';
import { useSessionGuard } from '../hooks/useSession';
import * as notificationApi from '../services/notificationApiClient';

export default function NotificationsMenu() {
  const navigate = useNavigate();
  const isCurrentSession = useSessionGuard();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const {
    notifications,
    notificationsLoading,
    notificationError,
    actionPending,
    pendingIds,
    unreadCount,
    loadNotifications,
    markRead,
    clearNotification,
    markAllRead,
    clearAll,
  } = useNotifications(notificationApi);

  async function openNotification(notification) {
    if (!(await markRead(notification)) || !isCurrentSession() || !notification.target_path) return;

    setNotificationAnchorEl(null);
    navigate(notification.target_path);
  }

  return (
    <>
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
                sx={{ color: 'var(--surface-text)', fontWeight: 'bold' }}
                onClick={unreadCount > 0 ? markAllRead : clearAll}
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
              <Button size="small" variant="outlined" color="inherit" onClick={loadNotifications}>
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
                      onClick={() => openNotification(notification)}
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
                              color: 'var(--surface-text)',
                              fontWeight: notification.is_read ? 500 : 'bold',
                            },
                          },
                          secondary: { sx: { color: 'var(--surface-text)' } },
                        }}
                      />
                      <Tooltip title="Clear notification">
                        <IconButton
                          aria-label="Clear notification"
                          size="small"
                          disabled={actionPending || pendingIds.has(notification.id)}
                          onClick={(event) => {
                            event.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          sx={{
                            width: 40,
                            height: 40,
                            ml: 1,
                            alignSelf: 'center',
                            flexShrink: 0,
                            color: 'var(--surface-text)',
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
    </>
  );
}
