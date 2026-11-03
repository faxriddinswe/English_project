# Loyihani o‘rganish va lokal ishga tushirish — 2026-11-03

Sana/vaqt: 2026-11-03, 09:21 (Asia/Tashkent).

## Talab va bajarish tartibi

Foydalanuvchi: «loyihani o‘rganib chiq va run qil». Avval hujjatlar, mavjud kod va startup skriptlari o‘rganildi; keyin mavjud PostgreSQL klasteri, FastAPI, Next.js va Telegram outbox worker ishga tushirildi, real HTTP va tegishli testlar tekshirildi.

## O‘rganilgan tuzilma

- Frontend: o‘rnatilgan Next.js 16.4.3, React, TypeScript, App Router. Ochiq sahifalar, `/login`, teacher/student kabinetlari va PWA mavjud.
- Backend: FastAPI, SQLAlchemy, Alembic; auth, CMS/natijalar, murojaatlar, o‘quvchilar va ularni tasdiqlash, guruhlar, dars/davomat, moliya, ta’lim materiallari, media va hisobot routerlari `backend/app/main.py` orqali ulangan.
- Ma’lumotlar: mavjud `.local/postgres` klasteri. `alembic current` natijasi: `0002_certificate_student (head)`; bu vazifada migratsiya qo‘llanmadi.
- Frontend `/api/` so‘rovlarini FastAPI’ga uzatadi. Telegram worker PostgreSQL outbox orqali ishlaydi.
- `.venv/bin/python` ishlaydi (Python 3.14.4), Node v22.22.1. Paketlarni qayta o‘rnatish talab qilinmadi.

## Runtime va kuzatilgan to‘siqlar

| Xizmat | Joriy holat |
| --- | --- |
| Next.js | Joriy koddan muvaffaqiyatli build, `http://127.0.0.1:3000` da ishga tushgan |
| FastAPI | `http://127.0.0.1:8000`, live va ready HTTP 200 |
| PostgreSQL | Mavjud klaster loopback 55432 da ishga tushgan |
| Telegram outbox worker | Jarayon ishlamoqda, heartbeat yangilanadi; bu vazifada yangi test xabari yuborilmadi |

Oddiy cheklangan shell’dagi `curl` socket yaratishda `Operation not permitted`, `scripts/frontend run dev` esa `listen EPERM` bilan tugadi. Mavjud ruxsatli buyruqlar orqali backend, PostgreSQL va production build asosidagi lokal frontend muvaffaqiyatli ishga tushirildi; HTTP tekshiruvlar `scripts/backend` ichidagi Python HTTP klienti orqali bajarildi.

PostgreSQL birinchi urinishda `/tmp/sherzod-english-pg-1000` socket papkasi mavjud bo‘lmagani uchun to‘xtadi. Klasterga tegmasdan loyiha ichida `.local/postgres-socket` papkasi yaratilib, ruxsati `700` qilindi va server shu socket yo‘li bilan qayta ishga tushirildi. Dastlab backend `/health/ready` 503 qaytardi; PostgreSQL ishga tushganidan keyin 200 bo‘ldi.

Frontend builddan oldin eski build bilan qisqa tekshirildi, so‘ng shu jarayon to‘xtatilib, joriy kod qayta yig‘ildi va yangi server ishga tushirildi. Yangi server tayyor bo‘lishidan oldingi birinchi HTTP urinish ulanmadi; `Ready` xabaridan keyingi yakuniy tekshiruvlar to‘liq o‘tdi.

## Bajarilgan buyruqlar

Loyiha ildizidan; har bir uzoq ishlovchi xizmat alohida jarayonda:

```bash
mkdir -p .local/postgres-socket
chmod 700 .local/postgres-socket
/usr/lib/postgresql/15/bin/pg_ctl -D .local/postgres \
  -l .local/postgres-running.log \
  -o '-h 127.0.0.1 -p 55432 -k "/home/faxriddin/Projects/Sherzod English/.local/postgres-socket"' \
  -w start
scripts/backend -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log --no-proxy-headers
scripts/backend -m app.workers.telegram
npm run build --prefix frontend
npm run start --prefix frontend -- --hostname 127.0.0.1
scripts/backend -m alembic current
scripts/test-backend -q -m 'not postgres'
npm run test --prefix frontend
npm run typecheck --prefix frontend
```

Bu buyruqlar bajarilgan ishni qayd etadi; ishlab turgan xizmatlar ustiga yana ishga tushirish talab qilinmaydi. Mavjud `scripts/start-local.sh` o‘zgartirilmadi.

## Kuzatilgan tekshiruv natijalari

- Backend: **54 passed, 24 deselected**. `postgres` markeridagi alohida disposable baza talab qiladigan integratsiya testlari bu ishga tushirishda bajarilmadi; tanlangan suite vaqtinchalik test klasteridagi standalone schema testlarini ham o‘z ichiga oladi.
- Frontend: **11 test, 3 fayl o‘tdi**; TypeScript tekshiruvi va production build muvaffaqiyatli tugadi.
- Haqiqiy HTTP: `/health/live`, `/health/ready`, frontenddagi `/`, `/login`, `/about`, `/courses`, `/results`, `/faq`, `/contact`, `/privacy` va `/api/v1/public/site` — barchasi **200**.
- Sessiyasiz frontend proxy orqali `/api/v1/teacher/dashboard` — kutilgan **401**.
- Alembic current — **`0002_certificate_student (head)`**.
- Yangilangan 4 Markdown faylining lokal havolalari va code fence’lari tekshirildi. Eski statusdagi mavjud bo‘lmagan dashboard screenshot havolasi o‘rniga artifact topilmagani ochiq qayd etildi; yangi screenshot olingani da’vo qilinmaydi.

## Chegaralar va o‘zgarishlar

Ilova kodi, akkauntlar, parollar va biznes yozuvlari qo‘lda o‘zgartirilmadi; seed, reset yoki yangi schema migratsiyasi bajarilmadi. Runtime jarayonlari, frontend build chiqishlari, PostgreSQL log/socket fayllari va ushbu hujjatlar yangilandi. Worker odatdagi mavjud outbox navbatini qayta ishlashi mumkin.

Next.js `output: standalone` bilan `next start` ishlatilgani haqida ogohlantirdi; lokal HTTP tekshiruvlar o‘tdi. Mavjud Dockerfile alohida standalone `server.js` usulidan foydalanadi; Docker deployment bu vazifada tekshirilmadi. Brauzer E2E, autentifikatsiyalangan CRUD, haqiqiy Telegram yetkazilishi, production deploy, S3 va jismoniy qurilmalar qayta tekshirilmadi. Jarayonlar shu sessiyada ishlamoqda; OS restartidan keyingi avtomatik ishga tushish o‘rnatilmadi.
