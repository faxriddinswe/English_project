# Sherzod English — hujjatlar

Har bir vazifadan keyin bu hujjatlar foydalanuvchi eslatmasisiz yangilanadi. Doimiy ish qoidasi: [AGENTS.md](../AGENTS.md).

## Qayerdan boshlash kerak

- [Loyiha ish jurnali](project-journal.md) — hozirgi holat va shu paytgacha bajarilgan ishlarning jamlangan tarixi.
- [Implementatsiya va tekshiruvlar holati](implementation-status.md) — sanalangan texnik natijalar, testlar va qolgan cheklovlar. Eng yangi yozuvlar tepada; eski yozuvlar tarixiy dalil sifatida saqlangan.
- [Ishga tushirish qo‘llanmasi](../README.md) — frontend/backend/worker, migratsiya, teacher yaratish, env va test buyruqlari.

## Arxitektura va ishga tushirish

| Hujjat | Mazmuni |
| --- | --- |
| [GitHub nashri va xavfsizlik auditi](github-publication.md) | Saralangan fayllar, private secret/sertifikat metadatasi, indeks tekshiruvi va remote nashr natijasi |
| [2026-11-03 audit va tuzatishlar](audit-fixes-2026-11-03.md) | Ro‘yxatdan o‘tish/tasdiqlash, lint, mavzu/PWA, mobil arizalar jadvali, worker recovery va takroriy start; disposable DB va Chrome dalillari |
| [2026-11-03 lokal ishga tushirish](local-startup-2026-11-03.md) | Joriy koddan frontend build, mavjud PostgreSQL/FastAPI/worker, socket papkasi tuzatishi, 54 backend va 11 frontend testi hamda real HTTP natijalari |
| [Arxitektura](architecture.md) | Auth, ruxsatlar, tranzaksiyalar, moliya, vaqt, media, Telegram, PWA va deployment qarorlari |
| [Operatsion qo‘llanma](operations.md) | Production tayyorgarligi, DB/media backup va restore tartibi |
| [Haqiqiy kontent checklist](content-checklist.md) | Ustoz to‘ldirishi yoki tasdiqlashi kerak bo‘lgan ma’lumotlar |
| [Referens tahlili](design-audit.md) | Dastlabki sakkizta screenshot va mavjud frontend tahlili |
| [Telegram ulanishi va xabar formati](telegram-setup.md) | Bot/guruh, IDsiz sarlavha, alohida Toshkent sana/soati va 13 test; 2026-11-03, 10:04 dagi bitta haqiqiy sinov xabari HTTP 200/ok:true |

## Interfeys o‘zgarishlari

| Hisobot | Holat/tarix |
| --- | --- |
| [Kurs va kabinet redesign](courses-and-workspace-redesign.md) | Uch detail sahifa/6 foto, role logo, responsive tablar, teacher reset olib tashlandi, existing-profile signup, 0004; 95 backend/14 unit, keng11 va final4 browser |
| [Excel hisobotlari](excel-reports.md) | CSV o‘rniga 13 varaqli XLSX, barcha ma’lumotlar/bo‘lim eksporti, snapshot moliya, format/filter/chart va 10003 satr testi; 93 backend, 14 unit, 10 browser passed |
| [Entity biznes qoidalari va mavzu ikonkalari](entity-lifecycle-and-theme-update.md) | Faol/nofaol maydonlarini API/UI’dan olib tashlash, tarixni saqlovchi o‘chirish, explicit approval, 0003 migratsiya/27 jadval saqlanishi, ixcham Sun/Moon ikonkalari |
| [Ustoz dashboardi: jonli grafiklar](teacher-dashboard-charts.md) | O‘quvchi/davomat donutlari, moliya line chart, 6 oylik ro‘yxat ustunlari, guruh/murojaat bandligi, 5s polling va tablararo refresh; 92 backend, 14 unit, final 8 E2E passed/1 skip |
| [O‘quvchilarni mustaqil ro‘yxatdan o‘tkazish va ustoz tasdiqlash tizimi](student-registration-and-approval-workflow.md) | Kabinetga kirishda "Kirish" va "Ro‘yxatdan o‘tish" tablari, o‘zi parol tanlash, kurs tanlash, tasdiqlanguncha pending xabari, ustozda "Yangi o‘quvchilar" arizalar bo‘limi, yakka va ommaviy tasdiqlash, eski o‘quvchi qo‘shish tugmasi olib tashlanishi; 54 backend, 11 unit, 8 Playwright E2E testlari o‘tdi |
| [Sertifikat kartochkalarini ixchamlashtirish va L/R/W/S qisqartmalari](compact-certificate-results-update.md) | Natijalar bo‘limidagi kartochkalar uzunligini qisqartirish, IELTS ko‘rsatkichlarini L/R/W/S ga aylantirib 1 qatorga joylash, sana va ballni birlashtirish; 18 Playwright E2E, 11 unit va 54 backend testlari o‘tdi |
| [Bosh sahifadagi ustoz logotipi (portreti) yangilanishi](homepage-hero-logo-update.md) | Bosh sahifa (Hero)dagi dumaloq logotip/portretga taqdim etilgan sinfxonadagi fotosuratni markazlashtirib joylashtirish, CSS hoshiyani moslashtirish, frontend fallback va backend MediaAsset sinxronizatsiyasi; 18 Playwright E2E, 11 unit va 54 backend testlari o‘tdi |
| [Ustoz profili banneri dizaynini yangilash, yangi fotosurat va tavsif kartochkalari](teacher-profile-banner-redesign.md) | /about sahifasidagi ustoz banneriga yangi berilgan portretni o‘rnatish, 28px silliq yumaloq burchaklar, nishonlar, 4 xil gradient ko‘rsatkichlar va pastdagi tavsiflarni tematik interaktiv kartochkalar ko‘rinishida boyitish; 20 Playwright E2E, 11 unit testlari o‘tdi |
| [Ustoz haqida bo‘limiga 3 ta dars jarayoni fotosuratlari va editorial dizayn](teacher-showcase-photos-update.md) | Asosiy sahifadagi Ustoz haqida bo‘limiga 3 ta haqiqiy sinf/dars fotosuratini navbatma-navbat (zigzag) hikoya, badglar, matn va ishonch statistikasi bilan joylashtirish, /about sahifasida ham dars jarayoni galereyasini aks ettirish; 20 Playwright E2E, 11 unit testlari o‘tdi |
| [Moliya hisoblari soddalashtirilishi, 3s bildirishnomalar va ixcham kirish](finance-simplification-and-login-compact-update.md) | Hisoblar shaklidan murakkab buxgalteriya davrlarini olib tashlab oy/sana qoldirish, bildirishnomalarni 3 soniyada avto-yopish, login kartochkasini ixchamlashtirish; 12 mobile, 4 notifications Playwright, 11 vitest, 54 backend testlari o‘tdi |
| [CSP tuzatishi va desktop o‘lchamlari/tugmalar takomillashtirilishi](csp-and-desktop-scaling-update.md) | Development eval CSP xatosini bartaraf etish, desktop proportsiyalarini 15–20% ixchamlashtirish va tugmalar/dialoglar/responsivlikni yangilash; 26 Playwright, 11 unit va 54 backend testlari o‘tdi |
| [Ism orqali qidiruv va sanasiz guruhga qo‘shish](search-enrollment-update.md) | Barcha record Lookup maydonlarida avtomatik takliflar; backend sana defaulti, hisob qidiruvi va real/API/touch testlar |
| [Bildirishnoma, modal va o‘zbekcha interfeys](notifications-dialogs-localization.md) | Global ixcham xabarlar, 13 resource modali, tarjima/CSRF/kirish/logo/fayl nazorati; real va fixture test dalillari, lint chegaralari |
| [Dastlabki homepage yangilanishi](homepage-update.md) | Hero, uch kurs, statistika va dastlabki 40 NAMUNA natija; sonlar va navigatsiya keyingi vazifalarda o‘zgargan |
| [Alohida public sahifalar va sertifikatlar](public-pages-plan.md) | 30 IELTS + 30 SEFR NAMUNA kartasi, filtr va 3:4 grid; keyin /center olib tashlangan |
| [Bosh sahifa previewlari](home-overview.md) | Har bo‘limdan qisqa ma’lumot va batafsil havola; hozir Markaz previewi yo‘q |
| [Ustoz profili](teacher-profile-update.md) | Haqiqiy portret, ism, bio va sertifikat previewlari |
| [Navigatsiya va tasdiqlangan statistika](navigation-responsive-update.md) | To‘g‘ri sahifa/scroll, ixcham profil va dastlabki raqamlar; ta’lim olganlar keyin 1000+ ga tuzatildi |
| [Ixcham ariza](compact-application-form.md) | Kichik desktop modal, rasm olib tashlanishi va forma holatlari |
| [Bevosita bog‘lanish formasi](inline-contact-form.md) | /contact sahifasida takroriy banner/tugmasiz bitta forma |
| [Mobil responsive va PWA](mobile-responsive-update.md) | Rasmlar, menyular, touch/formalar, jadval va install/update xabari; eng so‘nggi responsive dalillar |
| [Joriy demo kirish va 1000+](demo-access-update.md) | Lokal rol loginlarini sozlash, eski sessiyalarni bekor qilish, bio/stat sonini yangilash va haqiqiy tekshiruv |

- [Ustoz boshqaruvi: to‘lov, guruh va sertifikat](teacher-management-update.md) — CRUD, guruh jadvali/count, studentga tegishli sertifikat va jonli yangilanish.

## Tekshiruv dalillari

- [0004 migratsiya va original data saqlanishi](registration-migration-verification.json)
- [Kurs/kabinet final4](courses-workspace-final-results.json)
- [Keng UI/Excel regressiyasi](courses-workspace-regression-results.json)
- [Public GET va main read-only](courses-workspace-live-verification.json)
- [Kurs rasm manbalari](course-image-sources.md)

- [Excel: real DB read-only tekshiruvi](excel-live-verification.json)
- [Excel: browser download va regressiyalar](excel-e2e-results.json)

- [Entity migratsiyasi: restore va ma’lumotlar saqlanishi](entity-migration-verification.json)
- [Entity dashboard: asosiy bazada read-only va HTTP tekshiruvi](entity-live-verification.json)
- [Entity/theme yakuniy browser tekshiruvi](entity-theme-e2e-results.json)

- [Dashboard final browser tekshiruvi](teacher-dashboard-e2e-results.json) — 8 passed / 1 intentional skip.
- [Dashboard haqiqiy DB read-only tekshiruvi](teacher-dashboard-live-verification.json) — secret/PII ma’lumotlarisiz agregat tengliklari.
- [Yangi Telegram formatidagi haqiqiy yetkazish — 2026-11-03](telegram-format-delivery-2026-11-03.json)
- [Ustoz boshqaruvi real CRUD E2E](teacher-management-e2e-results.json)
- [Ustoz boshqaruvi regressiyasi](teacher-management-regression-results.json)
- [Migration va DB restore/saqlanish tekshiruvi](teacher-management-migration.json)
- [Joriy demo kirish va statistika dalili](demo-access-verification.json)
- [Lokal ishga tushirishning tarixiy dalili](local-runtime.json)
- [Mobil regressiya: 26 test](mobile-responsive-regression.json)
- [Oxirgi Playwright ishga tushirish natijasi](e2e-results.json) — har ishga tushirishda yangilanadi; butun test tarixini anglatmaydi.
- [Haqiqiy kabinet API/mobil auditi](mobile-live-audit.json)
- [Backend test hisoboti](backend-test-results.xml)
- [OpenAPI snapshot](openapi.json)
- [Screenshotlar](qa/)

Barcha natijalar tegishli hisobotdagi sana va tekshiruv doirasi bilan o‘qiladi. Lokal muvaffaqiyat production deployment, real qurilma yoki tashqi storage tekshiruvi bajarilganini anglatmaydi. Secret va parollar hujjatlarga yozilmaydi.
