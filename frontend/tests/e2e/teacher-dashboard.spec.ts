import { test, expect, type Page } from "@playwright/test";
import type {
  DashboardData,
  FinancePoint,
} from "../../src/features/workspace/dashboard-types";

// All private UI values are controlled fixtures. No owner credentials or DB writes.
function fixtureData(month: string, empty = false): DashboardData {
  const [year, number] = month.split("-").map(Number);
  const count = new Date(year, number, 0).getDate();
  const daily: FinancePoint[] = Array.from({ length: count }, (_, index) => {
    const received = empty
      ? 0
      : Math.round((Math.sin(index * 1.4) + 1.4) * 250000);
    const refunded = !empty && index === 14 ? 170000 : 0;
    return {
      date: `${month}-${String(index + 1).padStart(2, "0")}`,
      received: `${received}.00`,
      refunded: `${refunded}.00`,
      net: `${received - refunded}.00`,
      observed: true,
    };
  });
  const gross = daily.reduce((sum, day) => sum + Number(day.received), 0);
  const monthly: FinancePoint[] = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(year, number - 6 + i, 1);
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`,
      received:
        i === 5 ? `${gross}.00` : empty ? "0.00" : `${(i + 4) * 850000}.00`,
      refunded: "0.00",
      net:
        i === 5
          ? `${gross - (empty ? 0 : 170000)}.00`
          : empty
            ? "0.00"
            : `${(i + 4) * 850000}.00`,
      registrations: empty ? 0 : [5, 12, 8, 18, 24, 17][i],
    };
  });
  return {
    month: `${month}-01`,
    timezone: "Asia/Tashkent",
    student_count: empty ? 0 : 84,
    group_count: empty ? 0 : 6,
    today_lessons: empty ? 0 : 4,
    pending_students: empty ? 0 : 7,
    received: `${gross}.00`,
    refunded: empty ? "0.00" : "170000.00",
    net_receipts: `${gross - (empty ? 0 : 170000)}.00`,
    overdue: empty ? "0.00" : "750000.00",
    new_leads: empty ? 0 : 5,
    attendance_percent: empty ? null : 88,
    marked_attendance: empty ? 0 : 100,
    unmarked_attendance: empty ? 0 : 3,
    telegram_configured: true,
    absence_threshold: 2,
    consecutive_absences: [],
    attention: [
      {
        label: "Yangi o‘quvchilar arizalari",
        href: "/teacher/pending-students",
      },
      {
        label: "Muddati o‘tgan hisoblar",
        href: "/teacher/finance?overdue=true",
      },
    ],
    analytics: {
      generated_at: "2026-11-03T10:00:00+05:00",
      daily_finance: daily,
      monthly,
      student_total: empty ? 0 : 100,
      student_groups: [
        { kind: "assigned", count: empty ? 0 : 84 },
        { kind: "unassigned", count: empty ? 0 : 16 },
      ],
      groups: empty
        ? []
        : Array.from({ length: 6 }, (_, i) => ({
            id: `fixture-${i}`,
            name: [
              "IELTS ertalab",
              "Grammatika",
              "SEFR tayyorlov",
              "General English",
              "IELTS Foundation",
              "IELTS kechki",
            ][i],
            course_name: "NAMUNA kurs",
            capacity: 20,
            students: [18, 16, 15, 14, 12, 9][i],
          })),
      group_totals: {
        groups: empty ? 0 : 6,
        capacity: empty ? 0 : 120,
        occupied: empty ? 0 : 84,
      },
      attendance: [
        { status: "present", count: empty ? 0 : 80 },
        { status: "late", count: empty ? 0 : 8 },
        { status: "absent", count: empty ? 0 : 9 },
        { status: "excused", count: empty ? 0 : 3 },
      ],
      payment_methods: [
        { method: "cash", amount: `${Math.floor(gross * 0.6)}.00` },
        {
          method: "bank_transfer",
          amount: `${gross - Math.floor(gross * 0.6)}.00`,
        },
        { method: "other", amount: "0.00" },
      ],
      lead_status: empty
        ? []
        : [
            { status: "new", count: 5 },
            { status: "contacted", count: 8 },
            { status: "converted", count: 20 },
            { status: "closed", count: 2 },
          ],
    },
  };
}

async function mount(page: Page, options: { empty?: boolean } = {}) {
  const state = {
    active: options.empty ? 0 : 84,
    failed: false,
    calls: 0,
    months: [] as string[],
  };
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "fixture-teacher",
          role: "teacher",
          username: "NAMUNA ustoz",
          must_change_password: false,
        },
      });
    if (url.pathname.endsWith("/teacher/dashboard")) {
      state.calls++;
      if (state.failed)
        return route.fulfill({
          status: 503,
          json: {
            code: "database_unavailable",
            message: "Baza vaqtincha mavjud emas. Qayta urinib ko‘ring",
          },
        });
      const month = (url.searchParams.get("month") ?? "2026-11-01").slice(0, 7);
      state.months.push(month);
      const data = fixtureData(month, options.empty);
      data.student_count = state.active;
      data.analytics!.student_groups[0].count = state.active;
      data.analytics!.student_total = data.analytics!.student_groups.reduce(
        (sum, slice) => sum + slice.count,
        0,
      );
      return route.fulfill({ json: data });
    }
    // Every unexpected mutation fails instead of reaching the owner's API.
    if (route.request().method() !== "GET") return route.abort();
    return route.fulfill({
      json: { items: [], total: 0, page: 1, page_size: 20 },
    });
  });
  await page.goto("/teacher");
  await expect(page.getByTestId("dashboard-students")).toHaveText(
    String(state.active),
  );
  return state;
}

test("dashboard charts have interactive details and month filters", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  const state = await mount(page);
  for (const heading of [
    "Pul oqimi",
    "Guruhlarga biriktirish",
    "Guruhlar bandligi",
    "Ro‘yxatdan o‘tishlar",
    "Davomat ko‘rinishi",
    "To‘lov usullari",
  ])
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  const graph = page.getByRole("img", {
    name: "Tushum va qaytarishlar chiziqli grafigi",
  });
  await graph.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "6 oylik", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "6 oylik", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Kunlik", exact: true }).click();
  await page.getByText("Grafik ma’lumotlarini jadvalda ko‘rish").click();
  await expect(page.locator("table").first()).toBeVisible();
  await page.getByText("Grafik ma’lumotlarini jadvalda ko‘rish").click();
  await page.getByLabel("Hisobot oyi", { exact: true }).fill("2026-10");
  await expect.poll(() => state.months.at(-1)).toBe("2026-10");
  await expect(
    page
      .getByRole("region", { name: "Pul oqimi", exact: true })
      .getByText("Okt 2026 · so‘mda"),
  ).toBeVisible();
  await page.getByRole("heading", { name: "Boshqaruv", exact: true }).click();
  await page.screenshot({
    path: "../docs/qa/dashboard-fixture-1600-light.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("dashboard updates without a reload and signals failed refreshes", async ({
  page,
}) => {
  const state = await mount(page);
  state.active = 91;
  await expect(page.getByTestId("dashboard-students")).toHaveText("91", {
    timeout: 10000,
  });
  state.active = 95;
  await page.evaluate(() => {
    const channel = new BroadcastChannel("sherzod-workspace-updates");
    channel.postMessage("changed");
    channel.close();
  });
  await expect(page.getByTestId("dashboard-students")).toHaveText("95", {
    timeout: 3000,
  });
  state.failed = true;
  await page
    .getByRole("button", { name: "Ma’lumotlarni yangilash", exact: true })
    .click();
  await expect(
    page.getByText("Yangilanish vaqtincha to‘xtadi", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("dashboard-students")).toHaveText("95");
  state.failed = false;
  await page
    .getByRole("button", { name: "Qayta urinish", exact: true })
    .click();
  await expect(
    page.getByText("Jonli yangilanish", { exact: true }),
  ).toBeVisible();
});

test("charts fit phones and tablets in both themes", async ({ page }) => {
  await mount(page);
  for (const [width, height] of [
    [320, 812],
    [375, 812],
    [768, 1024],
    [1024, 768],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.locator("body *").evaluateAll((elements) =>
      elements
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && (box.right > innerWidth + 1 || box.left < -1);
        })
        .slice(0, 15)
        .map((element) => ({
          tag: element.tagName,
          class: element.getAttribute("class"),
          right: Math.round(element.getBoundingClientRect().right),
          left: Math.round(element.getBoundingClientRect().left),
        })),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `width ${width}: ${JSON.stringify(overflow)}`,
    ).toBe(true);
    expect(
      await page
        .locator("svg")
        .evaluateAll((svgs) =>
          svgs.some((svg) => /NaN|Infinity/.test(svg.innerHTML)),
        ),
    ).toBe(false);
    if (width === 375) {
      const lineGraph = page.getByRole("img", {
        name: "Tushum va qaytarishlar chiziqli grafigi",
      });
      await expect
        .poll(() =>
          lineGraph.evaluate((svg) =>
            Number(svg.getAttribute("viewBox")!.split(" ")[2]),
          ),
        )
        .toBeLessThan(400);
      expect(
        await page
          .getByRole("region", { name: "Guruhlarga biriktirish", exact: true })
          .getByRole("button")
          .first()
          .evaluate((element) => getComputedStyle(element).color),
      ).toBe("rgb(255, 255, 255)");
      await page
        .getByRole("region", { name: "Guruhlarga biriktirish", exact: true })
        .screenshot({
          path: "../docs/qa/dashboard-donut-fixture-375-dark.png",
        });
      await page.screenshot({
        path: "../docs/qa/dashboard-fixture-375-dark.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
      await page.screenshot({
        path: "../docs/qa/dashboard-fixture-375-light.png",
        fullPage: true,
      });
    }
  }
});

test("an empty dashboard has honest zero and empty states", async ({
  page,
}) => {
  await mount(page, { empty: true });
  await expect(
    page.getByText("Bu oyda to‘lov qayd etilmagan", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Hozircha guruh yo‘q", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("dashboard-net")).toHaveText("0 so‘m");
  expect(
    await page
      .locator("svg")
      .evaluateAll((svgs) =>
        svgs.some((svg) => /NaN|Infinity/.test(svg.innerHTML)),
      ),
  ).toBe(false);
});

test("workspace theme control uses compact sun and moon icons", async ({
  page,
}) => {
  await mount(page);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const control = page.getByRole("button", { name: /Yorug.*rejim/ });
    await expect(control.locator("svg.lucide-sun")).toBeVisible();
    expect(
      await control.evaluate((el) => el.getBoundingClientRect().width),
    ).toBe(36);
    expect(
      await control
        .locator("svg")
        .evaluate((el) => el.getBoundingClientRect().width),
    ).toBe(16);
    await control.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const moon = page.getByRole("button", { name: /Qorong.*rejim/ });
    await expect(moon.locator("svg.lucide-moon")).toBeVisible();
    await moon.click();
  }
  await page
    .locator(".workspace-topbar")
    .screenshot({ path: "../docs/qa/theme-workspace-1440.png" });
});

test("public theme control stays compact and preserves the selected theme", async ({
  page,
}) => {
  await page.goto("/");
  const sun = page.getByRole("button", { name: /Yorug.*rejim/ });
  await expect(sun.locator("svg.lucide-sun")).toBeVisible();
  expect(await sun.evaluate((el) => el.getBoundingClientRect().width)).toBe(36);
  expect(
    await sun.locator("svg").evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(16);
  await sun.click();
  await page.reload();
  await expect(
    page
      .getByRole("button", { name: /Qorong.*rejim/ })
      .locator("svg.lucide-moon"),
  ).toBeVisible();
  await page
    .locator("header")
    .screenshot({ path: "../docs/qa/theme-public-light-1280.png" });
});

test("student and group lists and course/group forms have no activity controls", async ({
  page,
}) => {
  await mount(page);
  for (const resource of ["students", "groups"]) {
    await page.goto(`/teacher/${resource}`);
    await expect(page.getByLabel("Holat filtri", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("columnheader", { name: "Holati", exact: true }),
    ).toHaveCount(0);
  }
  for (const resource of ["groups", "courses"]) {
    await page.goto(`/teacher/${resource}`);
    await page
      .getByRole("button", { name: "+ Yangi qo‘shish", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator('[name="status"], [name="active"]'),
    ).toHaveCount(0);
    await expect(dialog.getByText("Faol", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
  }
});
