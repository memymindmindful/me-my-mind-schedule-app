import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { mapRowToEvent } from './events';

export const adminRouter = Router();
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
    const date = body.date || new Date().toISOString().split('T')[0];
    const dateDisplay = body.dateDisplay || date;
    const dateStr = body.dateStr || date;
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
    const facilitatorName = body.facilitatorName || (typeof body.facilitator === 'string' ? JSON.parse(body.facilitator)?.name : 'Kru Beever (Supapit)');
    const facilitatorRole = body.facilitatorRole || 'Founder & Lead Somatic Alchemist';
    const facilitatorBio = body.facilitatorBio || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.';

    // Array fields
    const sensoryNotes = typeof body.sensoryNotes === 'string' ? body.sensoryNotes : JSON.stringify(body.sensoryNotes || []);
    const benefits = typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits || []);
    const preparationTips = typeof body.preparationTips === 'string' ? body.preparationTips : JSON.stringify(body.preparationTips || []);
    const adminNote = body.adminNote || '';
    const isSpecialStar = body.isSpecialStar === 'true' || body.isSpecialStar === true ? 1 : 0;
    const isFeatured = body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0;

    db.run(`
      INSERT INTO events (
        id, name, englishName, date, dateDisplay, dateStr,
        startTime, endTime, timeDisplay, durationMinutes, category,
        branch, capacity, bookedCount, status, priceThb, isFree, level,
        description, locationDetails, posterUrl, posterTag, subtitle,
        facilitatorName, facilitatorRole, facilitatorBio,
        sensoryNotes, benefits, preparationTips, adminNote,
        isSpecialStar, isFeatured, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, name, englishName, date, dateDisplay, dateStr,
      startTime, endTime, timeDisplay, durationMinutes, category,
      branch, capacity, bookedCount, status, priceThb, isFree, level,
      description, locationDetails, posterUrl, posterTag, subtitle,
      facilitatorName, facilitatorRole, facilitatorBio,
      sensoryNotes, benefits, preparationTips, adminNote,
      isSpecialStar, isFeatured
    ]);

    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { id, posterUrl }
    });
  } catch (error: any) {
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
    const check = db.exec("SELECT id, posterUrl FROM events WHERE id = ?", [id]);
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
        adminNote = COALESCE(?, adminNote),
        isSpecialStar = COALESCE(?, isSpecialStar),
        isFeatured = COALESCE(?, isFeatured),
        updatedAt = datetime('now')
      WHERE id = ?
    `, [
      body.name,
      body.englishName,
      body.date,
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
      body.priceThb !== undefined ? parseInt(body.priceThb, 10) : null,
      body.isFree !== undefined ? (body.isFree === 'true' || body.isFree === true || body.isFree === 1 || Number(body.priceThb) === 0 ? 1 : 0) : null,
      body.level,
      body.description,
      body.locationDetails,
      posterUrl,
      body.posterTag,
      body.subtitle,
      body.adminNote,
      body.isSpecialStar !== undefined ? (body.isSpecialStar === 'true' || body.isSpecialStar === true ? 1 : 0) : null,
      body.isFeatured !== undefined ? (body.isFeatured === 'true' || body.isFeatured === true ? 1 : 0) : null,
      id
    ]);

    saveDatabase();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { id, posterUrl }
    });
  } catch (error: any) {
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
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});
