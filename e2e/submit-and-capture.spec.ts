import { test, expect } from "@playwright/test";

test.describe("Submit and capture", () => {
  test("submit case with local test-pages/final, wait for READY_FOR_REVIEW and artifacts", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/submit");
    await page.getByTestId("submit-adText").fill("E2E test ad. Consult your doctor.");
    await page.getByLabel("Category").selectOption("HEALTH");
    await page.getByTestId("submit-landingUrl").fill(`${baseURL}/test-pages/final`);
    await page.getByTestId("submit-case-btn").click();

    await expect(page).toHaveURL(/\/case\/[a-z0-9]+/);
    await expect(page.getByTestId("case-status")).toBeVisible();

    await expect
      .poll(
        async () => {
          await page.reload();
          return page.getByTestId("case-status").textContent();
        },
        { timeout: 90000, intervals: [500, 1000, 2000] }
      )
      .toContain("READY_FOR_REVIEW");

    await expect(page.getByTestId("capture-status")).toBeVisible();
    await expect(page.getByTestId("capture-status").textContent()).toMatch(/SUCCEEDED|FAILED/);

    const hasArtifacts = await page.getByText("Artifacts").isVisible().catch(() => false);
    const hasRedirect = await page.getByText("Redirect chain").isVisible().catch(() => false);
    const hasScreenshot = await page.locator('img[alt="Screenshot"]').isVisible().catch(() => false);
    expect(hasArtifacts).toBe(true);
    expect(hasScreenshot || hasRedirect).toBe(true);
  });
});
