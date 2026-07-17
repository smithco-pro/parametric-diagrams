import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    // Playwright drives its own runner; keep its specs out of the unit run.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
