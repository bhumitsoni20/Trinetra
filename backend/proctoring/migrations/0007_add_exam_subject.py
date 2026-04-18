from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("proctoring", "0006_add_profile_subject"),
    ]

    operations = [
        migrations.AddField(
            model_name="exam",
            name="subject",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
