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

    // Priority 1: Programmatic Dev Route
    if (hash.includes('route=signup') && import.meta.env.VITE_BYPASS_ENABLED === 'true') {
      console.log('[App] Routing to: hidden-signup (Dev Route)');
      return 'hidden-signup';
    }

    // Priority 2: Real Supabase Auth Flow Types
    if (hash.includes('type=recovery')) {
      console.log('[App] Routing to: reset-password');
      return 'reset-password';
    }
    if (hash.includes('type=signup')) {
      console.log('[App] Routing to: hidden-signup');
      return 'hidden-signup';
    }
    if (hash.includes('type=magiclink') || hash.includes('type=invite') || hasError) {
      console.log('[App] Routing to: first-time-login');
      return 'first-time-login';
    }

    console.log('[App] Routing to: main');
    return 'main';
  });

  useEffect(() => {
    console.log('[App] Render:', { user: !!user, loading, route, hash: window.location.hash });
    // Only remove the index.html splash screen once the initial auth state is resolved
    if (!loading) {
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

      console.log('[App] Hash Change Check:', { hash, currentRoute: route });

      // If we are already on an auth route, only change if there's a NEW explicit auth type in the hash.
      // We DO NOT reset to 'main' just because the hash was cleared (Supabase clears it automatically).
      if (hash.includes('route=signup') && import.meta.env.VITE_BYPASS_ENABLED === 'true') {
        setRoute('hidden-signup');
      } else if (hash.includes('type=recovery')) {
        setRoute('reset-password');
      } else if (hash.includes('type=signup')) {
        setRoute('hidden-signup');
      } else if (hash.includes('type=magiclink') || hash.includes('type=invite') || hasError) {
        setRoute('first-time-login');
      } else {
        // If the hash is cleared and we AREN'T on one of the special pages already, go to main.
        // If we ARE on a special page, stay there! The child component will handle navigation when it's done.
        const isAuthRoute = ['first-time-login', 'hidden-signup', 'reset-password'].includes(route);
        if (!isAuthRoute && !hash.includes('type=') && !hash.includes('route=')) {
          setRoute('main');
        }
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

  // FORCE AUTH FLOWS: Even if logged in, if we suspect they need to set a password
  // (e.g. hash was 'invite' or metadata says they are a fresh invite)
  // we keep them on the FirstTimeLogin page.
  if (route === 'first-time-login') {
    console.log('[App] Guard: User logged in but route is still first-time-login. Staying on invite page.');
    return <FirstTimeLogin />;
  }

  // User is authenticated, show the main dashboard
  return <DashboardPage />;
}

export default App
