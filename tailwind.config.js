/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      animation: {
        'stamp': 'stamp-effect 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      colors: {
        camino: {
          blue: '#2563eb',
          amber: '#d97706',
          slate: '#f8fafc',
        }
      },
      boxShadow: {
        'soft': '0 20px 50px rgba(0, 0, 0, 0.05)',
        'sos': '0 20px 50px rgba(220, 38, 38, 0.3)',
      }
    },
  },
  plugins: [],
}