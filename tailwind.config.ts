// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1E3A5F',
          dark:    '#122338',
          mid:     '#2a4f82',
        },
        orange: {
          DEFAULT: '#E8700A',
          light:   '#f08235',
          pale:    '#FEF3E8',
        },
        cream: '#F8F6F2',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(30,58,95,.12)',
        xl:   '0 24px 64px rgba(30,58,95,.20)',
      },
    },
  },
  plugins: [],
};
export default config;
