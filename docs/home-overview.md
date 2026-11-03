# Bosh sahifa qisqa bo‘limlari — 2026-11-01

Maqsad: bosh sahifada har bo‘limdan ixcham ma’lumot va to‘liq sahifaga o‘tish havolasini ko‘rsatish.

Bajarildi:
- Ustoz haqida: haqiqiy portret, Sherzod Allamurodov ismi, CMS bio matnidan qisqa tavsif; /about uchun «Batafsil».
- Markaz haqida: CMS afzalliklaridan dastlabki ikki karta; /center uchun «Batafsil».
- Natijalar: 2 IELTS va 2 SEFR kartasi; mavjud sertifikat lightbox, ball/daraja va NAMUNA belgilari; /results uchun «Barcha natijalar».
- Kurslar: mavjud CourseSection ixcham rejimi, dastlabki uch kurs, qisqa izoh va ikki mavzu; /courses uchun «Barcha kurslar», individual kurs tafsiloti va haqiqiy ariza modaliga yozilish.
- FAQ: dastlabki uch savol, ishlaydigan accordion; /faq uchun «Barcha savollar».
- Bog‘lanish: mavjud banner va ariza tugmasi yonida /contact havolasi.

Alohida sahifalarning to‘liq variantlari saqlanadi: /results 60 karta va 30/30 filtr; /courses to‘liq kurslar; boshqa sahifalar o‘z kontentini ko‘rsatadi. Eski bo‘sh havola kartalari olib tashlandi. Course/Results/FAQ komponentlariga preview rejimi qo‘shildi; API va ma’lumotlar takroriy yaratilmagan. Matnlar backenddan keladi; uzun bio va izohlar previewda cheklanadi. 320–1920 px ko‘rinishda bo‘lim havolalari sarlavha yonida yoki mobil ekranlarda ostida joylashadi.

Tekshiruvlar:
- Frontend production build va TypeScript o‘tdi; Vitest 5/5.
- Chrome E2E 5/5: previewdan oltita to‘liq bo‘limga o‘tish, FAQ ochish, homepage kursidan to‘g‘ri ariza tanlash, modal/theme, tarmoq xatosida soxta success yo‘qligi, to‘liq natijalardagi 60/30/30 filtr va navigatsiya.
- Qo‘shimcha 320, 375, 768, 1440, 1920 px tekshiruv: 6 preview, 4 sertifikat, 3 kurs, 3 FAQ; horizontal overflow yo‘q.
- [Desktop screenshot](qa/home-overview-1440.png), [mobile screenshot](qa/home-overview-375.png).

Frontend yangilangan build bilan localhost:3000 da qayta ishga tushirildi. Bu ishda Telegramga test xabari yuborilmadi.
