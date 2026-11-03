# Sherzod English — implementation status

## GitHubga nashr muvaffaqiyatli — 2026-11-03 (Asia/Tashkent)

Egasi huquqni bergach API yozish ishladi. Bo‘sh remote’ga bootstrap8822944, keyin [source fd52e65](https://github.com/faxriddinswe/Sherzod-English/commit/fd52e6521848de78ada0d83d1c191f49d3cd809a) main branchiga force=false/expected head bilan nashr qilindi. **263/263 fayl path/mode/blob SHA** remote ref/commit/recursive tree orqali tekshirilib lokal auditga teng; tree85687ed6, truncated=false. Scanner263fayl/4,440,771bytes/0finding. Private env/data/backup/media/raw reference/QA kiritilmagan. Lokal Git main/origin/main source commitga exact Git obyektlari orqali moslandi, oldingi audit branch saqlandi. **Avvalgi HTTP403 blok nashr uchun yechildi**; DNS orqali terminal push da’vosi yo‘q, GitHub API ishlatildi. Kod/DB/runtime o‘zgarmadi, tests/build/E2E qayta bajarilmadi. [Yakuniy hisobot va chegaralar](github-publication.md).

## Push bloklari bo‘yicha aniqlashtirish — 2026-11-03, 14:55 (Asia/Tashkent)

Egaga ikki mustaqil oldingi xato tushuntirildi: GitHub integratsiya tokeni403/insufficient permission va agent shell DNS/exit128. Rasmiy GitHub hujjatlari bilan installed app repository access/Contents qayerda tekshirilishi va third-party app permissionini oddiy o‘rnatuvchi kengaytira olmasligi aniqlashtirildi; qayta ulash write’ni kafolatlamaydi. Foydalanuvchi oddiy terminalida DNSni solishtirish va mustaqil Git auth orqali push qilish yo‘li beriladi. Bu safar yangi push/test/runtime bajarilmadi, faqat docs; **nashr hali tugallanmagan**. [Sabab va tekshiruv yo‘li](github-publication.md).

## GitHub API va haqiqiy git push qayta sinovi — 2026-11-03, 14:51 (Asia/Tashkent)

Egasi yana urinishni so‘radi. Lokal `d32f9cd` clean, remote branches[]. API ilk fayl yozishni yanaHTTP403 integration xatosi bilan rad etdi. Haqiqiy `git --git-dir=.local/github.git --work-tree=. push -u origin main` **exit128, Could not resolve host: github.com** bilan tugadi. **Nashr bajarilmadi.** Kod/DB/runtime o‘zgarmadi, docs/commit/bundle saqlanadi; oddiy terminaldagi aniq push buyrug‘i foydalanuvchiga beriladi. Ilova test/build/E2E takrorlanmadi. [Natija va keyingi yo‘l](github-publication.md).

## GitHub qayta push urinishi — 2026-11-03, 14:45 (Asia/Tashkent)

Egasi huquq yoqilganini aytgach yana urinildi. Clean lokal `66cd631`, scanner263fayl/4,430,438bytes/0findings, remote branches[] tekshirildi. GitHub ilk `.gitignore` yozishni yana **HTTP403 `Resource not accessible by integration`** bilan rad etdi; terminal Git DNS ham ishlamadi. **Push hali bajarilmadi.** Keyingi qadam: GitHub ulanishini yangi Contents yozish huquqi bilan qayta autentifikatsiya qilish, keyin remote’ni tekshirib nashr va blob hash tekshiruvini davom ettirish. Ilova/baza/runtime o‘zgarmadi, test/build qayta bajarilmadi; faqat docs, lokal commit/bundle yangilanadi. [Qayta urinish dalili](github-publication.md).

## GitHub nashri va private fayllar auditi — 2026-11-03 (Asia/Tashkent)

Public `faxriddinswe/Sherzod-English` dastlab bo‘sh, authenticated owner tasdiqlandi. Kengaytirilgan gitignore/gitattributes, staged-blob scanner, private sertifikat manifesti va anonim example, tarixiy Markdown login redaksiyasi bajarildi. `.env`, baza/backup/media, raw reference/QA va JSON/XML evidence lokalda saqlanadi. **263 fayl, ~4.43 MB, 0 scanner finding**; 31 test passed2.13s; dedicated PostgreSQL certificate2passed7.97s; scanner4/4 nazorat passed; PythonF passed. Lokal boshlang‘ich commit `7a2b75b`, 263 tree/blob/mode tengligi va private Git bundle verify okay. Main runtime to‘rtta xizmat tayyor, test DB/klaster tozalandi. **Push tugallanmagan:** GitHub ilk fayl yozishni HTTP403 `Resource not accessible by integration` bilan rad etdi; qayta remote branches[]; terminal DNS/SSH ham cheklangan. Contents yozish huquqi bilan GitHub ulanishini yangilash kerak; token/parol so‘ralmadi. [Hisobot va keyingi aniq amal](github-publication.md).

## Kurslar, kabinet tafsilotlari va own-password signup — 2026-11-03, 12:43 (Asia/Tashkent)

Uch detail route Grammatika/IELTS/SEFR kengroq matn, mavzu/practice va ikkitadan licensed local stock foto bilan boyitildi; arizada kurs tanlanadi. Logo joriy teacher/student rootga qaytadi. Yozuvlar Ma’lumotlar/Tarix(A’zolar)/Boshqaruv tablarida, header/edit/balance va xavfli amallar alohida; mobile fullscreen, 320–1440px tekshirildi. Mobile ism siqilishi va double currency tuzatildi.

Teacher vaqtinchalik parol assignment/reset UI/API/AccountIn chiqarildi. User.registration_pending (0004) mavjud loginsiz profilga own-password signupni biznes ma’lumotini o‘zgartirmay tasdiqlash/rad etish imkonini beradi. Private backup/restore, clone/main27 jadval original ustun/ID/hash saqlanishi tekshirildi; mainhead0004.

95 backend passed74.89s,14 unit, typecheck/finalbuild/PythonF passed, lint0error/11 old image warning. Keng Chrome11pass/1 credentials skip44.4s; final vizual tuzatishdan keyin4/4 passed21.5s. Public GET actual local, private UI NAMUNA fixture. Main owner login/claim/CRUD yoki physical-device/production acceptance bajarilmadi. Runtime tayyor, dedicated test DB/klaster tozalandi; main seed/reset/test Telegram yo‘q. [Hisobot/chegaralar](courses-and-workspace-redesign.md), [migration](registration-migration-verification.json), [final4](courses-workspace-final-results.json), [keng11/1](courses-workspace-regression-results.json).

## Excel hisobotlari: moliya va barcha o‘quv ma’lumotlari — 2026-11-03, 11:55 (Asia/Tashkent)

CSV XLSX bilan almashtirildi. Teacher-only eksport bitta 13 varaqli workbook yoki alohida moliya/o‘quvchi/guruh/hisob/to‘lov/ariza/murojaat/davomat/baho beradi. Umumiy countlar, moliya/qaytarish/qarz/credit, native chart, freeze/filter/zebra/date/money format bor. Backend bir xil read-only REPEATABLE READ snapshotni ishlatadi; pagination/10000 limitiga bog‘liq emas. Katta money precision yo‘qolmaydi; raqam chegarasidan oshsa izohli exact text. Mavjud 0003 DB reset/reseed yoki yangi migratsiyasiz saqlandi.

Final **93 backend passed (67.10s)**, **14 frontend unit**, **10 browser passed (26.5s)**; typecheck/build/Python F/pip check passed, lint 0 error/11 old image warning. 10003 satr, qarz/allocation/refund/void/delete va parallel o‘zgarishda snapshot, ZIP/typed cells qayta ochib tekshirildi. CSVga xos 6 eski parametr case olib tashlanib haqiqiy XLSX testlari qo‘shildi; bu avvalgi 94 test tarkibini aynan takrorlamaydi. Main DBda faqat read-only workbook tengliklari; owner fayli saqlanmadi. Browser downloadlar real API yaratgan NAMUNA fixture bilan, main login/download emas. SDK previewdagi phone/chart talqin cheklovi alohida qayd etildi; native Excel sinovi da’vo qilinmaydi.

Lokal frontend/backend final kod bilan ishlamoqda, worker saqlandi; test bazasi/klasteri tozalandi, main DB/akkaunt/parollar saqlandi, Telegram sinovi yuborilmadi. [Hisobot/buyruqlar/chegaralar](excel-reports.md), [read-only](excel-live-verification.json), [browser](excel-e2e-results.json). Oldingi CSV eksport tavsiflari tarixiy qaror hisoblanadi.

## Faol/nofaol entity qoidalarini olib tashlash va mavzu ikonkalari — 2026-11-03, 11:20 (Asia/Tashkent)

O‘quvchi/guruh/kurs API va UI’sidan qo‘lda activity tanlash olib tashlandi. Oddiy `student_count`/`group_count`, guruhga biriktirish donuti, sabab bilan tarixni saqlovchi o‘chirish ishlaydi. Yangi o‘quvchi arizasining tasdiqlanishi alohida `admission_status`; login xavfsizligi va moliya/davomat ish oqimlari saqlanadi. O‘chirilgan entity yangi a’zolik/hisob/o‘quv yozuviga qo‘shilmaydi; eski qarz va to‘lov tarixi yo‘qolmaydi. Bu oldingi paused/active profil va status-donut qarorini almashtiradi.

Sayt/kabinetdagi katta mavzu tugmalari umumiy **16px Sun/Moon** ikonka, **36px** dumaloq tugmaga almashtirildi (touch 40px). Rejim/reload/tab sinxronligi, tooltip va klaviatura saqlandi.

Alembic **0003_entity_deletion** asosiy lokal bazaga qo‘llandi: private backup/restore rehearsal, klon va mainda **27 jadvalning barcha avvalgi ustunlari/IDlari tengligi** tekshirildi. Asosiy DB reset/reseed, parol almashtirish va yangi Telegram testi qilinmadi. Final frontend build, backend va worker tayyor; localhost:3000 ishlaydi.

Dalillar: final **94 backend passed (63.60s)**, **14 frontend unit**, **11 browser passed (29.9s)**, typecheck/build, Python F/lint passed; frontend lint 0 error/11 old image warning. Private browserlar fixture, biznes API testlari alohida PostgreSQLda; mainda faqat read-only dashboard tengliklari va real HTTP 200/401 tekshirildi. [Hisobot va urinishlar](entity-lifecycle-and-theme-update.md), [migratsiya](entity-migration-verification.json), [read-only](entity-live-verification.json), [browser JSON](entity-theme-e2e-results.json). Screenshotlar ochib ko‘rildi. Test DB/klaster tozalandi; production/physical-device acceptance bajarilmadi.

## Ustoz boshqaruvi: jonli diagrammalar — 2026-11-03, 10:41 (Asia/Tashkent)

`/teacher` sahifasi yangi responsive light/dark dashboardga o‘tkazildi: 4 KPI, kunlik/6 oylik pul oqimi, o‘quvchilar/davomat/to‘lov usullari donutlari, ro‘yxatdan o‘tish ustunlari, guruh/murojaat bandligi. Mavjud guruh jadvali, e’tibor havolalari va kelmaganlar ro‘yxati saqlandi. API teacher-only agregatlarni bazadan beradi; eski KPI maydonlari saqlangan. Belgilanmagan davomat tanlangan oyga to‘g‘rilandi, kelgusi moliya sanalari/oylari uydirma chiziq bilan to‘ldirilmaydi.

Yangilanish visible sahifada 5 soniya, focus/reconnect, qo‘lda refresh va mutationdan keyin BroadcastChannel orqali; uzilishda stale ma’lumot + xato holati. Bu polling, WebSocket emas. Asosiy DB reset/reseed/migratsiyasiz saqlandi; backend/frontend final kod bilan ishga tushirildi, SW v12.

Dalillar: **92 backend testi passed**, keyingi future-marker tuzatishidan so‘ng **2 maqsadli API testi passed**, **14 unit**, typecheck/final build, Python F va frontend lint o‘tdi (0 error/11 old image warning). Keng run’dagi 19 pass va tuzatilgan eski login-label testi bilan jami 20 xil browser ssenariyi o‘tdi; final run **8 passed / 1 intentional CSV skip**. Real asosiy DB read-only agregat tengliklari ham tekshirildi. [Hisobot](teacher-dashboard-charts.md), [browser JSON](teacher-dashboard-e2e-results.json), [read-only dalil](teacher-dashboard-live-verification.json). Test DB o‘chirildi, uning klasteri to‘xtatildi. Owner browser login/CRUD, real qurilma, production va load test bajarilmagan.

## Yangi Telegram formatini real yuborish bilan tekshirish — 2026-11-03, 10:04 (Asia/Tashkent)

Foydalanuvchi aniq so‘rovi bilan sozlangan guruhga bitta «SINOV — yangi xabar formati» xabari yuborildi. Mavjud ilova formatterlari ishlatildi: Telegram **HTTP 200 / ok:true**, message_id **21**, qaytgan matn yuborilgan matnga to‘liq teng. IDsiz yangi sarlavha va `Sana: 2026-11-03`, `Soat: 10:04` tekshirildi. [Haqiqiy, secretlarsiz dalil](telegram-format-delivery-2026-11-03.json), [jarayon va chegaralar](telegram-setup.md). Bu to‘g‘ridan-to‘g‘ri Telegram transport testi: yangi ariza/akkaunt yaratilmagan, outbox yo‘li bu safar qayta sinalmagan. Ilova kodi o‘zgarmadi; unit/E2E testlari qayta bajarilmadi.

## Telegram ariza xabarini soddalashtirish — 2026-11-03, 09:58 (Asia/Tashkent)

Foydalanuvchi namunasi bo‘yicha sarlavha «Yangi ariza kelib tushdi.»ga almashtirildi, `ID:` qatori olib tashlandi; sana `YYYY-MM-DD`, soat alohida `HH:MM` shaklida Asia/Tashkent bo‘yicha chiqariladi. Ism/telefon/kurs/izoh va kabinet eslatmasi saqlanadi. Public havola mavjud bo‘lsa tugmasi ham saqlanadi; ichki outbox/lead ID va retry mexanizmi o‘zgarmagan.

`telegram.py` formatteri va tegishli testlar yangilandi: **13 passed (1.41s)**, Python F tekshiruvi o‘tdi. Worker yangi kod bilan qayta boshlandi, heartbeat tayyor, faol worker soni 1. Yangi real Telegram test xabari yuborilmadi; asosiy DBga sinov arizasi/akkaunti kiritilmadi. [Format, buyruqlar va tekshiruv chegaralari](telegram-setup.md#xabar-formati-yangilandi--2026-11-03-0958-asiatashkent).

## Audit, xatolarni tuzatish va qayta ishga tushirish — 2026-11-03, 09:42 (Asia/Tashkent)

Ro‘yxatdan o‘tishdagi 4 belgi cheklovi/uydirma kurslar, noto‘g‘ri kursga yozilish, pauzadagi hisoblarning yangi ariza deb tasdiqlanishi va bir studentning turli murojaatlardan takrorlanishi tuzatildi. Mavzu/reload/tab sinxronligi, local PWA register/unregister poygasi, forma lifecycle, Next havolalari va mobil arizalar jadvali yangilandi. Worker DB uzilishida xavfsiz qayta urinadi. Lokal Python symlinki barqaror interpreterga tiklandi.

`scripts/start-local.sh` endi readiness, log/PID, `--status` va `--production` rejimlari bilan ishlaydi; sog‘lom xizmatlarni qayta ishlatadi. Standalone frontend static/public fayllar bilan ishga tushadi. Joriy frontend build, backend va worker qayta ishga tushirildi; mavjud DB saqlandi. Takroriy startupda bitta worker qoldi. SW v11.

Tekshiruv: asosiy bazadan alohida PostgreSQLdagi integratsiyalarni ham qamragan **87 backend testi**, **11 frontend unit testi**, typecheck/build va Python F tekshiruvi o‘tdi. Frontend lint **0 error / 11 native-image warning**. Keng Chrome ishga tushirishda 25 test o‘tdi, 3 eskirgan/aniq bo‘lmagan fixture testi tuzatildi; keyingi 10 maqsadli test o‘tdi (jami 32 xil ssenariy muvaffaqiyatli tekshirildi, bitta 32-testli run sifatida taqdim etilmaydi). Mobil jadvalning oxirgi yaxshilanishidan keyingi build va **6/6 yakuniy test** o‘tdi. Batafsil buyruqlar, kuzatuvlar, screenshotlar va yakuniy natija [audit hisobotida](audit-fixes-2026-11-03.md). Test bazasi olib tashlandi va alohida test klasteri to‘xtatildi. Production/real Telegram/physical-device tekshiruvi bajarilmadi.

## Joriy koddan lokal ishga tushirish va tekshiruv — 2026-11-03, 09:21 (Asia/Tashkent)

Foydalanuvchining «loyihani o‘rganib chiq va run qil» so‘rovi bajarildi. Mavjud PostgreSQL klasteri 55432 da, FastAPI 8000 da, qayta yig‘ilgan Next.js frontend 3000 da va Telegram outbox worker ishga tushirildi. Yo‘qolgan `/tmp` socket papkasi o‘rniga `.local/postgres-socket` (700) ishlatildi; DB qayta yaratilmagan, seed/reset/migratsiya bajarilmagan.

Haqiqiy tekshiruv: backend live/ready, frontendning 8 sahifasi va public API proxy — 200; sessiyasiz teacher dashboard — 401. Alembic `0002_certificate_student (head)`. Backend **54 passed, 24 deselected** (`not postgres`), frontend **11 passed**, typecheck va production build o‘tdi. Worker heartbeat faol; yangi Telegram yetkazish testi qilinmadi. Dev server cheklangan shell’da EPERM berdi; ruxsatli `npm run start` bilan lokal frontend ishladi. Next.js standalone startup ogohlantirishi, bajarilgan buyruqlar va qolgan chegaralar [batafsil runtime hisobotida](local-startup-2026-11-03.md). Quyidagi eski startup yozuvlari tarixiy holatdir.

## Loyihani ishga tushirish — 2026-11-03

* **FastAPI Backend**: `http://127.0.0.1:8000` manzilida ishga tushirildi (`/health/live` HTTP 200 qaytardi).
* **Barcha xizmatlar uchun universal skript**: PostgreSQL (55432-port), FastAPI (8000), Telegram outbox worker va Next.js frontend (3000) ni bitta qadamda ishga tushiruvchi [`scripts/start-local.sh`](../scripts/start-local.sh) yaratildi va tayyorlandi.

## Loyiha auditi va server qayta yuklanishi tekshiruvi — 2026-11-03

Foydalanuvchi so‘rovi bilan butun loyiha to‘liq o‘rganildi va arxitektura auditi o‘tkazildi:
* **Muhit tekshiruvi**: Server restartidan keyin `.venv/bin/python3` interpretatoriga symlink qayta tiklandi va `scripts/backend` normal ishlashi ta’minlandi. Pytest orqali 48 ta test muvaffaqiyatli o‘tdi (30 ta test disposable DB talab qiladi).
* **Funksional holat**: Barcha 14 ta backend domen modullari, Next.js frontend, PWA v10, mustaqil ro‘yxatdan o‘tish va ustoz tasdiqlash (`/teacher/pending-students`), yangilangan oylik moliya hisoblari, L/R/W/S sertifikatlar va barcha ochiq sahifalar to‘liq tayyor.
* **Qolgan ishlar va chegaralar**: Haqiqiy marketing kontentini to‘ldirish ([content-checklist.md](content-checklist.md)) hamda jonli production serverga joylashtirish (deploy).

## Ustoz boshqaruv paneli (`/teacher`) 500 xatosini bartaraf etish — 2026-11-03

Foydalanuvchi murojaati bo‘yicha ustoz boshqaruv panelida (`/teacher`) paydo bo‘lgan "Server xatosi. Qayta urinib ko'ring" (HTTP 500) xatosi aniqlanib, to‘liq bartaraf etildi:
* **Xato sababi**: `backend/app/modules/reports/router.py` faylida kutilayotgan yangi o‘quvchilar sonini (`pending_students`) hisoblashda `User` modeli (`.join(User, Student.user_id == User.id)`) ishlatilgan, biroq `User` ushbu faylning `from app.db.models import (...)` importlar ro‘yxatiga qo‘shilmay qolgan edi. Oqibatda `/api/v1/teacher/dashboard` endpointiga so‘rov yuborilganda `NameError: name 'User' is not defined` xatosi kelib chiqib, 500 server xatosini qaytargan.
* **Tuzatish**:
  - `backend/app/modules/reports/router.py`: `from app.db.models import (...)` importiga `User` qo‘shildi.
  - Backend serveri (FastAPI uvicorn) qayta ishga tushirildi.
* **Tekshiruv**:
  - Python direct chaqiruv: `dashboard(date(2026, 11, 1), teacher, db)` to‘liq 200 OK va to‘g‘ri ma’lumotlar bilan ishladi.
  - HTTP tekshiruvi: Haqiqiy teacher sessiyasi bilan to‘g‘ridan-to‘g‘ri backend (:8000) va Next.js API proxy (:3000) orqali `/api/v1/teacher/dashboard` 200 OK qaytardi (`pending_students: 5`).
  - Brauzer E2E tekshiruvi (Chrome Playwright): `http://localhost:3000/teacher` sahifasi ochildi:
    - "Server xatosi" xabari butunlay yo‘qoldi (`false`).
    - Boshqaruv kartochkalari (Yangi arizalar, Faol o‘quvchilar, Faol guruhlar, Bugungi darslar, Tushum, Qarz, Yangi murojaatlar) va "E’tibor talab qiladi" bo‘limi to‘liq chiqdi.
    - Konsol xatoliklari soni: 0.
    - Tarixiy yozuvda `screenshot-teacher-dashboard-fixed.png` olingani qayd etilgan; 2026-11-03, 09:21 dagi fayl tekshiruvida bu artifact repositoryda topilmadi.
  - Regressiya testlari: 54 ta Pytest backend testi, 11 ta Vitest frontend testi va TypeScript typecheck to‘liq 100% muvaffaqiyatli o‘tdi.

## O‘quvchilarni mustaqil ro‘yxatdan o‘tkazish va ustoz tasdiqlash tizimi — 2026-11-03

Foydalanuvchi talabi bo‘yicha o‘quvchilar kabinetiga kirish va hisob ochish mexanizmi to‘liq yangilandi:
* **Kabinetga kirish formasi (`LoginForm.tsx`)**: "Kirish" va "Ro‘yxatdan o‘tish" tablari yaratildi. O‘quvchi to‘liq ism, telefon raqami, o‘zi o‘ylab topgan ixtiyoriy parol va o‘zi qatnashmoqchi bo‘lgan kursni tanlab, "Ro‘yxatdan o‘tish" tugmasini bosadi.
* **Kutish xabarnomasi**: Ariza muvaffaqiyatli qabul qilinadi. Ustoz tasdiqlamagunicha o‘quvchi tizimga kirishga uringanda, maxsus qahrabo (amber) rangli kartochka chiqadi: `"Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz."`
* **Ustoz panelida "Yangi o‘quvchilar" bo‘limi (`/teacher/pending-students`, `PendingStudentsView.tsx`)**: Saytdan mustaqil ro‘yxatdan o‘tgan barcha yangi o‘quvchilar arizalari (ismi, telefon raqami, tanlangan kursi, ro‘yxatdan o‘tgan sanasi) jadvalda aks etadi. Ustoz arizani yakka holda tasdiqlashi/rad etishi, yoki "✓ Barchasini birdan tasdiqlash" tugmasi orqali barcha kutilayotgan o‘quvchilarga bir vaqtning o‘zida kirish huquqini ochishi mumkin.
* **Eski o‘quvchi qo‘shish formasi olib tashlanishi (`ResourceView.tsx`)**: Ustozning o‘quvchilar ro‘yxatidan eski qo‘lda o‘quvchi qo‘shish formasi ("+ Yangi qo‘shish" tugmasi) olib tashlandi, uning o‘rniga "Yangi arizalarni ko‘rish →" havolasi qo‘yildi.
* **Backend API (`auth/router.py`, `students/pending.py`, `reports/router.py`)**:
  - `POST /api/v1/auth/register`: Inaktiv `User` (`active=False`), pauzadagi `Student` (`status="paused"`), `Lead` va Telegram outbox yaratiladi.
  - `POST /api/v1/auth/login`: Telefon yoki login orqali kirish; tasdiqlanmagan o‘quvchiga 403 `pending_approval` qaytariladi.
  - `GET /api/v1/teacher/pending-students`, `POST /{student_id}/approve`, `POST /{student_id}/reject`, `POST /approve-all`: Kutilayotgan arizalarni boshqarish va ommaviy tasdiqlash.
  - Dashboard ko‘rsatkichlariga `pending_students` va "E’tibor talab qiladi" havolasi kiritildi.
* **Tekshiruv**:
  - `scripts/backend -m pytest -q`: 54 passed.
  - `npm run test --prefix frontend` (Vitest): 11 passed.
  - `npm run typecheck --prefix frontend`: 0 xato.
  - `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/student-registration.spec.ts tests/e2e/inline-contact.spec.ts tests/e2e/compact-lead.spec.ts`: 8 passed (22.5s).
  - QA skrinshotlari tayyorlandi: [cabinet-login-tab.png](qa/cabinet-login-tab.png), [cabinet-register-tab.png](qa/cabinet-register-tab.png), [cabinet-register-success.png](qa/cabinet-register-success.png), [cabinet-login-pending-notice.png](qa/cabinet-login-pending-notice.png), [teacher-students-no-add-btn.png](qa/teacher-students-no-add-btn.png), [teacher-pending-students.png](qa/teacher-pending-students.png), [teacher-bulk-approve-dialog.png](qa/teacher-bulk-approve-dialog.png). [Batafsil hisobot](student-registration-and-approval-workflow.md).

## Sertifikat kartochkalarini ixchamlashtirish va L/R/W/S qisqartmalari — 2026-11-02

Foydalanuvchi so‘rovi bo‘yicha Natijalar bo‘limidagi sertifikat kartochkalari uzunligi qisqartirildi va IELTS ko‘rsatkichlari ixchamlashtirildi:
* **IELTS ko‘rsatkichlari (`ResultsSection.tsx`)**: Uzun so‘zlar ("Tinglab tushunish", "O‘qish", "Yozish", "Gapirish") o‘rniga foydalanuvchi so‘raganidek ixcham xalqaro format `L:`, `R:`, `W:`, `S:` ga o‘tkazildi. Har biriga to‘liq nomini ko‘rsatuvchi `title` qo‘shildi.
* **Ball va sana qatori**: `Umumiy ball` va sana chap tomonga ixcham ustun shaklida, o‘ng tomonga esa ball qo‘yilib, alohida sana qatori tejaldi.
* **CSS ixchamlashtirish (`ResultsSection.module.css`)**: `.details` paddingi `16px 20px 22px` dan `10px 14px 14px` ga, sarlavha `19px` dan `15.5px` ga, `score strong` `36px` dan `24px` ga tushirildi; `.skillGrid` 2 qatorli grid o‘rniga 1 qatorli 4 ustunli qilib sozlandi (`grid-template-columns: repeat(4, minmax(0, 1fr))`). Kartochkaning pastki ma’lumot qismi balandligi ~260px dan ~140px ga (120px) qisqardi.
* **Tekshiruv**: TypeScript typecheck 0 xato, 11 ta Vitest frontend unit testi, 54 ta Pytest backend testi, 18 ta Playwright Chrome E2E testi (public-grid, mobile-responsive, navigation-responsive) 100% muvaffaqiyatli o‘tdi. Desktop ($1440 \times 1100$) va mobil ($375 \times 812$) Chrome skrinshotlari olinib, kartochkalar bir tekis, ixcham va to‘liq sig‘ishi tasdiqlandi. [Batafsil hisobot](compact-certificate-results-update.md).

## Bosh sahifadagi ustoz logotipi (Hero portreti) yangilanishi — 2026-11-02

Foydalanuvchi taqdim etgan sinfxonadagi fotosurat (yashil doska oldida oq ko‘ylakda turgan Sherzod ustoz) bosh sahifaning (Hero sektsiyasi) asosiy dumaloq ustoz logotipi/portretiga muvaffaqiyatli o‘rnatildi:
* **Fotosuratni qirqish va moslashtirish**: Foydalanuvchi taqdim etgan sinf fotosuratidan ortiqcha chetlardagi o‘quvchilar kesilib, Sherzod ustozning qiyofasi, oq ko‘ylagi va oldida bog‘langan qo‘llari markazga olingan holda $560 \times 560$ piksel o‘lchamli sifatli kvadrat portret tayyorlandi (`frontend/public/teacher/sherzod-hero.png`).
* **Hero CSS ramkasi (`HeroSection.module.css`)**: Oldingi `transform: scale(1.24)` o‘rniga `object-position: 50% 22%; transform: scale(1.06); transform-origin: 50% 22%;` qo‘llandi. Dumaloq sariq hoshiyali ramka ichida ustozning yuzi markazda, qiyofasi ravshan va pastdagi nishon ("Sherzod Allamurodov · Ingliz tili o‘qituvchisi") bilan to‘liq uyg‘un holatga keltirildi.
* **Frontend va Backend sinxronligi**: `PublicSite.tsx` da `portraitUrl={hero?.media_url ?? bio?.media_url ?? "/teacher/sherzod-hero.png"}` ishonchli zaxirasi o‘rnatildi. Shuningdek, backend disk xotirasidagi `.local/media/public/a7efbc48-369e-455f-835e-db79572a32c9.webp` hamda PostgreSQL `MediaAsset` yozuvi yangilandi; API orqali chiquvchi ma’lumotlar ham yangi fotosuratga to‘liq moslashtirildi.
* **Tekshiruv**: TypeScript typecheck 0 xato, 11 ta Vitest frontend unit testi, 54 ta Pytest backend testi, 18 ta Playwright Chrome E2E testi (navigation, mobile-responsive, public-grid) 100% muvaffaqiyatli o‘tdi. Desktop ($1440 \times 900$) va mobil ($375 \times 812$) vizual skrinshotlari olinib, portretning dumaloq hoshiyada chiroyli turishi tasdiqlandi. [Batafsil hisobot](homepage-hero-logo-update.md).

## Ustoz profili banneri dizaynini yangilash, yangi fotosurat va tavsif kartochkalari — 2026-11-02

Foydalanuvchi so‘rovi bo‘yicha `/about` sahifasidagi ustoz profili bannerining dizayni to‘liq yangilandi, eski rasm o‘rniga yangi taqdim etilgan 2-fotosurat qo‘yildi va pastdagi tavsiflar boyitildi:
* **Fotosurat integratsiyasi**: Taqdim etilgan yangi portret (`media_1793637863404.png`, 317x496) o‘ng tomondagi ortiqcha yeng qismi kesilib, x=(0, 0, 274, 496) proporsiyasida Sherzod ustoz markazlashtirildi. Tayyor portret `frontend/public/teacher/sherzod-portrait.png` ga joylashtirildi, shuningdek `.local/media/public/a7efbc48-369e-455f-835e-db79572a32c9.webp` yangilanib, API orqali chiquvchi joylar ham sinxronlashtirildi.
* **Banner dizayni (`TeacherAboutSection.module.css`)**:
  - Banner korpusi: 28px silliq yumaloq burchaklar, nozik binafsha border (`1px solid rgba(88, 23, 109, 0.12)`), oq/binafsha mayin gradient, ko‘p qatlamli chuqur soya va fonga tushuvchi nozik radial ambient nurlar (`::before`, `::after`).
  - Portret ramkasi: 22px yumaloq ramka, oq ichki chegara, tepada suzuvchi `⭐ 18+ yillik tajriba` shaffof glassmorphic nishoni va hoverda mayin kattalashish.
  - Sarlavha va nishon: `✦ USTOZ HAQIDA · SHERZOD ENGLISH` gradient nishoni, `Sherzod Allamurodov` qalin sarlavhasi, `Oliy toifali ingliz tili o‘qituvchisi · IELTS & CEFR instruktori` unvoni.
  - 4 ta ko‘rsatkich kartochkalari (`.facts`): Har biri alohida mayin gradient (qizil, oltin, yashil, binafsha), nozik border va hoverda yuqoriga ko‘tarilish effekti bilan.
  - Sertifikatlar: Shaffof shisha foni, silliq oq kartochkalar, `O‘quvchilar sertifikatlaridan` va `Barcha natijalarni ko‘rish ↗` havolasi.
* **Pastdagi tavsif va matnlar dizayni (`.biography`, `.body`)**:
  - Chap ustun: `USTOZ BILAN TANISHING` sariq nishon, sarlavha va yangi **Pedagogik falsafa kartochkasi (`.bioPhilosophyCard`)** (kredo iqtibosi va 3 ta tekshirilgan ustunlik belgilari).
  - O‘ng ustun: Alohida ajralib turuvchi binafsha gradientli kirish kartochkasi (`.bioLeadCard`) hamda har bir yo‘nalish uchun tematik ikonka va sarlavhali interaktiv kartochkalar (📚 Grammatika, 🎯 IELTS, 🌐 SEFR, 💻 Shaxsiy kabinet, ✍️ Ro‘yxatdan o‘tish).
  - Dark va Light mavzularda to‘liq kontrastli va qulay o‘qilishi ta’minlandi.
* **Mobil versiyada skroll qilinganda matnlar bir-biriga minib qolish xatosi bartaraf etildi**:
  - `position: sticky; top: 100px` qoidasi mobil va planshetlarda (`max-width: 1024px`) olib tashlanib, `position: static` qilindi; sticky faqat katta desktop ekranlarda (`min-width: 1025px`) saqlandi. Eski ziddiyatli media-qoidalar tozalab birlashtirildi. Mobil skroll paytida har bir kartochka bir-birining ustiga chiqmasdan, tabiiy ketma-ketlikda (bitta-bitta) tekis va chiroyli o‘qilishi ta’minlandi.
* **Tekshiruv**: TypeScript typecheck 0 xato, 11 ta Vitest frontend testi, 2 ta `teacher-profile.spec.ts` testi (320px–1920px), 12 ta `mobile-responsive.spec.ts` testi va to‘liq 20 ta Playwright Chrome E2E testi 100% muvaffaqiyatli o‘tdi. Mobil skroll paytidagi 3 ta real skrinshot olinib, matnlar ustma-ust tushmasligi tasdiqlandi. [Batafsil hisobot](teacher-profile-banner-redesign.md).

## Ustoz haqida bo‘limiga 3 ta dars jarayoni fotosuratlarini joylashtirish va editorial dizayn — 2026-11-02

Foydalanuvchi taqdim etgan 3 ta haqiqiy sinf/dars fotosurati asosiy sahifadagi (homepage) "Ustoz haqida" bo‘limiga va `/about` sahifasiga to‘liq joylashtirildi:
* **Fotosuratlar**: `frontend/public/teacher/` katalogiga ko‘chirildi: `sherzod-lesson.png` (doska oldida grammatika metodikasi), `sherzod-individual.jpg` (o‘quvchi partasida individual e’tibor), `sherzod-interactive.jpg` (zamonaviy smart-doskada interaktiv dars).
* **Asosiy sahifa dizayni (`HomeIntroPreviews.tsx`, `HomePreviews.module.css`)**:
  - Senior designer yondashuvi bilan 3 bosqichli navbatma-navbat (zigzag / alternating) editorial hikoya strukturasi joriy etildi.
  - 1-hikoya: Doska oldidagi rasm (chapda) + "01 · METODIKA VA TAJRIBA" sarlavha va matn, 3 ta highlight pilli ("Chuqur tushuntirish", "Mantiqiy yondashuv", "Nol dan C1 gacha").
  - 2-hikoya: Individual e’tibor matni (chapda) + o‘quvchi bilan parta yonidagi rasm (o‘ngda) + "02 · INDIVIDUAL E’TIBOR", 3 ta highlight pilli ("Xatolarni tahlil qilish", "Shaxsiy feedback", "Doimiy nazorat").
  - 3-hikoya: Smart-doskadagi interaktiv rasm (chapda) + "03 · ZAMONAVIY TA’LIM" sarlavha va matn, 3 ta highlight pilli ("Interaktiv darslar", "IELTS / CEFR strategiyasi", "Haqiqiy natijalar").
  - Pastki ishonch footer bloki: 18+ yil tajriba, 1000+ ta’lim olganlar, 500+ sertifikat olganlar pashshasi, "Ustoz haqida to‘liq tanishish →" tugmasi (`/about#classroom-moments` ga olib boradi) va "Kursga yozilish" modal tugmasi.
* **`/about` sahifasi uyg‘unligi (`TeacherAboutSection.tsx`, `TeacherAboutSection.module.css`)**: "Dars jarayonidan lavhalar" maxsus 3 ustunli kartochkalar bloki qo‘shildi.
* **Responsivlik**: Keng ekranlarda nafis 2 ustunli CSS grid, mobil qurilmalarda (860px va 550px) 1 ustunli vertikal tartib va rasm har doim matn tepasida joylashishi (`order: -1`) ta’minlandi.
* **Tekshiruv**: TypeScript typecheck 0 xato, 11 ta Vitest frontend testi, 20 ta Playwright Chrome E2E testi (navigation, public-grid, teacher-profile, mobile-responsive) 100% muvaffaqiyatli o‘tdi. [Batafsil hisobot](teacher-showcase-photos-update.md).

## React Hydration Mismatch xatosini bartaraf etish (Service Worker dev-keshini tozalash) — 2026-11-02

Foydalanuvchi `/login` sahifasini ochganda paydo bo‘lgan `Console Error: A tree hydrated but some attributes of the server rendered HTML didn't match the client properties (BrandLogo size="lg" vs "md", type="submit")` xatosi to‘liq bartaraf etildi.
* **Sababi**: PWA Service Worker (`sw.js`) oldingi `v9` versiyasida dinamik `/_next/static/` chanklarini keshlab olgan edi. Server yangilangan `BrandLogo size="md"` va `type="submit"` ni uzatganda, brauzer service worker'i eski keshdagi `size="lg"` bo‘lgan JS chankini qaytargan va React gidratsiya tafovutini qayd etgan.
* **Yechim**: `frontend/public/sw.js` versiyasi `sherzod-public-v10` ga ko‘tarildi, `self.skipWaiting()` qo‘shildi; `localhost` va `127.0.0.1` bo‘lganda eski keshlar darhol tozalanishi va rivojlantirish muhitida dinamik Next.js chanklari keshlanmasdan to‘g‘ridan-to‘g‘ri tarmoqdan yuklanishi belgilandi. `frontend/src/components/PWA.tsx` da localhost'dagi faol SW'lar va keshlar tozalanadigan qilindi; `PasswordForm.tsx` dagi `BrandLogo` ham `size="md"` qilinib, `button type="submit"` birxillashtirildi; `.next/cache` tozalandi.
* **Tekshiruv**: Playwright Chrome orqali konsol hodisalari to‘liq tinglandi: `/login`, `/`, `/about`, `/courses`, `/results`, `/faq`, `/contact` yo‘nalishlarining har birida **0 ta konsol xatosi** (to‘liq toza). 12 mobile-responsive Playwright testi, 11 vitest testi, 54 pytest testi va typecheck 100% muvaffaqiyatli o‘tdi.

## Moliya hisoblari soddalashtirilishi, 3s bildirishnomalar va ixcham kirish — 2026-11-02

Foydalanuvchi so‘rovi bo‘yicha 3 ta asosiy qism to‘liq amalga oshirildi:
1. **Kirish bo‘limi (`/login`)**: Kartochka maksimal kengligi `390px`, padding `24px 26px`, border-radius `20px`, sarlavha `24px` va form oralig‘i `12px` ga tushirilib, vertikal o‘lchami ixcham, nafis va mutanosib qilindi.
2. **Bildirishnomalar (Notifications)**: Amal bajarilgandan keyin chiqadigan bildirishnoma avtomatik yopilish taymeri 3000ms (3 soniya) qilib belgilandi.
3. **Moliya bo‘limidagi hisoblar (Hisoblar — yangi yozuv)**: Tushunarsiz va ortiqcha "Davr boshi" hamda "Davr oxiri" kiritish maydonlari olib tashlandi. Uning o‘rniga o‘qituvchi uchun qulay "Qaysi oy uchun" (oy tanlagich) va "Sana (qaysi kuni bo‘ldi)" (kun tanlagich) maydonlari joriy etildi. Backend Pydantic validator (`InvoiceIn`) va Frontend form kiritilgan oy va sanadan foydalanib PostgreSQL'ning `period_start`, `period_end` va `due_date` talablarini avtomatik to‘ldirishi ta’minlandi; mavjud bazadagi jadvallar, qarzlar va eski hisoblar butunligi saqlandi.

Tekshiruvlar: 12 Playwright mobile-responsive E2E testi, 4 Playwright interface-notifications testi, 11 vitest frontend unit testi, 54 pytest backend testi va TypeScript typecheck to‘liq 100% muvaffaqiyatli o‘tdi. [Batafsil hisobot](finance-simplification-and-login-compact-update.md).

## Development CSP xatosi va desktop o‘lchamlari/tugmalar takomillashtirilishi — 2026-11-02

Foydalanuvchi murojaati bo‘yicha rivojlantirish (dev) rejimida konsolda paydo bo‘lgan `eval() is not supported in this environment (Content-Security-Policy unsafe-eval)` xatosi to‘liq bartaraf etildi (`next.config.ts` dinamik isDev CSP: devda 'unsafe-eval' va 'ws: wss:' ruxsat etildi, productionda qat’iy xavfsiz siyosat saqlab qolindi). Fullstack arxitektor va senior dizayner sifatida desktop versiyasidagi barcha asosiy elementlar 15–20% proporsional ixchamlashtirildi: konteyner max-width 1640px dan 1360px ga, vertikal section paddinglari, sarlavha va matn shriflari, tugmalar (min-height: 42px, kichik: 36px va min-width: 74px) va inputlar zamonaviy, nafis ko‘rinishga keltirildi. Radix Dialog focus restoration marshrutlar o‘rtasida mustahkamlandi. 26 Playwright Chrome E2E testi (jumladan 12 ta mobile-responsive va 14 ta lead/contact/navigation/grid/profile), 11 frontend unit testi, 54 backend testi va typecheck 100% muvaffaqiyatli o‘tdi. [Batafsil hisobot](csp-and-desktop-scaling-update.md).

## Local runtime activated — 2026-11-02

Started all local services at user request. PostgreSQL connection verified on port 55432 (Alembic at head `0002_certificate_student`). Launched FastAPI backend on 127.0.0.1:8000, Telegram outbox worker, and Next.js frontend dev server on port 3000. Verified HTTP 200 for backend readiness (`/health/ready`), frontend home (`/`), login (`/login`), and backend API proxy (`/api/v1/public/site`). All services are actively serving requests.

## Workspace architecture & runtime status audit — 2026-11-02

Completed a full workspace structure and runtime audit at user request. All core application components (FastAPI backend with 14 domain modules, Next.js 15 App router frontend, PostgreSQL integration, and Telegram outbox worker) are fully built and tested through 19 implemented phases. Current runtime check: PostgreSQL 15/17 is active and listening on port 55432; Next.js (port 3000) and FastAPI (port 8000) dev processes are currently idle/stopped, ready to be started via `scripts/backend` and `scripts/frontend`. All previous 71 backend, 11 unit and E2E regression tests remain passing. No application code, business data, credentials or schema were modified.

## Search suggestions and date-free enrollment — 2026-11-02

Replaced the shared record Lookup's separate search/select controls with one accessible typeahead across students, groups, courses and invoices. Existing selections resolve to names; editing text clears the old ID. Added keyboard/touch, empty/loading/error/retry and bounded server search. Both enrollment entry points omit date fields; backend defaults the membership using its Asia/Tashkent day and group bounds, preserving explicit-date clients and overlap/capacity/role checks. Added scoped invoice search and refreshed OpenAPI. 71 backend tests, 11 units, 11 isolated Chrome journeys and 4 final main-build UI/touch checks passed; production build/TypeScript and targeted lint passed. Main frontend/backend restarted, login/readiness returned 200. No main business data, password or schema reset. [Full report and evidence](search-enrollment-update.md).

## Notifications, resource dialogs and Uzbek interface — 2026-11-02

Added compact global mutation/upload/download notifications, centered detail dialogs across 13 teacher resources, nested-dialog focus preservation, Uzbek fields/statuses/validation/CSV, localized dates/money, responsive login/password controls and horizontal logos. Fixed stale client CSRF after cookie refresh with bounded pre-business rejection retry. Native file controls now show Uzbek copy. No main business records, account/password or schema changes. 69 disposable PostgreSQL backend tests, 11 unit tests, 16 isolated Chrome journeys and 24 primary public/mobile regressions passed (one CSV test intentionally skipped on main, passed in isolation); final file-control upload/CRUD rerun passed all 3 journeys; production build/TypeScript, 11 units and targeted new-file lint passed again. Both live roles and the actual result modal passed read checks. Lint remains with 5 pre-existing errors / 12 warnings; generated QA output is now excluded. [Detailed implementation, evidence and limits](notifications-dialogs-localization.md).

## Teacher payments/groups/certificates — 2026-11-02

Added reasoned payment correction and idempotent void/delete with allocation/debt recalculation; group course/count/weekly start-end clocks, dashboard overview and history-preserving archive/cancel; student-linked certificate CRUD with atomic consented publication and own-student views. Added migration 0002 private Content.student_id + archive flag, safe public DTOs, visible-page revision polling/BroadcastChannel and student certificate refresh. 68 backend tests passed on disposable PostgreSQL; certificate search refinement passed a focused rerun. Build/typecheck, 5 unit tests, 3 real disposable Chrome CRUD journeys and 18 primary public/mobile regressions passed. Main DB migration and both live role read checks passed. A disposable restore proved all original columns/IDs in seven business tables unchanged, including the four existing payments; no QA business records in main. Frontend/backend restarted, SW v8. [Full report](teacher-management-update.md).

## Owner-requested demo credentials and 1000+ — 2026-11-02

Changed both draft/public taught-student values from 5000+ to 1000+. Updated existing local teacher and demo-student credentials through hidden input, preserving IDs and business records; old sessions revoked and password hashes remain Argon2id. Teacher accepts `<private-teacher-login>` through existing normalization, student login is exactly `<private-student-login>`. No credential values stored in source/Markdown and no production defaults introduced. Phone was not provided; contact unchanged and clarification requested. Updated CMS example, live-statistic E2E expectations and configurable E2E usernames. Build/typecheck, 5 unit and 5 Chrome regression tests passed; both real browser logins/dashboard 200, cross-role 403 and logout 401 verified at 375/1440 px. This supersedes earlier teacher-demo-login and 5000+ current-state notes. Frontend restarted; SW v7. [Report](demo-access-update.md), [secret-free evidence](demo-access-verification.json).

## Automatic work documentation — 2026-11-02

At the owner's request, consolidated the known project history and current state in [project-journal.md](project-journal.md), added the [documentation index](README.md), and recorded mandatory documentation-after-each-task instructions in root [AGENTS.md](../AGENTS.md). Subsequent implementation, investigations, runtime changes, failed/partial work and verification limits must be documented without waiting for a user reminder. Documentation checks covered 5 Markdown files, 97 local links (none missing), 15 journal entries and balanced code fences; no application code or services changed and no application tests rerun for this documentation-only task.

The journal's current-state summary and the newest entries below supersede older dated implementation reports. Historical numbers, removed routes and earlier environment blockers are retained as history, not current claims.

## Mobile layouts and PWA notice — 2026-11-02

Refined public/mobile teacher images and captions, responsive private navigation, touch controls, inputs, forms, schedule/attendance rows, safe-area spacing and dialog focus restoration. Added accessible table scroll regions/hints and prevented vertically broken action labels. Rebuilt the optional install/update notice with measured page spacing, dismissal persistence, standalone detection, pending/error states and suppression during menus/dialogs/form work. Public SW cache is v6. Production build, strict typecheck and 5 unit tests passed. A 26-test Chrome regression suite passed; the final table correction was followed by 3 passing focused reruns. Real student login/API checks passed on 24 route/viewport combinations; teacher layout uses explicit fixtures because existing demo credentials did not authenticate. No password reset/business data changes. See [full evidence and limits](mobile-responsive-update.md). Frontend restarted at localhost:3000.

## Markaz haqida removed — 2026-11-02

Removed the center preview from home, its desktop/mobile navbar item, /center route, sitemap entry and unused dedicated section component. Home now has five section previews. Existing CMS data was retained. Production build passed; three focused Chrome journeys verified no center link/preview, /center returning 404, sitemap exclusion and the remaining navigation/course modals. Frontend restarted at localhost:3000; public cache version is v5.

## Inline application on the contact page — 2026-11-02

/contact now shows one compact application form immediately. Removed its duplicate launch button, lower CTA banner and modal; the page scrolls normally with no overlay. Inline and modal appearances share one validated/API-backed form implementation. Existing home/course/teacher modal entry points remain functional. Build/typecheck, 5 unit tests and 16 Chrome public E2E tests passed; inline screenshots at 320–1920 px were checked. See [implementation and evidence](inline-contact-form.md).

## Compact application form and contact banner — 2026-11-02

Removed the teacher image/decorative side panel from the application dialog and reduced maximum desktop width from 1330 to 560 px. Heading, fields, submit button and contact banner/intro are smaller; mobile stacks and sticky close accessibility were checked. Existing API submission, course selection, validation and error retention were reused. Build/typecheck and 5 unit tests passed; 13 public Chrome regression tests passed, with targeted contrast/modal checks rerun after final refinement. See [details and screenshots](compact-application-form.md).

## Navigation, confirmed figures and responsive correction — 2026-11-02

Fixed page-transition/same-page scroll behavior so the requested page heading appears instead of a retained lower contact block. Reduced the desktop teacher panel from 983 px to about 671 px height at 1440 px. Teacher CMS now stores owner-confirmed 18+ years and 5000+ students; homepage statistics show 18+ yil / 5000+ / 500+ certificate recipients / 200+ DTM entrants. Invalid CMS publication returns 422 while retaining its public snapshot. Build/typecheck, 5 unit tests, 63 backend tests on disposable PostgreSQL, and 10 Chrome E2E tests passed. Public API proxy/error/permission responses were checked, plus 84 responsive public route/viewport combinations. See [full evidence](navigation-responsive-update.md). This supersedes earlier course-count/cabinet tiles and sample-count marketing figures.

## Teacher profile reference layout and expanded description — 2026-11-01

/about now matches Screenshots/ustoz_haqida.png with a large portrait, Sherzod Allamurodov identity, four pastel information cards and certificate previews. Personal credentials/experience counts were not fabricated; student documents are explicitly identified. A six-paragraph factual course/portal description was published to the existing CMS body and rendered beneath the panel. Teacher media/video/certificate selections were retained, and home keeps a short excerpt. Build/typecheck, 5 unit tests and 7 Chrome E2E tests passed, including 320–1920 px profile QA, certificate zoom/Escape and enrollment. See [detail and screenshot evidence](teacher-profile-update.md).

## Homepage section previews — 2026-11-01

The home page now shows brief teacher/center information, four certificate cards (two IELTS, two CEFR), three compact courses, three FAQ items and the contact banner. Each section links to its complete page. Existing Course/Results/FAQ components gained preview modes; standalone pages retain their full content and filters. Build/typecheck, 5 unit tests and 5 Chrome E2E tests passed. Responsive checks at 320/375/768/1440/1920 px found no horizontal overflow. See [details and screenshots](home-overview.md). This supersedes the earlier bare home-page link grid description.

## Separate public pages and supplied certificates — 2026-11-01

Latest requested update complete: navbar routes now open /about, /center, /courses, /results, /faq and /contact. Home retains hero/statistics and section links. Existing components/API were reused. Results use five owner-supplied, privacy-redacted certificate images for 30 IELTS + 30 CEFR marked repeat cards, four desktop columns, 3:4 image frames, SSR filters and full-score/date summaries. Originals are private; production excludes samples. Existing 40 sample IDs were retained and 20 added. Build/typecheck, 5 frontend unit tests, 62 backend tests on disposable PostgreSQL and 4 Chrome E2E tests passed; 320–1920 px results and all separate mobile/desktop pages were checked without overflow. See [implementation, commands and screenshot evidence](public-pages-plan.md). Earlier single-page/40-sample descriptions below are historical.

## Teacher portrait — 2026-11-01

Owner-supplied `Screenshots/ustoz_logo.png` was ingested through the existing validated public-media pipeline and linked to the published teacher profile. Other draft text was preserved. The hero uses that CMS portrait in a circular frame with a narrow yellow gradient rim and soft shadow. The crop was refined to a 1.24× CSS zoom centered on the teacher’s face; the original source image is unchanged. Frontend build/typecheck passed. Chrome checks at 375 and 1440 px verified image decoding, circular cover layout and no page overflow; screenshots: [mobile](qa/portrait-375.png), [desktop](qa/portrait-1440.png).

## Current Telegram connection — 2026-11-01

The owner-provided bot and group are connected in private `.env`. A real browser-submitted IELTS test lead was accepted by FastAPI (201), committed with its outbox and delivered through the worker: Telegram returned `ok: true`, the outbox is `sent` with no safe error. Fixed a discovered Telegram rejection of localhost inline-button URLs: local/private URLs now omit that button while preserving the lead message; public app URLs retain the authenticated detail link. 48 backend regression tests passed (including 9 delivery-payload cases). Backend and the persistent worker were restarted; site/readiness returned 200. Earlier missing-credential and unverified-delivery notes below are historical. See [Telegram setup, evidence and local hosting limits](telegram-setup.md).

## Current homepage update — 2026-11-01

Hero resized; navbar anchors Asosiy/Ustoz/Markaz/FAQ added; three-course grid and four-column certificate grid integrated. Explicit development preview contains 40 marked sample results (20 IELTS, 20 CEFR); production filters them out without fabricating consent. Existing application modal/API/outbox reused. Build/typecheck, 5 frontend unit tests, 52 backend tests including real PostgreSQL API scenarios, and 3 Chrome E2E tests passed. Responsive checks at 320/375/768/1440/1920 px passed with no horizontal overflow. A real sample lead returned 201 and was verified in PostgreSQL, linked to IELTS with Telegram disabled. Token/chat ID remain missing; no delivery claimed. See [full update and commands](homepage-update.md), [screenshots](qa/hero-1440.png), [E2E results](e2e-results.json).

The earlier verification boundaries and environmental blockers below are historical. Newer dated reports above supersede them for the checks explicitly rerun, including the recorded real Telegram delivery. Docker execution, public deployment and external object storage remain unverified.

## Password policy update

Owner-requested removal of the 12-character minimum and 256-character maximum was applied to backend login/change/reset schemas, frontend forms and CLI/bootstrap/dev seed. Nonempty passwords of arbitrary characters are accepted without trimming. Regression checks: 39 schema/hash/HTTP tests passed; 3 actual PostgreSQL API scenarios passed in a new disposable test database for single-character, whitespace-preserving and long Unicode passwords across reset, forced change, logout and login. Existing demo accounts were not changed. Frontend typecheck and production build passed; backend/frontend services were restarted with the update.

## Subsequent local startup

At the owner's explicit startup request, the revised permission policy allowed the missing locked Python dependencies to be installed and local socket listeners to run. PostgreSQL now runs on loopback port 55432 with a dedicated `sherzod_english` database/role, peer authentication for the Unix owner and SCRAM for other local/TCP connections. A private ignored `.env` was created. The actual Alembic runner completed successfully on the new empty application database, and an explicit development seed created teacher/student accounts with random passwords.

Frontend, backend and worker were started. HTTP checks through the real frontend proxy returned 200 for home/login and both role logins/dashboard APIs; student access to teacher endpoints returned 403. See [local-runtime.json](local-runtime.json). Plaintext login passwords were handed to the owner rather than saved in source or application logs. This resolves the historical dependency/listener blockers described below; the earlier full integration/browser acceptance results remain historical and have not been rerun by this startup request.

Date: 2026-11-01. **Core implementation is present; production acceptance is not complete.** No public deployment or paid resource was created.

## Initial state and reference audit

The supplied workspace had 23 frontend files, no route pages, no installed local dependencies, and empty backend/docs/infra structures. Git metadata is empty and read-only in this workspace, so there is no usable commit history or diff baseline. Existing useful components were retained and connected; the incompatible bento layout, inactive video control, missing page composition and resources were corrected.

Screenshots `1.png` through `8.png` were all viewed individually. They are desktop sections of one reference site; browser chrome is excluded. No ninth/modal screenshot was supplied. The written modal specification was used. No reference teacher photograph, student identity, certificate, phone, price or score was republished as Sherzod's data.

## Implementation present

| Stage | Code provided | Verification boundary |
| --- | --- | --- |
| Foundation | FastAPI modular monolith, 27 SQLAlchemy tables, explicit frozen Alembic SQL migration, cookie sessions, signed CSRF + Origin validation, roles and scoped student access | Import, compilation, HTTP security tests and PostgreSQL schema tests passed. Full Alembic runner/live DB session tests pending |
| Public site + leads | SSR public routes, retained/corrected marketing components, FAQ, accessible dialogs/lightbox, course/result filters, versioned CMS publishing, consent, binary media uploads, Lead + outbox transaction, leased worker and Telegram adapter | Frontend build/typecheck and API failure tests passed. Real lead/outbox HTTP transaction and Telegram delivery pending |
| Teaching operations | Student records/accounts, archive/reset, groups/rules, dated membership/transfer/end, bounded idempotent lesson generation, conflict checks, cancellation/rescheduling, attendance bulk upsert, teacher student-history view | PostgreSQL interval/unique/check constraints passed. Live transfer/attendance/journey tests pending |
| Finance | Draft/issue/void invoices, monthly generation, immutable issued history, Decimal adjustments, payment allocation/credit, refund, stable idempotency response snapshots, SQL aggregates and CSV protections | Arithmetic, precision, dates and actual PostgreSQL aggregate/constraints passed. Parallel allocation/refund/transaction tests pending |
| Student workspace | Scoped dashboard/schedule/attendance/billing, assignment submission revisions/feedback, assessments/materials, contact whitelist and forced password change | Pages compile/build; whitelist/schema tests passed. Real authorization and end-to-end state changes pending |
| Delivery | Local fonts/license, PWA manifest/icons/offline shell/update UI, API error states, Compose with healthchecks, HTTPS proxy sample, backup/restore instructions, CLI/bootstrap/dev seed | Compose YAML parsed. Docker, browser/offline/visual comparison and restore rehearsal not run |

## Observed checks

- `scripts/test-backend -q --junitxml=../docs/backend-test-results.xml`: **38 passed, 9 skipped**, zero failures/errors. The skipped tests explicitly require a live disposable PostgreSQL `*_test` database.
- Of the 38 passing tests, **6 run actual PostgreSQL 15 in standalone mode** against a newly initialized disposable cluster: frozen migration SQL, financial aggregate, membership/lesson exclusions, attendance uniqueness/status, period uniqueness, idempotency uniqueness and single-teacher enforcement. They do **not** replace normal Alembic/SQLAlchemy/HTTP transaction or concurrency tests.
- The remaining passing tests cover phone/consent/band validation, student edit whitelist, money strings, monthly UTC/Tashkent boundaries, finance arithmetic, media signature/size/alpha, CSV formula protection, retries, production configuration, CSRF/Origin, safe HTTP errors and actual request body limits.
- `npm run typecheck --prefix frontend`: passed with strict TypeScript.
- `npm run test --prefix frontend`: **5 passed** (real API client failure/CSRF/idempotency contract and full money precision).
- `npm run build --prefix frontend`: production build passed; public routes, private workspaces and offline route generated successfully. Type checks were not disabled; the supported TypeScript compiler API is used instead of CLI output parsing on this restricted host.
- Backend import/bytecode compilation and Ruff undefined/unused-name checks passed. Installed cached-core `pip check` found no broken installed requirements; this does not validate uncached deployment adapters.
- Frontend manifest and lock root agree; lock installation planning was checked offline. Normal complete target-platform dependency installation still needs network access.
- Compose YAML parsed; PostgreSQL is not exposed on a host port; frontend/backend bind loopback.
- Playwright attempted **8 tests**: browser launch failed before the first journey because its Chromium binary is absent; **7 did not run**. No browser journey passed. No QA screenshot or Lighthouse score was produced.

Evidence: [backend XML](backend-test-results.xml), [verification summary](verification-summary.json), [Playwright JSON](e2e-results.json), [OpenAPI](openapi.json).

## Environment blockers actually encountered

1. Registry DNS/network requests failed. An escalated backend package installation request was automatically rejected because this session's approval policy forbids sandbox escalation. Cached core Python packages and existing third-party Node package files were used without modifying the other project's source.
2. `uvicorn` imported the app and completed startup, then could not bind `127.0.0.1:8000`. Next.js start failed with `EPERM` on port 3000. PostgreSQL TCP **and Unix-domain** socket creation were also denied. Consequently there is no running preview or live API/DB integration session to claim.
3. Docker is not installed in this executor. Compose build/run, healthcheck behavior and restore execution remain unverified.
4. Alembic, HTTPX, pydantic-settings and S3 adapter packages were not available in the local cache and could not be installed. Their exact deployment pins and adapters are supplied. Development config validation uses a documented Pydantic fallback; production refuses that fallback.
5. No Telegram or storage credentials, real contact details, teacher portrait or consented results were supplied. Adapters/configuration exist; no message delivery or external object-store connection was claimed.

## Required continuation on a host that permits sockets/network

1. Install the full locked environment and Chromium. Run `pip check` against the complete deployment lock, then Alembic against an empty disposable PostgreSQL database.
2. Set `TEST_DATABASE_URL` to a dedicated `*_test` database and `TEST_DATABASE_RESET=1`; execute all **9 real PostgreSQL API tests**. These include actual login/logout/expiry/reset, financial transactions/idempotency/concurrency/refunds, lead conversion/outbox, membership/generation/attendance, submission/feedback, private media and publication consent. Fix any observed integration failures before treating the workflows as accepted.
3. Run frontend/backend/worker with README commands and explicit dev seed credentials. Run all **8 Playwright journeys** against that real API. They include lead persistence, teaching/attendance, partial payment, submission/feedback, publication/unpublication and failed-network behavior; setup mutations use authenticated real APIs rather than mocked business success.
4. Capture 375×812, 768×1024, 1440×900 and 1920×1080 views; compare hero/nav/circle, bento, results, courses, FAQ, modal and light palette against the supplied references. Test 320px overflow, focus traps/restoration, keyboard/swipe, private-data logout behavior and PWA install/offline/update. Visual fidelity is not yet browser-verified.
5. Run the supplied Compose stack and rehearse DB+media restore in disposable storage. Verify the production host/origin/proxy IP configuration and a real Telegram test delivery without printing tokens.
6. Complete and approve [content-checklist](content-checklist.md). Optional content remains hidden until publication. Actual production data and provider secrets must be supplied by the owner.

## Useful commands

Commands already executed successfully are the backend tests, frontend typecheck/unit/build and static checks listed above. Startup/deployment commands are supplied and reviewed, **not claimed to have run successfully** in this executor:

```bash
scripts/backend -m alembic upgrade head
scripts/backend -m app.cli create-teacher --username sherzod
scripts/backend -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log --no-proxy-headers
scripts/frontend run dev
scripts/backend -m app.workers.telegram
docker compose up --build
```

[README](../README.md) contains env setup, explicit demo password handling, Telegram/storage wiring and all test commands. [Architecture decisions](architecture.md) document date intervals, billing, refund/void behavior, publication snapshots, saved-lesson edit semantics and security boundaries. There is no default production teacher password.
