"""Small socket-free ASGI test client; executes the actual app/middleware stack."""

import asyncio, json
from http.cookies import SimpleCookie


class Client:
    def __init__(self, app):
        self.app = app
        self.cookies = {}

    def request(self, method, path, json_body=None, headers=None):
        return asyncio.run(self._request(method, path, json_body, headers or {}))

    async def _request(self, method, path, body, headers):
        raw = (
            body
            if isinstance(body, bytes)
            else json.dumps(body).encode()
            if body is not None
            else b""
        )
        merged = {
            "host": "testserver",
            "content-type": "application/json",
            "content-length": str(len(raw)),
            **headers,
        }
        if self.cookies:
            merged["cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        url, _, query = path.partition("?")
        output = []
        received = False

        async def receive():
            nonlocal received
            if not received:
                received = True
                return {"type": "http.request", "body": raw, "more_body": False}
            await asyncio.sleep(3600)

        async def send(message):
            output.append(message)

        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": url,
            "raw_path": url.encode(),
            "query_string": query.encode(),
            "root_path": "",
            "headers": [(k.encode(), v.encode()) for k, v in merged.items()],
            "client": ("127.0.0.1", 1234),
            "server": ("testserver", 80),
        }

        # Restricted hosts may disable asyncio's socket-pair thread wakeup. Keep the
        # selector ticking without changing the application or its sync DB routes.
        async def tick():
            while True:
                await asyncio.sleep(0.005)

        ticker = asyncio.create_task(tick())
        try:
            await asyncio.wait_for(self.app(scope, receive, send), 15)
        finally:
            ticker.cancel()
            try:
                await ticker
            except asyncio.CancelledError:
                pass
        start = next(m for m in output if m["type"] == "http.response.start")
        data = b"".join(m.get("body", b"") for m in output if m["type"] == "http.response.body")
        for key, val in start["headers"]:
            if key.lower() == b"set-cookie":
                cookie = SimpleCookie()
                cookie.load(val.decode())
                for name, morsel in cookie.items():
                    if morsel["max-age"] == "0":
                        self.cookies.pop(name, None)
                    else:
                        self.cookies[name] = morsel.value
        content_type = dict(start["headers"]).get(b"content-type", b"")
        try:
            result = data if b"spreadsheetml" in content_type else json.loads(data)
        except ValueError:
            result = data.decode()
        return start["status"], result, dict((k.decode(), v.decode()) for k, v in start["headers"])

    def mutate(self, method, path, payload=None, extra_headers=None):
        status, data, _ = self.request("GET", "/api/v1/auth/csrf")
        assert status == 200
        return self.request(
            method,
            path,
            payload,
            {
                "origin": "http://localhost:3000",
                "x-csrf-token": data["token"],
                **(extra_headers or {}),
            },
        )
