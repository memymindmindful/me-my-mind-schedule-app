import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcryptjs';

let db: Database | null = null;
const dbFilePath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './database.sqlite');

// Persist the in-memory SQLite database to disk
export function saveDatabase(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Error saving SQLite database:', err);
  }
}

// Initialize database with tables and default admin
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if they do not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      englishName TEXT,
      date TEXT NOT NULL,
      dateDisplay TEXT,
      dateStr TEXT,
      startTime TEXT,
      endTime TEXT,
      timeDisplay TEXT,
      durationMinutes INTEGER DEFAULT 90,
      category TEXT,
      branch TEXT NOT NULL,
      capacity INTEGER DEFAULT 10,
      bookedCount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      priceThb INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      level TEXT DEFAULT 'All Levels',
      description TEXT,
      locationDetails TEXT,
      posterUrl TEXT,
      posterTag TEXT,
      subtitle TEXT,
      facilitatorName TEXT,
      facilitatorRole TEXT,
      facilitatorBio TEXT,
      sensoryNotes TEXT,
      benefits TEXT,
      preparationTips TEXT,
      adminNote TEXT,
      isSpecialStar INTEGER DEFAULT 0,
      isFeatured INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe migration for isFree column
  try {
    db.run("ALTER TABLE events ADD COLUMN isFree INTEGER DEFAULT 0");
  } catch {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      email TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      clientName TEXT NOT NULL,
      clientLineId TEXT,
      clientPhone TEXT,
      guestCount INTEGER DEFAULT 1,
      specialNotes TEXT,
      totalPrice INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );
  `);

  // Seed default admin if table is empty
  const checkAdmin = db.exec("SELECT COUNT(*) as count FROM admin_users");
  const count = (checkAdmin[0]?.values[0]?.[0] as number) || 0;

  if (count === 0) {
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Change@Me1234';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(defaultPassword, salt);
    
    db.run(
      "INSERT INTO admin_users (id, username, passwordHash, email) VALUES (?, ?, ?, ?)",
      ['admin-master-id', defaultUsername, passwordHash, 'me.my.mind.facialmassage@gmail.com']
    );
    console.log(`[DB] Default admin created: ${defaultUsername} / ${defaultPassword}`);
  }

  saveDatabase();
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Please call initDatabase() first.');
  }
  return db;
}
