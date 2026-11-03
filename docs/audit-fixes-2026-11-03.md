# Kamchiliklarni aniqlash va tuzatish — 2026-11-03

Vaqt zonasi: Asia/Tashkent. Talab: «nima yo‘qolgan bo‘lsa va nima kamchiliklar xatolari bo‘lsa o‘zing yaratib to‘g‘irla».

## Reja va doira

1. Mavjud kod/hujjatlar, lint va xizmatlar holatini tekshirish.
2. Topilgan ro‘yxatdan o‘tish/tasdiqlash, interfeys va startup xatolarini tuzatish.
3. Asosiy bazadan alohida PostgreSQL klasterida haqiqiy API regressiyasi; brauzerda read-only va aniq fixture tekshiruvlari.
4. Joriy koddan build, xizmatlarni qayta ishga tushirish va yakuniy dalillarni saqlash.

## Amalga oshirilgan tuzatishlar

- `LoginForm.tsx`: avvalgi parol qaroriga zid 4 belgilik minimum olib tashlandi; bo‘sh bo‘lmagan parol aynan saqlanadi. Telefon tekshiruvi raqamlarga asoslandi, ism trim/200 belgi bilan backendga moslashtirildi. API ishlamasa uydirma kurslar chiqarilmaydi; yuklanish, xato va qayta yuklash holatlari bor. Kursni keyin tanlash mumkin.
- `auth/router.py`: mavjud bo‘lmagan, faol bo‘lmagan yoki nashr qilinmagan kursga ro‘yxatdan o‘tish 422 bilan rad etiladi; yangi hisob/profil yaratilmaydi. Oddiy o‘chirilgan/pauzadagi hisobga noto‘g‘ri pending xabari berilmaydi.
- `students/registration.py`, `students/pending.py`, `reports/router.py`: kutilayotgan ariza faqat `cabinet_signup` manbali yangi murojaat bilan aniqlanadi. Oddiy pauzadagi hisoblar tasdiqlashga tushmaydi, boshqa murojaatlar ro‘yxatni ko‘paytirmaydi. Yakka/ommaviy tasdiqlash va rad etish shu shartni saqlaydi, asl signup murojaati/historysi yangilanadi.
- `PendingStudentsView.tsx`: ariza sanasi mavjud Asia/Tashkent formatteri orqali; qarama-qarshi tasdiqlash/rad etish/ommaviy amallar so‘rov tugaguncha bloklanadi. Mavjud `ScrollTable` orqali overflow ko‘rsatmasi va klaviatura regioni qo‘llanadi; telefon raqami bo‘linmaydi, telefon/kurs/rad etish ranglari yorug‘ rejim tokenlariga mos.
- `useTheme.ts`: browser holati tashqi store sifatida o‘qiladi; navigatsiya/reload va boshqa tabdagi o‘zgarishlar bilan mavzu holati sinxronlashadi. React state updater ichidagi DOM/storage yon ta’sirlari olib tashlandi.
- `PWA.tsx`: localhost’da service workerni o‘chirish ortidan qayta ro‘yxatdan o‘tkazish poygasi olib tashlandi, cache/unregister xatolari ushlanadi. Boshlang‘ich display/forma holatlari frame orqali o‘lchanadi. Public SW versiyasi v11.
- `LeadApplicationModal.tsx`: forma lifecycle orqali yangilanadi; yopib qayta ochilganda eski muvaffaqiyat/xato holati va ma’lumotlar yangi arizaga ko‘chmaydi. Xato so‘rovda ochiq forma qiymatlari saqlanadi.
- Logo, error sahifasi va Kabinet havolalari mavjud Next navigatsiyasiga o‘tkazildi, menyu focus cleanup barqarorlashtirildi. `EntityForm`da `useWatch`, ishlatilmagan import/prop tozalandi.
- `telegram.py`: vaqtinchalik SQLAlchemy xatosi worker’ni o‘ldirmaydi; 5 soniyadan keyin qayta urinadi va logda ulanish qiymatlarini chiqarmaydi. Yo‘qolgan outbox yozuvi uchun `None` tekshiruvi bor.
- `scripts/start-local.sh`, `scripts/local_runtime.py`: `.env` yuklash, DB/HTTP/worker tayyorligini tekshirish, mavjud sog‘lom jarayonlarni qayta ishlatish, socket papkasini tiklash, log/PID fayllari va `--status`/`--production` rejimlari. Boshlanish muvaffaqiyatsiz bo‘lsa xato exit kodi qaytadi. Mavjud bo‘lmagan baza yaratilmaydi, seed/reset/migratsiya avtomatik bajarilmaydi.
- `frontend/scripts/start.mjs`, `package.json`: Next standalone server o‘z public/static fayllari bilan ishga tushadi; eski `next start` ogohlantirishiga sabab bo‘lgan usul almashtirildi. Port/hostname va frontend ichidagi `NEXT_DIST_DIR` qo‘llanadi.
- Lokal `.venv/bin/python3` symlinki yo‘q `/snap/...` interpreteridan mavjud `/usr/bin/python3.14`ga tiklandi (3.14.4); paketlar qayta o‘rnatilmadi.
- `playwright.config.ts`: mavjud tizim Chrome’i avtomatik tanlanadi, explicit `PLAYWRIGHT_CHANNEL` ustuvor qoladi. Bundled Chromium talab qilinib, mavjud Chrome e’tiborsiz qolishi bartaraf etildi. Eski manual student yaratish va localhost’da service worker kutgan fixturelar joriy oqimga moslandi; PWA update fixture’i barcha so‘rovlari lokal serverdan olinadigan intercepted HTTPS test originda bajariladi.
- Hujjatlarda sertifikat hisobotidagi 3 ta absolyut `file:///` havola relative yo‘lga almashtirildi; tarixiy yetishmagan screenshot o‘rniga dalilsiz fayl yaratilgani da’vo qilinmadi. Yangi mobil ariza screenshotlari aniq fixture sifatida olindi.

## Tekshiruvlar va uchragan xatolar

- Dastlab frontend lint: 5 error, 16 warning. Tuzatishlardan so‘ng: 0 error, 11 warning (native image tavsiyalari).
- Python `ruff --select F` o‘tdi. Frontend 11 unit testi va typecheck o‘tdi; worker recovery testi bilan backend non-postgres suite: 55 passed.
- Alohida PostgreSQL 15 klasteri `.local/audit-postgres`da, loopback 55433 da yaratildi; faqat `sherzod_audit_test` ishlatildi. Asosiy klaster porti 55432.
- Cheklangan test chaqiruvida socket ruxsati tufayli Alembic setup bajarilmadi; ruxsatli `scripts/backend` orqali test runner ishlatilgach mavjud 24 PostgreSQL testi o‘tdi. Birinchi kengaytirilgan tekshiruvda yangi test importi yetishmagani topilib tuzatildi; yakuniy butun suite **87 passed (49.89s)**. Bu 55 non-postgres va 32 PostgreSQL test ssenariyini qamraydi. Yangi holatlar: yaroqsiz/inaktiv/draft kurs uchun 422 va hisob yaratilmasligi; bir belgi/bo‘shliqni saqlovchi parollar; oddiy pauzadagi hisobni tasdiqlamaslik; begona lead bilan ariza ko‘paymasligi; reject va rol himoyasi; worker recovery va safe log.
- Ro‘yxatdan o‘tishning avval asosiy bazaga yozadigan E2E sinovi aniq UI fixturega o‘tkazildi. Haqiqiy ro‘yxatdan o‘tish, rad etish/tasdiqlash, kurs va parol regressiyalari alohida test bazasida bajariladi. Bu brauzer fixturelarini real provider tekshiruvi deb talqin qilmaydi.

## Yakuniy natijalar

| Tekshiruv | Kuzatilgan natija |
| --- | --- |
| Backend, alohida PostgreSQL bilan | 87 passed; asosiy bazaga test reset qo‘llanmagan |
| Frontend unit | 11 passed, 3 fayl |
| TypeScript va production build | O‘tdi; oxirgi mobil jadval o‘zgarishidan keyin build qayta o‘tdi |
| Python `ruff --select F`, shell/Node syntax | O‘tdi |
| Frontend ESLint | 0 error, 11 `no-img-element` warning |
| Keng Chrome regressiya | 25 passed; 3 eskirgan/aniq bo‘lmagan fixture testi tuzatishga yuborildi, 3 test o‘sha run’da bajarilmadi |
| Keyingi maqsadli Chrome regressiya | 10 passed (25.1s); yuqoridagi 3 xato, bajarilmagan 3 test, 3 avval o‘tgan audit testi va 1 yangi pending testi |
| Oxirgi mobil jadval/style buildidan keyin | 6 passed (12.5s): audit va signup/pending fixturelari; [yakuniy JSON](e2e-results.json) shu 6 testni aks ettiradi |
| Xilma-xil brauzer ssenariylari | Yuqoridagi run’lar bo‘yicha jami 32 xil ssenariy muvaffaqiyatli tekshirildi; bu bitta 32-testli run degani emas |
| Runtime | `postgres`, `backend`, `frontend`, `worker` — barchasi true; takroriy startupda worker soni 1 |
| HTTP | 8 public/login sahifa, public API proxy, teacher/student shell 200; build/public 21 asset 200 |

Brauzerning birinchi urinishida bundled headless Chromium yo‘q edi. Chrome tanlangach real testlar bajarildi. Bir maqsadli run cheklangan shell orqali boshlangani uchun Chrome socket ruxsati bilan to‘xtadi; ayni testlar ruxsatli mustaqil `npm run e2e` chaqiruvida 10/10 o‘tdi. Bular ilova testi muvaffaqiyati sifatida hisoblanmadi. Muvaffaqiyatli run’lar local buildga qarshi haqiqiy Chrome’da bajarildi; mutationlar aniq fixture/abort, public o‘qishlar esa real API orqali.

Yangi vizual dalillar: [mobil pending jadvali, dark fixture](qa/audit-pending-students-375.png), [yorug‘ rejim fixture](qa/audit-pending-students-light-375.png). Dark screenshot vizual tekshirildi; 375px da sahifa sig‘ishi, scroll hint va light telefon rangi brauzer assertionlari bilan tekshirildi.

Asosiy xizmatlar yakuniy kod bilan ishga tushgan. Alohida `sherzod_audit_test` bazasi o‘chirildi, faqat unga tegishli `.local/audit-postgres` klasteri to‘xtatildi; auditning ignored log/helper fayllari qoldirildi. Asosiy klaster va biznes yozuvlari reset/reseed qilinmadi. Startup helperidagi PostgreSQL yo‘li mavjud lokal Linux klasteriga mos; boshqa host uchun README’dagi dastlabki sozlash talab etiladi.

## Bajarilgan asosiy buyruqlar

```bash
scripts/backend ../.local/run-audit-tests.py -q --tb=short
scripts/test-backend -q -m 'not postgres'
npm run test --prefix frontend
npm run typecheck --prefix frontend
npm run lint --prefix frontend
.venv/bin/ruff check backend scripts/local_runtime.py --select F
bash -n scripts/start-local.sh
node --check frontend/scripts/start.mjs
npm run build --prefix frontend
scripts/backend ../scripts/local_runtime.py --production
scripts/backend ../scripts/local_runtime.py --status
npm run e2e --prefix frontend -- audit-regressions.spec.ts student-registration.spec.ts --max-failures=2
```

`.local/run-audit-tests.py` audit uchun ajratilgan vaqtinchalik baza URL’ini faqat child process env’iga bergan va Telegram konfiguratsiyasini testda bo‘sh qilgan. U boshlanishda asosiy `.env`dagi DBni ishlatishdan saqlagan; disposable baza endi olib tashlangani uchun bu helperni tayyorgarliksiz qayta bajarish kerak emas. Yangi hostdagi integratsiya testlari uchun README’dagi `TEST_DATABASE_URL` va `TEST_DATABASE_RESET` tartibini qo‘llang. Oddiy lokal ishga tushirish: `scripts/start-local.sh --production`; holat: `scripts/start-local.sh --status`.

## Qolgan chegaralar

- 11 image lint tavsiyasi qolgan; private media URL’larini optimizator/cache orqali oshkor qilmaslik va mavjud image pipeline’ni saqlash hisobga olinmasdan blanket almashtirish qilinmadi. Bu ESLint error emas.
- Backend F tekshiruvi syntax/undefined/unused sinfini qamraydi; butun loyiha uchun barcha stil qoidalari yoki dependency security auditi bajarildi degan da’vo yo‘q.
- Haqiqiy kontakt/narx/marketing ma’lumotlari va publication roziligi [kontent checklist](content-checklist.md) bo‘yicha egasi bergan ma’lumot bilan to‘ldiriladi; uydirma business kontenti yaratilmagan.
- Egasi akkauntlari bilan yangi login/CRUD, haqiqiy Telegram yetkazilishi, Docker/production deploy, tashqi S3, physical-device yoki native PWA install bajarilmadi. Autentifikatsiyalangan API oqimlari haqiqiy disposable PostgreSQLda, private brauzer ekranlari esa fixturelarda tekshirildi.
- OS autostart/service o‘rnatilmadi; skript xizmatlarni shu lokal muhitda ishga tushiradi. Eski tarixiy screenshot avtomatik «tiklangani» da’vo qilinmaydi.
