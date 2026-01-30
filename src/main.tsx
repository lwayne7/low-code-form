import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './components/common/common.css'
import App from './App.tsx'
import { ErrorBoundary, ErrorBoundaryWithI18n } from './components/ErrorBoundary.tsx'
import { I18nProvider } from './i18n'

if (import.meta.env.DEV) {
  void import('./utils/performanceTester').then(({ registerPerformanceTest }) => {
    registerPerformanceTest();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <ErrorBoundaryWithI18n>
          <App />
        </ErrorBoundaryWithI18n>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
)
