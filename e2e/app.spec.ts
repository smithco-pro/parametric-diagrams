import { test, expect } from "@playwright/test";

test.describe("diagram app", () => {
  test("loads and renders the default template as SVG", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();
    // The featured default template is preselected on first load.
    await expect(page.locator("#template-select")).toHaveValue(
      "omnissa-access-connector-network"
    );
  });

  test("switching templates re-renders the diagram", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();

    await page.selectOption("#template-select", "network");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();
    // The network template's resolved source contains the Load Balancer node.
    await expect(page.locator("#resolved-text")).toContainText("Load Balancer");
  });

  test("toggling a parameter updates the resolved diagram source", async ({
    page,
  }) => {
    await page.goto("./?template=network");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();
    await expect(page.locator("#resolved-text")).toContainText("Appliance Node 1");

    // Toggle "App Node 1" off — its node/edges drop out of the source.
    await page.locator('[data-param-key="appNode1"] .toggle-switch').click();
    await expect(page.locator("#resolved-text")).not.toContainText(
      "Appliance Node 1"
    );
  });

  test("Export SVG downloads a .svg file", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#export-svg-btn"),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
  });
});
