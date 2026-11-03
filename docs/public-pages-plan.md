# Public pages and supplied certificates — 2026-11-01

Requested: separate public pages, navigation to those routes, 30 IELTS + 30 CEFR cards using five supplied certificate photos, 4 desktop columns and 3:4 image frames, functioning type filters and certificate preview.

Implementation sequence:
1. Reuse the current public shell, components and API; split navbar sections into /about, /center, /courses, /results, /faq and /contact.
2. Add an explicit, repeatable development import: preserve originals privately, redact document IDs/birthdates/QRs for public images, read supplied scores accurately, replace previous marked fixtures with 60 marked sample cards (not 60 distinct students).
3. Keep bounded API pagination (max 60), SSR route filters, totals and active navigation. Preserve existing application/Telegram flow and teacher/student workspaces.
4. Run build/typecheck, targeted PostgreSQL import/filter/privacy checks, and desktop/mobile Chrome journeys. Save observed results here; no public deployment.

Status: complete for the requested local update.

## Implemented

- Reused PublicSite, SiteHeader, ResultsSection, CourseSection and existing CMS/media/API. Navbar has active page state; home now has hero/statistics and links to separate sections. Hero course action goes to /courses. Each page has one h1 and sitemap entries.
- /results uses bounded SSR API pagination with page_size=60 (allowed sizes 20/50/60). All filter shows 60 cards; IELTS and SEFR each show 30. Names/dates/IELTS subscores and CEFR scores are read from the five supplied sources, not generated. The certificate frames retain the full image at a 3:4 aspect ratio; desktop grid has four columns, tablet two, phone one. Existing accessible lightbox is reused.
- Explicit development import updates the existing 40 sample IDs and adds only 20 more. Repeated imports reuse media by digest and do not duplicate content. Private originals remain teacher-only; public prepared WebP copies mask candidate/reference/document numbers, DOB and QR/report identifiers. All five prepared images were visually inspected. Source files remain unchanged.
- Repeated cards retain NAMUNA and no fabricated consent. Production APIs exclude sample results. Real consented results still use the existing teacher publishing workflow.

```bash
scripts/backend -m app.modules.content.certificates
```

Requires development APP_ENV, an existing teacher, and the supplied files IELTS_1.jpg, IELTS_2.jpg, IELTS_3.jpg, SEFR.jpg and Sertifikat_english.jpg in Screenshots. The initial public preview command remains available for empty development environments. Import does not alter accounts, Telegram settings or financial/teaching records.

## Observed verification

- Next.js production build and TypeScript passed; Vitest 5/5 passed.
- 62 backend tests passed, including real API/transaction tests on a newly migrated, dedicated disposable PostgreSQL database. New coverage checks 60/30/30, repeated import IDs/media, private-original 401/404, opaque image masks, correct scores, page-size limit, and production sample exclusion. Test Telegram env values were blank; no test-suite messages went to the real group. The database was dropped afterward.
- Chrome Playwright 4/4: layout/theme/modal, aborted form has no fake success, supplied certificate images and filters, independent page navigation, active navbar, course selection and mobile drawer.
- Extra Chrome QA: /results at 320/375/768/1440/1920 px, exactly 60 cards and 1/1/2/4/4 columns, 3:4 images and no horizontal overflow. All other new pages at 375 and 1440 px had one h1 and no overflow; /courses/ielts also had one h1. No page runtime errors observed.
- Screenshots: [results desktop](qa/results-page-1440.png), [results mobile](qa/results-page-375.png), [teacher](qa/about-page-1440.png); further page/viewport screenshots are in qa.
- Frontend and FastAPI were restarted locally at ports 3000 and 8000. Existing worker and configured Telegram integration remain in place. No public hosting/deployment was created.

