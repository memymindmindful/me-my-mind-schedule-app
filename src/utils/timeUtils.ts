// Helper to parse time string (e.g., "10:00 AM", "07:00 PM", "12:30 PM", "9 am", "19:00") into minutes since midnight
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  
  // Fallback for simple "9 am" or "7 pm" formats
  const simpleMatch = trimmed.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (simpleMatch) {
    let hours = parseInt(simpleMatch[1], 10);
    const period = simpleMatch[2].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60;
  }

  return 0;
}

// Helper to calculate duration in minutes between start and end time
export function calculateDurationMinutes(startTime: string, endTime: string, defaultMinutes: number = 90): number {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === 0 && endMin === 0) return defaultMinutes;
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60; // handle events crossing midnight
  return diff > 0 ? diff : defaultMinutes;
}
