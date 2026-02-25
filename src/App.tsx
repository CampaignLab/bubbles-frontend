import { useEffect, useState } from 'react';
import DashboardPage from './features/dashboard/DashboardPage';
import AuthPage from './features/auth/AuthPage';
import VerifyEmailPage from './features/auth/VerifyEmailPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  // Synchronous initial route check to catch the hash before it's cleared by Supabase/Vite
  const [route, setRoute] = useState<'main' | 'verify' | 'reset-password'>(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const sParams = new URLSearchParams(search);
    const hParams = new URLSearchParams(hash.replace('#', ''));

    const hasError = sParams.has('error') || sParams.has('error_code') ||
      hParams.has('error') || hParams.has('error_code');

    if (hash.includes('type=recovery')) return 'reset-password';
    if (hash.includes('type=signup') || hash.includes('type=invite') ||
      hash.includes('type=magiclink') || hasError) return 'verify';

    return 'main';
  });

  useEffect(() => {
    // Only remove the index.html splash screen once the initial auth state is resolved
    if (!loading) {
      document.body.classList.add('app-loaded');
    }
  }, [loading]);

  useEffect(() => {
    const checkHashRoute = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const sParams = new URLSearchParams(search);
      const hParams = new URLSearchParams(hash.replace('#', ''));

      const hasError = sParams.has('error') || sParams.has('error_code') ||
        hParams.has('error') || hParams.get('error_code');

      if (hash.includes('type=recovery')) {
        setRoute('reset-password');
      } else if (hash.includes('type=signup') || hash.includes('type=invite') ||
        hash.includes('type=magiclink') || hasError) {
        setRoute('verify');
      } else {
        setRoute('main');
      }
    };

    // Listen for manual or programmatic hash changes
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
