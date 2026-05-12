import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const instances = sqliteTable("instances", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  containerId: text("container_id"),
  port: integer("port").notNull().unique(),
  wsPort: integer("ws_port"),
  status: text("status", { enum: ["running", "stopped", "error", "creating"] })
    .notNull()
    .default("stopped"),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`datetime('now')`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`datetime('now')`),
})

export const operationLogs = sqliteTable("operation_logs", {
  id: text("id").primaryKey(),
  instanceId: text("instance_id").notNull(),
  instanceName: text("instance_name").notNull(),
  action: text("action").notNull(),
  detail: text("detail"),
  success: integer("success", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`datetime('now')`),
})

export type Instance = typeof instances.$inferSelect
export type NewInstance = typeof instances.$inferInsert
export type OperationLog = typeof operationLogs.$inferSelect

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "nanobot-admin.db")

import path from "path"
import fs from "fs"

const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    container_id TEXT,
    port INTEGER NOT NULL UNIQUE,
    ws_port INTEGER,
    status TEXT NOT NULL DEFAULT 'stopped' CHECK(status IN ('running', 'stopped', 'error', 'creating')),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    instance_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Add ws_port column if it doesn't exist (migration for existing databases)
try {
  sqlite.exec(`ALTER TABLE instances ADD COLUMN ws_port INTEGER`)
} catch {
  // Column already exists, ignore
}

export const db = drizzle(sqlite)
