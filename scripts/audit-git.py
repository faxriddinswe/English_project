#!/usr/bin/env python3
"""Check the exact Git index before publication without printing secret values.

Uses the ordinary index, or GIT_DIR/GIT_WORK_TREE when metadata is elsewhere.
This focused check complements code review; it is not a general secret scanner.
"""

from __future__ import annotations

import io
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args])


def main() -> int:
    root = Path(git("rev-parse", "--show-toplevel").decode().strip())
    private_values: set[str] = set()
    manifest = root / ".local/certificate-import.json"
    if manifest.is_file():
        private_values.update(
            spec["student_name"] for spec in json.loads(manifest.read_text())
        )
    env = root / ".env"
    if env.is_file():
        for line in env.read_text().splitlines():
            key, sep, value = line.partition("=")
            value = value.strip().strip("\"'")
            if sep and re.search(r"PASSWORD|SECRET|TOKEN|CHAT_ID|ACCESS_KEY", key) and len(value) >= 6:
                private_values.add(value)
            if key.strip() == "DATABASE_URL":
                from urllib.parse import unquote, urlsplit

                password = urlsplit(value).password
                if password and len(password) >= 6:
                    private_values.update((password, unquote(password)))

    rules = {
        "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        "github-token": re.compile(
            r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b"
        ),
        "telegram-token": re.compile(r"\b[0-9]{7,12}:[A-Za-z0-9_-]{30,}\b"),
        "aws-access-key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
        "jwt": re.compile(
            r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{15,}\b"
        ),
        "password-hash": re.compile(r"\$argon2(?:id|i|d)\$v=\d+\$[^\s\"']{20,}"),
    }
    forbidden = re.compile(
        r"(^|/)(?:\.local|\.aws|\.ssh|\.codex|\.agents|\.venv|node_modules|"
        r"Screenshots|test-results|playwright-report)(/|$)|^(?:media|backups)/|"
        r"(^|/)\.env(?:$|\.(?!.*example$))|"
        r"\.(?:pem|key|p12|pfx|dump|backup|sqlite3?|db|log|pid)$|"
        r"^docs/qa/|^docs/.*\.xml$"
    )
    errors: list[dict[str, str | int]] = []
    manifest = []
    for entry in git("ls-files", "--stage", "-z").split(b"\0"):
        if not entry:
            continue
        meta, raw_path = entry.split(b"\t", 1)
        mode, sha, stage = meta.decode().split()
        path = raw_path.decode()
        if stage != "0" or mode not in {"100644", "100755"}:
            errors.append({"path": path, "rule": "conflict-or-nonregular-file"})
            continue
        if forbidden.search(path) or (
            path.startswith("docs/")
            and path.endswith(".json")
            and path != "docs/openapi.json"
        ):
            errors.append({"path": path, "rule": "private-path"})
        data = git("cat-file", "blob", sha)
        manifest.append({"path": path, "sha": sha, "mode": mode, "bytes": len(data)})
        payloads = [(path, data.decode("utf-8", errors="replace"))]
        if path.endswith(".xlsx"):
            with zipfile.ZipFile(io.BytesIO(data)) as book:
                payloads.extend(
                    (
                        path + ":" + name,
                        book.read(name).decode("utf-8", errors="replace"),
                    )
                    for name in book.namelist()
                    if name.endswith(".xml")
                )
            if path != "frontend/tests/fixtures/excel-report.xlsx" or not any(
                "NAMUNA" in text for _, text in payloads
            ):
                errors.append({"path": path, "rule": "unapproved-spreadsheet"})
        for source, content in payloads:
            for number, line in enumerate(content.splitlines(), 1):
                if any(value in line for value in private_values):
                    errors.append(
                        {"path": source, "line": number, "rule": "local-secret-value"}
                    )
                for rule, pattern in rules.items():
                    if pattern.search(line):
                        errors.append({"path": source, "line": number, "rule": rule})
    output = {
        "files": len(manifest),
        "bytes": sum(int(f["bytes"]) for f in manifest),
        "findings": errors,
    }
    print(json.dumps(output, indent=2))
    private_dir = root / ".local"
    private_dir.mkdir(exist_ok=True)
    (private_dir / "github-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    (private_dir / "github-audit.json").write_text(json.dumps(output, indent=2) + "\n")
    return 1 if errors or not manifest else 0


if __name__ == "__main__":
    sys.exit(main())
