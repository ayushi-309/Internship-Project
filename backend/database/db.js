import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'volunteer.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

let db = null;

export async function getDatabase() {
  if (db) return db;

  // Ensure database directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const dbExists = fs.existsSync(dbPath);

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // If database didn't exist or is empty, run schema
  if (!dbExists || (await isDatabaseEmpty(db))) {
    console.log('Initializing database schema...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // SQLite runs multiple statements when split or executed. 
    // sqlite package's db.exec() runs multiple SQL statements separated by semicolons.
    await db.exec(schema);
    console.log('Database schema initialized.');
  }

  return db;
}

async function isDatabaseEmpty(database) {
  try {
    const result = await database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    return !result;
  } catch (error) {
    return true;
  }
}
