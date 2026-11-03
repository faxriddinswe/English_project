# Teacher profile reference update — 2026-11-01

Reference: Screenshots/ustoz_haqida.png (the user called the source folder certificates; the matching file is in Screenshots). Target: /about. Keep the home-page teacher preview short.

Plan:
1. Reuse the public CMS bio/portrait, authenticated publishing and certificate lightbox. Build the reference composition as real HTML: large portrait left; teacher name, four pastel information cards and certificate previews right.
2. Use owner-provided Sherzod Allamurodov identity. Do not copy Jurabek Aliboev, 9.0, CELTA, experience/student counts or a fake video button from the screenshot. Teacher certificates take priority if supplied; otherwise any student certificates must be explicitly labeled as student documents.
3. Expand the published bio below the profile with only known course/portal information; retain the portrait, video/certificate selections and other drafts.
4. Build/typecheck and Chrome QA for desktop/mobile, certificate preview/Escape, course/enrollment links and one-h1/no-overflow.

Status: complete for the requested local update.

Implemented:
- /about now uses the reference two-column white profile panel: real teacher portrait left, Sherzod Allamurodov name and four pastel information tiles right, with two accessible certificate previews. The reference screenshot is not used as a background.
- Information tiles use the actual published course count plus IELTS/SEFR preparation and portal functionality. No IELTS band, CELTA qualification, years of experience or number of students was invented.
- Existing bio.certificate_ids supports the teacher’s own documents. With none supplied, previews are explicitly labeled as student certificates and include student names, keeping their ownership clear. No reference teacher identity/media or nonfunctional video control was copied.
- Six paragraphs (1,736 characters) were saved to the existing published CMS bio. They describe known grammar/IELTS/CEFR offerings, the student portal and enrollment process, rather than inventing a career history. Existing portrait, personal certificate/video selections and other fields were preserved. The home-page excerpt remains brief and links to /about.
- The detailed article, course direction cards and working enrollment/course links appear below the profile.

Observed verification:
- Production build/TypeScript passed; 5 frontend unit tests passed.
- 7 Chrome E2E tests passed: new profile identity/content/ownership, certificate preview and zoom/Escape, actual application modal, profile at 320/375/768/1440/1920 px with no horizontal overflow, plus the existing public-grid/filter/navigation/home-preview/failure journeys.
- At desktop widths portrait is left of the information; at mobile/tablet widths it stacks above. All five screenshot sizes were captured and the desktop/mobile results visually reviewed against the supplied reference.
- Screenshots: [desktop](qa/teacher-profile-1440.png), [mobile](qa/teacher-profile-375.png).
- Frontend restarted at localhost:3000. No Telegram test notification was sent during this update.

