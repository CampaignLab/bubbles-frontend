import { useEffect } from 'react';
import DashboardPage from './features/dashboard/DashboardPage';
import AuthPage from './features/auth/AuthPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only remove the index.html splash screen once the initial auth state is resolved
    if (!loading) {
      document.body.classList.add('app-loaded');
    }
  }, [loading]);

  if (loading) {
    // Returning null allows the splash screen in index.html to remain visible
    return null;
  }

  // If no user is logged in, show the login wall
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show the main dashboard
  return <DashboardPage />;
}

export default App
