// Environment Configuration
// Centralized configuration management for better control

const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Wall-B',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A modern bouldering community app',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },

  // Feature Flags
  features: {
    chat: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
    communities: process.env.NEXT_PUBLIC_ENABLE_COMMUNITIES === 'true',
    gyms: process.env.NEXT_PUBLIC_ENABLE_GYMS === 'true',
    events: process.env.NEXT_PUBLIC_ENABLE_EVENTS === 'true',
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDebug: process.env.NEXT_PUBLIC_DEBUG === 'true',
  },

  // Analytics
  analytics: {
    gaTrackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
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



