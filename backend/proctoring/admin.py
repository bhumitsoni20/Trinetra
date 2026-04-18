from django.contrib import admin

from .models import Exam, ExamAttempt, ExamSession, ProctoringLog, Profile, Question


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")


@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "violations_count", "tab_switch_count", "start_time", "end_time")
    list_filter = ("status",)
    search_fields = ("user__username", "user__email")
    ordering = ("-start_time",)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "duration", "total_marks", "created_by", "created_at")
    list_filter = ("subject", "created_at")
    search_fields = ("title", "subject", "created_by__username", "created_by__email")
    ordering = ("-created_at",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("exam", "order", "marks")
    list_filter = ("exam",)
    search_fields = ("exam__title", "question_text")
    ordering = ("exam", "order")


@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "exam", "score", "submitted_at")
    list_filter = ("exam", "submitted_at")
    search_fields = ("user__username", "user__email", "exam__title")
    ordering = ("-submitted_at",)


@admin.register(ProctoringLog)
class ProctoringLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "user_label", "event", "risk_score")
    list_filter = ("event", "timestamp")
    search_fields = ("user_label", "event", "user__username")
    ordering = ("-timestamp",)
