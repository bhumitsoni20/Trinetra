"""
Repair migration: rebuild proctoring_proctoringlog with correct schema.

The table was originally created with user_id as varchar(120) instead of
an integer FK referencing auth_user. SQLite does not support ALTER COLUMN,
so we recreate the table with the correct column definitions while
preserving as much data as possible.
"""

from django.db import migrations


def rebuild_proctoringlog_table(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        # Check if the table exists at all
        existing_tables = set(connection.introspection.table_names())
        if "proctoring_proctoringlog" not in existing_tables:
            return

        # Check user_id column type to decide if rebuild is needed
        columns = {
            col.name: col
            for col in connection.introspection.get_table_description(
                cursor, "proctoring_proctoringlog"
            )
        }

        needs_rebuild = False
        # If user_id is varchar instead of integer, we need to rebuild
        cursor.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='proctoring_proctoringlog'"
        )
        row = cursor.fetchone()
        if row and "varchar" in (row[0] or "").lower().split("user_id")[0:2][-1][:30] if row[0] and "user_id" in row[0] else False:
            needs_rebuild = True

        # Also check for missing columns
        if "session_id" not in columns or "image" not in columns:
            needs_rebuild = True

        # Simpler check: just see if user_id column type mismatch
        if not needs_rebuild:
            create_sql = row[0] if row else ""
            if "user_id" in create_sql:
                # If the CREATE TABLE has user_id as varchar, rebuild
                import re
                match = re.search(r'user_id["\s]+varchar', create_sql, re.IGNORECASE)
                if match:
                    needs_rebuild = True

        if not needs_rebuild:
            # Still add session_id and image if missing
            if "session_id" not in columns:
                cursor.execute(
                    "ALTER TABLE proctoring_proctoringlog "
                    "ADD COLUMN session_id bigint NULL REFERENCES proctoring_examsession(id)"
                )
            if "image" not in columns:
                cursor.execute(
                    "ALTER TABLE proctoring_proctoringlog "
                    "ADD COLUMN image varchar(100) NULL"
                )
            return

        # --- Full rebuild needed ---

        # 1. Rename old table
        cursor.execute(
            "ALTER TABLE proctoring_proctoringlog RENAME TO _proctoringlog_old"
        )

        # 2. Create new table with correct schema
        cursor.execute("""
            CREATE TABLE "proctoring_proctoringlog" (
                "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                "user_label" varchar(120) NOT NULL DEFAULT '',
                "event" varchar(120) NOT NULL,
                "risk_score" smallint unsigned NOT NULL DEFAULT 0,
                "timestamp" datetime NOT NULL,
                "image" varchar(100) NULL,
                "session_id" bigint NULL REFERENCES "proctoring_examsession" ("id")
                    DEFERRABLE INITIALLY DEFERRED,
                "user_id" bigint NULL REFERENCES "auth_user" ("id")
                    DEFERRABLE INITIALLY DEFERRED
            )
        """)

        # 3. Copy data — match user_label from old user_id (varchar),
        #    and try to resolve integer user FK where possible
        cursor.execute("""
            INSERT INTO "proctoring_proctoringlog"
                (id, user_label, event, risk_score, timestamp, image, session_id, user_id)
            SELECT
                o.id,
                COALESCE(o.user_label, CAST(o.user_id AS TEXT), ''),
                o.event,
                o.risk_score,
                o.timestamp,
                o.image,
                o.session_id,
                CASE
                    WHEN typeof(o.user_id) = 'integer' THEN o.user_id
                    WHEN o.user_id GLOB '[0-9]*' AND CAST(o.user_id AS INTEGER) > 0
                        THEN CASE
                            WHEN EXISTS(SELECT 1 FROM auth_user WHERE id = CAST(o.user_id AS INTEGER))
                            THEN CAST(o.user_id AS INTEGER)
                            ELSE NULL
                        END
                    ELSE NULL
                END
            FROM _proctoringlog_old o
        """)

        # 4. Recreate indexes
        cursor.execute(
            'CREATE INDEX "proctoring_proctoringlog_user_label_idx" '
            'ON "proctoring_proctoringlog" ("user_label")'
        )
        cursor.execute(
            'CREATE INDEX "proctoring_proctoringlog_event_idx" '
            'ON "proctoring_proctoringlog" ("event")'
        )
        cursor.execute(
            'CREATE INDEX "proctoring_proctoringlog_timestamp_idx" '
            'ON "proctoring_proctoringlog" ("timestamp")'
        )
        cursor.execute(
            'CREATE INDEX "proctoring_proctoringlog_session_id_idx" '
            'ON "proctoring_proctoringlog" ("session_id")'
        )
        cursor.execute(
            'CREATE INDEX "proctoring_proctoringlog_user_id_idx" '
            'ON "proctoring_proctoringlog" ("user_id")'
        )

        # 5. Drop old table
        cursor.execute("DROP TABLE _proctoringlog_old")


def noop(apps, schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("proctoring", "0003_ensure_proctoringlog_user_label"),
    ]

    operations = [
        migrations.RunPython(rebuild_proctoringlog_table, noop),
    ]
