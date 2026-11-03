# GitHub nashri va fayllar auditi — 2026-11-03 (Asia/Tashkent)

## Sabab va tuzatish yo‘li aniqlashtirildi — 2026-11-03, 14:55 (Asia/Tashkent)

Egasi muammoning asosiy sababini va o‘zi tuzatadigan joyini so‘radi. Oldingi tekshiruvlarda ikkita mustaqil to‘siq bor: GitHub API joriy integratsiya bilan write’ni403 rad etdi; agent shell’dagi haqiqiy push esa domenni DNS orqali topolmay exit128 berdi. Ikkinchi xatoning aynan lokal kompyuter DNS sozlamasi yoki agent tarmoq izolyatsiyasi ekani ajratib isbotlanmagan; foydalanuvchining oddiy terminalida `getent hosts github.com` bilan solishtirish kerak. Bu safar yangi push yoki runtime tekshiruvi bajarilmadi.

Rasmiy GitHub hujjati `Resource not accessible by integration`ni token huquqi yetishmasligi bilan izohlaydi: [REST troubleshooting](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#resource-not-accessible). Repo egasining push huquqi integratsiya tokenining write huquqini kafolatlamaydi. Tekshiriladigan joy: Settings → Applications → Installed GitHub Apps → tegishli app → Configure; repository access ichida Sherzod-English borligi va Permissions ichidagi Contents darajasi. [Installed app tekshiruvi](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps).

Oldingi «Contents huquqini yoqing/qayta ulang» tavsiyasi aniqlashtirildi: uchinchi tomon app’ining so‘raladigan permissionlarini app egasi/developeri belgilaydi, oddiy o‘rnatuvchi ularni o‘zi kengaytira olmaydi; yangilangan permission so‘ralsa installation egasi tasdiqlaydi. Shuning uchun faqat qayta ulash write’ni kafolatlamaydi. [GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app). Agar app read-only bo‘lsa, terminal Git autentifikatsiyasi orqali push qilish muqobil yo‘l; `gh` mavjud bo‘lsa browser login `gh auth login --hostname github.com --git-protocol https --web` bilan qilinadi, Git credential sozlash tanlanadi. [CLI authentication](https://docs.github.com/en/github-cli/github-cli/authenticating-with-github-cli). `gh` bu ish muhitida avval topilmagan; uni o‘rnatilgan deb faraz qilinmaydi. Secretlar chatga so‘ralmaydi.

Kod/baza o‘zgarmadi, test/build takrorlanmadi. Diagnostika jurnali/statusi yangilanadi; nashr hali bajarilmagan, saqlangan safe commit/bundle keyingi urinish uchun qoladi.

## Navbatdagi qayta urinish — 2026-11-03, 14:51 (Asia/Tashkent)

Egasi «endi qilchi» deb yana push qilishni so‘radi. Lokal `d32f9cd` va clean status o‘qildi, remote branches yana `[]`. GitHub integratsiyasidan ilk `.gitignore` yozish so‘rovi yana **HTTP403 `Resource not accessible by integration`** bilan rad etildi. Bu safar terminalda preflight bilan cheklanmasdan **haqiqiy** `git --git-dir=.local/github.git --work-tree=. push -u origin main` bajarildi: **exit128, `Could not resolve host: github.com`**. Remote nashr bajarilmadi.

Kod/baza/runtime o‘zgarmadi; faqat ushbu tekshiruv hujjatlashtirildi. Xavfsiz lokal commitlar va private bundle saqlanadi. Qolgan ish tashqi GitHub write ulanishi yoki terminal tarmoq/auth ishlashiga bog‘liq. Oddiy foydalanuvchi terminalida shu loyiha katalogidan yuqoridagi aniq push buyrug‘i ishlatilishi mumkin; force yo‘q. U ham muvaffaqiyatli tugamaguncha nashr deb hisoblanmaydi. Yana shunchaki ruxsat so‘rash o‘rniga ushbu muqobil aniq buyruq foydalanuvchiga beriladi; secretlar chatga so‘ralmaydi. Bu safar unit/build/E2E qayta bajarilmadi.

## Qayta push urinishi — 2026-11-03, 14:45 (Asia/Tashkent)

Egasi GitHub huquqini yoqqanini bildirib, yana push qilishni so‘radi. Avval joriy hujjatlar, lokal commit `66cd631` va clean index tekshirildi. Staged-blob scanner yana **263 fayl, 4,430,438 bytes, 0 findings** qaytardi. Remote branches yana `[]`; birinchi `.gitignore` faylini yaratish so‘rovi yana **HTTP 403, `Resource not accessible by integration`** bilan rad etildi. Terminal `git ls-remote` hamon `Could not resolve host: github.com` bilan tugadi.

Natija: ushbu qayta urinishda ham **push bajarilmadi**, remote fayl/commit yaratilgani tasdiqlanmagan. Ruxsat sozlamasi o‘zgargani haqidagi egasining xabari saqlandi, ammo amaldagi integratsiya yozishni qabul qilmadi. Ulanish tokeni yangi huquqlarni olmagani mumkin bo‘lgan izoh, tekshirilgan sabab emas. Keyingi aniq qadam: GitHub ulanishini qayta autentifikatsiya qilish (kerak bo‘lsa uzib qayta ulash), shu repo uchun Contents yozish huquqi bilan real yozish so‘rovini qayta tekshirish; muvaffaqiyatdan keyin source/tree/blob tengligini tekshirish. Token/parol chatga so‘ralmaydi.

Bu safar ilova kodi, runtime yoki baza o‘zgarmadi; unit/integratsiya/build/E2E takrorlanmadi. Jurnal/status va ushbu hisobot yangilanib lokal commit/bundle saqlanadi. Oldingi test natijalari quyida o‘z sanasidagi dalil sifatida qoladi.

## Talab va reja

Egasi mavjud loyihani `https://github.com/faxriddinswe/Sherzod-English.git`ga xavfsizlik tahlili bilan yuklashni so‘radi. Reja: joriy hujjat/kod va remote holatini tekshirish, private fayllarni chiqarish, aniq Git indeksini secretlarga tekshirish, mavjud remote tarixini saqlab kodni yuborish va remote tree/blob hashlarini solishtirish.

GitHub ulanishi `faxriddinswe` sifatida tasdiqlandi, repozitoriy public, push huquqi bor. Dastlab `size=0`, default branch `main`, branches ro‘yxati bo‘sh edi. Terminal `git ls-remote` DNS sabab `Could not resolve host: github.com` bilan tugadi; mavjud GitHub plugin Git Data API orqali nashr qilinadi. Bu nashr hosting/deploy emas.

## Fayllar va maxfiylik qarorlari

- Kiritiladi: mavjud frontend/backend, Alembic/SQL migratsiyalar, test manbalari, locklar, Docker/nginx/backup skriptlari, `.env.example`, AGENTS, authored Markdown va OpenAPI, saytdagi public brend/ustoz/kurs rasmlari, font va litsenziyasi. Excel regressiyasidagi `NAMUNA` fixture faqat test papkasida.
- Kiritilmaydi: `.env` va variantlari, `.local`, virtualenv/node_modules/build, database/backup/media, AWS/SSH/Codex konfiguratsiyasi, private keylar, xom `Screenshots`, `docs/qa`, mahalliy JSON/XML dalillar, log/PID va editor keshlar. Fayllar diskdan o‘chirilmagan.
- `.gitignore` kengaytirildi, `.gitattributes` matn/binary va LF qoidalarini belgilaydi. `.env.example`dagi credentiallar faqat placeholder; SQL migratsiyalar ignore qilinmadi.
- `certificates.py` ichidagi 5 shaxsning ism/natija/date metadatasi private `.local/certificate-import.json`ga ko‘chirildi (0600). Importer manifestni explicit o‘qiydi, anonim example/testlar repozitoriyda. Main bazadagi natijalar o‘zgartirilmagan; importer mainda ishga tushirilmagan.
- Tarixiy Markdown’dagi lokal account login qiymatlari redakt qilindi, tarix va bajarilgan amallar saqlandi. Keraksiz mavjud profil balans qiymati jurnaldan chiqarildi. Private JSON/XML/screenshot dalillar ommaviy GitHubga kiritilmagani sabab eski hujjatlardagi ayrim havolalar faqat lokal nusxada ochiladi.
- `scripts/audit-git.py` aynan staged bloblarni tekshiradi: taqiqlangan yo‘llar/symlink/conflict, private `.env` secretlari/DB paroli va private manifestdagi ismlar, GitHub/Telegram/AWS token formatlari, JWT/private key/Argon2 hash. XLSX ichidagi XML ham tekshiriladi, faqat `NAMUNA` test fixturega ruxsat. Chiqariladigan natijalar qiymatsiz fayl/qator/qoidalar. Bu barcha mumkin bo‘lgan secretlarni topish kafolati emas; kod ko‘rigi ham bajariladi.

## Lokal Git metadatasi

Muhitdagi `.git` bo‘sh read-only katalog bo‘lgani sabab indeks/commit uchun ruxsat etilgan `.local/github.git` ishlatiladi. Ushbu nusxada `git --git-dir=.local/github.git --work-tree=.` ishlatiladi; scanner uchun `GIT_DIR=.local/github.git GIT_WORK_TREE=. python3 scripts/audit-git.py`. Bu metadata private va nashrga kiritilmaydi. Odatdagi yangi `git clone`da standart `.git` va oddiy Git buyruqlari ishlaydi. Remote bo‘shligi qayta tekshirilgan; uning tarixini force bilan almashtirish bajarilmadi.

## Tekshiruv va nashr holati

- `scripts/test-backend tests/test_certificate_manifest.py tests/test_rules.py tests/test_password_policy.py -q`: **31 passed, 2.13s**.
- `.venv/bin/ruff check ... --select F`: o‘zgargan Python fayllarida passed. Dastlab broad Ruff chaqiruvi oldingi import/style qoidalarini ham ko‘rsatdi; bu safar barcha tarixiy testlar formatini o‘zgartirish rejalashtirilmadi.
- `scripts/backend ../.local/run-audit-tests.py tests/test_postgres_api.py -k certificate ... -q`: **2 passed, 41 deselected, 7.97s**, alohida `55433`dagi `_test` bazada; main bazani test uchun reset qilishga ruxsat berilmagan. Dastlab optionssiz test klaster starti band `5432` sabab tugadi; oldingi klaster port/socket optionsi bilan `55433`da ishga tushdi.
- Scanner izolyatsiyalangan vaqtinchalik Git indeksida clean/leak (qiymat chiqarmaslik)/private path/symlink holatlarida **4/4 passed**. Main runtime status: postgres/backend/frontend/worker true.
- Yakuniy indeks auditi: **263 fayl, taxminan 4.43 MB, 0 findings**; private `.env` qiymatlari va original sertifikat ismlari staged bloblarda topilmadi. Ignore probe’da `.env`, nested env, private manifest, raw sertifikat, QA/JSON va node_modules chetlatilgani, `.env.example`/OpenAPI/NAMUNA XLSX kiritilgani tekshirildi.
- GitHub `create_file` orqali birinchi `.gitignore` commitini yaratish so‘rovi **HTTP 403, `Resource not accessible by integration`** bilan rad etildi. Ulanishdagi owner/repo permission snapshotidagi `push=true` integratsiyaning Contents yozish scope’ini kafolatlamadi. Plugin katalogida GitHub allaqachon installed/enabled; OAuth/admin scope’larini o‘zgartirish huquqi ushbu vositalarda yo‘q. Rad etilgandan keyin branches yana `[]`: remote’da commit yoki fayl yaratilmadi. Bu avtomatik approval-review rad javobi emas, GitHub API ruxsat xatosidir.
- Terminal `git ls-remote` DNS xatosi, SSH agent esa `Operation not permitted` qaytardi; mavjud vositalar orqali muqobil autentifikatsiyalangan push yo‘li topilmadi. Foydalanuvchiga GitHub ulanishida ushbu repo uchun **Contents: Read and write** huquqini tiklash/yangilash zarurligi bildirildi. Token/parol chatga so‘ralmadi. Bu bajarilmaguncha task remote nashri **tugallanmagan**.
- Keyingi aniq amal: ulanish yangilangach remote branchlarni qayta tekshirish, auditdan o‘tgan commitni tarixni saqlab yuborish, branch SHA va 263 blob/path/mode hashlarini solishtirish. Shu ish nusxasidan shell tarmoq/auth ishlaydigan muhitda `git --git-dir=.local/github.git --work-tree=. push -u origin main` ishlatiladi; remote o‘zgargan bo‘lsa avval fetch/taqqoslash, force yo‘q. Lokal commit/bundle tayyorlash natijasi quyida qayd etiladi.
- Test bazasi olib tashlandi, faqat dedicated test klasteri to‘xtatildi; main xizmatlar saqlandi.
- Lokal birinchi commit **`7a2b75b19bf53b35199a54f92e82dc26ad865ac8`** yaratildi: 263 faylning path/mode/blob hashi audit indeksiga aynan tengligi tekshirildi. `.local/Sherzod-English.bundle` to‘liq tarixli Git bundle yaratildi, `git bundle verify` **okay**; boshlang‘ich hajmi 2,724,519 bytes. Yakuniy hujjat commitidan keyin bundle yangilanadi. Bundle va Git metadatasining o‘zi remote’ga kiritilmaydi; push faqat commitga bog‘langan obyektlarni yuboradi.
- Markdown fence va yangi hisobot havolalari passed; `qa-certificate.png` vizual ko‘rildi, faqat NAMUNA QA matnli test fixture. `git diff --cached --check` dastlabki importdagi eski generated SQL va ayrim Markdown’da whitespace topdi; ular secret emas va ushbu taskda migratsiyalar qayta generatsiya qilinmadi. Bu checkni passed deb hisoblamaslik kerak.
- Frontend/runtime biznes kodi o‘zgarmagani uchun oldingi build/E2E bu taskda qayta bajarilmagan. Production, fizik qurilma yoki yangi Telegram yetkazilishi tekshiruvi bajarilmadi.
