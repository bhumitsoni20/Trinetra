from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("proctoring", "0005_exam_model_and_session_exam"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="subject",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
