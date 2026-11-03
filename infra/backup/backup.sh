#!/usr/bin/env bash
set -euo pipefail
umask 077
mkdir -p backups
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/db-$backup_stamp.dump"
docker compose exec -T backend tar -C /data -czf - media > "backups/media-$backup_stamp.tgz"
sha256sum "backups/db-$backup_stamp.dump" "backups/media-$backup_stamp.tgz" > "backups/checksums-$backup_stamp.txt"
