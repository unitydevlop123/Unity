
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { VerificationProvider } from './context/VerificationContext';
import './styles/global.css';
import './styles/theme.css';
import 'video.js/dist/video-js.css';

// Suppress specific generic errors that are out of our control
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args.join(' ');
  if (
    msg.includes('Script error.') ||
    msg.includes('Load failed') ||
    msg.includes('The tag <badge> is unrecognized')
  ) {
    return;
  }
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = args.join(' ');
  if (
    msg.includes('Script error.') ||
    msg.includes('Load failed') ||
    msg.includes('The tag <badge> is unrecognized')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

window.addEventListener('error', (event) => {
  // Handle resource loading errors (e.g., images, scripts)
  if (event.target && (event.target as HTMLElement).tagName) {
    // We can't easily get the exact error message for resource failures,
    // but we can prevent them from failing tests if needed.
  }

  const message = event.message || '';
  const errorMsg = event.error?.message || '';

  if (
    message === 'Script error.' ||
    message === 'Load failed' ||
    message.includes('Script error') ||
    message.includes('Load failed') ||
    errorMsg.includes('Script error') ||
    errorMsg.includes('Load failed')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason || {};
  const message = typeof reason === 'string' ? reason : (reason.message || '');

  if (
    message === 'Load failed' || 
    message === 'Script error.' ||
    message.includes('Load failed') || 
    message.includes('Script error')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

// Prevent pinch-to-zoom on iOS Safari
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

document.addEventListener('touchmove', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Prevent double-tap to zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    // Only prevent default if it's not a form element to avoid breaking inputs
    const target = event.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
      event.preventDefault();
      // Trigger click manually since we prevented default
      if (typeof target.click === 'function') {
        target.click();
      } else if (target.parentElement && typeof target.parentElement.click === 'function') {
        // Handle cases like SVG icons where the target itself might not have .click()
        target.parentElement.click();
      }
    }
  }
  lastTouchEnd = now;
}, false);

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <VerificationProvider>
          <App />
        </VerificationProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}
