import { test, expect } from "@playwright/test";

test("signup uses real retryable courses and accepts a one-character password", async ({
  page,
}) => {
  let courseRequests = 0;
  let registration: Record<string, unknown> | undefined;
  await page.route("**/api/v1/public/courses", (route) => {
    courseRequests++;
    return courseRequests === 1
      ? route.abort()
      : route.fulfill({
          json: {
            items: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                name: "NAMUNA kurs",
              },
            ],
          },
        });
  });
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({ json: { token: "fixture-csrf" } }),
  );
  await page.route("**/api/v1/auth/register", (route) => {
    registration = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      json: { status: "pending", message: "Arizangiz ko‘rib chiqilmoqda." },
    });
  });
  await page.goto("/login");
  await page.getByRole("tab", { name: "Ro‘yxatdan o‘tish" }).click();
  await expect(page.getByText(/Kurslar yuklanmadi/)).toBeVisible();
  await expect(page.locator("#reg-course")).toBeDisabled();
  await expect(page.locator("#reg-course option")).toHaveCount(1);
  await page.getByRole("button", { name: "Kurslarni qayta yuklash" }).click();
  await expect(page.locator("#reg-course")).toBeEnabled();
  await page.locator("#reg-course").selectOption({ label: "NAMUNA kurs" });
  await page.getByLabel("Ism va familiya *").fill("  NAMUNA Test  ");
  await page.getByLabel("Telefon raqamingiz *").fill("abcdefghi");
  await page.locator("#reg-password").fill("x");
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await expect(page.locator("#reg-phone-error")).toBeVisible();
  expect(registration).toBeUndefined();
  await page.getByLabel("Telefon raqamingiz *").fill("+998930001122");
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await expect(
    page.getByText("Arizangiz muvaffaqiyatli qabul qilindi!"),
  ).toBeVisible();
  expect(registration).toEqual({
    full_name: "NAMUNA Test",
    phone: "+998930001122",
    password: "x",
    course_id: "11111111-1111-4111-8111-111111111111",
  });
});

test("saved theme remains consistent after navigation, reload and changes in another tab", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Qorong.*rejim/ }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto("/login");
  await other.evaluate(() => localStorage.setItem("theme", "dark"));
  await expect(
    page.getByRole("button", { name: /Yorug.*rejim/ }),
  ).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "light");
  await other.close();
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await navigator.serviceWorker.getRegistrations()).length,
      ),
    )
    .toBe(0);
});

test("reopened lead dialog starts a new form and restores focus", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({ json: { token: "fixture-csrf" } }),
  );
  await page.route("**/api/v1/public/leads", (route) =>
    route.fulfill({ status: 201, json: { id: "fixture-lead" } }),
  );
  await page.goto("/");
  const trigger = page
    .getByRole("region", { name: "Asosiy taklif", exact: true })
    .getByRole("button", { name: "Kursga yozilish" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Kursga ariza" });
  await dialog.getByLabel("Ism va familiya").fill("NAMUNA Modal");
  await dialog.getByLabel("Telefon raqamingiz").fill("+998930001122");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Arizani yuborish" }).click();
  await expect(
    dialog.getByText("Arizangiz qabul qilindi.", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByLabel("Ism va familiya")).toHaveValue("");
  await expect(
    dialog.getByText("Arizangiz qabul qilindi.", { exact: true }),
  ).toHaveCount(0);
});

test.describe("pending registration fixture", () => {
  test.use({
    timezoneId: "America/New_York",
    viewport: { width: 375, height: 812 },
  });
  test("Tashkent dates and pending mutations remain consistent on a phone", async ({
    page,
  }) => {
    let finishApproval!: () => void;
    let approved = false;
    const gate = new Promise<void>((resolve) => {
      finishApproval = resolve;
    });
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/me"))
        return route.fulfill({
          json: {
            id: "fixture",
            role: "teacher",
            username: "fixture",
            must_change_password: false,
          },
        });
      if (path.endsWith("/auth/csrf"))
        return route.fulfill({ json: { token: "fixture-csrf" } });
      if (path.endsWith("/fixture-student/approve")) {
        await gate;
        approved = true;
        return route.fulfill({
          json: { id: "fixture-student", message: "NAMUNA Ariza tasdiqlandi." },
        });
      }
      if (path.endsWith("/teacher/pending-students"))
        return route.fulfill({
          json: {
            total: approved ? 0 : 1,
            items: approved
              ? []
              : [
                  {
                    id: "fixture-student",
                    user_id: "fixture-user",
                    full_name: "NAMUNA Ariza",
                    phone: "+998930001122",
                    course_id: null,
                    course_name: "",
                    created_at: "2026-11-03T00:30:00Z",
                  },
                ],
          },
        });
      return route.fulfill({ json: { items: [], total: 0 } });
    });
    await page.goto("/teacher/pending-students");
    await expect(page.getByText("Jadvalni yon tomonga suring ↔")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Yangi o‘quvchilar jadvali" }),
    ).toHaveAttribute("tabindex", "0");
    await expect(
      page.getByText("03 noyabr 2026, 05:30", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "../docs/qa/audit-pending-students-375.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(
      await page
        .locator(".pending-phone a")
        .evaluate((element) => getComputedStyle(element).color),
    ).toBe("rgb(53, 17, 65)");
    await page.screenshot({
      path: "../docs/qa/audit-pending-students-light-375.png",
      fullPage: true,
    });
    const approve = page.getByRole("button", {
      name: "✓ Tasdiqlash",
      exact: true,
    });
    await approve.click();
    await expect(approve).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "✕ Rad etish", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /Barchasini birdan tasdiqlash/ }),
    ).toBeDisabled();
    finishApproval();
    await expect(
      page.getByRole("heading", { name: "Hozircha yangi arizalar yo‘q" }),
    ).toBeVisible();
  });
});
