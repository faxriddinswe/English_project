import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
const teacherPassword = process.env.E2E_TEACHER_PASSWORD;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const teacherUsername = process.env.E2E_TEACHER_USERNAME ?? "demo-teacher";
const studentUsername = process.env.E2E_STUDENT_USERNAME ?? "demo-student";
async function login(page: Page, role: "teacher" | "student") {
  await page.goto("/login");
  await page
    .getByLabel("Kirish nomi", { exact: true })
    .fill(role === "teacher" ? teacherUsername : studentUsername);
  await page
    .getByLabel("Parol", { exact: true })
    .fill(role === "teacher" ? teacherPassword! : studentPassword!);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
}
test("public layout, modal, theme and responsive screenshots", async ({
  page,
}) => {
  fs.mkdirSync("../docs/qa", { recursive: true });
  for (const [width, height] of [
    [375, 812],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `../docs/qa/home-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "Kursga yozilish", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("failed lead request does not show fake success", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Kursga yozilish", exact: true })
    .first()
    .click();
  await page.getByLabel("Ism va familiya").fill("NAMUNA Network failure");
  await page.getByLabel("Telefon raqamingiz").fill("+998901111111");
  await page.getByRole("checkbox").check();
  await page.route("**/api/v1/public/leads", (route) => route.abort());
  await page.getByRole("button", { name: "Arizani yuborish" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByText("Arizangiz qabul qilindi.", { exact: true }),
  ).toHaveCount(0);
});
test("visitor lead is persisted and appears in teacher workspace", async ({
  page,
}) => {
  test.skip(!teacherPassword, "Set explicit development E2E credentials");
  const name = `NAMUNA E2E ${Date.now()}`;
  await page.goto("/");
  await page
    .getByRole("button", { name: "Kursga yozilish", exact: true })
    .first()
    .click();
  await page.getByLabel("Ism va familiya").fill(name);
  await page.getByLabel("Telefon raqamingiz").fill("+998909876543");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Arizani yuborish" }).click();
  await expect(
    page.getByRole("heading", { name: "Arizangiz qabul qilindi." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await login(page, "teacher");
  await page.goto("/teacher/leads");
  await page.getByPlaceholder("Ism yoki telefon").fill(name);
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
});
test("student sees only own learning and billing data", async ({ page }) => {
  test.skip(!studentPassword, "Set explicit development E2E credentials");
  await login(page, "student");
  await page.goto("/student/billing");
  await expect(
    page.getByRole("heading", { name: "Hisoblar va balans" }),
  ).toBeVisible();
  await expect(page.getByText("PRIVATE_NOTE_NEVER_STUDENT")).toHaveCount(0);
  await page.goto("/student/assignments");
  await page
    .getByRole("button", { name: "Ko‘rish / topshirish" })
    .first()
    .click();
  await page
    .getByLabel("Javobingiz")
    .fill("NAMUNA — My first assignment answer.");
  await page.getByRole("button", { name: "Javobni topshirish" }).click();
  await expect(
    page
      .getByTestId("notification")
      .filter({ hasText: "Javobingiz qabul qilindi." }),
  ).toBeVisible();
});

// Setup mutations use the real authenticated FastAPI, then assertions use rendered UI.
async function backend<T>(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
  key?: string,
): Promise<T> {
  return page.evaluate(
    async ({ method, path, body, key }) => {
      const c = await fetch("/api/v1/auth/csrf", { cache: "no-store" });
      const csrf = await c.json();
      const r = await fetch("/api/v1" + path, {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf.token,
          ...(key ? { "Idempotency-Key": key } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(`${r.status}: ${data.message}`);
      return data;
    },
    { method, path, body, key },
  ) as Promise<T>;
}
async function leave(page: Page) {
  await page.getByRole("button", { name: "Chiqish", exact: true }).click();
  await expect(page).toHaveURL("/login");
}

test("teacher enrollment and attendance reach the new student cabinet", async ({
  page,
}) => {
  test.skip(
    !teacherPassword,
    "Requires disposable seeded development database",
  );
  await login(page, "teacher");
  const stamp = Date.now(),
    date = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10),
    weekday = (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7;
  const courses = await backend<{ items: { id: string }[] }>(
    page,
    "GET",
    "/teacher/courses",
  );
  const username = `+99893${String(stamp).slice(-7)}`,
    personalPassword = "E2E-Personal-Only-Password!";
  await backend(page, "POST", "/auth/register", {
    full_name: `NAMUNA E2E ${stamp}`,
    phone: username,
    password: personalPassword,
  });
  const pending = await backend<{ items: { id: string; phone: string }[] }>(
    page,
    "GET",
    "/teacher/pending-students",
  );
  const student = pending.items.find((item) => item.phone === username)!;
  await backend(
    page,
    "POST",
    `/teacher/pending-students/${student.id}/approve`,
  );
  const group = await backend<{ id: string }>(page, "POST", "/teacher/groups", {
    name: `NAMUNA E2E ${stamp}`,
    course_id: courses.items[0].id,
    start_date: date,
    capacity: 5,
    monthly_price: "600000",
    rules: [{ weekday, local_time: "21:00", duration_minutes: 30 }],
  });
  await backend(page, "POST", `/teacher/groups/${group.id}/memberships`, {
    student_id: student.id,
    start_date: date,
  });
  await backend(page, "POST", `/teacher/groups/${group.id}/generate-lessons`, {
    start_date: date,
    end_date: date,
  });
  const lessons = await backend<{ items: { id: string }[] }>(
    page,
    "GET",
    `/teacher/lessons?group_id=${group.id}`,
  );
  await backend(
    page,
    "PUT",
    `/teacher/lessons/${lessons.items[0].id}/attendance`,
    { items: [{ student_id: student.id, status: "present" }] },
  );
  await leave(page);
  await page.getByLabel("Kirish nomi", { exact: true }).fill(username);
  await page.getByLabel("Parol", { exact: true }).fill(personalPassword);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page).toHaveURL("/student");
  await page.goto("/student/attendance");
  await expect(
    page.getByRole("cell", { name: "Keldi", exact: true }),
  ).toBeVisible();
});

test("issued invoice and partial payment change the real student balance", async ({
  page,
}) => {
  test.skip(
    !teacherPassword || !studentPassword,
    "Requires explicit demo credentials",
  );
  await login(page, "student");
  const me = await backend<{ id: string }>(page, "GET", "/student/profile");
  const before = await backend<{ debt: string }>(
    page,
    "GET",
    "/student/billing",
  );
  await leave(page);
  await login(page, "teacher");
  const today = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10),
    end = new Date(Date.now() + 33 * 86400e3).toISOString().slice(0, 10);
  const invoice = await backend<{ id: string }>(
    page,
    "POST",
    "/teacher/invoices",
    {
      student_id: me.id,
      period_start: today,
      period_end: end,
      due_date: today,
      amount: "600000",
    },
  );
  await backend(page, "POST", `/teacher/invoices/${invoice.id}/adjustments`, {
    amount: "-100000",
    reason: "NAMUNA E2E discount",
  });
  await backend(page, "POST", `/teacher/invoices/${invoice.id}/issue`);
  await backend(
    page,
    "POST",
    "/teacher/payments",
    {
      student_id: me.id,
      amount: "300000",
      received_at: new Date().toISOString(),
      method: "cash",
      allocations: [{ invoice_id: invoice.id, amount: "300000" }],
    },
    `e2e-${Date.now()}`,
  );
  await page.goto(`/teacher/finance?student_id=${me.id}`);
  await expect(
    page.getByRole("heading", { name: "O‘quvchi balansi" }),
  ).toBeVisible();
  await leave(page);
  await login(page, "student");
  const after = await backend<{ debt: string }>(
    page,
    "GET",
    "/student/billing",
  );
  expect(Number(after.debt) - Number(before.debt)).toBe(200000);
  await page.goto("/student/billing");
  await expect(
    page.getByRole("heading", { name: "Hisoblar va balans" }),
  ).toBeVisible();
});

test("teacher publication, student submission and teacher feedback use the same assignment", async ({
  page,
}) => {
  test.skip(
    !teacherPassword || !studentPassword,
    "Requires explicit demo credentials",
  );
  await login(page, "teacher");
  const groups = await backend<{ items: { id: string; name: string }[] }>(
    page,
    "GET",
    "/teacher/groups",
  );
  const group = groups.items.find((g) => g.name.includes("GE"))!;
  const title = `NAMUNA feedback ${Date.now()}`;
  const assignment = await backend<{ id: string }>(
    page,
    "POST",
    "/teacher/assignments",
    {
      group_id: group.id,
      title,
      description: "Write one sentence.",
      deadline: new Date(Date.now() + 86400e3).toISOString(),
      published: true,
    },
  );
  await leave(page);
  await login(page, "student");
  await page.goto("/student/assignments");
  await page
    .getByRole("row")
    .filter({ hasText: title })
    .getByRole("button", { name: "Ko‘rish / topshirish" })
    .click();
  await page.getByLabel("Javobingiz").fill("I am learning English.");
  await page.getByRole("button", { name: "Javobni topshirish" }).click();
  await expect(
    page
      .getByTestId("notification")
      .filter({ hasText: "Javobingiz qabul qilindi." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await leave(page);
  await login(page, "teacher");
  const detail = await backend<{ revisions: { id: string }[] }>(
    page,
    "GET",
    `/teacher/assignments/${assignment.id}`,
  );
  await backend(
    page,
    "POST",
    `/teacher/submission-revisions/${detail.revisions[0].id}/feedback`,
    { feedback: title + " — Good work", score: "9", max_score: "10" },
  );
  await leave(page);
  await login(page, "student");
  await page.goto(`/student/assignments/${assignment.id}`);
  await expect(
    page.getByText(title + " — Good work", { exact: true }),
  ).toBeVisible();
});

test("public result appears after consent and disappears after unpublishing", async ({
  page,
}) => {
  test.skip(
    !teacherPassword,
    "Requires disposable seeded development database",
  );
  await login(page, "teacher");
  const name = `NAMUNA CERT ${Date.now()}`;
  const media = await page.evaluate(async () => {
    const c = await fetch("/api/v1/auth/csrf");
    const csrf = await c.json();
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 300, 400);
    ctx.fillStyle = "#351141";
    ctx.font = "24px sans-serif";
    ctx.fillText("NAMUNA", 70, 200);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png"),
    );
    const response = await fetch(
      "/api/v1/teacher/media/uploads?visibility=public&public_prepared=true&alt=NAMUNA",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-File-Type": "image/png",
          "X-CSRF-Token": csrf.token,
        },
        body: blob,
      },
    );
    if (!response.ok) throw new Error("Sample media upload failed");
    return response.json() as Promise<{ id: string }>;
  });
  const content = await backend<{ id: string }>(
    page,
    "POST",
    "/teacher/content",
    {
      kind: "result",
      title: name,
      data: {
        type: "cefr",
        student_name: name,
        exam_date: "2026-01-01",
        level: "B2",
      },
      media_id: media.id,
      consent: true,
      approved: true,
    },
  );
  await backend(page, "POST", `/teacher/content/${content.id}/publish`);
  await page.goto("/results?type=cefr");
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await backend(page, "POST", `/teacher/content/${content.id}/unpublish`);
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0);
});
