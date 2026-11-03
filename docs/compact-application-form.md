# Compact application area — 2026-11-02

Requested: reduce the oversized desktop application area and remove the teacher picture from it.

Plan: replace the 1330 px/two-column modal with a compact single-form dialog; remove its image/promo panel and obsolete styles; reduce contact banner typography/spacing; retain API submission/validation and verify desktop/mobile bounds and scrolling/close accessibility.

Status: complete.

- Modal width reduced from up to 1330 px to at most 560 px. Removed the teacher portrait, decorative side panel and visualUrl prop entirely. The real teacher portraits in other sections remain attached to their existing CMS media.
- Small brand mark, 24–28 px heading, 15 px introduction, 44 px fields and 48 px submit button. Name/phone share one desktop row and stack on phone screens. Form-specific styles are scoped in a CSS module; obsolete oversized global rules were removed.
- Dialog is bounded to the viewport and scrolls internally, with a sticky 44 px close target. White dialog heading contrast was visually checked and explicitly corrected.
- Contact banner maximum width is now 1040 px with smaller heading, padding and CTA. The contact-page introduction is also smaller.
- Actual API submission handler, course selection, phone validation, privacy consent and retained input/error behavior are reused. No new backend or fake success path was added. Public SW cache version advanced to v3.

Verification:
- Production build, TypeScript and 5 frontend unit tests passed.
- Public Chrome regression suite: 13/13 passed, including three new compact-form checks. After the final heading contrast correction, those three targeted tests were rerun.
- New checks cover 1440/1920 desktop sizing and no image; 320/375/390/768/1024 screens plus a short 1440×600 viewport; close button after scrolling; correct IELTS selection, validation, aborted API request and preserved form values. No actual lead/test Telegram message was submitted.
- [Desktop](qa/compact-lead-1440.png), [mobile](qa/compact-lead-375x812.png), [short viewport](qa/compact-lead-1440x600.png).

Frontend restarted at localhost:3000. Backend/DB/Telegram worker are unchanged by this UI update.

