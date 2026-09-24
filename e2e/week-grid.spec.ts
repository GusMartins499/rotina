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
  await expect(page.getByTestId("weekday-head-0")).toBeVisible();
});

test("splits TRABALHO into two blocks and clears the daily remainder", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-2-8"));
  await expect(page.getByTestId("block-2-8")).toHaveAccessibleName(
    "TRABALHO, quarta, 08:00 às 16:00",
  );

  const block = page.getByTestId("block-2-8");
  const handle = page.getByTestId("resize-2-8");
  const box = await handle.boundingBox();
  if (box === null) {
    throw new Error("resize handle is not visible");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 3 * 34, { steps: 10 });
  await page.mouse.up();

  await expect(block).toHaveAccessibleName("TRABALHO, quarta, 08:00 às 13:00");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-2-14"));
  await expect(page.getByTestId("block-2-14")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("block-2-8")).toBeVisible();
  await expect(page.getByTestId("block-2-14")).toBeVisible();
});

test("removes a block by dragging it out of the grid", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-4-18"));
  await expect(page.getByTestId("block-4-18")).toBeVisible();

  const block = await page.getByTestId("block-4-18").boundingBox();
  if (block === null) {
    throw new Error("block is not visible");
  }
  await page.mouse.move(block.x + block.width / 2, block.y + 4);
  await page.mouse.down();
  await page.mouse.move(10, 10, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByTestId("block-4-18")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("block-4-18")).toHaveCount(0);
});

test("switches focus between the current and the next week", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("week-focus")).toHaveText("Semana atual");

  await page.getByRole("link", { name: /próxima semana/i }).click();

  await expect(page.getByTestId("week-focus")).toHaveText("Próxima semana");
  await expect(page.getByTestId("block-0-8")).toHaveCount(0);

  await page.getByRole("link", { name: /voltar/i }).click();
  await expect(page.getByTestId("week-focus")).toHaveText("Semana atual");
});

test("saves the current week as the base routine and applies it to the next one", async ({
  page,
}) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-3-9"));
  await expect(page.getByTestId("block-3-9")).toBeVisible();

  await page.waitForTimeout(800);

  await page.getByRole("button", { name: /salvar como rotina base/i }).click();
  await page.waitForTimeout(800);

  await page.goto("/?semana=proxima");
  const apply = page.getByRole("button", { name: /aplicar rotina base/i });
  await expect(apply).toBeEnabled();
  await apply.click();

  await expect(page.getByTestId("block-3-9")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("block-3-9")).toBeVisible();
});

test("keeps the two weeks independent", async ({ page }) => {
  await page.goto("/?semana=proxima");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-5-20"));
  await expect(page.getByTestId("block-5-20")).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("block-5-20")).toHaveCount(0);
});

test("moves a block with the keyboard and announces the result", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-6-15"));
  await expect(page.getByTestId("block-6-15")).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByTestId("block-6-15").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");

  await expect(page.getByTestId("grid-announcement")).toContainText(
    "movido para domingo, 16:00 às 17:00",
  );
  await expect(page.getByTestId("block-6-16")).toBeVisible();

  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId("block-6-16")).toBeVisible();
});

test("cancels a keyboard drag with Escape leaving the block untouched", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-6-20"));
  await expect(page.getByTestId("block-6-20")).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByTestId("block-6-20").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");

  await expect(page.getByTestId("block-6-20")).toBeVisible();
  await expect(page.getByTestId("block-6-21")).toHaveCount(0);
});

test("resizes and removes a block with the keyboard, announcing both", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-1-8"));
  await expect(page.getByTestId("block-1-8")).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByTestId("block-1-8").focus();
  await page.keyboard.press("Shift+ArrowUp");

  await expect(page.getByTestId("grid-announcement")).toContainText(
    "redimensionado para terça, 08:00 às 15:00",
  );

  await page.getByTestId("block-1-8").focus();
  await page.keyboard.press("Delete");

  await expect(page.getByTestId("block-1-8")).toHaveCount(0);
  await expect(page.getByTestId("grid-announcement")).toContainText("removido de terça");
});

test("announces a refusal, not only a success", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-4-8"));
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-4-17"));
  await page.waitForTimeout(800);

  await page.getByTestId("block-4-17").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");

  await expect(page.getByTestId("grid-announcement")).toContainText("já está ocupado");
});
