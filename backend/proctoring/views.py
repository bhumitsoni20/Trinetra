import base64

import cv2
import numpy as np
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .consumers import ALERT_GROUP_NAME
from .detector import EVENT_RISK_SCORES, detect_suspicious_behavior
from .models import ProctoringLog
from .serializers import ProctoringLogSerializer
from .socketio_server import sio


def decode_base64_image(image_data: str) -> np.ndarray:
    if "," in image_data:
        _, image_data = image_data.split(",", 1)

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception as exc:  # pragma: no cover - defensive branch
        raise ValueError("Invalid base64 image payload") from exc

    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)

    if frame is None:
        raise ValueError("Unable to decode image")

    return frame


class DetectAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @staticmethod
    def _broadcast_alert(payload: dict) -> None:
        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                ALERT_GROUP_NAME,
                {
                    "type": "alert.message",
                    "payload": payload,
                },
            )

        async_to_sync(sio.emit)("alert", payload)

    def post(self, request, *args, **kwargs):
        image_data = request.data.get("image")
        user_id = str(request.data.get("user_id") or "anonymous")

        if not image_data:
            return Response(
                {"detail": "image is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            frame = decode_base64_image(str(image_data))
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = detect_suspicious_behavior(frame_bgr=frame, user_id=user_id)

        logged_events = []
        for event_name in result["alerts"]:
            event_risk = EVENT_RISK_SCORES.get(event_name, 0)
            log_entry = ProctoringLog.objects.create(
                user_id=user_id,
                event=event_name,
                risk_score=event_risk,
            )

            payload = {
                "user_id": user_id,
                "event": event_name,
                "risk_score": event_risk,
                "timestamp": log_entry.timestamp.isoformat(),
            }
            logged_events.append(payload)
            self._broadcast_alert(payload)

        return Response(
            {
                "alert": result["primary_alert"],
                "alerts": result["alerts"],
                "risk_score": result["risk_score"],
                "risk_level": result["risk_level"],
                "faces_detected": result["faces_detected"],
                "movement_distance": result["movement_distance"],
                "logged_events": logged_events,
            },
            status=status.HTTP_200_OK,
        )


class LogListAPIView(generics.ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = ProctoringLog.objects.all()
    serializer_class = ProctoringLogSerializer
