const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const sendLog = async (level, message, attributes = {}) => {
  // Always log to console for development
  if (level === 'error') {
    console.error(message, attributes);
  } else if (level === 'warn') {
    console.warn(message, attributes);
  } else {
    console.log(`[${level.toUpperCase()}]`, message, attributes);
  }

  // Only send to backend in production to avoid dev spam, 
  // or remove this check if you want local logs too.
  if (!isProd) return;

  try {
    await fetch(`${API_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        ...attributes,
        url: window.location.href,
        userAgent: navigator.userAgent
      }),
    });
  } catch (err) {
    // Silently fail if logging fails so we don't cause infinite loops
    console.error('Failed to send log to backend', err);
  }
};

export const logger = {
  info: (message, attributes) => sendLog('info', message, attributes),
  warn: (message, attributes) => sendLog('warn', message, attributes),
  error: (message, attributes) => sendLog('error', message, attributes),
  debug: (message, attributes) => sendLog('debug', message, attributes),
};
