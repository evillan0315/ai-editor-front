import type { Config } from 'tailwindcss';

const config: Config = {
  // Configure Tailwind to scan these files for classes
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Enable class-based dark mode, which relies on the 'dark' class on the HTML or body element.
  darkMode: 'class',
  theme: {
    extend: {
      // You can extend Tailwind's default theme here if needed
    },
  },
  plugins: [],
};

export default config;
