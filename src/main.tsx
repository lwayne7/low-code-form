import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';
import './components/common/common.css';
import App from './App.tsx';
import { ErrorBoundary, ErrorBoundaryWithI18n } from './components/ErrorBoundary.tsx';
import { I18nProvider } from './i18n';
import { pluginManager } from './plugins/pluginManager';
import { loggerPlugin, codeCommentPlugin } from './plugins/examples';
import { useStore } from './store';
import { eventBus } from './utils/eventBus';

// 初始化插件系统
pluginManager.register(codeCommentPlugin);
if (import.meta.env.DEV) {
  pluginManager.register(loggerPlugin);
}
pluginManager.init({
  getComponents: () => useStore.getState().components,
  getSelectedIds: () => useStore.getState().selectedIds,
  emit: eventBus.emit.bind(eventBus),
  on: eventBus.on.bind(eventBus),
});

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
  </StrictMode>
);
