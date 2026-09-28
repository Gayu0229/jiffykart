/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: '#505081',
        secondary: '#272757',
        accent: '#8686AC',
        surface: '#ffffff',
        background: '#F5F5FA',
        price: '#059669',
        dark: '#0F0E47',
        highlight: '#f43f5e',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(15, 14, 71, 0.08)',
        'glow': '0 0 20px rgba(80, 80, 129, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [],
}
