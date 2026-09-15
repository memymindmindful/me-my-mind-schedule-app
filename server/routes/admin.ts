import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { mapRowToEvent } from './events';

export const adminRouter = Router();

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
function calculateDurationMinutesServerSide(startTime: string, endTime: string, defaultMinutes: number = 90): number {
  if (!startTime || !endTime) return defaultMinutes;
  const startMin = parseTimeToMinutesServerSide(startTime);
  const endMin = parseTimeToMinutesServerSide(endTime);
  if (startMin === 0 && endMin === 0) return defaultMinutes;
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60; // handle events crossing midnight
  return diff > 0 ? diff : defaultMinutes;
}

// Ensure all admin and settings API responses are never cached
adminRouter.use((_req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'me_my_mind_mindfulness_jwt_secret_2026_super_secure_key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * POST /api/admin/login
 * Admin login with username & password
 */
adminRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    const db = getDatabase();
    const result = db.exec("SELECT id, username, passwordHash, email FROM admin_users WHERE username = ?", [username.trim()]);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const [id, dbUsername, passwordHash, email] = result[0].values[0];
    const isPasswordValid = bcrypt.compareSync(password, passwordHash as string);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id, username: dbUsername, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        expiresIn: 86400,
        user: {
          id,
          username: dbUsername,
          email
        }
      }
    });
  } catch (error: any) {
    console.error('[POST /admin/login]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/admin/events
 * Get all events (Requires Auth)
 */
adminRouter.get('/admin/events', authenticateToken, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec("SELECT * FROM events ORDER BY date DESC, startTime ASC");

    if (!result || result.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const columns = result[0].columns;
    const events = result[0].values.map(row => mapRowToEvent(columns, row));

    res.json({
      success: true,
      data: events
    });
  } catch (error: any) {
    console.error('[GET /admin/events]', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/admin/events
 * Create new event (Requires Auth, optional photo upload)
 */
adminRouter.post('/admin/events', authenticateToken, upload.single('photo'), (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const body = req.body;
    const file = req.file;

    const id = body.id || `evt-${uuidv4()}`;
    const name = body.name || 'Untitled Event';
    const englishName = body.englishName || '';
    // dateStr (from the form's Day/Month/Year selectors) is the source of truth.
    // `date` should always mirror it exactly — never fall back to server's "today".
    const dateStr = body.dateStr || body.date || new Date().toISOString().split('T')[0];
    const date = dateStr;
    const dateDisplay = body.dateDisplay || date;
    const startTime = body.startTime || '09:00 AM';
    const endTime = body.endTime || '10:30 AM';
    const timeDisplay = body.timeDisplay || `${startTime} - ${endTime}`;
    const calculatedDuration = calculateDurationMinutesServerSide(startTime, endTime);
    const durationMinutes = (body.durationMinutes !== undefined && !isNaN(parseInt(body.durationMinutes, 10)) && parseInt(body.durationMinutes, 10) > 0)
      ? parseInt(body.durationMinutes, 10)
      : calculatedDuration;
    const category = body.category || 'Sound Healing / Sound Baths';
    const branch = body.branch || 'Nakhonsawan';
    const capacity = parseInt(body.capacity, 10) || 10;
    const bookedCount = parseInt(body.bookedCount, 10) || 0;
    const status = body.status || 'available';
    const isFree = body.isFree === 'true' || body.isFree === true || body.isFree === 1 || Number(body.priceThb) === 0 ? 1 : 0;
    const priceThb = isFree ? 0 : (parseInt(body.priceThb, 10) || 0);
    const level = body.level || 'All Levels';
    const description = body.description || '';
    const descriptionEn = body.descriptionEn || '';
    const locationDetails = body.locationDetails || '';
    const posterUrl = file ? `/uploads/${file.filename}` : (body.posterUrl || '');
    const posterTag = body.posterTag || '';
    const subtitle = body.subtitle || '';
    const subtitleEn = body.subtitleEn || '';
    
    // Facilitator info
    let facilitatorObj: any = null;
    try {
      if (typeof body.facilitator === 'string') {
        facilitatorObj = JSON.parse(body.facilitator);
      } else if (body.facilitator && typeof body.facilitator === 'object') {
        facilitatorObj = body.facilitator;
      }
    } catch {}

    const facilitatorName = body.facilitatorName || facilitatorObj?.name || 'Kru Beever (Supapit)';
    const facilitatorRole = body.facilitatorRole || facilitatorObj?.role || 'Founder & Lead Somatic Alchemist';
    const facilitatorBio = body.facilitatorBio || facilitatorObj?.bio || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.';
    const useGlobalFacilitator = body.useGlobalFacilitator !== undefined ? (body.useGlobalFacilitator === 'true' || body.useGlobalFacilitator === true || body.useGlobalFacilitator === 1 ? 1 : 0) : 1;
    const facilitatorId = body.facilitatorId !== undefined && body.facilitatorId !== '' ? body.facilitatorId : (useGlobalFacilitator ? 'default' : null);

    // Array fields
    const sensoryNotes = typeof body.sensoryNotes === 'string' ? body.sensoryNotes : JSON.stringify(body.sensoryNotes || []);
    const sensoryNotesEn = typeof body.sensoryNotesEn === 'string' ? body.sensoryNotesEn : JSON.stringify(body.sensoryNotesEn || []);
    const benefits = typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits || []);
    const benefitsEn = typeof body.benefitsEn === 'string' ? body.benefitsEn : JSON.stringify(body.benefitsEn || []);
    const preparationTips = typeof body.preparationTips === 'string' ? body.preparationTips : JSON.stringify(body.preparationTips || []);
    const preparationTipsEn = typeof body.preparationTipsEn === 'string' ? body.preparationTipsEn : JSON.stringify(body.preparationTipsEn || []);
    const adminNote = body.adminNote || '';
    const isSpecialStar = body.isSpecialStar === 'true' || body.isSpecialStar === true ? 1 : 0;
    const isFeatured = body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0;
    const isPrivate = body.isPrivate === 'true' || body.isPrivate === true || body.isPrivate === 1 ? 1 : 0;

    const rawParams = [
      id, name, englishName, date, dateDisplay, dateStr,
      startTime, endTime, timeDisplay, durationMinutes, category,
      branch, capacity, bookedCount, status, priceThb, isFree, level,
      description, descriptionEn, locationDetails, posterUrl, posterTag, subtitle, subtitleEn,
      facilitatorName, facilitatorRole, facilitatorBio, useGlobalFacilitator, facilitatorId,
      sensoryNotes, sensoryNotesEn, benefits, benefitsEn, preparationTips, preparationTipsEn, adminNote,
      isSpecialStar, isFeatured, isPrivate
    ];
    const params = rawParams.map(v => (v === undefined ? null : v));

    db.run(`
      INSERT INTO events (
        id, name, englishName, date, dateDisplay, dateStr,
        startTime, endTime, timeDisplay, durationMinutes, category,
        branch, capacity, bookedCount, status, priceThb, isFree, level,
        description, descriptionEn, locationDetails, posterUrl, posterTag, subtitle, subtitleEn,
        facilitatorName, facilitatorRole, facilitatorBio, useGlobalFacilitator, facilitatorId,
        sensoryNotes, sensoryNotesEn, benefits, benefitsEn, preparationTips, preparationTipsEn, adminNote,
        isSpecialStar, isFeatured, isPrivate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, params);

    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { id, posterUrl }
    });
  } catch (error: any) {
    console.error('[POST /admin/events]', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * PUT /api/admin/events/:id
 * Update existing event (Requires Auth)
 */
adminRouter.put('/admin/events/:id', authenticateToken, upload.single('photo'), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const body = req.body;
    const file = req.file;

    // Check if event exists
    const check = db.exec("SELECT id, posterUrl, facilitatorId, startTime, endTime, durationMinutes FROM events WHERE id = ?", [id]);
    if (!check || check.length === 0 || check[0].values.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'NOT_FOUND'
      });
      return;
    }

    const currentPosterUrl = check[0].values[0][1];
    let posterUrl = currentPosterUrl;
    if (file) {
      posterUrl = `/uploads/${file.filename}`;
    } else if (body.posterUrl !== undefined) {
      posterUrl = body.posterUrl;
    }

    const existingStartTime = check[0].values[0][3] as string;
    const existingEndTime = check[0].values[0][4] as string;
    const effStartTime = body.startTime || existingStartTime || '09:00 AM';
    const effEndTime = body.endTime || existingEndTime || '10:30 AM';
    
    let durationMinutes: number | null = null;
    if (body.durationMinutes !== undefined && !isNaN(parseInt(body.durationMinutes, 10)) && parseInt(body.durationMinutes, 10) > 0) {
      durationMinutes = parseInt(body.durationMinutes, 10);
    } else if (body.startTime || body.endTime) {
      durationMinutes = calculateDurationMinutesServerSide(effStartTime, effEndTime);
    }

    let facilitatorId = check[0].values[0][2];
    if (body.facilitatorId !== undefined) {
      facilitatorId = body.facilitatorId && body.facilitatorId !== '' ? body.facilitatorId : null;
    }

    // Facilitator info
    let facilitatorObj: any = null;
    try {
      if (typeof body.facilitator === 'string') {
        facilitatorObj = JSON.parse(body.facilitator);
      } else if (body.facilitator && typeof body.facilitator === 'object') {
        facilitatorObj = body.facilitator;
      }
    } catch {}

    const facilitatorName = body.facilitatorName !== undefined ? body.facilitatorName : (facilitatorObj?.name !== undefined ? facilitatorObj.name : null);
    const facilitatorRole = body.facilitatorRole !== undefined ? body.facilitatorRole : (facilitatorObj?.role !== undefined ? facilitatorObj.role : null);
    const facilitatorBio = body.facilitatorBio !== undefined ? body.facilitatorBio : (facilitatorObj?.bio !== undefined ? facilitatorObj.bio : null);
    const useGlobalFacilitator = body.useGlobalFacilitator !== undefined ? (body.useGlobalFacilitator === 'true' || body.useGlobalFacilitator === true || body.useGlobalFacilitator === 1 ? 1 : 0) : null;
    const subtitleEn = body.subtitleEn !== undefined ? body.subtitleEn : null;
    const descriptionEn = body.descriptionEn !== undefined ? body.descriptionEn : null;
    const sensoryNotes = body.sensoryNotes !== undefined ? (typeof body.sensoryNotes === 'string' ? body.sensoryNotes : JSON.stringify(body.sensoryNotes)) : null;
    const sensoryNotesEn = body.sensoryNotesEn !== undefined ? (typeof body.sensoryNotesEn === 'string' ? body.sensoryNotesEn : JSON.stringify(body.sensoryNotesEn)) : null;
    const benefits = body.benefits !== undefined ? (typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits)) : null;
    const benefitsEn = body.benefitsEn !== undefined ? (typeof body.benefitsEn === 'string' ? body.benefitsEn : JSON.stringify(body.benefitsEn)) : null;
    const preparationTips = body.preparationTips !== undefined ? (typeof body.preparationTips === 'string' ? body.preparationTips : JSON.stringify(body.preparationTips)) : null;
    const preparationTipsEn = body.preparationTipsEn !== undefined ? (typeof body.preparationTipsEn === 'string' ? body.preparationTipsEn : JSON.stringify(body.preparationTipsEn)) : null;

    const rawParams = [
      body.name,
      body.englishName,
      (body.dateStr !== undefined && body.dateStr !== '') ? body.dateStr : (body.date !== undefined && body.date !== '' ? body.date : null),
      body.dateDisplay,
      body.dateStr,
      body.startTime,
      body.endTime,
      body.timeDisplay,
      durationMinutes !== null ? durationMinutes : (body.durationMinutes ? parseInt(body.durationMinutes, 10) : null),
      body.category,
      body.branch,
      body.capacity ? parseInt(body.capacity, 10) : null,
      body.bookedCount ? parseInt(body.bookedCount, 10) : null,
      body.status,
      (body.priceThb !== undefined && body.priceThb !== '' && !Number.isNaN(parseInt(body.priceThb, 10)))
        ? parseInt(body.priceThb, 10)
        : null,
      body.isFree !== undefined ? (body.isFree === 'true' || body.isFree === true || body.isFree === 1 || Number(body.priceThb) === 0 ? 1 : 0) : null,
      body.level,
      body.description,
      descriptionEn,
      body.locationDetails,
      posterUrl,
      body.posterTag,
      body.subtitle,
      subtitleEn,
      facilitatorName,
      facilitatorRole,
      facilitatorBio,
      useGlobalFacilitator,
      facilitatorId,
      sensoryNotes,
      sensoryNotesEn,
      benefits,
      benefitsEn,
      preparationTips,
      preparationTipsEn,
      body.adminNote,
      body.isSpecialStar !== undefined ? (body.isSpecialStar === 'true' || body.isSpecialStar === true ? 1 : 0) : null,
      body.isFeatured !== undefined ? (body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0) : null,
      body.isPrivate !== undefined ? (body.isPrivate === 'true' || body.isPrivate === true || body.isPrivate === 1 ? 1 : 0) : null,
      id
    ];
    const params = rawParams.map(v => (v === undefined ? null : v));

    db.run(`
      UPDATE events SET
        name = COALESCE(?, name),
        englishName = COALESCE(?, englishName),
        date = COALESCE(?, date),
        dateDisplay = COALESCE(?, dateDisplay),
        dateStr = COALESCE(?, dateStr),
        startTime = COALESCE(?, startTime),
        endTime = COALESCE(?, endTime),
        timeDisplay = COALESCE(?, timeDisplay),
        durationMinutes = COALESCE(?, durationMinutes),
        category = COALESCE(?, category),
        branch = COALESCE(?, branch),
        capacity = COALESCE(?, capacity),
        bookedCount = COALESCE(?, bookedCount),
        status = COALESCE(?, status),
        priceThb = COALESCE(?, priceThb),
        isFree = COALESCE(?, isFree),
        level = COALESCE(?, level),
        description = COALESCE(?, description),
        descriptionEn = COALESCE(?, descriptionEn),
        locationDetails = COALESCE(?, locationDetails),
        posterUrl = ?,
        posterTag = COALESCE(?, posterTag),
        subtitle = COALESCE(?, subtitle),
        subtitleEn = COALESCE(?, subtitleEn),
        facilitatorName = COALESCE(?, facilitatorName),
        facilitatorRole = COALESCE(?, facilitatorRole),
        facilitatorBio = COALESCE(?, facilitatorBio),
        useGlobalFacilitator = COALESCE(?, useGlobalFacilitator),
        facilitatorId = ?,
        sensoryNotes = COALESCE(?, sensoryNotes),
        sensoryNotesEn = COALESCE(?, sensoryNotesEn),
        benefits = COALESCE(?, benefits),
        benefitsEn = COALESCE(?, benefitsEn),
        preparationTips = COALESCE(?, preparationTips),
        preparationTipsEn = COALESCE(?, preparationTipsEn),
        adminNote = COALESCE(?, adminNote),
        isSpecialStar = COALESCE(?, isSpecialStar),
        isFeatured = COALESCE(?, isFeatured),
        isPrivate = COALESCE(?, isPrivate),
        updatedAt = datetime('now')
      WHERE id = ?
    `, params);

    saveDatabase();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { id, posterUrl }
    });
  } catch (error: any) {
    console.error('[PUT /admin/events/:id]', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * DELETE /api/admin/events/:id
 * Delete event (Requires Auth)
 */
adminRouter.delete('/admin/events/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.run("DELETE FROM events WHERE id = ?", [id]);
    saveDatabase();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    console.error('[DELETE /admin/events/:id]', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/admin/events/:id/increment-booked
 * Quick booked count update
 */
adminRouter.post('/admin/events/:id/increment-booked', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { increment = 1 } = req.body;
    const db = getDatabase();

    const result = db.exec("SELECT capacity, bookedCount FROM events WHERE id = ?", [id]);
    if (!result || result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ success: false, error: 'Event not found', code: 'NOT_FOUND' });
      return;
    }

    const [capacity, currentBooked] = result[0].values[0] as [number, number];
    const newBooked = Math.max(0, Math.min(capacity, currentBooked + increment));
    const newStatus = newBooked >= capacity ? 'fully_booked' : newBooked >= capacity - 2 ? 'almost_full' : 'available';

    db.run("UPDATE events SET bookedCount = ?, status = ?, updatedAt = datetime('now') WHERE id = ?", [newBooked, newStatus, id]);
    saveDatabase();

    res.json({
      success: true,
      data: { bookedCount: newBooked, capacity, status: newStatus }
    });
  } catch (error: any) {
    console.error('[POST /admin/events/:id/increment-booked]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * Helper to fetch all studio settings from DB
 */
export function getAllStudioSettingsFromDb() {
  const db = getDatabase();

  // Studio Info
  let studio = {
    id: 'default',
    studioNameTh: 'Me.My.Mind Mindfulness Studio',
    studioNameEn: 'Me.My.Mind Mindfulness Studio',
    taglineTh: 'Your Daily Rituals of Self-Love',
    taglineEn: 'Your Daily Rituals of Self-Love',
    sayHiMessageTh: 'สวัสดีค่ะ 👋\n\nเช็คตารางครูบี เลือกวันที่ต้องการ\n แล้วทักแชทมาจองได้เลยค่ะ 💬',
    sayHiMessageEn: 'Hello there 👋\n\nCheck Kru Beever’s schedule, pick your preferred date\nand chat with us to book your session! 💬',
    welcomeGuideMessageTh: '',
    welcomeGuideMessageEn: '',
    logoUrl: '',
    defaultLanguage: 'th',
    currency: 'THB',
    timeFormat: '24h'
  };
  const studioRes = db.exec("SELECT id, studioNameTh, studioNameEn, taglineTh, taglineEn, logoUrl, defaultLanguage, currency, timeFormat, sayHiMessageTh, sayHiMessageEn, welcomeGuideMessageTh, welcomeGuideMessageEn FROM studio_info WHERE id = 'default'");
  if (studioRes && studioRes.length > 0 && studioRes[0].values.length > 0) {
    const [
      id, studioNameTh, studioNameEn, taglineTh, taglineEn, logoUrl, defaultLanguage, currency, timeFormat,
      sayHiMessageTh, sayHiMessageEn,
      welcomeGuideMessageTh, welcomeGuideMessageEn
    ] = studioRes[0].values[0];
    studio = {
      id: (id as string) || 'default',
      studioNameTh: studioNameTh !== null && studioNameTh !== undefined ? (studioNameTh as string) : 'Me.My.Mind Mindfulness Studio',
      studioNameEn: studioNameEn !== null && studioNameEn !== undefined ? (studioNameEn as string) : 'Me.My.Mind Mindfulness Studio',
      taglineTh: taglineTh !== null && taglineTh !== undefined ? (taglineTh as string) : '',
      taglineEn: taglineEn !== null && taglineEn !== undefined ? (taglineEn as string) : '',
      sayHiMessageTh: sayHiMessageTh !== null && sayHiMessageTh !== undefined ? (sayHiMessageTh as string) : studio.sayHiMessageTh,
      sayHiMessageEn: sayHiMessageEn !== null && sayHiMessageEn !== undefined ? (sayHiMessageEn as string) : studio.sayHiMessageEn,
      welcomeGuideMessageTh: welcomeGuideMessageTh !== null && welcomeGuideMessageTh !== undefined ? (welcomeGuideMessageTh as string) : studio.welcomeGuideMessageTh,
      welcomeGuideMessageEn: welcomeGuideMessageEn !== null && welcomeGuideMessageEn !== undefined ? (welcomeGuideMessageEn as string) : studio.welcomeGuideMessageEn,
      logoUrl: (logoUrl as string) || '',
      defaultLanguage: (defaultLanguage as string) || 'th',
      currency: (currency as string) || 'THB',
      timeFormat: (timeFormat as string) || '24h'
    };
  }

  // Facilitators
  const facilitators: any[] = [];
  const facRes = db.exec("SELECT id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certifications, lineOa, email, phone, instagram, isActive, displayOrder FROM facilitator ORDER BY displayOrder ASC, id ASC");
  if (facRes && facRes.length > 0) {
    facRes[0].values.forEach(row => {
      let certs: string[] = [];
      try {
        certs = row[10] ? JSON.parse(row[10] as string) : [];
      } catch {
        certs = [];
      }
      facilitators.push({
        id: (row[0] as string) || 'default',
        nameTh: (row[1] as string) || '',
        nameEn: (row[2] as string) || '',
        titleTh: (row[3] as string) || '',
        titleEn: (row[4] as string) || '',
        photoUrl: (row[5] as string) || '',
        bioShortTh: (row[6] as string) || '',
        bioShortEn: (row[7] as string) || '',
        bioLongTh: (row[8] as string) || '',
        bioLongEn: (row[9] as string) || '',
        certifications: certs,
        lineOa: (row[11] as string) || '',
        email: (row[12] as string) || '',
        phone: (row[13] as string) || '',
        instagram: (row[14] as string) || '',
        isActive: Boolean(row[15] !== undefined ? row[15] : 1),
        displayOrder: Number(row[16] || 0)
      });
    });
  }

  let primaryFacilitator = facilitators.length > 0 ? facilitators[0] : {
    id: 'default',
    nameTh: 'Kru Beever (ครูบีเวอร์)',
    nameEn: 'Kru Beever (Supapit)',
    titleTh: 'ผู้ก่อตั้ง & ผู้เชี่ยวชาญการบำบัด Somatic Alchemy',
    titleEn: 'Founder & Lead Somatic Alchemist',
    photoUrl: '',
    bioShortTh: '',
    bioShortEn: '',
    bioLongTh: '',
    bioLongEn: '',
    certifications: [] as string[],
    lineOa: '@me.my.mind.mindful',
    email: 'me.my.mind.facialmassage@gmail.com',
    phone: '081-xxx-xxxx',
    instagram: '@me.my.mind.mindful',
    isActive: true,
    displayOrder: 1
  };
  if (facilitators.length === 0) {
    facilitators.push(primaryFacilitator);
  }

  // Branches
  const branches: any[] = [];
  const branchRes = db.exec("SELECT id, branchKey, nameTh, nameEn, taglineTh, taglineEn, addressTh, addressEn, landmarkTh, landmarkEn, dotColor, pillBg, textColor, photoUrl, isActive, displayOrder FROM branches ORDER BY displayOrder ASC, createdAt ASC");
  if (branchRes && branchRes.length > 0) {
    branchRes[0].values.forEach(row => {
      branches.push({
        id: row[0],
        branchKey: row[1],
        nameTh: row[2],
        nameEn: row[3],
        taglineTh: row[4],
        taglineEn: row[5],
        addressTh: row[6],
        addressEn: row[7],
        landmarkTh: row[8],
        landmarkEn: row[9],
        dotColor: row[10],
        pillBg: row[11],
        textColor: row[12],
        photoUrl: row[13],
        isActive: Boolean(row[14]),
        displayOrder: Number(row[15] || 0)
      });
    });
  }

  // Services
  const services: any[] = [];
  const srvRes = db.exec("SELECT id, nameTh, nameEn, category, descriptionTh, descriptionEn, basePrice, durationMinutes, photoUrl, isActive, displayOrder FROM services ORDER BY displayOrder ASC, createdAt ASC");
  if (srvRes && srvRes.length > 0) {
    srvRes[0].values.forEach(row => {
      services.push({
        id: row[0],
        nameTh: row[1],
        nameEn: row[2],
        category: row[3],
        descriptionTh: row[4],
        descriptionEn: row[5],
        basePrice: Number(row[6] || 0),
        durationMinutes: Number(row[7] || 90),
        photoUrl: row[8],
        isActive: Boolean(row[9]),
        displayOrder: Number(row[10] || 0)
      });
    });
  }

  // Contact Info
  let contact = {
    id: 'default',
    lineOa: '@me.my.mind.mindful',
    lineUrl: 'https://line.me/R/oaMessage/@me.my.mind.mindful',
    email: 'me.my.mind.facialmassage@gmail.com',
    phone: '081-xxx-xxxx',
    instagram: '@me.my.mind.mindful',
    facebook: 'Me.My.Mind Mindfulness Studio',
    website: 'me-my-mind.com'
  };
  const contactRes = db.exec("SELECT id, lineOa, lineUrl, email, phone, instagram, facebook, website FROM contact_info WHERE id = 'default'");
  if (contactRes && contactRes.length > 0 && contactRes[0].values.length > 0) {
    const [id, lineOa, lineUrl, email, phone, instagram, facebook, website] = contactRes[0].values[0];
    contact = {
      id: (id as string) || 'default',
      lineOa: (lineOa as string) || '',
      lineUrl: (lineUrl as string) || '',
      email: (email as string) || '',
      phone: (phone as string) || '',
      instagram: (instagram as string) || '',
      facebook: (facebook as string) || '',
      website: (website as string) || ''
    };
  }

  return { studio, facilitator: primaryFacilitator, facilitators, branches, services, contact };
}

/**
 * Public & Admin GET /api/settings (and /api/admin/settings)
 */
adminRouter.get('/settings', (_req: Request, res: Response) => {
  try {
    const data = getAllStudioSettingsFromDb();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /settings]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.get('/admin/settings', (_req: Request, res: Response) => {
  try {
    const data = getAllStudioSettingsFromDb();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /admin/settings]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/settings
 * Update Studio Branding & General Settings + Logo upload
 */
adminRouter.post('/admin/settings', upload.single('logo'), (req: Request, res: Response) => {
  try {
    const body = req.body;
    const file = req.file;
    const db = getDatabase();

    const check = db.exec("SELECT logoUrl FROM studio_info WHERE id = 'default'");
    const currentLogo = check && check.length > 0 && check[0].values.length > 0 ? check[0].values[0][0] : '';
    
    let logoUrl = currentLogo;
    if (file) {
      logoUrl = `/uploads/${file.filename}`;
    } else if (body.logoUrl !== undefined) {
      logoUrl = body.logoUrl;
    }

    const existRes = db.exec("SELECT sayHiMessageTh, sayHiMessageEn, welcomeGuideMessageTh, welcomeGuideMessageEn FROM studio_info WHERE id = 'default'");
    const existing = (existRes && existRes.length > 0 && existRes[0].values.length > 0) ? existRes[0].values[0] : [];

    const studioParams = [
      body.studioNameTh || 'Me.My.Mind Mindfulness Studio',
      body.studioNameEn || 'Me.My.Mind Mindfulness Studio',
      body.taglineTh !== undefined ? body.taglineTh : 'Your Daily Rituals of Self-Love',
      body.taglineEn !== undefined ? body.taglineEn : 'Your Daily Rituals of Self-Love',
      body.sayHiMessageTh !== undefined ? body.sayHiMessageTh : (existing[0] ?? null),
      body.sayHiMessageEn !== undefined ? body.sayHiMessageEn : (existing[1] ?? null),
      body.welcomeGuideMessageTh !== undefined ? body.welcomeGuideMessageTh : (existing[2] ?? null),
      body.welcomeGuideMessageEn !== undefined ? body.welcomeGuideMessageEn : (existing[3] ?? null),
      logoUrl,
      body.defaultLanguage || 'th',
      body.currency || 'THB',
      body.timeFormat || '24h'
    ].map(v => (v === undefined ? null : v));

    db.run(`
      INSERT OR REPLACE INTO studio_info (
        id, studioNameTh, studioNameEn, taglineTh, taglineEn,
        sayHiMessageTh, sayHiMessageEn,
        welcomeGuideMessageTh, welcomeGuideMessageEn,
        logoUrl, defaultLanguage, currency, timeFormat, updatedAt
      )
      VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, studioParams);

    // Also update contact if provided in the same request
    if (body.lineOa !== undefined || body.email !== undefined || body.phone !== undefined) {
      const contactParams = [
        body.lineOa || '@me.my.mind.mindful',
        body.lineUrl || `https://line.me/R/oaMessage/${body.lineOa || '@me.my.mind.mindful'}`,
        body.email || '',
        body.phone || '',
        body.instagram || '',
        body.facebook || '',
        body.website || ''
      ].map(v => (v === undefined ? null : v));

      db.run(`
        INSERT OR REPLACE INTO contact_info (id, lineOa, lineUrl, email, phone, instagram, facebook, website, updatedAt)
        VALUES ('default', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, contactParams);
    }

    saveDatabase();
    res.json({
      success: true,
      message: 'Studio settings updated successfully',
      data: { logoUrl }
    });
  } catch (error: any) {
    console.error('[POST /admin/settings]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Facilitators Endpoints
 */
adminRouter.get('/admin/facilitators', (_req: Request, res: Response) => {
  try {
    const data = getAllStudioSettingsFromDb().facilitators;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /admin/facilitators]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.get('/admin/facilitators/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const facilitators = getAllStudioSettingsFromDb().facilitators;
    const found = facilitators.find(f => f.id === id);
    if (!found) {
      res.status(404).json({ success: false, error: 'Facilitator not found' });
      return;
    }
    res.json({ success: true, data: found });
  } catch (error: any) {
    console.error('[GET /admin/facilitators/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.post('/admin/facilitators', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const body = req.body;
    const file = req.file;
    const db = getDatabase();
    const id = body.id || `fac-${uuidv4().slice(0, 8)}`;
    const photoUrl = file ? `/uploads/${file.filename}` : (body.photoUrl || '');

    let certsJson = '[]';
    if (typeof body.certifications === 'string') {
      try {
        certsJson = JSON.stringify(JSON.parse(body.certifications));
      } catch {
        certsJson = JSON.stringify([body.certifications]);
      }
    } else if (Array.isArray(body.certifications)) {
      certsJson = JSON.stringify(body.certifications);
    }

    const facilitatorParams = [
      id,
      body.nameTh || '',
      body.nameEn || '',
      body.titleTh || '',
      body.titleEn || '',
      photoUrl,
      body.bioShortTh || '',
      body.bioShortEn || '',
      body.bioLongTh || '',
      body.bioLongEn || '',
      certsJson,
      body.lineOa || '',
      body.email || '',
      body.phone || '',
      body.instagram || '',
      body.isActive === false || body.isActive === 'false' ? 0 : 1,
      Number(body.displayOrder || 0)
    ].map(v => (v === undefined ? null : v));

    db.run(`
      INSERT OR REPLACE INTO facilitator (id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certifications, lineOa, email, phone, instagram, isActive, displayOrder, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, facilitatorParams);

    saveDatabase();
    res.json({ success: true, message: 'Facilitator profile saved', data: { id, photoUrl } });
  } catch (error: any) {
    console.error('[POST /admin/facilitators]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.put('/admin/facilitators/:id', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const file = req.file;
    const db = getDatabase();

    const check = db.exec("SELECT photoUrl FROM facilitator WHERE id = ?", [id]);
    const currentPhoto = check && check.length > 0 && check[0].values.length > 0 ? check[0].values[0][0] : '';
    let photoUrl = currentPhoto;
    if (file) {
      photoUrl = `/uploads/${file.filename}`;
    } else if (body.photoUrl !== undefined) {
      photoUrl = body.photoUrl;
    }

    let certsJson: string | null = null;
    if (body.certifications !== undefined) {
      if (typeof body.certifications === 'string') {
        try {
          certsJson = JSON.stringify(JSON.parse(body.certifications));
        } catch {
          certsJson = JSON.stringify([body.certifications]);
        }
      } else if (Array.isArray(body.certifications)) {
        certsJson = JSON.stringify(body.certifications);
      }
    }

    const facilitatorParams = [
      body.nameTh,
      body.nameEn,
      body.titleTh,
      body.titleEn,
      photoUrl,
      body.bioShortTh,
      body.bioShortEn,
      body.bioLongTh,
      body.bioLongEn,
      certsJson,
      body.lineOa,
      body.email,
      body.phone,
      body.instagram,
      body.isActive !== undefined ? (body.isActive === true || body.isActive === 'true' ? 1 : 0) : null,
      body.displayOrder !== undefined ? Number(body.displayOrder) : null,
      id
    ].map(v => (v === undefined ? null : v));

    db.run(`
      UPDATE facilitator SET
        nameTh = COALESCE(?, nameTh),
        nameEn = COALESCE(?, nameEn),
        titleTh = COALESCE(?, titleTh),
        titleEn = COALESCE(?, titleEn),
        photoUrl = ?,
        bioShortTh = COALESCE(?, bioShortTh),
        bioShortEn = COALESCE(?, bioShortEn),
        bioLongTh = COALESCE(?, bioLongTh),
        bioLongEn = COALESCE(?, bioLongEn),
        certifications = COALESCE(?, certifications),
        lineOa = COALESCE(?, lineOa),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        instagram = COALESCE(?, instagram),
        isActive = COALESCE(?, isActive),
        displayOrder = COALESCE(?, displayOrder),
        updatedAt = datetime('now')
      WHERE id = ?
    `, facilitatorParams);

    saveDatabase();
    res.json({ success: true, message: 'Facilitator profile updated', data: { id, photoUrl } });
  } catch (error: any) {
    console.error('[PUT /admin/facilitators/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.delete('/admin/facilitators/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const countRes = db.exec("SELECT COUNT(*) FROM facilitator");
    if (countRes && countRes[0]?.values[0]?.[0] <= 1) {
      res.status(400).json({ success: false, error: 'Cannot delete the only remaining facilitator profile.' });
      return;
    }

    // Set any event referencing this facilitator to NULL or fallback
    try {
      db.run("UPDATE events SET facilitatorId = NULL WHERE facilitatorId = ?", [id]);
    } catch {}

    db.run("DELETE FROM facilitator WHERE id = ?", [id]);
    saveDatabase();
    res.json({ success: true, message: 'Facilitator deleted' });
  } catch (error: any) {
    console.error('[DELETE /admin/facilitators/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Backward compatibility alias: POST /api/admin/facilitator (updates 'default' facilitator)
 */
adminRouter.post('/admin/facilitator', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const body = req.body;
    const file = req.file;
    const db = getDatabase();

    const check = db.exec("SELECT photoUrl FROM facilitator WHERE id = 'default'");
    const currentPhoto = check && check.length > 0 && check[0].values.length > 0 ? check[0].values[0][0] : '';
    
    let photoUrl = currentPhoto;
    if (file) {
      photoUrl = `/uploads/${file.filename}`;
    } else if (body.photoUrl !== undefined) {
      photoUrl = body.photoUrl;
    }

    let certsJson = '[]';
    if (typeof body.certifications === 'string') {
      try {
        certsJson = JSON.stringify(JSON.parse(body.certifications));
      } catch {
        certsJson = JSON.stringify([body.certifications]);
      }
    } else if (Array.isArray(body.certifications)) {
      certsJson = JSON.stringify(body.certifications);
    }

    const facilitatorParams = [
      body.nameTh || 'Kru Beever (ครูบีเวอร์)',
      body.nameEn || 'Kru Beever (Supapit)',
      body.titleTh || 'ผู้ก่อตั้ง & ผู้เชี่ยวชาญการบำบัด Somatic Alchemy',
      body.titleEn || 'Founder & Lead Somatic Alchemist',
      photoUrl,
      body.bioShortTh || '',
      body.bioShortEn || '',
      body.bioLongTh || '',
      body.bioLongEn || '',
      certsJson,
      body.lineOa || '',
      body.email || '',
      body.phone || '',
      body.instagram || '',
      body.isActive === false || body.isActive === 'false' ? 0 : 1,
      Number(body.displayOrder || 1)
    ].map(v => (v === undefined ? null : v));

    db.run(`
      INSERT OR REPLACE INTO facilitator (id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certifications, lineOa, email, phone, instagram, isActive, displayOrder, updatedAt)
      VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, facilitatorParams);

    saveDatabase();
    res.json({
      success: true,
      message: 'Facilitator profile updated successfully',
      data: { photoUrl }
    });
  } catch (error: any) {
    console.error('[POST /admin/facilitator]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Branch Endpoints
 */
adminRouter.get('/admin/branches', (_req: Request, res: Response) => {
  try {
    const data = getAllStudioSettingsFromDb().branches;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /admin/branches]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.post('/admin/branches', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const body = req.body;
    const file = req.file;
    const db = getDatabase();
    const id = body.id || `branch-${uuidv4().slice(0, 8)}`;
    const photoUrl = file ? `/uploads/${file.filename}` : (body.photoUrl || '');

    const branchParams = [
      id,
      body.branchKey || 'Nakhonsawan',
      body.nameTh || '',
      body.nameEn || '',
      body.taglineTh || '',
      body.taglineEn || '',
      body.addressTh || '',
      body.addressEn || '',
      body.landmarkTh || '',
      body.landmarkEn || '',
      body.dotColor || '#E84D84',
      body.pillBg || '#F9D7E1',
      body.textColor || '#8E2849',
      photoUrl,
      body.isActive === false || body.isActive === 'false' ? 0 : 1,
      Number(body.displayOrder || 0)
    ].map(v => (v === undefined ? null : v));

    db.run(`
      INSERT OR REPLACE INTO branches (id, branchKey, nameTh, nameEn, taglineTh, taglineEn, addressTh, addressEn, landmarkTh, landmarkEn, dotColor, pillBg, textColor, photoUrl, isActive, displayOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, branchParams);

    saveDatabase();
    res.json({ success: true, message: 'Branch saved', data: { id, photoUrl } });
  } catch (error: any) {
    console.error('[POST /admin/branches]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.put('/admin/branches/:id', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const file = req.file;
    const db = getDatabase();

    const check = db.exec("SELECT photoUrl FROM branches WHERE id = ?", [id]);
    const currentPhoto = check && check.length > 0 && check[0].values.length > 0 ? check[0].values[0][0] : '';
    let photoUrl = currentPhoto;
    if (file) {
      photoUrl = `/uploads/${file.filename}`;
    } else if (body.photoUrl !== undefined) {
      photoUrl = body.photoUrl;
    }

    const branchParams = [
      body.branchKey,
      body.nameTh,
      body.nameEn,
      body.taglineTh,
      body.taglineEn,
      body.addressTh,
      body.addressEn,
      body.landmarkTh,
      body.landmarkEn,
      body.dotColor,
      body.pillBg,
      body.textColor,
      photoUrl,
      body.isActive !== undefined ? (body.isActive === true || body.isActive === 'true' ? 1 : 0) : null,
      body.displayOrder !== undefined ? Number(body.displayOrder) : null,
      id
    ].map(v => (v === undefined ? null : v));

    db.run(`
      UPDATE branches SET
        branchKey = COALESCE(?, branchKey),
        nameTh = COALESCE(?, nameTh),
        nameEn = COALESCE(?, nameEn),
        taglineTh = COALESCE(?, taglineTh),
        taglineEn = COALESCE(?, taglineEn),
        addressTh = COALESCE(?, addressTh),
        addressEn = COALESCE(?, addressEn),
        landmarkTh = COALESCE(?, landmarkTh),
        landmarkEn = COALESCE(?, landmarkEn),
        dotColor = COALESCE(?, dotColor),
        pillBg = COALESCE(?, pillBg),
        textColor = COALESCE(?, textColor),
        photoUrl = ?,
        isActive = COALESCE(?, isActive),
        displayOrder = COALESCE(?, displayOrder),
        updatedAt = datetime('now')
      WHERE id = ?
    `, branchParams);

    saveDatabase();
    res.json({ success: true, message: 'Branch updated', data: { id, photoUrl } });
  } catch (error: any) {
    console.error('[PUT /admin/branches/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.delete('/admin/branches/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    db.run("DELETE FROM branches WHERE id = ?", [id]);
    saveDatabase();
    res.json({ success: true, message: 'Branch deleted' });
  } catch (error: any) {
    console.error('[DELETE /admin/branches/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Services / Offerings Endpoints
 */
adminRouter.get('/admin/services', (_req: Request, res: Response) => {
  try {
    const data = getAllStudioSettingsFromDb().services;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /admin/services]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.post('/admin/services', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const body = req.body;
    const file = req.file;
    const db = getDatabase();
    const id = body.id || `srv-${uuidv4().slice(0, 8)}`;
    const photoUrl = file ? `/uploads/${file.filename}` : (body.photoUrl || '');

    const serviceParams = [
      id,
      body.nameTh || '',
      body.nameEn || '',
      body.category || 'Sound Healing / Sound Baths',
      body.descriptionTh || '',
      body.descriptionEn || '',
      Number(body.basePrice || 0),
      Number(body.durationMinutes || 90),
      photoUrl,
      body.isActive === false || body.isActive === 'false' ? 0 : 1,
      Number(body.displayOrder || 0)
    ].map(v => (v === undefined ? null : v));

    db.run(`
      INSERT OR REPLACE INTO services (id, nameTh, nameEn, category, descriptionTh, descriptionEn, basePrice, durationMinutes, photoUrl, isActive, displayOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, serviceParams);

    saveDatabase();
    res.json({ success: true, message: 'Service saved', data: { id, photoUrl } });
  } catch (error: any) {
    console.error('[POST /admin/services]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.put('/admin/services/:id', upload.single('photo'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const file = req.file;
    const db = getDatabase();

    const check = db.exec("SELECT photoUrl FROM services WHERE id = ?", [id]);
    const currentPhoto = check && check.length > 0 && check[0].values.length > 0 ? check[0].values[0][0] : '';
    let photoUrl = currentPhoto;
    if (file) {
      photoUrl = `/uploads/${file.filename}`;
    } else if (body.photoUrl !== undefined) {
      photoUrl = body.photoUrl;
    }

    const serviceParams = [
      body.nameTh,
      body.nameEn,
      body.category,
      body.descriptionTh,
      body.descriptionEn,
      body.basePrice !== undefined ? Number(body.basePrice) : null,
      body.durationMinutes !== undefined ? Number(body.durationMinutes) : null,
      photoUrl,
      body.isActive !== undefined ? (body.isActive === true || body.isActive === 'true' ? 1 : 0) : null,
      body.displayOrder !== undefined ? Number(body.displayOrder) : null,
      id
    ].map(v => (v === undefined ? null : v));

    db.run(`
      UPDATE services SET
        nameTh = COALESCE(?, nameTh),
        nameEn = COALESCE(?, nameEn),
        category = COALESCE(?, category),
        descriptionTh = COALESCE(?, descriptionTh),
        descriptionEn = COALESCE(?, descriptionEn),
        basePrice = COALESCE(?, basePrice),
        durationMinutes = COALESCE(?, durationMinutes),
        photoUrl = ?,
        isActive = COALESCE(?, isActive),
        displayOrder = COALESCE(?, displayOrder),
        updatedAt = datetime('now')
      WHERE id = ?
    `, serviceParams);

    saveDatabase();
    res.json({ success: true, message: 'Service updated', data: { id, photoUrl } });
  } catch (error: any) {
    console.error('[PUT /admin/services/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

adminRouter.delete('/admin/services/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    db.run("DELETE FROM services WHERE id = ?", [id]);
    saveDatabase();
    res.json({ success: true, message: 'Service deleted' });
  } catch (error: any) {
    console.error('[DELETE /admin/services/:id]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/bars/:year/:month
 * Save month bars to SQLite database
 */
adminRouter.post('/admin/bars/:year/:month', (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    const { bars } = req.body;

    if (isNaN(year) || isNaN(month) || !bars || typeof bars !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid parameters or missing bars object' });
      return;
    }

    const db = getDatabase();

    // Delete existing bars for this month ONLY (fixed — no longer touches the previous month)
    db.run("DELETE FROM month_bars WHERE year = ? AND month = ?", [year, month]);

    // Insert new bars
    Object.entries(bars).forEach(([dayStr, barData]: [string, any]) => {
      const d = parseInt(dayStr, 10);
      if (isNaN(d) || !barData) return;

      const barId = `bar-${year}-${month}-${d}`;
      const specialStatus = barData.specialStatus;

      const barParams = [
        barId,
        year,
        month,
        d,
        barData.branch || 'Nakhonsawan',
        barData.tourCity || null,
        barData.isPinkPill ? 1 : 0,
        barData.isBrownPill ? 1 : 0,
        barData.pillPosition || null,
        barData.hasSpecialStar ? 1 : 0,
        barData.hasPrivateBooking ? 1 : 0,
        specialStatus?.type || null,
        specialStatus?.labelTh || null,
        specialStatus?.labelEn || null,
        specialStatus?.subTh || null,
        specialStatus?.subEn || null,
        specialStatus?.badgeBg || null,
        specialStatus?.badgeText || null
      ].map(v => (v === undefined ? null : v));

      db.run(`
        INSERT INTO month_bars (
          id, year, month, dayNum, branch, tourCity, isPinkPill, isBrownPill, pillPosition,
          hasSpecialStar, hasPrivateBooking, specialStatusType, specialStatusLabelTh, specialStatusLabelEn,
          specialStatusSubTh, specialStatusSubEn, specialStatusBadgeBg, specialStatusBadgeText, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, barParams);
    });

    saveDatabase();
    res.json({ success: true, message: 'Month bars saved successfully to database' });
  } catch (error: any) {
    console.error('[POST /admin/bars/:year/:month]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/verify-password
 * Verify admin password before sensitive operations
 */
adminRouter.post('/admin/verify-password', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, error: 'Password required' });
      return;
    }

    const db = getDatabase();
    const result = db.exec("SELECT passwordHash FROM admin_users LIMIT 1");
    if (!result || result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ success: false, error: 'Admin user not configured' });
      return;
    }

    const passwordHash = result[0].values[0][0] as string;
    const isValid = bcrypt.compareSync(password, passwordHash);

    if (isValid) {
      res.json({ success: true, verified: true });
    } else {
      res.status(401).json({ success: false, verified: false, error: 'Invalid password' });
    }
  } catch (error: any) {
    console.error('[POST /admin/verify-password]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/change-password
 * Update Admin Username and Password in SQLite DB
 */
adminRouter.post('/admin/change-password', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const userId = req.user?.id || 'admin-master-id';

    const db = getDatabase();
    const result = db.exec("SELECT id, username, passwordHash FROM admin_users WHERE id = ? OR username = ?", [userId, req.user?.username || 'admin']);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ success: false, error: 'Admin user not found' });
      return;
    }

    const [id, currentUsername, passwordHash] = result[0].values[0];

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required to change password' });
        return;
      }

      const isValid = bcrypt.compareSync(currentPassword, passwordHash as string);
      if (!isValid) {
        res.status(401).json({ success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPassword.trim(), salt);
      const newUsername = (username || currentUsername as string).trim();

      db.run("UPDATE admin_users SET username = ?, passwordHash = ? WHERE id = ?", [newUsername, newHash, id]);
      saveDatabase();

      res.json({ success: true, message: 'บันทึกการเปลี่ยนชื่อผู้ใช้และรหัสผ่านใหม่เรียบร้อยแล้ว' });
      return;
    }

    // If only changing username
    if (username) {
      db.run("UPDATE admin_users SET username = ? WHERE id = ?", [username.trim(), id]);
      saveDatabase();
      res.json({ success: true, message: 'บันทึกชื่อผู้ใช้ใหม่เรียบร้อยแล้ว' });
      return;
    }

    res.status(400).json({ success: false, error: 'No changes requested' });
  } catch (error: any) {
    console.error('[POST /admin/change-password]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/reset-data
 * Reset schedule events / bars / start fresh
 */
adminRouter.post('/admin/reset-data', (req: Request, res: Response) => {
  try {
    const { resetType, year, month } = req.body;
    const db = getDatabase();

    if (resetType === 'month_events' && year && month !== undefined) {
      const monthPrefix = `${year}-${String(Number(month) + 1).padStart(2, '0')}`;
      db.run("DELETE FROM events WHERE date LIKE ?", [`${monthPrefix}%`]);
      saveDatabase();
      res.json({ success: true, message: `Cleared events for ${monthPrefix}`, resetType });
      return;
    }

    if (resetType === 'month_bars' && year && month !== undefined) {
      const mNum = Number(month);
      const targetMonth = mNum <= 11 ? mNum + 1 : mNum;
      db.run("DELETE FROM month_bars WHERE year = ? AND month = ?", [Number(year), targetMonth]);
      saveDatabase();
      res.json({ success: true, message: `Cleared custom month bars for ${year}-${targetMonth}`, resetType });
      return;
    }

    if (resetType === 'all_data') {
      db.run("DELETE FROM events");
      db.run("DELETE FROM month_bars");
      saveDatabase();
      res.json({
        success: true,
        message: 'All events and custom bars deleted from database. Defaulting focus to Nakhonsawan branch.',
        defaultBranch: 'Nakhonsawan',
        resetType: 'all_data'
      });
      return;
    }

    res.json({ success: true, message: 'Reset completed', defaultBranch: 'Nakhonsawan' });
  } catch (error: any) {
    console.error('[POST /admin/reset-data]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/private-schedule/periods
 * List ALL periods (past + current + future) for history view (Requires Auth)
 */
adminRouter.get('/admin/private-schedule/periods', authenticateToken, (_req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const periodRows = db.exec(`
      SELECT id, title, titleEn, startDate, endDate, createdAt, updatedAt, description, descriptionEn
      FROM private_schedule_periods
      ORDER BY startDate DESC, createdAt DESC
    `);

    if (!periodRows || periodRows.length === 0 || periodRows[0].values.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const periods = periodRows[0].values.map(r => {
      const id = r[0] as string;
      let totalBookings = 0;
      let bookedCount = 0;
      const countRes = db.exec("SELECT status, count(*) FROM private_schedule_bookings WHERE periodId = ? GROUP BY status", [id]);
      if (countRes && countRes.length > 0) {
        for (const cVal of countRes[0].values) {
          const status = cVal[0] as string;
          const count = Number(cVal[1]) || 0;
          totalBookings += count;
          if (status === 'booked') bookedCount += count;
        }
      }

      let slotsCount = 0;
      const slotRes = db.exec("SELECT count(*) FROM private_schedule_slot_templates WHERE periodId = ?", [id]);
      if (slotRes && slotRes.length > 0 && slotRes[0].values.length > 0) {
        slotsCount = Number(slotRes[0].values[0][0]) || 0;
      }

      return {
        id,
        title: r[1] as string,
        titleEn: (r[2] as string) || '',
        startDate: r[3] as string,
        endDate: r[4] as string,
        createdAt: r[5] as string,
        updatedAt: r[6] as string,
        description: (r[7] as string) || '',
        descriptionEn: (r[8] as string) || '',
        totalSlotsCount: slotsCount,
        totalBookingsCount: totalBookings,
        bookedCount
      };
    });

    res.json({ success: true, data: periods });
  } catch (error: any) {
    console.error('[GET /admin/private-schedule/periods]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/admin/private-schedule/periods
 * Create new period with slot templates and auto-generated date*slot bookings (Requires Auth)
 */
adminRouter.post('/admin/private-schedule/periods', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { title, titleEn, description, descriptionEn, startDate, endDate, slots } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'title, startDate, and endDate are required',
        code: 'MISSING_FIELDS'
      });
      return;
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one slot template is required',
        code: 'MISSING_SLOTS'
      });
      return;
    }

    const periodId = uuidv4();
    const periodRawParams = [
      periodId,
      title.trim(),
      titleEn ? String(titleEn).trim() : null,
      description ? String(description).trim() : null,
      descriptionEn ? String(descriptionEn).trim() : null,
      startDate.trim(),
      endDate.trim()
    ];
    const periodParams = periodRawParams.map(v => (v === undefined ? null : v));

    db.run(`
      INSERT INTO private_schedule_periods (id, title, titleEn, description, descriptionEn, startDate, endDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, periodParams);

    // Insert slot templates
    const createdSlots: { id: string; periodId: string; startTime: string; endTime: string; displayOrder: number }[] = [];
    slots.forEach((s: any, idx: number) => {
      const slotId = uuidv4();
      const startTime = String(s.startTime || '10:00').trim();
      const endTime = String(s.endTime || '11:30').trim();
      const slotRawParams = [slotId, periodId, startTime, endTime, idx];
      const slotParams = slotRawParams.map(v => (v === undefined ? null : v));

      db.run(`
        INSERT INTO private_schedule_slot_templates (id, periodId, startTime, endTime, displayOrder)
        VALUES (?, ?, ?, ?, ?)
      `, slotParams);

      createdSlots.push({
        id: slotId,
        periodId,
        startTime,
        endTime,
        displayOrder: idx
      });
    });

    // Generate dates between startDate and endDate
    const dates: string[] = [];
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    let curr = new Date(Date.UTC(sY, sM - 1, sD));
    const end = new Date(Date.UTC(eY, eM - 1, eD));
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    // Auto-generate bookings: for each date * each slot template
    dates.forEach(d => {
      createdSlots.forEach(s => {
        const bookingId = uuidv4();
        const bookingRawParams = [bookingId, periodId, s.id, d, 'available'];
        const bookingParams = bookingRawParams.map(v => (v === undefined ? null : v));

        db.run(`
          INSERT INTO private_schedule_bookings (id, periodId, slotTemplateId, date, status)
          VALUES (?, ?, ?, ?, ?)
        `, bookingParams);
      });
    });

    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Private schedule period created successfully',
      data: {
        id: periodId,
        title,
        startDate,
        endDate,
        slotsCount: createdSlots.length,
        datesCount: dates.length,
        totalBookings: dates.length * createdSlots.length
      }
    });
  } catch (error: any) {
    console.error('[POST /admin/private-schedule/periods]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/admin/private-schedule/periods/:id
 * Get full details of a specific period (period, slots, bookings) (Requires Auth)
 */
adminRouter.get('/admin/private-schedule/periods/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const periodRows = db.exec(`
      SELECT id, title, titleEn, description, descriptionEn, startDate, endDate, createdAt, updatedAt
      FROM private_schedule_periods
      WHERE id = ?
    `, [id]);

    if (!periodRows || periodRows.length === 0 || periodRows[0].values.length === 0) {
      res.status(404).json({ success: false, error: 'Period not found', code: 'NOT_FOUND' });
      return;
    }

    const r = periodRows[0].values[0];
    const period = {
      id: r[0] as string,
      title: r[1] as string,
      titleEn: (r[2] as string) || '',
      description: (r[3] as string) || '',
      descriptionEn: (r[4] as string) || '',
      startDate: r[5] as string,
      endDate: r[6] as string,
      createdAt: (r[7] as string) || '',
      updatedAt: (r[8] as string) || ''
    };

    const slotRows = db.exec(
      "SELECT id, periodId, startTime, endTime, displayOrder FROM private_schedule_slot_templates WHERE periodId = ? ORDER BY displayOrder ASC, startTime ASC",
      [id]
    );
    const slots = slotRows && slotRows.length > 0
      ? slotRows[0].values.map(s => ({
          id: s[0] as string,
          periodId: s[1] as string,
          startTime: s[2] as string,
          endTime: s[3] as string,
          displayOrder: Number(s[4]) || 0
        }))
      : [];

    const bookingRows = db.exec(
      "SELECT id, periodId, slotTemplateId, date, status FROM private_schedule_bookings WHERE periodId = ? ORDER BY date ASC, slotTemplateId ASC",
      [id]
    );
    const bookings = bookingRows && bookingRows.length > 0
      ? bookingRows[0].values.map(b => ({
          id: b[0] as string,
          periodId: b[1] as string,
          slotTemplateId: b[2] as string,
          date: b[3] as string,
          status: (b[4] as string) || 'available'
        }))
      : [];

    res.json({
      success: true,
      data: {
        period,
        slots,
        bookings
      }
    });
  } catch (error: any) {
    console.error('[GET /admin/private-schedule/periods/:id]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * PUT /api/admin/private-schedule/periods/:id
 * Updates an existing period's title, dates, and description.
 * Reconciles booking rows if date range changes. (Requires Auth)
 */
adminRouter.put('/admin/private-schedule/periods/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const body = req.body;

    const existing = db.exec("SELECT id, title, titleEn, description, descriptionEn, startDate, endDate FROM private_schedule_periods WHERE id = ?", [id]);
    if (!existing || existing.length === 0 || existing[0].values.length === 0) {
      res.status(404).json({ success: false, error: 'Period not found', code: 'NOT_FOUND' });
      return;
    }
    const row = existing[0].values[0];
    const oldStartDate = row[5] as string;
    const oldEndDate = row[6] as string;

    const newStartDate = body.startDate ? String(body.startDate).trim() : oldStartDate;
    const newEndDate = body.endDate ? String(body.endDate).trim() : oldEndDate;
    const newTitle = body.title !== undefined ? String(body.title).trim() : (row[1] as string);
    const newTitleEn = body.titleEn !== undefined ? (body.titleEn ? String(body.titleEn).trim() : null) : (row[2] as string | null);
    const newDesc = body.description !== undefined ? (body.description ? String(body.description).trim() : null) : (row[3] as string | null);
    const newDescEn = body.descriptionEn !== undefined ? (body.descriptionEn ? String(body.descriptionEn).trim() : null) : (row[4] as string | null);

    // Update the period's basic fields
    const updateParams = [
      newTitle,
      newTitleEn,
      newStartDate,
      newEndDate,
      newDesc,
      newDescEn,
      id
    ].map(v => (v === undefined ? null : v));

    db.run(`
      UPDATE private_schedule_periods SET
        title = COALESCE(?, title),
        titleEn = ?,
        startDate = COALESCE(?, startDate),
        endDate = COALESCE(?, endDate),
        description = ?,
        descriptionEn = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `, updateParams);

    // If the date range CHANGED, reconcile the booking rows:
    if (newStartDate !== oldStartDate || newEndDate !== oldEndDate) {
      const slotTemplatesResult = db.exec("SELECT id, startTime, endTime FROM private_schedule_slot_templates WHERE periodId = ? ORDER BY displayOrder ASC", [id]);
      const templates = slotTemplatesResult && slotTemplatesResult.length > 0 ? slotTemplatesResult[0].values : [];

      // 1. Remove booking rows for dates that fall OUTSIDE the new range
      db.run("DELETE FROM private_schedule_bookings WHERE periodId = ? AND (date < ? OR date > ?)", [id, newStartDate, newEndDate]);

      // 2. Add booking rows for any NEW dates within the expanded range that don't already have rows
      const existingDatesResult = db.exec("SELECT DISTINCT date FROM private_schedule_bookings WHERE periodId = ?", [id]);
      const existingDates = new Set(
        (existingDatesResult && existingDatesResult.length > 0 ? existingDatesResult[0].values : []).map(r => r[0] as string)
      );

      const [sY, sM, sD] = newStartDate.split('-').map(Number);
      const [eY, eM, eD] = newEndDate.split('-').map(Number);
      let cursor = new Date(Date.UTC(sY, sM - 1, sD));
      const end = new Date(Date.UTC(eY, eM - 1, eD));

      while (cursor <= end) {
        const dateStr = cursor.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
          for (const templateRow of templates) {
            const templateId = templateRow[0] as string;
            const bookingId = uuidv4();
            db.run(
              "INSERT INTO private_schedule_bookings (id, periodId, slotTemplateId, date, status) VALUES (?, ?, ?, ?, 'available')",
              [bookingId, id, templateId, dateStr]
            );
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    saveDatabase();
    res.json({ success: true, message: 'Period updated successfully' });
  } catch (error: any) {
    console.error('[PUT /admin/private-schedule/periods/:id]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * PUT /api/admin/private-schedule/bookings/:id
 * Toggle status of a single booking slot ('available' <-> 'booked') (Requires Auth)
 */
adminRouter.put('/admin/private-schedule/bookings/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const existingRows = db.exec("SELECT id, status FROM private_schedule_bookings WHERE id = ?", [id]);
    if (!existingRows || existingRows.length === 0 || existingRows[0].values.length === 0) {
      res.status(404).json({ success: false, error: 'Booking slot not found', code: 'NOT_FOUND' });
      return;
    }

    const currentStatus = existingRows[0].values[0][1] as string;
    let newStatus: string;
    if (req.body && req.body.status && (req.body.status === 'available' || req.body.status === 'booked')) {
      newStatus = req.body.status;
    } else {
      newStatus = currentStatus === 'booked' ? 'available' : 'booked';
    }

    const rawParams = [newStatus, id];
    const params = rawParams.map(v => (v === undefined ? null : v));

    db.run("UPDATE private_schedule_bookings SET status = ? WHERE id = ?", params);
    saveDatabase();

    res.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      data: { id, status: newStatus }
    });
  } catch (error: any) {
    console.error('[PUT /admin/private-schedule/bookings/:id]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * DELETE /api/admin/private-schedule/periods/:id
 * Delete an entire period and cascade delete slot templates + bookings (Requires Auth)
 */
adminRouter.delete('/admin/private-schedule/periods/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.run("DELETE FROM private_schedule_bookings WHERE periodId = ?", [id]);
    db.run("DELETE FROM private_schedule_slot_templates WHERE periodId = ?", [id]);
    db.run("DELETE FROM private_schedule_periods WHERE id = ?", [id]);
    saveDatabase();

    res.json({
      success: true,
      message: 'Private schedule period and associated slots/bookings deleted successfully'
    });
  } catch (error: any) {
    console.error('[DELETE /admin/private-schedule/periods/:id]', error);
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

