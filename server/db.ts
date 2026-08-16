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

  // Studio Settings & Branding
  db.run(`
    CREATE TABLE IF NOT EXISTS studio_info (
      id TEXT PRIMARY KEY,
      studioNameTh TEXT,
      studioNameEn TEXT,
      taglineTh TEXT,
      taglineEn TEXT,
      sayHiMessageTh TEXT,
      sayHiMessageEn TEXT,
      logoUrl TEXT,
      defaultLanguage TEXT DEFAULT 'th',
      currency TEXT DEFAULT 'THB',
      timeFormat TEXT DEFAULT '24h',
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe migrations for studio_info columns
  try {
    db.run("ALTER TABLE studio_info ADD COLUMN sayHiMessageTh TEXT");
  } catch {}
  try {
    db.run("ALTER TABLE studio_info ADD COLUMN sayHiMessageEn TEXT");
  } catch {}

  // Facilitator Profile & Certifications
  db.run(`
    CREATE TABLE IF NOT EXISTS facilitator (
      id TEXT PRIMARY KEY,
      nameTh TEXT,
      nameEn TEXT,
      titleTh TEXT,
      titleEn TEXT,
      photoUrl TEXT,
      bioShortTh TEXT,
      bioShortEn TEXT,
      bioLongTh TEXT,
      bioLongEn TEXT,
      certifications TEXT,
      lineOa TEXT,
      email TEXT,
      phone TEXT,
      instagram TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Branches
  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      branchKey TEXT,
      nameTh TEXT,
      nameEn TEXT,
      taglineTh TEXT,
      taglineEn TEXT,
      addressTh TEXT,
      addressEn TEXT,
      landmarkTh TEXT,
      landmarkEn TEXT,
      dotColor TEXT DEFAULT '#E84D84',
      pillBg TEXT DEFAULT '#F9D7E1',
      textColor TEXT DEFAULT '#8E2849',
      photoUrl TEXT,
      isActive INTEGER DEFAULT 1,
      displayOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Services / Offerings
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      nameTh TEXT,
      nameEn TEXT,
      category TEXT,
      descriptionTh TEXT,
      descriptionEn TEXT,
      basePrice INTEGER DEFAULT 0,
      durationMinutes INTEGER DEFAULT 90,
      photoUrl TEXT,
      isActive INTEGER DEFAULT 1,
      displayOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Calendar Day Bars & Pill / Special Status configs
  db.run(`
    CREATE TABLE IF NOT EXISTS month_bars (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      dayNum INTEGER NOT NULL,
      branch TEXT NOT NULL DEFAULT 'Nakhonsawan',
      tourCity TEXT,
      isPinkPill INTEGER DEFAULT 0,
      isBrownPill INTEGER DEFAULT 0,
      pillPosition TEXT,
      hasSpecialStar INTEGER DEFAULT 0,
      specialStatusType TEXT,
      specialStatusLabelTh TEXT,
      specialStatusLabelEn TEXT,
      specialStatusSubTh TEXT,
      specialStatusSubEn TEXT,
      specialStatusBadgeBg TEXT,
      specialStatusBadgeText TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  try {
    db.run("CREATE INDEX IF NOT EXISTS idx_month_bars_ym ON month_bars(year, month)");
  } catch {}

  // Contact Info
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_info (
      id TEXT PRIMARY KEY,
      lineOa TEXT,
      lineUrl TEXT,
      email TEXT,
      phone TEXT,
      instagram TEXT,
      facebook TEXT,
      website TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default Studio Info if empty
  const checkStudio = db.exec("SELECT COUNT(*) FROM studio_info");
  if (!checkStudio || checkStudio[0]?.values[0]?.[0] === 0) {
    db.run(
      `INSERT INTO studio_info (id, studioNameTh, studioNameEn, taglineTh, taglineEn, defaultLanguage, currency, timeFormat)
       VALUES ('default', 'Me.My.Mind Mindfulness Studio', 'Me.My.Mind Mindfulness Studio', 'Your Daily Rituals of Self-Love', 'Your Daily Rituals of Self-Love', 'th', 'THB', '24h')`
    );
  }

  // Seed default Facilitator if empty
  const checkFacilitator = db.exec("SELECT COUNT(*) FROM facilitator");
  if (!checkFacilitator || checkFacilitator[0]?.values[0]?.[0] === 0) {
    const certs = JSON.stringify([
      'Certified Sound Healing Alchemist (Nepal & UK Academy)',
      'Advanced Thai & Oriental Facial Acupressure Therapist',
      'KRI Certified Kundalini Yoga Teacher',
      'Usui Reiki Master Level 3'
    ]);
    db.run(
      `INSERT INTO facilitator (id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certifications, lineOa, email, phone, instagram)
       VALUES ('default', 'Kru Beever (ครูบีเวอร์)', 'Kru Beever (Supapit)', 'ผู้ก่อตั้ง & ผู้เชี่ยวชาญการบำบัด Somatic Alchemy', 'Founder & Lead Somatic Alchemist', '', 'ผู้บำบัดคลื่นเสียงและศาสตร์นวดหน้ายกกระชับกล้ามเนื้อใบหน้า ประสบการณ์กว่า 10 ปี มุ่งเน้นการคืนความสมดุลให้ระบบประสาทและร่างกาย', 'Certified Sound Healing Practitioner, Advanced Facial Massage Ritualist, and Kundalini Yoga guide at Me.My.Mind Mindfulness Studio.', 'เชี่ยวชาญด้าน Sound Alchemy, Facial Reflexology, Lymphatic Drainage และการผ่อนคลายกล้ามเนื้อสะสมความเครียดเพื่อการฟื้นฟูระบบประสาทองค์รวม', 'Dedicated to somatic alignment, nervous system recalibration, and conscious inner stillness.', ?, '@me.my.mind.mindful', 'me.my.mind.facialmassage@gmail.com', '081-xxx-xxxx', '@me.my.mind.mindful')`,
      [certs]
    );
  }

  // Seed default Branches if empty
  const checkBranches = db.exec("SELECT COUNT(*) FROM branches");
  if (!checkBranches || checkBranches[0]?.values[0]?.[0] === 0) {
    db.run(`
      INSERT INTO branches (id, branchKey, nameTh, nameEn, taglineTh, taglineEn, addressTh, addressEn, landmarkTh, landmarkEn, dotColor, pillBg, textColor, isActive, displayOrder)
      VALUES 
      ('branch-nakhonsawan', 'Nakhonsawan', 'สาขาหลักนครสวรรค์', 'Nakhonsawan Main Sanctuary', 'สวนสงบและสตูดิโอหลักแห่งการฟื้นฟู', 'Headquarters Sanctuary & Garden Studio', '88/4 ถนนสวรรค์วิถี ปากน้ำโพ เมือง นครสวรรค์ 60000', '88/4 Sawan Vithi Road, Pak Nam Pho, Mueang, Nakhon Sawan 60000', 'Sanctuary Garden ใกล้ Paradise Park', 'Sanctuary Garden near Paradise Park', '#FFFFFF', '#FDFBF7', '#2B2B2B', 1, 1),
      ('branch-ratchathewi', 'Ratchathewi', 'สาขาราชเทวี กรุงเทพฯ', 'Bangkok City Loft (Ratchathewi)', 'สตูดิโอกลางเมือง & เวิร์กช็อปสุดสัปดาห์', 'Bangkok City Loft & Weekend Workshop Space', 'อาคารพญาไทพลาซ่า ชั้น 5 ถนนพญาไท ราชเทวี กรุงเทพฯ 10400', 'Phayathai Plaza Building, 5th Floor, Phayathai Rd, Ratchathewi, Bangkok 10400', 'BTS ราชเทวี ทางออก 2 มีทางเชื่อมตรงเข้าตึก', 'BTS Ratchathewi (Direct Skywalk Exit 2)', '#F8C8D7', '#F9D7E1', '#8E2849', 1, 2),
      ('branch-ontour', 'On-Tour', 'ทัวร์ต่างจังหวัด / Private Retreats', 'On-Tour & Private Retreats', 'รีทรีตธรรมชาติ & ไพรเวตองค์กรทั่วประเทศ', 'Private Retreats & Corporate Mindfulness Immersions', 'จัดนอกสถานที่ทั่วประเทศ (เชียงใหม่, ภูเก็ต, หัวหิน & องค์กร)', 'On-location Across Thailand (Chiang Mai, Phuket, Hua Hin & Corporate)', 'สถานที่ธรรมชาติและรีสอร์ทที่คัดสรรพิเศษ', 'Bespoke On-Site Venues & Nature Resorts', '#A67863', '#A67863', '#FFFFFF', 1, 3);
    `);
  }

  // Seed default Services if empty
  const checkServices = db.exec("SELECT COUNT(*) FROM services");
  if (!checkServices || checkServices[0]?.values[0]?.[0] === 0) {
    db.run(`
      INSERT INTO services (id, nameTh, nameEn, category, descriptionTh, descriptionEn, basePrice, durationMinutes, isActive, displayOrder)
      VALUES 
      ('srv-1', 'Sound Healing & Sound Baths', 'Tibetan & Quartz Sound Bath', 'Sound Healing / Sound Baths', 'การบำบัดด้วยคลื่นเสียงขันทิเบตและคริสตัลโบวล์ คืนความสงบให้สมองและคลายระบบประสาท', 'Acoustic vibrational sound therapy balancing parasympathetic nervous system.', 950, 90, 1, 1),
      ('srv-2', 'Self-Love Facial Massage Ritual', 'Mindful Facial Acupressure', 'Facial Massage Rituals', 'ศาสตร์การนวดหน้าสลายพังผืด กดจุดสะท้อน ลดอาการกัดฟัน คลายกล้ามเนื้อใบหน้า', 'Lymphatic drainage, cranial acupressure, and TMJ tension release ritual.', 1350, 90, 1, 2),
      ('srv-3', 'Guasha Master Training', 'Gua Sha Practitioner Workshop', 'Workshops & Training', 'หลักสูตรอบรมกัวซาใบหน้ามืออาชีพและเทคนิคกดจุดทางกายวิภาคศาสตร์', 'Comprehensive practitioner training in Bian Stone Gua Sha & anatomy.', 4900, 360, 1, 3),
      ('srv-4', 'Kundalini Yoga & Breathwork', 'Kundalini Yoga & Pranayama', 'Kundalini Yoga', 'โยคะปลุกพลังชีวิต ฝึกการหายใจคลายความเครียดสะสมและเสริมสมาธิลึก', 'Dynamic breathwork kriyas and meditation for energy alignment.', 850, 75, 1, 4),
      ('srv-5', 'Usui Reiki Healing & Crystals', 'Reiki Energy Healing', 'Reiki', 'การส่งผ่านพลังงานเรกิร่วมกับคริสตัลปรับสมดุลจักระ คืนความผ่อนคลายและหลับสบาย', 'Gentle biofield balancing with hands-on Reiki and quartz frequencies.', 1100, 90, 1, 5),
      ('srv-6', 'Corporate Mindfulness & On-Tour', 'Corporate Wellness & Retreats', 'Corporate Workshops', 'เวิร์กช็อปสำหรับองค์กรฟื้นฟูภาวะหมดไฟ ลดอาการออฟฟิศซินโดรม', 'Tailored corporate burnout prevention and ergonomic mindfulness.', 2200, 120, 1, 6);
    `);
  }

  // Seed default Contact Info if empty
  const checkContact = db.exec("SELECT COUNT(*) FROM contact_info");
  if (!checkContact || checkContact[0]?.values[0]?.[0] === 0) {
    db.run(`
      INSERT INTO contact_info (id, lineOa, lineUrl, email, phone, instagram, facebook, website)
      VALUES ('default', '@me.my.mind.mindful', 'https://line.me/R/oaMessage/@me.my.mind.mindful', 'me.my.mind.facialmassage@gmail.com', '081-xxx-xxxx', '@me.my.mind.mindful', 'Me.My.Mind Mindfulness Studio', 'me-my-mind.com');
    `);
  }

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
