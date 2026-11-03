# Operations and restore rehearsal

## Before production
- Complete the [real content checklist](content-checklist.md).
- Replace every env placeholder; use independent random session/CSRF secrets and a strong database password. URL-encode a DB password containing reserved URL characters, or choose a URL-safe generated password consistently in Compose and DATABASE_URL.
- Run the locked dependency install on the target platform; the current sandbox only had cached core packages.
- Run Alembic against an empty disposable PostgreSQL database, followed by the real API, concurrency and browser tests. Standalone SQL constraint tests are useful evidence but are not this acceptance test.
- Configure HTTPS and exact host/origin/trusted proxy addresses; verify that a forged forwarding header cannot change the rate-limit identity.
- Keep API/worker logs private. Default Uvicorn access logging is disabled; application logs use request IDs, route templates, safe codes and no request bodies/tokens/phone numbers.
- Check `/health/ready`, authenticated login, one real lead and worker delivery, private file denial, and logout. PWA install/offline/update needs a real browser.

## Backup

From the repository root after the Compose services are running:

```bash
infra/backup/backup.sh
```

This writes a custom-format PostgreSQL dump, a media tarball and SHA256 checksums under ignored `backups/`, with restrictive file permissions. Copy encrypted backups to separate storage with a retention policy. Disk adapter media are covered; for S3 storage use the provider's object versioning/backup separately and coordinate it with DB snapshots.

## Restore into a disposable environment

Never rehearse by overwriting production. Use a separate Compose project or a separate disposable host and empty volumes. Replace example dump filenames with the actual backup pair:

```bash
sha256sum -c backups/checksums-TIMESTAMP.txt
docker compose exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" sherzod_restore_test'
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d sherzod_restore_test --exit-on-error' < backups/db-TIMESTAMP.dump
docker compose exec -T backend sh -c 'mkdir -p /tmp/media-restore; tar -C /tmp/media-restore -xzf -' < backups/media-TIMESTAMP.tgz
```

Point an isolated backend at `sherzod_restore_test` and the restored media directory, using the backed-up secret configuration as appropriate. Check Alembic revision, record counts, student/invoice balances, a prepared public image and an authorized private download. Compare the financial sums and asset keys with the source snapshot. Do not enable the worker during restore testing unless its destination is a dedicated test chat. Record the restore date and results; backup existence alone proves no successful recovery.

No backup/restore or Docker run was performed in this restricted session.


## Local DB migration/restore evidence — 2026-11-02

Migration 0002 was tested on empty disposable PostgreSQL and applied locally after a private pg_dump. That dump was restored only to a new disposable DB and seven business tables compared against the migrated main DB using original columns/IDs; all matched. Temporary DBs were removed. This verifies this local DB snapshot/restore, not production or media restore. [Evidence](teacher-management-migration.json), [scope](teacher-management-update.md).
