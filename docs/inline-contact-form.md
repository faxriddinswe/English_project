# Inline contact application — 2026-11-02

Requested: remove the duplicated contact-page launch button and application banner; show the application form directly in place.

Plan: reuse the existing validated lead form for modal and inline views; render one form on /contact; hide the repeated banner and modal there; preserve course/home modal entry points; verify validation, network errors and responsive layout.

Implemented:
- /contact now contains the compact application form directly beneath its h1. The opening button, repeated contact/application banner and hidden modal are omitted on this page.
- Shared LeadApplication renders inline or in the existing modal wrappers. Validation, API mutation, source attribution, course selection, field/error state and confirmed-success handling stay in one implementation. The inline page has no backdrop/close button or body scroll lock.
- Home/course/teacher entry points still use their existing modal behavior. The same CSS surface tokens style both views. Original modal reopening state is retained; inline fields remain editable after submission errors.
- Old contact launch-button spacing was removed, and public SW cache version advanced to v4.

Verification complete:
- Production build, TypeScript and 5 frontend unit tests passed.
- Chrome public regression suite 16/16 passed: immediate inline form visibility, no duplicate banner/launch button/dialog, validation and retained input under aborted API submission, phone/tablet/desktop sizing, existing modal course selection and close behavior, navigation, profile, results and public API checks.
- Responsive inline form screenshots captured at 320/375/390/768/1440/1920 px. No horizontal overflow, overlay or body scroll lock. Desktop/mobile screenshots were visually reviewed.
- [Desktop](qa/inline-contact-1440.png), [mobile](qa/inline-contact-375.png).
- The test viewport was explicitly set for desktop navbar interaction, and the grid CSS assertion was made retryable to wait for layout readiness.

Frontend restarted at localhost:3000. No application/Telegram test message was submitted. The backend/worker flow is reused unchanged.
