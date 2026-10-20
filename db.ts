import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env BEFORE reading any DB_* variable.
// server.ts also calls dotenv.config(), but ES module imports are evaluated
// before the importing module's body, so this module would otherwise see an
// empty environment and silently fall back to the defaults below.
dotenv.config();

// ─────────────────────────────────────────────
// MySQL connection configuration
// ─────────────────────────────────────────────
const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillbridge',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  // Read and write DATETIME columns as UTC so the values line up with what
  // SQLite's datetime('now') produced (which is UTC).
  timezone: 'Z',
  // Hand DATETIME back as 'YYYY-MM-DD HH:MM:SS' instead of a JS Date.
  dateStrings: true,
  supportBigNumbers: true,
};

/**
 * Pool of MySQL connections.
 *
 * The session time zone is forced to UTC on every new connection so that
 * server-side DEFAULT CURRENT_TIMESTAMP produces UTC values. Without this the
 * timestamps would depend on the machine's local time zone and drift from
 * what the SQLite version stored.
 */
export const pool = mysql.createPool(config);

pool.on('connection', (conn: any) => {
  conn.query("SET time_zone = '+00:00'");
});

/**
 * Run a SELECT and return every row.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as unknown as T[];
}

/**
 * Run a SELECT and return the first row, or null.
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Run an INSERT / UPDATE / DELETE.
 */
export async function execute(
  sql: string,
  params: any[] = []
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/**
 * Select createdAt as an unambiguous ISO-8601 UTC string.
 *
 * MySQL returns '2026-10-20 16:33:23', which JavaScript would parse as local
 * time. Formatting it here as ...T...Z keeps the frontend's
 * `new Date(iso)` behaving exactly as it did against SQLite.
 */
export const CREATED_AT_ISO =
  "DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s.000Z') AS createdAt";

/**
 * Parse a JSON column. MySQL's driver already returns native objects for
 * JSON columns, but this keeps working if a value ever arrives as a string.
 */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

/**
 * Apply schema.sql. Idempotent - every statement is CREATE ... IF NOT EXISTS.
 *
 * If the configured user cannot create the schema, this fails loudly with a
 * pointer to schema.sql rather than crashing the server on boot.
 */
export async function initDb(): Promise<void> {
  const sql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');

  // Connect without selecting a database so CREATE DATABASE can run first.
  const bootstrap = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
    timezone: 'Z',
  });

  try {
    await bootstrap.query(sql);
    console.log(`MySQL schema ready on ${config.host}:${config.port}/${config.database}`);
  } catch (err: any) {
    console.error(
      `Failed to apply schema.sql: ${err.message}\n` +
        `Either import schema.sql manually in MySQL Workbench, or grant the ` +
        `user "${config.user}" privileges on ${config.database}.`
    );
    throw err;
  } finally {
    await bootstrap.end();
  }
}

/**
 * Close the pool. Called on shutdown so the process can exit cleanly.
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}
