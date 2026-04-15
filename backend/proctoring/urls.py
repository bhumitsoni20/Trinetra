from django.urls import path

from .views import (
    ActiveSessionsAPIView,
    AdoptionStatsAPIView,
    CreateExamAPIView,
    DetectAPIView,
    LoginAPIView,
    LogListAPIView,
    RegisterAPIView,
    SessionDetailAPIView,
    StartExamAPIView,
    SubmitExamAPIView,
    TabSwitchAPIView,
    UserDetailAPIView,
    UserListAPIView,
    UploadFrameAPIView,
    SessionFrameAPIView,
)
from .webrtc_views import WebRTCOfferView, WebRTCAnswerView

urlpatterns = [
    # Auth
    path("login/", LoginAPIView.as_view(), name="login"),
    path("register/", RegisterAPIView.as_view(), name="register"),

    # Exam
    path("start-exam/", StartExamAPIView.as_view(), name="start-exam"),
    path("exams/create/", CreateExamAPIView.as_view(), name="create-exam"),
    path("submit-exam/", SubmitExamAPIView.as_view(), name="submit-exam"),
    path("tab-switch/", TabSwitchAPIView.as_view(), name="tab-switch"),

    # Detection
    path("detect/", DetectAPIView.as_view(), name="detect"),

    # Live Frames
    path("frames/upload/", UploadFrameAPIView.as_view(), name="upload-frame"),
    path("frames/<int:pk>/", SessionFrameAPIView.as_view(), name="session-frame"),

    # Logs
    path("logs/", LogListAPIView.as_view(), name="logs"),

    # Users
    path("users/", UserListAPIView.as_view(), name="users"),
    path("users/<int:pk>/", UserDetailAPIView.as_view(), name="user-detail"),

    # Sessions
    path("sessions/", ActiveSessionsAPIView.as_view(), name="sessions"),
    path("sessions/<int:pk>/", SessionDetailAPIView.as_view(), name="session-detail"),

    # Metrics
    path("metrics/adoption/", AdoptionStatsAPIView.as_view(), name="adoption-metrics"),

    # WebRTC Signaling
    path("webrtc/offer/<int:pk>/", WebRTCOfferView.as_view(), name="webrtc-offer"),
    path("webrtc/answer/<int:pk>/", WebRTCAnswerView.as_view(), name="webrtc-answer"),
]
