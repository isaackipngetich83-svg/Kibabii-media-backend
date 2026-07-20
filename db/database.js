const Database = require('better-sqlite3')
const path     = require('path')

const DB_PATH = path.join(__dirname, '..', 'kibucu.db')
const db      = new Database(DB_PATH)

// WAL mode gives much better concurrent read performance.
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Schema ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    reg_no         TEXT NOT NULL UNIQUE,
    gender         TEXT,
    dob            TEXT,
    email          TEXT,
    phone          TEXT,
    password_hash  TEXT NOT NULL,
    ministry_roles TEXT NOT NULL DEFAULT '[]',
    is_admin       INTEGER NOT NULL DEFAULT 0,
    avatar_variant TEXT NOT NULL DEFAULT 'neutral',
    bio            TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id           TEXT PRIMARY KEY,
    day          TEXT NOT NULL,
    date         TEXT NOT NULL,
    time         TEXT NOT NULL,
    call_time    TEXT NOT NULL,
    title        TEXT NOT NULL,
    roles_needed TEXT NOT NULL DEFAULT '[]',
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS availability (
    id         TEXT PRIMARY KEY,
    member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'none',
    note       TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (member_id, service_id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id         TEXT PRIMARY KEY,
    member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    attended   INTEGER NOT NULL DEFAULT 0,
    marked_at  TEXT,
    UNIQUE (member_id, service_id)
  );

  CREATE TABLE IF NOT EXISTS lineups (
    id         TEXT PRIMARY KEY,
    service_id TEXT NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
    published  INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lineup_assignments (
    id         TEXT PRIMARY KEY,
    lineup_id  TEXT NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
    role       TEXT NOT NULL,
    member_id  TEXT REFERENCES members(id) ON DELETE SET NULL,
    UNIQUE (lineup_id, role)
  );

  CREATE TABLE IF NOT EXISTS slot_requests (
    id              TEXT PRIMARY KEY,
    member_id       TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    service_id      TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    requested_roles TEXT NOT NULL DEFAULT '[]',
    submitted_at    TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed        INTEGER NOT NULL DEFAULT 0,
    UNIQUE (member_id, service_id)
  );

  CREATE TABLE IF NOT EXISTS inbox_items (
    id             TEXT PRIMARY KEY,
    type           TEXT NOT NULL,
    title          TEXT NOT NULL,
    body           TEXT NOT NULL,
    recipient_id   TEXT,
    recipient_role TEXT,
    posted_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inbox_reads (
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    item_id   TEXT NOT NULL REFERENCES inbox_items(id) ON DELETE CASCADE,
    read_at   TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (member_id, item_id)
  );

  CREATE TABLE IF NOT EXISTS roles (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
`)

module.exports = db

// ── Migrations ───────────────────────────────────────────────────
// Add image_url column if it doesn't exist yet.
try { db.exec('ALTER TABLE inbox_items ADD COLUMN image_url TEXT') } catch (_) {}
