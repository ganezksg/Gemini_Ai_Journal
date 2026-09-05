import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign browser ResizeObserver loop notification messages from ReactFlow / responsive charts
if (typeof window !== 'undefined') {
  const isResizeObserverError = (msg?: string) =>
    typeof msg === 'string' &&
    (msg.includes('ResizeObserver loop completed with undelivered notifications') ||
      msg.includes('ResizeObserver loop limit exceeded'));

  window.addEventListener(
    'error',
    (e: ErrorEvent) => {
      if (isResizeObserverError(e.message)) {
        e.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (e: PromiseRejectionEvent) => {
      if (isResizeObserverError(e.reason?.message)) {
        e.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
