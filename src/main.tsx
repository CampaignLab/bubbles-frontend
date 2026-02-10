import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LogProvider } from './context/logContext.tsx'
//import Home from './features/DashboardPage.tsx'
//import { Layout } from '@/components/layout.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogProvider>
      <App />
    </LogProvider>
  </StrictMode>,
)

// Register Service Worker for aggressive tile caching
// Note: Service Workers require HTTPS or localhost.
const swPath = `${import.meta.env.BASE_URL}sw.js`;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('🛠️ [Main] Attempting SW registration at:', swPath);
    navigator.serviceWorker.register(swPath)
      .then((reg) => {
        console.log('🚀 [SW] Registered!', reg.scope);
      })
      .catch(err => {
        console.error('❌ [SW] Registration Failed:', err);
      });
  });
}
