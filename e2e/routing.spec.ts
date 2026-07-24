import { test, expect } from "@playwright/test";

test.describe("routing", () => {
  test("navigates between Diagrams and About", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#page-diagrams")).toBeVisible();
    await expect(page.locator("#page-about")).toBeHidden();

    await page.click('nav a[data-route="/about"]');
    await expect(page.locator("#page-about")).toBeVisible();
    await expect(page.locator("#page-diagrams")).toBeHidden();
    await expect(page).toHaveURL(/\/parametric-diagrams\/about$/);

    await page.click('nav a[data-route="/"]');
    await expect(page.locator("#page-diagrams")).toBeVisible();
    await expect(page.locator("#page-about")).toBeHidden();
  });

  test("loads template and parameter overrides from the URL", async ({
    page,
  }) => {
    await page.goto("./?template=network&lbName=E2E-EDGE-LB");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();
    await expect(page.locator("#template-select")).toHaveValue("network");
    await expect(page.locator("#resolved-text")).toContainText("E2E-EDGE-LB");
  });

  test("direct load of /about does not gain the template query string", async ({
    page,
  }) => {
    await page.goto("./about");
    await expect(page.locator("#page-about")).toBeVisible();
    // The render pipeline still runs (hidden diagrams page); wait for it to
    // finish — the URL write, if any, happens after the render completes.
    await page.waitForFunction(() =>
      document.querySelector("#mermaid-output svg, #mermaid-output pre")
    );
    await expect(page).toHaveURL(/\/parametric-diagrams\/about$/);
  });

  test("returning to Diagrams restores the shareable template query", async ({
    page,
  }) => {
    await page.goto("./?template=network&lbName=E2E-EDGE-LB");
    await expect(page.locator("#mermaid-output svg")).toBeVisible();

    await page.click('nav a[data-route="/about"]');
    await expect(page).toHaveURL(/\/parametric-diagrams\/about$/);

    await page.click('nav a[data-route="/"]');
    await expect(page).toHaveURL(/template=network/);
    await expect(page).toHaveURL(/lbName=E2E-EDGE-LB/);
  });
});
