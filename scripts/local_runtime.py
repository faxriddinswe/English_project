"""Start the existing local stack, reuse healthy services, and report real readiness."""

import argparse
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local"
sys.path.insert(0, str(ROOT / "backend"))


def http_ready(url, expected_status=None):
    try:
        with urlopen(url, timeout=2) as response:
            if response.status != 200:
                return False
            return (
                expected_status is None
                or json.load(response).get("status") == expected_status
            )
    except Exception:
        return False


def port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            return True
    except OSError:
        return False


def worker_pids():
    found = []
    for entry in Path("/proc").iterdir():
        if not entry.name.isdecimal():
            continue
        try:
            args = (entry / "cmdline").read_bytes().split(b"\0")
            if any(
                args[i : i + 2] == [b"-m", b"app.workers.telegram"]
                for i in range(len(args) - 1)
            ):
                if (entry / "cwd").resolve() == ROOT / "backend":
                    found.append(int(entry.name))
        except (OSError, RuntimeError):
            pass
    return found


def worker_ready():
    try:
        return (
            bool(worker_pids())
            and time.time() - Path("/tmp/sherzod-worker.heartbeat").stat().st_mtime < 30
        )
    except OSError:
        return False


def database_ready():
    from sqlalchemy import create_engine, text
    from app.core.config import get_settings

    engine = create_engine(
        get_settings().database_url, connect_args={"connect_timeout": 2}
    )
    try:
        with engine.connect() as db:
            return db.scalar(text("SELECT 1")) == 1
    except Exception:
        return False
    finally:
        engine.dispose()


def wait_for(check, label, process=None, timeout=45):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process is not None and process.poll() is not None:
            break
        if check():
            return
        time.sleep(0.5)
    raise RuntimeError(
        f"{label} tayyor bo‘lmadi. .local/ ichidagi tegishli logni tekshiring."
    )


def background(name, command, cwd=ROOT):
    with (LOCAL / f"{name}-running.log").open("a") as output:
        process = subprocess.Popen(
            command,
            cwd=cwd,
            stdin=subprocess.DEVNULL,
            stdout=output,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    (LOCAL / f"{name}.pid").write_text(str(process.pid) + "\n")
    return process


def start_database():
    from sqlalchemy.engine import make_url
    from app.core.config import get_settings

    if database_ready():
        print("[1/4] PostgreSQL tayyor.", flush=True)
        return
    url = make_url(get_settings().database_url)
    cluster = LOCAL / "postgres"
    if (
        url.host not in ("127.0.0.1", "localhost")
        or (url.port or 5432) != 55432
        or not (cluster / "PG_VERSION").is_file()
    ):
        raise RuntimeError(
            "DATABASE_URL bazasi mavjud emas. Mavjud PostgreSQL serverini tekshiring; yangi baza avtomatik yaratilmaydi."
        )
    if port_open(55432):
        raise RuntimeError(
            "55432-port band, lekin DATABASE_URL orqali ulanish bajarilmadi. Baza/rol sozlamalarini tekshiring."
        )
    version = (cluster / "PG_VERSION").read_text().strip()
    pg_ctl = Path(f"/usr/lib/postgresql/{version}/bin/pg_ctl")
    if not pg_ctl.is_file():
        pg_ctl = Path(shutil.which("pg_ctl") or "pg_ctl")
    socket_dir = LOCAL / "postgres-socket"
    socket_dir.mkdir(mode=0o700, exist_ok=True)
    socket_dir.chmod(0o700)
    subprocess.run(
        [
            str(pg_ctl),
            "-D",
            str(cluster),
            "-l",
            str(LOCAL / "postgres-running.log"),
            "-o",
            f'-h 127.0.0.1 -p 55432 -k "{socket_dir}"',
            "-w",
            "start",
        ],
        check=True,
    )
    wait_for(database_ready, "PostgreSQL")
    print("[1/4] PostgreSQL tayyor.", flush=True)


def start_http_service(name, port, url, command, expected_status=None):
    check = lambda: http_ready(url, expected_status)
    if check():
        print(f"{name} allaqachon tayyor.", flush=True)
        return
    if port_open(port):
        raise RuntimeError(
            f"{port}-port band, ammo {name} tayyor emas; takroriy server ishga tushirilmadi."
        )
    process = background(name, command)
    wait_for(check, name, process)
    print(f"{name} tayyor.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--status", action="store_true", help="Faqat holatni tekshirish"
    )
    parser.add_argument(
        "--production",
        action="store_true",
        help="Joriy production build bilan lokal ishga tushirish",
    )
    args = parser.parse_args()
    if args.status:
        states = {
            "postgres": database_ready(),
            "backend": http_ready("http://127.0.0.1:8000/health/ready", "ready"),
            "frontend": http_ready("http://127.0.0.1:3000/login"),
            "worker": worker_ready(),
        }
        print(json.dumps(states))
        return 0 if all(states.values()) else 1

    os.umask(0o077)
    LOCAL.mkdir(exist_ok=True)
    start_database()
    start_http_service(
        "backend",
        8000,
        "http://127.0.0.1:8000/health/ready",
        [
            str(ROOT / "scripts/backend"),
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
            "--no-access-log",
            "--no-proxy-headers",
        ],
        "ready",
    )
    if worker_pids():
        wait_for(worker_ready, "Mavjud Telegram worker", timeout=10)
        print("[3/4] Telegram worker allaqachon tayyor.", flush=True)
    else:
        process = background(
            "worker", [str(ROOT / "scripts/backend"), "-m", "app.workers.telegram"]
        )
        wait_for(worker_ready, "Telegram worker", process)
        print("[3/4] Telegram worker tayyor.", flush=True)

    if args.production and not port_open(3000):
        stamp = ROOT / "frontend/.next/BUILD_ID"
        sources = [
            ROOT / "frontend" / name
            for name in (
                "src",
                "public",
                "next.config.ts",
                "package.json",
                "package-lock.json",
                "tsconfig.json",
            )
        ]
        stale = not stamp.exists() or any(
            source.stat().st_mtime > stamp.stat().st_mtime
            for path in sources
            for source in (path.rglob("*") if path.is_dir() else [path])
            if source.is_file()
        )
        if stale:
            print("Joriy frontend kodi yig‘ilmoqda…", flush=True)
            subprocess.run(
                [str(ROOT / "scripts/frontend"), "run", "build"], cwd=ROOT, check=True
            )
    mode = "start" if args.production else "dev"
    start_http_service(
        "frontend",
        3000,
        "http://127.0.0.1:3000/login",
        [str(ROOT / "scripts/frontend"), "run", mode, "--", "--hostname", "127.0.0.1"],
    )
    print("Sayt tayyor: http://localhost:3000", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f"Ishga tushirish xatosi: {error}", file=sys.stderr)
        raise SystemExit(1)
