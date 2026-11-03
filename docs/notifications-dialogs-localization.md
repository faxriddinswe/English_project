# Bildirishnomalar, tafsilot modallari va o‘zbekcha interfeys — 2026-11-02

## Talab va reja

Mavjud platformani saqlagan holda: amallar natijasini ixcham burchak bildirishnomalarida ko‘rsatish; ustoz kabinetidagi pastda ochiladigan tafsilotlarni modalga ko‘chirish; tizim yozuvlarini o‘zbekchalashtirish; kirish, logo va mobil ko‘rinishni tuzatish. Mavjud CRUD/API va ma’lumotlar qayta yaratilmaydi.

## Bajarilgan ishlar

- Umumiy bildirishnoma komponenti va hodisa kanali qo‘shildi. Desktopda yuqori o‘ng, telefonda menyu/yopish tugmasini to‘smaslik uchun pastki o‘ng burchak. Bir paytda ko‘pi bilan uchta; oxirgi xabar birinchi, takrorlari birlashtiriladi. Muvaffaqiyat 5, xato 8 soniya; hover/fokus va yashirin tabda vaqt to‘xtaydi. 44 px yopish tugmasi, safe-area, reduced motion, rangdan tashqari matn/belgi va `aria-live` mavjud. Xabarlar saqlanmaydi, login/logoutda tozalanadi.
- Haqiqiy API javobidan keyingina ariza, to‘lov, guruh, davomat, sertifikat, vazifa, nashr va boshqa o‘zgarishlar tasdiqlanadi. Fayl upload xabari formani ham saqlash kerakligini aytadi. Telegram navbatga qo‘yilishi yetkazildi deb ko‘rsatilmaydi. Xato xabari va forma qiymatlari saqlanadi. CSV tugmalari autentifikatsiyalangan faylni yuklab olib, tayyorlanganini bildiradi; yuklab olish xatosi yashirilmaydi.
- Ustozning o‘quvchi, guruh, dars, davomat, to‘lov, hisob, vazifa, natija/sertifikat, murojaat, kontent, baho, material va kurs tafsilotlari darhol markaziy modalda ochiladi. Yuklanish holati ham o‘sha yerda. Tahrir/tasdiq ichki modalidan qaytganda asosiy tafsilot saqlanadi. Escape, focus restore, ichki scroll va sticky yopish tugmasi saqlangan. Bildirishnomani yopish tafsilot modalini yopmaydi. O‘quvchi vazifasining mavjud modali qayta ishlatilgan.
- Maydon/holatlarning yagona o‘zbekcha lug‘ati: `updated_at`, `accepted`, to‘lov/nashr/yuborish holatlari, sana va pul ko‘rinishi. Texnik noma’lum kalitlar va ID/ichki metama’lumot Summary’da chiqarilmaydi. Oy nomlari aniq o‘zbekcha, vaqt Toshkent bo‘yicha; pul so‘m bilan ko‘rsatiladi. Public natijalardagi ko‘nikmalar va umumiy ball yozuvlari o‘zbekcha.
- FastAPI validatsiyasi va oddiy HTTP xatolari uchun xavfsiz o‘zbekcha xabarlar, CSV sarlavha/holatlari o‘zbekcha qilindi. API kodlari, enum, field path va URL shartnomalari o‘zgarmadi. Foydalanuvchi yozgan ism, vazifa/javob/izoh yoki sertifikat rasmining ichki matni avtomatik tarjima qilinmaydi. Sherzod English, IELTS, Telegram kabi nomlar saqlanadi.
- Kirish maydoni “Kirish nomi”, aniq label/xatolar, parolni ko‘rsatish/yashirish tugmasi, to‘g‘ri autocomplete va mobil klaviatura sozlamalari. Parolga uzunlik/tarkib cheklovi qayta qo‘shilmadi. Kirish/parol kartasi va logo 320 pxdan landscape/desktopgacha moslashtirildi. Global link uslubi sabab login logosi ustma-ust tushishi tuzatildi.
- Fayl tanlashdagi browserning inglizcha standart yozuvi o‘rniga “Fayl tanlash / Fayl tanlanmagan” va tanlangan nom ko‘rinadi. Asl native input, klaviatura fokusi, accept, disabled va upload oqimi saqlangan. Tashqi operatsion tizim fayl dialogining tili brauzer/qurilma sozlamasiga tegishli.

## Tekshiruvda topilgan qo‘shimcha xato

Boshqa forma/tab CSRF cookie’ni yangilaganda client eski modul tokenini yuborib, masalan Chiqish amalini rad ettirishi mumkin edi. Har bir yozuvchi so‘rov joriy imzolangan cookie’ni o‘qiydi. Faqat backend biznes amalidan **oldin** qaytargan `csrf_failed` uchun bir martalik qayta urinish bor; body va Idempotency-Key saqlanadi. Boshqa xatolar avtomatik takrorlanmaydi. CSRF/Origin himoyasi olib tashlanmagan.

## Tekshirilgan natijalar

- Disposable PostgreSQL bazasida **69 backend testi**: ruxsatlar, moliya, auth/CSRF, lead/outbox, upload/publication va yangi o‘zbekcha validation/export tekshiruvi o‘tdi.
- **11 frontend unit testi**: tarjima/sana/pul, foydalanuvchi matnini saqlash, faqat javobdan keyingi bildirishnoma, network xatosi, joriy CSRF cookie va chegaralangan retry.
- Alohida DB, FastAPI `8101`, Next `3101`, yangi vaqtinchalik akkaunt/media bilan **16 Chrome testi**: barcha 13 resource modali va nested tahrir fixture’lari; haqiqiy CSV; login/parol/CSRF; lead, student/guruh/davomat, invoice/partial payment, vazifa/submission/izoh, nashr/unpublish; to‘lov/guruh/sertifikat CRUD. [Dalil](notifications-dialogs-e2e-results.json). Test DB/process/media yakunda olib tashlandi; Telegram secretlari bu muhitda o‘chirilgan.
- Asosiy lokal buildda **24 Chrome regressiya testi o‘tdi, 1 ta izolyatsiyalangan CSV testi shartiga ko‘ra o‘tkazilmadi**. Public navigatsiya/API, 320–1920 px, planshet, 844×390 landscape, touch, menyu, FAQ, sertifikat filtri/zoom, PWA install/update holatlari. [Dalil](notifications-dialogs-regression-results.json). CSV yuqoridagi alohida bazada haqiqatan o‘tgan.
- Oxirgi ishlayotgan asosiy buildda **4 ta interfeys testi qayta o‘tdi**, xuddi shu CSV testi asosiy bazada skip. [Yakuniy interfeys dalili](notifications-dialogs-final-interface-results.json). Yakuniy o‘zbekcha fayl nazorati bilan yana **3 haqiqiy CRUD testi** o‘tdi: certificate fayli tanlandi, nomi ko‘rindi, FastAPI orqali saqlandi/nashr qilindi, o‘zgartirildi va o‘chirildi; payment/guruh oqimlari ham o‘tdi. [Yakuniy CRUD dalili](notifications-dialogs-final-crud-results.json). So‘ng asosiy production build/TypeScript, 11 unit va yangi bildirishnoma/fayl/parol/download/lug‘at/API client fayllarining maqsadli lint tekshiruvi qayta o‘tdi.
- Ikkala mavjud rol bilan **haqiqiy lokal login, API va teacher natija modali** faqat o‘qib tekshirildi; 375 pxda overflow yo‘q. [Live dalil](notifications-dialogs-live-verification.json). Tekshiruv snapshoti: 2 guruh, 4 payment, teacher listda 61 certificate, studentga bog‘langan certificate 0. O‘quvchi barcha ommaviy namunalarni avtomatik o‘ziniki sifatida olmaydi.
- Dastlabki regressiyada 4 ta test eski “60/30/30” qat’iy soniga urildi: joriy public ma’lumot 59 ta (30 IELTS, 29 SEFR). Mavjud ma’lumotga tegilmadi; testlar joriy API count/turini grid bilan solishtiradi. Keyingi 24 testning barchasi o‘tdi. Bu o‘chirilgan natijani yashirin qayta yaratishni oldini oladi.
- Production build va undagi TypeScript tekshiruvi o‘tdi; frontend/backend lokal qayta ishga tushirildi. Public SW v9. Yakuniy `/health/live`, DBni tekshiruvchi `/health/ready`, `/login` va public revision proxy javoblari 200. Bu vazifada schema migratsiyasi, asosiy bazani seed/reset, account/parol yoki biznes ma’lumotlarini yozish bo‘lmadi; live login/logout tabiiy session/audit amallarini bajaradi.

### Kuzatilgan cheklovlar

`npm run lint` tekshirildi. Generatsiya qilingan `.next-qa` katalogi ignore’ga qo‘shildi va yangi Notifications hook xatosi tuzatildi. Qolgan **5 ta oldindan mavjud lint xatosi**: `app/error.tsx` va `BrandLogo.tsx` oddiy home anchor; `PWA.tsx`, `LeadApplicationModal.tsx`, `useTheme.ts`dagi effect ichidagi state sinxronlash. Yana 12 warning (asosan mavjud img va React Hook Form integratsiyasi) bor. Lint toza deb ko‘rsatilmaydi. Build/typecheck va yuqoridagi real journeylar o‘tgan; bu lint qarzi alohida qayd etildi.

Chrome emulyatsiyasi haqiqiy iOS/Safari/Android yoki native PWA o‘rnatish tekshiruvi emas. Production deploy, tashqi S3 va real Telegram yetkazish qayta bajarilmadi. Worker konfiguratsiyasi o‘zgarmadi. Har bir mumkin bo‘lgan tugma/permission kombinatsiyasi exhaustiv tekshirildi degan da’vo yo‘q; asosiy amallar va yangi UI holatlari yuqoridagi ssenariylar bilan tekshirilgan.

## Screenshotlar

- [375 px kirish/logotip](qa/login-refined-375x812.png)
- [320 px bildirishnoma](qa/notification-success-320.png)
- [Xato va tafsilot modal](qa/notification-error-modal-375.png)
- [Haqiqiy natija modal](qa/live-result-dialog-375.png)
- [Landscape kirish](qa/login-refined-844x390.png)

## Qayta tekshirish

```bash
scripts/frontend run build
scripts/frontend run test
cd frontend
PLAYWRIGHT_CHANNEL=chrome npm run e2e -- tests/e2e/interface-notifications.spec.ts
PLAYWRIGHT_CHANNEL=chrome npm run e2e -- tests/e2e/mobile-responsive.spec.ts tests/e2e/navigation-responsive.spec.ts tests/e2e/public-grid.spec.ts tests/e2e/teacher-profile.spec.ts
npm run lint
```

Haqiqiy mutation E2E uchun disposable PostgreSQL DB, alohida backend/frontend, `E2E_BASE_URL` 3101 va vaqtinchalik credential env kerak; asosiy bazada bu testlar ataylab skip qilinadi. Backend testlari faqat `TEST_DATABASE_URL` bilan ajratilgan bazada, reset uchun `TEST_DATABASE_RESET=1` orqali bajariladi. Asosiy bazani test bazasi sifatida bermang. Secret qiymatlar hisobotlarda saqlanmaydi.
