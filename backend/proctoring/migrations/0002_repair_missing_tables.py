from django.db import migrations


def create_missing_tables(apps, schema_editor):
    connection = schema_editor.connection
    existing_tables = set(connection.introspection.table_names())

    exam_session_model = apps.get_model("proctoring", "ExamSession")
    profile_model = apps.get_model("proctoring", "Profile")

    if exam_session_model._meta.db_table not in existing_tables:
        schema_editor.create_model(exam_session_model)
        existing_tables.add(exam_session_model._meta.db_table)

    if profile_model._meta.db_table not in existing_tables:
        schema_editor.create_model(profile_model)


def noop(apps, schema_editor):
    return None


class Migration(migrations.Migration):

    dependencies = [
        ("proctoring", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_missing_tables, noop),
    ]
