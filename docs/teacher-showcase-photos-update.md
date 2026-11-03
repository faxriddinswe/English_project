# Ustoz haqida bo‘limiga 3 ta dars jarayoni fotosuratlarini joylashtirish va editorial dizayn — 2026-11-02

## Talab va kontekst

Foydalanuvchi asosiy sahifadagi (dashboard/homepage) "Ustoz haqida" bo‘limini tubdan yaxshilash va taqdim etilgan 3 ta dars jarayoni fotosuratini matnlar bilan birga senior dizayner darajasida chiroyli joylashtirish talabini bildirdi:
> "Qara asosiy dashboardagi ustoz haqida bo'limiga o'zgartirish kiritamiz mana shu 3 ta rasmini ustoz haqida bo'limga joylashtrish kerak va orasida text yani maulotlar bo'lishi kerak 3 ta rasmni orasida
> shuni chiroyli designer sifatida joylashtir"

Taqdim etilgan 3 ta original fotosurat:
1. `media_1793635715328.png` (920x798) — Ustoz Sherzod Allamurodov doska oldida turib butun sinfga grammatika va dars mavzusini tushuntirayotgan jarayon.
2. `media_1793635818571.jpg` (1024x682) — Ustoz o‘quvchi partasi yonida turib, uning daftari va tushunmagan joyiga bevosita individual e’tibor qaratayotgan jonli jarayon.
3. `media_1793635821001.jpg` (1024x682) — Ustoz interaktiv smart-ekranda oila va grammatika mavzusini audio/vizual materiallar bilan tushuntirayotgan zamonaviy dars jarayoni.

---

## Amalga oshirilgan dizayn va arxitektura yechimi

### 1. Fotosuratlarni tizimga joylashtirish
Uchala haqiqiy rasm `frontend/public/teacher/` katalogiga optimallashtirilgan semantik nomlar bilan ko‘chirildi:
- `/teacher/sherzod-lesson.png` — Dars berish va metodika (doska oldida).
- `/teacher/sherzod-individual.jpg` — Har bir o‘quvchi bilan individual ishlash.
- `/teacher/sherzod-interactive.jpg` — Zamonaviy smart-doska va interaktiv metodlar.

### 2. Bosh sahifa uchun navbatma-navbat almashinuvchi editorial dizayn (`HomeIntroPreviews.tsx`, `HomePreviews.module.css`)
Avvalgi bitta tor blok o‘rniga, zamonaviy ta’lim portallariga xos navbatma-navbat (zigzag / alternating) 3 bosqichli editorial hikoya strukturasi yaratildi:

1. **1-hikoya (Metodika va tajriba)**:
   - Rasm chapda: `/teacher/sherzod-lesson.png`, ustida "Jonli dars jarayoni" badge'i, nozik soya va hover-zoom animatsiyasi.
   - Matn o‘ngda:
     - Kicker: `01 · METODIKA VA TAJRIBA`
     - Sarlavha: `18+ yillik tajriba va tushunarli grammatika`
     - Tavsif: Ustoz Sherzod Allamurodov har bir mavzuni quruq yodlash emas, mantiqiy tushunish asosida o‘rgatadi. Darslarda o‘quvchilar mustaqil fikrlashga, erkin gapirishga va ingliz tili qoidalarini amaliyotda qo‘llashga o‘rganadi.
     - 3 ta ustunlik pilli: "Chuqur tushuntirish", "Mantiqiy yondashuv", "Nol dan C1 gacha".
2. **2-hikoya (Individual e’tibor — teskari tartib)**:
   - Desktopda matn chapda, rasm o‘ngda (`.storyCard.reverse` orqali `order: 2` va `order: 1`):
     - Kicker: `02 · INDIVIDUAL E’TIBOR`
     - Sarlavha: `Har bir o‘quvchiga shaxsiy e’tibor va tahlil`
     - Tavsif: Katta guruhlarda ham hech bir o‘quvchi e’tibordan chetda qolmaydi. Dars davomida har bir o‘quvchining daftari, yozgan inshosi va talaffuzi alohida tekshirilib, individual tavsiyalar beriladi.
     - 3 ta ustunlik pilli: "Xatolarni tahlil qilish", "Shaxsiy feedback", "Doimiy nazorat".
   - Rasm o‘ngda: `/teacher/sherzod-individual.jpg`, ustida "Individual yondashuv" badge'i.
3. **3-hikoya (Zamonaviy ta’lim va smart-doska)**:
   - Rasm chapda: `/teacher/sherzod-interactive.jpg`, ustida "Interaktiv texnologiyalar" badge'i.
   - Matn o‘ngda:
     - Kicker: `03 · ZAMONAVIY TA’LIM`
     - Sarlavha: `Smart texnologiyalar va imtihonga tizimli tayyorgarlik`
     - Tavsif: Zamonaviy dars xonasi interaktiv smart-doska va multimediya vositalari bilan jihozlangan. O‘quvchilar IELTS va CEFR imtihonlarining barcha modullarini (Listening, Reading, Writing, Speaking) real formatda mashq qiladilar.
     - 3 ta ustunlik pilli: "Interaktiv darslar", "IELTS / CEFR strategiyasi", "Haqiqiy natijalar".

4. **Pastki ishonch footer bloki**:
   - 3 ta tasdiqlangan statistika pilli:
     - **18+ yil** — Pedagogik tajriba
     - **1000+** — O‘quvchi ta’lim olgan
     - **500+** — Sertifikat egalari
   - Harakatga chorlovchi (CTA) tugmalar:
     - "Ustoz haqida to‘liq tanishish →" (binafsha premium gradient tugma, `/about` ga olib boradi).
     - "Kursga yozilish" (ixcham oq konturli tugma, ariza modalini ochadi).

### 3. Dedicated `/about` sahifasi bilan to‘liq uyg‘unlik (`TeacherAboutSection.tsx`, `TeacherAboutSection.module.css`)
Foydalanuvchi `/about` sahifasiga o‘tganda ham ushbu 3 ta haqiqiy fotosurat yo‘qolib qolmasligi uchun "Dars jarayonidan lavhalar" maxsus 3 ustunli premium galereya bloki qo‘shildi:
- Har bir kartochkada fotosurat, tegishli jarayon badge'i ("Metodika", "Individual tahlil", "Zamonaviy texnika"), sarlavha va tushuntirish matni joylashtirildi.

### 4. Responsivlik va mobil moslashuvchanlik
- Desktopda (861px dan yuqori): Keng 2 ustunli CSS Grid, navbatma-navbat tartib, kartochkalar orasida 28px oraliq, 16/11 aspect-ratio.
- Mobil va planshetlarda (860px va undan past): Har bir blok 1 ustunli vertikal oqimga o‘tadi, rasm `.storyImageWrapper` ga `order: -1` berilib har doim matn tepasida ko‘rinadi, shriftlar va paddinglar mobil ekranlarga (320px–480px) mutanosib kichrayadi.

---

## Tekshiruv natijalari

1. **TypeScript Typecheck**:
   `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
2. **Frontend Vitest**:
   `npm run test --prefix frontend` — 3 fayl, 11 ta test 100% muvaffaqiyatli o‘tdi.
3. **Playwright E2E Regressiya**:
   `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/navigation-responsive.spec.ts tests/e2e/public-grid.spec.ts tests/e2e/teacher-profile.spec.ts tests/e2e/mobile-responsive.spec.ts` — barcha 20 ta E2E test to‘liq o‘tdi.
4. **Vizual tekshiruv**:
   Playwright Chrome orqali to‘liq o‘lchamli skrinshotlar olinib, dizaynning kontrastliligi, shrift o‘lchamlari va oraliqlarining mutanosibligi ko‘rib chiqildi va tasdiqlandi.
