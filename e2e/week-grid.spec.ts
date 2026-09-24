import { test, expect } from "@playwright/test";
import { dragOnto } from "./drag";

test("drags a commitment from the drawer onto the grid and it survives a reload", async ({
  page,
}) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-0-8"));

  await expect(page.getByTestId("block-0-8")).toBeVisible();
  await expect(page.getByTestId("block-0-8")).toHaveAccessibleName(
    "TRABALHO, segunda, 08:00 às 16:00",
  );

  await page.reload();

  await expect(page.getByTestId("block-0-8")).toBeVisible();
});

test("refuses a drop that overlaps an existing block", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-0-8"));
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-0-12"));

  await expect(page.getByTestId("board-error")).toContainText(/ocupado/i);
  await expect(page.getByTestId("block-0-12")).toHaveCount(0);
});

test("keeps the week readable at 390px with no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByText("SEGUNDA")).toBeVisible();
});
