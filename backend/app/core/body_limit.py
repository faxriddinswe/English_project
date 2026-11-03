"""Enforce an actual byte limit, including chunked requests with no Content-Length."""

from uuid import uuid4
from starlette.responses import JSONResponse


class BodySizeLimit:
    def __init__(self, app, limit=10 * 1024 * 1024):
        self.app = app
        self.limit = limit

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] in ("GET", "HEAD", "OPTIONS"):
            return await self.app(scope, receive, send)
        messages = []
        size = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            size += len(message.get("body", b""))
            if size > self.limit:
                response = JSONResponse(
                    {
                        "code": "file_size",
                        "message": "Eng ko‘pi 10 MB",
                        "field_errors": {},
                        "request_id": str(uuid4()),
                    },
                    status_code=413,
                    headers={"Cache-Control": "no-store"},
                )
                return await response(scope, receive, send)
            messages.append(message)
            if not message.get("more_body", False):
                break
        index = 0

        async def replay():
            nonlocal index
            if index < len(messages):
                message = messages[index]
                index += 1
                return message
            return await receive()

        await self.app(scope, replay, send)
