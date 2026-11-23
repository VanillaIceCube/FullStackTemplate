import useSession from '../../hooks/useSession';
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
import { Link as RouterLink, useLocation } from 'react-router';
import { logout } from '../../services/requestClient';
import NotificationsMenu from './NotificationsMenu';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function AppHeader({ title, setDrawerOpen }) {
  const location = useLocation();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const session = useSession();
  const { username: profileUsername, email: profileEmail } = session;
  const profilePrimary = profileUsername || profileEmail.split?.('@')?.[0] || 'username';
  const profileSecondary =
    profileEmail || (profilePrimary === 'username' ? 'username@gmail.com' : null);
  if (AUTH_PATHS.includes(location.pathname)) return null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <NotificationsMenu />
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
                  primary: { sx: { fontWeight: 'bold', color: 'var(--surface-text)' } },
                  secondary: { sx: { color: 'var(--surface-text)', opacity: 1 } },
                }}
              />
            </MenuItem>
            <Divider
              variant="middle"
              sx={{ my: 0.25, mx: 1, borderBottomWidth: 2, bgcolor: 'var(--surface-text)' }}
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
                color: 'var(--surface-text)',
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
