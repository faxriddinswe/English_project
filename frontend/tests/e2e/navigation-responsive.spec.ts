import { test, expect } from "@playwright/test";

test("all public navigation and detail links reveal the intended page from the top", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [section, path] of [
    ["about", "/about"],
    ["courses", "/courses"],
    ["results", "/results"],
    ["faq", "/faq"],
    ["contact", "/contact"],
  ]) {
    await page.goto("/");
    const link = page
      .locator(`[data-home-preview="${section}"] a[href="${path}"]`)
      .first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    await expect(
      page.getByRole("dialog", { name: "Kursga ariza" }),
    ).toHaveCount(0);
  }
  for (const [label, path] of [
    ["Asosiy", "/"],
    ["Ustoz haqida", "/about"],
    ["Kurslar", "/courses"],
    ["Natijalar", "/results"],
    ["Savollar", "/faq"],
    ["Bog‘lanish", "/contact"],
  ]) {
    await page.goto(path);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page
      .getByRole("navigation", { name: "Asosiy menyu", exact: true })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  }
  await page.goto("/courses");
  const detail = page.locator("a.course-detail-link").first();
  const detailPath = await detail.getAttribute("href");
  await detail.click();
  await expect(page).toHaveURL(new RegExp(`${detailPath}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  await page.goto("/results");
  await page
    .locator("#results")
    .getByRole("link", { name: "SEFR", exact: true })
    .click();
  const cefr = await (
    await page.request.get("/api/v1/public/results?page_size=60&type=cefr")
  ).json();
  await expect(page.locator('[data-result-type="cefr"]')).toHaveCount(
    cefr.items.length,
  );
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("owner statistics and compact profile work across mobile tablet desktop and light mode", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 812],
    [375, 812],
    [390, 844],
    [768, 1024],
    [1024, 900],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const stats = page.getByRole("region", { name: "Statistika" });
    for (const value of ["18+ yil", "1000+", "500+", "200+"])
      await expect(stats.getByText(value, { exact: true })).toBeVisible();
    await expect(
      stats.getByText("NAMUNA natija kartasi", { exact: true }),
    ).toHaveCount(0);
    await expect(
      stats.getByText("Sertifikat olgan o‘quvchilar", { exact: true }),
    ).toBeVisible();
    await expect(
      stats.getByText("DTM ga kirgan o‘quvchilar", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/about");
    const profile = page.getByTestId("teacher-profile");
    await expect(profile.getByText("18+ yil", { exact: true })).toBeVisible();
    await expect(profile.getByText("1000+", { exact: true })).toBeVisible();
    await expect(profile.getByText("Kabinet", { exact: true })).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1440) {
      const box = await profile.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(1100);
      expect(box!.height).toBeLessThan(720);
    }
    await page.screenshot({ path: `../docs/qa/compact-teacher-${width}.png` });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menyuni ochish" }).click();
  await page
    .getByRole("dialog", { name: "Mobil menyu" })
    .getByRole("link", { name: "Ustoz haqida", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("public API proxy endpoints, course details and protected resource responses are consistent", async ({
  request,
}) => {
  const siteResponse = await request.get("/api/v1/public/site");
  expect(siteResponse.status()).toBe(200);
  const site = await siteResponse.json();
  expect(site.brand).toBe("Sherzod English");
  const bio = site.content.find(
    (item: { kind: string }) => item.kind === "bio",
  );
  expect(bio.data.experience).toBe("18+ yil");
  expect(bio.data.students_taught).toBe("1000+");
  const stats = site.content.filter(
    (item: { kind: string }) => item.kind === "stat",
  );
  expect(
    stats.map((item: { data: { value: string } }) => item.data.value),
  ).toEqual(["18+ yil", "1000+", "500+", "200+"]);
  const coursesResponse = await request.get("/api/v1/public/courses");
  expect(coursesResponse.status()).toBe(200);
  const courses = (await coursesResponse.json()).items;
  for (const course of courses) {
    const detail = await request.get(`/api/v1/public/courses/${course.slug}`);
    expect(detail.status()).toBe(200);
    expect((await detail.json()).id).toBe(course.id);
  }
  const counts: number[] = [];
  for (const query of ["", "&type=ielts", "&type=cefr"]) {
    const response = await request.get(
      `/api/v1/public/results?page_size=60${query}`,
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(0);
    expect(body.items.length).toBe(Math.min(body.total, 60));
    counts.push(body.total);
    if (query)
      expect(
        body.items.every(
          (item: { data: { type: string } }) =>
            item.data.type === query.split("=")[1],
        ),
      ).toBe(true);
  }
  expect(counts[0]).toBe(counts[1] + counts[2]);
  expect((await request.get("/api/v1/public/faqs")).status()).toBe(200);
  expect(
    (await request.get("/api/v1/public/courses/no-such-course")).status(),
  ).toBe(404);
  expect(
    (await request.get("/api/v1/public/results?type=unknown")).status(),
  ).toBe(422);
  expect(
    (await request.get("/api/v1/public/results?page_size=100")).status(),
  ).toBe(422);
  for (const endpoint of [
    "/auth/me",
    "/teacher/dashboard",
    "/student/dashboard",
    "/teacher/students",
  ])
    expect((await request.get(`/api/v1${endpoint}`)).status()).toBe(401);
});
