# Mobile responsive refinement — 2026-11-02

## Implemented

The existing public site and workspaces were refined; routes, CMS content, authentication and business API flows were retained.

- Hero photo now has a separate circular art frame. On phones/tablets its caption sits below the image, so the full teacher name no longer overlaps the portrait. Mobile heading wraps naturally. Home teacher preview and /about portrait use bounded, fluid dimensions; certificate previews stack on very narrow screens.
- Teacher/student workspaces have an accessible mobile menu through the existing dialog primitive up to 900 px. Desktop sidebar remains available. Escape, close, route selection, resize to desktop, scroll locking and focus restoration are handled.
- Topbar actions wrap safely for long usernames. Search/filter controls, schedule rows, attendance selectors, action groups, authentication forms and generic dialogs adapt to narrow and short viewports. Mobile inputs use 16 px text; main touch controls have at least 44 px targets. Device insets are included in header, footer, dialogs and workspace spacing.
- Tables scroll inside their own region, with an overflow hint, keyboard focus and sufficient column/action width. “Ochish” stays on one line. The document itself does not scroll horizontally. Removed the body's general horizontal overflow hiding so page-width checks expose actual layout problems.
- PWA install/update notice uses a compact grid with a flexible title and 44 px actions. Its measured height reserves space below document content, including the bottom device inset. It yields to menus, dialogs, focused form fields and a detected keyboard; contact/auth/private routes suppress the optional notice. Install dismissal lasts seven days; installed/standalone state suppresses further offers. Pending actions and native prompt failures are explicit. A real browser install event is required, and update activation requires an explicit click. Public SW cache version: v6; private/API cache exclusions retained.
- Shared dialogs now restore focus to their opener even when opened without a Radix Trigger.

## Completed plan

1. Existing layout/PWA audit: complete.
2. Photo, touch, inset, form, table and navigation corrections: complete.
3. Optional install/update notice correction: complete.
4. Build, responsive/interaction checks and screenshot review: results below.

## Verification

- Production build and strict typecheck passed.
- Existing frontend unit suite: 5 passed.
- Chrome regression suite: **26 passed**, including **12 new responsive/PWA/touch/private-layout journeys**. [Saved full result](mobile-responsive-regression.json).
- After the final table-width correction, the two private layout journeys and narrow schedule form were rerun: **3 passed**; see [latest Playwright result](e2e-results.json).
- Hero/menu/modal checks at 320×568, 360×740, 375×812, 390×844, 412×915, 768×1024, 1024×768, 1440×900, 1920×1080 and landscape 844×390.
- Nine public routes checked at five viewport sizes (45 route/size combinations), plus existing navigation, profile, course-prefill, certificate-filter/zoom, modal, API-proxy and failure-retention regressions.
- Real student login/API audit checked eight student routes at 320/768/1440 px: **24 checks**, zero document overflow or API error states. Audit session logged out; no business records or passwords were changed. [Read-only audit result](mobile-live-audit.json).
- Both private roles also use explicit layout fixtures for long names, large balances, scrollable tables and forms. No successful backend write is simulated as part of an application flow.
- Screenshot inspection identified a vertically broken table action label after the first automated pass; minimum table/action widths corrected it and focused checks were repeated.

Commands:

```bash
scripts/frontend run build
scripts/frontend run typecheck
scripts/frontend run test
cd frontend
PLAYWRIGHT_CHANNEL=chrome npm run e2e -- tests/e2e/mobile-responsive.spec.ts tests/e2e/compact-lead.spec.ts tests/e2e/inline-contact.spec.ts tests/e2e/navigation-responsive.spec.ts tests/e2e/teacher-profile.spec.ts tests/e2e/public-grid.spec.ts
# Focused rerun after final table styles:
PLAYWRIGHT_CHANNEL=chrome npm run e2e -- tests/e2e/mobile-responsive.spec.ts --grep 'workspace navigation|schedule form'
```

## Visual evidence

- [Mobile home](qa/mobile-home-375x812.png), [desktop home](qa/mobile-home-1440x900.png)
- [Mobile teacher profile](qa/mobile-about-375x812.png)
- [Install notice](qa/mobile-install-375.png)
- [Teacher layout fixture, 320 px](qa/mobile-teacher-320x568.png)
- [Real student dashboard, 320 px](qa/live-student-dashboard-320.png)

## Limits

Testing used desktop Chrome with viewport changes and a separate mobile/touch browser context. Physical iOS/Android devices, Safari/WebKit, real on-screen keyboards and native app installation were not tested. Install and waiting-worker events were controlled UI fixtures; no native installation success is claimed. The existing teacher demo credentials did not authenticate during the read-only audit, so teacher layout was verified with fixtures; its password/account was left untouched. Backend business logic did not change and its full database mutation/concurrency suite was not rerun for these layout changes.

PWA behavior follows [web.dev installation guidance](https://web.dev/learn/pwa/installation-prompt); inset handling uses [CSS environment variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env).

Frontend is running locally at http://localhost:3000. Production deployment was not performed.
