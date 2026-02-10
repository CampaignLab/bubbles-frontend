import { useEffect } from 'react';
import DashboardPage from './features/dashboard/DashboardPage';

function App() {
  useEffect(() => {
    // Add class to body to trigger splash screen fade out
    document.body.classList.add('app-loaded');
  }, []);

  return (
    <DashboardPage />
  )
}

export default App
