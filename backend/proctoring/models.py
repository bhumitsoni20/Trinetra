import os
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models


def snapshot_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    return os.path.join("snapshots", f"{uuid.uuid4().hex}.{ext}")


class Profile(models.Model):
    ROLE_CHOICES = (
        ("student", "Student"),
        ("admin", "Admin"),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Exam(models.Model):
    title = models.CharField(max_length=255)
    questions = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_exams",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ExamSession(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("completed", "Completed"),
        ("disqualified", "Disqualified"),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="exam_sessions")
    exam = models.ForeignKey(Exam, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions")
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    violations_count = models.PositiveIntegerField(default=0)
    tab_switch_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="active")
    time_remaining = models.PositiveIntegerField(default=3600, help_text="Remaining time in seconds")

    class Meta:
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.user.username} - {self.status} ({self.start_time})"


class ProctoringLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="proctor_logs", null=True, blank=True)
    user_label = models.CharField(max_length=120, db_index=True, blank=True, default="")
    event = models.CharField(max_length=120, db_index=True)
    risk_score = models.PositiveSmallIntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    image = models.ImageField(upload_to=snapshot_upload_path, null=True, blank=True)
    session = models.ForeignKey(ExamSession, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        name = self.user.username if self.user else self.user_label
        return f"{name} - {self.event} ({self.risk_score})"
