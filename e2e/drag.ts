import type { Locator, Page } from "@playwright/test";

const DRAWER_TRANSITION_MS = 400;

export async function openCommitments(page: Page) {
  const toggle = page.getByTestId("commitments-toggle");

  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
    await page.waitForTimeout(DRAWER_TRANSITION_MS);
  }
}

export async function stepHeight(page: Page): Promise<number> {
  const box = await page.getByTestId("slot-0-0").boundingBox();

  if (box === null) {
    throw new Error("the grid is not visible");
  }

  return box.height;
}

export async function dragOnto(page: Page, source: Locator, target: Locator) {
  if (!(await source.isVisible())) {
    await openCommitments(page);
  }

  const from = await source.boundingBox();
  const to = await target.boundingBox();

  if (from === null || to === null) {
    throw new Error("source or target is not visible");
  }

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(DRAWER_TRANSITION_MS);
}
