import json
import logging
import os
import sqlite3
from typing import Optional

import numpy as np

logger = logging.getLogger("remind.db")

# Per-user in-memory cache: user_id -> list of embedding dicts.
# Invalidated on every register or delete for that user.
_cache: dict[int, list[dict]] = {}


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

def get_db():
    path = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "remind.db"))
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------------------------
# Schema init & migrations
# ---------------------------------------------------------------------------

def init_db() -> None:
    conn = get_db()
    try:
        cur = conn.cursor()

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT NOT NULL UNIQUE,
                display_name  TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS people (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      INTEGER REFERENCES users(id),
                group_id     INTEGER,
                name         TEXT NOT NULL,
                relationship TEXT NOT NULL,
                age          INTEGER,
                extra        TEXT,
                phone        TEXT,
                photo        TEXT,
                embedding    TEXT NOT NULL,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # Migrations must run before index creation — indexes depend on migrated columns.
        cur.execute("PRAGMA table_info(people)")
        cols = {r[1] for r in cur.fetchall()}
        for col, defn in [
            ("user_id",      "INTEGER"),
            ("group_id",     "INTEGER"),
            ("age",          "INTEGER"),
            ("extra",        "TEXT"),
            ("phone",        "TEXT"),
            ("photo",        "TEXT"),
            ("is_emergency", "INTEGER DEFAULT 0"),
        ]:
            if col not in cols:
                cur.execute(f"ALTER TABLE people ADD COLUMN {col} {defn}")

        cur.execute("CREATE INDEX IF NOT EXISTS idx_people_user  ON people (user_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_people_group ON people (group_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email  ON users  (email)")

        # Backfill group_id for legacy rows.
        cur.execute(
            """
            UPDATE people
            SET group_id = (
                SELECT MIN(p2.id)
                FROM people p2
                WHERE p2.name = people.name AND p2.relationship = people.relationship
            )
            WHERE group_id IS NULL
            """
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def create_user(email: str, display_name: str, password_hash: str) -> int:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)",
            (email.lower().strip(), display_name.strip(), password_hash),
        )
        conn.commit()
        return cur.lastrowid  # type: ignore[return-value]
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, email, display_name, password_hash FROM users WHERE email = ?", (email.lower().strip(),))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_password_hash(user_id: int) -> Optional[str]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return row["password_hash"] if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, email, display_name FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Embeddings cache
# ---------------------------------------------------------------------------

def invalidate_cache(user_id: int) -> None:
    _cache.pop(user_id, None)


def get_embeddings_cached(user_id: int) -> list[dict]:
    if user_id not in _cache:
        _cache[user_id] = _load_embeddings(user_id)
    return _cache[user_id]


def _load_embeddings(user_id: int) -> list[dict]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, relationship, age, extra, group_id, embedding FROM people WHERE user_id = ?",
            (user_id,),
        )
        rows = cur.fetchall()
        result = []
        for row in rows:
            try:
                emb_list = json.loads(row["embedding"])
            except Exception:
                raw = row["embedding"]
                emb_list = list(map(float, raw.strip("[]").split(","))) if raw else []
            result.append(
                {
                    "id":           row["id"],
                    "name":         row["name"],
                    "relationship": row["relationship"],
                    "age":          row["age"],
                    "extra":        row["extra"],
                    "group_id":     row["group_id"],
                    "embedding":    np.array(emb_list, dtype=np.float64),
                }
            )
        return result
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# People CRUD
# ---------------------------------------------------------------------------

def get_all_people(user_id: int) -> list[dict]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, name, relationship, age, extra, phone, photo, is_emergency, created_at
            FROM people
            WHERE user_id = ? AND group_id = id
            ORDER BY id
            """,
            (user_id,),
        )
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def get_person_photo(primary_id: int) -> Optional[str]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT photo FROM people WHERE id = ?", (primary_id,))
        row = cur.fetchone()
        return row["photo"] if row else None
    finally:
        conn.close()


def save_person(
    user_id:      int,
    name:         str,
    relationship: str,
    embeddings:   list[list[float]],
    age:          Optional[int]  = None,
    extra:        Optional[str]  = None,
    phone:        Optional[str]  = None,
    photo:        Optional[str]  = None,
    is_emergency: bool           = False,
) -> int:
    conn = get_db()
    try:
        cur = conn.cursor()

        if is_emergency:
            cur.execute("UPDATE people SET is_emergency=0 WHERE user_id=?", (user_id,))

        cur.execute(
            """
            INSERT INTO people (user_id, name, relationship, age, extra, phone, photo, embedding, group_id, is_emergency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
            """,
            (user_id, name, relationship, age, extra, phone, photo, json.dumps(embeddings[0]), int(is_emergency)),
        )
        primary_id = cur.lastrowid
        cur.execute("UPDATE people SET group_id = ? WHERE id = ?", (primary_id, primary_id))

        for emb in embeddings[1:]:
            cur.execute(
                """
                INSERT INTO people (user_id, name, relationship, age, extra, phone, photo, embedding, group_id, is_emergency)
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
                """,
                (user_id, name, relationship, age, extra, phone, json.dumps(emb), primary_id, int(is_emergency)),
            )

        conn.commit()
        return primary_id  # type: ignore[return-value]
    except Exception as e:
        conn.rollback()
        logger.error(f"Error al guardar persona: {e}")
        raise
    finally:
        conn.close()


def get_person_by_id(person_id: int, user_id: int) -> Optional[dict]:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, relationship, age, extra, phone, photo FROM people WHERE id = ? AND user_id = ? AND group_id = id",
            (person_id, user_id),
        )
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_person_metadata(
    group_id: int,
    user_id: int,
    name: str,
    relationship: str,
    age: Optional[int] = None,
    extra: Optional[str] = None,
    phone: Optional[str] = None,
    photo: Optional[str] = None,
    is_emergency: bool = False,
) -> bool:
    conn = get_db()
    try:
        cur = conn.cursor()
        if is_emergency:
            cur.execute(
                "UPDATE people SET is_emergency=0 WHERE user_id=? AND group_id != ?",
                (user_id, group_id),
            )
        cur.execute(
            "UPDATE people SET name=?, relationship=?, age=?, extra=?, phone=?, is_emergency=? WHERE group_id=? AND user_id=?",
            (name, relationship, age, extra, phone, int(is_emergency), group_id, user_id),
        )
        if photo:
            cur.execute(
                "UPDATE people SET photo=? WHERE id=? AND user_id=?",
                (photo, group_id, user_id),
            )
        updated = cur.rowcount > 0
        conn.commit()
        return updated
    finally:
        conn.close()


def delete_person(person_id: int, user_id: int) -> int:
    """Deletes all embedding rows for the given person, scoped to user_id."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM people WHERE group_id = ? AND user_id = ?",
            (person_id, user_id),
        )
        deleted = cur.rowcount
        conn.commit()
        return deleted
    finally:
        conn.close()


def delete_all_people(user_id: int) -> int:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM people WHERE user_id = ?", (user_id,))
        deleted = cur.rowcount
        conn.commit()
        return deleted
    finally:
        conn.close()


def reset_all_data() -> dict:
    global _cache
    _cache = {}
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM people")
        people_deleted = cur.rowcount
        cur.execute("DELETE FROM users")
        users_deleted = cur.rowcount
        conn.commit()
        return {"people": people_deleted, "users": users_deleted}
    finally:
        conn.close()
