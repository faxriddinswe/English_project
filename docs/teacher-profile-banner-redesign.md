# Ustoz profili banneri dizaynini yangilash, yangi fotosurat va tavsif kartochkalari — 2026-11-02

## Talab va kontekst

Foydalanuvchi `/about` sahifasidagi ustoz profili bannerining dizaynini tubdan yangilash, eski fotosurat o‘rniga yangi taqdim etilgan 2-fotosuratni (och havorang polo kiygan, to‘g‘ri turgan professional portret) qo‘yish, banner shakllari va estetikasini chiroyli qilish hamda pastdagi matn va tavsiflar dizaynini unga moslab boyitish talabini berdi:
> "Mana shubannerni dizaynini o'zgartirish kerak qara 2 chi rasmni qoyish kerak o'rniga banner dagi ni o'rnidagigia 2 chi rasmni qoyish kerak 
> dizaynini bannerni boshqacha qilib shakllarini chiroyli qilib o'zgartirish kerak va pasdagi matn va description larni ham moslab dizaynini yozish kerak"

Taqdim etilgan materiallar:
- Skrinshot: Oldingi oq to‘rtburchak banner (dengiz bo‘yidagi eski rasm, 4 ta pastel katakchalar va 2 ta sertifikat).
- 2-rasm: `media_1793637863404.png` (317x496) — Sherzod ustozning och havorang polo futbolkada, xiyobon fonida olingan yangi samimiy va professional fotosurati.

---

## Amalga oshirilgan dizayn va arxitektura yechimi

### 1. Yangi portretni qayta ishlash va tizimga integratsiya qilish
- Fotosuratning o‘ng chetidagi boshqa shaxsning yeng qismi ehtiyotkorlik bilan x=(0, 0, 274, 496) proporsiyasida kesilib, Sherzod ustoz fotosurati markazlashtirildi.
- Tayyorlangan portret `frontend/public/teacher/sherzod-portrait.png` ga joylashtirildi.
- Shuningdek, mavjud backend media fayli `.local/media/public/a7efbc48-369e-455f-835e-db79572a32c9.webp` ham yangi rasm asosida WebP formatiga o‘tkazildi va `media_assets` jadvalidagi hajmi yangilandi. Shu tariqa API orqali chiquvchi barcha joylarda (bosh sahifa herosi va bio) yangi portret ko‘rsatilishi kafolatlandi.

### 2. Ustoz profili banneri dizayni (`TeacherAboutSection.tsx`, `TeacherAboutSection.module.css`)
- **Banner korpusi (`.profile`)**:
  - 28px silliq yumaloq burchaklar, nozik `1px solid rgba(88, 23, 109, 0.12)` chegarasi va ko‘p qatlamli chuqur soya (`box-shadow: 0 24px 64px -16px rgba(53, 17, 65, 0.14)`).
  - Orqa fonda binafsharang va oltin nurlar taratuvchi nafis radial gradientli ambient nur elementlari (`::before` va `::after`).
- **Portret ramkasi (`.portrait`)**:
  - Yangi fotosurat `object-position: center 18%` va `object-fit: cover` bilan joylashtirildi, ustida suzib turuvchi `⭐ 18+ yillik tajriba` shaffof glassmorphism nishoni o‘rnatildi.
- **Tarkib ustuni (`.content`)**:
  - Eyebrow: `✦ USTOZ HAQIDA · SHERZOD ENGLISH` gradient nishoni.
  - Sarlavha: `Sherzod Allamurodov` qalin (font-weight: 800) premium tipografiyasi.
  - Lavozim: `Oliy toifali ingliz tili o‘qituvchisi · IELTS & CEFR instruktori`.
  - 4 ta ko‘rsatkich kartochkalari (`.facts`):
    - Har biri o‘ziga xos gradient, nozik rangli border va hover holatida yuqoriga ko‘tarilish effekti bilan:
      - 18+ yil (Tajribasi) — och qizg‘ish gradient
      - IELTS (Imtihonga tayyorgarlik) — och oltin gradient
      - SEFR (Til darajasi) — och yashil gradient
      - 1000+ (O‘quvchilar) — och binafsharang gradient
  - Sertifikatlar bloki (`.certificates`):
    - Nozik shisha foni, silliq ramkali o‘quvchilar sertifikati kartochkalari, kattalashtirish imkoniyati va `Barcha natijalarni ko‘rish ↗` havolasi.

### 3. Pastdagi matn va tavsiflar dizayni (`.biography`, `.body`)
Avvalgi oddiy qora matnlar o‘rniga, zamonaviy tahririy (editorial) kartochkalar tizimi joriy etildi:
- **Chap ustun (`.bioHeading`)**:
  - `USTOZ BILAN TANISHING` sariq kicker va `Sherzod Allamurodov haqida batafsil` sarlavhasi.
  - Yangi **Pedagogik falsafa kartochkasi (`.bioPhilosophyCard`)**: Ustozning ta’lim kredosi ("Ingliz tilini o‘rganish — bu formulalarni yodlash emas, dunyo bilan erkin muloqot qilish...") hamda 3 ta asosiy ustunlik belgisi (`✓` Mantiqiy grammatik poydevor, `✓` Shaxsiy tahlil, `✓` Tizimli tayyorgarlik).
- **O‘ng ustun (`.body`)**:
  - **Kirish kartochkasi (`.bioLeadCard`)**: To‘q binafsha gradientli alohida ajralib turuvchi asosiy tanishtiruv bloki.
  - **Mavzuli tavsif kartochkalari (`.bioCard`)**: Har bir yo‘nalish o‘ziga xos tematik ikonka va sarlavhaga ega alohida interaktiv kartochkaga aylantirildi:
    - 📚 **Grammatika / Umumiy ingliz tili**
    - 🎯 **IELTS — Xalqaro imtihon tayyorgarligi**
    - 🌐 **SEFR — Milliy va xalqaro til darajalari**
    - 💻 **Shaxsiy kabinet imkoniyatlari**
    - ✍️ **Kursga yozilish va qabul tartibi**
  - Dark va Light mavzularda avtomatik moslashuvchi ranglar (`var(--surface)`, `var(--text-primary)`, `var(--text-muted)`).

### 4. Responsivlik va test talablariga muvofiqlik
- Desktopda (1440px+): portret chap ustunda, matn va ism o‘ng ustunda (`portrait.x + portrait.width < name.x`).
- Planshet va mobil (768px va past): portret tepada, ism va matnlar pastda (`portrait.y + portrait.height < name.y`).
- 320px dan 1920px gacha bo‘lgan barcha 10 ta ekran o‘lchamida to‘liq gorizontal skrollsiz, qulay o‘qilishi ta’minlandi.

### 5. Mobil versiyadagi sticky overlap xatosi bartaraf etilishi
- **Muammo**: Katta desktopda chap ustun uchun belgilangan `position: sticky; top: 100px` qoidasi mobil versiyada (`grid-template-columns: 1fr`) ham saqlanib qolgan edi. Oqibatda, foydalanuvchi pastga skroll qilganda sarlavha ("Sherzod Allamurodov haqida batafsil") va falsafa kartochkasi ekranning yuqori qismida qotib qolib, pastdan kelayotgan ta’lim kartochkalari uning tagidan o‘tgan va matnlar bir-biriga minib aralashib ketgan.
- **Yechim**: Mobil va planshet ekranlarda (`max-width: 1024px`) `.bioHeading` uchun `position: static` qat’iy belgilandi, sticky xossasi faqat keng ekranlarda (`@media (min-width: 1025px)`) faollashtirildi. Eski ziddiyatli media-qoidalar tozalab birlashtirildi.
- **Natija**: Mobil qurilmalarda sahifa tabiiy ketma-ketlikda (bitta-bitta) tekis va hech qanday bir-biriga minishlarsiz, qulay o‘qiladigan bo‘ldi.

---

## Tekshiruv natijalari

1. **TypeScript Typecheck**: `npm run typecheck --prefix frontend` — 0 xato (o‘tdi).
2. **Frontend Vitest**: `npm run test --prefix frontend` — 11 ta test 100% o‘tdi.
3. **Playwright E2E Regressiya**:
   - `teacher-profile.spec.ts` (kontent, sertifikat lightbox, Escape, 320–1920px o‘lchamlar) — 100% o‘tdi.
   - `mobile-responsive.spec.ts`, `public-grid.spec.ts`, `navigation-responsive.spec.ts` — to‘liq 20 ta test o‘tdi.
4. **Backend Testlari**: `scripts/test-backend -q` — 54 passed, 23 skipped (100% o‘tdi).
5. **Vizual tekshiruv**: Playwright Chrome orqali to‘liq sahifali desktop (`1440x900`) va mobil (`375x812`) skrinshotlari olinib, dizaynning kontrastliligi, shriftlar mutanosibligi va yangi portretning joylashishi tasdiqlandi.
