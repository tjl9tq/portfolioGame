import { defineConfig } from "vite";

export default defineConfig({
  base: "/portfolioGame/",
  build: {
    minify: "terser",
  },
});
