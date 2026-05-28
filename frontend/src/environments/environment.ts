export const environment = {
  production: false,
  baseUrl: '/api',
  reverb: {
    // Echo connects through the frontend nginx proxy on the same port (80)
    // so no CORS or port issues. nginx forwards /app/* to Reverb:8080.
    appKey: 'healthmap-key-local',
    wsHost: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
    wsPort: typeof window !== 'undefined' ? Number(window.location.port || 80) : 80,
  },
};
