import { test, expect } from "@playwright/test";

test("serves an icon from the app directory", async ({ request }) => {
  const response = await request.get("/icon.svg");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/svg\+xml/);
});

test("declares the icon in the document head", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('head link[rel="icon"][href*="/icon.svg"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test("serves an apple touch icon for the home screen shortcut", async ({ request }) => {
  const response = await request.get("/apple-icon.png");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/png/);
});

test("declares a theme colour for each colour scheme", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('head meta[name="theme-color"]')).toHaveCount(2);
});
