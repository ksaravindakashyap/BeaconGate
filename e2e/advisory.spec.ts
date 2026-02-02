import { test, expect } from "@playwright/test";

test.use({ extraHTTPHeaders: {} });

test.describe("Advisory generation", () => {
  test("force mock provider, click Generate advisory, verify summary and non-binding label", async ({
    page,
    baseURL,
  }) => {
    test.skip(!process.env.LLM_PROVIDER_FORCE, "Set LLM_PROVIDER_FORCE=mock when running E2E");

    await page.goto("/submit");
    await page.getByTestId("submit-adText").fill("Advisory test. Consult your doctor.");
    await page.getByLabel("Category").selectOption("HEALTH");
    await page.getByTestId("submit-landingUrl").fill(`${baseURL}/test-pages/final`);
    await page.getByTestId("submit-case-btn").click();

    await expect(page).toHaveURL(/\/case\/[a-z0-9]+/);

    await expect(async () => {
      await page.reload();
      await expect(page.getByTestId("run-retrieval-btn")).toBeVisible({ timeout: 20000 });
    }).toPass({ timeout: 90000 });

    await page.getByTestId("run-retrieval-btn").click();
    await page.waitForTimeout(3000);

    await page.reload();
    await expect(page.getByTestId("generate-advisory-btn")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("generate-advisory-btn").click();

    await expect(async () => {
      await page.reload();
      await expect(page.getByText("Non-binding").or(page.getByText("non-binding"))).toBeVisible({ timeout: 15000 });
    }).toPass({ timeout: 20000 });

    await expect(page.getByTitle("LLM Advisory (non-binding)").or(page.getByText("LLM Advisory"))).toBeVisible();
  });
});
