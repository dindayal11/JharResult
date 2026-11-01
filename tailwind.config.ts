import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#14243A", saffron: "#F28C28", paper: "#F6F8FB" } } },
  plugins: []
};
export default config;
