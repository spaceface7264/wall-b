/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Design Tokens - Borderless Flex Layout
      colors: {
        // Primary colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Surface colors (dark theme)
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        
        // Custom dark theme colors - borderless
        dark: {
          bg: '#252526',         // Main background
          surface: '#252526',    // No visual separation
          surfaceHover: '#2a2a2b', // Subtle hover state
          divider: '#333333',    // Subtle dividers only
        },
        
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#d1d5db',
          muted: '#a1a8b3',
          subtle: '#9ca3af',
        },
        
        // Accent colors
        accent: {
          red: '#ef4444',
          green: '#10b981',
          amber: '#f59e0b',
          indigo: '#818cf8',
        },
      },
      
      // Custom spacing for borderless flex layouts
      spacing: {
        'section': '24px',      // Between major sections
        'item': '16px',         // Between flex items
        'item-sm': '12px',      // Compact item spacing
        'item-xs': '8px',       // Minimal item spacing
        'touch': '44px',        // Touch targets
        'touch-sm': '36px',
      },
      
      // Typography scale
      fontSize: {
        'mobile-xs': ['12px', { lineHeight: '1.4' }],
        'mobile-sm': ['13px', { lineHeight: '1.4' }],
        'mobile-base': ['14px', { lineHeight: '1.6' }],
        'mobile-lg': ['15px', { lineHeight: '1.5' }],
        'mobile-heading': ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'mobile-title': ['26px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      
      // Minimal border radius - only for buttons/icons
      borderRadius: {
        'none': '0',
        'minimal': '4px',
        'button': '8px',
        'icon': '4px',
        'card': '16px',
      },
      
      // Custom transitions
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      
      // Minimal shadows - only for interactive elements
      boxShadow: {
        'none': 'none',
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.12)',
      },
      
      // Animation keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'highlight': {
          '0%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      
      // Animation classes
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'highlight': 'highlight 0.6s ease-out',
      },
      
      // Divider styles
      borderWidth: {
        'hairline': '0.5px',
      },
    },
  },
  plugins: [],
}