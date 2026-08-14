/// <reference types="vitest/globals" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    env: {
      TZ: "America/Sao_Paulo",
    },
    setupFiles: path.resolve(__dirname, "vitest.setup.ts"),
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@dnd-kit/core": path.resolve(__dirname, "./src/test/stubs/dnd-kit-core.ts"),
      "@dnd-kit/sortable": path.resolve(
        __dirname,
        "./src/test/stubs/dnd-kit-sortable.ts",
      ),
      "@dnd-kit/utilities": path.resolve(
        __dirname,
        "./src/test/stubs/dnd-kit-utilities.ts",
      ),
    },
  },
});
