from rest_framework import serializers

from .models import ProctoringLog


class ProctoringLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProctoringLog
        fields = ("id", "user_id", "event", "risk_score", "timestamp")
