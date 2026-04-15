"""
REST-based WebRTC signaling for Trinetra Live Monitoring.

Replaces the broken Socket.IO/daphne signaling with simple REST polling.
Admin posts an SDP offer, student polls for it and responds with an answer.
Once the WebRTC P2P connection is established, video streams directly
between browsers with zero server involvement.
"""

import threading
import time

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


# ---------- In-Memory Signaling Store ----------
_signals = {}
_signals_lock = threading.Lock()
SIGNAL_MAX_AGE = 120  # Discard signals older than 2 minutes


def _store_offer(session_id: int, sdp: str) -> None:
    with _signals_lock:
        _signals.setdefault(session_id, {})
        _signals[session_id]["offer"] = sdp
        _signals[session_id]["offer_ts"] = time.time()
        # Clear stale answer from a previous connection attempt
        _signals[session_id].pop("answer", None)
        _signals[session_id].pop("answer_ts", None)


def _get_offer(session_id: int):
    with _signals_lock:
        data = _signals.get(session_id, {})
    offer = data.get("offer")
    ts = data.get("offer_ts", 0)
    if offer and (time.time() - ts) < SIGNAL_MAX_AGE:
        return offer
    return None


def _store_answer(session_id: int, sdp: str) -> None:
    with _signals_lock:
        _signals.setdefault(session_id, {})
        _signals[session_id]["answer"] = sdp
        _signals[session_id]["answer_ts"] = time.time()


def _get_answer(session_id: int):
    with _signals_lock:
        data = _signals.get(session_id, {})
    answer = data.get("answer")
    ts = data.get("answer_ts", 0)
    if answer and (time.time() - ts) < SIGNAL_MAX_AGE:
        return answer
    return None


def clear_signals(session_id: int) -> None:
    """Remove all signaling data for a session (called on exam submit/end)."""
    with _signals_lock:
        _signals.pop(session_id, None)


# ---------- REST Views ----------


class WebRTCOfferView(APIView):
    """Admin POSTs an SDP offer; student GETs (polls) for it."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, pk):
        sdp = request.data.get("sdp")
        if not sdp:
            return Response(
                {"detail": "sdp is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        _store_offer(int(pk), sdp)
        return Response({"status": "ok"})

    def get(self, request, pk):
        offer = _get_offer(int(pk))
        if offer:
            return Response({"sdp": offer})
        return Response(status=status.HTTP_204_NO_CONTENT)


class WebRTCAnswerView(APIView):
    """Student POSTs an SDP answer; admin GETs (polls) for it."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, pk):
        sdp = request.data.get("sdp")
        if not sdp:
            return Response(
                {"detail": "sdp is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        _store_answer(int(pk), sdp)
        return Response({"status": "ok"})

    def get(self, request, pk):
        answer = _get_answer(int(pk))
        if answer:
            return Response({"sdp": answer})
        return Response(status=status.HTTP_204_NO_CONTENT)