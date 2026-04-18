import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { Dish, ScheduleItem } from '../types';

const DB_STORAGE_KEY = 'lifeassistant.sqlite.v1';
const SESSION_STORAGE_KEY = 'lifeassistant.session.v1';

export interface LocalUser {
  id: string;
  email: string;
}

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let dbPromise: Promise<Database> | null = null;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => wasmUrl,
    });
  }

  return sqlJsPromise;
}

async function initDb(): Promise<Database> {
  const SQL = await getSqlJs();
  const serialized = localStorage.getItem(DB_STORAGE_KEY);
  const db = serialized ? new SQL.Database(fromBase64(serialized)) : new SQL.Database();

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  persistDb(db);

  return db;
}

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = initDb();
  }

  return dbPromise;
}

function persistDb(db: Database): void {
  const exported = db.export();
  localStorage.setItem(DB_STORAGE_KEY, toBase64(exported));
}

function mapSingleTextColumnResult(rows: unknown[]): string[] {
  return rows
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .map((row) => Object.values(row)[0])
    .filter((value): value is string => typeof value === 'string');
}

function readSession(): LocalUser | null {
  const value = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as LocalUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(user: LocalUser | null): void {
  if (!user) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return toBase64(new Uint8Array(digest));
}

async function findUserByEmail(email: string): Promise<{ id: string; email: string; password_hash: string } | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
  stmt.bind([email.toLowerCase()]);

  let user: { id: string; email: string; password_hash: string } | null = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    user = {
      id: String(row.id),
      email: String(row.email),
      password_hash: String(row.password_hash),
    };
  }

  stmt.free();
  return user;
}

export async function getCurrentUser(): Promise<LocalUser | null> {
  return readSession();
}

export async function signUpWithPassword(email: string, password: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) throw new Error('Email is required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) throw new Error('An account with this email already exists');

  const db = await getDb();
  const id = crypto.randomUUID();
  const salt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await hashPassword(password, salt);

  db.run('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, normalizedEmail, `${salt}:${passwordHash}`]);
  persistDb(db);
}

export async function signInWithPassword(email: string, password: string): Promise<LocalUser> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) throw new Error('Invalid email or password');

  const [salt, storedHash] = user.password_hash.split(':');
  if (!salt || !storedHash) throw new Error('Invalid email or password');

  const passwordHash = await hashPassword(password, salt);
  if (storedHash !== passwordHash) throw new Error('Invalid email or password');

  const sessionUser: LocalUser = { id: user.id, email: user.email };
  writeSession(sessionUser);
  return sessionUser;
}

export async function signOutSession(): Promise<void> {
  writeSession(null);
}

export async function listDishesByUser(userId: string): Promise<Dish[]> {
  const db = await getDb();
  const stmt = db.prepare('SELECT data FROM dishes WHERE user_id = ?');
  stmt.bind([userId]);
  const rows: unknown[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  return mapSingleTextColumnResult(rows).map((data) => JSON.parse(data) as Dish);
}

export async function upsertDishForUser(userId: string, dish: Dish): Promise<Dish> {
  const db = await getDb();
  const payload = JSON.stringify(dish);

  db.run(
    `
      INSERT INTO dishes (id, user_id, data)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        data = excluded.data
    `,
    [dish.id, userId, payload]
  );

  persistDb(db);
  return dish;
}

export async function deleteDishForUser(userId: string, dishId: string): Promise<void> {
  const db = await getDb();
  db.run('DELETE FROM dishes WHERE id = ? AND user_id = ?', [dishId, userId]);
  persistDb(db);
}

export async function listScheduleByUser(userId: string): Promise<ScheduleItem[]> {
  const db = await getDb();
  const stmt = db.prepare('SELECT data FROM schedule_items WHERE user_id = ?');
  stmt.bind([userId]);
  const rows: unknown[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  return mapSingleTextColumnResult(rows).map((data) => JSON.parse(data) as ScheduleItem);
}

export async function upsertScheduleItemForUser(userId: string, item: ScheduleItem): Promise<ScheduleItem> {
  const db = await getDb();
  const payload = JSON.stringify(item);

  db.run(
    `
      INSERT INTO schedule_items (id, user_id, data)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        data = excluded.data
    `,
    [item.id, userId, payload]
  );

  persistDb(db);
  return item;
}

export async function deleteScheduleItemForUser(userId: string, itemId: string): Promise<void> {
  const db = await getDb();
  db.run('DELETE FROM schedule_items WHERE id = ? AND user_id = ?', [itemId, userId]);
  persistDb(db);
}
