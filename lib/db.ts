import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DATABASE_PATH ?? './data/mail.db';
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS received_emails (
    id TEXT PRIMARY KEY,
    from_addr TEXT NOT NULL,
    to_addrs TEXT NOT NULL,
    subject TEXT,
    text TEXT,
    html TEXT,
    received_at TEXT NOT NULL,
    raw_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_received_at ON received_emails(received_at DESC);
`);

export type ReceivedEmail = {
  id: string;
  from_addr: string;
  to_addrs: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  received_at: string;
  raw_json: string;
};

export function insertReceived(row: ReceivedEmail) {
  db.prepare(
    `INSERT OR REPLACE INTO received_emails
     (id, from_addr, to_addrs, subject, text, html, received_at, raw_json)
     VALUES (@id, @from_addr, @to_addrs, @subject, @text, @html, @received_at, @raw_json)`
  ).run(row);
}

export function listReceived(limit = 100): ReceivedEmail[] {
  return db
    .prepare(`SELECT * FROM received_emails ORDER BY received_at DESC LIMIT ?`)
    .all(limit) as ReceivedEmail[];
}

export function getReceived(id: string): ReceivedEmail | undefined {
  return db
    .prepare(`SELECT * FROM received_emails WHERE id = ?`)
    .get(id) as ReceivedEmail | undefined;
}
