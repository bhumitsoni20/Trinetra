from django.db import models


class ProctoringLog(models.Model):
    user_id = models.CharField(max_length=120, db_index=True)
    event = models.CharField(max_length=120, db_index=True)
    risk_score = models.PositiveSmallIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"{self.user_id} - {self.event} ({self.risk_score})"
