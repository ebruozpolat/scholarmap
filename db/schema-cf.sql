-- D1 Schema for ScholarMap (SQLite-compatible)
-- Run: npx wrangler d1 execute scholarmap-db --file=./db/schema-cf.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  union_id TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  authors TEXT,
  year TEXT,
  abstract TEXT,
  url TEXT,
  doi TEXT,
  citation_count TEXT,
  source TEXT,
  venue TEXT,
  topic TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS saved_papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  paper_id INTEGER NOT NULL,
  collection TEXT DEFAULT 'Favorites',
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, paper_id)
);

CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  query TEXT NOT NULL,
  results_count TEXT,
  source TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free',
  searches_used TEXT DEFAULT '0',
  searches_limit TEXT DEFAULT '10',
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
