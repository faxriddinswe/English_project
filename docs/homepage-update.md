# Ochiq sayt yangilanishi — 2026-11-01

Hozirgi lokal sayt: http://localhost:3000. Next.js, FastAPI va mavjud PostgreSQL integratsiyasi saqlandi. Yangi API yoki takroriy ariza mexanizmi yaratilmagan.

- Hero: desktop sarlavhasi 59–70 px, portret hududi 420–440 px; mobil kompozitsiya ham kichraytirildi.
- Navbar: Asosiy, Ustoz haqida, Markaz haqida, Kurslar, Natijalar, FAQ. Havolalar haqiqiy section IDlariga olib boradi.
- `Screenshots/10.png` asosida kartalarsiz to‘rtta raqamli qator. Tasdiqlanmagan tajriba yoki o‘quvchilar soni ixtiro qilinmadi. Hozirgi qiymatlar bazadagi 3 yo‘nalish va aniq belgilangan 40/20/20 ta namuna kartasidan olinadi. Teacher CMS orqali haqiqiy statistikani kiritsa, o‘sha qiymatlar ustun turadi.
- Grammatika, IELTS va SEFR desktopda uchta teng kartada; qisqacha ma’lumot va pastga tekislangan ariza tugmasi bor. CEFR backenddagi standart identifikator bo‘lib qoladi; interfeysda foydalanuvchi so‘ragan SEFR yozuvi ishlatiladi.
- Natijalar: 40 ta development namunasi (20 IELTS, 20 SEFR), desktopda to‘rt ustun; sertifikat rasmi tepada, ism va ball/daraja pastda. Barchasi/IELTS/SEFR filtri, sertifikat lightbox va Escape ishlaydi. Mobil grid bir, planshetda ikki ustun.
- Har bir namuna rasmida va kartasida NAMUNA belgisi bor. Bular haqiqiy o‘quvchi, rasmiy sertifikat yoki Sherzod ustozning tasdiqlangan natijasi emas. Rozilik/tasdiq bayroqlari soxta yoqilmagan. Production public API namuna natijalarni qaytarmaydi; productionda ularni nashr qilish ham bloklangan.

## Qayta foydalanish

```bash
# Faqat development; mavjud akkaunt va tahrirlarni o‘chirmaydi.
# Qayta bajarish 40 ta natijani takrorlamaydi.
scripts/backend -m app.modules.content.demo
```

Bu explicit buyruq development bazasidagi dastlabki NAMUNA kurslarini mazmunli uch yo‘nalishga yangilaydi va nashr qiladi. Ustoz tahrirlagan kurslar almashtirilmaydi. Haqiqiy narx, manzil, dars davomiyligi yoki sertifikat natijasi kiritilmagan.

## Tekshirilgan natijalar

- Frontend production build va TypeScript: o‘tdi. Vitest: 5/5.
- Backend: 52/52 test. Alohida vaqtinchalik PostgreSQL bazasiga Alembic ishladi; fixture takrorlanmasligi, 40/20/20 filtrlar, image fayllari va productionda yashirish ham tekshirildi. Test bazasi keyin o‘chirildi.
- Chrome Playwright: 3/3 test — responsive/theme/modal, uzilgan arizada soxta success yo‘qligi, uchta kursning to‘g‘ri tanlanishi va natijalar gridi/filtri.
- Qo‘shimcha brauzer tekshiruvi: 320, 375, 768, 1440, 1920 px; umumiy horizontal overflow yo‘q, desktopda 4 natija va 3 kurs bir qatorda. `/results?type=cefr` va IELTSga o‘tish ham tekshirildi.
- IELTS kartasidan bitta «NAMUNA QA kurs arizasi» haqiqiy forma orqali yuborildi: API 201; PostgreSQLda `course=ielts`, outbox `disabled`. Soxta Telegram yetkazildi xabari berilmadi.
- [375 px](qa/hero-375.png), [1440 px](qa/hero-1440.png), [1920 px](qa/hero-1920.png) hero screenshotlari va shu katalogdagi to‘liq sahifa screenshotlari saqlandi.

## Telegram holatining keyingi yangilanishi

Quyidagi yetishmagan secretlar haqidagi qayd bu sahifa tekshirilgan dastlabki vaqtga tegishli. Keyingi ulanishda bot va guruh sozlandi, haqiqiy test ariza yetkazildi; joriy holat [Telegram setup](telegram-setup.md)da.

## Dastlabki ulanish holati (tarixiy)

`TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` hali bo‘sh. Hozir ariza saqlanadi, Telegramga yetkazilmaydi. `.env`ga ushbu qiymatlarni kiritib, backend va `app.workers.telegram` jarayonini qayta boshlash kerak. Oldingi `disabled` arizalar avtomatik yetkazilgan deb hisoblanmaydi; teacher kabinetidan ularning holati ko‘rinadi. Worker timeout/retry/outbox adapteri avvaldan mavjud. Telegramga real yetkazish va tashqi S3 storage bu ishda tekshirilmadi.

Haqiqiy portret va ruxsatli sertifikatlar kiritilgach, NAMUNA natijalar olib tashlanib, haqiqiylari teacher CMS orqali nashr qilinadi. Ommaga deployment amalga oshirilmadi.
