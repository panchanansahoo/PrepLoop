import { createLogger } from './logger';

const logger = createLogger('service-worker');

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service Worker not supported');
    return null;
  }

  if (import.meta.env.DEV) {
    logger.info('Service Worker disabled in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    logger.info('Service Worker registered', {
      scope: registration.scope
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          logger.info('New Service Worker available');
          
          // Notify user about update
          if (window.confirm('New version available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    return registration;
  } catch (error) {
    logger.error('Service Worker registration failed', {
      error: error.message
    });
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    logger.info('Service Worker unregistered');
  } catch (error) {
    logger.error('Service Worker unregistration failed', {
      error: error.message
    });
  }
};

export const checkForUpdates = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    logger.info('Checked for Service Worker updates');
  } catch (error) {
    logger.error('Service Worker update check failed', {
      error: error.message
    });
  }
};
