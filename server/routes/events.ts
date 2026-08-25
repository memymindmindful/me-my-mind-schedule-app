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
    useGlobalFacilitator: obj.useGlobalFacilitator !== undefined ? (obj.useGlobalFacilitator === 1 || obj.useGlobalFacilitator === '1' || obj.useGlobalFacilitator === true) : true,
    facilitatorId: obj.facilitatorId !== undefined && obj.facilitatorId !== '' ? obj.facilitatorId : (obj.useGlobalFacilitator !== false ? 'default' : null),
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
 * GET /api/facilitators
 * Returns active facilitators from database
 */
eventsRouter.get('/facilitators', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec("SELECT id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certifications, lineOa, email, phone, instagram, isActive, displayOrder FROM facilitator WHERE isActive = 1 ORDER BY displayOrder ASC, id ASC");
    if (!result || result.length === 0) {
      res.json({
        success: true,
        data: []
      });
      return;
    }
    const facilitators = result[0].values.map(row => {
      let certs: string[] = [];
      try {
        certs = row[10] ? JSON.parse(row[10] as string) : [];
      } catch {
        certs = [];
      }
      return {
        id: row[0],
        nameTh: row[1] || '',
        nameEn: row[2] || '',
        titleTh: row[3] || '',
        titleEn: row[4] || '',
        photoUrl: row[5] || '',
        bioShortTh: row[6] || '',
        bioShortEn: row[7] || '',
        bioLongTh: row[8] || '',
        bioLongEn: row[9] || '',
        certifications: certs,
        lineOa: row[11] || '',
        email: row[12] || '',
        phone: row[13] || '',
        instagram: row[14] || '',
        isActive: Boolean(row[15] !== undefined ? row[15] : 1),
        displayOrder: Number(row[16] || 0)
      };
    });
    res.json({ success: true, data: facilitators });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/branches
 * Returns available branches from database
 */
eventsRouter.get('/branches', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec("SELECT id, branchKey, nameTh, nameEn, taglineTh, taglineEn, addressTh, addressEn, landmarkTh, landmarkEn, dotColor, pillBg, textColor, photoUrl, isActive, displayOrder FROM branches WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt ASC");
    if (!result || result.length === 0) {
      res.json({
        success: true,
        data: [
          { id: 'branch-nakhonsawan', branchKey: 'Nakhonsawan', nameTh: 'สาขาหลักนครสวรรค์', nameEn: 'Nakhonsawan Main Sanctuary', dotColor: '#FFFFFF', pillBg: '#FDFBF7', textColor: '#2B2B2B' },
          { id: 'branch-ratchathewi', branchKey: 'Ratchathewi', nameTh: 'สาขาราชเทวี กรุงเทพฯ', nameEn: 'Bangkok City Loft (Ratchathewi)', dotColor: '#F8C8D7', pillBg: '#F9D7E1', textColor: '#8E2849' },
          { id: 'branch-ontour', branchKey: 'On-Tour', nameTh: 'ทัวร์ต่างจังหวัด / Private Retreats', nameEn: 'On-Tour & Private Retreats', dotColor: '#A67863', pillBg: '#A67863', textColor: '#FFFFFF' }
        ]
      });
      return;
    }
    const branches = result[0].values.map(row => ({
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
    }));
    res.json({ success: true, data: branches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bars/:year/:month
 * Returns calendar day bars & pills for specified year and month (month: 0-11 or 1-12)
 */
eventsRouter.get('/bars/:year/:month', (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year, 10);
    let month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month)) {
      res.status(400).json({ success: false, error: 'Invalid year or month parameter' });
      return;
    }

    const db = getDatabase();
    // Query matching year and month
    const result = db.exec("SELECT dayNum, branch, tourCity, isPinkPill, isBrownPill, pillPosition, hasSpecialStar, specialStatusType, specialStatusLabelTh, specialStatusLabelEn, specialStatusSubTh, specialStatusSubEn, specialStatusBadgeBg, specialStatusBadgeText FROM month_bars WHERE year = ? AND month = ? ORDER BY dayNum ASC", [year, month]);

    const bars: Record<number, any> = {};

    if (result && result.length > 0 && result[0].values.length > 0) {
      result[0].values.forEach(row => {
        const dayNum = Number(row[0]);
        const specialType = row[7] as string;
        bars[dayNum] = {
          dayNum,
          branch: row[1] || 'Nakhonsawan',
          tourCity: row[2] || undefined,
          isPinkPill: Boolean(row[3]),
          isBrownPill: Boolean(row[4]),
          pillPosition: row[5] || undefined,
          hasSpecialStar: Boolean(row[6]),
          specialStatus: specialType ? {
            type: specialType,
            labelTh: row[8] || (specialType === 'closed' ? 'ปิดร้าน' : 'Big Cleaning'),
            labelEn: row[9] || (specialType === 'closed' ? 'Studio Closed' : 'Big Cleaning'),
            subTh: row[10] || '',
            subEn: row[11] || '',
            badgeBg: row[12] || (specialType === 'closed' ? '#222222' : '#BAE6FD'),
            badgeText: row[13] || (specialType === 'closed' ? '#FFFFFF' : '#0284C7')
          } : undefined
        };
      });
    } else {
      // Generate default initial bar configs if no custom rows exist yet
      const daysCount = new Date(year, (month > 0 && month <= 12 ? month : month + 1), 0).getDate();
      for (let d = 1; d <= daysCount; d++) {
        let pillPos: 'single' | 'start' | 'middle' | 'end' | undefined = undefined;
        let isPinkPill = false;
        let isBrownPill = false;
        let branch = 'Nakhonsawan';
        let tourCity: string | undefined = undefined;
        let hasSpecialStar = false;
        let specialStatus: any = undefined;

        if (d === 1 || d === 13 || d === 20 || d === 27) pillPos = 'start';
        else if (d === 4 || d === 16 || d === 23 || d === 30) pillPos = 'end';
        else if (d === 25) pillPos = 'single';
        else if ((d >= 2 && d <= 3) || (d >= 14 && d <= 15) || (d >= 21 && d <= 22) || (d >= 28 && d <= 29)) pillPos = 'middle';

        if (d >= 1 && d <= 4) {
          isPinkPill = true;
          branch = 'Ratchathewi';
        } else if (d >= 13 && d <= 16) {
          isBrownPill = true;
          branch = 'On-Tour';
          tourCity = 'เชียงใหม่';
        } else if (d >= 20 && d <= 23) {
          isPinkPill = true;
          branch = 'Ratchathewi';
        } else if (d === 25) {
          hasSpecialStar = true;
        } else if (d >= 27 && d <= 30) {
          isPinkPill = true;
          branch = 'Ratchathewi';
        }

        if (d === 8) {
          specialStatus = {
            type: 'closed',
            labelTh: 'ปิดร้าน',
            labelEn: 'Studio Closed',
            subTh: 'วันหยุดประจำสัปดาห์',
            subEn: 'Weekly Off-Day',
            badgeBg: '#222222',
            badgeText: '#FFFFFF'
          };
        } else if (d === 18) {
          specialStatus = {
            type: 'big_cleaning',
            labelTh: 'Big Cleaning',
            labelEn: 'Big Cleaning',
            subTh: 'ปิดทำความสะอาด & อบโอโซน',
            subEn: 'Deep Clean & Space Purification',
            badgeBg: '#BAE6FD',
            badgeText: '#0284C7'
          };
        }

        bars[d] = {
          dayNum: d,
          branch,
          tourCity,
          isPinkPill,
          isBrownPill,
          pillPosition: pillPos,
          hasSpecialStar,
          specialStatus
        };
      }
    }

    res.json({ success: true, data: bars });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/facilitator (Public)
 */
eventsRouter.get('/facilitator', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const facRes = db.exec("SELECT id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certifications, lineOa, email, phone, instagram FROM facilitator WHERE id = 'default'");
    if (facRes && facRes.length > 0 && facRes[0].values.length > 0) {
      const [id, nameTh, nameEn, titleTh, titleEn, photoUrl, bioShortTh, bioShortEn, bioLongTh, bioLongEn, certsJson, lineOa, email, phone, instagram] = facRes[0].values[0];
      let certs: string[] = [];
      try {
        certs = certsJson ? JSON.parse(certsJson as string) : [];
      } catch {
        certs = [];
      }
      res.json({
        success: true,
        data: {
          id: (id as string) || 'default',
          nameTh: (nameTh as string) || '',
          nameEn: (nameEn as string) || '',
          titleTh: (titleTh as string) || '',
          titleEn: (titleEn as string) || '',
          photoUrl: (photoUrl as string) || '',
          bioShortTh: (bioShortTh as string) || '',
          bioShortEn: (bioShortEn as string) || '',
          bioLongTh: (bioLongTh as string) || '',
          bioLongEn: (bioLongEn as string) || '',
          certifications: certs,
          lineOa: (lineOa as string) || '',
          email: (email as string) || '',
          phone: (phone as string) || '',
          instagram: (instagram as string) || ''
        }
      });
      return;
    }
    res.status(404).json({ success: false, error: 'Facilitator profile not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/services (Public)
 */
eventsRouter.get('/services', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const srvRes = db.exec("SELECT id, nameTh, nameEn, category, descriptionTh, descriptionEn, basePrice, durationMinutes, photoUrl, isActive, displayOrder FROM services WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt ASC");
    const services: any[] = [];
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
    res.json({ success: true, data: services });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/contact (Public)
 */
eventsRouter.get('/contact', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const contactRes = db.exec("SELECT id, lineOa, lineUrl, email, phone, instagram, facebook, website FROM contact_info WHERE id = 'default'");
    if (contactRes && contactRes.length > 0 && contactRes[0].values.length > 0) {
      const [id, lineOa, lineUrl, email, phone, instagram, facebook, website] = contactRes[0].values[0];
      res.json({
        success: true,
        data: {
          id: (id as string) || 'default',
          lineOa: (lineOa as string) || '',
          lineUrl: (lineUrl as string) || '',
          email: (email as string) || '',
          phone: (phone as string) || '',
          instagram: (instagram as string) || '',
          facebook: (facebook as string) || '',
          website: (website as string) || ''
        }
      });
      return;
    }
    res.status(404).json({ success: false, error: 'Contact info not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
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
