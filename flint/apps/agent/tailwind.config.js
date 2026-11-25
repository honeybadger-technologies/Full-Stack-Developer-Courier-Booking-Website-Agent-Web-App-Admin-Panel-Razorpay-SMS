export default {
  mode: 'jit',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#f8fafc',
        surface: '#ffffff',
        textMain: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      screens: {
        'mobile': '375px',
        'tablet': '768px',
        'desktop': '1024px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
