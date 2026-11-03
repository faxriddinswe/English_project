import { test, expect } from "@playwright/test";

test("desktop lead dialog is compact and contains no teacher photo", async ({
  page,
}) => {
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Kursga yozilish", exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Kursga ariza" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator("h2").filter({ hasText: "Ingliz tilidagi" }),
    ).toHaveCSS("color", "rgb(53, 17, 65)");
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(560);
    expect(box!.height).toBeLessThan(760);
    await expect(dialog.locator("img")).toHaveCount(0);
    expect(
      await dialog
        .locator("h2")
        .filter({ hasText: "Ingliz tilidagi" })
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeLessThanOrEqual(28);
    const name = await dialog.getByLabel("Ism va familiya").boundingBox();
    const phone = await dialog.getByLabel("Telefon raqamingiz").boundingBox();
    expect(Math.abs(name!.y - phone!.y)).toBeLessThan(2);
    expect(name!.height).toBe(44);
    expect(phone!.height).toBe(44);
    await page.screenshot({ path: `../docs/qa/compact-lead-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

test("lead dialog stays inside small and short viewports with an accessible close button", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 812],
    [375, 812],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 600],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Kursga yozilish", exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Kursga ariza" });
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(11);
    expect(box!.y).toBeGreaterThanOrEqual(11);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width - 11);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height - 11);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(dialog.locator("img")).toHaveCount(0);
    await dialog.evaluate((el) => (el.scrollTop = el.scrollHeight));
    const close = dialog.getByRole("button", { name: "Yopish", exact: true });
    await expect(close).toBeInViewport();
    await page.screenshot({
      path: `../docs/qa/compact-lead-${width}x${height}.png`,
    });
    await close.click();
    await expect(dialog).toHaveCount(0);
  }
});

test("compact form preserves validation and entered values when the API is unreachable", async ({
  page,
}) => {
  await page.goto("/courses");
  await page
    .locator("#courses article")
    .filter({ has: page.getByRole("heading", { name: "IELTS", exact: true }) })
    .getByRole("button", { name: "Kursga yozilish" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Kursga ariza" });
  await expect(dialog.locator("select option:checked")).toHaveText("IELTS");
  await dialog
    .getByRole("button", { name: "Arizani yuborish", exact: true })
    .click();
  await expect(
    dialog.getByText("Ismingizni kiriting", { exact: true }),
  ).toBeVisible();
  await dialog.getByLabel("Ism va familiya").fill("NAMUNA — compact form");
  await dialog.getByLabel("Telefon raqamingiz").fill("+998901234567");
  await dialog.getByLabel("Izoh (ixtiyoriy)").fill("NAMUNA network check");
  await dialog.getByRole("checkbox").check();
  await page.route("**/api/v1/public/leads", (route) => route.abort());
  await dialog
    .getByRole("button", { name: "Arizani yuborish", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Ism va familiya")).toHaveValue(
    "NAMUNA — compact form",
  );
  await expect(dialog.getByLabel("Izoh (ixtiyoriy)")).toHaveValue(
    "NAMUNA network check",
  );
  await expect(
    dialog.getByText("Arizangiz qabul qilindi.", { exact: true }),
  ).toHaveCount(0);
});
