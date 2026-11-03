# Architecture decisions

## Boundaries
Modular monolith: Next.js renders public HTML and private workspace UI; FastAPI owns all writes, permissions and business rules. SQLAlchemy uses synchronous sessions in synchronous endpoints. No SQLite fallback, hosted backend replacement, public signup or browser business store. PostgreSQL has 27 relational tables. Versioned `Content` envelopes cover FAQ, site settings, public results, testimonials and gallery rather than duplicating structurally identical publication tables.

The existing 23 frontend files were inspected and integrated. Brand/layout, hero, stats, results, courses and hooks were retained; the broken bento grid was corrected. Font assets are local Liberation Sans with their license; this is an approximation, not a claim to identify the reference font.

## Transactions and authorization
All DB dependencies use FastAPI function scope: transaction commit completes before returning the response. Student records and login users are distinct. All teacher endpoints require teacher role. Student endpoints derive profile ID from the session, whitelist editable contact fields, and scope assignment/media access to membership/ownership. Unrelated assignment/private file IDs return 404. Public endpoints have explicit response DTOs and never return private notes, owner metadata or auth fields.

Opaque random session tokens are stored only as keyed hashes. Argon2id hashes passwords. Cookies are HttpOnly, SameSite Lax and Secure in production. Every state-changing request, including login and public leads, requires both an exact configured Origin and a signed double-submit CSRF cookie/header. CSRF is not the auth token. Logout revokes the session; password changes revoke other sessions. Since 2026-11-03, teacher password assignment/reset is removed. Students choose their own registration passwords and teacher approval opens access. Existing legacy accounts already marked for a password change retain that security requirement; no new temporary password is issued.

At the owner's request, account passwords have no composition rule, minimum beyond nonempty, or application-specific maximum length. Passwords preserve whitespace exactly, including self registration and personal password changes. This applies to login, self registration/change, bootstrap and explicit dev seed. Normal overall request-body limits still apply.

DB-backed rate limit counters store keyed fingerprints, not raw phones/IPs. Forwarded client identity is ignored unless the direct peer is explicitly trusted. Reverse proxy must overwrite `X-Real-IP`; arbitrary X-Forwarded-For is never trusted.

## Membership, lessons and attendance
Membership intervals are **[start_date, end_date)** in Asia/Tashkent dates. Quick enrollment may omit `start_date`: the server uses the later of its current Asia/Tashkent date and the group start. For a bounded group, the default exclusive end is the day after the group end. Explicit dates remain supported for historical/API workflows; UI enrollment no longer asks for a date. An end on 10 November means the student was last enrolled on 9 November. PostgreSQL GiST exclusion constraints prohibit overlapping intervals for the same student/group. Capacity checks consider boundaries within an interval, not only today's count. Override requires explicit confirmation and a reason.

Recurring rules are local weekday/time. Generated lessons are UTC, bounded to at most 93 inclusive calendar days. Repeating the same generation preserves original lesson identity, including cancelled records, rather than duplicating them. A global lesson exclusion constraint prevents the single teacher's overlapping non-cancelled lessons. Rule edits affect subsequent generation and do not silently move saved lessons. Saved future lessons are individually rescheduled with reason/history. A bulk operation to rewrite already-generated future lessons is not provided.

Transfers end the original interval and create a new one transactionally. Historical intervals cannot be silently rewritten. As of 2026-11-03, manual student/group activity states are removed from the API and business rules. Dated memberships still determine enrollment. Deleted or unapproved students and deleted groups cannot receive new enrollment/invoices; already-issued financial records remain visible. This supersedes the earlier paused/active profile policy. See [entity lifecycle report](entity-lifecycle-and-theme-update.md).

Attendance comes from the membership interval on the lesson date, not today's roster. Bulk upsert is unique by lesson/student; cancelled lessons reject it. Present/late/absent/excused are marked statuses; unmarked is separate. Percentage = (present + late) / all marked, with excused in the denominator; unmarked is excluded and counted separately. Absence attention defaults to the last two marked lessons; an unmarked lesson does not count as an absence.

## Finance
NUMERIC(18,2), Python Decimal and decimal-string API values. Frontend uses BigInt-based formatting for money to avoid Number rounding. Currency UZS only.

Automatic policy is full calendar-month tuition, with **exclusive** period_end. Due day defaults to 10 (1–28 configurable). Mid-month enrollment/pause/transfer and missed/cancelled lessons never trigger guessed prorating or automatic debt reduction. Teacher reviews draft invoices and adds a signed manual adjustment with a reason before issuing. Group price changes do not change historical invoice snapshots. Marketing course price is separate from group billing.

600000 charge − 100000 discount − 300000 allocated payment = 200000 debt. Unallocated payment credit stays separate and is not automatically applied. Due today is not overdue; overdue starts after due_date in Tashkent. An adjustment cannot make payable negative or lower than already allocated money. Void releases allocations into free payment credit. Refund consumes free credit first, then releases allocations and can reopen tuition debt; it does not cancel tuition. Voiding a partially refunded payment is rejected; refund the remaining part instead.

Payment Idempotency-Key is scoped to teacher and retained for the lifetime of the financial record (no expiry cleanup). Same key and normalized payload returns the same payment; changed payload is 409. The single teacher row and relevant student/payment/invoice rows serialize financial mutation transactions; this deliberately favors correctness over write parallelism for one owner. Database unique keys reinforce idempotency. Parallel service tests are supplied but were not executable in this session.

Monthly received cash is based on payment.received_at in Tashkent's calendar month; refunds use refund.created_at. Net receipts = received − refunded, not business profit. Voided erroneous payments are excluded, so correcting an erroneous past receipt can change the past month's receipt report; its audit history remains. Expenses/profit and online acquiring are outside this MVP.

## Publishing and files
Draft content edits preserve published title/data/media snapshots until publish succeeds. Schema, consent, approval and prepared public media checks happen before replacing the snapshot. Revoking approval/consent unpublishes the item. No assessment is automatically made into a public certificate. Public content reads use no-store; no indefinite CMS cache remains.

File visibility is enforced by the download endpoint, including ownership/group checks for private media. UUID object keys prevent path traversal. Disk and S3-compatible private storage adapters share the same policy. Public certificate previews use a separate image prepared by the teacher with identifiers redacted; private originals and student submissions are not converted into public files. Images re-encode to WebP, strip metadata, preserve transparency and cap dimensions. PDFs are signature-checked attachments, never executable inline HTML. An object written just before a DB rollback may be an orphan; no successful DB asset points to a failed upload. Periodic orphan cleanup is an operational improvement, not a public-access shortcut.

## Telegram
Lead and NotificationOutbox commit in one request transaction. A worker claims committed work using FOR UPDATE SKIP LOCKED and a 90-second lease, commits the claim, then calls Telegram outside the transaction with bounded HTTPX timeouts. Lease tokens prevent stale workers from overwriting a newer claim.

Up to eight attempts; timeout/5xx use exponential backoff; 429 honors retry_after up to one day. Permanent auth/chat errors fail instead of retrying forever. Missing token/chat disables delivery without losing the lead. Manual requeue is authenticated. Delivery is at-least-once: a timeout after Telegram accepted the message can produce a duplicate for the same lead. Lead/outbox IDs remain internal; the owner-requested message format omits the ID line and displays the creation date and minute separately in Asia/Tashkent. See [current message format](telegram-setup.md). Tokens and provider exception URLs are not logged.

## Offline and deployment
Only offline public shell, local fonts, icons and immutable frontend assets enter the service-worker cache. API, auth and private paths are network-only. Public CMS HTML is also network-only; offline navigation falls back to the neutral offline page. No offline payment/attendance queue or push notifications. Cache version must change on release.

Compose runs PostgreSQL, an explicit one-shot migration task, FastAPI, worker and Next.js. PostgreSQL has no host port. The two HTTP ports bind loopback; the supplied host Nginx example terminates TLS and routes /api directly to FastAPI. Configure the exact trusted proxy peer IP, including the observed Docker bridge address if relevant. Do not trust an entire arbitrary network to make rate limiting appear to work. HTTPS/domain provisioning has not been performed.

## Upstream references checked
- [Next.js installation and App Router](https://nextjs.org/docs/app/getting-started/installation), plus the installed Next.js 16.4.3 local docs.
- [FastAPI cookies](https://fastapi.tiangolo.com/advanced/response-cookies/).
- [SQLAlchemy PostgreSQL dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html).
- [Alembic release metadata](https://pypi.org/project/alembic/), [HTTPX](https://pypi.org/project/httpx/), [Pydantic Settings](https://pypi.org/project/pydantic-settings/), [Boto3 dependencies](https://github.com/boto/boto3/blob/1.43.123/setup.py).

The deployment lock pins these adapters, but installing/running uncached adapters and resolving the complete production environment still needs a network-enabled host. Development-only configuration validation falls back to Pydantic BaseModel when pydantic-settings is absent; production explicitly refuses that fallback.


## Teacher management extension — 2026-11-02

Receipt corrections preserve identity and audit: no student reassignment; amount/date/method/reference require a reason. Reduction releases excess allocations newest first under teacher/student/payment/invoice locks and may reopen debt. Increases remain unallocated credit; refunded or void receipts cannot be overwritten. DELETE is an idempotent reasoned void, not financial hard deletion. Original create-idempotency response remains immutable; use GET for current receipt state.

Group archive cancels only future scheduled lessons with audit/reason and hides the group from default lists/new active learning access. Memberships, completed lessons, attendance and financial records remain. Current-date membership count and weekly start/end clocks are returned in bounded bulk list queries; rule edits still do not silently reschedule saved lessons.

Content.student_id is a private nullable FK, absent from public DTOs; migration 0002 also adds archived. Dedicated certificate saves validate typed results, ownership selection, prepared image and public consent/approval atomically. Student certificate reads derive ownership from the session and return 404 for unrelated IDs. Delete unpublishes/archives; historical sample records are not automatically assigned to a student.

Public content remains network-only/no-store. Same-browser changes announce through BroadcastChannel; visible public revision checks and student certificate queries refresh within five seconds, plus focus checks. No zero-latency push promise is made. [Current implementation and verified boundaries](teacher-management-update.md).


## Entity deletion and admission — 2026-11-03

Migration `0003_entity_deletion` adds nullable timezone-aware `deleted_at` to students/groups/courses and explicit `Student.admission_status`. Legacy SQL `status`/`active` columns are mapped as `legacy_status`/`legacy_active` only to preserve old business metadata; no current entity rule or editable DTO uses them. Archived entities migrate to deleted, genuine pending signup to pending, and rejected signup to rejected. Internal `User.active` continues to guard login, separate from teacher entity lists.

Lists/counts use approved, undeleted students and undeleted groups. Deleted student sessions are revoked; new enrollment/account resets/invoices are rejected. Dated historical membership/attendance and immutable money records stay addressable by the teacher. Capacity and current member counts exclude deleted students. Attendance eligibility uses the deletion timestamp against the lesson time, preserving earlier roster history. Group deletion cancels future scheduled lessons and excludes new learning access. Course deletion is blocked while undeleted groups reference it and unpublishes the course. Teacher-row locks serialize deletion/enrollment/billing/course-group creation decisions. Publication consent, meaningful payment/lesson/attendance/lead workflow states are retained.

Dashboard exposes `student_count`, `group_count` and an automatically computed assigned/unassigned membership partition instead of the old manual activity donut. Existing chart/polling behavior remains. Main-data migration was rehearsed by private dump/restore and all original columns in 27 tables compared unchanged in clone and main; details and dated verification live in the focused report.


## Self registration and existing profile access — 2026-11-03

Migration `0004_self_registration` adds explicit `User.registration_pending`. It initializes old pending registrations without changing original business columns or password hashes. Pending access is a login/approval decision, independent of whether an existing Student already participates in enrollment/billing. Signup with a unique, approved, undeleted accountless Student reuses that ID without renaming it, rewriting notes or changing memberships/financial records. A new inactive User stores the student's chosen hash and pending flag. Access is denied until teacher approval; the pending list identifies existing-profile requests and the requested name. Rejecting such a claim denies login while preserving the Student and its business records. New students still use pending Student admission; reject deletes only that pending profile. Existing accounts, deleted/rejected profiles and ambiguous duplicate phones cannot be claimed; existing account passwords are never overwritten. Bulk approval is explicit and warns when existing-profile requests are included. Internal inactive accounts without an explicit pending registration cannot be bulk approved.

Teacher `POST /teacher/students/{id}/account` and AccountIn are removed. Self password change and session expiry/revocation remain. Existing real accountless business profiles are preserved, not reseeded. A private backup/restore rehearsal and comparison of all original columns in 27 tables preceded main migration. [Implementation and boundaries](courses-and-workspace-redesign.md).
