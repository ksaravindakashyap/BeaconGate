import { test, expect } from "@playwright/test";

test.describe("SSRF / capture failure", () => {
  test("submit landingUrl 127.0.0.1, verify capture FAILED and Retry button visible", async ({
    page,
  }) => {
    await page.goto("/submit");
    await page.getByTestId("submit-adText").fill("SSRF test.");
    await page.getByLabel("Category").selectOption("GENERAL");
    await page.getByTestId("submit-landingUrl").fill("http://127.0.0.1");
    await page.getByTestId("submit-case-btn").click();

    await expect(page).toHaveURL(/\/case\/[a-z0-9]+/);

    await expect
      .poll(
        async () => {
          await page.reload();
          return page.getByTestId("capture-status").textContent();
        },
        { timeout: 30000, intervals: [500, 1000, 2000] }
      )
      .toContain("FAILED");

    await expect(page.getByTestId("retry-capture-btn")).toBeVisible();
  });
});
