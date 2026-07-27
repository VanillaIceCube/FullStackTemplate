import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import AppSnackbar from './components/AppSnackbar';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import NavigationBridge from './components/NavigationBridge';
import WorkspaceHomeRedirect from './components/WorkspaceHomeRedirect';
import WorkspaceNavigationDrawer from './components/WorkspaceNavigationDrawer';
import HomePage from './pages/HomePage';
import ForgotPassword from './pages/authentication/ForgotPassword';
import Login from './pages/authentication/Login';
import Register from './pages/authentication/Register';
import ResetPassword from './pages/authentication/ResetPassword';
import CollectionItemsPage from './pages/workspaces/CollectionItemsPage';
import WorkspaceCollectionsPage from './pages/workspaces/WorkspaceCollectionsPage';

function Protected({ children }) {
  return <AuthenticatedRoute>{children}</AuthenticatedRoute>;
}

export default function App() {
  const [appBarHeader, setAppBarHeader] = useState('Component Library');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerWorkspacesLabel, setDrawerWorkspacesLabel] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });

  const showSnackbar = (severity, message) => {
    setSnackbar({ open: true, severity, message });
  };

  return (
    <>
      <Router
        basename={process.env.PUBLIC_URL || '/'}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NavigationBridge />
        <AppHeader appBarHeader={appBarHeader} setDrawerOpen={setDrawerOpen} />
        <WorkspaceNavigationDrawer
          open={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          drawerWorkspacesLabel={drawerWorkspacesLabel}
          setDrawerWorkspacesLabel={setDrawerWorkspacesLabel}
          showSnackbar={showSnackbar}
        />
        <Routes>
          <Route path="/login" element={<Login showSnackbar={showSnackbar} />} />
          <Route path="/register" element={<Register showSnackbar={showSnackbar} />} />
          <Route path="/forgot-password" element={<ForgotPassword showSnackbar={showSnackbar} />} />
          <Route path="/reset-password" element={<ResetPassword showSnackbar={showSnackbar} />} />
          <Route
            path="/"
            element={
              <Protected>
                <HomePage setAppBarHeader={setAppBarHeader} showSnackbar={showSnackbar} />
              </Protected>
            }
          />
          <Route
            path="/workspaces"
            element={
              <Protected>
                <WorkspaceHomeRedirect />
              </Protected>
            }
          />
          <Route
            path="/workspace/:workspaceId"
            element={
              <Protected>
                <WorkspaceCollectionsPage setAppBarHeader={setAppBarHeader} />
              </Protected>
            }
          />
          <Route
            path="/workspace/:workspaceId/collection/:collectionId"
            element={
              <Protected>
                <CollectionItemsPage setAppBarHeader={setAppBarHeader} />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <Protected>
                <HomePage setAppBarHeader={setAppBarHeader} showSnackbar={showSnackbar} />
              </Protected>
            }
          />
        </Routes>
      </Router>
      <AppSnackbar
        open={snackbar.open}
        severity={snackbar.severity}
        message={snackbar.message}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            setSnackbar((current) => ({ ...current, open: false }));
          }
        }}
      />
    </>
  );
}
