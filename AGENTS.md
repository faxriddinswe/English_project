# Sherzod English — repository working instructions

## Required documentation after every task

The project owner explicitly requires automatic Markdown documentation of all work. Maintain it as part of the task; do not wait for a reminder or ask for permission to document authorized work.

1. Read `docs/README.md`, the current-state summary in `docs/project-journal.md`, and the latest entries in `docs/implementation-status.md` before substantial changes. Inspect relevant feature reports and existing code before implementing anything again.
2. Before ending every project work turn, add/update an entry in `docs/project-journal.md`. Include the request, actual changes/findings, affected files or feature-report links, verification actually performed, remaining limitations and next actions when needed. Include investigations, runtime/configuration changes, bug fixes, user decisions and unsuccessful/partial work as appropriate. Do not generate duplicate entries for an unchanged status message.
3. Update `docs/implementation-status.md` when implementation, runtime, verification or blockers change. Keep the newest status first and distinguish current facts from historical reports.
4. For substantial work, create/update a focused `docs/*.md` report with the plan, implementation, commands, observed test results and limitations. Link it from the journal and `docs/README.md`. Update the root README if usage or startup behavior changes.
5. Record dates in Asia/Tashkent. When reconstructing earlier work, use its existing evidence; mark unknown dates rather than inventing them. Preserve the history of superseded decisions and state which newer decision replaces them.
6. Never record passwords, tokens, cookies, secret environment values, database dumps or unnecessary personal information in Markdown. Refer to environment variable names and private configuration paths instead.
7. Never claim unrun tests, successful delivery, native installation or production readiness without evidence. Separate real API checks, controlled UI fixtures and untested physical-device/provider behavior. Treat test counts as dated observations, not permanent guarantees.
8. If interrupted or unfinished, save completed work, failures/blockers and the exact next step before yielding when possible. Do not label partial work complete.

This is an ongoing repository workflow, not a background file watcher. No daemon, Git hook or paid/external service is needed for documentation.

## Preserve the existing project

- Extend the existing Next.js/TypeScript frontend, Python FastAPI backend and PostgreSQL integration. Do not replace them or recreate existing features.
- Preserve user changes, business records and existing accounts. Do not reinitialize the database, reseed or reset passwords just to test a UI change.
- Do not fabricate teacher credentials, student results, prices, contacts or other business claims. Keep development certificate fixtures explicitly marked and excluded from production publication.
- Use meaningful checks appropriate to the change. Documentation-only changes need file/link/consistency checks, not a full application rebuild.
