import { test, expect, type Locator, type Page } from "@playwright/test";

const ACCENT_RING = /rgb\(91, 91, 214\)/;
const TEXT = "rgb(27, 27, 31)";
const RING_WIDTH = 4;

async function openColourPicker(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Configurações" }).click();
  const drawer = page.getByRole("dialog", { name: "Configurações" });
  const colours = drawer.getByRole("group", { name: "Cor" }).first();
  await drawer.getByLabel("Carga diária").first().focus();
  await page.keyboard.press("Tab");
  return colours;
}

function radio(colours: Locator, name: string) {
  return colours.getByRole("radio", { name, exact: true });
}

function swatch(colours: Locator, name: string) {
  return radio(colours, name).locator("xpath=..");
}

test("shows a visible focus ring on the focused colour", async ({ page }) => {
  const colours = await openColourPicker(page);

  await expect(radio(colours, "Vermelho")).toBeFocused();
  await expect(swatch(colours, "Vermelho")).toHaveCSS("box-shadow", ACCENT_RING);
});

test("distinguishes focus from selection", async ({ page }) => {
  const colours = await openColourPicker(page);

  await radio(colours, "Azul").focus();

  await expect(radio(colours, "Vermelho")).toBeChecked();
  await expect(swatch(colours, "Vermelho")).toHaveCSS("border-top-color", TEXT);
  await expect(swatch(colours, "Vermelho")).not.toHaveCSS("box-shadow", ACCENT_RING);
  await expect(swatch(colours, "Azul")).toHaveCSS("box-shadow", ACCENT_RING);
  await expect(swatch(colours, "Azul")).not.toHaveCSS("border-top-color", TEXT);
});

test("keeps the focus ring inside every clipping ancestor", async ({ page }) => {
  const colours = await openColourPicker(page);

  const clipped = await swatch(colours, "Vermelho").evaluate((label, ring) => {
    const box = label.getBoundingClientRect();
    const offenders: string[] = [];

    for (let node = label.parentElement; node !== null; node = node.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(node);
      if (overflowX === "visible" && overflowY === "visible") continue;

      const clip = node.getBoundingClientRect();
      const fits =
        box.left - ring >= clip.left &&
        box.right + ring <= clip.right &&
        box.top - ring >= clip.top &&
        box.bottom + ring <= clip.bottom;
      if (!fits) offenders.push(node.tagName);
    }

    return offenders;
  }, RING_WIDTH);

  expect(clipped).toEqual([]);
});

test("moves the selection with the arrow keys", async ({ page }) => {
  const colours = await openColourPicker(page);

  await page.keyboard.press("ArrowRight");

  await expect(radio(colours, "Azul")).toBeChecked();
  await expect(radio(colours, "Azul")).toBeFocused();
  await expect(swatch(colours, "Azul")).toHaveCSS("box-shadow", ACCENT_RING);
});
