import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 1. Робимо Geologica стандартним шрифтом (sans)
        sans: ["var(--font-geologica)", "sans-serif"],

        // 2. Додаємо Vollkorn як serif (для заголовків, якщо захочете використати клас font-serif)
        serif: ["var(--font-vollkorn)", "serif"],

        // 3. ХИТРІСТЬ: Перенаправляємо старий клас font-montserrat на новий шрифт.
        // Це гарантує, що старі компоненти не зламаються, а просто стануть красивішими.
        montserrat: ["var(--font-geologica)", "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            // Вимикаємо автоматичний перенос слів глобально для prose
            hyphens: 'none',
            '-webkit-hyphens': 'none',
            '-moz-hyphens': 'none',
            '-ms-hyphens': 'none',
            'word-break': 'normal',
            'overflow-wrap': 'break-word',
            // Перевизначаємо для всіх дочірніх елементів
            'p': {
              hyphens: 'none',
              '-webkit-hyphens': 'none',
              'word-break': 'normal',
              'overflow-wrap': 'break-word',
            },
            'li': {
              hyphens: 'none',
              '-webkit-hyphens': 'none',
              'word-break': 'normal',
              'overflow-wrap': 'break-word',
            },
            'strong': {
              hyphens: 'none',
              '-webkit-hyphens': 'none',
            },
            'span': {
              hyphens: 'none',
              '-webkit-hyphens': 'none',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;