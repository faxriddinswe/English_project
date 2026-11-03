import { test, expect, type Page } from "@playwright/test";

const student = {
  id: "fixture-student",
  full_name: "NAMUNA O‘quvchi",
  phone: "+998930001122",
  joined_on: "2026-11-01",
  parent_phone: null,
  private_note: "NAMUNA — o‘quvchi haqidagi ichki izoh.",
  user_id: "fixture-user",
  memberships: [
    {
      id: "fixture-member",
      group_id: "fixture-group",
      group_name: "NAMUNA Grammatika",
      start_date: "2026-11-01",
      end_date: null,
      is_current: true,
    },
  ],
};
async function workspace(page: Page, role = "teacher") {
  const writes: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") {
      writes.push(path);
      return route.fulfill({ json: { message: "NAMUNA" } });
    }
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "fixture-user",
          username: "NAMUNA kabinet",
          role,
          must_change_password: false,
        },
      });
    if (path.endsWith("/teacher/dashboard"))
      return route.fulfill({
        json: {
          student_count: 1,
          group_count: 1,
          received: "0.00",
          refunded: "0.00",
          net_receipts: "0.00",
          overdue: "0.00",
          pending_students: 0,
          new_leads: 0,
          today_lessons: 0,
          attention: [],
          consecutive_absences: [],
          absence_threshold: 2,
        },
      });
    if (path.endsWith("/student/dashboard"))
      return route.fulfill({
        json: {
          student,
          billing: {
            debt: "0.00",
            overdue: "0.00",
            unallocated_credit: "0.00",
          },
          next_lesson: null,
          next_assignment: null,
          feedback: null,
        },
      });
    if (path.endsWith("/teacher/students"))
      return route.fulfill({ json: { items: [student], total: 1 } });
    if (path.endsWith("/fixture-student/billing"))
      return route.fulfill({
        json: {
          debt: "200000.00",
          overdue: "100000.00",
          unallocated_credit: "50000.00",
        },
      });
    if (path.endsWith("/fixture-student"))
      return route.fulfill({ json: student });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  return writes;
}

test("course details contain real content and two local photos with the course selected on enrollment", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator('[data-home-preview="courses"] article')
    .filter({
      has: page.getByRole("heading", { name: "Grammatika", exact: true }),
    })
    .getByRole("link", { name: /Kurs haqida batafsil/ })
    .click();
  await expect(page).toHaveURL(/\/courses\/general-english$/);
  for (const [slug, name] of [
    ["general-english", "Grammatika"],
    ["ielts", "IELTS"],
    ["cefr", "SEFR"],
  ]) {
    await page.goto(`/courses/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Asosiy yo‘nalishlar", exact: true }),
    ).toBeVisible();
    const photos = page.locator("article figure img");
    await expect(photos).toHaveCount(2);
    for (const photo of await photos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          photo.evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    await page
      .getByRole("complementary", { name: "Kursga yozilish" })
      .getByRole("button", { name: "Ariza qoldirish", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const selected = await page
      .getByRole("dialog")
      .locator("select")
      .first()
      .locator("option:checked")
      .textContent();
    expect(selected).toContain(name);
    await page.keyboard.press("Escape");
    await page.getByRole("heading", { level: 1, name, exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `../docs/qa/course-${slug}-1440.png`,
      fullPage: true,
    });
  }
});

test("course pages fit phone tablet and laptop in both palettes", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/courses/general-english");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    if (width === 375) {
      for (const photo of await page.locator("article figure img").all()) {
        await photo.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            photo.evaluate((img) => (img as HTMLImageElement).naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
      await page.screenshot({
        path: "../docs/qa/course-grammar-375-light.png",
        fullPage: true,
      });
    }
  }
});

test("brand returns each role to its cabinet home without signing out", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const role of ["teacher", "student"]) {
    await page.unroute("**/api/v1/**");
    const writes = await workspace(page, role);
    await page.goto(
      role === "teacher" ? "/teacher/students" : "/student/schedule",
    );
    const brand = page.getByRole("link", {
      name: "Sherzod English — Kabinet boshqaruvi",
      exact: true,
    });
    await expect(brand).toHaveAttribute("href", `/${role}`);
    await brand.click();
    await expect(page).toHaveURL(new RegExp(`/${role}$`));
    await expect(
      page.getByRole("button", { name: "Chiqish", exact: true }),
    ).toBeVisible();
    expect(writes).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("student overview history and actions are distinct and usable on every screen", async ({
  page,
}) => {
  const writes = await workspace(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/teacher/students");
    await page.getByRole("button", { name: "Ochish", exact: true }).click();
    const detail = page.getByRole("dialog", {
      name: "O‘quvchilar — tafsilotlar",
      exact: true,
    });
    await expect(
      detail.getByRole("tab", { name: "Ma’lumotlar", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(detail.getByText("Jami qarz", { exact: true })).toBeVisible();
    await expect(
      detail.getByText("200,000 so‘m", { exact: true }),
    ).toBeVisible();
    expect(
      await detail
        .getByRole("heading", { name: student.full_name, exact: true })
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeLessThan(80);
    await expect(
      detail.getByRole("button", { name: "O‘quvchini o‘chirish", exact: true }),
    ).toHaveCount(0);
    await expect(
      detail.getByText(/Vaqtinchalik parol|Kabinet ochish/),
    ).toHaveCount(0);
    expect(
      await detail.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await detail
      .getByRole("tab", { name: "O‘quv tarixi", exact: true })
      .click();
    await expect(
      detail.getByRole("link", { name: /NAMUNA Grammatika/ }),
    ).toBeVisible();
    await detail.getByRole("tab", { name: "Boshqaruv", exact: true }).click();
    await expect(
      detail.getByRole("heading", { name: "Guruhga qo‘shish", exact: true }),
    ).toBeVisible();
    await detail
      .locator("summary")
      .filter({ hasText: "O‘chirish va bekor qilish" })
      .click();
    await detail
      .getByRole("button", { name: "O‘quvchini o‘chirish", exact: true })
      .click();
    const confirm = page.getByRole("dialog", {
      name: "O‘quvchini o‘chirish",
      exact: true,
    });
    await expect(confirm).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(confirm).toHaveCount(0);
    await detail.getByRole("tab", { name: "Ma’lumotlar", exact: true }).click();
    await page.screenshot({
      path: `../docs/qa/student-details-${width}.png`,
      fullPage: true,
    });
    await detail
      .getByRole("button", { name: "Tahrirlash", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Tahrirlash", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await detail.getByRole("button", { name: "Yopish", exact: true }).click();
    await expect(detail).toHaveCount(0);
  }
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
