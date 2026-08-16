import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';

export const eventsRouter = Router();

// Ensure all /api/events responses are never cached
eventsRouter.use((_req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Helper to convert database row to ScheduleEvent object
export function mapRowToEvent(columns: string[], row: any[]) {
  const obj: Record<string, any> = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });

  return {
    id: obj.id,
    name: obj.name,
    englishName: obj.englishName || '',
    dateStr: obj.dateStr || obj.date,
    dateDisplay: obj.dateDisplay || '',
    date: obj.date,
    startTime: obj.startTime || '',
    endTime: obj.endTime || '',
    timeDisplay: obj.timeDisplay || `${obj.startTime} - ${obj.endTime}`,
    durationMinutes: Number(obj.durationMinutes) || 90,
    category: obj.category || 'Sound Healing',
    branch: obj.branch,
    capacity: Number(obj.capacity) || 10,
    bookedCount: Number(obj.bookedCount) || 0,
    status: obj.status || 'available',
    priceThb: Number(obj.priceThb) || 0,
    isFree: Boolean(obj.isFree || (obj.priceThb === 0 && obj.isFree !== 0)),
    level: obj.level || 'All Levels',
    description: obj.description || '',
    locationDetails: obj.locationDetails || '',
    posterUrl: obj.posterUrl || '',
    posterTag: obj.posterTag || '',
    subtitle: obj.subtitle || '',
    facilitator: {
      name: obj.facilitatorName || 'Kru Beever (Supapit)',
      role: obj.facilitatorRole || 'Founder & Lead Somatic Alchemist',
      bio: obj.facilitatorBio || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.'
    },
    sensoryNotes: obj.sensoryNotes ? JSON.parse(obj.sensoryNotes) : [],
    benefits: obj.benefits ? JSON.parse(obj.benefits) : [],
    preparationTips: obj.preparationTips ? JSON.parse(obj.preparationTips) : [],
    adminNote: obj.adminNote || '',
    isSpecialStar: Boolean(obj.isSpecialStar),
    isFeatured: Boolean(obj.isFeatured),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

/**
 * GET /api/branches
 * Returns available branches
 */
eventsRouter.get('/branches', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'Nakhonsawan', name: 'Nakhonsawan Main', nameTh: 'สาขาหลักนครสวรรค์' },
      { id: 'Ratchathewi', name: 'Ratchathewi Branch', nameTh: 'สาขาราชเทวี กรุงเทพฯ' },
      { id: 'On-Tour', name: 'On-Tour', nameTh: 'ทัวร์ต่างจังหวัด / Private' }
    ]
  });
});

/**
 * GET /api/events/month/:year/:month
 * Returns list of events for the specified year and month (1-12 or 0-11)
 */
eventsRouter.get('/events/month/:year/:month', (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year, 10);
    let month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month)) {
      res.status(400).json({
        success: false,
        error: 'Invalid year or month parameter',
        code: 'INVALID_PARAMS'
      });
      return;
    }

    // Format month with 2 digits (e.g. "04")
    const monthFormatted = String(month).padStart(2, '0');
    const monthPattern = `${year}-${monthFormatted}%`;

    const db = getDatabase();
    const result = db.exec("SELECT * FROM events WHERE date LIKE ? ORDER BY date ASC, startTime ASC", [monthPattern]);

    if (!result || result.length === 0) {
      res.json({
        success: true,
        data: []
      });
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
      error: error.message || 'Internal Server Error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/events/:id
 * Returns single event details
 */
eventsRouter.get('/events/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const result = db.exec("SELECT * FROM events WHERE id = ?", [id]);

    if (!result || result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'NOT_FOUND'
      });
      return;
    }

    const columns = result[0].columns;
    const event = mapRowToEvent(columns, result[0].values[0]);

    res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      code: 'SERVER_ERROR'
    });
  }
});
