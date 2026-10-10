import { test, expect } from "@playwright/test";
import { dragOnto, dragOut } from "./drag";

test("lets the first drop through the empty state and then hides it", async ({ page }) => {
  await page.goto("/");

  const emptyWeek = page.getByTestId("empty-week");
  await expect(emptyWeek).toBeVisible();

  const card = await emptyWeek.locator(".empty-week-card").boundingBox();
  const slot = page.getByTestId("slot-3-480");
  const target = await slot.boundingBox();
  if (card === null || target === null) {
    throw new Error("the empty state or the slot is not visible");
  }
  const centerY = target.y + target.height / 2;
  expect(centerY).toBeGreaterThan(card.y);
  expect(centerY).toBeLessThan(card.y + card.height);

  await dragOnto(page, page.getByTestId("drawer-commitment-2"), slot);

  await expect(page.getByTestId("block-3-480")).toBeVisible();
  await expect(emptyWeek).toHaveCount(0);

  await page.waitForTimeout(800);
  await dragOut(page, page.getByTestId("block-3-480"));
  await expect(page.locator('[data-testid^="block-"]')).toHaveCount(0);
  await expect(emptyWeek).toBeVisible();
  await page.waitForTimeout(800);
});

test("closes the keyboard shortcuts with Escape and returns focus", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Atalhos de teclado" });
  await toggle.click();
  await expect(page.getByRole("region", { name: "Atalhos de teclado" })).toContainText("Delete");

  await page.keyboard.press("Escape");

  await expect(page.getByRole("region", { name: "Atalhos de teclado" })).toHaveCount(0);
  await expect(toggle).toBeFocused();
});
