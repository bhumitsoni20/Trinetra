from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("proctoring", "0007_add_exam_subject"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="exam",
            name="duration",
            field=models.PositiveIntegerField(default=60, help_text="Duration in minutes"),
        ),
        migrations.AddField(
            model_name="exam",
            name="total_marks",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="exam",
            name="allowed_students",
            field=models.ManyToManyField(blank=True, related_name="allowed_exams", to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name="Question",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("question_text", models.TextField()),
                ("options", models.JSONField(default=list)),
                ("correct_answer", models.PositiveSmallIntegerField(default=0)),
                ("marks", models.PositiveSmallIntegerField(default=1)),
                ("order", models.PositiveIntegerField(default=0)),
                ("exam", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="question_items", to="proctoring.exam")),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="ExamAttempt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("answers", models.JSONField(default=dict)),
                ("score", models.PositiveIntegerField(default=0)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("exam", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attempts", to="proctoring.exam")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="exam_attempts", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-submitted_at"]},
        ),
    ]
