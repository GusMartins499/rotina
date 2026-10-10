import { test, expect, type Page } from "@playwright/test";

async function openSettings(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Configurações" }).click();
  return page.getByRole("dialog", { name: "Configurações" });
}

async function overflowsHorizontally(page: Page) {
  return page
    .locator(".settings-drawer")
    .evaluate((drawer) => drawer.scrollWidth > drawer.clientWidth);
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
]) {
  test(`never scrolls the drawer horizontally at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const drawer = await openSettings(page);

    await drawer.getByRole("button", { name: "Novo compromisso" }).click();
    await drawer.getByLabel("Nome").fill("Projeto portfolio com um nome bem comprido demais");
    expect(await overflowsHorizontally(page)).toBe(false);

    const trabalho = drawer.getByRole("listitem", { name: /TRABALHO/ });
    await trabalho.hover();
    await trabalho.getByRole("button", { name: "Editar" }).click();
    await expect(trabalho.getByRole("button", { name: "Cancelar edição" })).toBeVisible();
    expect(await overflowsHorizontally(page)).toBe(false);

    const cancel = trabalho.getByRole("button", { name: "Cancelar edição" });
    const drawerBox = await page.locator(".settings-drawer").boundingBox();
    const cancelBox = await cancel.boundingBox();
    expect(cancelBox!.x + cancelBox!.width).toBeLessThanOrEqual(drawerBox!.x + drawerBox!.width);
  });
}

test("keeps the row actions reachable by keyboard on a hover device", async ({ page }) => {
  const drawer = await openSettings(page);
  const edit = drawer
    .getByRole("listitem", { name: /TRABALHO/ })
    .getByRole("button", { name: "Editar" });

  await edit.focus();

  await expect(edit).toBeFocused();
  await expect(edit.locator("xpath=..")).toHaveCSS("opacity", "1");
});
