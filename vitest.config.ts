import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/test/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/register-dom.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**"],
      reporter: ["text", "html"],
    },
  },
});
