import { test, expect } from "@playwright/test";

test("teacher reference profile uses real identity, readable biography and working certificate preview", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Sherzod Allamurodov",
      exact: true,
    }),
  ).toBeVisible();
  const profile = page.getByTestId("teacher-profile");
  await expect(
    profile.getByRole("img", { name: "Sherzod Allamurodov", exact: true }),
  ).toBeVisible();
  await expect(profile.locator("dl>div")).toHaveCount(4);
  await expect(profile.getByText("CELTA", { exact: true })).toHaveCount(0);
  await expect(profile.getByText("9.0", { exact: true })).toHaveCount(0);
  await expect(
    profile.getByRole("heading", {
      name: "O‘quvchilar sertifikatlaridan",
      exact: true,
    }),
  ).toBeVisible();
  const biography = page.getByTestId("teacher-biography");
  expect(await biography.locator("p").count()).toBeGreaterThanOrEqual(4);
  await expect(biography).toContainText("Grammatika / Umumiy ingliz tili");
  await expect(biography).toContainText(
    "Tinglab tushunish, O‘qish, Yozish va Gapirish",
  );
  await expect(biography).toContainText("Shaxsiy kabinet");
  await profile
    .getByRole("button", { name: /sertifikatni ko‘rish/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Kattalashtirish", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Kichraytirish", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Kursga yozilish", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Kursga ariza" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await profile
    .getByRole("link", { name: /Barcha natijalarni ko‘rish/ })
    .click();
  await expect(page).toHaveURL(/\/results$/);
});

test("teacher reference profile fits desktop and mobile screens", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 812],
    [375, 812],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/about");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const profile = page.getByTestId("teacher-profile");
    const portrait = await profile
      .getByRole("img", { name: "Sherzod Allamurodov", exact: true })
      .boundingBox();
    const name = await page.getByRole("heading", { level: 1 }).boundingBox();
    if (width >= 1440)
      expect(portrait!.x + portrait!.width).toBeLessThan(name!.x);
    if (width <= 768)
      expect(portrait!.y + portrait!.height).toBeLessThan(name!.y);
    await profile
      .locator("img")
      .evaluateAll((images) =>
        images.forEach((img) => ((img as HTMLImageElement).loading = "eager")),
      );
    await profile
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((img) => (img as HTMLImageElement).decode())),
      );
    await page.screenshot({
      path: `../docs/qa/teacher-profile-${width}.png`,
      fullPage: true,
    });
  }
});
