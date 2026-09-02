import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import NotificationsPopover from './NotificationsPopover';
import { logout } from '../services/requestClient';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

function safeGetSessionItem(key) {
  try {
    return sessionStorage.getItem(key) || '';
  } catch (_error) {
    return '';
  }
}

export default function AppHeader({ title, setDrawerOpen }) {
  const location = useLocation();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  const profileUsername = safeGetSessionItem('username');
  const profileEmail = safeGetSessionItem('email');
  const profilePrimary = profileUsername || profileEmail.split?.('@')?.[0] || 'username';
  const profileSecondary =
    profileEmail || (profilePrimary === 'username' ? 'username@gmail.com' : null);

  if (AUTH_PATHS.includes(location.pathname)) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          color: 'var(--secondary-background-color)',
          background: 'var(--background-color)',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <NotificationsPopover />
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
                  backgroundColor: 'var(--secondary-background-color)',
                  color: 'var(--secondary-color)',
                  boxShadow: 3,
                  border: '2.5px solid var(--background-color)',
                  borderRadius: 1.5,
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
