import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VeriHub Dark Theme
        background: '#0a0a0a',
        foreground: '#f8fafc',
        
        // Primary dark surfaces
        'dark-surface': '#141414',
        'dark-surface-2': '#1f1f23',
        'dark-surface-3': '#2a2a2e',
        
        // Purple accents
        'veri-purple': '#8b5cf6',
        'veri-purple-light': '#a855f7',
        'veri-purple-dark': '#7c3aed',
        
        // Cyberpunk orange
        'veri-orange': '#ff6b35',
        'veri-orange-light': '#ff7849',
        'veri-orange-dark': '#e55a2b',
        
        // Muted teal
        'veri-teal': '#14b8a6',
        'veri-teal-light': '#2dd4bf',
        
        // Grays
        'veri-gray': '#64748b',
        'veri-gray-light': '#94a3b8',
        'veri-gray-dark': '#475569',
        
        // Status colors
        'veri-warning': '#fbbf24',
        'veri-danger': '#f87171',
        'veri-success': '#34d399',
        
        // Card and UI elements
        card: '#141414',
        'card-foreground': '#f8fafc',
        border: '#2a2a2e',
        input: '#1f1f23',
        ring: '#8b5cf6',
        
        // Accent variants
        accent: '#1f1f23',
        'accent-foreground': '#f8fafc',
        muted: '#2a2a2e',
        'muted-foreground': '#94a3b8',
        
        primary: {
          DEFAULT: '#8b5cf6',
          foreground: '#f8fafc',
        },
        secondary: {
          DEFAULT: '#1f1f23',
          foreground: '#f8fafc',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'veri-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ff6b35 100%)',
        'veri-gradient-subtle': 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%)',
        'cyber-glow': 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;