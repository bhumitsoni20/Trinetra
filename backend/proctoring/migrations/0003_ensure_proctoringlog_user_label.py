from django.db import migrations


def add_user_label_column_if_missing(apps, schema_editor):
    connection = schema_editor.connection
    table_name = "proctoring_proctoringlog"
    existing_tables = set(connection.introspection.table_names())
    if table_name not in existing_tables:
        return

    with connection.cursor() as cursor:
        columns = {
            col.name
            for col in connection.introspection.get_table_description(cursor, table_name)
        }

    if "user_label" in columns:
        return

    schema_editor.execute(
        "ALTER TABLE proctoring_proctoringlog "
        "ADD COLUMN user_label varchar(120) NOT NULL DEFAULT ''"
    )
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS proctoring_proctoringlog_user_label_1d4c90cb "
        "ON proctoring_proctoringlog (user_label)"
    )


def noop(apps, schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("proctoring", "0002_repair_missing_tables"),
    ]

    operations = [
        migrations.RunPython(add_user_label_column_if_missing, noop),
    ]

