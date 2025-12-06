/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Glassmorphism colors
        glass: {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
        },
        electric: {
          blue: '#3b82f6',
          'blue-light': '#60a5fa',
          'blue-dark': '#2563eb',
          purple: '#a855f7',
          'purple-light': '#c084fc',
          'purple-dark': '#9333ea',
          pink: '#ec4899',
          'pink-light': '#f472b6',
          'pink-dark': '#db2777',
          cyan: '#06b6d4',
          'cyan-light': '#22d3ee',
          'cyan-dark': '#0891b2',
        },
        status: {
          success: '#10b981',
          'success-light': '#34d399',
          'success-dark': '#059669',
          warning: '#f59e0b',
          'warning-light': '#fbbf24',
          'warning-dark': '#d97706',
          error: '#ef4444',
          'error-light': '#f87171',
          'error-dark': '#dc2626',
          info: '#3b82f6',
          'info-light': '#60a5fa',
          'info-dark': '#2563eb',
        },
        gradient: {
          primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          secondary: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%)',
          accent: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-outfit)', 'var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
        'glass-lg': '30px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)',
        'glow-yellow': '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
        'glow-gradient': '0 0 30px rgba(99, 102, 241, 0.4), 0 0 60px rgba(168, 85, 247, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 30px rgba(0, 212, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};

