import { test, expect } from "@playwright/test";
import { dragOnto, openCommitments, stepHeight } from "./drag";

test("drags a commitment from the drawer onto the grid and it survives a reload", async ({
  page,
}) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-0-120"));

  await expect(page.getByTestId("block-0-120")).toBeVisible();
  await expect(page.getByTestId("block-0-120")).toHaveAccessibleName(
    "TRABALHO, segunda, 08:00 às 16:00",
  );

  await page.reload();

  await expect(page.getByTestId("block-0-120")).toBeVisible();
});

test("refuses a drop that overlaps an existing block", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-0-120"));
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-0-360"));

  await expect(page.getByTestId("board-error")).toContainText(/ocupado/i);
  await expect(page.getByTestId("block-0-360")).toHaveCount(0);
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

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-2-120"));
  await expect(page.getByTestId("block-2-120")).toHaveAccessibleName(
    "TRABALHO, quarta, 08:00 às 16:00",
  );

  const block = page.getByTestId("block-2-120");
  const handle = page.getByTestId("resize-2-120");
  const step = await stepHeight(page);
  const box = await handle.boundingBox();
  if (box === null) {
    throw new Error("resize handle is not visible");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 6 * step, { steps: 10 });
  await page.mouse.up();

  await expect(block).toHaveAccessibleName("TRABALHO, quarta, 08:00 às 13:00");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-2-480"));
  await expect(page.getByTestId("block-2-480")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("block-2-120")).toBeVisible();
  await expect(page.getByTestId("block-2-480")).toBeVisible();
});

test("removes a block by dragging it out of the grid", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-4-720"));
  await expect(page.getByTestId("block-4-720")).toBeVisible();
  await page.waitForTimeout(800);
  const before = await page.locator('[data-testid^="block-"]').count();

  const block = await page.getByTestId("block-4-720").boundingBox();
  if (block === null) {
    throw new Error("block is not visible");
  }
  await page.mouse.move(block.x + block.width / 2, block.y + 4);
  await page.mouse.down();
  await page.mouse.move(10, 10, { steps: 12 });
  await page.mouse.up();

  await expect(page.locator('[data-testid^="block-"]')).toHaveCount(before - 1);

  await page.reload();
  await expect(page.locator('[data-testid^="block-"]')).toHaveCount(before - 1);
});

test("switches focus between the current and the next week", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("week-focus")).toHaveText("Semana atual");

  await page.goto("/?week=next");

  await expect(page.getByTestId("week-focus")).toHaveText("Próxima semana");
  await expect(page.getByTestId("block-0-120")).toHaveCount(0);

  await page.getByRole("link", { name: /voltar/i }).click();
  await expect(page.getByTestId("week-focus")).toHaveText("Semana atual");
});

test("saves the current week as the base routine and applies it to the next one", async ({
  page,
}) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-3-180"));
  await expect(page.getByTestId("block-3-180")).toBeVisible();

  await page.waitForTimeout(800);

  await page.getByRole("button", { name: "Configurações" }).click();
  await page.getByRole("button", { name: /salvar como rotina base/i }).click();
  await page.waitForTimeout(800);

  await page.goto("/?week=next");
  await page.getByRole("button", { name: "Configurações" }).click();
  const apply = page.getByRole("button", { name: /aplicar rotina base/i });
  await expect(apply).toBeEnabled();
  await apply.click();

  await expect(page.getByTestId("block-3-180")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("block-3-180")).toBeVisible();
});

test("keeps the two weeks independent", async ({ page }) => {
  await page.goto("/?week=next");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-5-840"));
  await expect(page.getByTestId("block-5-840")).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("block-5-840")).toHaveCount(0);
});

test("moves a block with the keyboard and announces the result", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-6-540"));
  await expect(page.getByTestId("block-6-540")).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByTestId("block-6-540").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");

  await expect(page.getByTestId("grid-announcement")).toContainText(
    "movido para domingo, 15:30 às 16:00",
  );
  await expect(page.getByTestId("block-6-570")).toBeVisible();

  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId("block-6-570")).toBeVisible();
});

test("cancels a keyboard drag with Escape leaving the block untouched", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-6-840"));
  await expect(page.getByTestId("block-6-840")).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByTestId("block-6-840").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");

  await expect(page.getByTestId("block-6-840")).toBeVisible();
  await expect(page.getByTestId("block-6-900")).toHaveCount(0);
});

test("resizes and removes a block with the keyboard, announcing both", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-1-120"));
  await expect(page.getByTestId("block-1-120")).toBeVisible();
  await page.waitForTimeout(800);

  await page.getByTestId("block-1-120").focus();
  await page.keyboard.press("Shift+ArrowUp");

  await expect(page.getByTestId("grid-announcement")).toContainText(
    "redimensionado para terça, 08:00 às 15:30",
  );

  await page.getByTestId("block-1-120").focus();
  await page.keyboard.press("Delete");

  await expect(page.getByTestId("block-1-120")).toHaveCount(0);
  await expect(page.getByTestId("grid-announcement")).toContainText("removido de terça");
});

test("announces a refusal, not only a success", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-4-120"));
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-4-660"));
  await page.waitForTimeout(800);

  await page.getByTestId("block-4-660").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");

  await expect(page.getByTestId("grid-announcement")).toContainText("já está ocupado");
});

test("announces the removal when a block is dragged out", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-3-780"));
  await expect(page.getByTestId("block-3-780")).toBeVisible();
  await page.waitForTimeout(800);

  const block = await page.getByTestId("block-3-780").boundingBox();
  if (block === null) {
    throw new Error("block is not visible");
  }
  await page.mouse.move(block.x + block.width / 2, block.y + 4);
  await page.mouse.down();
  await page.mouse.move(10, 10, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByTestId("grid-announcement")).toContainText("removido de quinta");
});

test("resolves an imprecise drop inside the grid to the closest slot", async ({ page }) => {
  await page.goto("/");
  await openCommitments(page);
  const slot = await page.getByTestId("slot-5-300").boundingBox();
  const source = await page.getByTestId("drawer-commitment-2").boundingBox();
  if (slot === null || source === null) {
    throw new Error("missing boxes");
  }

  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(slot.x + slot.width / 2, slot.y + slot.height - 2, { steps: 12 });
  await page.mouse.up();

  await expect(page.locator('[data-testid^="block-5-"]')).toHaveCount(1);
});

test("serves the commitments screen from an english route", async ({ page }) => {
  const response = await page.goto("/commitments");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Compromissos" })).toBeVisible();
});

test("opens the settings in a drawer from the gear button", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Configurações" }).click();

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("TRABALHO");
  await expect(drawer).toContainText("Rotina base");
  await expect(page.getByTestId("weekday-head-0")).toBeVisible();
});

test("closes the settings drawer with Escape and returns focus", async ({ page }) => {
  await page.goto("/");

  const gear = page.getByRole("button", { name: "Configurações" });
  await gear.click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(gear).toBeFocused();
});

test("lists a new commitment in the drag drawer without a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Configurações" }).click();

  await page.getByLabel(/nome/i).fill("Academia");
  await page.getByRole("button", { name: /salvar compromisso/i }).click();

  await expect(page.getByRole("dialog")).toContainText("Academia");
  await page.keyboard.press("Escape");

  await openCommitments(page);
  await expect(page.locator(".drawer")).toContainText("Academia");
});

test("keeps the visible labels in portuguese", async ({ page }) => {
  await page.goto("/?week=next");

  await expect(page.getByTestId("week-focus")).toHaveText("Próxima semana");
  await expect(page.getByTestId("weekday-head-0")).toHaveText("SEGUNDA");
  await expect(page.getByText(/Semana do dia/)).toBeVisible();
});

test("renders the closing hour label inside the grid bounds", async ({ page }) => {
  await page.goto("/");

  const overflow = await page.evaluate(() => {
    const grid = document.querySelector(".week-grid");
    const labels = [...document.querySelectorAll(".hour-label")];
    const last = labels.at(-1);
    if (grid === null || last === undefined) {
      return null;
    }
    const box = last.getBoundingClientRect();
    return {
      text: last.textContent,
      height: box.height,
      clipped: box.bottom > grid.getBoundingClientRect().bottom + 0.5,
    };
  });

  expect(overflow?.text).toBe("23:00");
  expect(overflow?.height).toBeGreaterThan(0);
  expect(overflow?.clipped).toBe(false);
});

test("configuring the next week is unavailable outside sunday", async ({ page }) => {
  await page.goto("/");

  const isSunday = new Date().getDay() === 0;

  if (isSunday) {
    await expect(page.getByRole("link", { name: /próxima semana/i })).toBeVisible();
  } else {
    await expect(page.getByTestId("configure-next")).toBeDisabled();
    await expect(page.getByTestId("configure-hint")).toContainText("domingo");
  }
});

test("the drawer shows no weekday and no remainder", async ({ page }) => {
  await page.goto("/");
  await openCommitments(page);

  const drawer = page.locator(".drawer");
  await expect(drawer).not.toContainText("faltam");
  await expect(drawer).not.toContainText("SEGUNDA");
});

test("shows a toast while a change is saved", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-6-240"));

  await expect(page.getByTestId("saving-toast")).toBeVisible();
  await expect(page.getByTestId("saving-toast")).toHaveAttribute("data-state", "saved");
});

test("previews the candidate size while the edge is dragged", async ({ page }) => {
  await page.goto("/");
  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-5-0"));
  await page.waitForTimeout(800);

  const step = await stepHeight(page);
  const handle = await page.getByTestId("resize-5-0").boundingBox();
  if (handle === null) {
    throw new Error("resize handle is not visible");
  }

  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 4 * step, {
    steps: 8,
  });

  await expect(page.getByTestId("resize-preview")).toBeVisible();
  await expect(page.getByTestId("resize-preview")).toContainText("06:00 às 08:30");

  await page.mouse.up();
  await expect(page.getByTestId("resize-preview")).toHaveCount(0);
});

test("marks the column of the current weekday", async ({ page }) => {
  await page.goto("/");

  const weekday = (new Date().getDay() + 6) % 7;
  await expect(page.locator(`.day-column[data-today="true"]`)).toHaveCount(1);
  await expect(page.getByTestId(`weekday-head-${weekday}`)).toBeVisible();
  await expect(page.getByTestId("now-line")).toBeVisible();
});

test("marks no column while the next week is in focus", async ({ page }) => {
  await page.goto("/?week=next");

  await expect(page.locator(`.day-column[data-today="true"]`)).toHaveCount(0);
  await expect(page.getByTestId("now-line")).toHaveCount(0);
});

test("closes the commitment drawer by itself once a block is dropped", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByTestId("commitments-toggle");
  await openCommitments(page);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await dragOnto(page, page.getByTestId("drawer-commitment-2"), page.getByTestId("slot-6-0"));

  await expect(page.getByTestId("block-6-0")).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("writes the hours of a block next to its name", async ({ page }) => {
  await page.goto("/");

  await dragOnto(page, page.getByTestId("drawer-commitment-1"), page.getByTestId("slot-1-150"));

  const block = page.getByTestId("block-1-150");
  await expect(block).toContainText("TRABALHO");
  await expect(block).toContainText("08:30\u201316:30");
});

test("shows the weekly load in a popover instead of a panel", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("weekly-load-1")).toHaveCount(0);

  await page.getByTestId("weekly-load-toggle").click();
  await expect(page.getByTestId("weekly-load-1")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("weekly-load-1")).toHaveCount(0);
});

test("fits the week in the viewport without scrolling the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});
