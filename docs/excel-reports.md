# Excel hisobotlarini yuklab olish

2026-11-03, 11:55 (Asia/Tashkent). Lokal implementatsiya va tekshiruv yakunlandi.

Talab: moliya, o‘quvchilar soni va boshqa ma’lumotlarni CSV o‘rniga chiroyli va to‘g‘ri Excel fayliga yuklab olish.

## Reja

Mavjud teacher-only hisobotlar, moliya agregatlari, o‘quvchi/guruh ro‘yxati va download tugmasi o‘rganildi. CSV endpoint/tugmalari XLSX bilan almashtirildi. Bitta umumiy workbook va bo‘limlar bo‘yicha eksport, readable ismlar/telefonlar, sanalar/summalar, frozen header/autofilter/total va native chart qo‘shildi. Asosiy DBga seed/reset yoki biznes yozuvi kerak emas.

## Implementatsiya

`reports/excel.py` serverdagi Python XLSX generator; XlsxWriter runtime dependency, openpyxl faqat mustaqil test reader. Skilldagi layout/format/readability mezonlari qo‘llanadi. Bu deploy qilinadigan FastAPI funksiyasi; private artifact SDK server dependency qilib ulanmaydi. Artifact SDK generated fixture workbookni import/render bilan ko‘rishga ishlatiladi.

Eksport teacher authorizationdan keyin alohida read-only REPEATABLE READ snapshotdan yig‘iladi. Barcha varaqlar shu snapshotga tegishli; sahifadagi pagination va eski 10 000 satr limitiga bog‘liq emas. Excel satr limitiga yaqinlashganda avtomatik keyingi varaqqa bo‘linadi. Telefon/ID/matn explicit string; formula/URL injection yo‘q. Oddiy summalar typed number, 15 significant digit Excel chegarasidan katta summalar aniq decimal text va tegishli izoh bilan saqlanadi. O‘chirilgan studentning eski moliyasi saqlanadi, hozirgi students ro‘yxatida u qayta ko‘rsatilmaydi.

Oylik moliya va umumiy moliya ko‘rsatkichlari tanlangan oy; qarz/credit/count hozirgi snapshot, batafsil ledgerlar barcha davrlar. UI bu chegarani bildiradi. Generic DB dump, parol/token yoki internal private note eksport qilinmaydi.

## Foydalanish

Ustozning Boshqaruv va Hisobotlar sahifalarida **Barcha hisobotlar (Excel)** bor. Hisobotlar’da oy tanlanadi, moliya/o‘quvchi/guruh/hisob/to‘lov/ariza/murojaat/davomat/baho alohida olinadi. Moliya sahifasida **Barcha moliya (Excel)**, o‘quvchi/guruh/murojaat/davomat/baho ro‘yxatlarida **Barcha yozuvlar (Excel)** bor. Bu tugmalar ro‘yxatning joriy sahifasini emas, barcha yozuvlarini oladi.

Umumiy workbook 13 varaqdan iborat: Umumiy, O‘quvchilar, Guruhlar, Yangi arizalar, Qarzdorlik, Hisoblar, To‘lovlar, Qaytarishlar, Taqsimotlar, Murojaatlar, Davomat, Baholar, Oylik moliya. Summary — o‘quvchi/guruh sonlari, tasdiq kutilayotgan arizalar, oylik tushum/qaytarish/sof tushum va hozirgi qarz/credit; 6 oylik native Excel chizig‘i ham bor. Ismlar va guruh/kurs nomlari ishlatiladi, hisob/to‘lovning asl raqamlari tracing uchun detail oxirida saqlanadi. Headerlar mahkamlangan, filter, zebra qatorlari, ustun kengliklari, formatlangan jami va satr soni bor. Jami qiymatlar eksport paytidagi barcha satrlar bo‘yicha snapshot; filtrga qarab qayta hisoblanadigan moliyaviy model emas.

`GET /api/v1/teacher/reports/export.xlsx?resource=all&month=2026-11-01` — teacher-only, haqiqiy OOXML ZIP, tegishli MIME/disposition va `no-store`. Eski `export.csv` yo‘q (404). DownloadButton MIME va ZIP signature tekshiradi, pending vaqtida disable, xato/retry/success bildirishnomalari bor.

## Kuzatilgan tekshiruv

- `scripts/backend ../.local/run-audit-tests.py -q --tb=short --junitxml=../docs/backend-test-results.xml` — **93 passed, 67.10s**, 0 failure/skip. Asosiy bazadan boshqa 55433-portdagi dedicated `sherzod_audit_test`. Finalga yaqin 6 focused test ham passed (10.34s); dastlabki umumiy run 92 passed (65.80s), keyin snapshot test qo‘shildi. Eski CSVga tegishli 6 parametrli test olib tashlandi va haqiqiy XLSX API/reader sinovlari bilan almashtirildi; sonlar avvalgi 94 test bilan bir xil suite tarkibi degani emas.
- Real API → openpyxl/ZIP qayta ochish: teacher401/student403, invalid query422, CSV404; 13 worksheet, chart, freeze/filter, typed date, literal phone; secret/private note yo‘qligi. 400000.01 tushum − 50000.01 refund = 350000.00 sof tushum, 200000.00 qarz va 50000.00 credit mos. Void receipt tushumga kirmaydi; o‘chirilgan studentning eski moliyasi yo‘qolmaydi.
- **10003 o‘quvchi** to‘liq yuklandi (eski 10000 limitdan ko‘p), varaqqa avtomatik bo‘linish kichik test chegarasida tekshirildi; 9999999999999999.99 summa aniq matn bo‘lib qoldi. Eksport vaqtida parallel yangi student qo‘shilganda summary/detail bir xil oldingi snapshotni ko‘rsatdi, keyingi ro‘yxat yangi yozuvni ko‘rdi. Oyning chegarasi va oldingi oy hisobotlari tekshirildi.
- `npm run test --prefix frontend` — **14 passed**. TypeScript, production build, Python F va pip check o‘tdi. Frontend lint: **0 error / 11 avvalgi native image warning**.
- `npm run e2e --prefix frontend -- excel-reports.spec.ts teacher-dashboard.spec.ts` — **10 passed, 26.5s**. 3 yangi download ssenariysi: tanlangan oy URL/filename, diskka saqlangan faylning real API fixture bilan byte tengligi, finance/student/group tugmalari va mobil sig‘ish, HTTP403/wrong MIME xatolari, qayta urinish va duplicate disable. Qolgan 7 dashboard/theme/resource regressiyasi ham o‘tdi. [JSON dalil](excel-e2e-results.json).
- Asosiy bazada faqat o‘qish orqali workbook xotirada yaratildi va o‘chirildi: student/group count ro‘yxatga, barcha student balanslari mavjud billing service’ga, oylik pul dashboardga teng. Owner workbook diskka saqlanmadi, sessiya/parol yaratilmagan/o‘zgartirilmagan. Real HTTP: reports sahifasi200, sessiyasiz XLSX401, CSV404. [PIIsiz dalil](excel-live-verification.json).
- Controlled NAMUNA fixture [Excel](../frontend/tests/fixtures/excel-report.xlsx) faqat tests/ ichida, public emas. `.local/excel-qa/preview.mjs` artifact SDK import/renderidan keyingi [summary](qa/excel-summary.png), [student](qa/excel-students.png) va [invoice](qa/excel-invoices.png) rasmlari ochib ko‘rildi; mobile [Hisobotlar](qa/excel-reports-375.png) ham ko‘rildi.

## Aniqlangan holatlar va chegaralar

Dastlab XLSX HTTP test `Cache-Control: private, no-store` kutgan; umumiy security middleware `no-store`ga o‘tkazishi tasdiqlandi, test to‘g‘ri no-cache talabiga moslashtirildi. Previewda count formatining ortiqcha nuqtasi tuzatildi. Artifact import previewi `+998…` literal telefonini ilmiy notationga o‘zgartirib ko‘rsatadi va chartni silliqlab chizadi; raw XLSX `inlineStr`/`@` bilan literal telefonni saqlashi, openpyxl mustaqil readeri va [actual-value browser preview](qa/excel-students-values.png) bilan qo‘shimcha tekshirildi. Renderning bu cheklovi production workbookni qayta yozish bilan yashirilmadi. Native Excel/LibreOffice ilovasida ochish fizik sinovi bajarilmadi; formula/phone/cell types va ZIP/OOXML tekshiruvi bajarildi.

Bu Excel eksporti; millionlab qatorlar bilan performance/load acceptance bajarilgani da’vo qilinmaydi. Satrlarda constant-memory va DB cursor ishlatiladi, yakuniy ZIP javobi hozir RAMga yig‘iladi. Juda katta summalar Excel numeric precision chegarasi sabab matn bo‘lib ko‘rsatiladi, avtomatik SUMga kirmasligi workbook ichida aytiladi. Uzun matnning to‘liq qiymati saqlanadi, qator balandligi cheklangan; Excel’da katakni ochib to‘liq ko‘rish mumkin. Owner brauzerida haqiqiy login/download, production deploy va native Excel/physical-device sinovi bajarilmadi. UI private testlari fixture; haqiqiy backend oqimlari disposable PostgreSQLda sinaldi.

Runtime: mavjud 0003 bazaga yangi migratsiya/seed/reset kerak emas; original hisoblar/akkauntlar va parollar saqlandi. XlsxWriter==3.3.1 runtime, openpyxl==3.1.5 va et-xmlfile==2.0.0 development/read verification uchun lock/configga qo‘shildi. Backend/frontend final kod bilan qayta ishga tushdi, worker saqlandi; Telegramga xabar yuborilmadi. Test bazasi olib tashlandi va faqat alohida test klasteri to‘xtatildi.

Manbalar: [XlsxWriter workbook options](https://xlsxwriter.readthedocs.io/workbook.html), [worksheet typed string/date APIs](https://xlsxwriter.readthedocs.io/worksheet.html), [memory modeli](https://xlsxwriter.readthedocs.io/working_with_memory.html). Hujjatlar skillining style/format qoidalari qo‘llandi; moliya backendining mavjud Decimal va [joriy entity qoidalari](entity-lifecycle-and-theme-update.md) saqlandi.
