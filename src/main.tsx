import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle and suppress benign WebSocket connection errors from Vite/HMR in sandbox
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message || reason?.toString() || '');
    if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('websocket') || msg.includes('WebSocket closed')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('websocket') || msg.includes('WebSocket closed')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

// Unregister Service Workers to heal MIME type and stale cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered old Service Worker.');
          if ('caches' in window) {
            caches.keys().then((keys) => {
              keys.forEach((key) => caches.delete(key));
            });
          }
        }
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
