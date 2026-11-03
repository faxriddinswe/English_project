# Kurs tafsilotlari, kabinet navigatsiyasi va yozuvlar dizayni

2026-11-03, 12:43 (Asia/Tashkent). Lokal implementatsiya yakunlandi.

Talab: Grammatika/IELTS/SEFR batafsil sahifalarini mazmun va 2–3 tegishli browserdan olingan rasm bilan boyitish; kabinet logosini shu rolning boshqaruviga qaytarish; yozuv tafsiloti va amallarni telefon/planshet/laptop uchun tartiblash; ustozning vaqtinchalik parol berish imkoniyatini olib tashlash.

Reja: mavjud route/model/approval/authni saqlab kengaytirish. Kurslar uchun mazmun, qo‘llash mavzulari, mustaqil mashq, litsenziyalangan 2 foto/kurs, kursi tanlangan ariza va real CMS narx/jadvali. Kabinetda aniq identifikatsiya/header, ma’lumot/tarix/boshqaruv tablari, xavfli amal alohida disclosure, responsive modal. Logo teacher/student rootga. Account-reset endpoint/DTO/UI chiqariladi; o‘quvchi o‘z register paroli bilan tasdiqlangach kiradi, eski parollar/akkauntlar reset qilinmaydi.

Manbalar: British Council grammar, IELTS official format va Council of Europe CEFR; Pexels original foto sahifalari/licenziyasi. Kurs fotosi illyustratsiya, Sherzodning o‘z darsi yoki o‘quvchisi sifatida taqdim etilmaydi. Narx, kurs davomiyligi, natija/ball kafolati uydirilmaydi. Asosiy DBga seed/reset rejalashtirilmagan.


## Implementatsiya

- CourseDetails/CSS va course-guides mavjud /courses/[slug]ni kengaytiradi: Grammatika, IELTS, SEFR uchun yo‘nalish haqida matn, mavzu/practice kartalari, rasmiy ma’lumot havolasi, ikkitadan lokal WebP, CMSdagi real description/features/daraja/format/narx/jadval, tegishli kursi tanlangan ariza. DB kurslari qayta yaratilmagan. [Rasm manbalari va litsenziya](course-image-sources.md).
- BrandLogo href/label oladi. Workspace teacher/student rootga yo‘naltiradi, logout yubormaydi; public logo homepagega qoladi.
- RecordDetails/RecordSummary: identifikatsiya/avatar/telefon, aniq yuqoridagi Tahrirlash, student balansi, field label kartalari, Ma’lumotlar / O‘quv tarixi yoki A’zolar / Boshqaruv. Klaviatura Arrow/Home/End, tel links, boshqaruvning oxirida disclosurega ajratilgan xavfli amallar. Mavjud ResourceActions/EntityForm/Dialog qayta ishlatilgan. Membership DTOda guruh/kurs nomi va is_current beriladi. Mobile fullscreen, desktop/planshetda 980pxgacha modal. Excel va nested edit/focus flow saqlangan.
- AccountIn, teacher POST /students/{id}/account va login/vaqtinchalik parol assignment/reset UI olib tashlandi; endpoint404. Student registerda o‘zi parol tanlaydi, ustoz kirishni tasdiqlaydi. Yangi signup forced password-change emas. Mavjud password hashlar, shaxsiy parol almashtirish va eski must_change_password xavfsizlik flagi saqlangan.

## Oldindan mavjud login akkauntisiz profil

Asosiy bazada bunday profil borligi read-only aniqlandi. Yagona, approved va o‘chirilmagan profilga mos telefon bilan signup shu IDni saqlaydi, yangi inactive User student tanlagan hash bilan ulanadi. User.registration_pending (0004_self_registration) kirish arizasini Studentning ta’lim/billing admission holatidan ajratadi. Guruhlar/qarz/student count signup vaqtida yo‘qolmaydi. Pending UI mavjud profil va so‘rovdagi ismni ko‘rsatadi, bulk approval shaxsni tekshirish eslatmasini beradi.

Approve kirishni ochadi. Existing-profile reject loginni rad etadi, profil/guruh/invoice/historyni o‘chirmaydi. Yangi pending profilga eski reject qoidasi qo‘llanadi. Existing account, ambiguous telefon, deleted/rejected profil avtomatik claim qilinmaydi. Oldin ataylab inactive qilingan account explicit pending flagisiz list/bulk approvega kirmaydi. SMS/OTP xizmati qo‘shilmagan; teacher shaxsni tekshirib tasdiqlaydi.

Private 0600 backup, alohida55433 restore/Alembic rehearsal va maindagi upgrade oldidan/keyin 27 jadval barcha original ustun/ID tengligi tekshirildi. Main head0004_self_registration; original password hashlar saqlandi. [PIIsiz dalil](registration-migration-verification.json).

## Kuzatilgan tekshiruv

- scripts/backend ../.local/run-audit-tests.py -q --tb=short --junitxml=../docs/backend-test-results.xml: **95 passed,74.89s**, failure/skip0. Avval25 focused passed34.70s. Dedicated sherzod_audit_test/55433, Telegram sozlamalari bo‘sh.
- Teacher password endpoint404/hash saqlanishi; signup-approve-login/change bilan qisqa/bo‘shliq/uzun own password; expiry401; existing-profile approve/reject va ID/name/note/group/600000.00 invoice qarzi saqlanishi; tasdiqlanguncha403; inactive account approve qilinmasligi. Oldingi finance/Excel/security regressiyasi ham passed.
- Frontend14 unit passed; TypeScript, final production build, Python F passed. Final lint0 error/11 avvalgi image warning (bitta yangi unused import tozalandi).
- npm run e2e --prefix frontend -- courses-workspace.spec.ts interface-notifications.spec.ts excel-reports.spec.ts: **11 passed/1 intentional credentials skip,44.4s**. 13 teacher resource fixture, nested edit/focus/delete confirmation, bildirishnoma, Excel, role logo/zero logout va actual local course matn/foto/enroll. [Keng JSON](courses-workspace-regression-results.json).
- Screenshot reviewda mobil ism siqilishi va double currency topilib tuzatildi. Final builddan keyingi courses-workspace.spec.ts: **4 passed,21.5s**, 320/375/768/1440px, dark/light, header height va aniq currency. [Final JSON](courses-workspace-final-results.json). Keyin homepage batafsil linki va screenshot capture scroll/focusi ham alohida tekshirildi.
- Dastlabki browser9pass/2 test xatosi/1skip: duplicate ariza tugmasiga locator scope va testning noto‘g‘ri width o‘zgaruvchisi tuzatildi. Lazy rasmlar yuklangach screenshot olindi. [Student375](qa/student-details-375.png), [student1440](qa/student-details-1440.png), [grammar mobile light](qa/course-grammar-375-light.png), [IELTS](qa/course-ielts-1440.png), [SEFR](qa/course-cefr-1440.png) va original6 rasm ochib ko‘rildi.
- Mainda read-only head/registration flag/pending count, actual course GET200 va removed teacher account404 tekshirildi. [Live dalil](courses-workspace-live-verification.json). OpenAPI yangilandi; AccountIn/removed route yo‘q.

## Runtime va chegaralar

Backend/frontend final kod bilan qayta ishga tushdi, worker sog‘lom. Asosiy bazaga seed/reset, sinov arizasi yoki parol o‘zgartirish yo‘q; faqat hujjatlashtirilgan migratsiya qo‘llandi. Telegramga yangi test yuborilmadi. Dedicated test DB olib tashlandi va faqat test klasteri to‘xtatildi; main55432 qoldi.

Public course testi haqiqiy local API’ni o‘qiydi; private role/record UI controlled NAMUNA fixture. Owner actual login/claim/CRUD bajarilmadi; backend approve/reject haqiqiy disposable API orqali sinaldi. Physical-device/Safari, production/load acceptance bajarilmagan. Kurs fotosi original dars/student/hamkorlik yoki endorsement deb ko‘rsatilmaydi. Oldingi teacher password-reset qarori shu self-registration bilan almashtirildi; tarixiy hisobotlar saqlangan.

Ta’sirlangan qismlar: frontend course route/PublicSite/CourseDetails/guides/assets, BrandLogo/Workspace, RecordDetails/RecordSummary/ResourceView/ResourceActions/PendingStudentsView; backend models/auth/students/Excel pending selection/Alembic0004, API/password/frozenSQL/E2E tests; README, OpenAPI, arxitektura/registration/report/index/status/journal.


Yakuniy homepage→Grammatika batafsil linki va neutral scroll/focus screenshot qayta olish: **1 passed,6.9s**, [alohida JSON](course-home-link-e2e-results.json). Dastlab formatter bilan zanjirlangan browser chaqiruvi cheklangan sandboxda Chrome setsockopt EPERM bilan ochilmadi; ruxsatli standalone npm run e2e chaqiruvida test o‘tdi. Bu avvalgi95 backend/final4/keng11 natijasini almashtirmaydi. 8 yangilangan Markdown faylining havola/fence va OpenAPI/evidence mosligi tekshirildi.
