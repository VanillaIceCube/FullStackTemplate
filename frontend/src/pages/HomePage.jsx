import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CloudDone from '@mui/icons-material/CloudDone';
import Delete from '@mui/icons-material/Delete';
import FolderShared from '@mui/icons-material/FolderShared';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

const demoRows = [
  { name: 'Authentication', status: 'Ready', color: 'success' },
  { name: 'Workspace sharing', status: 'Example', color: 'info' },
  { name: 'Notifications', status: 'Ready', color: 'success' },
];

function ShowcaseSection({ title, description, children }) {
  return (
    <Paper
      component="section"
      elevation={2}
      sx={{ p: { xs: 2.5, md: 3 }, background: 'var(--secondary-background-color)' }}
    >
      <Typography component="h2" variant="h5" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

export default function HomePage({ setAppBarHeader, showSnackbar }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [role, setRole] = useState('member');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setAppBarHeader?.('Component Library');
    document.title = 'FullStackTemplate - Component Library';
  }, [setAppBarHeader]);

  return (
    <Box component="main" sx={{ minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Stack spacing={3} sx={{ width: 'min(1120px, calc(100% - 32px))', mx: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            color: 'var(--secondary-color)',
            background: 'var(--secondary-background-color)',
          }}
        >
          <Stack spacing={2}>
            <Typography component="h1" variant="h3" fontWeight="bold">
              Full-stack component library
            </Typography>
            <Typography variant="h6" fontWeight={400}>
              A protected showcase of the reusable authentication, navigation, feedback, data-entry,
              sharing, and notification patterns included in this template.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/workspaces"
                variant="contained"
                startIcon={<FolderShared />}
              >
                Open workspace example
              </Button>
              <Button
                variant="outlined"
                startIcon={<CheckCircle />}
                onClick={() => showSnackbar?.('success', 'Reusable snackbar feedback is working.')}
              >
                Show success message
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { md: '1fr 1fr' } }}>
          <ShowcaseSection
            title="Actions and status"
            description="Common action hierarchy, status chips, progress, and alerts."
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="contained">Primary action</Button>
                <Button variant="outlined">Secondary</Button>
                <Button variant="text">Tertiary</Button>
                <Button color="error" startIcon={<Delete />}>
                  Destructive
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label="Success" color="success" />
                <Chip label="In progress" color="info" variant="outlined" />
                <Chip label="Needs attention" color="warning" />
              </Stack>
              <Alert severity="info">Use alerts for persistent, contextual feedback.</Alert>
              <LinearProgress variant="determinate" value={68} aria-label="Example progress" />
            </Stack>
          </ShowcaseSection>

          <ShowcaseSection
            title="Forms"
            description="Responsive fields and controls using the shared Material UI theme."
          >
            <Stack spacing={2}>
              <TextField label="Display name" defaultValue="Example User" fullWidth />
              <TextField label="Email" type="email" defaultValue="user@example.com" fullWidth />
              <Select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                inputProps={{ 'aria-label': 'Example role' }}
                fullWidth
              >
                <MenuItem value="owner">Owner</MenuItem>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={(event) => setEnabled(event.target.checked)}
                    />
                  }
                  label="Enabled"
                />
                <FormControlLabel control={<Checkbox defaultChecked />} label="Send updates" />
              </Stack>
            </Stack>
          </ShowcaseSection>

          <ShowcaseSection
            title="Data display"
            description="Cards, avatars, lists, links, and concise status metadata."
          >
            <List disablePadding>
              {demoRows.map((row, index) => (
                <ListItem key={row.name} divider={index < demoRows.length - 1}>
                  <ListItemAvatar>
                    <Avatar>
                      <CloudDone />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={row.name} secondary="Reusable template capability" />
                  <Chip label={row.status} color={row.color} size="small" />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Link component={RouterLink} to="/workspaces">
              View the complete Workspace → Collection → Item example
            </Link>
          </ShowcaseSection>

          <ShowcaseSection
            title="Loading, empty, and confirmation states"
            description="Starter states that can be reused instead of rebuilding feedback each time."
          >
            <Stack spacing={2}>
              <Box>
                <Skeleton variant="text" width="55%" height={32} />
                <Skeleton variant="rounded" height={72} />
              </Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">No records yet</Typography>
                  <Typography color="text.secondary">
                    Empty states should explain what belongs here and offer a next action.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button onClick={() => showSnackbar?.('info', 'Example record created.')}>
                    Create first record
                  </Button>
                </CardActions>
              </Card>
              <Button color="error" variant="outlined" onClick={() => setDialogOpen(true)}>
                Open confirmation dialog
              </Button>
            </Stack>
          </ShowcaseSection>
        </Box>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Remove this example?</DialogTitle>
        <DialogContent>
          <Typography>This demonstrates a reusable destructive-action confirmation.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setDialogOpen(false);
              showSnackbar?.('success', 'Example removed.');
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
