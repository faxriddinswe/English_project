# Navigation, confirmed statistics and responsive profile — 2026-11-02

Plan: reproduce wrong-destination behavior; correct route scroll/same-page navigation; shrink the desktop teacher panel; save owner-confirmed facts and public statistics through CMS; run actual link/viewport/API and database checks.

Before fix: link hrefs matched their intended routes, but scroll restoration/smooth scrolling left /results with its h1 above the viewport. Clicking the active /about navbar link from the footer retained scrollY=2291. The desktop profile was 1238×983 at 1440 px. Next.js's installed disable-smooth-scroll implementation explicitly requires data-scroll-behavior="smooth" to suppress CSS smooth scrolling during page transitions; this attribute was missing.

Owner-provided numbers: experience 18+ years; 5000+ students taught; 500+ certificate recipients; 200+ DTM entrants. These are content supplied by the owner, separate from the 60 marked preview certificate cards.

Status: complete for the requested local update.

## Changes

- Declared smooth scrolling correctly for the installed Next.js router via the HTML data attribute. PublicLink handles active/same-page links explicitly, preserves modifier/new-tab behavior, returns to the page top, and focuses the actual heading. Applied to navbar, preview/detail, course, result filter, privacy and contact page links. Hash/skip links remain normal anchors. Course-detail content now starts with its actual h1 before the enrollment card.
- At 1440 px, teacher panel changed from 1238×983 to 1100×670.875. At 1920 px the width stays 1100 and height is 675.90625. Portrait, information tiles and certificate thumbnails were reduced; phone/tablet stacks and internal scrolling remain natural.
- Added teacher-editable CMS fields experience and students_taught, published the owner-provided 18+ yil / 5000+ values, and replaced sample-count marketing statistics with 18+ yil, 5000+, 500+, 200+. Preview certificate cards still retain their honest NAMUNA labeling.
- Publishing invalid CMS values now returns 422 (invalid_content), preserves the previous public snapshot, and does not become a 500 response.
- Bumped the public service-worker cache version; private APIs/cabinet data remain network-only.

## Observed checks

- TypeScript/typecheck and production build passed. Frontend unit tests: 5/5.
- Backend: 63/63 tests passed using a new dedicated disposable PostgreSQL database. New coverage verifies teacher-only fact editing, committed public values and failed publication preserving the prior public snapshot. Existing auth/CSRF/IDOR, finance/concurrency, teaching/attendance, lead/outbox, media and publication checks were included. Test Telegram credentials were blank and the test database was removed afterward.
- Chrome E2E: 10/10. Checks include every homepage section link, every navbar item from the footer (including the active page), course detail heading placement, results filters, owner statistics, compact profile, mobile drawer, light mode, existing certificate/enrollment/form-error journeys.
- Public API proxy matrix passed: site, all three course details, FAQs, 60/30/30 results; unknown course 404, invalid result filters/page sizes 422; guest auth/teacher/student protected endpoints 401.
- Responsive audit: 12 routes × 7 widths = 84 combinations (320, 375, 390, 768, 1024, 1440, 1920). All returned 200, had one h1 and no horizontal page overflow; no browser runtime errors. [Measurement report](responsive-navigation-results.json).
- Screenshots: [compact desktop profile](qa/compact-teacher-1440.png), [mobile profile](qa/compact-teacher-375.png), [confirmed homepage figures](qa/confirmed-statistics-1440.png).

Frontend/backend restarted locally with the update. Existing Telegram worker was retained; these checks did not send a test notification. Refresh the page to load the new client build; the PWA can also show its update notification.

