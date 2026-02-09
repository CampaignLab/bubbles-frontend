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
