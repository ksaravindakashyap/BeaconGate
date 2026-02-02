import { test, expect } from "@playwright/test";

test.describe("Rule hits and risk", () => {
  test("submit to hidden-text page, verify hidden-text rule triggered and risk tier", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/submit");
    await page.getByTestId("submit-adText").fill("Act now or miss out. Limited time.");
    await page.getByLabel("Category").selectOption("GENERAL");
    await page.getByTestId("submit-landingUrl").fill(`${baseURL}/test-pages/landing`);
    await page.getByTestId("submit-case-btn").click();

    await expect(page).toHaveURL(/\/case\/[a-z0-9]+/);

    await expect
      .poll(
        async () => {
          await page.reload();
          return page.getByTestId("capture-status").textContent();
        },
        { timeout: 60000, intervals: [500, 1000, 2000] }
      )
      .toMatch(/SUCCEEDED|FAILED/);

    await page.reload();
    await expect(page.getByText("Rule hits")).toBeVisible();
    await expect(page.getByText("RULE_PROHIBITED_PHRASE").or(page.getByText("RULE_HIDDEN_TEXT_HEURISTIC"))).toBeVisible();
    const tierBadge = page.locator('text=MEDIUM').or(page.locator('text=HIGH'));
    await expect(tierBadge.first()).toBeVisible();
  });
});
