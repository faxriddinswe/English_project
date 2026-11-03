import { test, expect, type Page } from "@playwright/test";
const ids = {
  group: "11111111-1111-4111-8111-111111111111",
  course: "22222222-2222-4222-8222-222222222222",
  student: "33333333-3333-4333-8333-333333333333",
};
const course = { id: ids.course, name: "Grammatika" };
const group = {
  id: ids.group,
  name: "NAMUNA Evening",
  course_id: ids.course,
  course_name: course.name,
  student_count: 0,
  capacity: 12,
  monthly_price: "450000.00",
  start_date: "2026-11-01",
  status: "active",
  level: "B1",
  rules: [],
  memberships: [],
};
const student = {
  id: ids.student,
  full_name: "NAMUNA Azizbek",
  phone: "+998901234567",
};
async function fixture(page: Page) {
  const writes: { path: string; body: Record<string, unknown> }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "fixture",
          role: "teacher",
          username: "sinov",
          must_change_password: false,
        },
      });
    if (path.endsWith("/auth/csrf"))
      return route.fulfill({ json: { token: "signed-fixture" } });
    if (route.request().method() !== "GET") {
      writes.push({ path, body: route.request().postDataJSON() });
      return route.fulfill({
        json: { ...group, ...route.request().postDataJSON() },
      });
    }
    if (path.endsWith(`/groups/${ids.group}`))
      return route.fulfill({ json: group });
    if (path.endsWith(`/courses/${ids.course}`))
      return route.fulfill({ json: course });
    if (path.endsWith(`/students/${ids.student}`))
      return route.fulfill({ json: student });
    let items: Record<string, unknown>[] = path.endsWith("/courses")
      ? [course]
      : path.endsWith("/students")
        ? [student]
        : [group];
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    items = items.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(q),
    );
    return route.fulfill({
      json: { items, total: items.length, page: 1, page_size: 20 },
    });
  });
  return writes;
}
async function groupDialog(page: Page) {
  await page.goto(`/teacher/groups/${ids.group}`);
  const detail = page.getByRole("dialog", {
    name: "Guruhlar — tafsilotlar",
    exact: true,
  });
  await detail
    .getByRole("button", { name: "Guruhga o‘quvchi qo‘shish", exact: true })
    .click();
  return page.getByRole("dialog", {
    name: "Guruhga o‘quvchi qo‘shish",
    exact: true,
  });
}

test("student suggestions replace selection controls and quick enrollment sends no date (UI fixture)", async ({
  page,
}) => {
  const writes = await fixture(page);
  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 812 : 900 });
    const dialog = await groupDialog(page);
    await expect(dialog.locator('input[type="date"], select')).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: /^Tanla/ })).toHaveCount(0);
    const input = dialog.getByRole("combobox", {
      name: "O‘quvchi",
      exact: true,
    });
    await input.fill("Aziz");
    const option = dialog.getByRole("option", { name: /NAMUNA Azizbek/ });
    await expect(option).toBeVisible();
    expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: `../docs/qa/search-enrollment-${width}.png`,
    });
    await option.click();
    await expect(input).toHaveValue("NAMUNA Azizbek");
    await dialog
      .getByRole("button", { name: "Guruhga o‘quvchi qo‘shish", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    expect(writes.at(-1)!.body.student_id).toBe(ids.student);
    expect(writes.at(-1)!.body).not.toHaveProperty("start_date");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});

test("typing clears a prior ID; unmatched text cannot submit and keyboard selection works (UI fixture)", async ({
  page,
}) => {
  const writes = await fixture(page);
  const dialog = await groupDialog(page);
  const input = dialog.getByRole("combobox", { name: "O‘quvchi", exact: true });
  await input.fill("Aziz");
  await expect(dialog.getByRole("option")).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("NAMUNA Azizbek");
  await input.fill("Topilmaydigan ism");
  await expect(dialog.getByText(/Hech narsa topilmadi/)).toBeVisible();
  await input.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Guruhga o‘quvchi qo‘shish", exact: true })
    .click();
  expect(writes).toHaveLength(0);
  await expect(dialog).toBeVisible();
  await input.fill("Aziz");
  await expect(dialog.getByRole("option")).toBeVisible();
  await input.press("Enter");
  await dialog
    .getByRole("button", { name: "Guruhga o‘quvchi qo‘shish", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(writes).toHaveLength(1);
});

test("existing course resolves to its name and search recovers from an API error (UI fixture)", async ({
  page,
}) => {
  await fixture(page);
  await page.goto(`/teacher/groups/${ids.group}`);
  await page.getByRole("button", { name: "Tahrirlash", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tahrirlash", exact: true });
  const input = dialog.getByRole("combobox", { name: "Kurs", exact: true });
  await expect(input).toHaveValue("Grammatika");
  let fail = true;
  await page.route("**/api/v1/teacher/courses?*", (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { message: "Qidiruv vaqtincha mavjud emas" },
        })
      : route.fulfill({
          json: { items: [course], total: 1, page: 1, page_size: 20 },
        }),
  );
  await input.fill("Gram");
  await expect(dialog.getByRole("alert")).toContainText(
    "Qidiruv vaqtincha mavjud emas",
  );
  fail = false;
  await dialog
    .getByRole("button", { name: "Qayta urinish", exact: true })
    .click();
  await expect(
    dialog.getByRole("option", { name: "Grammatika", exact: true }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("Grammatika");
});

test.describe("touch search", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  test("a suggestion can be tapped and retains the selected record (UI fixture)", async ({
    page,
  }) => {
    await fixture(page);
    const dialog = await groupDialog(page);
    const input = dialog.getByRole("combobox", {
      name: "O‘quvchi",
      exact: true,
    });
    await input.tap();
    await input.fill("Aziz");
    await dialog.getByRole("option", { name: /NAMUNA Azizbek/ }).tap();
    await expect(input).toHaveValue("NAMUNA Azizbek");
    await expect(dialog.getByRole("listbox")).toHaveCount(0);
    await expect(dialog).toBeVisible();
  });
});
