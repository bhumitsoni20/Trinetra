if True:
    import base64
    import binascii
    import io
    import threading
    import time
    import uuid

    import cv2
    import numpy as np
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    from django.conf import settings
    from django.contrib.auth import authenticate
    from django.contrib.auth.models import User
    from django.core.files.base import ContentFile
    from django.db import transaction
    from django.shortcuts import get_object_or_404
    from django.utils import timezone
    from rest_framework import generics, status
    from rest_framework.exceptions import PermissionDenied
    from rest_framework.permissions import AllowAny, IsAuthenticated
    from rest_framework.response import Response
    from rest_framework.views import APIView

    from .consumers import ALERT_GROUP_NAME
    from .detector import EVENT_RISK_SCORES, detect_suspicious_behavior
    from .models import Exam, ExamAttempt, ExamSession, ProctoringLog, Profile, Question
    from .authentication import UserHeaderAuthentication
    from .permissions import IsAdminUser, IsAdminOrExaminer
    from .serializers import (
        ExamAttemptSerializer,
        ExamDetailSerializer,
        ExamListSerializer,
        ExamStudentSerializer,
        ExamSessionSerializer,
        ProctoringLogSerializer,
        QuestionStudentSerializer,
        RegisterSerializer,
        UserSerializer,
        UserUpdateSerializer,
    )
    from .email_utils import send_exam_result_email
    from .socketio_server import sio

    import logging

    logger = logging.getLogger(__name__)


    # ---------- In-Memory Live Frame Store ----------
    # Stores the latest webcam JPEG bytes per session for near-live admin monitoring.
    # Format: { session_id: { "frame": <bytes>, "timestamp": <float> } }
    _live_frames = {}
    _live_frames_lock = threading.Lock()
    FRAME_MAX_AGE_SECONDS = 30  # Discard frames older than this


    def store_live_frame(session_id: int, jpeg_bytes: bytes) -> None:
        """Store the latest webcam frame for a session."""
        with _live_frames_lock:
            _live_frames[session_id] = {
                "frame": jpeg_bytes,
                "timestamp": time.time(),
            }


    def get_live_frame(session_id: int):
        """Retrieve the latest webcam frame for a session, or None if stale/missing."""
        with _live_frames_lock:
            data = _live_frames.get(session_id)
        if data and (time.time() - data["timestamp"]) < FRAME_MAX_AGE_SECONDS:
            return data["frame"]
        return None


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


    def is_admin_user(user):
        try:
            return user.profile.role == "admin"
        except Profile.DoesNotExist:
            return False


    def get_user_role(user):
        try:
            return user.profile.role
        except Profile.DoesNotExist:
            return "student"


    def get_user_subject(user):
        try:
            return user.profile.subject or ""
        except Profile.DoesNotExist:
            return ""


    def normalize_question_payload(raw_questions):
        normalized = []
        if not isinstance(raw_questions, list):
            return normalized

        for idx, raw in enumerate(raw_questions):
            if not isinstance(raw, dict):
                continue
            question_text = str(raw.get("question_text") or raw.get("question") or "").strip()
            options = raw.get("options") if isinstance(raw.get("options"), list) else []
            options = [str(opt).strip() for opt in options]

            try:
                correct_index = int(raw.get("correct_answer", raw.get("correct", 0)))
            except (TypeError, ValueError):
                correct_index = 0

            try:
                marks = int(raw.get("marks", 1))
            except (TypeError, ValueError):
                marks = 1

            normalized.append({
                "question_text": question_text,
                "options": options,
                "correct_answer": correct_index,
                "marks": max(marks, 1),
                "order": idx,
            })

        return normalized


    def validate_exam_payload(title, duration, questions):
        if not title:
            return "Exam title is required."
        try:
            duration_val = int(duration)
        except (TypeError, ValueError):
            return "Duration must be a positive number."
        if duration_val <= 0:
            return "Duration must be a positive number."
        if not isinstance(questions, list) or not questions:
            return "Please add at least one question."

        for index, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                return f"Question {index} is invalid."
            question_text = str(question.get("question_text") or question.get("question") or "").strip()
            if not question_text:
                return f"Question {index} is missing text."

            options = question.get("options")
            if not isinstance(options, list) or len(options) < 2:
                return f"Question {index} must have at least 2 options."
            for option_index, option in enumerate(options):
                if not str(option).strip():
                    label = chr(ord("A") + option_index)
                    return f"Question {index} option {label} is required."

            try:
                correct_index = int(question.get("correct_answer", question.get("correct", -1)))
            except (TypeError, ValueError):
                return f"Question {index} has invalid correct answer."
            if correct_index < 0 or correct_index >= len(options):
                return f"Question {index} has invalid correct answer."

            try:
                marks = int(question.get("marks", 1))
            except (TypeError, ValueError):
                return f"Question {index} has invalid marks."
            if marks <= 0:
                return f"Question {index} has invalid marks."

        return ""


    # ---------- Auth ----------

    class LoginAPIView(APIView):
        authentication_classes = []
        permission_classes = [AllowAny]

        def post(self, request):
            identifier = request.data.get("email") or request.data.get("username") or request.data.get("identifier")
            identifier = (identifier or "").strip()
            password = request.data.get("password", "")

            if not identifier or not password:
                return Response({"detail": "Email/username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

            # find user by email or username
            user_obj = User.objects.filter(email__iexact=identifier).first()
            if not user_obj:
                user_obj = User.objects.filter(username__iexact=identifier).first()
            if not user_obj:
                return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

            if not user_obj.is_active:
                return Response({"detail": "Account is disabled."}, status=status.HTTP_403_FORBIDDEN)

            user = authenticate(username=user_obj.username, password=password)
            if user is None:
                return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

            role = get_user_role(user)
            subject = get_user_subject(user)

            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": role,
                "subject": subject,
            })


    class RegisterAPIView(APIView):
        authentication_classes = []
        permission_classes = [AllowAny]

        def post(self, request):
            requested_role = (request.data.get("role") or "student").strip()
            if requested_role in {"admin", "examiner"}:
                creator = get_user_from_token_or_session(request)
                if not creator or not is_admin_user(creator):
                    return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            serializer = RegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            role = get_user_role(user)
            subject = get_user_subject(user)
            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role,
                "subject": subject,
            }, status=status.HTTP_201_CREATED)


    # ---------- Exam ----------

    class CreateExamAPIView(APIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]

        def post(self, request):
            user = request.user
            try:
                profile = user.profile
            except Profile.DoesNotExist:
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            subject = str(request.data.get("subject", "")).strip()
            if not subject and profile.role == "examiner" and profile.subject:
                subject = profile.subject
            if not subject:
                return Response({"detail": "Subject is required."}, status=status.HTTP_400_BAD_REQUEST)

            if profile.role == "examiner":
                if not profile.subject:
                    return Response({"detail": "Examiner subject is not assigned."}, status=status.HTTP_403_FORBIDDEN)
                if profile.subject != subject:
                    return Response({
                        "detail": f"Access denied. You can only create exams for your assigned subject ({profile.subject})."
                    }, status=status.HTTP_403_FORBIDDEN)

            title = str(request.data.get("title", "")).strip()
            duration = request.data.get("duration", 60)
            questions = request.data.get("questions", [])
            validation_error = validate_exam_payload(title, duration, questions)
            if validation_error:
                return Response({"detail": validation_error}, status=status.HTTP_400_BAD_REQUEST)

            normalized_questions = normalize_question_payload(questions)
            total_marks = sum(q["marks"] for q in normalized_questions)

            allowed_students = request.data.get("allowed_students", [])
            if allowed_students is None:
                allowed_students = []
            if not isinstance(allowed_students, list):
                return Response({"detail": "allowed_students must be a list."}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                exam = Exam.objects.create(
                    title=title,
                    subject=subject,
                    duration=int(duration),
                    total_marks=total_marks,
                    created_by=user,
                )

                Question.objects.bulk_create([
                    Question(exam=exam, **payload) for payload in normalized_questions
                ])

                if allowed_students:
                    student_ids = [int(sid) for sid in allowed_students if str(sid).isdigit()]
                    students = User.objects.filter(id__in=student_ids, profile__role="student")
                    exam.allowed_students.set(students)

            return Response({
                "id": exam.id,
                "title": exam.title,
                "subject": exam.subject,
                "duration": exam.duration,
                "total_marks": exam.total_marks,
                "question_count": len(normalized_questions),
                "allowed_students": exam.allowed_students.values_list("id", flat=True),
            }, status=status.HTTP_201_CREATED)


    class ExamListAPIView(APIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAuthenticated]

        def get(self, request):
            role = get_user_role(request.user)
            if role == "student":
                exams = Exam.objects.filter(allowed_students=request.user)
            elif role == "examiner":
                exams = Exam.objects.filter(created_by=request.user)
            else:
                exams = Exam.objects.all()
            data = ExamListSerializer(exams, many=True).data
            return Response(data)


    class ExamDetailAPIView(APIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAuthenticated]

        def get(self, request, pk):
            exam = get_object_or_404(Exam, pk=pk)
            role = get_user_role(request.user)

            if role == "student":
                if not exam.allowed_students.filter(id=request.user.id).exists():
                    return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
                return Response(ExamStudentSerializer(exam).data)

            if role == "examiner":
                subject = get_user_subject(request.user)
                if not subject or exam.subject != subject or exam.created_by_id != request.user.id:
                    return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            return Response(ExamDetailSerializer(exam).data)

        def put(self, request, pk):
            if get_user_role(request.user) != "admin":
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

            exam = get_object_or_404(Exam, pk=pk)
            title = str(request.data.get("title", exam.title)).strip()
            subject = str(request.data.get("subject", exam.subject)).strip()
            duration = request.data.get("duration", exam.duration)
            questions = request.data.get("questions")

            try:
                duration_val = int(duration)
            except (TypeError, ValueError):
                return Response({"detail": "Duration must be a positive number."}, status=status.HTTP_400_BAD_REQUEST)
            if duration_val <= 0:
                return Response({"detail": "Duration must be a positive number."}, status=status.HTTP_400_BAD_REQUEST)

            if questions is not None:
                validation_error = validate_exam_payload(title, duration, questions)
                if validation_error:
                    return Response({"detail": validation_error}, status=status.HTTP_400_BAD_REQUEST)
                normalized_questions = normalize_question_payload(questions)
                total_marks = sum(q["marks"] for q in normalized_questions)
            else:
                normalized_questions = None
                total_marks = exam.total_marks

            with transaction.atomic():
                exam.title = title
                exam.subject = subject
                exam.duration = duration_val
                exam.total_marks = total_marks
                exam.save()

                if normalized_questions is not None:
                    exam.question_items.all().delete()
                    Question.objects.bulk_create([
                        Question(exam=exam, **payload) for payload in normalized_questions
                    ])

            return Response(ExamDetailSerializer(exam).data)

        def delete(self, request, pk):
            if get_user_role(request.user) != "admin":
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            exam = get_object_or_404(Exam, pk=pk)
            exam.delete()
            return Response({"detail": "Exam deleted."}, status=status.HTTP_200_OK)


    class ExamAssignStudentsAPIView(APIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]

        def post(self, request, pk):
            exam = get_object_or_404(Exam, pk=pk)
            if get_user_role(request.user) == "examiner":
                subject = get_user_subject(request.user)
                if not subject or exam.subject != subject or exam.created_by_id != request.user.id:
                    return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            student_ids = request.data.get("students", request.data.get("allowed_students", []))
            if not isinstance(student_ids, list):
                return Response({"detail": "students must be a list."}, status=status.HTTP_400_BAD_REQUEST)

            filtered_ids = [int(sid) for sid in student_ids if str(sid).isdigit()]
            students = User.objects.filter(id__in=filtered_ids, profile__role="student")
            exam.allowed_students.set(students)

            return Response({
                "detail": "Students assigned.",
                "allowed_count": exam.allowed_students.count(),
            })


    class ExamAttemptListAPIView(APIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]

        def get(self, request, pk):
            exam = get_object_or_404(Exam, pk=pk)
            if get_user_role(request.user) == "examiner":
                subject = get_user_subject(request.user)
                if not subject or exam.subject != subject or exam.created_by_id != request.user.id:
                    return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            attempts = ExamAttempt.objects.filter(exam=exam).select_related("user")
            return Response(ExamAttemptSerializer(attempts, many=True).data)

    class StartExamAPIView(APIView):
        authentication_classes = []
        permission_classes = [AllowAny]

        def post(self, request):
            user = get_user_from_token_or_session(request)
            user_id = request.data.get("user_id")
            exam_id = request.data.get("exam_id")

            if not user and user_id:
                try:
                    user = User.objects.get(id=int(user_id))
                except (ValueError, User.DoesNotExist):
                    return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            if not user:
                return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

            if get_user_role(user) != "student":
                return Response({"detail": "Only students can start exams."}, status=status.HTTP_403_FORBIDDEN)

            if not exam_id:
                return Response({"detail": "exam_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            exam = get_object_or_404(Exam, pk=exam_id)
            if not exam.allowed_students.filter(id=user.id).exists():
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            active = ExamSession.objects.filter(user=user, exam=exam, status="active").first()
            if active:
                return Response({
                    "session_id": active.id,
                    "exam_id": exam.id,
                    "exam_title": exam.title,
                    "duration": exam.duration,
                    "total_marks": exam.total_marks,
                    "questions": QuestionStudentSerializer(exam.question_items.all(), many=True).data,
                    "time_remaining": active.time_remaining,
                    "status": active.status,
                    "violations_count": active.violations_count,
                    "tab_switch_count": active.tab_switch_count,
                })

            time_remaining = max(int(exam.duration), 1) * 60
            session = ExamSession.objects.create(user=user, time_remaining=time_remaining, exam=exam)
            return Response({
                "session_id": session.id,
                "exam_id": exam.id,
                "exam_title": exam.title,
                "duration": exam.duration,
                "total_marks": exam.total_marks,
                "questions": QuestionStudentSerializer(exam.question_items.all(), many=True).data,
                "time_remaining": session.time_remaining,
                "status": session.status,
                "violations_count": 0,
                "tab_switch_count": 0,
            })


    class SubmitExamAPIView(APIView):
        authentication_classes = []
        permission_classes = [AllowAny]

        def post(self, request):
            user = get_user_from_token_or_session(request)
            if not user:
                return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
            if get_user_role(user) != "student":
                return Response({"detail": "Only students can submit exams."}, status=status.HTTP_403_FORBIDDEN)

            session_id = request.data.get("session_id")
            answers = request.data.get("answers", {})
            exam_id = request.data.get("exam_id")

            try:
                session = ExamSession.objects.get(id=session_id)
            except ExamSession.DoesNotExist:
                return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

            if session.user_id != user.id:
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            if session.status != "active":
                return Response({"detail": "Exam already ended.", "status": session.status})

            exam = session.exam
            if exam_id and exam and str(exam.id) != str(exam_id):
                return Response({"detail": "Exam mismatch."}, status=status.HTTP_400_BAD_REQUEST)
            if not exam:
                return Response({"detail": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)
            if not exam.allowed_students.filter(id=user.id).exists():
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            if not isinstance(answers, dict):
                return Response({"detail": "answers must be a JSON object."}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate score
            questions = list(exam.question_items.all())
            total_marks = sum(q.marks for q in questions)
            score = 0
            for q in questions:
                user_answer = answers.get(str(q.id))
                if user_answer is None:
                    user_answer = answers.get(q.id)
                if user_answer is None:
                    continue
                try:
                    answer_index = int(user_answer)
                except (TypeError, ValueError):
                    continue
                if answer_index == q.correct_answer:
                    score += q.marks

            if exam.total_marks != total_marks:
                exam.total_marks = total_marks
                exam.save(update_fields=["total_marks"])

            session.status = "completed"
            session.end_time = timezone.now()
            session.save()

            ExamAttempt.objects.create(
                user=user,
                exam=exam,
                answers=answers,
                score=score,
            )

            email_sent = True
            try:
                send_exam_result_email(user, exam, score, total_marks)
            except Exception:
                email_sent = False
                logger.exception("Failed to send exam result email")

            return Response({
                "status": "completed",
                "score": score,
                "total": total_marks,
                "percentage": round((score / total_marks) * 100, 1) if total_marks > 0 else 0,
                "email_sent": email_sent,
            })


    class TabSwitchAPIView(APIView):
        authentication_classes = []
        permission_classes = [AllowAny]

        def post(self, request):
            user = get_user_from_token_or_session(request)
            if not user:
                return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
            if get_user_role(user) != "student":
                return Response({"detail": "Only students can report tab switches."}, status=status.HTTP_403_FORBIDDEN)

            session_id = request.data.get("session_id")
            event_type = request.data.get("event", "Tab Switch")

            try:
                session = ExamSession.objects.get(id=session_id)
            except ExamSession.DoesNotExist:
                return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

            if session.status != "active":
                return Response({"detail": "Exam already ended.", "status": session.status})

            if session.user_id != user.id:
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

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
            risk_score = 5 if "External Application" in event_type else 4
            
            log = ProctoringLog.objects.create(
                user=user,
                user_label=user.username,
                event=event_type,
                risk_score=risk_score,
                session=session,
            )

            # Broadcast alert
            payload = {
                "user_id": user.username,
                "email": user.email,
                "event": event_type,
                "risk_score": risk_score,
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
                "event": event_type,
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

            # --- Store live frame for admin monitoring ---
            if session_id:
                try:
                    raw_b64 = str(image_data)
                    if "," in raw_b64:
                        _, raw_b64 = raw_b64.split(",", 1)
                    raw_b64 = raw_b64.strip()
                    padding = len(raw_b64) % 4
                    if padding:
                        raw_b64 += "=" * (4 - padding)
                    jpeg_bytes = base64.b64decode(raw_b64)
                    store_live_frame(int(session_id), jpeg_bytes)
                except Exception:
                    pass  # non-critical — don't block detection

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
                        # test if url exists
                        _ = log_entry.image.url
                        try:
                            image_url = request.build_absolute_uri(log_entry.image.url)
                        except Exception:
                            image_url = log_entry.image.url
                    except Exception:
                        image_url = ""

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


    # ---------- Live Frame Upload / Serve ----------

    class UploadFrameAPIView(APIView):
        """Lightweight endpoint for students to upload webcam frames (no AI detection)."""
        authentication_classes = []
        permission_classes = [AllowAny]

        def post(self, request):
            image_data = request.data.get("image")
            session_id = request.data.get("session_id")

            if not image_data or not session_id:
                return Response({"detail": "image and session_id required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                raw_b64 = str(image_data)
                if "," in raw_b64:
                    _, raw_b64 = raw_b64.split(",", 1)
                raw_b64 = raw_b64.strip()
                padding = len(raw_b64) % 4
                if padding:
                    raw_b64 += "=" * (4 - padding)
                jpeg_bytes = base64.b64decode(raw_b64)
                store_live_frame(int(session_id), jpeg_bytes)
            except Exception as exc:
                return Response({"detail": f"Invalid image: {exc}"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"status": "ok"})


    class SessionFrameAPIView(APIView):
        """Serve the latest webcam frame for a session as a JPEG image."""
        authentication_classes = []
        permission_classes = [AllowAny]

        def get(self, request, pk):
            from django.http import HttpResponse

            frame_bytes = get_live_frame(pk)
            if frame_bytes is None:
                # Return a 1x1 transparent pixel so <img> doesn't break
                return HttpResponse(status=204)

            return HttpResponse(frame_bytes, content_type="image/jpeg")


    # ---------- Logs ----------

    class LogListAPIView(generics.ListAPIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]
        serializer_class = ProctoringLogSerializer

        def get_queryset(self):
            queryset = ProctoringLog.objects.select_related("user", "session", "session__exam").all()
            if get_user_role(self.request.user) == "examiner":
                subject = get_user_subject(self.request.user)
                if subject:
                    queryset = queryset.filter(session__exam__subject=subject)
                else:
                    queryset = queryset.none()
            return queryset[:200]

        def get_serializer_context(self):
            context = super().get_serializer_context()
            context["request"] = self.request
            return context


    # ---------- User Management ----------

    class UserListAPIView(generics.ListAPIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]
        serializer_class = UserSerializer

        def get_queryset(self):
            queryset = User.objects.all().select_related("profile")
            if get_user_role(self.request.user) == "examiner":
                queryset = queryset.filter(profile__role="student")
            return queryset


    class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
        authentication_classes = [UserHeaderAuthentication]
        queryset = User.objects.all().select_related("profile")
        serializer_class = UserUpdateSerializer

        def get_permissions(self):
            if self.request.method == "GET":
                return [IsAdminOrExaminer()]
            return [IsAdminUser()]

        def get_object(self):
            obj = super().get_object()
            if get_user_role(self.request.user) == "examiner":
                try:
                    if obj.profile.role != "student":
                        raise PermissionDenied("Access denied.")
                except Profile.DoesNotExist:
                    raise PermissionDenied("Access denied.")
            return obj


    # ---------- Active Sessions ----------

    class ActiveSessionsAPIView(APIView):
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]

        def get(self, request):
            sessions = ExamSession.objects.select_related("user", "user__profile", "exam").all()
            if get_user_role(request.user) == "examiner":
                subject = get_user_subject(request.user)
                if subject:
                    sessions = sessions.filter(exam__subject=subject)
                else:
                    sessions = sessions.none()
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
        authentication_classes = [UserHeaderAuthentication]
        permission_classes = [IsAdminOrExaminer]

        def get(self, request, pk):
            try:
                session = ExamSession.objects.select_related("user", "exam").get(id=pk)
            except ExamSession.DoesNotExist:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

            if get_user_role(request.user) == "examiner":
                subject = get_user_subject(request.user)
                if not subject or not session.exam or session.exam.subject != subject:
                    return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            logs = ProctoringLog.objects.filter(session=session).order_by("-timestamp")
            log_data = ProctoringLogSerializer(logs, many=True, context={"request": request}).data

            return Response({
                "session": ExamSessionSerializer(session).data,
                "logs": log_data,
            })


    # ---------- Adoption Metrics ----------

    class AdoptionStatsAPIView(APIView):
        authentication_classes = []
        permission_classes = [AllowAny]

        def get(self, request):
            total_sessions = ExamSession.objects.count()
            completed_exams = ExamSession.objects.filter(status="completed").count()
            disqualified_exams = ExamSession.objects.filter(status="disqualified").count()
            active_exams = ExamSession.objects.filter(status="active").count()
            total_exams = completed_exams + disqualified_exams
            total_users = User.objects.count()

            return Response({
                "total_exams": total_exams,
                "completed_exams": completed_exams,
                "disqualified_exams": disqualified_exams,
                "active_exams": active_exams,
                "total_sessions": total_sessions,
                "total_users": total_users,
            })