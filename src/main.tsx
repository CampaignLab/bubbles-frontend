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

// Register Service Worker for aggressive map tile caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/bubbles-frontend/sw.js')
      .then(() => console.log('Tile Cache SW Registered'))
      .catch(err => console.log('Tile Cache SW Failed', err));
  });
}
