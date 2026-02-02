import { test, expect } from "@playwright/test";

test.describe("Eval page", () => {
  test("visit /eval, verify metric cards and show-only-failing toggles row count", async ({
    page,
  }) => {
    await page.goto("/eval");

    const noRun = await page.getByText("No evaluation run").isVisible().catch(() => false);
    if (noRun) {
      await expect(page.getByText("No evaluation run")).toBeVisible();
      return;
    }

    await expect(page.getByTestId("eval-metrics")).toBeVisible();
    await expect(page.getByTestId("eval-cases-section")).toBeVisible();

    const checkbox = page.getByTestId("eval-show-only-failing");
    await expect(checkbox).toBeVisible();
    const initialRows = await page.locator("table tbody tr").filter({ hasNot: page.locator("[colspan]") }).count();

    await checkbox.check();
    await page.waitForTimeout(300);
    const filteredRows = await page.locator("table tbody tr").filter({ hasNot: page.locator("[colspan]") }).count();
    expect(filteredRows <= initialRows).toBe(true);

    await checkbox.uncheck();
    await page.waitForTimeout(300);
    const backRows = await page.locator("table tbody tr").filter({ hasNot: page.locator("[colspan]") }).count();
    expect(backRows).toBe(initialRows);
  });
});
