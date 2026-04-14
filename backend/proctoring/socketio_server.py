import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None) -> None:
    await sio.emit("status", {"message": "Socket connected"}, to=sid)


@sio.event
async def disconnect(sid: str) -> None:
    return None
