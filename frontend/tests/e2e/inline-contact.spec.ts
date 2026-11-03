import { test, expect } from "@playwright/test";

test("contact page exposes the existing application form immediately without banner or launch button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Asosiy menyu", exact: true })
    .getByRole("link", { name: "Bog‘lanish", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Bog‘lanish", exact: true }),
  ).toBeVisible();
  const form = page.getByRole("form", { name: "Kursga ariza", exact: true });
  await expect(form).toBeVisible();
  await expect(page.locator("form")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".contact-banner")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ariza qoldirish", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Yopish", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByTestId("lead-application-inline").locator("img"),
  ).toHaveCount(0);
  await expect(form.getByLabel("Ism va familiya")).toBeVisible();
  await expect(form.getByLabel("Telefon raqamingiz")).toBeVisible();
  await expect(
    form.getByRole("button", { name: "Arizani yuborish", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).overflow),
  ).not.toBe("hidden");
});

test("inline form validates and keeps input when submission cannot reach the API", async ({
  page,
}) => {
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Kursga ariza", exact: true });
  await form
    .getByRole("button", { name: "Arizani yuborish", exact: true })
    .click();
  await expect(
    form.getByText("Ismingizni kiriting", { exact: true }),
  ).toBeVisible();
  await form.getByLabel("Ism va familiya").fill("NAMUNA inline contact");
  await form.getByLabel("Telefon raqamingiz").fill("+998901234567");
  await form.getByLabel("Qiziqqan kurs").selectOption({ label: "IELTS" });
  await form.getByLabel("Izoh (ixtiyoriy)").fill("NAMUNA offline check");
  await form.getByRole("checkbox").check();
  await page.route("**/api/v1/public/leads", (route) => route.abort());
  await form
    .getByRole("button", { name: "Arizani yuborish", exact: true })
    .click();
  await expect(form.getByRole("alert")).toBeVisible();
  await expect(form.getByLabel("Ism va familiya")).toHaveValue(
    "NAMUNA inline contact",
  );
  await expect(form.getByLabel("Izoh (ixtiyoriy)")).toHaveValue(
    "NAMUNA offline check",
  );
  await expect(form.locator("select option:checked")).toHaveText("IELTS");
  await expect(
    page.getByText("Arizangiz qabul qilindi.", { exact: true }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/contact$/);
});

test("inline contact form fits phone tablet and desktop viewports", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 812],
    [375, 812],
    [390, 844],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/contact");
    const card = page.getByTestId("lead-application-inline");
    await expect(card).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    const box = await card.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(560);
    expect(box!.x).toBeGreaterThanOrEqual(15);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width - 15);
    await expect(page.locator(".dialog-overlay")).toHaveCount(0);
    await page.screenshot({
      path: `../docs/qa/inline-contact-${width}.png`,
      fullPage: true,
    });
  }
});
