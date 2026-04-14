from django.contrib import admin

from .models import ExamSession, ProctoringLog, Profile


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


@admin.register(ProctoringLog)
class ProctoringLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "user_label", "event", "risk_score")
    list_filter = ("event", "timestamp")
    search_fields = ("user_label", "event", "user__username")
    ordering = ("-timestamp",)
