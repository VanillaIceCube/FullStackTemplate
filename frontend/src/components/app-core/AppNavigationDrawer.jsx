import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router';

export default function AppNavigationDrawer({ open, setOpen }) {
  const navigate = useNavigate();

  const goHome = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => setOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 15,
          borderBottomLeftRadius: 15,
        },
        '& .MuiListItemText-primary': { fontWeight: 'bold' },
      }}
    >
      <Box
        sx={{
          width: { xs: 280, sm: 320 },
          minHeight: '100%',
          bgcolor: 'var(--surface-background)',
          color: 'var(--surface-text)',
        }}
        role="navigation"
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--surface-text)' }}>
            Full Stack Template
          </Typography>
          <IconButton
            aria-label="close navigation"
            onClick={() => setOpen(false)}
            sx={{ color: 'var(--surface-text)' }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ borderBottomWidth: 2, mx: 1, bgcolor: 'var(--surface-text)' }} />
        <List>
          <ListItemButton onClick={goHome} sx={{ color: 'var(--surface-text)' }}>
            <ListItemIcon sx={{ color: 'var(--surface-text)' }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </List>
        <Typography
          variant="body2"
          sx={{ px: 2, py: 1, color: 'var(--surface-text)', opacity: 0.8 }}
        >
          Add application navigation here.
        </Typography>
      </Box>
    </Drawer>
  );
}
