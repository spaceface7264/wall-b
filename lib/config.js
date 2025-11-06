// Environment Configuration
// Centralized configuration management for better control

const config = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Send Train',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'A modern bouldering community app',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },

  // Feature Flags
  features: {
    chat: import.meta.env.VITE_ENABLE_CHAT === 'true',
    communities: import.meta.env.VITE_ENABLE_COMMUNITIES === 'true',
    gyms: import.meta.env.VITE_ENABLE_GYMS === 'true',
    events: import.meta.env.VITE_ENABLE_EVENTS === 'true',
  },

  // Environment
  env: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    isDebug: import.meta.env.VITE_DEBUG === 'true',
  },

  // Analytics
  analytics: {
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN,
  },

  // Validation
  validate() {
    const required = [
      'supabase.url',
      'supabase.anonKey',
    ];

    const missing = required.filter(key => {
      const value = key.split('.').reduce((obj, k) => obj?.[k], config);
      return !value;
    });

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  },
};

// Validate configuration on import
if (typeof window === 'undefined') {
  // Server-side validation
  try {
    config.validate();
  } catch (error) {
    console.warn('Configuration validation failed:', error.message);
  }
}

export default config;



