import { test, expect, type Page } from "@playwright/test";
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
async function ready(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Yorug.*rejim/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
}
async function offer(page: Page, fail = false) {
  await page.evaluate((fail) => {
    const state = window as unknown as {
      calls: number;
      finish: (v: object) => void;
    };
    state.calls = 0;
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        state.calls++;
        if (fail) throw new Error("test unavailable");
      },
      userChoice: new Promise((resolve) => {
        state.finish = resolve;
      }),
    });
    window.dispatchEvent(event);
  }, fail);
}
const sizes = [
  [320, 568],
  [360, 740],
  [375, 812],
  [390, 844],
  [412, 915],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
  [844, 390],
];
test("mobile public photos controls menu and forms fit ten viewports", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const hero = page.getByRole("region", {
      name: "Asosiy taklif",
      exact: true,
    });
    const image = hero.getByAltText("Sherzod ustoz", { exact: true });
    await expect
      .poll(() =>
        image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await fits(page);
    if (width <= 900) {
      const photo = await image.locator("..").boundingBox(),
        caption = await hero
          .getByText("Sherzod Allamurodov", { exact: true })
          .boundingBox();
      expect(caption!.y).toBeGreaterThanOrEqual(photo!.y + photo!.height - 1);
      expect(caption!.x).toBeGreaterThanOrEqual(12);
      expect(caption!.x + caption!.width).toBeLessThanOrEqual(width - 12);
    }
    await page.screenshot({
      path: `../docs/qa/mobile-home-${width}x${height}.png`,
      fullPage: true,
    });
    if (width <= 1320) {
      const toggle = page.getByRole("button", {
        name: "Menyuni ochish",
        exact: true,
      });
      await toggle.click();
      const menu = page.getByRole("dialog", { name: "Mobil menyu" });
      await menu
        .getByRole("link", { name: "Kabinetga kirish" })
        .scrollIntoViewIfNeeded();
      await expect(
        menu.getByRole("button", { name: /Menyuni yopish/ }),
      ).toBeInViewport();
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(toggle).toBeFocused();
    }
    await hero.getByRole("button", { name: "Kursga yozilish" }).click();
    const dialog = page.getByRole("dialog", { name: "Kursga ariza" });
    await dialog.getByLabel("Telefon raqamingiz").fill("+99890");
    await fits(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});
test("nine public routes fit phones tablets and short landscape screens", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [768, 1024],
    [1024, 768],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    for (const path of [
      "/about",
      "/courses",
      "/results",
      "/faq",
      "/contact",
      "/privacy",
      "/login",
      "/change-password",
      "/offline",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await fits(page);
      const clipped = await page
        .locator(
          "main input:not([type=checkbox]),main select,main textarea,main .button",
        )
        .evaluateAll((els) =>
          els
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
            })
            .map((el) => el.outerHTML.slice(0, 140)),
        );
      expect(clipped, `${path} at ${width}`).toEqual([]);
      if (["/about", "/contact"].includes(path))
        await page.screenshot({
          path: `../docs/qa/mobile-${path.slice(1)}-${width}x${height}.png`,
          fullPage: true,
        });
    }
  }
});
test("narrow-screen result filters certificate zoom and FAQ work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/results");
  for (const [name, type] of [
    ["IELTS", "ielts"],
    ["SEFR", "cefr"],
  ]) {
    await page
      .locator("#results")
      .getByRole("link", { name, exact: true })
      .click();
    const published = await (
      await page.request.get(`/api/v1/public/results?page_size=60&type=${type}`)
    ).json();
    await expect(page.locator(`[data-result-type="${type}"]`)).toHaveCount(
      published.items.length,
    );
  }
  await page
    .getByRole("button", { name: /sertifikatni ko‘rish/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Kattalashtirish", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Kichraytirish", exact: true }),
  ).toBeVisible();
  await fits(page);
  await dialog.getByRole("button", { name: "Yopish", exact: true }).click();
  await page.goto("/faq");
  const item = page.locator(".faq-item").first();
  const question = item.locator("summary");
  await question.click();
  await expect(item).toHaveAttribute("open", "");
  await question.click();
  await expect(item).not.toHaveAttribute("open", "");
});
test("install notice reserves space and yields to menu dialog and footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await ready(page);
  await offer(page);
  const notice = page.getByRole("complementary", { name: "Ilovani o‘rnatish" });
  await expect(notice).toBeVisible();
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [768, 1024],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const r = await notice.boundingBox();
    expect(r!.x).toBeGreaterThanOrEqual(11);
    expect(r!.x + r!.width).toBeLessThanOrEqual(width - 11);
    expect(r!.y + r!.height).toBeLessThanOrEqual(height - 11);
    for (const button of await notice.getByRole("button").all()) {
      const b = await button.boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(44);
      expect(b!.height).toBeGreaterThanOrEqual(44);
    }
    await expect
      .poll(() =>
        page.evaluate(() =>
          parseFloat(getComputedStyle(document.body).paddingBottom),
        ),
      )
      .toBeGreaterThan(r!.height);
    await fits(page);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "../docs/qa/mobile-install-375.png" });
  await page
    .getByRole("button", { name: "Menyuni ochish", exact: true })
    .click();
  await expect(notice).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(notice).toBeVisible();
  await page
    .getByRole("region", { name: "Asosiy taklif", exact: true })
    .getByRole("button", { name: "Kursga yozilish" })
    .click();
  await expect(notice).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(notice).toBeVisible();
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    }),
  );
  const footer = await page.locator("footer").boundingBox(),
    card = await notice.boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(card!.y);
  await notice.getByRole("button", { name: "Bildirishnomani yopish" }).click();
  await expect(notice).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.body).paddingBottom),
    )
    .toBe("0px");
  await page.reload();
  await offer(page);
  await expect(notice).toHaveCount(0);
});
test("native install action is single-use with pending and persisted dismissal", async ({
  page,
}) => {
  await ready(page);
  await offer(page);
  const notice = page.getByRole("complementary", { name: "Ilovani o‘rnatish" });
  await notice.getByRole("button", { name: "O‘rnatish", exact: true }).click();
  await expect(
    notice.getByRole("button", { name: "Kutilmoqda…" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => (window as unknown as { calls: number }).calls),
  ).toBe(1);
  await page.evaluate(() =>
    (window as unknown as { finish: (v: object) => void }).finish({
      outcome: "dismissed",
    }),
  );
  await expect(notice).toHaveCount(0);
  await page.reload();
  await offer(page);
  await expect(notice).toHaveCount(0);
});
test("install errors are explicit and contact/private routes suppress offers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  await offer(page, true);
  const notice = page.getByRole("complementary", { name: "Ilovani o‘rnatish" });
  await notice.getByRole("button", { name: "O‘rnatish", exact: true }).click();
  await expect(notice.getByRole("alert")).toContainText("Brauzer menyusidan");
  await notice.getByRole("button", { name: "Bildirishnomani yopish" }).click();
  await page.evaluate(() =>
    localStorage.removeItem("se-install-dismissed-until"),
  );
  await page.reload();
  await offer(page);
  await expect(notice).toBeVisible();
  await page
    .getByRole("button", { name: "Menyuni ochish", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Mobil menyu" })
    .getByRole("link", { name: "Bog‘lanish", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(notice).toHaveCount(0);
  await page.getByLabel("Ism va familiya").fill("Mobil QA");
  await expect(notice).toHaveCount(0);
  for (const path of ["/login", "/change-password", "/teacher", "/student"]) {
    await page.goto(path);
    await offer(page);
    await expect(notice).toHaveCount(0);
  }
});
test("installed app stops advertising installation", async ({ page }) => {
  await ready(page);
  await offer(page);
  const notice = page.getByRole("complementary", { name: "Ilovani o‘rnatish" });
  await expect(notice).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(notice).toHaveCount(0);
  await offer(page);
  await expect(notice).toHaveCount(0);
});
// Private UI fixtures test layout only; no live accounts/records are changed.
async function workspaceFixture(page: Page, role: "teacher" | "student") {
  const row = {
    id: "layout-fixture",
    full_name: "NAMUNA Mobil ko‘rinishni tekshiruvchi uzun ism familiya",
    phone: "+998901234567",
    status: "active",
    joined_on: "2026-11-01",
    name: "Grammatika",
    monthly_price: "600000.00",
    level: "A2",
    capacity: 12,
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [row], total: 1, page: 1, page_size: 20 };
    if (path.endsWith("/auth/me"))
      data = {
        id: "fixture-user",
        username: `NAMUNA-${role}-uzun-login-nomi`,
        role,
        must_change_password: false,
      };
    else if (path.endsWith("/teacher/dashboard"))
      data = {
        student_count: 5000,
        group_count: 12,
        today_lessons: 4,
        received: "1234567890.00",
        refunded: "100000.00",
        net_receipts: "1234467890.00",
        overdue: "200000.00",
        new_leads: 3,
        attendance_percent: 88,
        unmarked_attendance: 2,
        absence_threshold: 2,
        telegram_configured: true,
        attention: [],
        consecutive_absences: [],
      };
    else if (path.endsWith("/student/dashboard"))
      data = {
        student: row,
        billing: {
          debt: "200000.00",
          overdue: "100000.00",
          unallocated_credit: "10000.00",
        },
        next_lesson: null,
        next_assignment: null,
        feedback: null,
      };
    else if (path.endsWith("/student/profile")) data = row;
    if (route.request().method() !== "GET") return route.abort();
    await route.fulfill({ json: data });
  });
}
for (const role of ["teacher", "student"] as const) {
  test(`${role} workspace navigation forms and controls adapt (layout fixtures)`, async ({
    page,
  }) => {
    await workspaceFixture(page, role);
    for (const [width, height] of [
      [320, 568],
      [375, 812],
      [768, 1024],
      [844, 390],
      [1024, 768],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(`/${role}`);
      await expect(page.locator(".metric-card").first()).toBeVisible();
      await fits(page);
      if (width <= 900) {
        const toggle = page.getByRole("button", {
          name: "☰ Menyu",
          exact: true,
        });
        await toggle.click();
        const menu = page.getByRole("dialog", {
          name: "Kabinet menyusi",
          exact: true,
        });
        await menu
          .getByRole("link", {
            name: role === "teacher" ? "O‘quvchilar" : "Profil",
            exact: true,
          })
          .click();
        await expect(menu).toHaveCount(0);
        await fits(page);
        if (role === "student") {
          await expect(
            page.getByRole("heading", { name: "Mening profilim" }),
          ).toBeVisible();
        }
        if (role === "teacher") {
          // Self-registration replaced manual student creation on 2026-11-03.
          await expect(
            page.getByRole("button", { name: "+ Yangi qo‘shish", exact: true }),
          ).toHaveCount(0);
          await expect(
            page.getByRole("link", { name: "Yangi arizalarni ko‘rish →" }),
          ).toBeVisible();
          const table = page.locator(".table-scroll");
          await table.evaluate((el) => {
            el.scrollLeft = el.scrollWidth;
          });
          await table
            .getByRole("button", { name: "Ochish", exact: true })
            .scrollIntoViewIfNeeded();
          await expect(
            table.getByRole("button", { name: "Ochish", exact: true }),
          ).toBeInViewport();
          const actionBox = await table
            .getByRole("button", { name: "Ochish", exact: true })
            .boundingBox();
          expect(actionBox!.width).toBeGreaterThan(70);
          expect(actionBox!.height).toBeLessThan(60);
          if (width === 320) {
            await expect(
              page.getByText("Jadvalni yon tomonga suring ↔"),
            ).toBeVisible();
            await expect(table).toHaveAttribute("tabindex", "0");
          }
        }
        await toggle.click();
        await page.keyboard.press("Escape");
        await expect(toggle).toBeFocused();
      }
      await page.screenshot({
        path: `../docs/qa/mobile-${role}-${width}x${height}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/${role}`);
    await page.getByRole("button", { name: "☰ Menyu", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("dialog", { name: "Kabinet menyusi", exact: true }),
    ).toHaveCount(0);
  });
}
test("teacher schedule form remains operable at 320px (layout fixture)", async ({
  page,
}) => {
  await workspaceFixture(page, "teacher");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/teacher/groups");
  await page
    .getByRole("button", { name: "+ Yangi qo‘shish", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "+ Dars kuni", exact: true })
    .click();
  await dialog.getByLabel("Dars vaqti (Toshkent)").fill("18:30");
  await fits(page);
  expect(
    await dialog.locator("input,select,button").evaluateAll(
      (els) =>
        els.filter((el) => {
          const b = el.getBoundingClientRect();
          return b.width > 0 && (b.left < 0 || b.right > innerWidth);
        }).length,
    ),
  ).toBe(0);
  await dialog
    .getByRole("button", { name: "Jadval qatorini o‘chirish" })
    .click();
  await expect(dialog.getByLabel("Hafta kuni")).toHaveCount(0);
});

test("waiting update has compact controls and only reloads on explicit action (worker UI fixture)", async ({
  page,
}) => {
  // Localhost deliberately unregisters service workers. Exercise the production
  // branch on an intercepted HTTPS test origin; all content comes from local HTTP.
  await page.route("https://sherzod-pwa.test/**", async (route) => {
    const source = new URL(route.request().url());
    source.protocol = "http:";
    source.host = "127.0.0.1:3000";
    const response = await route.fetch({ url: source.href });
    await route.fulfill({ response });
  });
  await page.addInitScript(() => {
    const state = window as unknown as { updateCalls: number };
    state.updateCalls = 0;
    Object.defineProperty(navigator.serviceWorker, "register", {
      value: async () => ({
        waiting: {
          postMessage: () => {
            state.updateCalls++;
          },
        },
        installing: null,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("https://sherzod-pwa.test/");
  const notice = page.getByRole("complementary", {
    name: "Ilova yangilanishi",
  });
  await expect(notice).toBeVisible();
  await fits(page);
  expect(
    await page.evaluate(
      () => (window as unknown as { updateCalls: number }).updateCalls,
    ),
  ).toBe(0);
  await notice.getByRole("button", { name: "Yangilash", exact: true }).click();
  await expect(
    notice.getByRole("button", { name: "Kutilmoqda…" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => (window as unknown as { updateCalls: number }).updateCalls,
    ),
  ).toBe(1);
});

test.describe("mobile touch browser", () => {
  test.use({
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    viewport: { width: 390, height: 844 },
  });
  test("touch menu course selection and network-error form retain usable controls", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Menyuni ochish", exact: true })
      .tap();
    await page
      .getByRole("dialog", { name: "Mobil menyu" })
      .getByRole("link", { name: "Kurslar", exact: true })
      .tap();
    await expect(page).toHaveURL(/\/courses$/);
    await page
      .getByRole("button", { name: "Kursga yozilish", exact: true })
      .first()
      .tap();
    const dialog = page.getByRole("dialog", { name: "Kursga ariza" });
    await dialog.getByLabel("Ism va familiya").fill("NAMUNA Mobil QA");
    await dialog.getByLabel("Telefon raqamingiz").fill("+998901111111");
    await dialog.getByRole("checkbox").check();
    await page.route("**/api/v1/public/leads", (route) => route.abort());
    await dialog.getByRole("button", { name: "Arizani yuborish" }).tap();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog.getByLabel("Ism va familiya")).toHaveValue(
      "NAMUNA Mobil QA",
    );
    await expect(
      dialog.getByText("Arizangiz qabul qilindi.", { exact: true }),
    ).toHaveCount(0);
    await fits(page);
    await dialog.getByRole("button", { name: "Yopish", exact: true }).tap();
    await expect(dialog).toHaveCount(0);
  });
});
