# Sherzod English

Bitta ustoz uchun ochiq sayt, ustoz kabineti va o‘quvchi kabineti. Frontend — Next.js/TypeScript; barcha biznes amallari — Python FastAPI; ma’lumotlar — PostgreSQL. Telegram uchun alohida PostgreSQL outbox worker mavjud.

Barcha ishlarning jamlangan tarixi: [loyiha ish jurnali](docs/project-journal.md). [Hujjatlar xaritasi](docs/README.md). Har bir vazifa eslatmasiz hujjatlashtiriladi; doimiy qoida [AGENTS.md](AGENTS.md)da.

**Joriy lokal ishga tushirish:** `http://localhost:3000/login`. Mavjud PostgreSQL/FastAPI/worker va joriy frontend build ishga tushirilgan. [2026-11-03 runtime hisoboti](docs/local-startup-2026-11-03.md), [keyingi audit va tuzatishlar](docs/audit-fixes-2026-11-03.md). [Avvalgi ikki rol tekshiruvi](docs/local-runtime.json) tarixiy dalildir; parollar source fayllarda saqlanmaydi.

**Holat:** loyiha lokal ishlamoqda; productionga tayyorligi hali to‘liq tasdiqlanmagan. Dastlabki sessiyadagi socket va Python paket cheklovlari lokal startup vaqtida bartaraf etildi. To‘liq integratsiya va brauzer qabul tekshiruvlari [implementation-status](docs/implementation-status.md)da ajratilgan. Ommaga deploy qilinmagan.

## GitHub va private fayllar

Repozitoriy: [faxriddinswe/Sherzod-English](https://github.com/faxriddinswe/Sherzod-English). Kod, migratsiyalar, dependency locklar, `.env.example`, hujjatlar va saytning public rasmlari versiyalanadi. `.env`, `.local`, biznes bazasi, backup/media, xom `Screenshots`, test screenshot/trace/JSON/XML dalillari va credential fayllari GitHubga kiritilmaydi. Hujjatlardagi shunday dalil havolalari egasining lokal ish nusxasiga tegishli; ularning yo‘qligi test o‘tganini yangidan tasdiqlamaydi. [Nashr auditi va tekshiruvlar](docs/github-publication.md).

Commitdan oldin saralangan indeksni tekshiring: `git add .`, keyin `python3 scripts/audit-git.py`. Skript private yo‘llar, mahalliy secretlar va ayrim token formatlarini tekshiradi; topilsa qiymatni emas, fayl/qator/qoidani ko‘rsatib xato qaytaradi. Bu kod ko‘rigiga qo‘shimcha tekshiruvdir.

Sertifikat importidagi asl shaxsiy metadata `.local/certificate-import.json`da saqlanadi va avtomatik versiyalanmaydi. Boshqa kompyuterda importer uchun ushbu private manifest hamda asl rasmlarni xavfsiz kanaldan alohida olish kerak. `backend/app/modules/content/certificate-import.example.json` faqat anonim NAMUNA formatidir; haqiqiy natija sifatida ishlatmang. Development import: `scripts/backend -m app.modules.content.certificates --source-dir /private/certificates --manifest /private/certificate-import.json`. Bu buyruqni mavjud biznes bazasida shunchaki tekshirish uchun ishlatmang.

## Kabinetdagi yangi interfeys

**Ustoz → Boshqaruv** sahifasida o‘quvchilar, guruhlar, tushum/qaytarishlar, davomat va murojaatlar grafiklarda ko‘rinadi. Oy tanlang, moliya grafigida «Kunlik»/«6 oylik» rejimni almashtiring; raqamlar sahifa ko‘rinib turganda har 5 soniyada yangilanadi. Bir brauzerning tablari saqlangan o‘zgarish haqida darhol xabardor bo‘ladi. [Grafiklar, hisoblash qoidalari va tekshiruvlar](docs/teacher-dashboard-charts.md).

O‘quvchi, guruh, kurs va hisob maydonida nomni yozing: mos variantlar darhol pastida chiqadi. Variant ustiga bosib yoki Enter bilan tanlab, asosiy saqlash/qo‘shish amalini bajaring. Guruhga qo‘shilish sanasi avtomatik belgilanadi. [Qidiruv va sanasiz a’zolik hisoboti](docs/search-enrollment-update.md).

Amal natijalari ixcham burchak bildirishnomalarida ko‘rinadi; teacher ro‘yxatidagi “Ochish” markaziy tafsilot modalini ochadi. Tahrir/tasdiq oynasi ichkarida ishlaydi; Escape bilan qaytish mumkin. Tizim holatlari va xatolar o‘zbekcha, kirish nomi/parol va fayl tanlash nazoratlari mobilga mos. [Hisobot, testlar va kuzatilgan chegaralar](docs/notifications-dialogs-localization.md).

## Ochiq saytni tekshirish

Telefon/planshet uchun rasmlar, kabinet menyusi, formalar, jadvallar va PWA o‘rnatish xabari moslashtirildi. [Responsive yangilanish va tekshiruv chegaralari](docs/mobile-responsive-update.md).

[Bog‘lanish sahifasida forma bevosita ko‘rinadi](docs/inline-contact-form.md): takroriy banner va ochish tugmasi olib tashlangan; kurslardan ariza modaliga kirish ham saqlangan.

Havolalar sahifani boshidan ochishi, ixcham ustoz banneri va foydalanuvchi tasdiqlagan 18+ yil / 1000+ / 500+ / 200+ raqamlari qo‘llandi. [Navigatsiya, API va responsive tekshiruvlar](docs/navigation-responsive-update.md).

[Ustoz sahifasi yangilanishi](docs/teacher-profile-update.md): referensga mos profil paneli, aniq nomlangan sertifikatlar va CMS’dagi batafsil tavsif.

Bosh sahifada har bo‘limdan ixcham preview va uning to‘liq sahifasiga o‘tish havolasi bor: ustoz, 4 natija, 3 kurs, 3 savol va bog‘lanish. [Preview hisoboti va screenshotlar](docs/home-overview.md).

Navbar bo‘limlari alohida `/about`, `/courses`, `/results`, `/faq`, `/contact` sahifalariga olib boradi. Natijalarga dastlab foydalanuvchi bergan beshta rasm asosida 30 IELTS va 30 SEFR takroriy NAMUNA kartasi kiritilgan; joriy son ustoz nashr/o‘chirish amallariga bog‘liq: desktopda 4 ustun va 3:4 rasm ramkasi, tur bo‘yicha filtr. Takroriy kartalar 60 nafar alohida o‘quvchi sifatida talqin qilinmaydi va productionga avtomatik chiqmaydi. Kurs tugmasi mavjud ariza/API/outbox oqimiga ulangan. Telegram bot va guruh lokal muhitda ulandi, haqiqiy test ariza yetkazildi. [Ulash va tekshiruv hisoboti](docs/telegram-setup.md).

```bash
scripts/backend -m app.modules.content.demo
# Screenshots ichidagi 5 sertifikatdan 60 ta takroriy sample (faqat development):
scripts/backend -m app.modules.content.certificates
# Tizimdagi Chrome bilan kerakli brauzer testlari:
cd frontend
PLAYWRIGHT_CHANNEL=chrome npm run e2e -- tests/e2e/public-grid.spec.ts
```

[Alohida sahifalar, sertifikatlar va QA hisoboti](docs/public-pages-plan.md).

## Mavjud lokal muhitni bitta buyruqda ishga tushirish

`.venv`, frontend paketlari, private `.env` va mavjud `.local/postgres` klasteri sozlangan muhitda:

```bash
scripts/start-local.sh --production
scripts/start-local.sh --status
```

`--production` lokal frontendning eskirgan yoki yo‘q buildini yaratib, standalone serverni public/static fayllari bilan ishga tushiradi. Flagsiz `scripts/start-local.sh` frontendni development rejimida boshlaydi. Skript `.env`ni yuklaydi, mavjud sog‘lom xizmatlarni qayta ishlatadi va PostgreSQL, API, frontend hamda worker tayyor bo‘lmasa xato qaytaradi; log/PID fayllari `.local/`da. Sayt loopback 3000, backend 8000, mavjud lokal PostgreSQL 55432 da ishlaydi. OS restartidan keyingi avtomatik service o‘rnatilmaydi.

Bu skript baza yoki akkaunt yaratmaydi, seed/reset va migratsiya bajarmaydi. Birinchi o‘rnatish uchun quyidagi Docker yoki lokal sozlash yo‘riqnomasidan foydalaning. Frontendni alohida production build bilan ishga tushirish: `scripts/frontend run build`, so‘ng `scripts/frontend run start`.

## Ishga tushirish — Docker

Docker Engine va Compose plugin, Node 22 hamda Python 3.14 lokal variant uchun mos. PostgreSQL uchun `btree_gist` extension zarur.

```bash
cp .env.example .env
# .env ichidagi DB paroli va ikkita mustaqil random secretni almashtiring.
# Secret yaratish: python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
docker compose up --build
```

Sayt: `http://localhost:3000`. DB internetga ochilmaydi; frontend va API portlari faqat loopback’ka bog‘langan. Alohida `migrate` xizmati tugagach backend va worker boshlanadi. Migratsiya har bir API replica startup’ida bajarilmaydi.

Migratsiya va birinchi teacher uchun aniq buyruqlar:

```bash
docker compose run --rm migrate
docker compose exec backend python -m app.cli create-teacher --username sherzod
```

Parol yashirin prompt orqali kiritiladi. Bo‘sh bo‘lmagan parolga uzunlik yoki belgi tarkibi cheklovi qo‘yilmaydi; bo‘shliqlar ham aynan saqlanadi. Production default teacher paroli ham, ochiq signup ham yo‘q. Bir platformada bitta teacher DB indeksi bilan cheklangan.

## Docker bo‘lmagan lokal variant

PostgreSQL 15+ bazasi va uni boshqaradigan rolingiz bo‘lsin. Bazaning URL’ini `.env`ga yozing; asosiy rejim SQLite bilan almashtirilmaydi.

PostgreSQL boshqaruv huquqi bo‘lgan hisobdan yangi lokal rol/baza kerak bo‘lsa `createuser --pwprompt sherzod` va `createdb --owner=sherzod sherzod` buyruqlaridan foydalaning. `btree_gist` uchun PostgreSQL contrib paketi ham o‘rnatilgan bo‘lsin.

```bash
python3.14 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.lock
npm ci --prefix frontend
cp .env.example .env
# DATABASE_URL va boshqa env qiymatlarini mahalliy bazaga moslang.
scripts/backend -m alembic upgrade head
scripts/backend -m app.cli create-teacher --username sherzod
scripts/backend -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log --no-proxy-headers
```

Ikkinchi va uchinchi terminallarda:

```bash
scripts/frontend run dev
scripts/backend -m app.workers.telegram
```

`scripts/backend` va `scripts/frontend` root `.env` faylini yuklaydi. Frontend `/api/` so‘rovlarini `API_INTERNAL_URL`dagi FastAPI’ga uzatadi; backend kodi Next.js’ga ko‘chirilmagan. `API_INTERNAL_URL`da trailing slash ishlatmang. API hujjati: `http://127.0.0.1:8000/docs`; holat: `/health/live`, `/health/ready`.

## Development namunalari

Faqat bo‘sh development bazada va explicit buyruq bilan:

```bash
read -rsp 'Demo teacher paroli: ' DEMO_TEACHER_PASSWORD; export DEMO_TEACHER_PASSWORD
read -rsp 'Demo student paroli: ' DEMO_STUDENT_PASSWORD; export DEMO_STUDENT_PASSWORD
scripts/backend -m app.cli seed-dev
```

Yangi bo‘sh bazadagi seed loginlari `demo-teacher` va `demo-student`; parollar yuqorida o‘zingiz bergan qiymatlar. Mavjud lokal akkauntlar 2026-11-02 kuni egasi talabi bilan `<private-teacher-login>` (case-insensitive) va aynan `<private-student-login>` loginlariga yangilangan. Ularning parollari egasi tanlagan qiymatlar bo‘lib, source/Markdown’da saqlanmaydi. [Joriy demo kirish hisoboti](docs/demo-access-update.md). Production’da seed bloklanadi. NAMUNA guruhlar, dars/davomat, 600000 − 100000 − 300000 = 200000 qarz, alohida erkin credit, vazifa/revision/feedback mavjud. Public kurs va marketing kontenti default draft: tekshirib nashr qilmaguningizcha ochiq saytga chiqmaydi. NAMUNA natijalarga haqiqiy natija sifatida rozilik belgilamang.

O‘quvchi `/login` → Ro‘yxatdan o‘tish’da o‘zi parol tanlaydi. Ustoz arizani tasdiqlaydi; vaqtinchalik parol yaratish/reset endpointi va tugmasi olib tashlangan. Agar telefoniga mos yagona login akkauntisiz mavjud profil bo‘lsa, o‘sha profilga kirish so‘raladi: shaxsini tekshirib tasdiqlash kerak, uning oldingi guruh/moliya yozuvlari saqlanadi. Mavjud akkaunt paroli o‘zgartirilmaydi.

## Kurslar va kabinet navigatsiyasi

Grammatika (`/courses/general-english`), IELTS (`/courses/ielts`) va SEFR (`/courses/cefr`) sahifalari alohida mazmun, mavzu/practice va ikkitadan lokal stock foto bilan boyitilgan. Ariza kursni oldindan tanlaydi. Kabinet logosini bosish joriy rolning `/teacher` yoki `/student` boshqaruviga qaytaradi. Yozuv ochilganda Ma’lumotlar / O‘quv tarixi (yoki A’zolar) / Boshqaruv tablari bor; telefonlarda tafsilot fullscreen, desktop/planshetda modal. [Foydalanish, qarorlar va tekshiruvlar](docs/courses-and-workspace-redesign.md).

## Ustoz kabinetidagi boshqaruv

- **Dashboard / Guruhlar:** kurs, amaldagi a’zolar soni, hafta kunlari va boshlanish–tugash vaqti. Guruh yaratish/tahrirlash, a’zo qo‘shish va sabab bilan o‘chirish.
- **Moliya → To‘lovlar:** receipt qo‘shish, hisobga taqsimlash, sabab bilan tahrirlash yoki o‘chirish (tarixni saqlovchi void). Summa kamayganda ortiqcha allocation va student qarzi tranzaksiyada qayta hisoblanadi.
- **Excel hisobotlari:** Boshqaruv/Hisobotlar → **Barcha hisobotlar (Excel)** — 13 varaq, o‘quvchilar/guruhlar, moliya/qarz/credit, hisob/to‘lov/qaytarish/taqsimot, ariza/murojaat/davomat/baholar. Moliya va ro‘yxatlarda alohida eksport ham bor. Hisobotlar’da tanlangan oy summary/oylik moliyaga qo‘llanadi, detail barcha davrlarni oladi; CSV olib tashlangan. Pagination/10000 satr cheklovi yo‘q. [Format, test va chegaralar](docs/excel-reports.md).
- **Natijalar:** studentga bog‘langan IELTS/SEFR sertifikati, tayyor rasm va consent/tasdiq bilan bitta save’da nashr; tahrirlash/o‘chirish. Student **Sertifikatlar** menyusida faqat o‘z nashrini ko‘radi.

Joriy migration: `0004_self_registration` (`scripts/backend -m alembic upgrade head`). Lokal bazaga zaxira/restore tekshiruvidan keyin qo‘llangan. O‘quvchi, guruh va kurslarda qo‘lda faol/nofaol tanlanmaydi; oddiy sonlar va sabab bilan o‘chirish ishlaydi. O‘chirish oldingi moliya/davomat tarixini saqlaydi; yangi ariza tasdiqlanishi alohida. [Biznes qoidalari va ixcham light/dark ikonkalari](docs/entity-lifecycle-and-theme-update.md). Public/student ochiq sahifalari 5 soniyagacha ichida yangilanadi; bir brauzerdagi tablar ham xabardor qilinadi. [To‘liq boshqaruv hisoboti va testlar](docs/teacher-management-update.md).

## Asosiy ish oqimi

1. Mehmon ariza yuboradi. Lead va outbox bitta transactionda commit qilinadi.
2. Ustoz Murojaatlar’dan uni ko‘radi, mavjud telefon mosliklarini tekshiradi va o‘quvchiga aylantiradi.
3. O‘quvchi guruhga sanalar bilan qo‘shiladi; guruh jadvalidan chegaralangan oraliqda darslar yaratiladi.
4. Dars tafsilotida davomat saqlanadi; qayta saqlash dublikat yaratmaydi.
5. Moliya’da oylik draft hisoblar yaratiladi, manual chegirma tekshiriladi, hisob chiqariladi. To‘lov va allocation alohida: erkin mablag‘ yo‘qolmaydi.
6. O‘quvchi o‘z kabinetida jadval, davomat, hisoblar, vazifalar, materiallar va feedbackni ko‘radi.

## Telegram

Backend/worker env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `PUBLIC_APP_URL`.

Joriy lokal ulanish va real yetkazish tekshiruvi: [Telegram setup](docs/telegram-setup.md). Lokal/private URLda Telegram rad etadigan inline tugma qo‘shilmaydi; haqiqiy public domen sozlangach «Platformada ochish» tugmasi qaytadi.

BotFather orqali bot yarating. Shaxsiy chatda botga `/start` yuboring yoki uni kerakli yopiq guruhga qo‘shib yozish ruxsatini bering. Shu chatning ID’sini tekshirib env’ga kiriting. Tokenni frontend env’iga yoki Git’ga yozmang. Worker’ni qayta boshlang. Oldingi `disabled`/`failed` murojaat uchun ustoz kabinetida qayta yuborishni tanlang.

Token bo‘lmasa ariza saqlanadi, Telegram holati **sozlanmagan**. Forma “Arizangiz qabul qilindi” deydi; bu Telegram yetkazildi degani emas. Timeoutdan so‘ng duplicate bo‘lishi mumkin; xabardagi lead ID yordam beradi. [Delivery qoidalari](docs/architecture.md#telegram).

## Storage, HTTPS va PWA

Local disk: `STORAGE_BACKEND=disk`, `MEDIA_ROOT`. Production S3-compatible private bucket: `STORAGE_BACKEND=s3`, `S3_BUCKET`, `S3_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`. Public uchun ham alohida tayyorlangan fayllar private bucketdan API orqali uzatilishi mumkin. Submissionlar va original sertifikatlarni public bucketga ko‘chirmang.

JPEG/PNG/WebP: 5 MB; PDF: 10 MB. MIME/signature tekshiriladi, rasmlar resize/re-encode qilinadi; portret alpha kanali saqlanadi. Public natija/galereya preview’i uchun alohida redaksiyalangan rasm talab qilinadi; PDF attachment sifatida ochiladi.

HTTPS namunasi: [nginx config](infra/nginx/sherzod.conf). Haqiqiy domen, sertifikatlar, `APP_ENV=production`, `PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_URL`, exact `ALLOWED_ORIGINS`/`ALLOWED_HOSTS` va secretlarni sozlang. `TRUSTED_PROXY_IPS`ga **faqat bevosita reverse proxy’ning tekshirilgan IP’si** kiritiladi; Nginx `X-Real-IP`ni o‘zi yozadi. Bo‘sh bo‘lsa forwarded identity headerlar inkor qilinadi; lokal Next rewrite ortida rate limit bitta proxy IP bo‘yicha konservativ ishlaydi. Production namunasi `/api/`ni bevosita FastAPI’ga uzatadi.

PWA manifest, 192/512/maskable ikonlar, public offline shell va yangilanish xabari bor. Private kabinetlar, API va auth cache qilinmaydi. Oflayn mutation queue yo‘q. Har release’da `public/sw.js` cache versiyasini yangilang. Install prompt faqat brauzer uni qo‘llab, tegishli eventni berganda chiqadi; production HTTPS talab qiladi. Chrome’da install/update xabari va mobil touch holatlari tekshirildi. Native o‘rnatish hamda haqiqiy iOS/Android qurilmalaridagi tekshiruv hali bajarilmagan.

## Tekshirish

```bash
scripts/test-backend -q
scripts/frontend run typecheck
scripts/frontend run test
scripts/frontend run build
```

Haqiqiy transaction/concurrency/IDOR testlari uchun **alohida disposable** `*_test` bazasi zarur. Quyidagi rejim shu bazadagi ma’lumotlarni tozalaydi:

```bash
TEST_DATABASE_URL='postgresql+psycopg://user:password@localhost:5432/sherzod_test' TEST_DATABASE_RESET=1 scripts/test-backend -m postgres -q
```

Playwright uchun xizmatlar ishlayotgan bo‘lsin. Tekshirilayotgan akkaunt parollarini `E2E_TEACHER_PASSWORD`/`E2E_STUDENT_PASSWORD`ga export qiling. Loginlar seed nomlaridan farq qilsa, `E2E_TEACHER_USERNAME`/`E2E_STUDENT_USERNAME`ni ham belgilang (joriy lokal holat: `<private-teacher-login>` / `<private-student-login>`):

```bash
cd frontend
# /opt/google/chrome/chrome mavjud bo‘lsa testlar avtomatik Chrome’dan foydalanadi.
# Chrome bo‘lmasa Playwright brauzerini o‘rnating:
npx playwright install chromium
npm run e2e
```

Chrome bilan `docs/qa/`ga mobil/planshet/desktop screenshotlar yozildi; eng so‘nggi dalillar yuqoridagi responsive hisobotida. [QA natijalari va davom ettirish](docs/implementation-status.md).

## Operatsion hujjatlar

- [Arxitektura va moliyaviy qoidalar](docs/architecture.md)
- [Bajarilish holati, cheklovlar va keyingi amallar](docs/implementation-status.md)
- [Haqiqiy kontent checklist](docs/content-checklist.md)
- [8 ta referens tahlili](docs/design-audit.md)
- [Backup va restore](docs/operations.md)
- [OpenAPI snapshot](docs/openapi.json)
