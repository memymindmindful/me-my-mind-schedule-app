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

// Helper to parse time string into minutes since midnight
function parseTimeToMinutesServerSide(timeStr: string): number {
  if (!timeStr) return 0;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Helper to calculate duration in minutes between start and end time
function calculateDurationMinutesServerSide(startTime: string, endTime: string): number {
  const startMin = parseTimeToMinutesServerSide(startTime);
  const endMin = parseTimeToMinutesServerSide(endTime);
  if (startMin === 0 && endMin === 0) return 90;
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60; // handle events crossing midnight
  return diff > 0 ? diff : 90;
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
      useGlobalFacilitator INTEGER DEFAULT 1,
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

  // Safe migration for useGlobalFacilitator column
  try {
    db.run("ALTER TABLE events ADD COLUMN useGlobalFacilitator INTEGER DEFAULT 1");
  } catch {
    // Column already exists
  }

  // Safe migration for facilitatorId column on events
  try {
    db.run("ALTER TABLE events ADD COLUMN facilitatorId TEXT");
  } catch {
    // Column already exists
  }

  // Safe migration: map existing useGlobalFacilitator events to default facilitatorId
  try {
    db.run(`
      UPDATE events 
      SET facilitatorId = 'default' 
      WHERE (useGlobalFacilitator = 1 OR useGlobalFacilitator = '1') 
        AND (facilitatorId IS NULL OR facilitatorId = '')
    `);
  } catch (err) {
    console.error('[DB Migration] Failed to migrate events facilitatorId:', err);
  }

  // Safe migration: synchronize date column with dateStr for all existing events
  try {
    db.run("UPDATE events SET date = dateStr WHERE dateStr IS NOT NULL AND dateStr != '' AND date != dateStr");
    console.log('[DB Migration] Synced date column with dateStr for any out-of-sync events.');
  } catch (err) {
    console.error('[DB Migration] Failed to sync date/dateStr:', err);
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
      welcomeGuideMessageTh TEXT,
      welcomeGuideMessageEn TEXT,
      welcomeGuideIntroTh TEXT,
      welcomeGuideIntroEn TEXT,
      welcomeGuideItem1Th TEXT,
      welcomeGuideItem1En TEXT,
      welcomeGuideItem2Th TEXT,
      welcomeGuideItem2En TEXT,
      welcomeGuideItem3Th TEXT,
      welcomeGuideItem3En TEXT,
      welcomeGuideItem4Th TEXT,
      welcomeGuideItem4En TEXT,
      welcomeGuideOutroTh TEXT,
      welcomeGuideOutroEn TEXT,
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
  try {
    db.run("ALTER TABLE studio_info ADD COLUMN welcomeGuideMessageTh TEXT");
  } catch {}
  try {
    db.run("ALTER TABLE studio_info ADD COLUMN welcomeGuideMessageEn TEXT");
  } catch {}

  const defaultMessageTh = `Me.My.Mind Mindfulness Studio ยินดีต้อนรับค่ะ 🤍

ก่อนจองคิว ลองเช็คปฏิทินนี้ดูก่อนได้เลยค่ะ ว่าในวันที่สนใจ:

① ครูบีอยู่สาขาไหน
   ⚪ ขาว = นครสวรรค์  🩷 ชมพูอ่อน = ราชเทวี  🤎 น้ำตาล = ออนทัวร์  💜 ม่วง = ออนไลน์

② วันนั้นเปิดหรือปิดร้าน
   ⚫ สีดำ = ปิดร้าน  🔵 สีฟ้า = วันทำความสะอาดใหญ่ (Big Cleaning)

③ มีกิจกรรมกลุ่มแบบไหนบ้าง
   ⭐ ดาว = กิจกรรมไฮไลท์ประจำเดือน  🎥 กล้อง = กิจกรรมออนไลน์

④ คิววันนั้นเต็มหรือยัง
   🔴 วงกลมขอบแดง = เต็มแล้วนะคะ

ปฏิทินนี้โชว์แค่กิจกรรมกลุ่มเป็นหลักค่ะ ส่วนคิว Private บีไม่ได้ลงไว้ในนี้ทุกเคส เพื่อให้หน้าจอดูสบายตา ไม่รกเกินไป

พอทราบคร่าว ๆ แล้วว่าวันนั้นครูบีอยู่สาขาไหน ทักแชทมาถามคิว Private เพิ่มเติมได้เลยทาง LINE นะคะ 💬

รักและเคารพ
ครูบีเว่อร์ 🤍`;

  const defaultMessageEn = `Welcome to Me.My.Mind Mindfulness Studio 🤍

Before you book, feel free to browse this calendar to see, for your preferred date:

① Which branch Kru Bee will be at
   ⚪ White = Nakhonsawan  🩷 Pink = Ratchathewi  🤎 Brown = On-Tour  💜 Purple = Online

② Whether the studio is open or closed that day
   ⚫ Black = Closed  🔵 Blue = Big Cleaning day

③ What kind of group session is on offer
   ⭐ Star = Monthly featured event  🎥 Camera = Online session

④ Whether the day is already fully booked
   🔴 Red-ringed circle = Fully booked

This calendar focuses on group sessions — Private bookings aren't all listed here, simply to keep things clean and easy to read.

Once you've narrowed down which branch and date work for you, simply message us on LINE and we'll be happy to confirm availability for your Private session. 💬

With love and respect,
Kru Beever 🤍`;

  // One-time migration: concatenate old fields if welcomeGuideMessage is still empty
  try {
    const rows = db.exec("SELECT id, welcomeGuideIntroTh, welcomeGuideItem1Th, welcomeGuideItem2Th, welcomeGuideItem3Th, welcomeGuideItem4Th, welcomeGuideOutroTh, welcomeGuideIntroEn, welcomeGuideItem1En, welcomeGuideItem2En, welcomeGuideItem3En, welcomeGuideItem4En, welcomeGuideOutroEn, welcomeGuideMessageTh, welcomeGuideMessageEn FROM studio_info");
    if (rows && rows.length > 0) {
      for (const r of rows[0].values) {
        const id = r[0] as string;
        let msgTh = r[13] as string | null;
        let msgEn = r[14] as string | null;

        if (!msgTh || msgTh.trim() === '') {
          const combinedTh = [r[1], r[2], r[3], r[4], r[5], r[6]].filter(Boolean).join('\n\n');
          msgTh = combinedTh.trim() !== '' ? combinedTh : defaultMessageTh;
        }
        if (!msgEn || msgEn.trim() === '') {
          const combinedEn = [r[7], r[8], r[9], r[10], r[11], r[12]].filter(Boolean).join('\n\n');
          msgEn = combinedEn.trim() !== '' ? combinedEn : defaultMessageEn;
        }

        db.run(
          "UPDATE studio_info SET welcomeGuideMessageTh = ?, welcomeGuideMessageEn = ? WHERE id = ?",
          [msgTh, msgEn, id]
        );
      }
      console.log('[DB Migration] Migrated welcomeGuideMessageTh/En.');
    }
  } catch (err) {
    console.error('[DB Migration] Failed to migrate welcomeGuideMessage:', err);
  }

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
      isActive INTEGER DEFAULT 1,
      displayOrder INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe migrations for facilitator columns
  try {
    db.run("ALTER TABLE facilitator ADD COLUMN isActive INTEGER DEFAULT 1");
  } catch {}
  try {
    db.run("ALTER TABLE facilitator ADD COLUMN displayOrder INTEGER DEFAULT 0");
  } catch {}

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

  // Safe migration: repair existing special status labels to short text and clean sub-text
  try {
    db.run(`
      UPDATE month_bars 
      SET 
        specialStatusLabelTh = 'เต็มแล้ว',
        specialStatusLabelEn = 'Fully Booked',
        specialStatusSubTh = NULL,
        specialStatusSubEn = NULL
      WHERE specialStatusType = 'fully_booked'
    `);
    db.run(`
      UPDATE month_bars 
      SET 
        specialStatusLabelTh = 'ปิดร้าน',
        specialStatusLabelEn = 'Closed',
        specialStatusSubTh = NULL,
        specialStatusSubEn = NULL
      WHERE specialStatusType = 'closed'
    `);
    db.run(`
      UPDATE month_bars 
      SET 
        specialStatusLabelTh = 'Big Cleaning',
        specialStatusLabelEn = 'Big Cleaning',
        specialStatusSubTh = NULL,
        specialStatusSubEn = NULL
      WHERE specialStatusType = 'big_cleaning'
    `);
    console.log('[DB Migration] Repaired existing special status labels to short text.');
  } catch (err) {
    console.error('[DB Migration] Failed to repair special status labels:', err);
  }

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
      ('branch-ontour', 'On-Tour', 'ทัวร์ต่างจังหวัด / Private Retreats', 'On-Tour & Private Retreats', 'รีทรีตธรรมชาติ & ไพรเวตองค์กรทั่วประเทศ', 'Private Retreats & Corporate Mindfulness Immersions', 'จัดนอกสถานที่ทั่วประเทศ (เชียงใหม่, ภูเก็ต, หัวหิน & องค์กร)', 'On-location Across Thailand (Chiang Mai, Phuket, Hua Hin & Corporate)', 'สถานที่ธรรมชาติและรีสอร์ทที่คัดสรรพิเศษ', 'Bespoke On-Site Venues & Nature Resorts', '#A67863', '#A67863', '#FFFFFF', 1, 3),
      ('branch-online', 'Online', 'ออนไลน์ (Zoom / Live)', 'Online Virtual Sessions', 'เซสชันออนไลน์ผ่าน Zoom & การทำสมาธิทางไกล', 'Virtual Live Sessions & Remote Meditations', 'เข้าร่วมผ่าน Zoom / Google Meet (ลิงก์ส่งให้หลังยืนยันการจอง)', 'Live via Zoom / Google Meet link provided upon booking', 'ออนไลน์จากที่บ้าน / ทุกที่ที่คุณสะดวก', 'Join from home or anywhere comfortable', '#8A6FAE', '#E9E0F5', '#5D4488', 1, 4);
    `);
  } else {
    // Migration: ensure branch-online exists in branches table
    try {
      const checkOnline = db.exec("SELECT COUNT(*) FROM branches WHERE branchKey = 'Online' OR id = 'branch-online'");
      if (!checkOnline || checkOnline[0]?.values[0]?.[0] === 0) {
        db.run(`
          INSERT INTO branches (id, branchKey, nameTh, nameEn, taglineTh, taglineEn, addressTh, addressEn, landmarkTh, landmarkEn, dotColor, pillBg, textColor, isActive, displayOrder)
          VALUES ('branch-online', 'Online', 'ออนไลน์ (Zoom / Live)', 'Online Virtual Sessions', 'เซสชันออนไลน์ผ่าน Zoom & การทำสมาธิทางไกล', 'Virtual Live Sessions & Remote Meditations', 'เข้าร่วมผ่าน Zoom / Google Meet (ลิงก์ส่งให้หลังยืนยันการจอง)', 'Live via Zoom / Google Meet link provided upon booking', 'ออนไลน์จากที่บ้าน / ทุกที่ที่คุณสะดวก', 'Join from home or anywhere comfortable', '#8A6FAE', '#E9E0F5', '#5D4488', 1, 4)
        `);
        console.log('[DB Migration] Added Online branch to branches table.');
      } else {
        // Update to lavender if previously saved with blue #3B82F6
        db.run(`
          UPDATE branches 
          SET dotColor = '#8A6FAE', pillBg = '#E9E0F5', textColor = '#5D4488'
          WHERE (branchKey = 'Online' OR id = 'branch-online') AND (dotColor = '#3B82F6' OR pillBg = '#DBEAFE')
        `);
      }
    } catch (err) {
      console.error('[DB Migration] Failed to check/add/update Online branch:', err);
    }
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

  // Migration: Recalculate durationMinutes for all existing events based on actual startTime and endTime
  try {
    const allEvents = db.exec("SELECT id, startTime, endTime, durationMinutes FROM events");
    if (allEvents && allEvents.length > 0 && allEvents[0].values.length > 0) {
      const rows = allEvents[0].values;
      let updatedCount = 0;
      for (const row of rows) {
        const id = row[0];
        const startTime = row[1];
        const endTime = row[2];
        const currentDuration = row[3];
        if (startTime && endTime) {
          const correctDuration = calculateDurationMinutesServerSide(String(startTime), String(endTime));
          if (correctDuration !== Number(currentDuration)) {
            db.run("UPDATE events SET durationMinutes = ? WHERE id = ?", [correctDuration, id]);
            updatedCount++;
          }
        }
      }
      if (updatedCount > 0) {
        console.log(`[DB Migration] Recalculated durationMinutes for ${updatedCount} existing event(s).`);
      }
    }
  } catch (err) {
    console.error('[DB Migration] Failed to recalculate durationMinutes:', err);
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
