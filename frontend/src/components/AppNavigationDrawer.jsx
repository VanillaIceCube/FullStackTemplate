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
import { useNavigate } from 'react-router-dom';

export default function AppNavigationDrawer({ open, setOpen }) {
  const navigate = useNavigate();

  const goHome = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
      <Box sx={{ width: { xs: 280, sm: 320 } }} role="navigation">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Typography variant="h6">Full Stack Template</Typography>
          <IconButton aria-label="close navigation" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        <List>
          <ListItemButton selected onClick={goHome}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
          Add application navigation here.
        </Typography>
      </Box>
    </Drawer>
  );
}
