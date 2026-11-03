# O‘quvchilarni mustaqil ro‘yxatdan o‘tkazish va ustoz tasdiqlash tizimi — 2026-11-03

> Yangilangan qaror — 2026-11-03: ustoz vaqtinchalik parol bermaydi. `User.registration_pending` (0004) yangi yoki oldindan kiritilgan login akkauntisiz profilga kirishni tasdiqlashni ajratadi. Eski profilning guruh/moliya holati signup vaqtida o‘zgarmaydi. [Joriy hisobot](courses-and-workspace-redesign.md).

> 2026-11-03 dagi keyingi qaror: pending/approved/rejected endi `Student.admission_status`da saqlanadi; eski paused/active profil belgisi ishlatilmaydi. [Joriy backend qoidalari va migratsiya](entity-lifecycle-and-theme-update.md). Quyidagi dastlabki implementatsiya tafsilotlari tarixiy dalil.

## 1. Vazifa va talablar

Foydalanuvchi talabi bo‘yicha o‘quvchilar kabinetiga kirish va hisob ochish mexanizmi to‘liq yangilandi:
1. **Kabinetga kirish sahifasida ikkita tab ("Kirish" va "Ro‘yxatdan o‘tish")**:
   - O‘quvchi o‘z ismi va familiyasini, telefon raqamini, kelgusida kirish uchun o‘zi ixtiyoriy parol o‘ylab topib kiritadi hamda qaysi kursga qo‘shilmoqchiligini tanlaydi va "Ro‘yxatdan o‘tish" tugmasini bosadi.
   - Arizasi qabul qilingach, ustoz tasdiqlaguniga qadar tizimga kirishga uringanda:
     > **"Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz."**
     xabari chiqib turadi.
2. **Ustoz panelida yangi "Yangi o‘quvchilar" bo‘limi (`/teacher/pending-students`)**:
   - Saytdan yangi ro‘yxatdan o‘tgan barcha o‘quvchilar arizalari (ismi, telefon raqami, tanlangan kursi, ro‘yxatdan o‘tgan sanasi) jadvalda ko‘rinadi.
   - Ustoz har bir o‘quvchini alohida "✓ Tasdiqlash" yoki "✕ Rad etish" imkoniga ega.
   - Ustoz barcha o‘quvchilarni bir vaqtning o‘zida bitta tugma bilan tasdiqlashi mumkin ("✓ Barchasini birdan tasdiqlash"), shunda barchasiga bir zumda kabinetga kirish ochiladi.
3. **Eski o‘quvchi qo‘shish formasi olib tashlanishi**:
   - `/teacher/students` sahifasidagi eski qo‘lda o‘quvchi qo‘shish tugmasi ("+ Yangi qo‘shish") olib tashlandi, uning o‘rniga "Yangi arizalarni ko‘rish →" havolasi qo‘yildi.
4. **Real vaqtda tez yangilanish**:
   - React Query keshini bir zumda yangilash (invalidation), har 8 soniyada avtomatik fonda sinxronlash va optimistik bildirishnomalar orqali barcha amallar tezkor ishlaydi.

---

## 2. Amalga oshirilgan o‘zgarishlar

### Backend
- **`backend/app/core/schemas.py`**:
  `RegisterIn` sxemasi qo‘shildi (`full_name`, `phone`, `password`, `course_id: UUID | None`). `Phone` va `Password` validatorlari orqali xavfsizlik va normalizatsiya ta’minlandi.
- **`backend/app/modules/auth/router.py`**:
  - `POST /api/v1/auth/register`: yangi o‘quvchini ro‘yxatdan o‘tkazadi; inaktiv `User` (`active=False`), pauzadagi `Student` (`status="paused"`) va `Lead` (`source="cabinet_signup"`) yaratadi. Ustozga Telegram bildirishnoma outbox yozuvi yaratiladi.
  - `POST /api/v1/auth/login`: telefon raqami (har qanday formatda: `+998...`, `998...`, 9 xonali) yoki login orqali kirishni qo‘llab-quvvatlaydi. Parol to‘g‘ri bo‘lib, o‘quvchi hisobi hali tasdiqlanmagan bo‘lsa, HTTP 403 `pending_approval` kodi va `"Arizangiz ko‘rib chiqilmoqda. Ustoz tasdiqlaganidan keyin kabinetingizga kira olasiz."` xabarini qaytaradi.
- **`backend/app/modules/students/pending.py`**:
  - `GET /api/v1/teacher/pending-students`: kutilayotgan barcha o‘quvchilar ro‘yxatini kurs nomi va yaratilgan vaqti bilan qaytaradi.
  - `POST /api/v1/teacher/pending-students/{student_id}/approve`: o‘quvchi profilini faollashtiradi (`Student.status = "active"`), foydalanuvchi hisobini yoqadi (`User.active = True`), murojaatni konvertatsiya qiladi (`Lead.status = "converted"`).
  - `POST /api/v1/teacher/pending-students/{student_id}/reject`: arizani rad etadi (`Student.status = "archived"`, `User.active = False`, sessiyalarni bekor qiladi).
  - `POST /api/v1/teacher/pending-students/approve-all`: barcha kutilayotgan arizalarni bitta tranzaksiyada ommaviy tasdiqlaydi.
- **`backend/app/modules/reports/router.py`**:
  Ko‘rsatkichlar (metrics) va boshqaruv paneliga `pending_students` soni hamda "E’tibor talab qiladi" ro‘yxatiga arizalar havolasi qo‘shildi.
- **`backend/app/main.py`**:
  `pending_students` routeri `/api/v1` prefiksi bilan ro‘yxatdan o‘tkazildi.

### Frontend
- **`frontend/src/features/auth/LoginForm.tsx`**:
  - "Kirish" va "Ro‘yxatdan o‘tish" tablari yaratildi.
  - Ro‘yxatdan o‘tish formasida to‘liq ism, telefon raqami, o‘zi o‘ylab topgan parol (ko‘rish/yashirish imkoni bilan) va kurs tanlash menyusi mavjud.
  - Ariza topshirilgach, yashil tasdiq xabari va "Kirish bo‘limiga o‘tish" tugmasi chiqadi.
  - Kirish tabida agar o‘quvchi hali tasdiqlanmagan bo‘lsa, ko‘zga tashlanadigan qahrabo (amber) rangli `"Arizangiz ko‘rib chiqilmoqda"` kartochkasi ko‘rsatiladi.
- **`frontend/src/features/workspace/PendingStudentsView.tsx`**:
  - Ustoz uchun barcha yangi arizalar jadvali: ism, telefon havolasi, kurs nishoni, sana/vaqt, "✓ Tasdiqlash" va "✕ Rad etish" tugmalari.
  - "✓ Barchasini birdan tasdiqlash" tugmasi va dialog oynasi.
- **`frontend/src/features/workspace/Workspace.tsx`**:
  - `teacherNav` navigatsiyasiga "Yangi o‘quvchilar" bo‘limi qo‘shildi.
  - Dashboard ko‘rsatkichlar tarmog‘iga "Yangi arizalar" kartochkasi kiritildi.
- **`frontend/src/features/workspace/ResourceView.tsx`**:
  - O‘quvchilar (`students`) ro‘yxatidan eski qo‘lda o‘quvchi qo‘shish tugmasi olib tashlandi, uning o‘rniga "Yangi arizalarni ko‘rish →" havolasi qo‘yildi.
- **`frontend/src/app/globals.css`**:
  - Segmentlangan tablar (`.auth-tabs`, `.auth-tab-btn`), qahrabo arizani kutish bloki (`.pending-notice-box`), muvaffaqiyat kartochkasi (`.auth-success-card`), ommaviy tasdiqlash tugmasi (`.bulk-approve-btn`), tasdiqlash/rad etish tugmalari uchun zamonaviy dizayn uslublari kiritildi.

---

## 3. Haqiqiy tekshiruv dalillari va sinov natijalari

1. **Backend testlari**:
   - `scripts/backend -m pytest -q` buyrug‘i bajarildi: **54 passed, 24 skipped** (2.69s).
   - `backend/tests/test_http_security.py` va `backend/tests/test_postgres_api.py` yangi marshrutlar va oqimlar bilan kengaytirildi.
2. **Frontend unit testlari**:
   - `npm run test --prefix frontend` (Vitest): **11 passed in 3 test files** (0.44s).
3. **Frontend TypeScript tekshiruvi**:
   - `npm run typecheck --prefix frontend` (`tsc --noEmit`): **0 xatolik**.
4. **Playwright E2E brauzer testlari**:
   - `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/student-registration.spec.ts tests/e2e/inline-contact.spec.ts tests/e2e/compact-lead.spec.ts`: **4 passed** (8.0s).
   - O‘quvchi ro‘yxatdan o‘tishi, muvaffaqiyat xabari, kutish bildirishnomasi, ustoz jadvali, o‘quvchi qo‘shish tugmasi yo‘qligi, yakka va ommaviy tasdiqlash amallari to‘liq brauzerda sinovdan o‘tdi.
5. **Tayyorlangan QA skrinshotlari**:
   - [Kirish tabi](qa/cabinet-login-tab.png)
   - [Ro‘yxatdan o‘tish tabi](qa/cabinet-register-tab.png)
   - [Ariza qabul qilinganligi holati](qa/cabinet-register-success.png)
   - [Kutish davridagi kirish xabarnomasi](qa/cabinet-login-pending-notice.png)
   - [Ustoz o‘quvchilar jadvali ("+ Yangi qo‘shish" olib tashlangan)](qa/teacher-students-no-add-btn.png)
   - [Ustoz "Yangi o‘quvchilar" arizalar bo‘limi](qa/teacher-pending-students.png)
   - [Ommaviy tasdiqlash dialogi](qa/teacher-bulk-approve-dialog.png)
