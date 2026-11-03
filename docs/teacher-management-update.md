# Ustoz boshqaruvi: to‘lov, guruh va sertifikat — 2026-11-02

## Bajarilgan ish

Mavjud FastAPI/PostgreSQL va kabinet komponentlari rivojlantirildi. Takroriy backend yoki browser ma’lumotlar bazasi yaratilmagan.

### Moliya → To‘lovlar

- Yangi to‘lov yaratish va chiqarilgan hisobga mablag‘ taqsimlash saqlandi.
- To‘lovni ochganda **To‘lovni tahrirlash**: summa, qabul qilingan vaqt, usul va izohni sabab bilan tuzatish mumkin. Student/receipt ID va tarix o‘zgarmaydi.
- Summa kamayib, avvalgi allocationlar undan oshsa, ortiqcha qismi eng yangi allocationlardan boshlab tranzaksiyada bo‘shatiladi; hisob qarzi va student balansi qayta ochiladi. Summa oshganda qo‘shimcha pul erkin mablag‘ bo‘lib qoladi, boshqa hisobga jim taqsimlanmaydi.
- **To‘lovni o‘chirish** — sababli void. Yozuv va audit saqlanadi, allocation bo‘shatiladi, hisob qarzi tegishlicha qaytadi. Student payment tarixida bekor qilish sababi ko‘rinadi.
- Pul qaytarilgan receipt joyida tahrirlanmaydi/o‘chirilmaydi; mavjud refund oqimi ishlatiladi. O‘chirilgan receipt tahrirlanmaydi, takroriy delete bir xil natijani saqlaydi.
- Teacher/student/payment/invoice locklari concurrency’da over-allocationni bloklaydi. Eski POST idempotency javobi saqlanadi; joriy tahrirlangan receipt GET orqali olinadi.

### Dashboard va Guruhlar

- Dashboardda **Guruhlar va dars vaqtlari**: kurs, nom, amaldagi a’zolar soni/sig‘im, hafta kuni va boshlanish–tugash vaqti.
- Guruh ro‘yxati/detail ham shu ma’lumotlarni ko‘rsatadi. Hisob joriy Asia/Tashkent sanasidagi membership intervaliga asoslanadi, kelajak a’zolik hozirgi songa kirmaydi; arxiv guruh amaldagi soni nol.
- Kurs nomi, count va jadval list uchun bulk querylar orqali olinadi; har bir guruh uchun alohida SQL so‘rovlari ko‘paytirilmaydi.
- Mavjud yaratish, tahrirlash, sig‘im/interval nazorati, a’zo qo‘shish va dars yaratish ishlatiladi. Roster tarixida endi student ismi va amaldagi/tarix holati bor.
- **Guruhni o‘chirish** — archive. Kelgusi rejalangan darslar sabab bilan cancelled qilinadi. O‘tgan dars, a’zolik, davomat, student va moliya yozuvlari saqlanadi. Archive default ro‘yxatdan yo‘qoladi; Holat → Arxiv orqali ko‘rinadi.
- Jadval qoidasi tahriri avval yaratilgan dars vaqtlarini jim ko‘chirmaydi; aniq darsni ko‘chirish mavjud amali saqlangan.
- Mobil jadval alohida yon tomonga suriladi. Nom/kurslar so‘zma-so‘z o‘qiladi, pul va actionlar vertikal harflarga bo‘linmaydi.

### Natijalar → Ommaviy sertifikatlar

- Alohida sertifikat CRUD mavjud CMS Content/ResultData/media/publish qoidalaridan foydalanadi.
- **Yangi qo‘shish**: student tanlash, sarlavha, IELTS yoki SEFR, ko‘rinadigan ism, sana, ball/daraja, tayyorlangan rasm, rozilik va ustoz tasdig‘i.
- **Saqlaganda saytda va o‘quvchiga ko‘rsatish** default belgilangan. Validatsiya va nashr bitta DB tranzaksiyasida; consent/tasdiq/rasm xato bo‘lsa soxta success yoki yarim nashr yo‘q.
- IELTS 0–9 / 0.5 qadami va CEFR darajalari avvalgi qoidalar bilan tekshiriladi. Internal assessmentlar sertifikatga aylantirilmaydi.
- Student bilan bog‘lanish Content.student_id private FK orqali. Bu maydon public response’da chiqarilmaydi; boshqa student sertifikat IDsi bilan kirsa 404.
- **Tahrirlash** saqlangach published snapshotni yangilaydi; **Sertifikatni o‘chirish** karta va nashrni public/own student ro‘yxatidan olib, audit/arxivni saqlaydi.
- Qidiruv sarlavha yoki ruxsat etilgan ko‘rinadigan ism bo‘yicha ishlaydi. Legacy NAMUNA kartalar avtomatik haqiqiy studentga bog‘lanmaydi.
- Student menyusida **Sertifikatlar**: faqat o‘ziga bog‘langan published natijalar, rasm/lightbox va pagination. Ichki baholar alohida qolgan.

## Sayt yangilanishi

Public CMS sahifalari avvalgidek no-store. Yangi ochilishda saqlangan nashr darhol olinadi. Bir brauzerdagi tablar BroadcastChannel orqali xabardor qilinadi; boshqa ochiq public tablar kichik `/public/revision` so‘rovi bilan ko‘rinadigan paytda 5 soniyagacha oraliqda yangilanadi. Student sertifikat query’si ham 5 soniyada/fokus qaytganda yangilanadi. Qo‘lda reload shart emas; bu nol kechikishli server push deb ta’riflanmaydi. Private API/PWA cache qoidalari saqlangan; public SW v8.

## Schema, API va kod

Migration: [0002_certificate_student.py](../backend/alembic/versions/0002_certificate_student.py) — nullable student FK/index va archived=false qo‘shadi; mavjud content yozuvlari saqlanadi.

- PUT /api/v1/teacher/payments/{id}, DELETE /api/v1/teacher/payments/{id}; old /void mosligi saqlangan.
- GET /api/v1/teacher/groups boyitilgan; DELETE /api/v1/teacher/groups/{id} archive qiladi.
- GET/POST /api/v1/teacher/certificates; GET/PUT/DELETE /api/v1/teacher/certificates/{id}.
- GET /api/v1/student/certificates va /{id}; GET /api/v1/public/revision.
- [Moliya service](../backend/app/modules/billing/service.py), [guruh router](../backend/app/modules/groups/router.py), [sertifikat API](../backend/app/modules/content/certificates_api.py).
- [Kabinet UI](../frontend/src/features/workspace/Workspace.tsx), [formalar](../frontend/src/features/workspace/EntityForm.tsx), [amallar](../frontend/src/features/workspace/ResourceActions.tsx), [student sertifikatlari](../frontend/src/features/workspace/StudentCertificates.tsx), [yangilanish hooki](../frontend/src/hooks/useSiteUpdates.ts).
- [OpenAPI snapshot](openapi.json) yangilandi. E2E alohida build uchun NEXT_DIST_DIR qo‘llab-quvvatlanadi; default .next o‘zgarmagan.

## Tekshiruv

- Disposable bo‘sh PostgreSQLda 0001 → 0002 migration va backend to‘plami: **68 passed**. Yangi testlar receipt correction/void/debt, refunded receipt, parallel correction+allocation, group count/clock/archive/history va certificate atomic publish/consent/IDOR/delete/revisionni qamraydi. Qidiruv refinementidan keyin certificate testi qayta **1 passed, 67 deselected**.
- Production build va strict typecheck o‘tdi; frontend unit suite **5 passed**. Ruff F401/F821 o‘tdi.
- Mutatsiyalar uchun alohida disposable PostgreSQL, backend 8101, frontend 3101 va random ephemeral credentials ishlatildi. Uch real Chrome UI journey **3 passed**: group CRUD/enrollment, receipt create/allocate/edit/delete/student debt, certificate create/edit/delete/open public+student update. [Natija](teacher-management-e2e-results.json).
- Asosiy builddagi public/mobile/navigation/PWA regressiyalari **18 passed**. [Natija](teacher-management-regression-results.json).
- Asosiy lokal muhitda mavjud ikkala rol bilan login, enriched group/receipt/certificate API va yangi student sahifasi o‘qish rejimida tekshirildi. [Dalil](teacher-management-live-verification.json).
- Mavjud bazaga migration qo‘llandi, frontend/backend qayta ishga tushirildi. Avvalgi private DB backup disposable DBga restore qilinib, 7 biznes jadvalning ID va avvalgi ustunlari solishtirildi — aynan saqlangan. Snapshotdagi 2 user, 1 student, 2 group, 2 membership, 2 invoice, 4 payment va 78 content saqlandi; asosiy bazada QA-prefiksli test yozuvi yo‘q. [Dalil](teacher-management-migration.json).
- Dastlabki brauzer urinishidagi label selektorlari tuzatildi; screenshotda topilgan tor nom/kurs ustunlari kengaytirilib, yakuniy uch journey qayta o‘tkazildi.

```bash
scripts/backend -m alembic upgrade head
scripts/frontend run build
scripts/frontend run typecheck
scripts/frontend run test
# Alohida disposable *_test bazasi bilan backend qabul testlari:
TEST_DATABASE_URL='postgresql+psycopg://…/sherzod_test' TEST_DATABASE_RESET=1 scripts/test-backend -m postgres -q
```

Yozuvchi `teacher-management.spec.ts` asosiy lokal bazada tasodifan ishlamasligi uchun alohida QA origin va explicit test credentials talab qiladi. Normal `npm run e2e` bu shartlar bo‘lmasa ushbu uch testni skip qiladi. Test muhitlari, test DB va vaqtinchalik media tekshiruv tugagach olib tashlandi; Next TypeScript konfiguratsiyasidagi vaqtinchalik build yo‘llari qaytarildi.

## Screenshotlar va chegaralar

- [Mobil guruh boshqaruvi](qa/teacher-groups-management-375.png)
- [Mobil receipt](qa/teacher-payment-management-375.png)
- [Studentning sertifikati — faqat synthetic QA rasm](qa/student-certificate-management-375.png)
- [Haqiqiy lokal dashboard group overview](qa/live-teacher-group-overview-375.png)

Haqiqiy iOS/Android, native PWA install, S3 va production deployment tekshirilmadi. Restore tekshiruvi lokal DB backupiga tegishli; media backup/restore to‘liq mashqi deb hisoblanmaydi. Parollar, session yoki Telegram secretlari docs/source’ga yozilmadi. Mavjud kontent/student/to‘lovlar sinov uchun qayta seed yoki reset qilinmadi.
