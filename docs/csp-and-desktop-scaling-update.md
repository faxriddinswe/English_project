# CSP tuzatishi va desktop o‘lchamlari/tugmalar takomillashtirilishi — 2026-11-02

## Talab

1. Brauzer konsolida chiqqan rivojlantirish (development) xatosini bartaraf etish:
   `eval() is not supported in this environment. If this page was served with a Content-Security-Policy header, make sure that unsafe-eval is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment. React will never use eval() in production mode.`
2. Fullstack arxitektor va senior dizayner sifatida:
   - Sayt dizaynlarini, tugmalarini va responsivligini to‘g‘rilash;
   - Desktop versiyasidagi barcha elementlarning o‘lchamlarini haddan tashqari emas, sezilarli va uyg‘un tarzda ozgina kichiklashtirish (proportsional, nafis va professional ko‘rinishga keltirish).

---

## Amalga oshirilgan o‘zgarishlar

### 1. Dev-rejim CSP xatosi yechimi (`frontend/next.config.ts`)

- Next.js Turbopack Fast Refresh va React development callstack vositalari `script-src`da `'unsafe-eval'`ni hamda `connect-src`da `ws:` va `wss:` websocket ulanishlarini talab qiladi.
- `next.config.ts`dagi qat’iy statik CSP dinamik `isDev` mantiqiga o‘tkazildi:
  - **Rivojlantirish rejimida (`NODE_ENV !== "production"`):** `script-src`ga `'unsafe-eval'` va `connect-src`ga `ws: wss:` ruxsat etiladi, konsol xatosi to‘liq yo‘qoladi.
  - **Production rejimida:** xavfsizlik talablariga muvofiq qat’iy CSP (`'unsafe-eval'`siz) to‘liq saqlanadi.
  - Tekshiruv: `curl -sI http://127.0.0.1:3000/` orqali headerlar tasdiqlandi.

### 2. Desktop elementlarini ozgina kichiklashtirish va proportsional jilo (`frontend/src/app/globals.css` va modullar)

- **Konteyner kengligi:** `--container-max` 1640px dan **1360px** ga tushirildi (ekran chetlariga yoyilib ketmasdan zamonaviy, nafis ixchamlik beradi).
- **Bo‘limlar oralig‘i (section vertical padding):** `--section-py` `clamp(48px, 8vw, 120px)` dan **`clamp(38px, 5vw, 76px)`** ga qisqartirildi.
- **Tipografiya proportsiyalari (15–20% ixchamlashtirildi):**
  - `--font-hero`: `clamp(36px, 5.5vw, 72px)` → `clamp(32px, 4.2vw, 56px)`
  - `--font-section`: `clamp(28px, 4vw, 52px)` → `clamp(25px, 3.2vw, 42px)`
  - `--font-card-title`: `clamp(20px, 2.4vw, 30px)` → `clamp(19px, 2vw, 25px)`
  - `--font-body-lg`: `clamp(16px, 1.8vw, 20px)` → `clamp(15px, 1.4vw, 17.5px)`
  - `--font-body`: `clamp(15px, 1.5vw, 18px)` → `clamp(14px, 1.2vw, 15.5px)`
- **Tugmalar (Buttons) va sensor nazorati:**
  - Standart tugmalar: `padding: 11px 22px; font-size: 14.5px; min-height: 42px; border-radius: 12px;`
  - Kichik tugmalar (`.button.small`): `min-width: 74px; min-height: 36px; padding: 8px 16px; font-size: 13px; border-radius: 10px;` (jadval ochish va test talablari bilan mos).
  - Hover effekti: nafis -1.5px translateY ko‘tarilishi va yumshoq soya (`box-shadow: 0 4px 14px rgba(115, 68, 140, 0.28)`).
- **Forma maydonlari (Inputs):** `padding: 10px 14px; min-height: 42px; font-size: 14.5px; border-radius: 12px;`.
- **Modallar va panellar:**
  - `.dialog-content`: kenglik 780px dan **680px** ga, ichki bo‘shliq 36px dan **28px 32px** ga ixchamlashtirildi.
  - `.panel`: ichki padding **22px 24px** (oldingi 32px o‘rniga).
  - `.faq-item`: ichki padding **22px 26px**.
- **Kabinet interfeysi (Workspace):**
  - Topbar balandligi: 72px dan **64px** ga, padding **12px 28px**.
  - Asosiy kontent: max-width **1400px**, padding **24px 28px**.
  - Sidebar: kenglik 250px dan **230px** ga moslashtirildi.
- **Maxsus bo‘limlar:**
  - `HeroSection`: padding `120px 0 54px`, sarlavha `clamp(34px, 3.6vw, 54px)`, portret radiusi va foni proporsional kichraytirildi.
  - `SiteHeader`: scrolled holat balandligi **62px** (oldingi 84px o‘rniga), havolalar 14.5px.
  - `CoursesSection`: kartalar paddingi **24px**, narx 28px, kurs arizasi tugmasi 44px min-height.
  - `ResultsSection`: filtr tugmalari **40px**, sertifikat kartalari 18px border-radius, grid oralig‘i **18px**.
  - `StatsSection`: raqamlar `clamp(30px, 3vw, 48px)`, bo‘lim balandligi **46px**.
  - `TeacherAboutSection`: profil kartasi 980px, video va fakt kartalari ixchamlashtirildi.
  - `HomePreviews`: bo‘limlar oralig‘i **38px**, kartalar ixchamlandi.

### 3. Dialog va Workspace fokus tiklash mustahkamlanishi

- Radix UI Dialog yopilganda va sahifalar o‘rtasida o‘tilganda (route transitions) fokus toggle tugmasiga ishonchli qaytishi ta’minlandi (`Dialog.tsx` va `Workspace.tsx`).

---

## Tekshiruv dalillari

1. **Frontend typecheck:**
   `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
2. **Frontend unit testlar:**
   `npm run test --prefix frontend` — **11 passed** (100%).
3. **Backend testlar:**
   `scripts/test-backend -q` — **54 passed, 23 skipped** (100%).
4. **Mobil responsiv va PWA Playwright E2E:**
   `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/mobile-responsive.spec.ts` — **12 passed** (49.3s).
5. **Qolgan barcha Playwright E2E testlar:**
   `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/compact-lead.spec.ts tests/e2e/inline-contact.spec.ts tests/e2e/navigation-responsive.spec.ts tests/e2e/public-grid.spec.ts tests/e2e/teacher-profile.spec.ts` — **14 passed** (44.2s).
   - Jami Playwright testlari: **26 ta o‘tdi**.
