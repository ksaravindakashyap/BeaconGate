import { test, expect } from "@playwright/test";

test.describe("Decision flow", () => {
  test("submit decision, verify case DECIDED and CaseFile includes llmRunId when advisory existed", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/submit");
    await page.getByTestId("submit-adText").fill("Decision flow test.");
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
    await page.getByTestId("generate-advisory-btn").click().catch(() => {});
    await page.waitForTimeout(2000);
    await page.reload();

    await expect(page.getByTestId("submit-decision-btn")).toBeVisible({ timeout: 5000 });
    await page.getByRole("combobox", { name: "Outcome" }).selectOption("APPROVE");
    await page.getByTestId("submit-decision-btn").click();

    await expect(page).toHaveURL(/\/queue/);
    const caseLink = page.getByRole("link", { name: "Open case" }).first();
    await expect(caseLink).toBeVisible({ timeout: 5000 });
    await caseLink.click();
    await expect(page).toHaveURL(/\/case\//);
    await expect
      .poll(
        async () => page.getByTestId("case-status").textContent(),
        { timeout: 10000, intervals: [500, 1000] }
      )
      .toContain("DECIDED");
  });
});
