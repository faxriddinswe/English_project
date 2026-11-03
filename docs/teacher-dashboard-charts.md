# Ustoz boshqaruvi: jonli grafiklar — 2026-11-03

> Keyingi qaror (2026-11-03): qo‘lda faol/nofaol holatlari va eski KPI kalitlari [yangi backend qoidalari](entity-lifecycle-and-theme-update.md) bilan almashtirildi. Hozir `student_count`, `group_count` va guruhga biriktirish donuti ishlaydi; quyidagi dastlabki status tafsilotlari o‘z davrining tarixidir.

Vaqt zonasi: Asia/Tashkent. Talab: ustozning Boshqaruv sahifasidagi o‘quvchilar, guruhlar, moliya va boshqa ko‘rsatkichlarni chiroyli line/bar/pie chartlarda, haqiqiy yangilanadigan ma’lumotlar bilan ko‘rsatish.

## Reja

1. Mavjud dashboard, ruxsatlar, moliyaviy hisoblar va qayta yuklash mexanizmini o‘rganish.
2. Mavjud FastAPI dashboard API’ini cheklangan grafik agregatlari bilan kengaytirish; schema yoki biznes yozuvlarini o‘zgartirmaslik.
3. Next.js ichida responsive, light/dark va klaviaturaga mos SVG dashboard yaratish.
4. Disposable PostgreSQLda haqiqiy API hisoblarini, Chrome’da UI va yangilanishni tekshirish; joriy kod bilan lokal xizmatlarni ishga tushirish.

## Amalga oshirilgan yechim

- `reports/dashboard.py`: 6 oylik to‘lov/qaytarish/ro‘yxatdan o‘tish agregatlari, tanlangan oyning kunlik moliyasi, o‘quvchi statuslari, faol guruhlar bandligi, davomat, to‘lov usullari va murojaat holatlari. Pul Decimal/string ko‘rinishda; to‘liq payment tarixini yuklash yoki har bir guruh uchun alohida query yo‘q. Guruh ro‘yxati eng ko‘pi 8 ta, jami bandlik barcha faol guruhlar bo‘yicha.
- `reports/router.py`: mavjud teacher-only `/teacher/dashboard` javobiga `analytics` qo‘shildi; eski KPI maydonlari saqlandi. Belgilanmagan davomat avval barcha oylardan kelgan; endi tanlangan oyga chegaralandi. Yil overflow’i 500 o‘rniga 422 bilan to‘xtatiladi.
- `TeacherDashboard.tsx`, `dashboard-charts.tsx`, turlar/formatter va CSS module: 4 asosiy KPI, kunlik/6 oylik tushum chizig‘i, o‘quvchi/doiraviy va davomat diagrammalari, ro‘yxatdan o‘tish ustunlari, guruh bandligi, to‘lov usullari va murojaat chiziqlari. Mavjud e’tibor/ketma-ket kelmaganlar va guruh jadvali saqlanadi.
- Jonli yangilanish: sahifa ko‘rinib turganda har 5 soniya, focus/reconnect, qo‘lda refresh; bir brauzerning tablari mutationdan keyin `workspace-updates.ts`/BroadcastChannel orqali xabardor bo‘ladi. `api/client.ts` muvaffaqiyatli teacher mutation/signupdan keyin faqat «changed» signali yuboradi, private ma’lumot uzatmaydi. Aloqa xatosida eski ma’lumot va oxirgi yangilangan vaqt saqlanib, xato holati ko‘rsatiladi. Bu WebSocket push emas.
- UI’da tarixiy faol o‘quvchilar soni taxmin qilinmaydi: bar chart haqiqiy profil yaratilgan vaqtini ko‘rsatadi. Guruh bandligi amaldagi memberships, student global soni esa alohida profillar; ularni bir xil son deb talqin qilmaydi. Tushum foyda emas; o‘tgan muddatli qarz hozirgi holatdir. Kelgusi sanalarga uydirma moliya chizig‘i chizilmaydi.

## Dastlabki tekshiruv

Mavjud 11 frontend unit testi, TypeScript va dastlabki production build o‘tdi. Disposable `.local/audit-postgres` 55433 va `sherzod_audit_test` bazasida 2 yangi dashboard testi o‘tdi. Ular UTC/Toshkent kun chegaralari, kopeykasigacha summalar, void/refund, pending holatini ikki marta sanamaslik, end/future membership, davomat/cancel, bo‘sh oy va teacher-only ruxsatni qamradi.

Yangi testning dastlabki refund-ID taxmini va donut renderidagi mutatsion accumulator tuzatildi. Bular real ma’lumot yoki asosiy hisoblarni o‘zgartirmagan. Asosiy bazada reset/reseed, migratsiya yoki yangi demo rekord yaratilmadi; Telegramga test xabari yuborilmadi.

## Dizayn va foydalanish

Yangi sahifa `/teacher`da. Yuqorida oy tanlash, oldingi/keyingi oy, yangilash tugmasi va oxirgi muvaffaqiyatli yangilanish vaqti bor. To‘rt asosiy kartadan tegishli bo‘limga o‘tiladi. «Pul oqimi»da Kunlik/6 oylik rejim, pointer/touch va ← → / Home / End orqali sana tanlash, aniq summalar va ochiladigan jadval mavjud. Doiraviy legendlar bilan segmentlar ajratiladi; guruh bandligi havolalari guruh tafsilotiga olib boradi.

Dashboard mavjud brendning binafsha, yashil va sarg‘ish tokenlari bilan yangi CSS module’da qurildi. 320–1440px o‘lchamlarda grid 4/2/1 ustunlarga moslashadi. Chiziqli SVG container kengligiga ResizeObserver orqali moslab chiziladi: telefonda axis yozuvlari desktop SVG’ini kichraytirish hisobiga maydalanmaydi. Dark legend matni uchun aniq theme rangi, zero/empty state, reduced-motion, accessible nomlar, meter qiymatlari va klaviatura jadvallari bor. Yangi dependency, hosting yoki pullik servis qo‘shilmadi. Public SW versiyasi v12; private/API cache qoidalari saqlangan.

Moliyaviy label va jadval qiymatlari Decimal/string/BigInt orqali aniq qoladi; SVG koordinatalari/nisbatlari ko‘rsatish uchun Number’ga aylantiriladi. Oldingi oyga taqqoslash tanlangan oy yig‘indisi va oldingi kalendar oy yig‘indisidir; kunlari teng MTD taqqoslash yoki foyda hisoboti emas.

## Yakuniy tekshiruv — 2026-11-03, 10:41 (Asia/Tashkent)

| Tekshiruv | Haqiqiy kuzatuv |
| --- | --- |
| Butun backend suite, isolated PostgreSQL bilan | **92 passed (54.11s)** |
| Kelgusi oylik nuqtalarni ajratish qo‘shilgach | **2 dashboard testi passed (5.13s)** |
| Frontend unit | **14 passed**, 4 fayl; exact money/oy chegaralari va mavjud API/CSRF testlari |
| TypeScript / production build | O‘tdi; oxirgi legend rangi, SVG o‘lchami va SW v12 bilan final build ham o‘tdi |
| Python F / frontend lint | Python F o‘tdi; frontend **0 error / 11 avvalgi image warning** |
| Keng Chrome tekshiruvi | 19 passed, 1 eskirgan login-label fixture xatosi, 1 intentional real-CSV skip |
| Eski fixture labeli moslangach | login/password testi 1 passed; final run’da ham o‘tdi |
| Final Chrome: dashboard + notification/interface | **8 passed, 1 skipped (45.1s)**; [alohida JSON](teacher-dashboard-e2e-results.json) |
| O‘sha vazifada tekshirilgan turli browser ssenariylari | 4 yangi dashboard + 12 mobile + 4 interface: jami **20 xil ssenariy o‘tdi**, real-account CSV testi skip |
| Haqiqiy asosiy DBdan faqat o‘qish | Kunlik tushum/refund, payment-method jami va student statuslarining jami KPI bilan mos; 30 kun / 6 oy; bitta o‘lchovda 159ms |
| Runtime HTTP | API ready 200, `/teacher` shell 200, sessiyasiz dashboard API 401 |

Haqiqiy DB o‘qish [secretlarsiz JSON dalilida](teacher-dashboard-live-verification.json). Bu mavjud `dashboard()` funksiyasini real DB bilan chaqirishdir; owner akkaunti bilan HTTP login yoki browser sessiyasi yaratilmagan. Haqiqiy autentifikatsiyalangan API va 401/403 tekshiruvlari alohida test PostgreSQLda bajarildi. Private UI screenshotlari va browser mutation/yangilanish sinovlari aniq fixture bilan, public sahifalar esa real serverdan o‘qib tekshirildi.

Frontendning birinchi 320px tekshiruvida toolbar sig‘masligi, visual QA’da dark donut legend matni va kichraytirilgan SVG axis yozuvlari topilib tuzatildi. Birinchi helper-unit urinishida Vitest path aliasi mos kelmagani relative import bilan tuzatildi. Bular final build/testlarda qayta tekshirildi. Private dashboard screenshotlaridagi sonlar biznes da’vosi emas, fixture.

### Screenshotlar

- [1600px, light — dashboard UI fixture](qa/dashboard-fixture-1600-light.png)
- [375px, dark — dashboard UI fixture](qa/dashboard-fixture-375-dark.png)
- [375px, light — dashboard UI fixture](qa/dashboard-fixture-375-light.png)
- [375px, dark — o‘quvchilar legendi yaqindan](qa/dashboard-donut-fixture-375-dark.png)

Desktop sahifasi va dark legend screenshotlari vizual ko‘rildi; barcha 5 o‘lchamdagi overflow, theme rangi va mos SVG viewBox brauzer assertionlari bilan tekshirildi. Oxirgi JSON run’da polling orqali 84→91 va BroadcastChannel orqali 95 qiymatga reloadsiz o‘tish, 503’da stale qiymatni saqlash/xato holati hamda retry bilan tiklanish o‘tdi; bu sonlar aniq fixturedir.

## Bajarilgan asosiy buyruqlar

```bash
scripts/backend ../.local/run-audit-tests.py -q --tb=short
scripts/backend ../.local/run-audit-tests.py -q -k dashboard --tb=short
npm run test --prefix frontend
npm run typecheck --prefix frontend
npm run lint --prefix frontend
.venv/bin/ruff check backend --select F
npm run build --prefix frontend
scripts/backend ../scripts/local_runtime.py --production
npm run e2e --prefix frontend -- teacher-dashboard.spec.ts mobile-responsive.spec.ts interface-notifications.spec.ts --max-failures=2
npm run e2e --prefix frontend -- teacher-dashboard.spec.ts interface-notifications.spec.ts --max-failures=2
```

Ignored audit helper test processiga faqat alohida `sherzod_audit_test` URL’ini bergan va Telegramni o‘chirgan. Yakunda shu test DB olib tashlandi va faqat `.local/audit-postgres` klasteri to‘xtatildi. Asosiy `.local/postgres` bazasi, akkauntlar/parollar va biznes yozuvlariga reset/reseed/migratsiya qo‘llanmadi. Yangilangan FastAPI va frontend ishga tushirildi, mavjud worker saqlandi. Helperni tayyor test bazasisiz qayta bajarish kerak emas; qayta integratsiya uchun README’dagi `TEST_DATABASE_URL`/`TEST_DATABASE_RESET` tartibiga amal qilinadi.

## Chegaralar

- Sahifa ochiq/visible bo‘lganda odatiy yangilanish oralig‘i 5 soniya; server va tarmoq kechikishi qo‘shiladi. Bu barcha qurilmalarga nol kechikishli push kafolati emas. Bir originning browser tablari o‘zgarishda darhol xabardor bo‘ladi.
- Raqamlar bazadagi joriy yozuvlardan keladi. Tarif, real natija yoki history snapshot uydirilmagan. Guruh bandligi membershiplar soni bo‘lgani uchun bir o‘quvchining bir nechta guruhdagi joylari alohida sanaladi.
- 11 ta avvalgi native-image optimallashtirish tavsiyasi qoldi; yangi dashboardda lint xatosi yo‘q. Owner credentials talab qiladigan CSV testi ushbu asosiy muhitda intentionally skip.
- Production deploy, haqiqiy jismoniy telefon/Safari, load test, real-account browser CRUD yoki tashqi provider yetkazilishi bu dashboard vazifasida bajarilmadi. Lokal muvaffaqiyat production acceptance deb belgilanmaydi.
