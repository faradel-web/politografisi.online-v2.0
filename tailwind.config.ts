import type { Config } from "tailwindcss";

const config: Config = {
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
    },
  },
  plugins: [],
};
export default config;