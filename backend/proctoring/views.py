import base64
import binascii
import io
import uuid

import cv2
import numpy as np
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .consumers import ALERT_GROUP_NAME
from .detector import EVENT_RISK_SCORES, detect_suspicious_behavior
from .models import ExamSession, ProctoringLog, Profile
from .serializers import (
    ExamSessionSerializer,
    ProctoringLogSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from .socketio_server import sio


# ---------- helpers ----------

def decode_base64_image(image_data: str) -> np.ndarray:
    if not image_data or not image_data.strip():
        raise ValueError("Empty image payload")
    if "," in image_data:
        _, image_data = image_data.split(",", 1)
    image_data = image_data.strip()
    if not image_data:
        raise ValueError("Empty image payload")
    # Fix padding if missing
    padding_needed = len(image_data) % 4
    if padding_needed:
        image_data += "=" * (4 - padding_needed)

    try:
        image_bytes = base64.b64decode(image_data)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("Invalid base64 image payload") from exc
    if not image_bytes:
        raise ValueError("Empty image payload")
    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    if np_buffer.size == 0:
        raise ValueError("Empty image payload")
    try:
        frame = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    except cv2.error as exc:
        raise ValueError("Unable to decode image") from exc
    if frame is None:
        raise ValueError("Unable to decode image")
    return frame


def save_snapshot_from_base64(image_data: str):
    """Save a base64 image as a Django ContentFile and return it."""
    if "," in image_data:
        _, image_data = image_data.split(",", 1)

    image_data = image_data.strip()
    padding_needed = len(image_data) % 4
    if padding_needed:
        image_data += "=" * (4 - padding_needed)

    try:
        image_bytes = base64.b64decode(image_data)
        filename = f"{uuid.uuid4().hex}.jpg"
        return ContentFile(image_bytes, name=filename)
    except Exception:
        return None


def get_user_from_token_or_session(request):
    """Extract user from session or Authorization header."""
    if request.user and request.user.is_authenticated:
        return request.user
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("User "):
        try:
            user_id = int(auth_header.split(" ")[1])
            return User.objects.get(id=user_id)
        except (ValueError, User.DoesNotExist):
            pass
    return None


# ---------- Question Bank ----------

EXAM_QUESTIONS = [
    {
        "id": 1,
        "question": "What is the time complexity of binary search?",
        "type": "mcq",
        "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        "correct": 1,
    },
    {
        "id": 2,
        "question": "Which data structure uses LIFO (Last In First Out) principle?",
        "type": "mcq",
        "options": ["Queue", "Stack", "Linked List", "Tree"],
        "correct": 1,
    },
    {
        "id": 3,
        "question": "What does HTML stand for?",
        "type": "mcq",
        "options": [
            "Hyper Text Markup Language",
            "High Tech Machine Learning",
            "Hyper Transfer Markup Language",
            "Hyper Text Machine Language",
        ],
        "correct": 0,
    },
    {
        "id": 4,
        "question": "Which of the following is NOT a JavaScript framework?",
        "type": "mcq",
        "options": ["React", "Angular", "Django", "Vue"],
        "correct": 2,
    },
    {
        "id": 5,
        "question": "What is the primary function of an operating system?",
        "type": "mcq",
        "options": [
            "Compile code",
            "Manage hardware resources",
            "Browse the internet",
            "Design databases",
        ],
        "correct": 1,
    },
    {
        "id": 6,
        "question": "In Python, which keyword is used to define a function?",
        "type": "mcq",
        "options": ["function", "func", "def", "define"],
        "correct": 2,
    },
    {
        "id": 7,
        "question": "Which protocol is used for secure web communication?",
        "type": "mcq",
        "options": ["HTTP", "FTP", "HTTPS", "SMTP"],
        "correct": 2,
    },
    {
        "id": 8,
        "question": "What is the result of 2^10?",
        "type": "mcq",
        "options": ["512", "1024", "2048", "256"],
        "correct": 1,
    },
    {
        "id": 9,
        "question": "Which sorting algorithm has the best average-case time complexity?",
        "type": "mcq",
        "options": ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
        "correct": 2,
    },
    {
        "id": 10,
        "question": "What does SQL stand for?",
        "type": "mcq",
        "options": [
            "Structured Query Language",
            "Simple Query Language",
            "Standard Query Logic",
            "Sequential Query Language",
        ],
        "correct": 0,
    },
    {
        "id": 11,
        "question": "Which layer of the OSI model handles routing?",
        "type": "mcq",
        "options": ["Transport", "Network", "Data Link", "Session"],
        "correct": 1,
    },
    {
        "id": 12,
        "question": "What is the space complexity of a hash table?",
        "type": "mcq",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        "correct": 2,
    },
    {
        "id": 13,
        "question": "Which of the following is a NoSQL database?",
        "type": "mcq",
        "options": ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
        "correct": 2,
    },
    {
        "id": 14,
        "question": "What is encapsulation in OOP?",
        "type": "mcq",
        "options": [
            "Inheriting properties from parent class",
            "Bundling data and methods that operate on data",
            "Creating multiple instances of a class",
            "Overriding parent class methods",
        ],
        "correct": 1,
    },
    {
        "id": 15,
        "question": "What is the worst-case time complexity of quicksort?",
        "type": "mcq",
        "options": ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
        "correct": 2,
    },
]


# ---------- Auth ----------

class LoginAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # find user by email
        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=user_obj.username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            role = user.profile.role
        except Profile.DoesNotExist:
            role = "student"

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role,
        })


class RegisterAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        role = user.profile.role if hasattr(user, "profile") else "student"
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role,
        }, status=status.HTTP_201_CREATED)


# ---------- Exam ----------

class StartExamAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_user_from_token_or_session(request)
        user_id = request.data.get("user_id")

        if not user and user_id:
            try:
                user = User.objects.get(id=int(user_id))
            except (ValueError, User.DoesNotExist):
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not user:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        # Check for existing active session
        active = ExamSession.objects.filter(user=user, status="active").first()
        if active:
            return Response({
                "session_id": active.id,
                "questions": EXAM_QUESTIONS,
                "time_remaining": active.time_remaining,
                "status": active.status,
                "violations_count": active.violations_count,
                "tab_switch_count": active.tab_switch_count,
            })

        session = ExamSession.objects.create(user=user, time_remaining=3600)
        return Response({
            "session_id": session.id,
            "questions": EXAM_QUESTIONS,
            "time_remaining": session.time_remaining,
            "status": session.status,
            "violations_count": 0,
            "tab_switch_count": 0,
        })


class SubmitExamAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get("session_id")
        answers = request.data.get("answers", {})

        try:
            session = ExamSession.objects.get(id=session_id)
        except ExamSession.DoesNotExist:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        if session.status != "active":
            return Response({"detail": "Exam already ended.", "status": session.status})

        # Calculate score
        correct = 0
        total = len(EXAM_QUESTIONS)
        for q in EXAM_QUESTIONS:
            user_answer = answers.get(str(q["id"]))
            if user_answer is not None and int(user_answer) == q["correct"]:
                correct += 1

        session.status = "completed"
        session.end_time = timezone.now()
        session.save()

        return Response({
            "status": "completed",
            "score": correct,
            "total": total,
            "percentage": round((correct / total) * 100, 1) if total > 0 else 0,
        })


class TabSwitchAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get("session_id")
        user_id = request.data.get("user_id")

        try:
            session = ExamSession.objects.get(id=session_id)
        except ExamSession.DoesNotExist:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        if session.status != "active":
            return Response({"detail": "Exam already ended.", "status": session.status})

        session.tab_switch_count += 1
        session.violations_count += 1

        # Deduct 10 minutes (600 seconds)
        session.time_remaining = max(0, session.time_remaining - 600)

        disqualified = session.tab_switch_count >= 3
        if disqualified:
            session.status = "disqualified"
            session.end_time = timezone.now()

        session.save()

        # Log the violation
        user = session.user
        log = ProctoringLog.objects.create(
            user=user,
            user_label=user.username,
            event="Tab Switch",
            risk_score=4,
            session=session,
        )

        # Broadcast alert
        payload = {
            "user_id": user.username,
            "email": user.email,
            "event": "Tab Switch",
            "risk_score": 4,
            "timestamp": log.timestamp.isoformat(),
            "tab_switch_count": session.tab_switch_count,
            "disqualified": disqualified,
        }
        _broadcast_alert(payload)

        return Response({
            "tab_switch_count": session.tab_switch_count,
            "time_remaining": session.time_remaining,
            "disqualified": disqualified,
            "status": session.status,
        })


# ---------- Detection ----------

def _broadcast_alert(payload: dict) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is not None:
        try:
            async_to_sync(channel_layer.group_send)(
                ALERT_GROUP_NAME,
                {
                    "type": "alert.message",
                    "payload": payload,
                },
            )
        except Exception:
            pass
    try:
        async_to_sync(sio.emit)("alert", payload)
    except Exception:
        pass


class DetectAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        image_data = request.data.get("image")
        user_id = str(request.data.get("user_id") or "anonymous")
        session_id = request.data.get("session_id")

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

        try:
            result = detect_suspicious_behavior(frame_bgr=frame, user_id=user_id)
        except Exception as exc:
            return Response(
                {"detail": f"Detection error: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Resolve user & session
        user = None
        session = None
        if session_id:
            try:
                session = ExamSession.objects.get(id=int(session_id))
                user = session.user
            except (ExamSession.DoesNotExist, ValueError, TypeError):
                pass

        if not user:
            # Try numeric ID first, then username lookup
            try:
                uid = int(user_id)
                user = User.objects.get(id=uid)
            except (ValueError, TypeError, User.DoesNotExist):
                # user_id is a string like 'candidate-001' — that's fine,
                # try username match as a last resort
                try:
                    user = User.objects.get(username=user_id)
                except User.DoesNotExist:
                    pass  # user stays None — will be stored via user_label only

        # Determine the label to store
        user_label = user.username if user else user_id

        logged_events = []
        should_save_image = len(result["alerts"]) > 0

        for event_name in result["alerts"]:
            event_risk = EVENT_RISK_SCORES.get(event_name, 0)
            try:
                log_entry = ProctoringLog(
                    user=user,
                    user_label=user_label,
                    event=event_name,
                    risk_score=event_risk,
                    session=session,
                )

                # Save snapshot for suspicious events
                if should_save_image:
                    snapshot = save_snapshot_from_base64(str(image_data))
                    if snapshot:
                        log_entry.image = snapshot

                log_entry.save()
            except Exception:
                # If DB write fails, continue with remaining alerts
                continue

            # Update session violations
            if session and session.status == "active":
                try:
                    session.violations_count += 1
                    session.save(update_fields=["violations_count"])
                except Exception:
                    pass

            image_url = ""
            if log_entry.image:
                try:
                    image_url = request.build_absolute_uri(log_entry.image.url)
                except Exception:
                    image_url = log_entry.image.url if log_entry.image else ""

            payload = {
                "user_id": user_id,
                "username": user.username if user else user_label,
                "email": user.email if user else "",
                "event": event_name,
                "risk_score": event_risk,
                "timestamp": log_entry.timestamp.isoformat(),
                "image_url": image_url,
            }
            logged_events.append(payload)
            _broadcast_alert(payload)

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


# ---------- Logs ----------

class LogListAPIView(generics.ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProctoringLogSerializer

    def get_queryset(self):
        return ProctoringLog.objects.select_related("user", "session").all()[:200]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


# ---------- User Management ----------

class UserListAPIView(generics.ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = User.objects.all().select_related("profile")
    serializer_class = UserSerializer


class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = User.objects.all().select_related("profile")
    serializer_class = UserUpdateSerializer


# ---------- Active Sessions ----------

class ActiveSessionsAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        sessions = ExamSession.objects.select_related("user", "user__profile").all()
        data = []
        for s in sessions:
            try:
                role = s.user.profile.role
            except Profile.DoesNotExist:
                role = "student"
            data.append({
                "id": s.id,
                "username": s.user.username,
                "email": s.user.email,
                "status": s.status,
                "violations_count": s.violations_count,
                "tab_switch_count": s.tab_switch_count,
                "start_time": s.start_time.isoformat(),
                "time_remaining": s.time_remaining,
                "role": role,
            })
        return Response(data)


class SessionDetailAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            session = ExamSession.objects.select_related("user").get(id=pk)
        except ExamSession.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        logs = ProctoringLog.objects.filter(session=session).order_by("-timestamp")
        log_data = ProctoringLogSerializer(logs, many=True, context={"request": request}).data

        return Response({
            "session": ExamSessionSerializer(session).data,
            "logs": log_data,
        })
