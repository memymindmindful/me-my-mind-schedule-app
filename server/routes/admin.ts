import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { mapRowToEvent } from './events';

export const adminRouter = Router();

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
    const durationMinutes = parseInt(body.durationMinutes, 10) || 90;
    const category = body.category || 'Sound Healing / Sound Baths';
    const branch = body.branch || 'Nakhonsawan';
    const capacity = parseInt(body.capacity, 10) || 10;
    const bookedCount = parseInt(body.bookedCount, 10) || 0;
    const status = body.status || 'available';
    const isFree = body.isFree === 'true' || body.isFree === true || body.isFree === 1 || Number(body.priceThb) === 0 ? 1 : 0;
    const priceThb = isFree ? 0 : (parseInt(body.priceThb, 10) || 0);
    const level = body.level || 'All Levels';
    const description = body.description || '';
    const locationDetails = body.locationDetails || '';
    const posterUrl = file ? `/uploads/${file.filename}` : (body.posterUrl || '');
    const posterTag = body.posterTag || '';
    const subtitle = body.subtitle || '';
    
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
    const benefits = typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits || []);
    const preparationTips = typeof body.preparationTips === 'string' ? body.preparationTips : JSON.stringify(body.preparationTips || []);
    const adminNote = body.adminNote || '';
    const isSpecialStar = body.isSpecialStar === 'true' || body.isSpecialStar === true ? 1 : 0;
    const isFeatured = body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0;

    const rawParams = [
      id, name, englishName, date, dateDisplay, dateStr,
      startTime, endTime, timeDisplay, durationMinutes, category,
      branch, capacity, bookedCount, status, priceThb, isFree, level,
      description, locationDetails, posterUrl, posterTag, subtitle,
      facilitatorName, facilitatorRole, facilitatorBio, useGlobalFacilitator, facilitatorId,
      sensoryNotes, benefits, preparationTips, adminNote,
      isSpecialStar, isFeatured
    ];
    const params = rawParams.map(v => (v === undefined ? null : v));

    db.run(`
      INSERT INTO events (
        id, name, englishName, date, dateDisplay, dateStr,
        startTime, endTime, timeDisplay, durationMinutes, category,
        branch, capacity, bookedCount, status, priceThb, isFree, level,
        description, locationDetails, posterUrl, posterTag, subtitle,
        facilitatorName, facilitatorRole, facilitatorBio, useGlobalFacilitator, facilitatorId,
        sensoryNotes, benefits, preparationTips, adminNote,
        isSpecialStar, isFeatured, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
    const check = db.exec("SELECT id, posterUrl, facilitatorId FROM events WHERE id = ?", [id]);
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
    const sensoryNotes = body.sensoryNotes !== undefined ? (typeof body.sensoryNotes === 'string' ? body.sensoryNotes : JSON.stringify(body.sensoryNotes)) : null;
    const benefits = body.benefits !== undefined ? (typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits)) : null;
    const preparationTips = body.preparationTips !== undefined ? (typeof body.preparationTips === 'string' ? body.preparationTips : JSON.stringify(body.preparationTips)) : null;

    const rawParams = [
      body.name,
      body.englishName,
      (body.dateStr !== undefined && body.dateStr !== '') ? body.dateStr : (body.date !== undefined && body.date !== '' ? body.date : null),
      body.dateDisplay,
      body.dateStr,
      body.startTime,
      body.endTime,
      body.timeDisplay,
      body.durationMinutes ? parseInt(body.durationMinutes, 10) : null,
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
      body.locationDetails,
      posterUrl,
      body.posterTag,
      body.subtitle,
      facilitatorName,
      facilitatorRole,
      facilitatorBio,
      useGlobalFacilitator,
      facilitatorId,
      sensoryNotes,
      benefits,
      preparationTips,
      body.adminNote,
      body.isSpecialStar !== undefined ? (body.isSpecialStar === 'true' || body.isSpecialStar === true ? 1 : 0) : null,
      body.isFeatured !== undefined ? (body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0) : null,
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
        locationDetails = COALESCE(?, locationDetails),
        posterUrl = ?,
        posterTag = COALESCE(?, posterTag),
        subtitle = COALESCE(?, subtitle),
        facilitatorName = COALESCE(?, facilitatorName),
        facilitatorRole = COALESCE(?, facilitatorRole),
        facilitatorBio = COALESCE(?, facilitatorBio),
        useGlobalFacilitator = COALESCE(?, useGlobalFacilitator),
        facilitatorId = ?,
        sensoryNotes = COALESCE(?, sensoryNotes),
        benefits = COALESCE(?, benefits),
        preparationTips = COALESCE(?, preparationTips),
        adminNote = COALESCE(?, adminNote),
        isSpecialStar = COALESCE(?, isSpecialStar),
        isFeatured = COALESCE(?, isFeatured),
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
    logoUrl: '',
    defaultLanguage: 'th',
    currency: 'THB',
    timeFormat: '24h'
  };
  const studioRes = db.exec("SELECT id, studioNameTh, studioNameEn, taglineTh, taglineEn, logoUrl, defaultLanguage, currency, timeFormat FROM studio_info WHERE id = 'default'");
  if (studioRes && studioRes.length > 0 && studioRes[0].values.length > 0) {
    const [id, studioNameTh, studioNameEn, taglineTh, taglineEn, logoUrl, defaultLanguage, currency, timeFormat] = studioRes[0].values[0];
    studio = {
      id: (id as string) || 'default',
      studioNameTh: studioNameTh !== null && studioNameTh !== undefined ? (studioNameTh as string) : 'Me.My.Mind Mindfulness Studio',
      studioNameEn: studioNameEn !== null && studioNameEn !== undefined ? (studioNameEn as string) : 'Me.My.Mind Mindfulness Studio',
      taglineTh: taglineTh !== null && taglineTh !== undefined ? (taglineTh as string) : '',
      taglineEn: taglineEn !== null && taglineEn !== undefined ? (taglineEn as string) : '',
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

    const studioParams = [
      body.studioNameTh || 'Me.My.Mind Mindfulness Studio',
      body.studioNameEn || 'Me.My.Mind Mindfulness Studio',
      body.taglineTh !== undefined ? body.taglineTh : 'Your Daily Rituals of Self-Love',
      body.taglineEn !== undefined ? body.taglineEn : 'Your Daily Rituals of Self-Love',
      logoUrl,
      body.defaultLanguage || 'th',
      body.currency || 'THB',
      body.timeFormat || '24h'
    ].map(v => (v === undefined ? null : v));

    db.run(`
      INSERT OR REPLACE INTO studio_info (id, studioNameTh, studioNameEn, taglineTh, taglineEn, logoUrl, defaultLanguage, currency, timeFormat, updatedAt)
      VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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

    // Delete existing bars for this month
    db.run("DELETE FROM month_bars WHERE year = ? AND (month = ? OR month = ?)", [year, month, month > 0 ? month - 1 : month]);

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
          hasSpecialStar, specialStatusType, specialStatusLabelTh, specialStatusLabelEn,
          specialStatusSubTh, specialStatusSubEn, specialStatusBadgeBg, specialStatusBadgeText, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
      db.run("DELETE FROM month_bars WHERE year = ? AND (month = ? OR month = ?)", [Number(year), Number(month), Number(month) > 0 ? Number(month) - 1 : Number(month)]);
      saveDatabase();
      res.json({ success: true, message: `Cleared custom month bars for ${year}-${month}`, resetType });
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

