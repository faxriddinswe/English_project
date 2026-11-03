#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

if [[ ! -x "$project_root/.venv/bin/python" ]]; then
    echo "Python virtual muhiti topilmadi yoki interpretator symlinki buzilgan: .venv/bin/python" >&2
    exit 1
fi
if [[ -f .env ]]; then set -a; source .env; set +a; fi
exec "$project_root/.venv/bin/python" "$project_root/scripts/local_runtime.py" "$@"
