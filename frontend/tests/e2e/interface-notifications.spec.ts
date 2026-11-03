import { test, expect, type Page } from "@playwright/test";
const sample = {
  id: "11111111-1111-4111-8111-111111111111",
  full_name: "Sinov o‘quvchisi",
  name: "Sinov guruhi",
  title: "Sinov yozuvi",
  phone: "+998901234567",
  status: "active",
  kind: "result",
  published: true,
  consent: true,
  approved: true,
  course_id: "22222222-2222-4222-8222-222222222222",
  student_id: "33333333-3333-4333-8333-333333333333",
  group_id: "44444444-4444-4444-8444-444444444444",
  course_name: "Umumiy ingliz tili",
  student_count: 2,
  capacity: 12,
  monthly_price: "450000.00",
  amount: "300000.00",
  refunded: "0.00",
  unallocated_credit: "300000.00",
  method: "cash",
  reference: "Sinov",
  void_reason: null,
  start_date: "2026-11-01",
  joined_on: "2026-11-01",
  updated_at: "2026-11-02T09:00:00Z",
  created_at: "2026-11-01T09:00:00Z",
  received_at: "2026-11-02T09:00:00Z",
  starts_at: "2026-11-02T09:00:00Z",
  ends_at: "2026-11-02T10:00:00Z",
  level: "B2",
  rules: [
    {
      weekday: 3,
      local_time: "19:00:00",
      duration_minutes: 90,
      end_time: "20:30",
    },
  ],
  memberships: [],
  allocations: [],
  revisions: [],
  roster: [],
  history: [],
  lines: [],
  adjustments: [],
  possible_students: [],
  data: {
    type: "cefr",
    student_name: "Sinov o‘quvchisi",
    exam_date: "2026-11-01",
    level: "B2",
  },
  media_id: null,
  media_url: null,
};
async function fixture(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "fixture",
          username: "sinov-ustoz",
          role: "teacher",
          must_change_password: false,
        },
      });
    if (path.endsWith("/auth/csrf"))
      return route.fulfill({ json: { token: "signed-fixture" } });
    if (route.request().method() !== "GET")
      return route.fulfill({ json: sample, status: 200 });
    if (path.endsWith(sample.id)) return route.fulfill({ json: sample });
    return route.fulfill({
      json: { items: [sample], total: 1, page: 1, page_size: 20 },
    });
  });
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}

test("all teacher resources open a centered dialog instead of a lower panel (UI fixtures)", async ({
  page,
}) => {
  test.setTimeout(90000);
  await fixture(page);
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    for (const path of [
      "students",
      "groups",
      "lessons",
      "attendance",
      "finance/payments",
      "finance/invoices",
      "assignments",
      "results",
      "leads",
      "content",
      "assessments",
      "materials",
      "courses",
    ]) {
      await page.goto(`/teacher/${path}`);
      const open = page
        .getByRole("button", { name: "Ochish", exact: true })
        .first();
      await open.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/tafsilotlar/);
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(width <= 600 ? 0 : 11);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        width <= 600 ? width : width - 11,
      );
      expect(box!.y).toBeGreaterThanOrEqual(width <= 600 ? 0 : 10);
      await expect(
        dialog.getByText("Yangilangan vaqti", { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.locator("dl > div").filter({ hasText: "Yangilangan vaqti" }),
      ).toContainText("02 noyabr 2026, 14:00");
      expect(await dialog.innerText()).not.toMatch(
        /updated_at|calendar_month|Dashboard|accepted/,
      );
      await fits(page);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(open).toBeFocused();
    }
  }
});

test("nested editing returns to details, toast close preserves the dialog and failed requests retain fields (UI fixtures)", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/teacher/groups");
  await page.getByRole("button", { name: "Ochish", exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Guruhlar — tafsilotlar",
    exact: true,
  });
  await detail.getByRole("button", { name: "Tahrirlash", exact: true }).click();
  let edit = page.getByRole("dialog", { name: "Tahrirlash", exact: true });
  await edit.getByLabel("Guruh nomi").fill("Yangilangan guruh");
  await edit.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(edit).toHaveCount(0);
  await expect(detail).toBeVisible();
  const toast = page
    .getByTestId("notification")
    .filter({ hasText: "Guruh yangilandi." });
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Bildirishnomani yopish" }).click();
  await expect(toast).toHaveCount(0);
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Tahrirlash", exact: true }).click();
  edit = page.getByRole("dialog", { name: "Tahrirlash", exact: true });
  await page.route(`**/api/v1/teacher/groups/${sample.id}`, (route) =>
    route.request().method() === "PUT"
      ? route.abort()
      : route.fulfill({ json: sample }),
  );
  await edit.getByLabel("Guruh nomi").fill("Saqlanmagan guruh");
  await edit.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(edit.getByRole("alert")).toBeVisible();
  await expect(edit.getByLabel("Guruh nomi")).toHaveValue("Saqlanmagan guruh");
  await expect(
    page.getByTestId("notification").filter({ hasText: "Amal bajarilmadi." }),
  ).toBeVisible();
  await expect(
    page.getByTestId("notification").filter({ hasText: "Guruh yangilandi." }),
  ).toHaveCount(0);
  await fits(page);
  await page.screenshot({
    path: "../docs/qa/notification-error-modal-375.png",
  });
  await page.keyboard.press("Escape");
  await expect(edit).toHaveCount(0);
  await expect(detail).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detail).toHaveCount(0);
});

test("notification appears only after response, fits narrow screens and dismisses accessibly (UI fixtures)", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 320, height: 568 });
  let release: () => void = () => {};
  let received = false;
  await page.route(`**/api/v1/teacher/groups/${sample.id}`, async (route) => {
    if (route.request().method() !== "PUT")
      return route.fulfill({ json: sample });
    received = true;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({ json: sample });
  });
  await page.goto(`/teacher/groups/${sample.id}`);
  const detail = page.getByRole("dialog", {
    name: "Guruhlar — tafsilotlar",
    exact: true,
  });
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Tahrirlash", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Tahrirlash", exact: true });
  await edit.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect.poll(() => received).toBe(true);
  await expect(
    edit.getByRole("button", { name: "Saqlanmoqda…" }),
  ).toBeDisabled();
  await expect(page.getByTestId("notification")).toHaveCount(0);
  release();
  await expect(edit).toHaveCount(0);
  const toast = page.getByTestId("notification");
  await expect(toast).toContainText("Guruh yangilandi.");
  const box = await toast.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(11);
  expect(box!.x + box!.width).toBeLessThanOrEqual(309);
  const close = toast.getByRole("button", { name: "Bildirishnomani yopish" });
  expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: "../docs/qa/notification-success-320.png" });
  await close.click();
  await expect(toast).toHaveCount(0);
  await expect(detail).toBeVisible();
});

test("login and password forms have responsive logos labels and password visibility", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [768, 1024],
    [1440, 900],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/login");
    await expect(
      page.getByLabel("Telefon raqami yoki login", { exact: true }),
    ).toBeVisible();
    const password = page.getByLabel("Parol", { exact: true });
    await password.fill("Sinov matni");
    await page
      .getByRole("button", { name: "Parolni ko‘rsatish", exact: true })
      .click();
    await expect(password).toHaveAttribute("type", "text");
    await page
      .getByRole("button", { name: "Parolni yashirish", exact: true })
      .click();
    await expect(password).toHaveAttribute("type", "password");
    await fits(page);
    const logo = await page
      .getByRole("link", { name: "Sherzod English — Bosh sahifa", exact: true })
      .boundingBox();
    expect(logo!.x).toBeGreaterThanOrEqual(16);
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(width - 16);
    const brand = page.getByRole("link", {
      name: "Sherzod English — Bosh sahifa",
      exact: true,
    });
    const icon = await brand.locator("svg").boundingBox(),
      wordmark = await brand
        .getByText("SHERZOD", { exact: true })
        .boundingBox();
    expect(wordmark!.x).toBeGreaterThan(icon!.x + icon!.width);
    expect(wordmark!.y).toBeLessThan(icon!.y + icon!.height);
    await page.screenshot({
      path: `../docs/qa/login-refined-${width}x${height}.png`,
    });
    await page.goto("/change-password");
    await expect(
      page.getByLabel("Amaldagi parol", { exact: true }),
    ).toBeVisible();
    await fits(page);
  }
});

test("real teacher Excel button downloads a file and reports preparation", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_BASE_URL?.includes(":3101") ||
      !process.env.E2E_TEACHER_PASSWORD,
    "Disposable QA credentials required",
  );
  await page.goto("/login");
  await page
    .getByLabel("Kirish nomi", { exact: true })
    .fill(process.env.E2E_TEACHER_USERNAME ?? "demo-teacher");
  await page
    .getByLabel("Parol", { exact: true })
    .fill(process.env.E2E_TEACHER_PASSWORD!);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher$/);
  await page.goto("/teacher/reports");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "O‘quvchilar (Excel)",
      exact: true,
    })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(
    /^sherzod-students-\d{4}-\d{2}\.xlsx$/,
  );
  await expect(
    page
      .getByTestId("notification")
      .filter({ hasText: "Excel fayli yuklab olishga tayyorlandi." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/teacher\/reports$/);
});
