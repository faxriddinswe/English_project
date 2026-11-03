# Ism orqali izlash va sanasiz guruhga qo‘shish — 2026-11-02

## Reja

Mavjud Lookup maydonlarini bitta qidiruv/takliflar maydoniga almashtirish: o‘quvchi, guruh, kurs va hisoblarda alohida “Tanlash” selecti bo‘lmaydi. Yozilganda mos variantlar serverdan chiqadi; ustiga bosish yoki klaviatura orqali tanlanadi. Qidiruv matni haqiqiy record tanlovining o‘rnini bosmaydi.

Guruhga qo‘shishda sana so‘ralmaydi. Backend Toshkent bo‘yicha bugungi kunni, kelajak guruhida guruh boshlanadigan kunni saqlaydi; membership tarixi va sig‘im/duplicate nazorati saqlanadi. Boshqa maqsadlar uchun mavjud aniq sana yuboruvchi API clientlar buzilmaydi.

## Bajarilgan ishlar

- Mavjud barcha `Lookup` ishlatadigan o‘quvchi, guruh, kurs va hisob maydonlari uchun bitta yozib izlash komponenti. Alohida select/Tanlash tugmasi yo‘q; ro‘yxat input ostida. Qidiruv serverda, so‘rovga 20 ta variant; ko‘proq bo‘lsa aniqroq yozish eslatmasi. Yangi so‘rov eski requestni bekor qiladi; eski natija yangi query ostida ko‘rsatilmaydi.
- Mavjud qiymat tahrirda UUID bilan emas, detail API’dan kelgan ism/nom bilan ko‘rinadi. Ismni o‘zgartirib yozish oldingi tanlangan IDni tozalaydi: tasodifan boshqa o‘quvchi/guruhga saqlab yuborilmaydi. Erkin yozilgan matn majburiy haqiqiy tanlovni almashtirmaydi.
- O‘quvchi ismi bilan yonida telefon; hisobda davr, summa va o‘quvchi ismi variantlarni farqlashga yordam beradi. Nomlari o‘xshash yozuvlar telefon/davr orqali ajratiladi. Native status/hafta kuni/imtihon turi nazoratlari ushbu server record qidiruvi emas; fayl yuklash native fayl tanlagichidan foydalanishda davom etadi.
- Bosish, ArrowUp/Down, Enter, Escape, combobox/listbox/option va kamida 44 px variantlar. Birinchi Escape ochiq qidiruv takliflarini yopadi; keyingi Escape modalni yopadi. Modal ichidagi Escape capture muammosi testda topilib tuzatildi. Telefon/sichqoncha bilan tanlashda forma fokusi saqlanadi. Yuklanish, bo‘sh ro‘yxat, xato va qayta urinish ko‘rinadi.
- Guruh tafsilotidan o‘quvchi qo‘shish va o‘quvchi profilidan guruhga qo‘shish sanasiz. Qidiruvda faqat faol o‘quvchi/guruh taklif qilinadi. Yakuniy “qo‘shish” amali saqlanadi; yozishni boshlashning o‘zi backendda a’zolik yaratmaydi. Sig‘imni oshirishga aniq rozilik va sabab maydonlari saqlangan.
- `MembershipIn.start_date` API’da ixtiyoriy. Omitted/null bo‘lsa service serverdagi Asia/Tashkent sanasini hisoblab, `max(bugun, group.start_date)`ni yozadi. Guruhning belgilangan oxirgi kuni bo‘lsa, auto a’zolik oxiri o‘sha kundan keyingi kun (`end_date` exclusive). Explicit sanalar yuboruvchi avvalgi clientlar saqlanadi. Inactive, interval, duplicate, sig‘im, FK/exclusion va audit qoidalari bekor qilinmadi. Migration zarur emas.
- Hisob list API’siga `q` qo‘shildi: student ism/telefon, billing period boshlanishi yoki summa bo‘yicha SQL qidiruvi. Student/status/overdue filtrlari va pagination bilan birga ishlaydi; barcha hisoblar frontendga yuklanmaydi. API snapshot yangilandi.

## Tekshiruv holati

- Disposable PostgreSQLda **71 backend testi o‘tdi**. Yangi testlar sanasiz qo‘shishning sana/history/sig‘im/duplicate/rol cheklovlari, kelajakdagi bounded guruh, explicit oldingi sana va hisob qidiruvida student/status scope’ni tekshiradi.
- **11 frontend unit testi**, TypeScript va yangi qidiruv/test fayllarining maqsadli lint tekshiruvi o‘tdi.
- Birinchi 11 Chrome ssenariysida 9 tasi o‘tdi, jumladan haqiqiy guruh/to‘lov/hisob/sertifikat CRUD. Escape qidiruv bilan birga modalni ham yopishi tuzatildi; testdagi mavjud inputga aynan o‘sha matnni yozish yangi change hodisasi bermasligi ham hisobga olindi. Tuzatishdan keyin **11/11 Chrome ssenariysi o‘tdi**: [alohida DB/API E2E dalili](search-enrollment-e2e-results.json). Uchta haqiqiy CRUD oqimi (guruh/sanasiz a’zolik, payment/allocation, certificate publication) va mavjud modal/notification/CSV regressiyasi ham shu to‘plamda o‘tgan.
- Asosiy yakuniy buildda **4/4 qidiruv UI testi** qayta o‘tdi: 320/375/1440 px, to‘g‘ri ID saqlash, unmatched matnni bloklash, Escape, API error/retry va alohida touch kontekstda tap. [Dalil](search-enrollment-ui-results.json).
- Production build va uning TypeScript tekshiruvi o‘tdi; yangi SearchLookup/Dialog/test fayllarining maqsadli ESLint tekshiruvi toza. Butun repository linti qayta bajarilmadi; oldingi vazifadagi alohida qayd etilgan lint qarzi tuzatildi deb ko‘rsatilmaydi.
- Lokal frontend/backend qayta boshlandi. `/login` va DB readiness 200; amaldagi OpenAPI’da `MembershipIn.start_date` required emasligi tekshirildi. Migratsiya bajarilmadi, bunga ehtiyoj yo‘q. Disposable test DB/media/processlar olib tashlandi.
- Mavjud ustoz akkauntida asosiy saytning qidiruv/tanlov oqimi haqiqiy API orqali faqat o‘qib tekshirildi. Sana/select yo‘qligi, nom bilan tanlov, hisob qidiruvi va 375 px overflow yo‘qligi tasdiqlandi. Oldin/keyin guruh memberships bir xil: biznes yozuvi yaratilmagan. [Live dalil](search-enrollment-live-verification.json).

## Qo‘llash va chegaralar

O‘quvchi/guruh/kurs/hisob maydonida ism/nomni yozing, chiqqan variant ustiga bosing yoki Enter bosing; keyin asosiy qo‘shish/saqlash amalini bajaring. Sana tanlash shart emas. Ruxsat, moliya va boshqa qoidalar o‘zgarmadi. Asosiy bazani seed/reset qilish yoki mavjud akkaunt/parollarni o‘zgartirish bajarilmadi. Sinovdagi biznes yozuvlari faqat disposable DB’da. Native telefon/Safari, production, S3 yoki real Telegram yetkazish bu vazifada sinalmagan.

## Manbalar

- [Yangi qidiruv screenshoti — 375 px](qa/search-enrollment-375.png)
- [320 px](qa/search-enrollment-320.png), [1440 px](qa/search-enrollment-1440.png)
- Kod: `SearchLookup.tsx` / CSS; `EntityForm.tsx`; `ResourceActions.tsx`; umumiy `Dialog.tsx`; backend membership schema/service va billing router.

