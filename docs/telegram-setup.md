# Telegram ulanishi — 2026-11-01

`@sherzod_english_murojat_bot` foydalanuvchi tanlagan «Sherzod English - Murojatlar» yopiq guruhiga ulandi. Bot identity va guruhdagi administrator holati Telegram API orqali tekshirildi. Guruh IDsi private `.env`dagi `TELEGRAM_CHAT_ID`ga yozildi; token va chat sozlamalari frontendga chiqarilmadi.

## Yangi formatda haqiqiy sinov xabari — 2026-11-03, 10:04 (Asia/Tashkent)

Foydalanuvchining «test qilib sinachi xabar yuborib» so‘rovi bilan sozlangan Telegram guruhiga **bitta** haqiqiy xabar yuborildi. Ism maydonida «SINOV — yangi xabar formati», telefon o‘rnida haqiqiy raqam emasligi ko‘rsatilgan belgi, izohda foydalanuvchi so‘ragan sinov ekani yozildi. Ariza/akkaunt yaratilmadi: mavjud `lead_message()` va `message_payload()` formatterlari natijasi to‘g‘ridan-to‘g‘ri Telegram `sendMessage` API’iga yuborildi.

Natija: **HTTP 200**, **`ok: true`**, Telegram xabar raqami **21**. Telegram qaytargan matn yuborilgan matnga to‘liq teng. Sana `2026-11-03`, soat `10:04`; yangi sarlavha, ID qatorining yo‘qligi, alohida Toshkent sana/soati va kabinet eslatmasi tekshirildi. [Secretlarsiz yetkazish dalili](telegram-format-delivery-2026-11-03.json).

Bu test real Telegram transporti va yangi formatterlar matnini tasdiqlaydi; sayt formasi → DB outbox → worker oqimini qayta ishga tushirmaydi. Ilova kodi/biznes yozuvlari va yuborilgan eski xabarlar o‘zgartirilmadi, yangi unit/E2E testlari bajarilmadi. Lokal yordamchi skriptning dastlabki import yo‘li xatosi tarmoq so‘rovidan oldin to‘xtagan; yo‘l tuzatilgach bitta `sendMessage` so‘rovi bajarilgan. Quyidagi 09:58 yozuvidagi «yangi real test yuborilmadi» chegarasi o‘sha avvalgi o‘zgartirish bosqichiga tegishli.

## Xabar formati yangilandi — 2026-11-03, 09:58 (Asia/Tashkent)

Foydalanuvchi talabi: Telegram ariza/murojaat xabaridagi `ID:` qatorini olib tashlash, sarlavhani «Yangi ariza kelib tushdi.»ga almashtirish, sana va soatni alohida chiqarish. Avval worker matni va mavjud delivery testlari o‘rganildi; formatter ajratilib o‘zgartirildi, testlardan so‘ng lokal worker qayta ishga tushirildi.

Xabarning hozirgi shakli (qavsli qiymatlar ariza ma’lumotlaridan olinadi):

```text
Yangi ariza kelib tushdi.

Ism: [ism va familiya]
Telefon: [telefon]
Kurs: [kurs yoki Aniqlanmagan]
Sana: 2026-11-03
Soat: 11:30
Izoh: [arizadagi izoh]

Murojaatni ustoz kabinetidagi «Murojaatlar» bo‘limida ko‘ring.
```

`Sana` — ariza yaratilgan vaqtning Asia/Tashkent bo‘yicha `YYYY-MM-DD` ko‘rinishi; `Soat` — shu vaqtning 24 soatlik `HH:MM` ko‘rinishi. Namunadagi 11:30 doimiy qiymat emas. Sekund, mikrosekund va timezone suffix xabarda chiqarilmaydi. Bu bitta outbox oqimiga tushadigan ochiq murojaat va kabinetdan ro‘yxatdan o‘tish xabarlariga bir xil qo‘llanadi. Eslatma lokal va public manzillarda ham ko‘rsatiladi; public manzilda mavjud «Platformada ochish» tugmasi saqlanadi. Ichki lead/outbox IDlari, retry va audit o‘z joyida saqlangan; yuborilgan eski Telegram xabarlari tahrirlanmagan/qayta yuborilmagan.

O‘zgargan fayllar: `backend/app/workers/telegram.py`, `backend/tests/test_telegram_delivery.py` va tegishli loyiha hujjatlari. Tekshiruv buyruqlari:

```bash
scripts/test-backend tests/test_telegram_delivery.py -q
.venv/bin/ruff check backend/app/workers/telegram.py backend/tests/test_telegram_delivery.py --select F
```

Natija: **13 passed (1.41s)**, Python F tekshiruvi o‘tdi. Matnning to‘liq tengligi, IDsiz chiqishi, UTC va +05:00 kirishlari, Toshkentda kun almashishi, tanlangan kurs/izoh va local/public URL holatlari tekshirildi. Worker qayta ishga tushgach faol worker soni 1 va heartbeat tayyorligi tasdiqlandi. Yangi test arizasi/akkaunti yaratilmadi, Telegram guruhiga alohida sinov xabari yuborilmadi; bu o‘zgarish uchun yangi real provider yetkazilishi da’vo qilinmaydi. Frontend o‘zgarmagani uchun frontend build/E2E qayta bajarilmadi. Quyidagi real yetkazish tekshiruvi 2026-11-01 dagi tarixiy dalildir.

## Haqiqiy tekshiruv

1. Saytdagi IELTS kurs kartasidan «SINOV — Telegram ulanishi» nomli bitta test arizasi yuborildi.
2. Haqiqiy FastAPI 201 javobini berdi va Lead + NotificationOutbox PostgreSQLga saqlandi.
3. Birinchi ikki yetkazish urinishida Telegram `localhost` manzilli inline tugmani 400 bilan rad etdi. Hech biri muvaffaqiyat deb belgilanmadi.
4. Worker lokal/private manzillarda inline tugma qo‘shmasligi tuzatildi. Xabar o‘rniga murojaatni kabinetdagi «Murojaatlar» bo‘limida ko‘rish eslatmasi bor.
5. O‘sha test arizasi qayta yuborilganda Telegram `ok: true` qaytardi; outbox `sent`, `last_safe_error = null`. Test arizasi aniq SINOV deb belgilangan. Boshqa oldingi arizalar avtomatik qayta yuborilmadi.
6. Doimiy worker qayta boshlandi. Sayt va API readiness 200.

Regression tekshiruvi: 48 backend testi o‘tdi; ulardan 9 tasi lokal/private URL sabab ariza yuborilishi buzilmasligini va public URLda to‘g‘ri detail havolasi qolishini tekshiradi. Real yetkazish dalili [local-runtime.json](local-runtime.json)da, secretlarsiz.

## Ishga tushirish

Backend va worker bir xil private `.env`ni o‘qiydi:

```dotenv
TELEGRAM_BOT_TOKEN=<BotFather bergan token>
TELEGRAM_CHAT_ID=<tanlangan guruhning IDsi>
PUBLIC_APP_URL=http://localhost:3000
```

```bash
scripts/backend -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log --no-proxy-headers
# Alohida terminalda:
scripts/backend -m app.workers.telegram
```

Token yoki guruh o‘zgarsa ikkala jarayonni qayta boshlang. Tokenni Git, brauzer public env yoki loglarga yozmang. Guruhdagi botning xabar yozish ruxsatini saqlang.

Haqiqiy HTTPS domen sozlangach `PUBLIC_APP_URL`ni o‘sha manzilga almashtiring va worker’ni qayta boshlang. Shunda xabardagi «Platformada ochish» tugmasi haqiqiy, login talab qiladigan murojaat sahifasiga olib boradi. Lokal kompyuter o‘chiq bo‘lsa yoki worker to‘xtasa, yangi xabarlarni yetkazish uchun xizmatlarni yana ishga tushirish kerak; bu ishda production hosting yaratilmagan.

`disabled` yoki `failed` holatidagi oldingi murojaatlarni zarur bo‘lsa ustoz kabinetidan alohida qayta yuboring. Timeoutdan keyin takroriy xabar ehtimoli mavjud; aynan bir marta yetkazish va’da qilinmaydi.
