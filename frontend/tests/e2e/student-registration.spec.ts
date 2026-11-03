import { test, expect } from "@playwright/test";

test("student self-registration, pending notice, and tabs flow", async ({
  page,
}) => {
  const stamp = Date.now().toString().slice(-7);
  const testPhone = `+99890${stamp}`;
  const testPassword = `TestPass${stamp}!`;
  const testName = `Azizbek Test ${stamp}`;

  // UI fixture only: real registration/approval is covered on disposable PostgreSQL.
  // Never create students or Telegram deliveries in the owner's database from E2E.
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({ json: { token: "fixture-csrf" } }),
  );
  await page.route("**/api/v1/auth/register", (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      full_name: testName,
      phone: testPhone,
      password: testPassword,
    });
    return route.fulfill({
      status: 201,
      json: { status: "pending", message: "Arizangiz ko‘rib chiqilmoqda." },
    });
  });
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      status: 403,
      json: {
        code: "pending_approval",
        message:
          "Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz.",
      },
    }),
  );

  // 1. Visit /login
  await page.goto("/login");
  await expect(page.getByRole("tab", { name: "Kirish" })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Ro‘yxatdan o‘tish" }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/qa/cabinet-login-tab.png" });

  // 2. Switch to Ro‘yxatdan o‘tish tab
  await page.getByRole("tab", { name: "Ro‘yxatdan o‘tish" }).click();
  await expect(
    page.getByRole("heading", { name: "Ro‘yxatdan o‘tish" }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/qa/cabinet-register-tab.png" });

  // 3. Fill in registration form
  await page.getByLabel("Ism va familiya *").fill(testName);
  await page.getByLabel("Telefon raqamingiz *").fill(testPhone);
  await page.locator("#reg-password").fill(testPassword);

  // Submit registration
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();

  // 4. Verify success card
  await expect(
    page.getByText("Arizangiz muvaffaqiyatli qabul qilindi!"),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("button", { name: "Kirish bo‘limiga o‘tish" }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/qa/cabinet-register-success.png" });

  // 5. Click "Kirish bo‘limiga o‘tish" to return to login tab
  await page.getByRole("button", { name: "Kirish bo‘limiga o‘tish" }).click();
  await expect(page.getByRole("tab", { name: "Kirish" })).toHaveClass(/active/);

  // 6. Attempt login while still pending teacher approval
  await page.getByLabel("Telefon raqami yoki login").fill(testPhone);
  await page.locator("#login-password").fill(testPassword);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();

  // 7. Verify pending notice appears
  await expect(
    page
      .locator(".pending-notice-box")
      .getByText("Arizangiz ko‘rib chiqilmoqda", { exact: true }),
  ).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.getByText(
      "Arizangiz Sherzod ustozga yuborilgan. Tasdiqlanganingizdan keyin kabinetingizga to‘liq kira olasiz.",
    ),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/qa/cabinet-login-pending-notice.png",
  });
});

test("teacher pending students view, approve action, and students list button removal", async ({
  page,
}) => {
  // Mock teacher session
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith("/auth/me")) {
      return route.fulfill({
        json: {
          id: "fixture-teacher",
          username: "teacher",
          role: "teacher",
          must_change_password: false,
        },
      });
    }
    if (path.endsWith("/auth/csrf")) {
      return route.fulfill({ json: { token: "signed-csrf-token" } });
    }
    if (path.endsWith("/teacher/pending-students")) {
      return route.fulfill({
        json: {
          items: [
            {
              id: "stu-1",
              user_id: "usr-1",
              full_name: "Azizbek Rahimov",
              phone: "+998901234567",
              course_id: "course-1",
              course_name: "IELTS Intensive",
              status: "paused",
              created_at: new Date().toISOString(),
            },
            {
              id: "stu-2",
              user_id: "usr-2",
              full_name: "Malika Karimova",
              phone: "+998909876543",
              course_id: "course-2",
              course_name: "General English",
              status: "paused",
              created_at: new Date().toISOString(),
            },
          ],
          total: 2,
        },
      });
    }
    if (path.includes("/teacher/pending-students/stu-1/approve")) {
      return route.fulfill({
        json: {
          message: "Azizbek Rahimov tasdiqlandi. Kabinetga kirish ochildi.",
        },
      });
    }
    if (path.endsWith("/teacher/pending-students/approve-all")) {
      return route.fulfill({
        json: {
          approved_count: 2,
          message:
            "2 ta o‘quvchi bir vaqtda tasdiqlandi. Hammasiga kabinet ochildi.",
        },
      });
    }
    if (path.endsWith("/teacher/students")) {
      return route.fulfill({
        json: {
          items: [
            {
              id: "stu-existing",
              full_name: "Faol O‘quvchi",
              phone: "+998901112233",
              status: "active",
              joined_on: "2026-10-01",
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        },
      });
    }
    if (path.endsWith("/teacher/dashboard")) {
      return route.fulfill({
        json: {
          student_count: 1,
          pending_students: 2,
          group_count: 1,
          today_lessons: 1,
          received: "0.00",
          refunded: "0.00",
          net_receipts: "0.00",
          overdue: "0.00",
          new_leads: 0,
          attention: [
            {
              label: "Yangi o‘quvchilar arizalari (2 ta)",
              href: "/teacher/pending-students",
            },
          ],
        },
      });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });

  // 1. Visit /teacher/students and verify "+ Yangi qo‘shish" is removed, "Yangi arizalarni ko‘rish →" is present
  await page.goto("/teacher/students");
  await expect(
    page.getByRole("heading", { name: "O‘quvchilar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "+ Yangi qo‘shish" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Yangi arizalarni ko‘rish →" }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/qa/teacher-students-no-add-btn.png" });

  // 2. Navigate to /teacher/pending-students
  await page.goto("/teacher/pending-students");
  await expect(
    page.getByRole("heading", { name: "Yangi o‘quvchilar (Arizalar)" }),
  ).toBeVisible();
  await expect(page.getByText("Azizbek Rahimov")).toBeVisible();
  await expect(page.getByText("+998901234567")).toBeVisible();
  await expect(page.getByText("IELTS Intensive")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Barchasini birdan tasdiqlash/ }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/qa/teacher-pending-students.png" });

  // 3. Test single approve
  await page
    .locator("tr")
    .filter({ hasText: "Azizbek Rahimov" })
    .getByRole("button", { name: "✓ Tasdiqlash" })
    .click();
  await expect(page.getByText("O‘quvchi tasdiqlandi")).toBeVisible();

  // 4. Test bulk approve dialog
  await page
    .getByRole("button", { name: /Barchasini birdan tasdiqlash/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Barcha yangi o‘quvchilarni tasdiqlash",
    }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/qa/teacher-bulk-approve-dialog.png" });
  await page.getByRole("button", { name: "Ha, barchasini tasdiqlash" }).click();
  await expect(page.getByText("Barcha o‘quvchilar tasdiqlandi")).toBeVisible();
});
