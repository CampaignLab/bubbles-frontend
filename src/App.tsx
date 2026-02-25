import { useEffect, useState } from 'react';
import DashboardPage from './features/dashboard/DashboardPage';
import AuthPage from './features/auth/AuthPage';
import HiddenSignUp from './features/auth/HiddenSignUp';
import FirstTimeLogin from './features/auth/FirstTimeLogin';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  // Synchronous initial route check to catch the hash before it's cleared by Supabase/Vite
  const [route, setRoute] = useState<'main' | 'first-time-login' | 'hidden-signup' | 'reset-password'>(() => {
    const hash = (window as any).__INITIAL_HASH__ || window.location.hash;
    const search = (window as any).__INITIAL_SEARCH__ || window.location.search;
    const sParams = new URLSearchParams(search);
    const hParams = new URLSearchParams(hash.replace('#', ''));

    const hasError = sParams.has('error') || sParams.has('error_code') ||
      hParams.has('error') || hParams.has('error_code');

    if (hash.includes('type=recovery') && import.meta.env.VITE_BYPASS_ENABLED === 'true') return 'hidden-signup';
    if (hash.includes('type=recovery')) return 'reset-password';
    if (hash.includes('type=magiclink') || hash.includes('type=invite') || hasError) return 'first-time-login';
    if (hash.includes('route=signup') && import.meta.env.VITE_BYPASS_ENABLED === 'true') return 'hidden-signup';
    if (import.meta.env.VITE_BYPASS_ENABLED === 'true' && hash.includes('type=signup')) return 'hidden-signup';

    return 'main';
  });

  useEffect(() => {
    console.log('[App] Auth State:', { user: !!user, loading, route });
    // Only remove the index.html splash screen once the initial auth state is resolved
    if (!loading) {
      console.log('[App] Auth resolved, removing splash screen.');
      document.body.classList.add('app-loaded');
    }
  }, [loading, user, route]);

  useEffect(() => {
    const checkHashRoute = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const sParams = new URLSearchParams(search);
      const hParams = new URLSearchParams(hash.replace('#', ''));

      const hasError = sParams.has('error') || sParams.has('error_code') ||
        hParams.has('error') || hParams.get('error_code');

      if (hash.includes('type=recovery') && import.meta.env.VITE_BYPASS_ENABLED === 'true') {
        setRoute('hidden-signup');
      } else if (hash.includes('type=recovery')) {
        setRoute('reset-password');
      } else if (hash.includes('type=magiclink') || hash.includes('type=invite') || hasError) {
        setRoute('first-time-login');
      } else if (hash.includes('route=signup') && import.meta.env.VITE_BYPASS_ENABLED === 'true') {
        setRoute('hidden-signup');
      } else if (import.meta.env.VITE_BYPASS_ENABLED === 'true' && hash.includes('type=signup')) {
        setRoute('hidden-signup');
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
  if (route === 'first-time-login') {
    return <FirstTimeLogin />;
  }

  if (route === 'hidden-signup') {
    return <HiddenSignUp />;
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
