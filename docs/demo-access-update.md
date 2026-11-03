# Lokal demo kirish va o‘quvchilar soni — 2026-11-02

## Talab va bajarilish

Foydalanuvchi ta’lim olganlar sonini 5000+ dan 1000+ ga o‘zgartirish, mavjud teacher va demo studentga tanlangan login/parollarni berishni so‘radi. Bajarildi. Parol qiymatlari bu hisobotda yoki source fayllarda saqlanmaydi.

1. Mavjud akkauntlar/CMS tekshirildi; akkaunt yaratish yoki DB reseed bajarilmadi.
2. Bio `students_taught` va tegishli stat `value` draft/public snapshotlarida 1000+ qilindi. Boshqa draft/public maydonlar saqlandi. CMS formadagi misol va tegishli frontend E2E kutilmalari moslandi.
3. Bitta development tranzaksiyasida mavjud teacher loginiga `<private-teacher-login>`, mavjud demo student loginiga aynan `<private-student-login>` qo‘llandi. Login tizimi kichik harfga normalize qiladi; foydalanuvchi tanlagan `<private-teacher-login>` bilan kirish tekshirildi.
4. Parollar yashirin prompt orqali olinib Argon2id hashga almashtirildi. Ikki akkauntning eski sessiyalari bekor qilindi. Demo holat uchun `must_change_password=false`; haqiqiy yangi studentlarga mavjud vaqtinchalik parol oqimi o‘zgarmadi.
5. User/student ID va moliyaviy/a’zolik yozuvlari saqlandi. Auditga login yangilanishi va son tuzatishi yozildi; parol yoki hash auditga kiritilmadi.
6. E2E login yordamchisi `E2E_TEACHER_USERNAME` va `E2E_STUDENT_USERNAME`ni qabul qiladi; yangi bo‘sh seed uchun eski default nomlar fallback sifatida saqlandi. Production uchun hardcoded login/parol qo‘shilmadi.
7. Frontend qayta ishga tushirildi; public SW cache versiyasi v7.

## Tekshirish natijalari

- `scripts/frontend run build`: o‘tdi.
- `scripts/frontend run typecheck`: o‘tdi.
- `scripts/frontend run test`: 5 test o‘tdi.
- Chrome’da navigatsiya/statistika/profil regressiyalari: 5 test o‘tdi. [Natija](e2e-results.json).
- Haqiqiy brauzerda `<private-teacher-login>` va `<private-student-login>` tanlangan parollar bilan kirdi, tegishli kabinetga yo‘naltirildi. `/auth/me` va o‘z dashboardlari 200, boshqa rol dashboardi 403, logoutdan keyin `/auth/me` 401.
- Har ikki haqiqiy kabinet 375 va 1440 pxda gorizontal overflow bermadi.
- Public API, home va /about 1000+ ni ko‘rsatdi; eski 5000+ UI’da topilmadi. Qolgan public raqamlar 18+ yil / 500+ / 200+ bo‘lib saqlandi.
- DB: 2 user, 1 student, 2 membership, 2 invoice, 2 payment sonlari va mavjud user IDlari saqlandi. Resetdan oldingi faol sessiya qolmadi; ikkala parol Argon2id hashda.

[Secretsiz API/DB tekshiruv dalili](demo-access-verification.json). [Ustoz kabineti — mobil](qa/demo-access-teacher-375.png), [o‘quvchi kabineti — mobil](qa/demo-access-student-375.png).

## Davom ettirish va cheklovlar

Telefon raqami berilmadi. Uni aniqlash uchun savol yuborildi; mavjud kontakt o‘zgartirilmadi va raqam ixtiro qilinmadi. Ushbu sozlash mavjud lokal development bazasiga tegishli; yangi bo‘sh DB seed hamon README’dagi explicit usulda ishlatiladi. Productionga deploy, to‘liq backend regressiya yoki yangi moliyaviy mutationlar bu vazifada bajarilmadi.

E2E’da yangi loginlar bilan tekshirish uchun passwordlarni xavfsiz muhit orqali uzating; Markdown yoki source ichiga yozmang:

```bash
export E2E_TEACHER_USERNAME=YOUR_TEACHER_LOGIN
export E2E_STUDENT_USERNAME=YOUR_STUDENT_LOGIN
# E2E_TEACHER_PASSWORD va E2E_STUDENT_PASSWORD qiymatlarini alohida xavfsiz kiriting.
```

Bu hisobot oldingi 5000+ kontenti va eski demo username haqidagi tarixiy yozuvlarni joriy lokal holat bo‘yicha yangilaydi. Oldingi mobile auditdagi teacher demo login cheklovi yangi haqiqiy login tekshiruvi bilan bartaraf etildi.
