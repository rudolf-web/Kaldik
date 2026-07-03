export type CategoryId =
  | 'HE'    // Hari Efektif Belajar
  | 'LU'    // Libur Umum / Nasional
  | 'LS1'   // Libur Semester 1
  | 'LS2'   // Libur Semester 2
  | 'LPP'   // Libur Permulaan Puasa
  | 'LHR'   // Libur Hari Raya (Idul Fitri / dll)
  | 'KTS'   // Kegiatan Tengah Semester
  | 'AS'    // Asesmen Sekolah / Ujian
  | 'RPR'   // Penyerahan Rapor
  | 'MPLS'  // Masa Pengenalan Lingkungan Sekolah
  | 'LKH';  // Libur Khusus (Cuti Bersama / dll)

export interface EventCategory {
  id: CategoryId;
  name: string;
  bgColor: string;      // Tailwind class for background, e.g., 'bg-red-500'
  textColor: string;    // Tailwind class for text, e.g., 'text-white'
  borderColor: string;  // Tailwind class for border, e.g., 'border-red-600'
  lightBgColor: string; // Tailwind class for light background (used in calendar cells), e.g., 'bg-red-50'
  lightTextColor: string; // Tailwind class for light text, e.g., 'text-red-800'
  symbol: string;       // Shorthand code, e.g., 'LU'
  isHoliday: boolean;   // Does it count as a non-effective learning day?
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  categoryId: CategoryId;
  isNationalHoliday?: boolean;
}

export interface SchoolConfig {
  schoolName: string;
  schoolYear: string;   // e.g. "2026/2027"
  startYear: number;    // e.g. 2026 (for July 2026 - June 2027)
  principalName: string;
  principalNip: string;
  city: string;
  issueDate: string;
  isSixDayWeek: boolean; // true = Saturday is school day, false = Saturday is holiday (5 days week)
  fontFamilyTitle?: string; // e.g. 'Inter', 'Outfit', 'Space Grotesk', etc.
  fontFamilyBody?: string;  // e.g. 'Inter', 'JetBrains Mono', etc.
  monthHeaderBg?: string;   // hex string, e.g. '#2563eb'
  monthHeaderTextColor?: string; // hex string, e.g. '#ffffff'
  sundayBg?: string;        // hex string, e.g. '#fef2f2'
  sundayTextColor?: string; // hex string, e.g. '#ef4444'
  layoutPreset?: 'grid-4x3' | 'grid-3x4' | 'grid-2x6' | 'list-12x1';
  headerStyle?: 'solid' | 'outline' | 'minimal-underline' | 'rounded-pills';
  customCategoryColors?: Record<string, string>; // maps category ID to background HEX color
  logoUrl?: string; // custom logo URL or base64 image data string
  showMonthlyEventsInPrint?: boolean; // whether to show monthly detailed info list
}

export interface DayInfo {
  dateStr: string;      // YYYY-MM-DD
  dayNum: number;       // 1 - 31
  dayOfWeek: number;    // 0 = Sunday, 6 = Saturday
  isSunday: boolean;
  isSaturday: boolean;
  isOffDay: boolean;    // is weekend or holiday
  category: EventCategory | null;
  event: CalendarEvent | null;
}

export interface MonthAnalysis {
  monthIndex: number;   // 0 = July, 11 = June
  monthName: string;
  year: number;
  totalDays: number;    // HK (Hari Kalender)
  effectiveDays: number; // HE (Hari Efektif)
  holidayDays: number;  // HL (Hari Libur - Weekend + Holiday Events)
  effectiveWeeks: number; // ME (Minggu Efektif)
}

export interface YearAnalysis {
  months: MonthAnalysis[];
  totalHK: number;
  totalHE: number;
  totalHL: number;
  totalME: number;
}
