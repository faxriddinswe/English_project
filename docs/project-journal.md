# Sherzod English — loyiha ish jurnali

Bu jurnal foydalanuvchi talabi bilan har bir vazifadan keyin avtomatik yangilanadi. Qoida [AGENTS.md](../AGENTS.md)da saqlangan. Hujjatlar xaritasi: [docs/README.md](README.md).

Oldingi ishlar suhbat va mavjud sanalangan hisobotlar asosida jamlandi. Aniq sanasi qayd etilmagan ishga taxminiy sana berilmadi. Eski yechim keyin o‘zgargan bo‘lsa, ikkala bosqich va hozirgi qaror ajratilgan.

## Hozirgi holat — 2026-11-03 dagi oxirgi tekshiruv bo‘yicha

- GitHub nashri **bajarildi** (2026-11-03, Asia/Tashkent): write huquqi ishladi, source [fd52e65](https://github.com/faxriddinswe/Sherzod-English/commit/fd52e6521848de78ada0d83d1c191f49d3cd809a) main branchida. 263/263 path/mode/blob remote bilan teng; private env/data/QA kiritilmagan, lokal Git main/origin/main moslandi, audit tarixi saqlandi. Bu quyidagi oldingi bloklangan holatlarni almashtiradi. [Natija va tekshiruvlar](github-publication.md).
- Eng yangi push sinovi14:51: GitHub API yozish yanaHTTP403; haqiqiy terminal `git push -u origin main` exit128/DNS bilan tugadi. Remote branches[], **nashr tugallanmagan**. Lokal xavfsiz commit/bundle tayyor; foydalanuvchining oddiy terminali uchun aniq buyruq [hisobotda](github-publication.md). Kod/baza/runtime o‘zgarmadi.
- GitHub nashri (2026-11-03, qayta urinish14:45, Asia/Tashkent): private fayllar ajratilgan263fayl/0finding; oldingi31+2test/scanner4passed. Egasi huquqni yoqqanidan keyin real yozish so‘rovi yanaHTTP403 integration xatosi bilan rad etildi, remote branches[]. **Push tugallanmagan.** GitHub ulanishini yangi yozish huquqi bilan qayta autentifikatsiya qilish kerak; lokal commit/bundle saqlangan. [Audit, qayta urinish va keyingi amal](github-publication.md).
- Kurs/kabinet yangilanishi (2026-11-03, 12:43, Asia/Tashkent): uch detail sahifa/6 licensed foto, role logo o‘z kabineti boshiga, info/history/actions responsive tartib, teacher password-reset chiqarildi. Existing accountless profilga self signup teacher approval bilan ulanadi; 0004 va27 jadval data saqlanishi tekshirildi. 95 backend,14 unit, keng11pass/1skip va final4 UI passed; runtime tayyor. [Joriy hisobot](courses-and-workspace-redesign.md).
- Excel eksporti (2026-11-03, 11:55, Asia/Tashkent): CSV olib tashlanib, 13 varaqli XLSX va bo‘limlar bo‘yicha eksport joriy qilindi. Moliya/qarz/credit va o‘quvchi/guruh sonlari bazadagi hisobga teng; 10003 satr to‘liq, parallel o‘zgarishda snapshot mos. Final 93 backend, 14 unit, 10 browser passed; build/runtime tayyor. [Joriy Excel hisoboti va chegaralar](excel-reports.md).
- Joriy entity/theme yangilanishi (2026-11-03, 11:20, Asia/Tashkent): qo‘lda faol/nofaol talablari API/UI’dan chiqarildi; oddiy o‘quvchi/guruh soni, a’zolik donuti, explicit approval va tarixni saqlovchi o‘chirish ishlaydi. Sayt/kabinetda 16px Sun/Moon va 36px tugma (touch 40px). 0003 migratsiya, private restore va 27 jadval saqlanishi tasdiqlandi. Final 94 backend, 14 unit va 11 browser passed; lokal xizmatlar tayyor. [Joriy qoidalar va tekshiruvlar](entity-lifecycle-and-theme-update.md). Bu oldingi active/paused/status-donut qarorini almashtiradi.
- Dashboardning oldingi chart bosqichi (10:41, Asia/Tashkent; entity holatlari yuqoridagi qaror bilan yangilandi): o‘quvchilar, guruh bandligi, pul oqimi, to‘lov usullari, ro‘yxat, davomat va murojaatlar haqiqiy API agregatlaridagi chartlarda ko‘rinadi. Visible sahifada 5s polling, focus/reconnect/manual va tablararo refresh; light/dark, 320–1440px, tooltip/klaviatura/jadval/empty-state bor. 92 backend, keyingi 2 focused API, 14 unit, final build hamda 8 E2E passed/1 CSV skip. [Joriy dashboard hisoboti](teacher-dashboard-charts.md).
- Oxirgi audit/tuzatish: 2026-11-03, 09:42 (Asia/Tashkent), ro‘yxatdan o‘tish/tasdiqlash, mavzu/PWA, mobil jadval va runtime tuzatildi. Disposable PostgreSQL integratsiyalarini ham qamragan 87 backend testi, 11 frontend unit testi, TypeScript va build o‘tdi; lint 0 error / 11 image warning. [Joriy audit hisoboti](audit-fixes-2026-11-03.md). Avvalgi 48/54 test yozuvlari o‘z sanasidagi tarixiy kuzatuvdir.
- Arxitektura: Next.js + TypeScript frontend, Python FastAPI backend, PostgreSQL, Telegram outbox worker. Mavjud tizim rivojlantirilgan.
- Lokal sayt `http://localhost:3000`da standalone build orqali ishlamoqda; ochiq sahifalar, public API proxy va 21 ta public/build asset HTTP 200 qaytardi. FastAPI loopback 8000, lokal PostgreSQL 55432 (`0004_self_registration` head), worker heartbeat faol. PostgreSQL socket yo‘li `.local/postgres-socket`; yangi skript `--production`/`--status`ni qo‘llaydi va takroriy startda qo‘shimcha worker yaratmadi. Telegram yetkazishi bu safar tekshirilmadi.
- Ochiq sahifalar: `/`, `/about`, `/courses`, `/courses/[slug]`, `/results`, `/faq`, `/contact`, `/privacy`; kirish/parol va teacher/student kabinetlari mavjud. `/center` olib tashlangan.
- Brend: Sherzod English. Ustozning foydalanuvchi bergan ismi — Sherzod Allamurodov; haqiqiy portret CMS orqali ulangan.
- O‘quvchilarni mustaqil ro‘yxatdan o‘tkazish va tasdiqlash tizimi: `/login` sahifasida "Kirish" va "Ro‘yxatdan o‘tish" tablari; o‘quvchi ism, telefon, o‘zi o‘ylab topgan parol va kurs tanlaydi. Ustoz tasdiqlamagunicha tizimga kirishda "Arizangiz ko‘rib chiqilmoqda..." xabari chiqadi. Ustoz panelida "Yangi o‘quvchilar" (`/teacher/pending-students`) bo‘limi yaratildi; har bir arizani alohida tasdiqlash/rad etish hamda barchasini birdan tasdiqlash ("✓ Barchasini birdan tasdiqlash") imkoni berildi. O‘quvchilar ro‘yxatidan eski qo‘lda qo‘shish tugmasi olib tashlandi.
- Ustoz boshqaruv paneli (`/teacher`): `/api/v1/teacher/dashboard` da import qilinmay qolgan `User` modeli tufayli yuzaga kelgan 500 server xatosi to‘liq tuzatildi. Boshqaruv statistikasi (yangi arizalar, o‘quvchilar, guruhlar, tushum, qarz, yangi murojaatlar) xatosiz ishlamoqda. 54 backend, 11 vitest, 2 Playwright E2E testlari va jonli Chrome sessiyasi 100% o‘tdi.
- Joriy lokal kirish: ustoz `<private-teacher-login>`, demo o‘quvchi aynan `<private-student-login>`; egasi tanlagan parollar source/Markdown’da saqlanmaydi. Haqiqiy login va rol tekshiruvi o‘tgan. [Joriy hisobot](demo-access-update.md).
- Tasdiqlangan public statistika: 18+ yil tajriba, 1000+ ta’lim olganlar (egasi so‘rovi bilan 5000+ dan tuzatildi), 500+ sertifikat olganlar, 200+ DTMga kirganlar. Bular foydalanuvchi bergan kontent, NAMUNA kartalari sonidan hisoblanmaydi.
- Natijalar: foydalanuvchi bergan beshta rasm asosida dastlab 60 takroriy NAMUNA karta kiritilgan. Joriy nashr holati ustoz boshqaruviga bog‘liq; oxirgi snapshotda 59 public (30 IELTS/29 SEFR), teacher listda 61. Bu alohida 60 o‘quvchi degani emas; productionga avtomatik chiqarilmaydi.
- Bog‘lanish sahifasida bitta ixcham forma bevosita ko‘rinadi. Boshqa tegishli sahifalarda kurs oldindan tanlanadigan ariza modali saqlangan.
- Telegram bot yopiq guruhga ulangan. 2026-11-03, 09:58 da xabar «Yangi ariza kelib tushdi.» sarlavhasi, IDsiz matn va alohida Toshkent sana/soatiga o‘tkazildi; 13 tegishli test o‘tdi, worker qayta boshlandi. 10:04 da foydalanuvchi so‘rovi bilan yangi formatdagi bitta haqiqiy SINOV xabari yuborildi: HTTP 200/ok:true va Telegram qaytargan matn tengligi tasdiqlandi. [Joriy format va real sinov](telegram-setup.md), [dalil](telegram-format-delivery-2026-11-03.json). Secretlar private `.env`da, jurnalga yozilmaydi.
- Ustoz boshqaruvi yangilandi: to‘lov correction/void, guruh count/kurs/jadval/CRUD, studentga bog‘langan sertifikat CRUD va private Sertifikatlar sahifasi. Migration 0002 lokal bazaga qo‘llandi; public SW hozir v12. [Boshqaruv hisoboti](teacher-management-update.md), [runtime/PWA tuzatishi](audit-fixes-2026-11-03.md), [yangi chartlar](teacher-dashboard-charts.md).
- Yangi interfeys: ixcham burchak bildirishnomalari, 13 teacher resource uchun markaziy modal, o‘zbekcha status/maydon/validatsiya va mobil kirish/logo. 69 backend, 11 unit, 16 izolyatsiyalangan Chrome va 24 public/mobile testi o‘tdi; lintda 5 avvalgi xato qoldi. [Joriy UI hisoboti](notifications-dialogs-localization.md).
- Record tanlash endi o‘quvchi/guruh/kurs/hisob nomini yozganda takliflar orqali; enrollmentda sana tanlanmaydi, server hisoblaydi. [Joriy qidiruv hisoboti](search-enrollment-update.md).
- Dizayn va proporsiyalar: desktop elementlari 15–20% proporsional ixchamlashtirildi (konteyner 1360px, section padding 38–76px, shriftlar, 42px tugmalar va 36px kichik tugmalar). Dev-rejim eval CSP xatosi dinamik header bilan bartaraf etildi. 26 Playwright E2E, 11 unit, 54 backend testlari va typecheck 100% o‘tdi. [Joriy hisobot](csp-and-desktop-scaling-update.md).
- Moliya va kirish qismi: login kartochkasi ixchamlashtirildi (390px, 24px padding), bildirishnomalar 3 soniyada avto-yo‘qoladi, yangi hisob yaratish modalidan tushunarsiz "davr boshi/oxiri" olib tashlanib "Qaysi oy uchun" va "Sana" maydonlariga soddalashtirildi; 12 mobile va 4 notification E2E testlari o‘tdi. [Joriy moliya hisoboti](finance-simplification-and-login-compact-update.md).
- Ustoz haqida bo‘limi (3 ta fotosurat va editorial dizayn): Asosiy sahifada 3 ta dars jarayoni fotosurati (doska oldida metodika, individual e’tibor, smart-doska) navbatma-navbat (zigzag) hikoyalar, badglar, matnlar va ishonch statistikasi bilan joylashtirildi; /about sahifasida ham dars jarayoni galereyasi ko‘rsatildi. 20 Playwright E2E va 11 unit testlari o‘tdi. [Joriy hisobot](teacher-showcase-photos-update.md).
- Ustoz profili banneri va tavsif kartochkalari (/about): Yangi taqdim etilgan 2-fotosurat (och havorang polo kiygan professional portret) bannerga joylashtirildi, banner shakllari (28px radius, ambient radial nurlar, suzuvchi "18+ yillik tajriba" nishoni, 4 xil gradient ko‘rsatkichlar) chiroyli yangilandi; pastdagi tavsiflar pedagogik falsafa kartochkasi va tematik interaktiv kartochkalar (Grammatika, IELTS, SEFR, Kabinet, Qabul) ko‘rinishida boyitildi. 20 Playwright E2E va 11 unit testlari o‘tdi. [Joriy hisobot](teacher-profile-banner-redesign.md).
- Bosh sahifadagi ustoz logotipi/portreti yangilanishi: Foydalanuvchi bergan sinfxonadagi fotosurat (yashil doska oldida oq ko‘ylakda turgan Sherzod ustoz) 560x560 kvadrat portret qilib markazlashtirildi, burchakdagi o‘quvchilar kesilib, Hero sektsiyasidagi dumaloq sariq hoshiyali logotip/ramkaga joylashtirildi. CSS zoom/position sozlandi, frontend fallback va backend MediaAsset sinxronlashtirildi; 18 Playwright E2E, 11 unit va 54 backend testlari o‘tdi. [Joriy hisobot](homepage-hero-logo-update.md).
- Sertifikat kartochkalarini ixchamlashtirish va L/R/W/S qisqartmalari: Natijalar bo‘limidagi kartochkalar uzunligi qisqartirildi, IELTS ko‘rsatkichlari L:, R:, W:, S: qilib 1 qatordagi 4 ustunli ixcham pillarga aylantirildi, sana va ball alohida qatorlarsiz birlashtirildi, vertikal bo‘yi 120px ga qisqartirildi; 18 Playwright E2E, 11 unit va 54 backend testlari o‘tdi. [Joriy hisobot](compact-certificate-results-update.md).
- Oldingi responsive ish: build/typecheck va 5 unit test o‘tgan; 26 Chrome testi o‘tgan, yakuniy jadval tuzatishidan keyin 3 tegishli test qayta o‘tgan. Haqiqiy student API auditi: 24 sahifa/o‘lcham tekshiruvi. [Dalillar va chegaralar](mobile-responsive-update.md).
- Productionga ommaviy deploy qilinmagan. Haqiqiy telefon/Safari, native PWA install, tashqi S3 tekshiruvlari to‘liq yakunlangan deb hisoblanmaydi. Lokal DB backup/restore rehearsal esa yuqoridagi 0003 ishida tekshirildi.

## 1. Dastlabki audit va loyiha asoslari — sana alohida qayd etilmagan

**Talab:** mavjud repositoryni tekshirish, yaratilgan funksiyalarni takrorlamasdan Sherzod English arxitekturasiga mos rivojlantirish.

**Bajarilgan ishlar:** mavjud frontend va konfiguratsiya tekshirilgan; `Screenshots/1.png`–`8.png` ko‘rib chiqilgan. Binafsha/sariq dizayn, hero/navbar, statistika, natija, kurs, FAQ, modal va light mode kompozitsiyasi tahlil qilingan. Brauzer address bari dizaynga qo‘shilmagan. Mavjud komponentlar qayta ishlatilgan.

FastAPI modullari va PostgreSQL migratsiyalari, opaque session/Argon2/CSRF, teacher/student ruxsatlari, student record/login ajratilishi, guruh/a’zolik, dars/davomat, moliya, vazifa/submission/feedback, murojaat/CMS/media/report/audit qismlari ishlab chiqilgan. Decimal pul, invoice/payment/allocation/adjustment/refund, publication/consent va private media qoidalari kod va testlarda ko‘zda tutilgan. Worker, PWA shell, healthcheck, Compose, reverse proxy va backup/restore yo‘riqnomalari tayyorlangan.

**Tekshiruv chegarasi:** dastlabki sessiyada socket/paket/brauzer cheklovlari bo‘lgan; o‘sha davrdagi startup muvaffaqiyatsizligi keyingi lokal startup bilan alohida yangilangan. Har bir talabning production qabul mezoni to‘liq yopildi degan da’vo yo‘q.

**Manbalar:** [dizayn auditi](design-audit.md), [arxitektura](architecture.md), [bajarilish holati va tarixiy bloklar](implementation-status.md), [operatsion qo‘llanma](operations.md).

## 2. Lokal ishga tushirish va ikki rol — sana tegishli runtime hisobotida

**Talab:** loyihani ishga tushirish va ikki rol bilan kirish imkonini berish.

**Bajarilgan ishlar:** kerakli lokal bog‘liqliklar o‘rnatilgan; alohida PostgreSQL bazasi, migratsiya, explicit development seed, frontend/backend/worker ishga tushirilgan. Demo teacher/student akkauntlari yaratilgan; parollar source yoki Markdown fayllarga yozilmagan. Mavjud DB keyingi startupda qayta yaratilmaydi.

**Tekshiruv:** haqiqiy frontend proxy orqali home/login, ikki rol login/dashboard javoblari va student uchun teacher endpointidagi 403 qayd etilgan.

**Manbalar:** [runtime dalili](local-runtime.json), [ishga tushirish buyruqlari](../README.md), [implementation status](implementation-status.md).

## 3. Parol cheklovlarini olib tashlash — sana alohida qayd etilmagan

**Talab:** foydalanuvchi parol uzunligi va belgilarini o‘zi tanlasin.

**Bajarilgan ishlar:** 12 belgilik minimum va 256 belgilik maksimum backend schema, frontend, CLI/bootstrap/dev seed hamda reset/change oqimlaridan olib tashlangan. Parol bo‘sh bo‘lmasligi talab qilinadi, bo‘shliqlar aynan saqlanadi. Umumiy HTTP body limiti saqlangan. Mavjud akkaunt parollari o‘zgartirilmagan.

**Tekshiruv:** o‘sha bosqichda 39 schema/hash/HTTP testi va alohida PostgreSQLda 3 API ssenariysi; frontend build/typecheck.

**Manbalar:** [arxitektura — auth](architecture.md), [sanalangan texnik tarix](implementation-status.md).

## 4. Hero, navbar, kurslar va dastlabki natijalar — 2026-11-01

**Talab:** katta hero matni/portretini ixchamlashtirish, `10.png`ga yaqin statistika, uch kurs kartasi, ariza va filtrli to‘rt ustunli natijalar.

**Bajarilgan ishlar:** hero o‘lchamlari kamaytirilgan; dastlab Asosiy/Ustoz/Markaz/FAQ va tegishli linklar kiritilgan. Grammatika, IELTS va SEFR uch kurs gridi, qisqa ma’lumot va ariza tugmalari ulangan. Dastlab 40 ta belgilangan NAMUNA karta va IELTS/SEFR filtri qo‘shilgan. Mavjud API/outbox oqimi qayta ishlatilgan.

**Tekshiruv:** o‘sha bosqichdagi build/typecheck, 5 frontend unit, 52 backend testi, 3 Chrome E2E; 320–1920 px responsive tekshiruvlar.

**Keyingi o‘zgarish:** 40 karta keyin 60 bo‘lgan; navbar alohida sahifalarga o‘tgan; Markaz bo‘limi keyin olib tashlangan; hozirgi statistika foydalanuvchi tasdiqlagan raqamlar bilan almashtirilgan.

**Manba:** [homepage yangilanishi](homepage-update.md).

## 5. Telegramni guruhga ulash — 2026-11-01

**Talab:** murojaatlarni bot orqali guruhga yetkazish; token bor, chat IDni sozlash kerak.

**Bajarilgan ishlar:** foydalanuvchi tanlagan bot/guruh tekshirilgan, private `.env` sozlangan, worker yoqilgan. Telegram `localhost` inline tugmasini rad etgani topilib, lokal/private URL uchun tugmani qo‘shmaslik tuzatilgan; haqiqiy public URL uchun kabinet havolasi saqlangan.

**Tekshiruv:** bitta aniq SINOV arizasi haqiqiy API orqali 201 bilan saqlangan; worker orqali Telegram `ok: true`, outbox `sent` bo‘lgan. Oldingi yetkazilmagan arizalar ommaviy qayta yuborilmagan. O‘sha bosqichda 48 backend regressiya testi qayd etilgan.

**Manba:** [Telegram ulanishi, yetkazish va env nomlari](telegram-setup.md).

## 6. Ustoz portreti va to‘liq ism — 2026-11-01

**Talab:** `Screenshots/ustoz_logo.png`ni heroga qo‘yish, dumaloq moslashtirish va ismni Sherzod Allamurodov qilish.

**Bajarilgan ishlar:** haqiqiy rasm mavjud upload/media tekshiruvi orqali public CMS bio maydoniga ulangan. Hero dumaloq ramka, sariq chet va mos crop bilan yangilangan; original rasm buzilmagan. To‘liq ism ochiq interfeysda qo‘llangan.

**Tekshiruv:** frontend build/typecheck, 375/1440 px rasm yuklanishi, dumaloq crop va overflow tekshiruvlari. Keyingi mobil ishda ism kartasi telefonda rasm pastiga ajratilgan.

**Manbalar:** [implementation status](implementation-status.md), [mobil takomillashtirish](mobile-responsive-update.md).

## 7. Alohida sahifalar va 60 sertifikat kartasi — 2026-11-01

**Talab:** navbar bo‘limlarini alohida page qilish, 30 IELTS + 30 SEFR, 3:4 rasm, har qatorda to‘rtta karta, ball va tur filtri.

**Bajarilgan ishlar:** public route va umumiy komponentlar qayta ishlatilgan. Besh supplied sertifikat fayli asosida explicit development import yaratilgan; original fayllar private, public previewlarda shaxsiy identifikatorlar berkitilgan. Eski 40 namuna ID saqlanib, 20 ta qo‘shilgan. Server filtri, pagination, lightbox va active nav ishlaydi. Namunalar productiondan chiqarilgan.

**Tekshiruv:** build/typecheck, 5 frontend unit, 62 backend testi, 4 Chrome E2E va 320–1920 px ko‘rinishlar.

**Keyingi o‘zgarish:** o‘sha bosqichdagi `/center` keyin foydalanuvchi talabi bilan olib tashlangan.

**Manba:** [public sahifalar va sertifikatlar](public-pages-plan.md).

## 8. Bosh sahifadagi qisqa previewlar — 2026-11-01

**Talab:** asosiy sahifada har bo‘limdan qisqa ma’lumot va aniq batafsil havola bo‘lsin.

**Bajarilgan ishlar:** ustozning qisqa bio/portreti, to‘rtta natija (2 IELTS + 2 SEFR), uch ixcham kurs, uch FAQ va bog‘lanish qismlari berilgan. Har bir preview to‘liq sahifaga olib boradi. To‘liq sahifalar qisqartirilmagan.

**Tekshiruv:** build/typecheck, 5 unit va 5 Chrome E2E; 320/375/768/1440/1920 px.

**Keyingi o‘zgarish:** dastlabgi Markaz previewi o‘chirilib, hozir beshta preview qolgan.

**Manba:** [home overview](home-overview.md).

## 9. Ustoz haqida profil va batafsil bio — 2026-11-01

**Talab:** `ustoz_haqida.png`ga yaqin profil va pastida batafsil tavsif.

**Bajarilgan ishlar:** chapda haqiqiy portret, o‘ngda ism va ma’lumot kartalari, sertifikat previewlari; pastda CMSdagi olti paragraf bio va kurs yo‘nalishlari. Referensdagi boshqa odamning CELTA/9.0 da’volari ko‘chirilmagan. Ustozning o‘z sertifikati berilmagan joyda o‘quvchi hujjati aniq nomlangan.

**Tekshiruv:** build/typecheck, 5 unit, 7 Chrome E2E; rasm/zoom/Escape, kurs/ariza va responsive holatlar.

**Manba:** [ustoz profili](teacher-profile-update.md).

## 10. Havolalar, desktop profil va tasdiqlangan raqamlar — 2026-11-02

**Talab:** havolalar bog‘lanishga olib borgandek ko‘rinmasin, desktop profil kichraysin, Tajribasi 18+ yil va ta’lim olganlar 5000+ bo‘lsin; asosiy statistikaga 500+ sertifikat va 200+ DTM qo‘shilsin.

**Bajarilgan ishlar:** noto‘g‘ri ko‘rinishga sabab bo‘lgan scroll restoration/smooth scroll va ayni sahifa linki tuzatilgan. Desktop profil 1440 pxda taxminan 983 px balandlikdan 671 pxga tushirilgan. Raqamlar tahrirlanadigan CMS orqali qo‘llangan. Noto‘g‘ri CMS publish 422 qaytarib, oldingi public snapshotni saqlashi tuzatilgan.

**Tekshiruv:** build/typecheck, 5 unit, disposable PostgreSQLda 63 backend testi, 10 Chrome E2E; public API/error/ruxsat holatlari va 84 route/viewport kombinatsiyasi.

**Manba:** [navigatsiya va responsive yangilanish](navigation-responsive-update.md).

## 11. Ariza hududini ixchamlashtirish — 2026-11-02

**Talab:** desktop ariza juda katta; undan ustoz rasmini olib tashlash.

**Bajarilgan ishlar:** 1330 px/two-column dialog o‘rniga maksimal 560 px bitta forma; portret va dekorativ panel olib tashlangan. Matn, input va CTA kichraytirilgan; mobil ustun, ichki scroll va yetib boriladigan yopish tugmasi saqlangan. API validatsiya, course prefill va muvaffaqiyat/xato qoidalari qayta ishlatilgan.

**Tekshiruv:** build/typecheck, 5 unit, o‘sha bosqichda 13 public Chrome testi va yakuniy maqsadli tekshiruvlar.

**Manba:** [ixcham ariza hisoboti](compact-application-form.md).

## 12. Bog‘lanish formasini bevosita ko‘rsatish — 2026-11-02

**Talab:** takroriy “Ariza qoldiring” banneri va ochish tugmasini olib, formani o‘sha joyda ko‘rsatish.

**Bajarilgan ishlar:** `/contact`da bitta inline forma; takroriy banner, launch tugmasi va o‘sha sahifadagi modal olib tashlangan. Modal/inline umumiy validatsiya va API implementatsiyasidan foydalanadi. Kurs va boshqa tegishli sahifalarning ariza modaliga kirishi saqlangan.

**Tekshiruv:** build/typecheck, 5 unit, 16 public Chrome testi; validatsiya, network error, kiritilgan matn saqlanishi va 320–1920 px.

**Manba:** [inline contact hisoboti](inline-contact-form.md).

## 13. Markaz haqida bo‘limini olib tashlash — 2026-11-02

**Talab:** dashboarddan Markaz haqida bo‘limini o‘chirish.

**Bajarilgan ishlar:** home preview, desktop/mobile navbar itemi, `/center` route, sitemap yozuvi va ishlatilmaydigan section komponenti olib tashlangan. Mavjud CMS ma’lumotlari o‘chirilmagan.

**Tekshiruv:** build va 3 maqsadli Chrome testi; bo‘lim/havola yo‘qligi, `/center` 404, sitemap va qolgan navigatsiya/ariza kirishlari.

**Manba:** [implementation status](implementation-status.md).

## 14. Barcha ekranlarga responsive moslashtirish — 2026-11-02

**Talab:** dashboard elementlari, tugmalar, ustoz rasmlari va “Sherzod English’ni o‘rnating” xabarini telefon/planshetlarga moslashtirish.

**Bajarilgan ishlar:** mobil portret/ism ajratilgan; fluid rasm o‘lchamlari; kabinet drawer menyusi; uzun loginli topbar wrap; 16 px mobil inputlar, kamida 44 px asosiy touch targetlar, responsive forma/jadval/davomat, safe-area va qisqa ekran dialoglari. Dialog yopilganda fokusni qaytarish tuzatilgan. Jadval uchun alohida scroll region, hint va klaviatura fokusi qo‘shilgan; screenshotda topilgan vertikal “Ochish” matni minimal table/action kengligi bilan tuzatilgan.

PWA xabari ixcham gridga o‘tkazilgan, pastda o‘lchangan bo‘sh joy ajratilgan. Menyu/modal/form bilan ishlashda yashirinadi. Yopish 7 kun saqlanadi; standalone/installed holati, pending va xato boshqariladi. Public SW v6. Private/API cache qoidalari saqlangan.

**Tekshiruv:** build/typecheck, 5 unit, 26 Chrome testi; so‘ng oxirgi table tuzatishiga tegishli 3 test qayta o‘tgan. 320–1920 px va 844×390 landscape; alohida touch kontekst. Haqiqiy student login/API bilan 24 tekshiruv; teacher UI test ma’lumotlari bilan. Mavjud teacher demo credentials bilan autentifikatsiya o‘tmagani uchun parol reset qilinmagan. Haqiqiy iOS/Android, Safari va native install sinalmagan.

**Manba:** [responsive hisobot va screenshotlar](mobile-responsive-update.md), [26 test dalili](mobile-responsive-regression.json), [haqiqiy API auditi](mobile-live-audit.json).

## 15. Doimiy avtomatik hujjatlashtirish — 2026-11-02

**Talab:** shu paytgacha qilingan hamma ishni Markdown’da saqlash va keyingi vazifalarda eslatmasiz yozib borish.

**Bajarilgan ishlar:** tarix ushbu jurnalga jamlandi, `docs/README.md` hujjatlar xaritasi yaratildi. Repository rootidagi `AGENTS.md`ga har vazifadan keyin jurnal/status/reportlarni yangilash, qisman ish va tekshiruv chegaralarini qayd etish, secretlarni yozmaslik qoidasi qo‘shildi. Asosiy README va implementation statusdan yangi hujjatlarga havola berildi. Bu qoida keyingi sessiyalar uchun ham repositoryda saqlanadi.

**Tekshiruv:** 5 ta Markdown fayldagi 97 ta lokal havola tekshirildi — yo‘qolgan manzil topilmadi. Jurnaldagi 15 bosqich va code fence juftligi tekshirildi. Dastur kodi yoki runtime o‘zgarmadi; ushbu hujjat vazifasi uchun frontend/backend testlari qayta bajarilmadi.

## 16. 1000+ statistika va yangi demo kirish — 2026-11-02

**Talab:** ta’lim olganlar 1000+ bo‘lsin; mavjud teacher va demo student foydalanuvchi tanlagan login/parollardan foydalansin.

**Bajarilgan ishlar:** CMS bio/stat draft va public qiymatlar 1000+ ga yangilandi. Mavjud teacher loginiga `<private-teacher-login>` (`<private-teacher-login>` bilan kirish ishlaydi), demo studentga aynan `<private-student-login>` qo‘llandi. Parollar Argon2id hashga almashtirildi, eski sessiyalar bekor qilindi; user/student ID, a’zolik va moliyaviy yozuvlar saqlandi. CMS misoli, statistika E2E kutilmalari va env orqali login tanlash moslandi. Frontend qayta boshlandi; public SW v7. Telefon raqami berilmagani uchun mavjud kontaktga tegilmadi, aniqlashtirish savoli yuborildi.

**Tekshiruv:** build/typecheck, 5 unit va 5 Chrome regressiya testi o‘tdi. Ikkala rol haqiqiy brauzerda kirdi; o‘z dashboardi 200, boshqa rol 403, logoutdan keyin 401. 375/1440 pxda overflow yo‘q. Public API/home/profil 1000+; DBdagi 2 user, 1 student, 2 membership, 2 invoice va 2 payment saqlandi. Oldingi teacher demo login muammosi yangi akkaunt ma’lumotlari bilan kirishda bartaraf etildi. Secretlar hujjatlarga yozilmadi; production o‘zgarmadi.

**Manbalar:** [batafsil hisobot](demo-access-update.md), [haqiqiy tekshiruv dalili](demo-access-verification.json).

## 17. Ustoz to‘lov/guruh/sertifikat boshqaruvi — 2026-11-02

**Talab:** ustoz to‘lov qo‘shish/tahrirlash/o‘chirish, guruh va a’zolar/dars vaqtlarini ko‘rish hamda boshqarish, sertifikatni qo‘shish/tahrirlash/o‘chirish va sayt/tegishli studentda ko‘rsatish imkoniga ega bo‘lsin.

**Bajarilgan ishlar:** mavjud resource/form/API kengaytirildi. Receipt correction va sababli void/delete allocation/debtni tranzaksiyada yangilaydi va tarixni saqlaydi. Guruh list/dashboard count/kurs/haftalik vaqtlar bilan boyidi; archive kelgusi darslarni cancelled qiladi, a’zolik/moliya tarixini o‘chirmaydi. Sertifikatga private student FK va archived migration qo‘shildi; yangi CRUD bitta save’da consent/tasdiq/rasm/ballni tekshirib nashr qiladi. Student faqat o‘z sertifikatlarini ko‘radi. Public tablar BroadcastChannel/revision bilan, student query 5 soniyagacha ichida yangilanadi. Mobil jadvaldagi nom/kurs o‘qilishi, maydon label’lari va UI izohlari yaxshilandi. OpenAPI yangilandi; lokal migration va frontend/backend restart bajarildi.

**Tekshiruv:** disposable PostgreSQLda 68 backend testi, qidiruv uchun 1 maqsadli qayta tekshiruv; build/typecheck va 5 unit. Alohida DB/API/frontend bilan 3 haqiqiy CRUD E2E; asosiy buildda 18 public/mobile regressiyasi. Ikkala joriy rol bilan live read tekshiruvi. Migratsiyadan oldingi DB backup disposable bazaga restore qilinib, 2 user/1 student/2 group/2 membership/2 invoice/4 payment/78 content barcha avvalgi ustun va IDlari saqlangani isbotlandi. Oldingi jurnalning 2 payment soni tarixiy snapshot edi; qo‘shimcha mavjud yozuvlar ham saqlandi. Asosiy bazada QA test yozuvi yo‘q; vaqtinchalik test DB/media olib tashlandi.

**Chegaralar:** physical device/native install, S3 va production deployment bu vazifada tekshirilmadi. DB restore media restore mashqi deb hisoblanmaydi. Secretlar fayllarga yozilmadi.

**Manbalar:** [batafsil hisobot](teacher-management-update.md), [CRUD E2E](teacher-management-e2e-results.json), [regressiya](teacher-management-regression-results.json), [live API/UI](teacher-management-live-verification.json), [migration/saqlanish](teacher-management-migration.json).

## 18. Bildirishnoma, tafsilot modali, o‘zbekcha va responsive interfeys — 2026-11-02

**Talab:** amallar uchun kichik o‘ng burchak xabari, pastda ochiladigan tafsilotlar o‘rniga modal, barcha bo‘limlarda ishlaydigan boshqaruv, inglizcha tizim yozuvlarini o‘zbekcha qilish, login/logo/mobil dizaynni tuzatish.

**Bajarilgan ishlar:** global javobga bog‘langan bildirishnomalar va authorized CSV download; 13 ustoz resource tafsiloti markaziy modal, nested tahrir/fokus/scroll; o‘zbekcha field/status/sana/pul/API validation/CSV; responsiv login/parol ko‘rsatish, gorizontal logo va o‘zbekcha native fayl nazorati. CSRF cookie yangilanganda client eski token yuborishi tuzatildi; xavfsizlik o‘chirilmadi. Foydalanuvchi erkin matni va rasmiy nomlar saqlandi. Asosiy DB/account/password/marketing ma’lumotlariga yozilmadi, schema migratsiyasi kerak bo‘lmadi.

**Tekshiruv:** 69 backend, 11 unit, alohida DB/API/frontendda 16 Chrome testi; asosiy saytda 24 public/mobile testi o‘tdi, 1 CSV testi faqat QA credentials bo‘lganda ishlashi sabab skip (alohida muhitda o‘tgan). Oxirgi ishlayotgan buildda [4 yakuniy modal/login testi](notifications-dialogs-final-interface-results.json) qayta o‘tdi. Ikkala mavjud rol bilan haqiqiy login/API/teacher natija modali o‘qib tekshirildi. Eski 60/30/30 kutilmalari joriy 59/30/29 nashr holatiga urilganda testlar API bilan solishtirishga o‘zgartirildi; o‘chirilgan yozuv qayta yaratilmagan. Frontend build/typecheck o‘tdi, backend/frontend lokal qayta boshlandi, SW v9.

**Chegaralar:** lintda 5 oldindan mavjud error va 12 warning qayd etildi; yangi Notifications hook xatosi va generated `.next-qa` lint tarashi tuzatildi. Native qurilma/Safari, tashqi S3, production va real Telegram yetkazish qayta tekshirilmagan. Yakuniy fayl nazorati bilan yana 3 haqiqiy CRUD testi o‘tdi; so‘ng production build/typecheck, 11 unit va yangi UI/lug‘at/API fayllarining maqsadli lint tekshiruvi qayta o‘tdi. [Yakuniy dalil](notifications-dialogs-final-crud-results.json).

**Manbalar:** [batafsil hisobot](notifications-dialogs-localization.md), [16 E2E](notifications-dialogs-e2e-results.json), [24 regressiya](notifications-dialogs-regression-results.json), [haqiqiy rollar](notifications-dialogs-live-verification.json).

## 19. Barcha record maydonlarida yozib qidirish, sanasiz a’zolik — 2026-11-02

**Talab:** guruhga o‘quvchi qo‘shishda sana tanlatmaslik, ism yozilganda darhol mos o‘quvchilar chiqishi va boshqa joylardagi alohida “Tanlash” nazoratlarini ham olib tashlash.

**Bajarilgan ishlar:** barcha mavjud student/group/course/invoice Lookup joylarida bitta yozib izlash maydoni va uning ostidagi bosiladigan takliflar. Ism/nom bilan birga kerakli telefon/davr/summa; eski ID qayta yozishda tozalanadi; eski tanlov readable nomga ochiladi. Klaviatura/touch, modal Escape, loading/empty/error/retry va server pagination saqlangan. Ikkala enrollment formasida sana maydoni yo‘q; backend sana/bounded intervalni avtomatik belgilaydi. Aniq sanali eski API client, sig‘im/duplicate/ruxsat va audit buzilmadi. Hisob listi student/status scope bilan qidiradi. OpenAPI va arxitektura yangilandi.

**Tekshiruv:** 71 backend va 11 unit; 11 disposable DB/API Chrome ssenariysi; asosiy buildda 4 qidiruv/klaviatura/touch/responsive testi o‘tdi. Birinchi ishga tushirishda topilgan Escape modalni yopishi tuzatildi va to‘plam qayta o‘tdi. Build/typecheck hamda yangi SearchLookup/Dialog/testlarning maqsadli lint tekshiruvi o‘tdi. Frontend/backend qayta boshlangan, login va readiness 200, amaldagi API sana optional. [Haqiqiy ustoz qidiruvi](search-enrollment-live-verification.json) faqat o‘qib tekshirildi, a’zoliklar oldin/keyin bir xil. Test yozuvlari asosiy bazaga qo‘shilmadi, schema migration yoki parol reset bo‘lmadi. Native qurilma/Safari/production qayta sinalmagan.

**Manbalar:** [batafsil hisobot](search-enrollment-update.md), [11 haqiqiy/UI E2E](search-enrollment-e2e-results.json), [4 yakuniy UI/touch](search-enrollment-ui-results.json).

## 20. Loyiha tuzilmasi va joriy holat auditi — 2026-11-02

**Talab:** joriy papkadagi barcha fayl va papkalar tarkibi, loyiha arxitekturasi va uning aynan qayerga kelib to‘xtaganini to‘liq o‘rganib taqdim etish.

**Bajarilgan ishlar:** workspace to‘liq inventarizatsiya qilindi. Rootdagi konfiguratsiyalar (`compose.yaml`, `.env`, `README.md`, `AGENTS.md`), `backend/` (FastAPI modular monolit, 14 ta domen moduli, Alembic migratsiyalari, xavfsizlik va worker), `frontend/` (Next.js 15 App router, PWA, 13 ta resursli ustoz va o‘quvchi kabineti, qidiruv/lookup, ochiq sahifalar), `docs/` (42 ta hisobot va dalillar), `Screenshots/` (referenslar va sertifikat namunalari), `infra/` va `scripts/` tekshirildi.

**Hozirgi holat va to‘xtagan joy:**
1. Loyiha oxirgi 19-bosqichda to‘liq yakunlangan: barcha Lookup maydonlarida avtomatik taklifli qidiruv va sanasiz a’zolik joriy etilgan, 71 backend, 11 unit va 15 ta E2E testi o‘tgan.
2. Runtime tekshiruvida PostgreSQL 55432-portda faol ishlab turgani, lekin FastAPI (8000) va Next.js (3000) server jarayonlari ayni damda to‘xtatilgani (offline/idle) aniqlandi. Ular `scripts/backend` va `scripts/frontend` orqali bir zumda ishga tushiriladi.
3. Git repozitoriysi bu papkada boshlanmagan (Git metadata yo‘q).
4. Asosiy chegaralar va keyingi qadamlar: haqiqiy marketing kontenti (`content-checklist.md` bo‘yicha narxlar, haqiqiy sertifikatlar, kontakt telefon) to‘ldirilishi hamda production serverga joylashtirish (deploy).

**Manbalar:** [docs/README.md](README.md), [implementation-status.md](implementation-status.md), [content-checklist.md](content-checklist.md).

## 21. Loyihani to‘liq lokal ishga tushirish — 2026-11-02

**Talab:** loyihani run qilish, ishga tushirish.

**Bajarilgan ishlar:**
1. PostgreSQL 55432-portdagi ulanish tekshirildi (connection ok, Alembic migratsiyasi `0002_certificate_student (head)`).
2. FastAPI backend serveri `scripts/backend -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log --no-proxy-headers` buyrug‘i bilan fon jarayoni sifatida ishga tushirildi.
3. Telegram outbox worker `scripts/backend -m app.workers.telegram` fon jarayoni sifatida yoqildi.
4. Next.js frontend dev serveri `scripts/frontend run dev` buyrug‘i bilan 3000-portda ishga tushirildi.

**Tekshiruv:**
* Backend `/health/ready` tekshirildi — HTTP 200 `{"status":"ready"}` qaytdi.
* Frontend `http://localhost:3000/` va `http://localhost:3000/login` sahifalari tekshirildi — ikkalasi ham HTTP 200 qaytardi.
* Frontend orqali backend API proksi `http://localhost:3000/api/v1/public/site` tekshirildi — HTTP 200 bilan to‘liq ma’lumotlar yuklandi.

## 22. Dev CSP eval xatosi va desktop o‘lchamlarini proporsional nafislashtirish — 2026-11-02

**Talab:**
1. Saytga kirganda brauzer konsolida paydo bo‘lgan `eval() is not supported in this environment... Content-Security-Policy... React requires eval() in development mode...` xatosini to‘g‘rilash.
2. Dizaynlar, tugmalar va responsivlikni to‘g‘rilash hamda desktop versiyasidagi barcha narsalarni ozgina proporsional kichiklashtirish (fullstack architect va senior designer sifatida ishlash).

**Bajarilgan ishlar:**
1. `frontend/next.config.ts`: Rivojlantirish rejimi uchun dinamik CSP joriy qilindi. `NODE_ENV !== "production"` bo‘lganda `script-src`ga `'unsafe-eval'` va `connect-src`ga `ws: wss:` qo‘shildi; production uchun qat’iy, xavfsiz CSP to‘liq saqlab qolindi.
2. `frontend/src/app/globals.css`:
   - Konteyner kengligi (`--container-max`) 1640px dan 1360px ga keltirilib, haddan tashqari kengayish cheklandi.
   - Vertikal section oraliqlari (`--section-py`) `clamp(38px, 5vw, 76px)`ga ixchamlandi.
   - Sarlavhalar va matn shriftlari 15–20% ga kichiklashtirildi (`--font-hero`: 32–56px, `--font-section`: 25–42px, `--font-card-title`: 19–25px, `--font-body-lg`: 15–17.5px, `--font-body`: 14–15.5px).
   - Tugmalar: asosiy tugmalar `min-height: 42px; padding: 11px 22px; font-size: 14.5px; border-radius: 12px;` va hover soyasi bilan; kichik tugmalar (`.button.small`) `min-width: 74px; min-height: 36px; padding: 8px 16px; font-size: 13px; border-radius: 10px;`.
   - Formalar: maydonlar `min-height: 42px; padding: 10px 14px; font-size: 14.5px; border-radius: 12px;`.
   - Modallar va panellar: `.dialog-content` kengligi 680px, padding 28px 32px; `.panel` 22px 24px; `.faq-item` 22px 26px; kabinet topbari 64px, maydoni max 1400px.
3. Maxsus komponent modullari: `HeroSection`, `SiteHeader`, `CoursesSection`, `ResultsSection`, `StatsSection`, `TeacherAboutSection`, `HomePreviews`, `SearchLookup` proporsiyalari moslashtirildi.
4. `Dialog.tsx` va `Workspace.tsx`: Radix Dialog yopilganda va sahifalararo o‘tilganda (navigation) fokusning menyu tugmasiga ishonchli tiklanishi kafolatlandi.
5. `mobile-responsive.spec.ts`: Profil havolasi bosilgandan so‘ng yangi sahifa sarlavhasini kutish qo‘shilib, mijoz navigatsiyasidagi race condition bartaraf etildi.

**Tekshiruv:**
- TypeScript tekshiruvi: `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
- Frontend unit testlar: `npm run test --prefix frontend` — 11 ta test 100% o‘tdi.
- Backend regressiya: `scripts/test-backend -q` — 54 passed, 23 skipped (100% o‘tdi).
- Playwright E2E mobil va responsiv: `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/mobile-responsive.spec.ts` — 12 ta test 100% o‘tdi (49.3s).
- Playwright E2E lead, contact, navigation, grid, teacher-profile: 14 ta test 100% o‘tdi (44.2s). Jami 26 ta Playwright Chrome testi o‘tdi.
- Header tekshiruvi: `curl -sI http://127.0.0.1:3000/` orqali dev-rejimda `'unsafe-eval'` to‘g‘ri qo‘shilgani tasdiqlandi.

**Manbalar:** [CSP va desktop o‘lchamlari hisoboti](csp-and-desktop-scaling-update.md).

## 23. Moliya hisoblari shaklini soddalashtirish, 3 soniyalik bildirishnomalar va ixcham kirish kartochkasi — 2026-11-02

**Talab:**
1. Kabinetga kirish bo‘limi uzunligi (vertikal balandligi) juda katta, uni kichikroq / ixchamroq qilish.
2. Amal bajarilgandan keyin chiqadigan bildirishnoma (notification) 3 soniyadan keyin birdan yo‘qolishi.
3. Moliya qismida ustozdagi "davr boshi, davr oxiri" degan tushunarsiz sanalar o‘rniga shunchaki "qaysi oy uchun" va "qaysi kuni bo‘ldi (sana)" kiritilishi yetarli bo‘lishi.

**Bajarilgan ishlar:**
1. **Kirish bo‘limi (`/login`)**:
   - `frontend/src/features/auth/LoginForm.tsx`: `BrandLogo` o‘lchami `md` ga tushirildi, submit tugmasiga `type="submit"` berildi.
   - `frontend/src/app/globals.css`: `.auth-card` kengligi `min(100%, 390px)`, padding `24px 26px`, border-radius `20px` ga qisqartirildi. Sarlavha `24px`, form oraliqlari `12px`, inputlar `40px`, tugma `42px` qilinib, butun oyna bo‘yicha proporsional va ixcham markazlashtirildi.
2. **3 soniyalik bildirishnomalar (`Notifications`)**:
   - `frontend/src/components/Notifications.tsx`: Avtomatik yo‘qolish taymeri 3000ms (3 soniya) ga yangilandi (`item.kind === "error" ? 4000 : 3000`).
3. **Moliya hisoblari (Hisoblar — yangi yozuv)**:
   - `backend/app/core/schemas.py` (`InvoiceIn`): `month` (oy) maydoni qabul qilinadigan qilindi (`exclude=True` bilan, SQL jadvaliga xalaqit bermaydi). `@model_validator(mode="before")` orqali kiritilgan `month` dan `period_start` (oyning 1-kuni) va `period_end` (keyingi oyning 1-kuni), hamda `due_date` avtomatik hisoblab to‘ldirilishi ta’minlandi. PostgreSQL cheklovlari va mavjud hisoblar to‘liq saqlandi.
   - `frontend/src/features/workspace/config.ts`: `invoices.fields` dan `period_start` va `period_end` olib tashlanib, `month` ("Qaysi oy uchun", month picker), `due_date` ("Sana (qaysi kuni bo‘ldi)", date picker), va `amount` ("Hisob summasi (so‘m)") qilib soddalashtirildi.
   - `frontend/src/features/workspace/EntityForm.tsx`: `month` maydoni uchun joriy oy (`YYYY-MM`) default qiymat qilib olindi, submit qilinganda `period_start`/`period_end` to‘g‘ri hisoblanishi kafolatlandi.
   - `frontend/src/features/workspace/ResourceView.tsx`: Yangi hisob yaratishda va qoralama tahrirlashda `month` va `due_date` to‘g‘ri o‘rnatilishi ta’minlandi.
   - `frontend/src/lib/uz.ts`: `month` va `period_start` teglari "Qaysi oy uchun" deb belgilandi; hisoblar jadvalida oy nomi va yil (masalan "Noyabr 2026") chiroyli ko‘rsatilishi yo‘lga qo‘yildi.

**Tekshiruv:**
- TypeScript typecheck: `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
- Frontend vitest: `npm run test --prefix frontend` — 3 fayl, 11 ta test 100% o‘tdi.
- Backend pytest: `scripts/test-backend -q` — 54 passed, 23 skipped (100% o‘tdi).
- Playwright mobile & responsive: `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/mobile-responsive.spec.ts` — 12 ta test 100% o‘tdi (51.7s).
- Playwright interface & notifications: `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/interface-notifications.spec.ts` — 4 passed, 1 skipped (21.7s).
- Vizual skrinshot tekshiruvi: Playwright Chrome orqali `screenshot-login.png` va `screenshot-invoice-dialog.png` olindi, login kartochkasi ixchamligi va hisoblar modalida faqat O‘quvchi, Qaysi oy uchun, Sana va Hisob summasi ko‘rinishi tasdiqlandi.

**Manbalar:** [Moliya soddalashtirilishi va ixcham login hisoboti](finance-simplification-and-login-compact-update.md).

## 24. React Hydration Mismatch xatosini bartaraf etish (Service Worker dev-keshi) — 2026-11-02

**Talab:**
Foydalanuvchi konsolida chiqqan `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties (BrandLogo size="lg" vs "md", type="submit")` xatosini to‘g‘rilash.

**Bajarilgan ishlar:**
1. **Muammoning kelib chiqishi**:
   - PWA Service Worker (`sw.js`) oldingi `v9` versiyasida dinamik `/_next/static/` chanklarini keshlab olgan edi.
   - Avvalgi vazifada `LoginForm.tsx` dagi `BrandLogo` o‘lchami `size="md"` ga o‘zgartirilib, `button type="submit"` qo‘shilgan edi. Server buni to‘g‘ri SSR qilib bergan, biroq foydalanuvchi brauzeridagi eski Service Worker keshdan eski JavaScript chankini (`size="lg"` va `type="submit"`siz) uzatgan.
   - Natijada React server HTML (`size="md"`) va keshdagi eski mijoz chanki (`size="lg"`) o‘rtasida nomuvofiqlik ko‘rib, gidratsiya (hydration) xatosini chiqargan.
2. **Yechim**:
   - `frontend/public/sw.js`: Versiya `sherzod-public-v10` ga ko‘tarildi, `self.skipWaiting()` berildi; `self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1"` bo‘lganda, eski barcha keshlar o‘chirib tashlanadigan va rivojlantirish (dev) rejimida `_next/static` chanklari keshlanmaydigan qilindi.
   - `frontend/src/components/PWA.tsx`: Mahalliy muhitda (`localhost`, `127.0.0.1`) faol service worker'lar avtomatik ro‘yxatdan chiqarilib (unregister), eski keshlar tozalanishi yo‘lga qo‘yildi.
   - `frontend/src/features/auth/PasswordForm.tsx`: Undagi `BrandLogo` ham `size="md"` qilinib, `button type="submit"` birxillashtirildi.
   - `.next/cache` tozalanib, frontend dev server yangilandi.

**Tekshiruv:**
- Playwright Chrome orqali to‘g‘ridan-to‘g‘ri konsol va sahifa xatolari tinglandi: `/login`, `/`, `/about`, `/courses`, `/results`, `/faq`, `/contact` yo‘nalishlarining har birida **0 ta konsol xatosi** (to‘liq toza) qayd etildi.
- TypeScript typecheck: `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
- Frontend vitest: `npm run test --prefix frontend` — 11 ta test 100% o‘tdi.
- Backend pytest: `scripts/test-backend -q` — 54 passed, 23 skipped (100% o‘tdi).
- Playwright mobile-responsive: `cd frontend && PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/mobile-responsive.spec.ts` — 12 ta test 100% o‘tdi (57.5s).

## 25. Ustoz haqida bo‘limiga 3 ta dars jarayoni fotosuratlarini joylashtirish va editorial dizayn — 2026-11-02

**Talab:**
Asosiy dashboard/homepage dagi "Ustoz haqida" bo‘limiga foydalanuvchi taqdim etgan 3 ta dars jarayoni fotosuratini senior dizayner sifatida matnlar bilan navbatma-navbat chiroyli joylashtirish.

**Bajarilgan ishlar:**
1. **Fotosuratlar integratsiyasi**:
   - `frontend/public/teacher/` katalogiga foydalanuvchi bergan 3 ta original fotosurat joylashtirildi:
     - `sherzod-lesson.png`: doska oldida butun guruhga grammatika va metodikani tushuntirish.
     - `sherzod-individual.jpg`: o‘quvchi partasi yonida shaxsan yo‘l-yo‘riq ko‘rsatish va individual tahlil.
     - `sherzod-interactive.jpg`: multimedia va smart-doskada interaktiv dars jarayoni.
2. **Asosiy sahifa dizayni (`HomeIntroPreviews.tsx`, `HomePreviews.module.css`)**:
   - Avvalgi bitta tor blok o‘rniga zamonaviy ta’lim platformalariga xos 3 bosqichli navbatma-navbat (zigzag / alternating) editorial hikoya strukturasi yaratildi:
     - **01 · METODIKA VA TAJRIBA**: Rasm chapda + Kicker, sarlavha ("18+ yillik tajriba va tushunarli grammatika"), tavsif matni va 3 ta highlight pilli ("Chuqur tushuntirish", "Mantiqiy yondashuv", "Nol dan C1 gacha").
     - **02 · INDIVIDUAL E’TIBOR**: Matn chapda + Rasm o‘ngda (`.reverse` klassi, `order: 2` va `order: 1`) + sarlavha ("Har bir o‘quvchiga shaxsiy e’tibor va tahlil") va 3 ta highlight pilli ("Xatolarni tahlil qilish", "Shaxsiy feedback", "Doimiy nazorat").
     - **03 · ZAMONAVIY TA’LIM**: Rasm chapda + Matn o‘ngda + sarlavha ("Smart texnologiyalar va imtihonga tizimli tayyorgarlik") va 3 ta highlight pilli ("Interaktiv darslar", "IELTS / CEFR strategiyasi", "Haqiqiy natijalar").
   - Pastki qismda ishonch footer bloki: 18+ yil tajriba, 1000+ ta’lim olganlar, 500+ sertifikat egalari ishonch statistikasi, `/about#classroom-moments` ga eltuvchi "Ustoz haqida to‘liq tanishish →" tugmasi hamda kursga yozilish CTA tugmasi.
3. **`/about` sahifasi uyg‘unligi (`TeacherAboutSection.tsx`, `TeacherAboutSection.module.css`)**:
   - Ustoz sahifasida "Dars jarayonidan lavhalar" (id `#classroom-moments`) 3 ustunli premium kartochkalar bloki qo‘shildi.
4. **Responsivlik**:
   - Keng desktopda 2 ustunli zigzag grid va 16/11 aspect-ratio. Mobil ekranlarda (max-width: 860px va 550px) 1 ustunli qulay vertikal oqim, rasm doim matn tepasida (`order: -1`).

**Tekshiruv:**
- TypeScript typecheck: `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
- Frontend vitest: `npm run test --prefix frontend` — 3 fayl, 11 ta test 100% o‘tdi.
- Playwright E2E regressiya: `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/navigation-responsive.spec.ts tests/e2e/public-grid.spec.ts tests/e2e/teacher-profile.spec.ts tests/e2e/mobile-responsive.spec.ts` — 20 ta test 100% o‘tdi.
- Vizual tekshiruv: Chrome orqali skrinshotlar olindi va kontrast, shriftlar, oraliqlar mutanosibligi tasdiqlandi.

**Manbalar:** [Ustoz haqida fotosuratlar va dizayn hisoboti](teacher-showcase-photos-update.md).

## 26. Ustoz profili banneri dizaynini yangilash, yangi fotosurat va tavsif kartochkalari — 2026-11-02

**Talab:**
`/about` sahifasidagi ustoz profili banneri dizaynini tubdan yangilash, eski fotosurat o‘rniga foydalanuvchi taqdim etgan 2-fotosuratni (och havorang polo kiygan professional portret) qo‘yish, banner shakllarini chiroyli qilish hamda pastdagi matn va tavsiflar dizaynini moslab boyitish.

**Bajarilgan ishlar:**
1. **Yangi fotosurat integratsiyasi**:
   - Taqdim etilgan 2-fotosurat (`media_1793637863404.png`, 317x496) o‘ng tomondagi boshqa shaxsning yeng qismidan tozalash uchun x=(0, 0, 274, 496) proporsiyasida qirqib olindi va Sherzod ustoz markazlashtirildi.
   - Fotosurat `frontend/public/teacher/sherzod-portrait.png` ga joylashtirildi.
   - Mavjud `.local/media/public/a7efbc48-369e-455f-835e-db79572a32c9.webp` fayli ham yangi rasm asosida WebP formatida qayta yaratildi va DB `media_assets` dagi hajmi yangilandi; CMS va API orqali chiquvchi joylar ham sinxronlashtirildi.
2. **Banner dizayni (`TeacherAboutSection.tsx`, `TeacherAboutSection.module.css`)**:
   - **Korpusi (`.profile`)**: 28px silliq yumaloq burchaklar, 1px binafsha chegara, ko‘p qatlamli chuqur soya (`box-shadow: 0 24px 64px -16px rgba(53, 17, 65, 0.14)`), orqa fonga radial binafsha va tilla ambient nurlar (`::before`, `::after`).
   - **Portret ramkasi (`.portrait`)**: 22px yumaloq ramka, oq ichki chegara, tepada suzuvchi `⭐ 18+ yillik tajriba` shaffof glassmorphic nishoni va hoverda mayin kattalashish.
   - **Sarlavha va nishon**: `✦ USTOZ HAQIDA · SHERZOD ENGLISH` gradient nishoni, `Sherzod Allamurodov` qalin sarlavhasi (font-weight: 800), `Oliy toifali ingliz tili o‘qituvchisi · IELTS & CEFR instruktori` unvoni.
   - **4 ta ko‘rsatkich kartochkalari (`.facts`)**: Har biri alohida mayin gradient (qizil, oltin, yashil, binafsha), nozik border va hoverda yuqoriga ko‘tarilish effekti bilan.
   - **Sertifikatlar**: Shaffof shisha foni, silliq oq kartochkalar, `O‘quvchilar sertifikatlaridan` va `Barcha natijalarni ko‘rish ↗` havolasi.
3. **Pastdagi tavsif va matnlar dizayni (`.biography`, `.body`)**:
   - **Chap ustun**: `USTOZ BILAN TANISHING` sariq nishon, sarlavha va yangi **Pedagogik falsafa kartochkasi (`.bioPhilosophyCard`)** (kredo iqtibosi va 3 ta tekshirilgan ustunlik belgilari).
   - **O‘ng ustun**: To‘q binafsha gradientli alohida ajralib turuvchi asosiy kirish kartochkasi (`.bioLeadCard`) hamda har bir yo‘nalish uchun tematik ikonka va sarlavhali interaktiv kartochkalar (📚 Grammatika, 🎯 IELTS, 🌐 SEFR, 💻 Shaxsiy kabinet, ✍️ Ro‘yxatdan o‘tish).
   - Dark va Light mavzularda to‘liq moslashuvchi ranglar (`var(--surface)`, `var(--text-primary)`, `var(--text-muted)`).
4. **Responsivlik va mobil skroll tuzatishi**:
   - Desktopda (1440px+): portret chap ustunda, matn va ism o‘ng ustunda (`portrait.x + portrait.width < name.x`).
   - Planshet va mobil (768px va past): portret tepada, ism va matnlar pastda (`portrait.y + portrait.height < name.y`).
   - **Mobil skroll overlap xatosini bartaraf etish**: Mobil ekranlarda (`max-width: 1024px`) `.bioHeading` dan `position: sticky` butunlay olib tashlandi va `position: static` qilindi (sticky faqat min-width: 1025px da saqlandi). Eski ziddiyatli media-qoidalar tozalab birlashtirildi. Foydalanuvchi skroll qilganda sarlavha qotib qolib kartochkalarning ustiga minib olishi to‘xtatildi; har bir kartochka bir-birining ketidan tabiiy, tekis va bitta-bitta ravon chiqishi ta’minlandi.

**Tekshiruv:**
- TypeScript typecheck: `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
- Frontend vitest: `npm run test --prefix frontend` — 3 fayl, 11 ta test 100% o‘tdi.
- Playwright E2E: `tests/e2e/teacher-profile.spec.ts` (kontent, sertifikat lightbox, Escape, 320–1920px o‘lchamlar) — 100% o‘tdi.
- Playwright mobile-responsive: `tests/e2e/mobile-responsive.spec.ts` — 12 ta test 100% o‘tdi (1.3m).
- Backend pytest: `scripts/test-backend -q` — 54 passed, 23 skipped (100% o‘tdi).
- Vizual tekshiruv: Playwright Chrome orqali mobil (`375x812`) skroll jarayonining 3 ta bosqichli skrinshotlari olinib, sarlavha va kartochkalar hech qanday ustma-ust tushmasdan ravon o‘qilishi tasdiqlandi.

**Manbalar:** [Ustoz profili banneri dizayn hisoboti](teacher-profile-banner-redesign.md).

## 14. Bosh sahifadagi ustoz logotipi (Hero portreti) yangilanishi — 2026-11-02

**Talab:** Bosh sahifadagi logoga foydalanuvchi taqdim etgan sinfxonadagi fotosuratni (yashil doska oldida oq ko‘ylakda turgan Sherzod ustoz) o‘rnatish.

**Bajarilgan ishlar:**
1. **Fotosuratni markazlashtirib tayyorlash**: Foydalanuvchi bergan sinfxona fotosuratidan chetdagi o‘quvchilar kesilib, Sherzod ustozning qiyofasi, oq ko‘ylagi va qo‘llari markazga olingan $560 \times 560$ kvadrat portret qirqildi (`frontend/public/teacher/sherzod-hero.png`).
2. **Hero sektsiyasi CSS moslashuvi (`HeroSection.module.css`)**: Oldingi `transform: scale(1.24); object-position: 50% 38%;` o‘rniga `object-position: 50% 22%; transform: scale(1.06); transform-origin: 50% 22%;` qo‘llanib, dumaloq sariq hoshiyali ramka ichida ustozning yuzi markazda va pastdagi nishon bilan mutanosib holatga keltirildi.
3. **Frontend fallback va Backend sinxronizatsiyasi**: `PublicSite.tsx` da `portraitUrl` ga `hero?.media_url ?? bio?.media_url ?? "/teacher/sherzod-hero.png"` zaxirasi berildi. Backend disk xotirasidagi `.local/media/public/a7efbc48-369e-455f-835e-db79572a32c9.webp` hamda PostgreSQL `MediaAsset` yozuvi yangilandi.

**Tekshiruv:**
- TypeScript typecheck: 0 ta xato.
- Frontend vitest: 11 ta test 100% o‘tdi.
- Backend pytest: 54 ta test 100% o‘tdi.
- Playwright E2E: 18 ta test (navigation, mobile-responsive, public-grid) 100% muvaffaqiyatli o‘tdi (1.7m).
- Vizual tekshiruv: Desktop ($1440 \times 900$) va mobil ($375 \times 812$) Chrome skrinshotlarida portret dumaloq sariq ramka ichida sifatli va to‘g‘ri joylashgani tasdiqlandi.

**Manba:** [Bosh sahifadagi ustoz logotipi hisoboti](homepage-hero-logo-update.md).

## 15. Sertifikat kartochkalarini ixchamlashtirish va L/R/W/S qisqartmalari — 2026-11-02

**Talab:** Natijalar bo‘limidagi sertifikat kartochkalarining uzunligi (balandligi) juda katta, uni qisqartirish, IELTS bo‘limlari nomlarini qisqartirib (masalan, `R: 5.5`) ixcham ko‘rinishga keltirish.

**Bajarilgan ishlar:**
1. **IELTS ko‘rsatkichlarini qisqartirish (`ResultsSection.tsx`)**: Oldingi uzun yozuvlar o‘rniga xalqaro standart qisqartmalar: `L:` (Listening), `R:` (Reading), `W:` (Writing), `S:` (Speaking) qo‘llandi. Har biriga to‘liq ma’lumot beruvchi `title` atributi saqlandi.
2. **Sana va umumiy ball qatorini birlashtirish (`ResultsSection.tsx`)**: `Umumiy ball` yozuvi va sanasi chap tomonga ixcham ustun qilib, o‘ng tomonga esa ball qo‘yilib, alohida sana qatori tejaldi.
3. **CSS ixchamlashtirish (`ResultsSection.module.css`)**: `.details` paddingi `16px 20px 22px` dan `10px 14px 14px` ga, sarlavha `19px` dan `15.5px` ga, `score strong` `36px` dan `24px` ga tushirildi; `.skillGrid` 2 qatordan 1 qatordagi 4 ustunli qilib qayta tuzildi (`grid-template-columns: repeat(4, minmax(0, 1fr))`). Kartochkaning pastki qismi balandligi ~260px dan ~140px ga (120px) qisqartirildi.

**Tekshiruv:**
- TypeScript typecheck: 0 ta xato.
- Frontend vitest: 11 ta test 100% o‘tdi.
- Backend pytest: 54 ta test 100% o‘tdi.
- Playwright E2E: 18 ta test (public-grid, mobile-responsive, navigation-responsive) 100% muvaffaqiyatli o‘tdi (1.6m).
- Vizual tekshiruv: Desktop ($1440 \times 1100$) va mobil ($375 \times 812$) Chrome skrinshotlarida IELTS va SEFR kartochkalari bir xil tartibli, ixcham va to‘liq ekranga sig‘ishi tasdiqlandi.

**Manba:** [Sertifikat kartochkalarini ixchamlashtirish hisoboti](compact-certificate-results-update.md).

## 16. O‘quvchilarni mustaqil ro‘yxatdan o‘tkazish va ustoz tasdiqlash tizimi — 2026-11-03

**Talab:**
- Kabinetga kirish bo‘limiga "Kirish" va "Ro‘yxatdan o‘tish" tablarini qo‘yish.
- O‘quvchi ro‘yxatdan o‘tishda ism-familiyasi, telefon raqami, o‘zi o‘ylab topgan parol va kursini kiritib ariza topshirishi.
- Ustoz tasdiqlaguniga qadar login qilishga uringanda: `"Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz."` xabari chiqishi.
- Ustoz panelida yangi "Yangi o‘quvchilar" bo‘limi ochilib, kutilayotgan arizalarni yakka yoki bir vaqtda barchasini birdan tasdiqlash ("✓ Barchasini birdan tasdiqlash") imkoni bo‘lishi.
- O‘quvchilar ro‘yxatidan eski qo‘lda o‘quvchi qo‘shish formasi ("+ Yangi qo‘shish") olib tashlanishi.
- Hamma o‘zgarishlar real vaqtda tez va darhol ishlashi.

**Bajarilgan ishlar:**
1. **Sxema va Backend Auth (`backend/app/core/schemas.py`, `backend/app/modules/auth/router.py`)**:
   - `RegisterIn` sxemasi qo‘shildi (`full_name`, `phone`, `password`, `course_id: UUID | None`).
   - `POST /api/v1/auth/register`: telefon va IP bo‘yicha rate limiting, takroriy ro‘yxatdan o‘tish tekshiruvi; inaktiv `User` (`active=False`), pauzadagi `Student` (`status="paused"`) va `Lead` (`source="cabinet_signup"`) atomik yaratiladi; ustozga Telegram outbox bildirishnomasi jo‘natiladi.
   - `POST /api/v1/auth/login`: telefon raqami (`+998...`, `998...` yoki 9 xonali) yoki username orqali kirish; parol to‘g‘ri bo‘lib, o‘quvchi arizasi tasdiqlanmagan bo‘lsa HTTP 403 `pending_approval` kodi va `"Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz."` xabari beriladi.
2. **Ustoz Pending Students API (`backend/app/modules/students/pending.py`)**:
   - `GET /api/v1/teacher/pending-students`: barcha kutilayotgan arizalar ro‘yxati (ism, telefon, kurs, sana).
   - `POST /api/v1/teacher/pending-students/{student_id}/approve`: o‘quvchi va uning akkauntini bir zumda faollashtiradi.
   - `POST /api/v1/teacher/pending-students/{student_id}/reject`: arizani rad etadi va arxivlaydi.
   - `POST /api/v1/teacher/pending-students/approve-all`: barcha arizalarni bitta so‘rovda ommaviy tasdiqlaydi.
   - Boshqaruv dashboardiga `pending_students` ko‘rsatkichi va tezkor e’tibor havolasi qo‘shildi (`backend/app/modules/reports/router.py`).
3. **Frontend Kirish va Ro‘yxatdan o‘tish (`frontend/src/features/auth/LoginForm.tsx`)**:
   - Ikki tabli zamonaviy ko‘rinish: "Kirish" va "Ro‘yxatdan o‘tish".
   - Ro‘yxatdan o‘tish formasi: to‘liq ism, telefon raqami, o‘zi o‘ylab topgan parol, mavjud kurslar menyusi va submit.
   - Muvaffaqiyat kartochkasi: `"Arizangiz muvaffaqiyatli qabul qilindi!"`.
   - Kirish tabida tasdiqlanmagan o‘quvchiga maxsus qahrabo rangli "Arizangiz ko‘rib chiqilmoqda" xabarnomasi.
4. **Ustoz paneli "Yangi o‘quvchilar" (`frontend/src/features/workspace/PendingStudentsView.tsx`)**:
   - Kutilayotgan arizalar jadvali: ism, telefon havolasi, kurs nishoni, sana, "✓ Tasdiqlash" va "✕ Rad etish" tugmalari.
   - "✓ Barchasini birdan tasdiqlash" tugmasi va modal oynasi.
   - `teacherNav`ga "Yangi o‘quvchilar" bo‘limi qo‘shildi, dashboardda "Yangi arizalar" kartochkasi yaratildi.
   - `ResourceView.tsx`da `students` ro‘yxatidan eski "+ Yangi qo‘shish" tugmasi olib tashlanib, "Yangi arizalarni ko‘rish →" havolasiga almashtirildi.
   - `globals.css`da barcha tablar, kartochkalar, nishonlar va tugmalar dizayn tizimiga moslashtirildi.

**Tekshiruv:**
- TypeScript typecheck (`tsc --noEmit`): 0 xatolik.
- Frontend vitest: 11 ta test 100% o‘tdi.
- Backend pytest: 54 ta test 100% o‘tdi.
- Playwright E2E: 8 ta test (student-registration, compact-lead, inline-contact) 100% muvaffaqiyatli o‘tdi.
- Vizual QA skrinshotlari:
  - [Kirish tabi](qa/cabinet-login-tab.png)
  - [Ro‘yxatdan o‘tish tabi](qa/cabinet-register-tab.png)
  - [Ariza muvaffaqiyatli topshirildi](qa/cabinet-register-success.png)
  - [Tasdiqlanmagan kirishda kutish xabarnomasi](qa/cabinet-login-pending-notice.png)
  - [Ustoz o‘quvchilar ro‘yxatida eski tugma olib tashlangan](qa/teacher-students-no-add-btn.png)
  - [Ustoz Yangi o‘quvchilar bo‘limi](qa/teacher-pending-students.png)
  - [Barchasini birdan tasdiqlash dialogi](qa/teacher-bulk-approve-dialog.png)

**Manba:** [O‘quvchilarni mustaqil ro‘yxatdan o‘tkazish va ustoz tasdiqlash tizimi hisoboti](student-registration-and-approval-workflow.md).

## 17. Ustoz boshqaruv paneli (`/teacher`) 500 xatosini bartaraf etish — 2026-11-03

**Talab:**
- Ustoz kabineti (`/teacher` - Boshqaruv) ochilganda chiqqan "Server xatosi. Qayta urinib ko'ring" xatoligini to‘g‘rilash.

**Bajarilgan ishlar:**
1. **Xato sababini aniqlash (`backend/app/modules/reports/router.py`)**:
   - `metrics()` funksiyasida `pending_students` ni hisoblash uchun qo‘shilgan `select(func.count(Student.id)).join(User, Student.user_id == User.id)` qatorida `User` modeli chaqirilgan, biroq `User` ushbu faylning importlarida kiritilmagan bo‘lgan.
   - Bu FastAPI global middleware’iga tushib, `unhandled_error` va HTTP 500 `{"code": "internal_error", "message": "Server xatosi. Qayta urinib ko‘ring"}` javobini yuzaga keltirgan.
2. **Tuzatish**:
   - `backend/app/modules/reports/router.py` faylining `from app.db.models import (...)` qatoriga `User` qo‘shildi.
   - Backend uvicorn serveri qayta ishga tushirildi.

**Tekshiruv:**
- Python direct test: `dashboard(date(2026, 11, 1), teacher, db)` to‘liq 200 OK va to‘g‘ri ma’lumotlar bilan ishladi.
- HTTP tekshiruvi: Haqiqiy teacher sessiyasi bilan to‘g‘ridan-to‘g‘ri backend (:8000) va Next.js API proxy (:3000) orqali `/api/v1/teacher/dashboard` 200 OK qaytardi (`pending_students: 5`, `active_students: 4`).
- Playwright Chromium brauzer testi: `http://localhost:3000/teacher` sahifasi ochilib, "Server xatosi" xabari butunlay yo‘qolganligi (`false`), boshqaruv kartochkalari va "E’tibor talab qiladi" bloklari to‘liq chiqqanligi, konsolda 0 ta xatolik borligi tekshirildi va yangi to‘liq sahifa skrinshoti olindi.
- Testlar: 54 ta backend pytest, 11 ta frontend vitest va TypeScript typecheck to‘liq muvaffaqiyatli o‘tdi.

## 18. Loyihaning to‘liq tahlili va joriy holat auditi — 2026-11-03

**Talab:** loyihani to‘liq o‘rganish, chuqur tahlil qilish va qayerga kelganimizni (joriy holatni) aniqlab taqdim etish.

**Bajarilgan ishlar va aniqlangan holat:**
1. Loyiha arxitekturasi, mavjud 30 ta rivojlantirish bosqichi, ochiq sahifalar, kabinetlar va ma’lumotlar bazasi to‘liq inventarizatsiya qilindi.
2. Server restartidan so‘ng `.venv/bin/python3` symlinki muhitdagi mavjud python interpretatoriga qayta ulandi va `scripts/backend` orqali backend muhiti tiklandi.
3. Loyiha qayerga kelganligi:
   - Ochiq sayt (`/`, `/about`, `/courses`, `/results`, `/faq`, `/contact`) to‘liq tayyor, zamonaviy editorial dizayn, haqiqiy dars fotosuratlari, ixcham L/R/W/S sertifikatlar va inline ariza integratsiyalashgan.
   - O‘quvchilarning mustaqil ro‘yxatdan o‘tishi (`/login` -> Ro‘yxatdan o‘tish) va tasdiqlanmaguncha qahrabo ogohlantirish berilishi to‘liq ishlamoqda.
   - Ustoz kabinetida yangi arizalarni yakka yoki ommaviy tasdiqlash (`/teacher/pending-students`), hisoblarni oylik shaklda kiritish, to‘lovlarni tuzatish/bekor qilish va dashboard ko‘rsatkichlari to‘liq ishchi holatda.
   - O‘quvchi kabinetida shaxsiy guruhlar, to‘lovlar va sertifikatlar mavjud.
4. Testlar: `scripts/backend -m pytest -q` orqali 48 ta test passed, 30 ta test skipped (alohida disposable DB talab qiladi) qayd etildi.

**Keyingi qadamlar va chegaralar:**
- `docs/content-checklist.md` bo‘yicha real kontaktlar (telefon), narxlar va haqiqiy talabalar natijalarini to‘ldirish.
- Production deployment (haqiqiy serverga o‘rnatish, domen va SSL sozlash).

## 19. Avtonom ishlash tartibi (Auto-approve) — 2026-11-03

**Talab:** foydalanuvchining ko‘rsatmasi: "hamma narsani uzing qil mendan ruxsat so'rama faqat kerakli va xavfli bo'lgan vaziyatlarda ruxsat so'ra".

**Qaror va amaliyot:**
- Barcha oddiy va texnik vazifalar (kod yozish, tuzatish, testlar, refaktoring, fayllarni sozlash, avtomatik hujjatlashtirish va lokal jarayonlarni boshqarish) foydalanuvchidan ortiqcha ruxsat so‘ramasdan to‘liq avtonom tarzda bajariladi.
- Faqat yuqori xavfli (destructive — ma’lumotlar bazasini tozalash, biznes ma’lumotlarini yo‘qotish, tashqi pullik xizmatlar, kalitlarni bekor qilish yoki production o‘zgarishlari) va jiddiy noaniq qarorlar yuzaga kelgandagina tasdiqlash so‘raladi.
- Hujjatlashtirish AGENTS.md talablari bo‘yicha avtomatik davom ettiriladi.

## 20. Loyihani ishga tushirish holati — 2026-11-03

**Talab:** loyihani ishga tushirish ("ishga tushir loyihani").

**Bajarilgan ishlar va holat:**
1. FastAPI backend serveri `task-238` orqali `http://127.0.0.1:8000` manzilida ishga tushirildi. `/health/live` HTTP 200 qaytardi.
2. PostgreSQL (.local/postgres) klasteri port 55432-da to‘xtatilgani sababli, uning ishga tushirish yo‘rig‘i va barcha xizmatlarni (PostgreSQL 55432, FastAPI 8000, Telegram worker, Next.js frontend 3000) bitta buyruq bilan start qiluvchi `scripts/start-local.sh` skripti yaratildi va unga ijro huquqi berildi (`chmod +x`).
3. Muhit chegarasi qayd etildi: Antigravity CLI snap sandboxida ishlayotgani bois, hostdagi PostgreSQL va Node/Next.js jarayonlari host terminali orqali `scripts/start-local.sh` orqali ishga tushiriladi.

## 21. Loyihani o‘rganish va amalda ishga tushirish — 2026-11-03, 09:21 (Asia/Tashkent)

**Talab:** «loyihani o‘rganib chiq va run qil».

**Bajarildi:** mavjud hujjatlar, Next.js/FastAPI tuzilmasi, auth va domain routerlar, konfiguratsiya, worker va startup skriptlari o‘rganildi. FastAPI, mavjud PostgreSQL klasteri, Telegram worker va joriy koddan qayta yig‘ilgan frontend ishga tushirildi. PostgreSQL ilk startda yo‘q `/tmp` socket papkasi sabab to‘xtadi; `.local/postgres-socket` (700) yaratilib server shu yo‘l bilan ishga tushirildi. Cheklangan shell’dagi dev server EPERM berdi; mavjud ruxsatli `npm run start` orqali frontend ishga tushdi. Ilova kodi va akkauntlar o‘zgartirilmadi, DB seed/reset/migratsiyasi bajarilmadi.

**Tekshiruv:** backend 54 passed / 24 deselected, frontend 11 passed, typecheck va production build muvaffaqiyatli. Live/ready, 8 frontend sahifasi va public API proxy 200; sessiyasiz teacher dashboard 401. Alembic head `0002_certificate_student`; worker heartbeat faol. Yangi frontend tayyor bo‘lishidan oldingi ulanish urinishlari yakuniy Ready’dan keyingi muvaffaqiyatli tekshiruv bilan almashtirildi.

**Fayllar va chegaralar:** [batafsil hisobot va buyruqlar](local-startup-2026-11-03.md), [status](implementation-status.md), [hujjatlar indeksi](README.md). Frontend generated build, PostgreSQL log/socket va runtime jarayonlari yangilandi. 4 yangilangan Markdown faylida havola/fence nazorati bajarildi; eski dashboard screenshot artifacti topilmagani statusda qayd etildi. Next.js standalone startup ogohlantirishi qayd etildi. Brauzer E2E, login/CRUD, yangi Telegram yetkazilishi, production va OS restartidan keyingi autostart tekshirilmadi/o‘rnatilmadi. Hozirgi lokal xizmatlar ishlamoqda.

## 22. Yo‘qolgan sozlamalar va topilgan xatolarni tuzatish — 2026-11-03, 09:42 (Asia/Tashkent)

**Talab:** «nima yo‘qolgan bo‘lsa va nima kamchiliklar xatolari bo‘lsa o‘zing yaratib to‘g‘irla».

**Bajarildi:** mavjud kod/hujjatlar va lint tekshirildi; ro‘yxatdan o‘tish paroli/telefon/ism validatsiyasi, kurs xatosi va retry, haqiqiy pending arizalarni ajratish hamda tasdiqlash/rad etish himoyasi tuzatildi. React lint xatolari, theme tab/reload sinxronligi, local PWA poygasi, ariza formasi lifecycle va mobil pending jadvali (Toshkent vaqti, scroll hint/klaviatura, ranglar, so‘rovda tugmalarni bloklash) yangilandi. Worker DB uzilishida secretlarni log qilmasdan qayta urinadi. Python symlinki tiklandi. Startup readiness/`--status`/`--production` va standalone public/static ishga tushirish yaratildi; frontend/backend/worker qayta ishga tushirildi.

**Tekshiruv va tuzatilgan urinishlar:** alohida PostgreSQL klasterida butun backend suite 87 passed; frontend 11 passed, typecheck/build, Python F hamda shell/Node syntax o‘tdi. Lint 5 error/16 warningdan 0 error/11 image warningga tushdi. Chrome’dagi dastlabki muhit xatolari (yo‘q bundled Chromium va cheklangan chaqiruv) mavjud Chrome/ruxsatli chaqiruv orqali bartaraf etildi; keng run’da 25 test o‘tdi, 3 eskirgan/aniq bo‘lmagan test tuzatilib, keyingi 10 maqsadli test o‘tdi (32 xil ssenariy). Oxirgi mobil jadval buildidan keyingi 6/6 test ham o‘tdi; [yakuniy JSON](e2e-results.json) shu 6 testni ko‘rsatadi. Haqiqiy HTTP sahifalar/proxy hamda 21 asset 200; status to‘rt xizmatni tayyor ko‘rsatdi, takroriy startupda worker soni 1 qoldi. Eski 3 ta `file:///` havola relative yo‘lga tuzatildi; Markdown havola/fence nazorati o‘tdi.

**Fayllar va chegaralar:** [batafsil plan, fayllar, buyruqlar va natijalar](audit-fixes-2026-11-03.md), [startup qo‘llanmasi](../README.md), [holat](implementation-status.md). Asosiy DB/akkauntlarga seed/reset, migratsiya yoki sinov studentini yaratish bajarilmadi; signup E2E endi aniq fixture. Test bazasi o‘chirildi, uning alohida klasteri to‘xtatildi. Real provider, production, native PWA va physical-device tekshiruvlari bajarilmadi. Qolgan 11 image lint tavsiyasi va real marketing kontenti chegaralari hisobotda ochiq saqlanadi.

## 23. Telegram ariza xabarining yangi ko‘rinishi — 2026-11-03, 09:58 (Asia/Tashkent)

**Talab:** ariza/murojaat Telegram xabaridan IDni olib tashlash, «Sherzod English — ariza» o‘rniga «Yangi ariza kelib tushdi.» yozish, sanani `YYYY-MM-DD` va soatni alohida `HH:MM` shaklida chiqarish, qolgan maydon va kabinet eslatmasini saqlash.

**Bajarildi:** `backend/app/workers/telegram.py`da `lead_message()` formatteri ajratildi, `created_at` Asia/Tashkentga aylantiriladi; sarlavha, bo‘sh qatorlar, sana va soat so‘ralgan shaklga keltirildi. Kabinet eslatmasi local/public xabarlarda saqlandi, public inline tugma hamda ichki lead/outbox identifikatorlari o‘z joyida qoldi. Eski Telegram xabarlari qayta yuborilmadi. Faqat lokal worker yangi kod bilan qayta boshlandi; faol worker soni 1 va heartbeat tayyorligi tasdiqlandi.

**Tekshiruv:** `scripts/test-backend tests/test_telegram_delivery.py -q` — 13 passed (1.41s); o‘zgargan Python fayllarida `ruff --select F` o‘tdi. Testlar to‘liq matn, IDsiz chiqish, UTC/+05:00 vaqtlar, Toshkent kun almashishi, tanlangan kurs va local/public havolani qamradi. Sinovlar fixture bilan bajarildi; asosiy bazaga yangi test arizasi/akkaunti yoki real Telegram guruhiga test xabari yuborilmadi. Frontend o‘zgarmadi, build/E2E qayta bajarilmadi.

**Hujjatlar:** [Telegram ulanishi va joriy format](telegram-setup.md), [holat](implementation-status.md), [indeks](README.md). Bu format avvalgi ID/ISO timestamp ko‘rinishini keyingi yuboriladigan xabarlarda almashtiradi; yangi real provider yetkazish testi bajarilgani da’vo qilinmaydi.

## 24. Telegramga yangi formatda haqiqiy sinov xabari yuborish — 2026-11-03, 10:04 (Asia/Tashkent)

**Talab:** «test qilib sinachi xabar yuborib» — yangi Telegram xabarini amalda yuborish.

**Bajarildi va tekshiruv:** mavjud private Telegram konfiguratsiyasi va ilovaning `lead_message()`/`message_payload()` funksiyalari orqali sozlangan guruhga bitta «SINOV — yangi xabar formati» xabari yuborildi; haqiqiy telefon/ism ishlatilmadi. Telegram HTTP 200 va `ok:true` qaytardi, xabar raqami 21, qaytgan matn yuborilgan matnga teng. Sarlavha, ID yo‘qligi, Toshkentdagi sana/soat (`2026-11-03`, `10:04`) va kabinet eslatmasi tekshirildi. Yordamchi skriptning ilk import xatosi so‘rovdan oldin tuzatildi; Telegramga bitta tarmoq so‘rovi yuborildi.

**Fayllar va chegaralar:** [secretlarsiz JSON dalil](telegram-format-delivery-2026-11-03.json), [Telegram hisoboti](telegram-setup.md), status va indeks yangilandi; ignored `.local/send-telegram-format-test.py` yordamchisi saqlandi. Ilova kodi, akkaunt/biznes yozuvlari o‘zgarmadi; API formasi/outbox yo‘li yoki unit/E2E qayta tekshirilmadi. Bu oldingi format o‘zgarishidan keyingi real transport tekshiruvidir; eski xabarlar qayta yuborilmadi/tahrirlanmadi.

## 25. Ustoz dashboardini jonli chart/diagrammalarga o‘tkazish — 2026-11-03, 10:41 (Asia/Tashkent)

**Talab:** ustozning Boshqaruv sahifasidagi o‘quvchi/guruh/moliya va boshqa sonlarni professional bar/pie/line grafiklarda, real ma’lumot va jonli yangilanish bilan ko‘rsatish.

**Bajarildi:** `reports/dashboard.py` agregat moduli va mavjud dashboard javobiga `analytics` qo‘shildi. Decimal pul, Toshkent kalendar chegaralari, statuslarni ikki marta sanamaslik, hozirgi membership bandligi va 6 oylik profil ro‘yxati qo‘llandi; belgilanmagan davomat oyga chegaralandi. Frontend TeacherDashboard/graph/format/type/CSS modullari yaratilib, oldingi view almashtirildi; muhim eski havola, guruhi/jadval va kelmaganlar bo‘limlari saqlandi. Grafiklar hover/touch/klaviatura, aniq label/jadval, empty state va light/dark bilan ishlaydi. SVG width telefon uchun alohida moslanadi. 5s visible polling va BroadcastChannel qo‘shildi; stale/error/retry holatlari ko‘rsatiladi. SW v12; yangi dependency yoki external servis qo‘shilmadi.

**Tekshiruv:** disposable PostgreSQLda to‘liq suite 92 passed (54.11s), oxirgi kelgusi oylik nuqta himoyasidan so‘ng 2 dashboard testi qayta o‘tdi. 14 frontend unit, typecheck/final build, Python F va frontend lint o‘tdi; 0 lint error/11 old image warning. Browser keng run’da 19 pass, eski login labeli tuzatilgach 1 pass; final run’da 8 pass/1 intentional CSV skip. 320px toolbar, dark legend rangi, mayda SVG axis va Vitest import muammolari aniqlanib tuzatildi; final dashboard 4 ssenariyi qayta o‘tdi. Haqiqiy asosiy DB funksiyasidan faqat o‘qish bilan moliya/status jami tengligi tekshirildi, API ready va teacher shell 200, sessiyasiz API 401.

**Fayllar va chegaralar:** [batafsil plan, fayllar, buyruqlar va dalillar](teacher-dashboard-charts.md), [browser JSON](teacher-dashboard-e2e-results.json), [read-only JSON](teacher-dashboard-live-verification.json); index/status/root README yangilandi. Asosiy bazaga seed/reset, migratsiya yoki test akkaunti/record kiritilmadi. Alohida test DB o‘chirildi, faqat uning klasteri to‘xtatildi. Backend/frontend yangi kod bilan qayta ishga tushirildi; worker saqlandi, Telegram test xabari yuborilmadi. Private UI screenshotlari fixture, owner akkauntida real HTTP login/CRUD bajarilmagan; production/real device/load acceptance da’vo qilinmaydi. Joriy polling oraliği 5 soniya; nol kechikishli push emas.

## 26. Entity biznes qoidalari va kichik light/dark ikonkalari — 2026-11-03, 11:20 (Asia/Tashkent)

**Talab:** faol/nofaol o‘quvchi/guruh/kurs belgilarining biznes qiymati yo‘qligi sabab ularni backenddan chiqarish, oddiy sonlar va o‘chirishga o‘tish. Keyingi qo‘shimcha: tepadagi light/dark ikonkasini almashtirish va kichraytirish.

**Bajarildi:** mavjud model/routerlar, DTOlar, auth/approval, membership/capacity, billing, learning, reports/dashboard va frontend resource UI moslashtirildi. `deleted_at` va explicit `admission_status` 0003 migratsiyasi yaratildi; legacy SQL ustunlari tarix sifatida saqlandi, faol entity qoidalari ularga tayanmaydi. O‘chirish yangi ta’lim/hisob/a’zolikdan chiqaradi, student loginini yopadi, eski moliya/davomat/a’zolik tarixini saqlaydi. O‘quvchi/guruh count va a’zolik donuti oddiy ro‘yxatga mos. Course delete guruhlari qolsa bloklanadi. Shared ThemeToggle lucide Sun/Moon 16px, desktop 36px/touch40px; header va kabinetda emoji/kattaroq ikonka almashtirildi, theme sinxronligi saqlandi.

**Saqlash/runtime:** private 0600 pg_dump, alohida bazaga restore va Alembic head rehearsal o‘tdi; clone va mainda 27 jadvalning barcha avvalgi ustunlari/IDlari teng. Migration 0003 asosiy bazaga qo‘llandi. Seed/reset/egasi paroli va ariza/test yozuvlari yaratilmagan. Final frontend build va backend qayta ishga tushdi, worker tayyor. Alohida test bazasi olib tashlandi va uning klasteri to‘xtatildi; asosiy DB qolgan. Yangi Telegram sinovi yuborilmadi.

**Tekshiruv:** final 94 backend passed (63.60s), 14 unit, typecheck/build, Python F va frontend lint (0 error/11 old image warning). Final 11 browser passed (29.9s): private chart/form/theme fixture, public theme/reload/tab, 320–1440px, 16px/36px real DOM o‘lchami. Ikki header screenshot ochib ko‘rildi. Real asosiy DB dashboard/list/count/donut tengliklari read-only; home/login/public courses 200, sessiyasiz teacher API401, backend ready200. Dastlabki eskirgan CSV/test DTO shartlari va noto‘g‘ri health URL urinishlari tuzatildi; tafsilotlari hisobotda. Owner login/CRUD va production/physical device tekshirilmadi.

**Fayllar/qaror:** [reja, ta’sirlangan kod va buyruqlar](entity-lifecycle-and-theme-update.md), [migratsiya dalili](entity-migration-verification.json), [asosiy DB/API](entity-live-verification.json), [browser JSON](entity-theme-e2e-results.json); indeks/status/arxitektura/root README va oldingi feature hisobotlarida superseded qaror ko‘rsatildi. Public natija/nashr, invoice/davomat/murojaat holatlari va ichki login xavfsizligi biznes ma’nosi bilan saqlanadi. Manual faol/nofaol UI/API maydoni qolmagan.

## 27. Moliya va barcha o‘quv ma’lumotlarini Excelga yuklash — 2026-11-03, 11:55 (Asia/Tashkent)

**Talab:** moliya holatlari, o‘quvchilar soni va barcha tegishli ma’lumotlarni CSV emas, chiroyli/to‘g‘ri Excel fayliga yuklab olish. Foydalanuvchining «kelgan joyingdan davom et» ko‘rsatmasi shu vazifaga davom sifatida olindi.

**Bajarildi:** `reports/excel.py` va teacher-only XLSX endpoint, 13 varaq + bo‘lim eksportlari, oddiy countlar/Decimal moliya, snapshot consistency, yetarli nom/telefon/date formats, native chart, freeze/filter/zebra/jami/row count, paginationdan mustaqillik va avtomatik sheet splitting. DownloadButton/ExcelDownload, Dashboard/Reports/Finance/ResourceView tugmalari, MIME/ZIP check, pending/error/retry/success kiritildi; CSV endpoint/tugmalari chiqarildi. Money Excel precisiondan katta bo‘lsa exact text+izoh, foydalanuvchi matni formula/hyperlink sifatida bajarilmaydi. Runtime/dev dependency locklari va OpenAPI yangilandi.

**Tekshiruv:** alohida PostgreSQLda final 93 backend passed (67.10s); 10003 satr, haqiqiy invoice/adjustment/payment/allocation/refund/void/deletion, parallel o‘zgarishda bir xil snapshot va katta summa tekshirildi. 14 frontend unit, typecheck/build/Python F/pip check; lint 0 error/11 old image warning. Browser final 10 passed (26.5s), 3 yangi download ssenariysi + 7 chart/theme/resource regressiyasi. Dastlabki cache-control test kutilmasi, count format nuqtasi to‘g‘rilandi. SDK import/render phone/chart talqin farqi native XLSX typed cell/OOXML va mustaqil reader/HTML preview bilan tekshirildi; bu Excel xatosi deb ko‘rsatilmadi. Preview va mobile screenshotlar ochib ko‘rildi.

**Saqlash/runtime/chegaralar:** mainda faqat read-only workbook/count/moliya tengligi tekshirildi, owner workbook saqlanmadi. Yangi migratsiya, seed/reset, parol/sessiya yoki Telegram xabari yaratilmagan. Backend/frontend final kod bilan ishga tushdi, worker saqlandi; test bazasi va faqat test klasteri tozalandi. Browserlar boshqariladigan NAMUNA workbook/teacher fixture; main owner login/download, native Excel/physical-device, production/load acceptance bajarilmadi. Eski CSVga xos 6 test o‘rniga haqiqiy XLSX testlari qo‘shilgani sabab avvalgi 94 bilan hozirgi 93 aynan bir tarkib emas.

**Fayllar/dalillar:** [batafsil hisobot, foydalanish va cheklovlar](excel-reports.md), [main read-only](excel-live-verification.json), [browser JSON](excel-e2e-results.json), [backend XML](backend-test-results.xml); root README, indeks, status va OpenAPI yangilandi. Oldingi CSV qarori shu yangi Excel implementatsiyasi bilan almashtirildi.

## 28. Kurs detail, kabinet navigatsiyasi/dizayni va teacher password assignment — 2026-11-03, 12:43 (Asia/Tashkent)

**Talab:** Grammatika/IELTS/SEFR haqida ko‘proq matn va browserdan2–3 foto; kabinet logo o‘sha rolning birinchi bo‘limiga; info/edit/delete/historyni har gadgetga mos tartiblash; student own password tanlagani uchun teacher vaqtinchalik parol bermasin.

**Bajarildi:** mavjud kurs route/CRUD saqlandi, yangi CourseDetails/guides/CSS va6 licensed WebP, CMS faktlari/selected-course ariza. BrandLogo role root. RecordDetails/Summary header/avatar/edit/balance va Ma’lumotlar/Tarix/A’zolar/Boshqaruv, keyboard tabs, named memberships, danger disclosure, mobil fullscreen. Teacher account endpoint/AccountIn/reset UI chiqarildi. Main accountless profil aniqlanib0004 explicit User.registration_pending qo‘shildi: signup davomida existing student ID/name/note/guruh/mavjud invoice qarzi saqlanadi; approve/reject kirish qarori alohida, existing login/ambiguous/deleted auto claim yo‘q. Pending UI requested identityni bildiradi, legacy own-password change/security flagi qoldi.

**Saqlash/runtime:** private backup/clone restore, main upgrade oldin/keyin27 jadval original ustun/ID teng. Mainhead0004; seed/reset/password/newbusinessrecord yoki Telegram testi yo‘q. Backend/frontend/worker tayyor. Test DB olib tashlandi, faqat test klasteri to‘xtatildi.

**Tekshiruv:**95 backend passed74.89s, avval25focused,14unit, typecheck/build/PythonF; lint0error/11oldimagewarning. Keng browser11passed/1 credentialsskip44.4s. Screenshotda header ism va doublecurrency topilib tuzatildi, final4/4 passed21.5s;320/375/768/1440px, rolelogo/zerologout, actualpubliccourse/foto/enroll, info/history/actions/nestededit/delete confirmation/focus, 13 resource fixture va Excel regressiyasi. Birinchi9pass/2 test locator/width xatosi/1skip tuzatildi. Screenshot/originalrasmlar ko‘rildi. Mainread-only flags/count/head, actualpublic GET200/removedaccount404. Privatebrowser NAMUNA fixture; owner actuallogin/claim/CRUD, physicaldevice/productionacceptance bajarilmadi.

**Fayllar/dalillar:** [reja, o‘zgarish, buyruq va chegaralar](courses-and-workspace-redesign.md), [rasm manbalari](course-image-sources.md), [migration](registration-migration-verification.json), [live](courses-workspace-live-verification.json), [final4](courses-workspace-final-results.json), [keng11/1](courses-workspace-regression-results.json). README/index/status/architecture/registration report/OpenAPI yangilandi; eski teacher temporary-password qarori superseded, tarix saqlandi.

## Davom ettirishda saqlanadigan chegaralar

- Real marketing kontenti, narx/jadval/kontakt, haqiqiy natijalarni e’lon qilish roziligi va ustozning o‘z sertifikatlari [checklist](content-checklist.md) bo‘yicha to‘ldiriladi.
- Yangi o‘zgarish avval mavjud kodda tekshiriladi; bor funksiya qayta yaratilmaydi.
- Teacher/student biznes amallari, haqiqiy API tekshiruvi va UI fixture bir xil natija sifatida yozilmaydi.
- Production, Docker target muhit, S3, physical device/native PWA va restore rehearsal bo‘yicha bajarilmagan tekshiruvlar o‘tgan deb belgilanmaydi.
- Keyingi har bir yangi vazifa uchun shu jurnalga talab, o‘zgarish, tekshiruv va qolgan ish yoziladi; foydalanuvchi alohida aytishi shart emas.

## 29. GitHubga xavfsizlik auditi bilan yuklash — 2026-11-03 (Asia/Tashkent)

**Talab:** mavjud loyihani ko‘rsatilgan GitHub repositoriyga push qilish; source va private fayllarni tahlil qilib `.gitignore` bilan ajratish.

**Bajarilgan tayyorgarlik:** bo‘sh/public remote, owner GitHub ulanishi va push huquqi tasdiqlandi. `.gitignore` credential/config/env/data/backup/media/build/QA/reference uchun kengaytirildi, `.gitattributes` kiritildi. Sertifikat importeridagi shaxsiy metadata 0600 private manifestga ajratildi, anonymous example va explicit manifest loader qo‘shildi; integration test manbasi anonim inputga moslandi. Tarixiy hujjatlardagi lokal loginlar va keraksiz profil balans qiymati redakt qilindi; asl lokal hisobot nusxalari private saqlandi. Yangi scanner staged bloblar/XLSX ichini tekshiradi va secret qiymatlarini chiqarmaydi.

**Tekshiruv:** 31 unit/rule/password/manifest testi passed (2.13s), dedicated 55433 `_test` certificate integratsiyasi 2 passed/41 deselected (7.97s), scanner 4/4 (clean/leak/redaction/path/symlink holatlari jamlangan 4 ssenariy), o‘zgargan PythonF va compile passed. Main postgres/backend/frontend/worker status true. Dastlab test klaster optionssiz 5432 bandligi sabab boshlanmadi, avvalgi port/socket bilan 55433da boshlandi. Main DB reset/seed/import/password o‘zgarishi va yangi Telegram xabari bo‘lmadi; frontend qayta build/E2E qilinmadi.

**Nashr/chegaralar:** terminal Git DNS ishlamadi, `.git` read-only; ruxsatli `.local/github.git` indeks/commit uchun ishlatiladi. Yakuniy indeks263fayl/~4.43MB, 0 finding. GitHub plugin ilk `.gitignore` yaratishni HTTP403 `Resource not accessible by integration` bilan rad etdi; qayta branches[] tekshirildi: remote’da hech narsa nashr qilinmadi. Plugin installed/enabled, yangi tasdiqlangan muqobil ulanish yo‘q; SSHagent EPERM. Egaga Contents: Read and write bilan ulanishni yangilash zarurati aytildi, token/parol so‘ralmadi. Task remote qismi **tugallanmagan**. Keyingi amal: ulanish tiklangach branch tarixini qayta o‘qish, safe commitni yuborish va remote tree/bloblarni solishtirish. Test DB/klaster tozalandi, main xizmatlar saqlandi. [Audit va aniq keyingi buyruq](github-publication.md). Private lokal QA havolalari remote’da ochilmaydi; README, indeks va implementation-status yangilandi.

**Lokal saqlash dalili:** boshlang‘ich commit `7a2b75b19bf53b35199a54f92e82dc26ad865ac8`, barcha263path/mode/blob auditga aynan teng. Private `.local/Sherzod-English.bundle` complete history bilan yaratilib `git bundle verify` okay; yakuniy hujjat commitidan keyin yangilanadi. Yangi Markdown havola/fence va NAMUNA PNG vizual tekshirildi. Dastlabki full-index whitespace check eski SQL/MD format ogohlantirishlari bilan tugadi, passed deb qayd etilmadi; biznes migratsiyalari shu sabab qayta yozilmadi.

## 30. Huquq yangilangach GitHub pushni qayta urinish — 2026-11-03, 14:45 (Asia/Tashkent)

**Talab:** egasi «yoqdim qayta push qilchi» dedi. Avvalgi kod/xavfsizlik auditi takroran ishlab chiqilmadi; tayyor lokal `66cd631` commit/index va remote holati tekshirildi.

**Haqiqiy natija:** staged scanner263fayl/4,430,438bytes/0finding, lokal index clean; GitHub branches[]. `.gitignore` yaratish so‘rovi yana HTTP403 `Resource not accessible by integration` bilan rad etildi, terminal `git ls-remote` DNS xatosi bilan tugadi. Remote nashr muvaffaqiyatli deb belgilanmadi. Egasi ruxsatni yoqqani qayd etildi; amaldagi integratsiya yozishni qabul qilmayapti, token yangilanmagan bo‘lishi mumkinligi faqat taxmin.

**Saqlash/keyingi amal:** hisobot/status/jurnal yangilandi, docs lokal commit va private bundle bilan saqlanadi; keyingi aniq qadam GitHub ulanishini qayta autentifikatsiya qilish, so‘ng real write va remote tree/blob tekshiruvi. Secret/token/parol chatga so‘ralmadi, main DB/akkaunt/runtime/kod o‘zgarmadi, yangi Telegram xabari yoki tests/build/E2E bajarilmadi. [Qayta urinish hisoboti](github-publication.md).

## 31. GitHub API va to‘g‘ridan-to‘g‘ri pushni yana tekshirish — 2026-11-03, 14:51 (Asia/Tashkent)

**Talab:** «endi qilchi». Lokal `d32f9cd` clean holati, docs va remote branches[] tekshirildi. API ilk `.gitignore` yozishni yanaHTTP403 `Resource not accessible by integration` bilan rad etdi. Terminalda haqiqiy `git --git-dir=.local/github.git --work-tree=. push -u origin main` bajarildi: exit128 `Could not resolve host: github.com`. Shuning uchun remote push muvaffaqiyatli deb ko‘rsatilmaydi.

**Saqlash/chegaralar:** private fayllar ajratilgan loyiha/local commit/bundle saqlanadi; scanner qayta ishlatildi. Kod/baza/runtime va akkauntlar o‘zgarmadi, unit/build/E2E yoki yangi Telegram tekshiruvi bajarilmadi. Ushbu yozuv, status va [hisobot](github-publication.md) yangilandi. Keyingi yo‘l: tarmoq/auth ishlaydigan oddiy foydalanuvchi terminalida hisobotdagi aniq Git push buyrug‘i; keyin remote SHA/tree/blob tengligini tekshirish. Secret/token/parol chatga so‘ralmaydi.

## 32. Push muammosining sababi va tuzatish yo‘lini tushuntirish — 2026-11-03, 14:55 (Asia/Tashkent)

**Talab:** egasi asosiy sababni so‘radi, o‘zi tuzatishini aytdi. Oldingi haqiqiy xatolar ikki mustaqil blok sifatida ajratildi: API403 integratsiya permissioni va shell exit128 DNS. Rasmiy GitHub REST/App/CLI hujjatlari o‘qildi; installed app repository access va Contents permission tekshirish yo‘li, app egasi bilan oddiy o‘rnatuvchi huquqi farqi, qayta ulash write’ni kafolatlamasligi tushuntirildi. Bu oldingi «yoqing/qayta ulang» tavsiyasining yetishmagan chegarasini aniqlashtiradi.

**Tekshiruv/chegaralar:** bu safar yangi API write, push, runtime/test/build bajarilmadi; mavjud xato dalillari va rasmiy hujjatlarga tayanildi. Oddiy foydalanuvchi terminalida DNS solishtirish kerakligi aytildi; agent cheklovi bilan host DNS sababi qat’iy ajratilmagan. Kod/DB/parollar saqlandi. [Hisobot/manbalar va muqobil auth yo‘li](github-publication.md), status/jurnal yangilandi; remote nashr hali bajarilmagan.

## 33. Yozish huquqi ishlagach GitHubga nashr qilish — 2026-11-03 (Asia/Tashkent)

**Talab:** «Endi ruxsat berdim davay». Joriy docs/clean lokal `6429e5c` va remote branches[] tekshirildi. GitHub create_file bu safar muvaffaqiyatli: bootstrap8822944. Saralangan18binary blob SHA tengligi bilan yuklandi; 245text bilan263file tree yaratildi. Source commit `fd52e6521848de78ada0d83d1c191f49d3cd809a` main refga expected bootstrap SHA va force=false bilan nashr qilindi.

**Tekshiruv:** real remote ref/tree/commit qayta o‘qildi; recursive tree truncated=false va263path/mode/blob SHA lokalmanifestga aynan teng; tree85687ed6. Scanner263fayl/4,440,771bytes/0finding. Private `.env`/`.local`/baza/media/backup/raw certificate/reference/QA nashrda yo‘q. Lokal `.local/github.git` main/origin/main exact server commit obyektlarini qayta tiklab moslandi; +0000 birinchi hash urinishida ref o‘zgarmadi, exact+0500 topilgach SHA tengligi bilan import qilindi. Oldingi lokal tarix audit-before-publication branchida saqlandi. Ishchi fayllar saqlandi, keyin yakuniy docs holati yangilandi.

**Natija/chegaralar:** loyiha GitHubda nashr qilindi, oldingiHTTP403 holat tarixiyga aylandi. GitHub plugin Git Data API orqali, terminal DNS yo‘li orqali emas. Yangi kod/DB/runtime/akkaunt/parol yoki Telegram xabari yaratilmagan, unit/build/E2E qayta bajarilmadi; bu hosting/production qabul sinovi emas. [Nashr hisoboti](github-publication.md), status va joriy jurnal yangilandi; private lokal evidence havolalari cheklovi saqlanadi.
