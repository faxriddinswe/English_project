import { test, expect, type Page, type Locator } from "@playwright/test";
const teacherPassword = process.env.E2E_TEACHER_PASSWORD;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
test.beforeEach(() => {
  test.skip(
    !teacherPassword ||
      !studentPassword ||
      !process.env.E2E_BASE_URL?.includes(":3101"),
    "Mutation journeys require the disposable management QA environment",
  );
});
async function login(page: Page, role: "teacher" | "student") {
  await page.goto("/login");
  await page
    .getByLabel("Kirish nomi", { exact: true })
    .fill(
      role === "teacher"
        ? (process.env.E2E_TEACHER_USERNAME ?? "demo-teacher")
        : (process.env.E2E_STUDENT_USERNAME ?? "demo-student"),
    );
  await page
    .getByLabel("Parol", { exact: true })
    .fill(role === "teacher" ? teacherPassword! : studentPassword!);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
}
async function get<T>(page: Page, path: string): Promise<T> {
  return page.evaluate(async (path) => {
    const response = await fetch(`/api/v1${path}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, path);
}
async function chooseRecord(dialog: Locator, label: string, query: string) {
  await dialog.getByRole("combobox", { name: label, exact: true }).fill(query);
  const option = dialog.locator('[role="listbox"] [role="option"]').first();
  await expect(option).toBeVisible();
  await option.click();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}

test("teacher creates updates enrolls and archives a group with count and readable hours", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "teacher");
  const students = await get<{ items: { id: string; full_name?: string }[] }>(
    page,
    "/teacher/students",
  );
  const courses = await get<{ items: { id: string; name: string }[] }>(
    page,
    "/teacher/courses",
  );
  await page.goto("/teacher/groups");
  await page
    .getByRole("button", { name: "+ Yangi qo‘shish", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Yangi yozuv", exact: true });
  await chooseRecord(dialog, "Kurs", courses.items[0].name);
  await dialog.getByLabel("Guruh nomi").fill("NAMUNA QA Evening");
  await dialog.getByLabel("Sig‘im", { exact: false }).fill("12");
  await dialog.getByLabel("Oylik narx").fill("450000.00");
  await dialog
    .getByRole("button", { name: "+ Dars kuni", exact: true })
    .click();
  await dialog.getByLabel("Hafta kuni").selectOption("3");
  await dialog.getByLabel("Dars vaqti (Toshkent)").fill("20:00");
  await dialog.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: "NAMUNA QA Evening" });
  await expect(row).toContainText("Payshanba 20:00–21:30");
  await fits(page);
  await row.getByRole("button", { name: "Ochish", exact: true }).click();
  await page.getByRole("tab", { name: "Boshqaruv", exact: true }).click();
  await page
    .getByRole("button", { name: "Guruhga o‘quvchi qo‘shish", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Guruhga o‘quvchi qo‘shish",
    exact: true,
  });
  await expect(dialog.locator('input[type="date"]')).toHaveCount(0);
  await chooseRecord(
    dialog,
    "O‘quvchi",
    (
      students.items.find(
        (student) => student.full_name === "NAMUNA — O‘quvchi",
      ) ?? students.items[0]
    ).full_name!,
  );
  const membershipRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().endsWith("/memberships"),
  );
  await dialog
    .getByRole("button", { name: "Guruhga o‘quvchi qo‘shish", exact: true })
    .click();
  expect((await membershipRequest).postDataJSON()).not.toHaveProperty(
    "start_date",
  );
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".group-summary-line")).toContainText(
    "1 ta o‘quvchi / 12 ta joy",
  );
  await page.getByRole("button", { name: "Tahrirlash", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Tahrirlash", exact: true });
  await dialog.getByLabel("Guruh nomi").fill("NAMUNA QA Updated");
  await dialog.getByLabel("Dars vaqti (Toshkent)").fill("19:00");
  await dialog.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".group-schedule-line")).toContainText(
    "19:00–20:30",
  );
  await page.goto("/teacher");
  const overview = page
    .locator(".group-overview-card")
    .filter({ hasText: "NAMUNA QA Updated" });
  await expect(overview).toContainText("1 ta o‘quvchi");
  await expect(overview).toContainText("19:00–20:30");
  await overview.click();
  await page.getByRole("tab", { name: "Boshqaruv", exact: true }).click();
  await page
    .locator("summary")
    .filter({ hasText: "O‘chirish va bekor qilish" })
    .click();
  await page
    .getByRole("button", { name: "Guruhni o‘chirish", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Guruhni o‘chirish", exact: true });
  await dialog.getByLabel("Sababi").fill("NAMUNA QA group finished");
  await dialog
    .getByRole("button", { name: "Guruhni o‘chirish", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: "NAMUNA QA Updated" }),
  ).toHaveCount(0);
  await fits(page);
  await page.screenshot({
    path: "../docs/qa/teacher-groups-management-375.png",
    fullPage: true,
  });
});

test("teacher adds allocates edits and deletes a receipt and student balance follows", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  await login(page, "teacher");
  const students = await get<{ items: { id: string; full_name?: string }[] }>(
    page,
    "/teacher/students",
  );
  const studentId = (
    students.items.find(
      (student) => student.full_name === "NAMUNA — O‘quvchi",
    ) ?? students.items[0]
  ).id;
  const invoices = await get<{
    items: { id: string; debt: string; period_start: string }[];
  }>(page, `/teacher/invoices?student_id=${studentId}&status=issued`);
  const invoice = invoices.items.find((i) => i.debt === "200000.00")!;
  expect(invoice).toBeTruthy();
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  const studentPage = await context.newPage();
  await login(studentPage, "student");
  const originalDebt = (
    await get<{ debt: string }>(studentPage, "/student/billing")
  ).debt;
  const expectedDebt = (reduction: number) =>
    (Number(originalDebt) - reduction).toFixed(2);
  await page.goto("/teacher/finance/payments");
  await page
    .getByRole("button", { name: "+ Yangi qo‘shish", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Yangi yozuv", exact: true });
  await chooseRecord(
    dialog,
    "O‘quvchi",
    students.items.find((student) => student.id === studentId)!.full_name!,
  );
  await dialog.getByLabel("Qabul qilingan pul").fill("100000.00");
  await dialog.getByLabel("To‘lov izohi / reference").fill("NAMUNA QA receipt");
  await dialog.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: "NAMUNA QA receipt" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Ochish", exact: true }).click();
  await page.getByRole("tab", { name: "Boshqaruv", exact: true }).click();
  await page
    .getByRole("button", { name: "Hisobga mablag‘ taqsimlash", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Hisobga mablag‘ taqsimlash",
    exact: true,
  });
  await chooseRecord(dialog, "Chiqarilgan hisob", invoice.period_start);
  await dialog.getByLabel(/^Summa \(so‘m\)/).fill("100000.00");
  await dialog
    .getByRole("button", { name: "Hisobga mablag‘ taqsimlash", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await get<{ debt: string }>(studentPage, "/student/billing")).debt,
  ).toBe(expectedDebt(100000));
  await page
    .getByRole("button", { name: "To‘lovni tahrirlash", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "To‘lovni tahrirlash",
    exact: true,
  });
  await dialog.getByLabel(/^Summa \(so‘m\)/).fill("50000.00");
  await dialog.getByLabel("Sababi").fill("NAMUNA QA correction");
  await dialog
    .getByRole("button", { name: "To‘lovni tahrirlash", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await get<{ debt: string }>(studentPage, "/student/billing")).debt,
  ).toBe(expectedDebt(50000));
  await studentPage.goto("/student/payments");
  await expect(
    studentPage.getByRole("cell", { name: "50,000 so‘m", exact: true }),
  ).toBeVisible();
  await page
    .locator("summary")
    .filter({ hasText: "O‘chirish va bekor qilish" })
    .click();
  await page
    .getByRole("button", { name: "To‘lovni o‘chirish", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "To‘lovni o‘chirish",
    exact: true,
  });
  await dialog.getByLabel("Sababi").fill("NAMUNA QA cancellation");
  await dialog
    .getByRole("button", { name: "To‘lovni o‘chirish", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await get<{ debt: string }>(studentPage, "/student/billing")).debt,
  ).toBe(expectedDebt(0));
  await studentPage.reload();
  await expect(
    studentPage.getByRole("cell", {
      name: "NAMUNA QA cancellation",
      exact: true,
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await fits(page);
  await page.screenshot({
    path: "../docs/qa/teacher-payment-management-375.png",
    fullPage: true,
  });
  await context.close();
});

test("certificate create edit delete updates an open public page and only its student", async ({
  page,
  browser,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "teacher");
  const students = await get<{ items: { id: string; full_name?: string }[] }>(
    page,
    "/teacher/students",
  );
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  const studentPage = await context.newPage();
  await login(studentPage, "student");
  await studentPage.goto("/student/certificates");
  await expect(
    studentPage.getByText("Hozircha nashr qilingan sertifikatingiz yo‘q."),
  ).toBeVisible();
  const publicContext = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL,
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto("/");
  await publicPage.getByRole("button", { name: /Yorug.*rejim/ }).click();
  await page.goto("/teacher/results");
  await page
    .getByRole("button", { name: "+ Yangi qo‘shish", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Yangi yozuv", exact: true });
  await chooseRecord(
    dialog,
    "O‘quvchi",
    (
      students.items.find(
        (student) => student.full_name === "NAMUNA — O‘quvchi",
      ) ?? students.items[0]
    ).full_name!,
  );
  await dialog
    .getByLabel("Sertifikat sarlavhasi")
    .fill("NAMUNA QA Certificate");
  await dialog
    .getByRole("combobox", { name: "Imtihon turi", exact: true })
    .selectOption("cefr");
  await dialog
    .getByLabel("Nashrga ruxsat berilgan ism")
    .fill("NAMUNA QA Display");
  await dialog.getByLabel("Imtihon sanasi").fill("2026-11-02");
  await dialog.getByLabel("SEFR darajasi").selectOption("B2");
  await dialog
    .getByLabel("Ommaviy rasm tavsifi")
    .fill("NAMUNA QA prepared certificate");
  await dialog
    .getByLabel("Fayl tanlash", { exact: true })
    .setInputFiles("tests/fixtures/qa-certificate.png");
  await expect(
    dialog.getByText("qa-certificate.png", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /Yuklangan faylni/ }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Sertifikatni saqlash", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(
    publicPage.getByText("NAMUNA QA Display", { exact: true }),
  ).toHaveCount(0);
  await dialog.getByLabel("Ism/media nashriga rozilik olingan").check();
  await dialog.getByLabel("Ustoz tomonidan tekshirilgan").check();
  await dialog
    .getByRole("button", { name: "Sertifikatni saqlash", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    publicPage.getByText("NAMUNA QA Display", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    studentPage.getByText("NAMUNA QA Display", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page
    .getByPlaceholder("Sertifikat yoki o‘quvchi ismi")
    .fill("NAMUNA QA Display");
  await page
    .getByRole("row")
    .filter({ hasText: "NAMUNA QA Certificate" })
    .getByRole("button", { name: "Ochish", exact: true })
    .click();
  await page.getByRole("button", { name: "Tahrirlash", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Tahrirlash", exact: true });
  await dialog.getByLabel("SEFR darajasi").selectOption("C1");
  await dialog
    .getByRole("button", { name: "Sertifikatni saqlash", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    publicPage
      .locator('[data-result-type="cefr"]')
      .getByText("C1", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    studentPage
      .locator('[data-result-type="cefr"]')
      .getByText("C1", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await fits(page);
  await studentPage.setViewportSize({ width: 375, height: 812 });
  await fits(studentPage);
  await studentPage.screenshot({
    path: "../docs/qa/student-certificate-management-375.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Boshqaruv", exact: true }).click();
  await page
    .locator("summary")
    .filter({ hasText: "O‘chirish va bekor qilish" })
    .click();
  await page
    .getByRole("button", { name: "Sertifikatni o‘chirish", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Sertifikatni o‘chirish",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Sertifikatni o‘chirish", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    publicPage.getByText("NAMUNA QA Display", { exact: true }),
  ).toHaveCount(0, { timeout: 15000 });
  await expect(
    studentPage.getByText("Hozircha nashr qilingan sertifikatingiz yo‘q."),
  ).toBeVisible({ timeout: 15000 });
  await context.close();
  await publicContext.close();
});
