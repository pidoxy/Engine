import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Teal Brand Color (from logo/sidebar active state)
        brand: {
          50: '#f0f9fa',
          100: '#dcfce7', // Lighter for badges
          500: '#14b8a6', // Teal
          600: '#2563eb', // A blue-ish brand color seen in the screenshot button
          700: '#1e40af',
          900: '#0f172a', // Dark slate for text
        },
        // Semantic Colors matching the screenshot badges
        status: {
          emergency: '#fee2e2', // Red-100
          emergencyText: '#ef4444', // Red-500
          urgent: '#ffedd5', // Orange-100
          urgentText: '#f97316', // Orange-500
          routine: '#dcfce7', // Green-100
          routineText: '#10b981', // Green-500
          refer: '#fef3c7', // Amber-100
          referText: '#f59e0b', // Amber-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};