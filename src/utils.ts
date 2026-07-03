import { CalendarEvent, DayInfo, EventCategory, MonthAnalysis, SchoolConfig, YearAnalysis } from './types';
import { EVENT_CATEGORIES, generateMonthData, getDaysInMonth, getMonthNameIndonesian, isDateInRange } from './data';

export { generateMonthData, getMonthNameIndonesian };

// Priority of event categories when resolving overlapping events
// Higher number = higher priority
const CATEGORY_PRIORITY: Record<string, number> = {
  HE: 0,
  MPLS: 1,
  RPR: 2,
  KTS: 3,
  AS: 4,
  LKH: 5,
  LPP: 6,
  LHR: 7,
  LS1: 8,
  LS2: 9,
  LU: 10, // National Holiday has the highest priority
};

// Find the winning event for a specific date
export function getEventForDate(dateStr: string, events: CalendarEvent[]): CalendarEvent | null {
  const activeEvents = events.filter(e => isDateInRange(dateStr, e.startDate, e.endDate));
  if (activeEvents.length === 0) return null;
  if (activeEvents.length === 1) return activeEvents[0];

  // If multiple events overlap, sort by category priority
  return activeEvents.reduce((prev, current) => {
    const prevPriority = CATEGORY_PRIORITY[prev.categoryId] || 0;
    const currentPriority = CATEGORY_PRIORITY[current.categoryId] || 0;
    return currentPriority > prevPriority ? current : prev;
  });
}

// Generate the array of DayInfo for a given month
export function generateMonthDays(
  year: number,
  month: number, // 0 = Jan, 11 = Dec
  events: CalendarEvent[],
  isSixDayWeek: boolean
): DayInfo[] {
  const daysInMonth = getDaysInMonth(year, month);
  const days: DayInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay(); // 0 = Sunday, ..., 6 = Saturday

    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    // By default, Sunday is always an off-day.
    // Saturday is an off-day if 5-day school week (isSixDayWeek = false).
    const isWeekendOff = isSunday || (isSaturday && !isSixDayWeek);

    // Get event for this date
    const event = getEventForDate(dateStr, events);
    let category: EventCategory | null = null;

    if (event) {
      category = EVENT_CATEGORIES[event.categoryId] || null;
    }

    const isHoliday = isWeekendOff || (category?.isHoliday ?? false);

    days.push({
      dateStr,
      dayNum: d,
      dayOfWeek,
      isSunday,
      isSaturday,
      isOffDay: isHoliday,
      category,
      event,
    });
  }

  return days;
}

// Perform calculation for a specific month
export function calculateMonthAnalysis(
  monthIndex: number, // 0 = July, 11 = June
  startYear: number,
  events: CalendarEvent[],
  isSixDayWeek: boolean
): MonthAnalysis {
  const { year, month } = generateMonthData(monthIndex, startYear);
  const days = generateMonthDays(year, month, events, isSixDayWeek);
  const totalDays = days.length;

  // 1. Calculate Effective Days (HE) and Holiday Days (HL)
  // An effective learning day is a day that is NOT a weekend off-day and is NOT marked as a holiday category
  let effectiveDays = 0;
  let holidayDays = 0;

  days.forEach(day => {
    if (day.isOffDay) {
      holidayDays++;
    } else {
      effectiveDays++;
    }
  });

  // 2. Calculate Effective Weeks (ME)
  // Standard Indonesian educational rule: "Minggu Efektif" is a week that has at least 3 effective days (HE >= 3).
  // A week runs from Monday to Sunday. Let's group all days in the month into weeks.
  // Note: Standard calendar weeks might cross month boundaries, but academically they are analyzed per month.
  // We can group the month's days based on their calendar week rows, or group them Mon-Sun.
  // Let's group them by Monday-Sunday weeks.
  const weeks: DayInfo[][] = [];
  let currentWeek: DayInfo[] = [];

  days.forEach(day => {
    currentWeek.push(day);
    // If it's Sunday (dayOfWeek === 0) or the last day of the month, close this week chunk
    if (day.dayOfWeek === 0 || day.dayNum === totalDays) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  let effectiveWeeks = 0;
  weeks.forEach(week => {
    const effectiveInWeek = week.filter(day => !day.isOffDay).length;
    if (effectiveInWeek >= 3) {
      effectiveWeeks++;
    }
  });

  return {
    monthIndex,
    monthName: getMonthNameIndonesian(month),
    year,
    totalDays,
    effectiveDays,
    holidayDays,
    effectiveWeeks,
  };
}

// Calculate the entire year analysis (July to June)
export function calculateYearAnalysis(
  startYear: number,
  events: CalendarEvent[],
  isSixDayWeek: boolean
): YearAnalysis {
  const months: MonthAnalysis[] = [];
  let totalHK = 0;
  let totalHE = 0;
  let totalHL = 0;
  let totalME = 0;

  for (let m = 0; m < 12; m++) {
    const analysis = calculateMonthAnalysis(m, startYear, events, isSixDayWeek);
    months.push(analysis);
    totalHK += analysis.totalDays;
    totalHE += analysis.effectiveDays;
    totalHL += analysis.holidayDays;
    totalME += analysis.effectiveWeeks;
  }

  return {
    months,
    totalHK,
    totalHE,
    totalHL,
    totalME,
  };
}

// Helper to check if a string is a valid date (YYYY-MM-DD)
export function isValidDate(dStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return false;
  const d = new Date(dStr);
  return !isNaN(d.getTime());
}
