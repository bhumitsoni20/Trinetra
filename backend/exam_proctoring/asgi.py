import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "exam_proctoring.settings")

import socketio
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from proctoring.routing import websocket_urlpatterns
from proctoring.socketio_server import sio


django_asgi_app = get_asgi_application()

channels_application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)

application = socketio.ASGIApp(
    sio,
    other_asgi_app=channels_application,
    socketio_path="socket.io",
)
