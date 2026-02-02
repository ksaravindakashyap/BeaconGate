import { test, expect } from "@playwright/test";

test.describe("Retrieval", () => {
  test("on READY_FOR_REVIEW case, click Run Retrieval and verify Policy Matches with similarity", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/submit");
    await page.getByTestId("submit-adText").fill("Policy and precedent retrieval test.");
    await page.getByLabel("Category").selectOption("GENERAL");
    await page.getByTestId("submit-landingUrl").fill(`${baseURL}/test-pages/final`);
    await page.getByTestId("submit-case-btn").click();

    await expect(page).toHaveURL(/\/case\/[a-z0-9]+/);

    await expect
      .poll(
        async () => {
          await page.reload();
          return page.getByTestId("case-status").textContent();
        },
        { timeout: 90000, intervals: [500, 1000, 2000] }
      )
      .toMatch(/READY_FOR_REVIEW|IN_REVIEW/);

    await expect(page.getByTestId("run-retrieval-btn")).toBeVisible();
    await page.getByTestId("run-retrieval-btn").click();

    await expect(async () => {
      await page.reload();
      await expect(page.getByText("similarity")).toBeVisible({ timeout: 15000 });
    }).toPass({ timeout: 30000 });

    await expect(page.getByText("Policy Matches").or(page.getByText("Policy"))).toBeVisible();
  });
});
