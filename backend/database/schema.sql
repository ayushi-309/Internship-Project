-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Users Table (Admin & Volunteers)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'volunteer', -- 'volunteer', 'admin'
  skills TEXT DEFAULT '',                 -- Comma-separated list of skills
  availability TEXT DEFAULT 'both',       -- 'weekdays', 'weekends', 'both'
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'inactive'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,                     -- YYYY-MM-DD
  time TEXT NOT NULL,                     -- HH:MM
  location TEXT NOT NULL,
  skills_needed TEXT DEFAULT '',          -- Comma-separated list
  max_volunteers INTEGER DEFAULT NULL,    -- NULL means unlimited
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registrations & Hour Logs Table
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
  hours_logged REAL DEFAULT 0.0,
  hours_approved INTEGER DEFAULT 0,         -- 0 = pending, 1 = approved, -1 = rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  UNIQUE(user_id, event_id)
);
