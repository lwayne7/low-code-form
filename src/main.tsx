import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './components/common/common.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

if (import.meta.env.DEV) {
  void import('./utils/performanceTester').then(({ registerPerformanceTest }) => {
    registerPerformanceTest();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
