from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ProctoringLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_id", models.CharField(db_index=True, max_length=120)),
                ("event", models.CharField(db_index=True, max_length=120)),
                ("risk_score", models.PositiveSmallIntegerField()),
                ("timestamp", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "ordering": ["-timestamp"],
            },
        ),
    ]
