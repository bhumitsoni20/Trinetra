from django.urls import path

from .views import DetectAPIView, LogListAPIView

urlpatterns = [
    path("detect/", DetectAPIView.as_view(), name="detect"),
    path("logs/", LogListAPIView.as_view(), name="logs"),
]
