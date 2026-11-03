# O‘quvchi/guruh qoidalari va ixcham mavzu ikonkalari

2026-11-03, Asia/Tashkent. Lokal implementatsiya, migratsiya, build va brauzer tekshiruvlari bajarildi.

Foydalanuvchi faol/nofaol o‘quvchi, guruh va kurs holatlarini backenddan olib tashlash, oddiy sonlar ko‘rsatish, keraksiz yozuvni o‘chirishni so‘radi. Keyingi qo‘shimcha: tepadagi light/dark ikonkasini almashtirish va kichraytirish.

## Reja va implementatsiya

- Mavjud Next.js, FastAPI va PostgreSQL rivojlantirildi. Eski yozuv va parollar saqlanadi.
- `0003_entity_deletion`: o‘chirish va ro‘yxatdan o‘tish qarori ajratiladi (`deleted_at`, `admission_status`). Eski status/active ustunlari tarix sifatida saqlanadi; amaldagi entity qoidalari ularni ishlatmaydi. Oldingi archived yozuvlar o‘chirilgan sifatida ko‘chadi. Pending arizalar tasdiqlashni talab qiladi, login xavfsizligi saqlanadi.
- O‘chirish ro‘yxat/statistika/yangi a’zolik/yangi hisobdan chiqaradi; oldingi davomat, a’zolik, invoice, to‘lov saqlanadi. Guruh o‘chirilsa kelgusi rejalangan darslar bekor qilinadi. Kurs guruhlari qolgan bo‘lsa o‘chirish bloklanadi.
- Dashboard oddiy o‘quvchi/guruh sonlarini beradi. Oldingi qo‘lda status donutini guruhga biriktirilgan/biriktirilmagan haqiqiy a’zolik agregati almashtiradi. Boshqa moliya/davomat grafiklari va polling saqlanadi.
- `ThemeToggle` umumiy komponent: lucide Sun/Moon, 16px ikonka, 36px tugma (touch 40px), tooltip, klaviatura fokusi; sayt va kabinet bir xil komponentni ishlatadi.
- Invoice, davomat, murojaat jarayoni va nashr ruxsati kabi ma’noli holatlar saqlanadi; ular qo‘lda faol/nofaol entity belgisi emas.

## Dastlabki urinishlar

Dastlabki typecheck o‘tdi. Disposable PostgreSQL run 33 passed/1 failed: eski CSV testi hali «Faol» ustunini talab qilgan; yangi CSV shartiga moslashtirildi. Keyin private backup va alohida restore/migratsiya tekshiruvi muvaffaqiyatli bajarildi. Yangi Telegram xabari yuborilmadi.


## Bazani saqlash va runtime

`0003_entity_deletion` asosiy lokal bazaga qo‘llandi. Oldin `.local/backups/`da 0600 private pg_dump yaratildi, alohida 55433 klasterdagi tasodifiy `*_test` bazaga pg_restore bilan tiklandi va Alembic head tekshirildi. Klonning ham, asosiy bazaning ham 27 jadvalidagi barcha avvalgi ustunlar/IDlar xotirada taqqoslandi — teng. Hisobotda hash/parol/telefon/dump saqlanmaydi. [Agregat dalil](entity-migration-verification.json).

Migratsiya paytida faqat shu loyihaga tegishli backend/frontend/worker to‘xtatildi. `scripts/backend ../scripts/local_runtime.py --production` mavjud bazani reset/reseedsiz qayta ishlatdi va to‘rt xizmatni tayyor deb qaytardi. Worker yoqildi, yangi Telegram sinovi yuborilmadi.

## Kuzatilgan tekshiruvlar

- `scripts/backend ../.local/run-audit-tests.py -q --tb=short --junitxml=../docs/backend-test-results.xml`: **94 passed, 63.60s**. Asosiy bazadan ajratilgan 55433 / `sherzod_audit_test`, Telegram sozlamalari bo‘sh. Dastlabki 33/1 CSV run, keyin 92 passed; yangi ikki testning birinchi runida public kurs DTOsi `total` emas `items` qaytarishi testda tuzatildi. Keyingi 2 focused passed va dastlabki to‘liq 94 passed (53.82s); learning gate qo‘shimchasidan keyingi yakuniy natija 94 passed (63.60s).
- Yangi haqiqiy API testlari: legacy paused/left/ended belgilarining ta’limni bloklamasligi, olib tashlangan status/active payloadlariga 422, plain counts; o‘chirishdan keyin login/account/enroll/invoice va yangi assignment/material/assessment bloklanishi, guruh joyi bo‘shashi, oldingi invoice/to‘lov/a’zolik saqlanishi, eski qarz to‘lanishi, kelgusi dars bekor qilinishi, kurs-guruh cheklovi.
- Frontend: **14 unit passed**, typecheck/build o‘tdi. Python F check o‘tdi; frontend lint **0 error / 11 avvalgi native image warning**.
- Yakuniy browser run: **11 passed, 29.9s** (`npm run e2e --prefix frontend -- teacher-dashboard.spec.ts audit-regressions.spec.ts`), [JSON dalil](entity-theme-e2e-results.json). Dastlabki run 10 passed / 27.2s. Public theme/reload/tab sinxronligi; private dashboard fixtures: grafiklar, 5s/tab refresh, xato/empty-state, 320–1440px, ikkala rejim; yangi Sun/Moon ikonka 16px va desktop 36px haqiqiy DOM o‘lchamlari, student/group listida va group/course formalarida activity controls yo‘qligi. [Public header](qa/theme-public-light-1280.png) va [kabinet header](qa/theme-workspace-1440.png) screenshotlari ochilib vizual ko‘rib chiqildi.

Browserdagi private ma’lumotlar boshqariladigan fixture: bu owner akkauntiga haqiqiy kirish yoki asosiy DBga CRUD sinovi sifatida taqdim etilmaydi. Real API biznes oqimlari disposable PostgreSQLda tekshirildi. Production deploy va haqiqiy telefon/Safari tekshiruvi qilinmadi. Eski SQL status/active ustunlari metadata sifatida qolgan, yangi API va entity qoidalarida ishlatilmaydi; foydalanuvchi loginiga oid `User.active` ichki xavfsizlik darvozasi saqlanadi.


## Yakuniy qo‘shimcha nazorat

Hisobot/umumiy label lug‘atidagi eski «Faol o‘quvchilar/Faol guruhlar» ham oddiy son labeliga almashtirildi. Group/course o‘chirishda teacher lock boshqa o‘quv amallari bilan ham bir xil tartibda olinadi. O‘chirilgan guruhga API orqali yangi vazifa/material/baho qo‘shish va a’zolik tarixini o‘zgartirish bloklanadi. Pending approval leadning oldingi yopish izohini tozalaydi; tasdiqlash lead statusiga tayanmaydi.

So‘nggi learning gate tekshiruvida 93 passed/1 failed kuzatildi: yangi test vazifa DTOsi talab qiladigan `description`ni bermagan. Test ma’lumoti to‘ldirildi va tegishli test 1 passed / 93 deselected bilan qayta o‘tdi. Bu ishlab chiqarish DTO validatsiyasini zaiflashtirish bilan tuzatilmadi. So‘nggi umumiy run **94 passed, 63.60s**, 0 failure/skip; XML shu run bilan yangilandi.

Asosiy bazadagi hisoblar va donut bo‘laklari faqat o‘qish orqali tengligi tekshirildi. Home/login/public courses HTTP 200, autentifikatsiyasiz teacher API 401, backend `/health/ready` 200. [Read-only dalil](entity-live-verification.json). Birinchi tekshiruv frontend rebuild paytidagi ulanishda connection refused berdi; keyingi urinishda API-prefiksdagi mavjud bo‘lmagan health manzili o‘rniga haqiqiy backend health manzili ishlatildi. Yakuniy tekshiruv to‘g‘ri manzillarda bajarildi; owner sessiyasi yaratilmagan/reset qilinmagan.

Asosiy o‘zgargan qismlar: `backend/app/db/models.py`, `core/schemas.py`, Alembic 0003, students policy/registration/pending/router, auth, groups, billing, learning/lessons/media, content/leads va reports; frontend `ThemeToggle`, `SiteHeader`, `Workspace`, resource konfiguratsiya/form/actions/listlari, dashboard/types va `lib/uz.ts`. API/PostgreSQL, dashboard/theme/form fixture testlari va OpenAPI snapshot yangilandi. Ish rejasidagi faol/nofaol qarori oldingi [dashboard](teacher-dashboard-charts.md), [arxitektura](architecture.md) va [ro‘yxatdan o‘tish](student-registration-and-approval-workflow.md) hisobotlaridagi legacy status implementatsiyasini almashtiradi; avvalgi test natijalari o‘z sanasidagi tarix sifatida saqlangan.

Yakunlangan vaqt: 2026-11-03, 11:20 (Asia/Tashkent). Final frontend build va backend ishga tushirilgan. Test bazasi olib tashlandi, faqat alohida test klasteri to‘xtatildi; asosiy 55432 klaster saqlandi.
