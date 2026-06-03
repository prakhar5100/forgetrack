import os
import sqlite3

DB_PATH = os.getenv("DB_PATH", "./workout.db")
TURSO_URL = os.getenv("TURSO_DATABASE_URL", "")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")


def _row_factory(cursor, row):
    """
    Universal row factory compatible with both sqlite3 and libsql_experimental.
    Supports row["col"], row[0], and dict(row) — no router changes needed.
    """
    fields = [d[0] for d in cursor.description]

    class _Row:
        def __getitem__(self, k):
            return row[k] if isinstance(k, int) else row[fields.index(k)]

        def keys(self):
            return fields

        def __iter__(self):
            return iter(row)

    return _Row()


# DDL split into individual statements (executescript not available in libsql)
_CREATE_TABLES = [
    """CREATE TABLE IF NOT EXISTS muscle_groups (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT    NOT NULL UNIQUE,
        color_hex TEXT    NOT NULL,
        icon      TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS exercises (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        name             TEXT    NOT NULL,
        muscle_group_id  INTEGER NOT NULL REFERENCES muscle_groups(id),
        equipment        TEXT,
        primary_muscles  TEXT,
        cues             TEXT,
        image_url        TEXT,
        video_url        TEXT,
        reference_link   TEXT,
        is_active        INTEGER NOT NULL DEFAULT 1,
        created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    )""",
    """CREATE TABLE IF NOT EXISTS workout_logs (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        date             TEXT    NOT NULL,
        week_number      INTEGER NOT NULL,
        muscle_group_id  INTEGER NOT NULL REFERENCES muscle_groups(id),
        exercise_id      INTEGER NOT NULL REFERENCES exercises(id),
        sets             INTEGER NOT NULL,
        reps             INTEGER NOT NULL,
        weight_kg        REAL    NOT NULL DEFAULT 0,
        unit             TEXT    NOT NULL DEFAULT 'kg',
        form_rating      TEXT,
        energy_level     TEXT,
        notes            TEXT,
        total_volume_kg  REAL    NOT NULL DEFAULT 0,
        created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    )""",
    """CREATE TABLE IF NOT EXISTS progress_photos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        date       TEXT    NOT NULL,
        image_url  TEXT    NOT NULL,
        weight_kg  REAL,
        notes      TEXT,
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )""",
]


def get_connection():
    """
    Returns a DB connection.
    - Production (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN set): uses Turso via libsql_experimental
    - Local dev (no env vars): uses local SQLite file
    """
    if TURSO_URL and TURSO_TOKEN:
        import libsql_experimental as libsql  # only needed in production
        conn = libsql.connect(TURSO_URL, auth_token=TURSO_TOKEN)
    else:
        conn = sqlite3.connect(
            DB_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        )
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")

    conn.row_factory = _row_factory
    return conn


def init_db():
    """Create all tables if they don't exist. Called on every startup."""
    conn = get_connection()
    for sql in _CREATE_TABLES:
        conn.execute(sql)
    conn.commit()
    conn.close()
