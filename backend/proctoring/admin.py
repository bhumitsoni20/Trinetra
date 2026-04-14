from django.contrib import admin

from .models import ProctoringLog


@admin.register(ProctoringLog)
class ProctoringLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user_id", "event", "risk_score")
    list_filter = ("event", "timestamp", "user_id")
    search_fields = ("user_id", "event")
    ordering = ("-timestamp",)
