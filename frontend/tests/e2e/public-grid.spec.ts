import { test, expect } from "@playwright/test";

test("results grid and filters match the currently published certificates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/results");
  const results = page.locator("[data-result-type]");
  test.skip(
    (await results.count()) === 0,
    "Run explicit development certificate import first",
  );
  const published = await (
    await page.request.get("/api/v1/public/results?page_size=60")
  ).json();
  await expect(results).toHaveCount(published.items.length);
  await expect
    .poll(() =>
      results
        .first()
        .evaluate(
          (el) =>
            getComputedStyle(el.parentElement!).gridTemplateColumns.split(" ")
              .length,
        ),
    )
    .toBe(4);
  await expect(results.first().locator("img")).toHaveCSS(
    "aspect-ratio",
    "3 / 4",
  );
  await expect(
    page
      .locator('header a[aria-current="page"]')
      .filter({ hasText: "Natijalar" }),
  ).toBeVisible();
  for (const [label, type] of [
    ["IELTS", "ielts"],
    ["SEFR", "cefr"],
  ]) {
    await page
      .locator("#results")
      .getByRole("link", { name: label, exact: true })
      .click();
    const filtered = await (
      await page.request.get(`/api/v1/public/results?page_size=60&type=${type}`)
    ).json();
    await expect(results).toHaveCount(filtered.items.length);
    await expect(page.locator(`[data-result-type="${type}"]`)).toHaveCount(
      filtered.items.length,
    );
  }
  await page
    .locator("#results")
    .getByRole("link", { name: "Barchasi", exact: true })
    .click();
  await expect(results).toHaveCount(published.items.length);
  const urls = await results
    .locator("img")
    .evaluateAll((images) => [
      ...new Set(images.map((img) => (img as HTMLImageElement).src)),
    ]);
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    const response = await page.request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/webp");
  }
  await results.first().getByRole("button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("navbar sections navigate to their own pages and each course selects its application", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Markaz haqida", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-home-preview="center"]')).toHaveCount(0);
  expect((await page.request.get("/center")).status()).toBe(404);
  expect(await (await page.request.get("/sitemap.xml")).text()).not.toContain(
    "/center",
  );
  await expect(page.locator("[data-result-type]")).toHaveCount(4);
  for (const [label, path] of [
    ["Ustoz haqida", "/about"],
    ["Kurslar", "/courses"],
    ["Natijalar", "/results"],
    ["Savollar", "/faq"],
    ["Bog‘lanish", "/contact"],
  ]) {
    await page
      .getByRole("navigation", { name: "Asosiy menyu", exact: true })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.locator('header a[aria-current="page"]').filter({ hasText: label }),
    ).toBeVisible();
  }
  await page.goto("/courses");
  const cards = page.locator("#courses article");
  await expect(cards).toHaveCount(3);
  for (const name of ["Grammatika", "IELTS", "SEFR"]) {
    await cards
      .filter({ has: page.getByRole("heading", { name, exact: true }) })
      .getByRole("button", { name: "Kursga yozilish" })
      .click();
    await expect(
      page.getByRole("dialog").locator("select option:checked"),
    ).toHaveText(name);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Menyuni ochish" }).click();
  await page
    .getByRole("dialog", { name: "Mobil menyu" })
    .getByRole("link", { name: "Natijalar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/results$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("home previews show brief content and navigate to full sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("[data-home-preview]")).toHaveCount(5);
  await expect(
    page.locator('[data-home-preview="results"] [data-result-type="ielts"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-home-preview="results"] [data-result-type="cefr"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-home-preview="courses"] article'),
  ).toHaveCount(3);
  await expect(page.locator('[data-home-preview="faq"] details')).toHaveCount(
    3,
  );
  await page.locator('[data-home-preview="faq"] summary').first().click();
  await expect(
    page.locator('[data-home-preview="faq"] details').first(),
  ).toHaveAttribute("open", "");
  for (const [section, path] of [
    ["about", "/about"],
    ["results", "/results"],
    ["courses", "/courses"],
    ["faq", "/faq"],
    ["contact", "/contact"],
  ]) {
    await page
      .locator(`[data-home-preview="${section}"]`)
      .locator(`a[href="${path}"]`)
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await page.goto("/");
  }
  await page
    .locator('[data-home-preview="courses"] article')
    .filter({ has: page.getByRole("heading", { name: "IELTS", exact: true }) })
    .getByRole("button", { name: "Kursga yozilish" })
    .click();
  await expect(
    page.getByRole("dialog").locator("select option:checked"),
  ).toHaveText("IELTS");
  await page.keyboard.press("Escape");
  for (const [width, height] of [
    [375, 812],
    [768, 1024],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
