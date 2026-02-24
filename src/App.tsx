import { useEffect, useState } from 'react';
import DashboardPage from './features/dashboard/DashboardPage';
import AuthPage from './features/auth/AuthPage';
import VerifyEmailPage from './features/auth/VerifyEmailPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  // Lightweight hash router state
  const [route, setRoute] = useState<'main' | 'verify' | 'reset-password'>('main');

  useEffect(() => {
    // Only remove the index.html splash screen once the initial auth state is resolved
    if (!loading) {
      document.body.classList.add('app-loaded');
    }
  }, [loading]);

  useEffect(() => {
    // 1. Initial check on mount
    const checkHashRoute = () => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setRoute('reset-password');
      } else if (hash.includes('type=signup') || hash.includes('type=invite') || hash.includes('type=magiclink')) {
        setRoute('verify');
      } else {
        setRoute('main');
      }
    };

    checkHashRoute();

    // 2. Listen for manual or programmatic hash changes (e.g. back buttons on the auth screens)
    window.addEventListener('hashchange', checkHashRoute);
    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  if (loading) {
    // Returning null allows the splash screen in index.html to remain visible
    return null;
  }

  // --- PUBLIC ROUTES (Handling incoming Supabase Emails) ---
  if (route === 'verify') {
    return <VerifyEmailPage />;
  }

  if (route === 'reset-password') {
    return <ResetPasswordPage />;
  }

  // --- MAIN APPLICATION ROUTES ---
  // If no user is logged in, show the login wall
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show the main dashboard
  return <DashboardPage />;
}

export default App
