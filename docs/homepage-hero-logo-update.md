# Bosh sahifadagi ustoz logotipi (portreti) yangilanishi — 2026-11-02

## Talab

Foydalanuvchi murojaati: "bosh sahifadagi logo ga mana shu rasmni qoy" va sinfxonada yashil doska oldida oq ko‘ylakda qo‘llarini oldiga qo‘yib turgan Sherzod ustozning haqiqiy fotosurati taqdim etildi.

Loyiha tarixida (xususan `docs/project-journal.md` 6-bo‘limida) bosh sahifa Hero qismidagi oltin/sariq nishonli dumaloq ustoz ramkasi dastlab `Screenshots/ustoz_logo.png` fayli sifatida kiritilgan bo‘lib, u foydalanuvchi tomonidan "bosh sahifadagi ustoz logosi" deb yuritiladi. Yuqori menyudagi BrandLogo esa barcha sahifalarda umumiy vektorli "SE" monogrammasi hisoblanadi.

## Bajarilgan ishlar

1. **Fotosuratni markazlashtirib qirqish va tayyorlash**:
   - Taqdim etilgan fotosuratdan (`sherzod-lesson.png`) Sherzod ustozning qaddi-qomati, yuzi, oq ko‘ylagi va oldida bog‘langan qo‘llari markazga olingan holda $560 \times 560$ piksel o‘lchamli kvadrat portret tayyorlandi.
   - Fotosurat burchaklaridagi o‘quvchilar siluetlari to‘liq kesib tashlandi va orqadagi akademik yashil doska chiroyli fon sifatida saqlab qolindi.
   - Yangi fayl `frontend/public/teacher/sherzod-hero.png` sifatida joylashtirildi.

2. **Hero sektsiyasining CSS moslashuvi (`HeroSection.module.css`)**:
   - Oldingi `Screenshots/ustoz_logo.png` uchun sozlangan tajovuzkor `transform: scale(1.24)` va `object-position: 50% 38%` qoidalari o‘rniga yangi mutanosib qoidalar joriy etildi:
     ```css
     .photoFrame .portraitImage {
       display: block;
       object-fit: cover;
       object-position: 50% 22%;
       transform: scale(1.06);
       transform-origin: 50% 22%;
     }
     ```
   - Natijada dumaloq sariq hoshiya (`.yellowCircle`) ichida Sherzod ustozning yuzi markazda, qiyofasi aniq va pastdagi nishon ("Sherzod Allamurodov · Ingliz tili o‘qituvchisi") bilan uyg‘un holatda ko‘rinishi ta’minlandi.

3. **Frontend ishonchli fallback (`PublicSite.tsx`)**:
   - `PublicSite.tsx` da Hero sektsiyasiga beriladigan portret parametri mustahkamlandi:
     ```tsx
     portraitUrl={
       hero?.media_url ??
       bio?.media_url ??
       "/teacher/sherzod-hero.png"
     }
     ```
   - Bu orqali backenddan keladigan dinamik CMS media bo‘lsa u ustuvor yuklanadi, tarmoq yoki server uzilishida esa har doim yangi sinfxona fotosurati ishonchli ko‘rsatiladi.

4. **Backend va PostgreSQL MediaAsset sinxronizatsiyasi**:
   - Backend disk xotirasidagi `.local/media/public/a7efbc48-369e-455f-835e-db79572a32c9.webp` fayli yangi portretning WebP formatidagi varianti bilan yangilandi (asli `.bak` sifatida zaxirada saqlab qolindi).
   - PostgreSQL ma’lumotlar bazasidagi `MediaAsset` yozuvi (`id = e7dbf3e6-7577-4e47-b919-026d8f822659`) fayl hajmi va `alt = 'Sherzod Allamurodov — sinfdagi portret'` bilan sinxron yangilandi.
   - Natijada `/api/v1/media/e7dbf3e6-7577-4e47-b919-026d8f822659` hamda public API orqali keluvchi barcha ma’lumotlar ayni yangi rasmga moslashtirildi.

## O‘tkazilgan tekshiruvlar

- **TypeScript Typecheck**: `npm run typecheck --prefix frontend` — 0 ta xato.
- **Frontend Unit testlari**: `npm run test --prefix frontend` (Vitest) — 3 ta test fayli, 11 ta test 100% muvaffaqiyatli o‘tdi.
- **Backend testlari**: `scripts/backend -m pytest -q` — 54 ta test 100% muvaffaqiyatli o‘tdi.
- **Playwright Chrome E2E testlari**:
  - `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/navigation-responsive.spec.ts tests/e2e/mobile-responsive.spec.ts tests/e2e/public-grid.spec.ts` — 18 ta testning barchasi (100%) muvaffaqiyatli o‘tdi (1.7 daqiqa).
- **Vizual brauzer tekshiruvi**:
  - Desktop ($1440 \times 900$): Portret markazda, sariq gradientli dumaloq ramka ichida tekis va sifatli ko‘rindi.
  - Mobil ($375 \times 812$): Ustoz kartochkasi rasm ostida tartibli joylashgan, elementlar bir-biriga minmagan, gorizontal scroll yo‘q.

## Cheklovlar va kelgusi harakatlar

- Agar foydalanuvchi nafaqat Hero portretini, balki yuqori navigatsiya panelidagi "SHERZOD ENGLISH" (SE monogrammasi) brend logotipini ham o‘zgartirishni nazarda tutgan bo‘lsa, u holda kichik SVG/ikonka formatida moslashtirib berilishi mumkin.
