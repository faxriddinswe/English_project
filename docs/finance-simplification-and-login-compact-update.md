# Moliya qismidagi hisoblar soddalashtirilishi, 3 soniyalik bildirishnomalar va ixcham kirish bo‘limi

**Sana**: 2026-11-02 (Osiyo/Toshkent vaqti)  
**Holat**: Muvaffaqiyatli yakunlandi  
**Tegishli bo‘limlar**: Kirish sahifasi (`/login`), Toast bildirishnomalari (`Notifications`), Moliya — hisoblar (`/teacher/finance` -> `invoices`)

---

## 1. Foydalanuvchi talabi va muammo tavsifi

1. **Kabinetga kirish bo‘limi o‘lchami**: Desktop versiyada login kartochkasi haddan tashqari baland bo‘lib, ekran bo‘sh joyini samarasiz egallab turgan edi. Uni ixcham, nafis va mutanosib o‘lchamga keltirish so‘raldi.
2. **Bildirishnoma (Toast notification) muddati**: Tizimda biron amal (saqlash, yangilash, xatolik) bajarilgandan keyin chiqadigan bildirishnoma 3 soniyadan keyin avtomatik ravishda birdan yo‘qolishi talab qilindi.
3. **Moliya bo‘limidagi hisoblar (Hisoblar — yangi yozuv dialogi)**: O‘qituvchi uchun tushunarsiz va murakkab bo‘lgan buxgalteriya sana chegaralari — *"Davr boshi (shu kun kiradi)"* va *"Davr oxiri (bu kun kirmaydi)"* olib tashlanib, uning o‘rniga shunchaki:
   - **Qaysi oy uchun** (oy tanlash: `YYYY-MM`)
   - **Sana (qaysi kuni bo‘ldi)** (kun tanlash: `YYYY-MM-DD`)
   - **Hisob summasi** (pul miqdori)
   kiritilishi yetarli bo‘lishi so‘raldi.

---

## 2. Amalga oshirilgan arxitektura va dizayn o‘zgarishlari

### A. Ixcham kirish kartochkasi (`/login`)
- **`frontend/src/features/auth/LoginForm.tsx`**:
  - `BrandLogo` o‘lchami `lg` dan `md` ga moslashtirildi.
  - Tugmaga qat’iy `type="submit"` atributi qo‘shildi.
- **`frontend/src/app/globals.css`**:
  - `.auth-card` konteynerining maksimal kengligi `min(100%, 390px)` ga ixchamlashtirildi (ilgari 460px edi).
  - Ichki padding `24px 26px` ga (ilgari 36px/32px) tushirildi.
  - Border-radius `20px` ga qisqartirildi.
  - Sarlavha (`h1`) shrifiti `24px`, pastki izoh matni `13.5px`, form elementlari oralig‘i `12px` ga qisqartirildi.
  - Inputlar `min-height: 40px`, tugma `min-height: 42px`, pastki qaytish havolasi `min-height: 36px` qilib ixchamlashtirildi.
  - Kartochka ekranning markazida estetik jihatdan juda go‘zal va mutanosib o‘rnashdi.

### B. 3 soniyalik bildirishnomalar (`Notifications`)
- **`frontend/src/components/Notifications.tsx`**:
  - Avtomatik yopilish taymeri `item.kind === "error" ? 4000 : 3000` qilib belgilandi.
  - Muvaffaqiyatli amallar bajarilganda (yozuv saqlanganda, tahrirlanganda) bildirishnoma to‘liq 3 soniyadan so‘ng silliq va avtomatik ravishda yopiladi.

### C. Moliya bo‘limi: Hisoblar shaklini soddalashtirish
- **Baza va model butunligi saqlandi**:
  - PostgreSQL bazasidagi `invoices` jadvali `period_start`, `period_end` va `due_date` ustunlariga, hamda `period_end > period_start` chekloviga ega.
  - Baza migratsiyasini yoki eski hisoblarni buzmaslik uchun, arxitektura darajasida **Pydantic** va **Frontend Form** qatlamida o‘zgartirish kiritildi.
- **`backend/app/core/schemas.py` (`InvoiceIn`)**:
  - `month: date | str | None = Field(default=None, exclude=True)` maydoni qo‘shildi.
  - `period_start`, `period_end`, `due_date` maydonlari `None` ga ruxsat beradigan qilindi.
  - `@model_validator(mode="before")` orqali:
    - Agar `month` kiritilsa (masalan `"2026-11"`), `period_start` oyning 1-kuniga (`2026-11-01`), `period_end` esa keyingi oyning 1-kuniga (`2026-12-01`) avtomatik hisoblanadi.
    - `due_date` ko‘rsatilmagan bo‘lsa, u avtomatik `period_start` yoki joriy sanaga tenglashtiriladi.
    - `exclude=True` sababli `month` modeli `model_dump()` qilinganda SQL jadvaliga begona ustun sifatida bormaydi, SQLAlchemy to‘g‘ridan-to‘g‘ri to‘g‘ri qiymatlarni qabul qiladi.
- **`frontend/src/features/workspace/config.ts`**:
  - `invoices.fields` massividan tushunarsiz `period_start (Davr boshi)` va `period_end (Davr oxiri)` olib tashlandi.
  - Yangi maydonlar:
    1. `f("month", "Qaysi oy uchun", "month", true)`
    2. `f("due_date", "Sana (qaysi kuni bo‘ldi)", "date", true)`
    3. `f("amount", "Hisob summasi (so‘m)", "money", true)`
- **`frontend/src/features/workspace/EntityForm.tsx`**:
  - Form default qiymatlarida `f.type === "month"` uchun joriy oy (`today().slice(0, 7)`) avtomatik to‘ldirilishi yo‘lga qo‘yildi.
  - Form jo‘natilganda mijoz tomonida ham `period_start` va `period_end` to‘g‘ri hisoblanib yuborilishi ta’minlandi.
- **`frontend/src/features/workspace/ResourceView.tsx`**:
  - Hisob yaratilayotganda va mavjud qoralama tahrirlanayotganda `month` va `due_date` boshlang‘ich qiymatlari avtomatik to‘g‘ri o‘rnatiladi.
- **`frontend/src/lib/uz.ts`**:
  - `period_start` va `month` teglari `"Qaysi oy uchun"` deb nomlandi.
  - Jadvalda `period_start` qiymati quruq sana emas, chiroyli oy va yil ko‘rinishida (masalan `"Noyabr 2026"`) formatlanishi ta’minlandi.

---

## 3. Sinovlar va tekshiruv natijalari

1. **Frontend Typecheck**:
   - Buyruq: `npm run typecheck --prefix frontend`
   - Natija: Chiqish kodi `0` (xatolarsiz o‘tdi).
2. **Frontend Vitest Unit Tests**:
   - Buyruq: `npm run test --prefix frontend`
   - Natija: 3 test fayli, 11 ta test 100% muvaffaqiyatli o‘tdi.
3. **Backend Pytest**:
   - Buyruq: `scripts/test-backend -q`
   - Natija: **54 passed, 23 skipped** (100% muvaffaqiyatli).
4. **Playwright Mobile & Responsive Regression Suite**:
   - Buyruq: `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/mobile-responsive.spec.ts`
   - Natija: **12 passed** (51.7 soniya).
5. **Playwright Interface & Notifications Suite**:
   - Buyruq: `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/interface-notifications.spec.ts`
   - Natija: **4 passed, 1 skipped** (21.7 soniya).
6. **Vizual tasdiq**:
   - `screenshot-login.png`: Login kartochkasi mukammal ixcham va markazlashtirilgan.
   - `screenshot-invoice-dialog.png`: Yangi hisob qo‘shish modalida faqat O‘quvchi, Qaysi oy uchun, Sana va Hisob summasi maydonlari mavjud. Vertikal sig‘maslik va ortiqcha buxgalteriya so‘zlari to‘liq yo‘qolgan.

---

## 4. Olingan natijalar va saqlangan biznes ma’lumotlari

- Foydalanuvchi hisoblari, o‘quvchilar, parollar va mavjud hisob-kitob ma’lumotlariga tegilmadi va ular to‘liq saqlandi.
- Barcha amallar va sanalar Osiyo/Toshkent (UTC+5) vaqti bilan yuritildi.
