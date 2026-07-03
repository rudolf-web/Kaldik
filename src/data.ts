import { EventCategory, CalendarEvent, CategoryId } from './types';

export const EVENT_CATEGORIES: Record<CategoryId, EventCategory> = {
  HE: {
    id: 'HE',
    name: 'Hari Efektif Belajar',
    bgColor: 'bg-emerald-600',
    textColor: 'text-white',
    borderColor: 'border-emerald-700',
    lightBgColor: 'bg-emerald-50/50',
    lightTextColor: 'text-emerald-800',
    symbol: 'HE',
    isHoliday: false,
  },
  LU: {
    id: 'LU',
    name: 'Libur Umum / Nasional',
    bgColor: 'bg-rose-600',
    textColor: 'text-white',
    borderColor: 'border-rose-700',
    lightBgColor: 'bg-rose-100',
    lightTextColor: 'text-rose-700 font-bold',
    symbol: 'LU',
    isHoliday: true,
  },
  LS1: {
    id: 'LS1',
    name: 'Libur Semester 1',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-700',
    lightBgColor: 'bg-blue-100',
    lightTextColor: 'text-blue-700',
    symbol: 'LS1',
    isHoliday: true,
  },
  LS2: {
    id: 'LS2',
    name: 'Libur Semester 2',
    bgColor: 'bg-sky-600',
    textColor: 'text-white',
    borderColor: 'border-sky-700',
    lightBgColor: 'bg-sky-100',
    lightTextColor: 'text-sky-700',
    symbol: 'LS2',
    isHoliday: true,
  },
  LPP: {
    id: 'LPP',
    name: 'Libur Permulaan Puasa',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    borderColor: 'border-purple-700',
    lightBgColor: 'bg-purple-100',
    lightTextColor: 'text-purple-700',
    symbol: 'LPP',
    isHoliday: true,
  },
  LHR: {
    id: 'LHR',
    name: 'Libur Hari Raya (Idul Fitri / dll)',
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-700',
    lightBgColor: 'bg-green-100',
    lightTextColor: 'text-green-700',
    symbol: 'LHR',
    isHoliday: true,
  },
  KTS: {
    id: 'KTS',
    name: 'Kegiatan Tengah Semester',
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
    borderColor: 'border-amber-600',
    lightBgColor: 'bg-amber-100',
    lightTextColor: 'text-amber-800',
    symbol: 'KTS',
    isHoliday: false,
  },
  AS: {
    id: 'AS',
    name: 'Asesmen Sekolah / Ujian',
    bgColor: 'bg-pink-500',
    textColor: 'text-white',
    borderColor: 'border-pink-600',
    lightBgColor: 'bg-pink-100',
    lightTextColor: 'text-pink-800',
    symbol: 'AS',
    isHoliday: false,
  },
  RPR: {
    id: 'RPR',
    name: 'Penyerahan Rapor',
    bgColor: 'bg-teal-600',
    textColor: 'text-white',
    borderColor: 'border-teal-700',
    lightBgColor: 'bg-teal-100',
    lightTextColor: 'text-teal-800 font-semibold',
    symbol: 'RPR',
    isHoliday: false,
  },
  MPLS: {
    id: 'MPLS',
    name: 'Masa Pengenalan Lingkungan Sekolah',
    bgColor: 'bg-cyan-500',
    textColor: 'text-white',
    borderColor: 'border-cyan-600',
    lightBgColor: 'bg-cyan-100',
    lightTextColor: 'text-cyan-800',
    symbol: 'MPLS',
    isHoliday: false,
  },
  LKH: {
    id: 'LKH',
    name: 'Libur Khusus',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    borderColor: 'border-orange-600',
    lightBgColor: 'bg-orange-100',
    lightTextColor: 'text-orange-800',
    symbol: 'LKH',
    isHoliday: true,
  },
};

// Helper to pad month/day to 2 digits
const pad = (n: number) => n.toString().padStart(2, '0');

export function getDefaultNationalHolidays(startYear: number): CalendarEvent[] {
  const nextYear = startYear + 1;
  return [
    {
      id: `nat-islamic-ny-${startYear}`,
      title: 'Tahun Baru Islam 1448 H',
      startDate: `${startYear}-07-17`,
      endDate: `${startYear}-07-17`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-indep-${startYear}`,
      title: 'Hari Kemerdekaan RI',
      startDate: `${startYear}-08-17`,
      endDate: `${startYear}-08-17`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-prophet-bday-${startYear}`,
      title: 'Maulid Nabi Muhammad SAW',
      startDate: `${startYear}-09-15`,
      endDate: `${startYear}-09-15`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-christmas-${startYear}`,
      title: 'Hari Raya Natal',
      startDate: `${startYear}-12-25`,
      endDate: `${startYear}-12-25`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-newyear-${nextYear}`,
      title: 'Tahun Baru Masehi',
      startDate: `${nextYear}-01-01`,
      endDate: `${nextYear}-01-01`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-isra-${nextYear}`,
      title: 'Isra Mi\'raj Nabi Muhammad SAW',
      startDate: `${nextYear}-02-06`,
      endDate: `${nextYear}-02-06`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-imlek-${nextYear}`,
      title: 'Tahun Baru Imlek 2578 Kongzili',
      startDate: `${nextYear}-02-17`,
      endDate: `${nextYear}-02-17`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-nyepi-${nextYear}`,
      title: 'Hari Suci Nyepi (Tahun Baru Saka 1949)',
      startDate: `${nextYear}-03-09`,
      endDate: `${nextYear}-03-09`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-goodfriday-${nextYear}`,
      title: 'Wafat Isa Almasih (Jumat Agung)',
      startDate: `${nextYear}-03-26`,
      endDate: `${nextYear}-03-26`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-easter-${nextYear}`,
      title: 'Hari Raya Paskah',
      startDate: `${nextYear}-03-28`,
      endDate: `${nextYear}-03-28`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-labor-${nextYear}`,
      title: 'Hari Buruh Internasional',
      startDate: `${nextYear}-05-01`,
      endDate: `${nextYear}-05-01`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-ascension-${nextYear}`,
      title: 'Kenaikan Isa Almasih',
      startDate: `${nextYear}-05-06`,
      endDate: `${nextYear}-05-06`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-vesak-${nextYear}`,
      title: 'Hari Raya Waisak 2571 BE',
      startDate: `${nextYear}-05-16`,
      endDate: `${nextYear}-05-16`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-pancasila-${nextYear}`,
      title: 'Hari Lahir Pancasila',
      startDate: `${nextYear}-06-01`,
      endDate: `${nextYear}-06-01`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
    {
      id: `nat-iduladha-${nextYear}`,
      title: 'Hari Raya Idul Adha 1448 H',
      startDate: `${nextYear}-06-16`,
      endDate: `${nextYear}-06-16`,
      categoryId: 'LU',
      isNationalHoliday: true,
    },
  ];
}

export function getDefaultSchoolEvents(startYear: number): CalendarEvent[] {
  const nextYear = startYear + 1;
  return [
    // --- JULI 2026 ---
    {
      id: `sch-raker-${startYear}`,
      title: 'Rapat Kerja Guru Awal Tahun Pelajaran 2026-2027',
      startDate: `${startYear}-06-29`,
      endDate: `${startYear}-07-01`,
      categoryId: 'HE',
    },
    {
      id: `sch-dapodik-${startYear}`,
      title: 'Update DAPODIK & SKPBM Dinas / Rapat LOS',
      startDate: `${startYear}-07-06`,
      endDate: `${startYear}-07-06`,
      categoryId: 'HE',
    },
    {
      id: `sch-bod-juli-${startYear}`,
      title: 'BOD Meeting Rutin Mingguan',
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-07-29`, // Represent as range or specific dates
      categoryId: 'HE',
    },
    {
      id: `sch-firstday-${startYear}`,
      title: 'Hari Pertama Masuk Sekolah',
      startDate: `${startYear}-07-13`,
      endDate: `${startYear}-07-13`,
      categoryId: 'MPLS',
    },
    {
      id: `sch-los-mpls-${startYear}`,
      title: 'Kegiatan Hari Pertama & Orientasi Siswa (LOS/MPLS)',
      startDate: `${startYear}-07-14`,
      endDate: `${startYear}-07-18`,
      categoryId: 'MPLS',
    },
    {
      id: `sch-parents-meeting-${startYear}`,
      title: 'Parents Meeting Awal Tahun Pelajaran 2026-2027',
      startDate: `${startYear}-07-16`,
      endDate: `${startYear}-07-16`,
      categoryId: 'KTS',
    },
    {
      id: `sch-ortu-pmb-${startYear}`,
      title: 'Pemanggilan Ortu Terkait PMB (Siswa Khusus)',
      startDate: `${startYear}-07-13`,
      endDate: `${startYear}-07-29`,
      categoryId: 'KTS',
    },
    {
      id: `sch-foto-kartu-${startYear}`,
      title: 'Pengambilan Foto Siswa untuk Kartu Pelajar',
      startDate: `${startYear}-07-14`,
      endDate: `${startYear}-07-17`,
      categoryId: 'HE',
    },
    {
      id: `sch-cetak-kartu-${startYear}`,
      title: 'Pencetakan & Pembagian Kartu Pelajar / Perpus',
      startDate: `${startYear}-07-18`,
      endDate: `${startYear}-07-27`,
      categoryId: 'HE',
    },
    {
      id: `sch-keuangan-juli-${startYear}`,
      title: 'IT Absen Moodle / Pencairan Keuangan & Upload VA',
      startDate: `${startYear}-07-23`,
      endDate: `${startYear}-07-31`,
      categoryId: 'HE',
    },
    {
      id: `sch-swimming-juli-${startYear}`,
      title: 'Swimming PG / KG1 / KG2 & CK',
      startDate: `${startYear}-07-28`,
      endDate: `${startYear}-07-30`,
      categoryId: 'KTS',
    },
    {
      id: `sch-weekly-juli-${startYear}`,
      title: 'Chapel, Buku Pribadi & Penilaian Mingguan',
      startDate: `${startYear}-07-17`,
      endDate: `${startYear}-07-31`,
      categoryId: 'KTS',
    },

    // --- AGUSTUS 2026 ---
    {
      id: `sch-va-agustus-${startYear}`,
      title: 'Pembayaran Uang Sekolah & PMB Gelombang 2',
      startDate: `${startYear}-08-01`,
      endDate: `${startYear}-08-31`,
      categoryId: 'HE',
    },
    {
      id: `sch-slm1-persiapan-${startYear}`,
      title: 'Persiapan & Checking Soal SLM 1',
      startDate: `${startYear}-08-03`,
      endDate: `${startYear}-08-05`,
      categoryId: 'HE',
    },
    {
      id: `sch-science-chef-agus-${startYear}`,
      title: 'Little Science & Little Chef / Chapel',
      startDate: `${startYear}-08-07`,
      endDate: `${startYear}-08-28`,
      categoryId: 'KTS',
    },
    {
      id: `sch-slm1-pekan-${startYear}`,
      title: 'Pekan SLM 1 melalui Moodle (Kelas 1-2 Paper-based)',
      startDate: `${startYear}-08-10`,
      endDate: `${startYear}-08-20`,
      categoryId: 'AS',
    },
    {
      id: `sch-lomba-hut-${startYear}`,
      title: 'Aneka Lomba HUT RI',
      startDate: `${startYear}-08-14`,
      endDate: `${startYear}-08-14`,
      categoryId: 'KTS',
    },
    {
      id: `sch-upacara-hut-${startYear}`,
      title: 'Upacara Bendera HUT RI Ke-81',
      startDate: `${startYear}-08-17`,
      endDate: `${startYear}-08-17`,
      categoryId: 'KTS',
    },
    {
      id: `sch-remidi-slm1-${startYear}`,
      title: 'Pekan Remidi SLM 1',
      startDate: `${startYear}-08-21`,
      endDate: `${startYear}-08-31`,
      categoryId: 'AS',
    },
    {
      id: `sch-swimming-agus-${startYear}`,
      title: 'Swimming PG / KG 1 / KG 2 & CK',
      startDate: `${startYear}-08-24`,
      endDate: `${startYear}-08-27`,
      categoryId: 'KTS',
    },

    // --- SEPTEMBER 2026 ---
    {
      id: `sch-remidi-slm1-lanjut-${startYear}`,
      title: 'Lanjutan Pekan Remidi SLM 1 & PMB Gelombang 3',
      startDate: `${startYear}-09-01`,
      endDate: `${startYear}-09-30`,
      categoryId: 'AS',
    },
    {
      id: `sch-sts-persiapan-${startYear}`,
      title: 'Persiapan, Checking & Input Soal STS (PTS)',
      startDate: `${startYear}-09-01`,
      endDate: `${startYear}-09-03`,
      categoryId: 'HE',
    },
    {
      id: `sch-puncak-tema-tk-${startYear}`,
      title: 'Puncak Tema (PS-TK)',
      startDate: `${startYear}-09-11`,
      endDate: `${startYear}-09-11`,
      categoryId: 'KTS',
    },
    {
      id: `sch-sts-pekan-${startYear}`,
      title: 'Pekan STS (Penilaian Tengah Semester) Ganjil (SD-SMP-SMA)',
      startDate: `${startYear}-09-14`,
      endDate: `${startYear}-09-24`,
      categoryId: 'AS',
    },
    {
      id: `sch-swimming-sept-${startYear}`,
      title: 'Swimming PG / KG1 / KG2 & CK',
      startDate: `${startYear}-09-22`,
      endDate: `${startYear}-09-24`,
      categoryId: 'KTS',
    },
    {
      id: `sch-fieldtrip-tk-${startYear}`,
      title: 'Field Trip PG-TK',
      startDate: `${startYear}-09-25`,
      endDate: `${startYear}-09-25`,
      categoryId: 'KTS',
    },

    // --- OKTOBER 2026 ---
    {
      id: `sch-batik-oktober-${startYear}`,
      title: 'Hari Batik Nasional & Field Trip SD',
      startDate: `${startYear}-10-02`,
      endDate: `${startYear}-10-02`,
      categoryId: 'KTS',
    },
    {
      id: `sch-sts-nilai-${startYear}`,
      title: 'Deadline Pengumpulan DKN & Rapat Nilai STS Ganjil',
      startDate: `${startYear}-10-05`,
      endDate: `${startYear}-10-06`,
      categoryId: 'HE',
    },
    {
      id: `sch-sts-cetak-${startYear}`,
      title: 'Cetak, Penandatanganan & Administrasi Rapor Mid Smt',
      startDate: `${startYear}-10-07`,
      endDate: `${startYear}-10-07`,
      categoryId: 'HE',
    },
    {
      id: `sch-retreat-${startYear}`,
      title: 'RETREAT / Pesantren Kilat SD Kelas 5-6 & SMP-SMA',
      startDate: `${startYear}-10-08`,
      endDate: `${startYear}-10-10`,
      categoryId: 'KTS',
    },
    {
      id: `sch-libur-tengah-sem-${startYear}`,
      title: 'Libur Tengah Semester Ganjil PG-TK & SD Kelas 1-4',
      startDate: `${startYear}-10-08`,
      endDate: `${startYear}-10-11`,
      categoryId: 'LKH',
    },
    {
      id: `sch-sts-rapor-mid-${startYear}`,
      title: 'Pembagian Raport Tengah Semester Ganjil kepada Orang Tua',
      startDate: `${startYear}-10-17`,
      endDate: `${startYear}-10-17`,
      categoryId: 'RPR',
    },
    {
      id: `sch-bahasa-oktober-${startYear}`,
      title: 'Bulan Bahasa dan UN Day (SD, SMP, SMA) & Sumpah Pemuda',
      startDate: `${startYear}-10-23`,
      endDate: `${startYear}-10-28`,
      categoryId: 'KTS',
    },
    {
      id: `sch-pjbl-presentasi-${startYear}`,
      title: 'Presentasi PJBL Ganjil',
      startDate: `${startYear}-10-30`,
      endDate: `${startYear}-10-30`,
      categoryId: 'KTS',
    },
    {
      id: `sch-slm2-pekan-${startYear}`,
      title: 'Pekan SLM2 (SD & SMP-SMA)',
      startDate: `${startYear}-10-19`,
      endDate: `${startYear}-10-28`,
      categoryId: 'AS',
    },

    // --- NOVEMBER 2026 ---
    {
      id: `sch-sas-revisi-${startYear}`,
      title: 'Penyerahan, Pemeriksaan & Input Soal SAS (PAS)',
      startDate: `${startYear}-11-02`,
      endDate: `${startYear}-11-03`,
      categoryId: 'HE',
    },
    {
      id: `sch-hari-ayah-${startYear}`,
      title: 'Hari Ayah dan Hari Pahlawan (PS-TK-SD)',
      startDate: `${startYear}-11-07`,
      endDate: `${startYear}-11-07`,
      categoryId: 'KTS',
    },
    {
      id: `sch-pahlawan-upacara-${startYear}`,
      title: 'Upacara Bendera & Lomba Hari Pahlawan',
      startDate: `${startYear}-11-10`,
      endDate: `${startYear}-11-10`,
      categoryId: 'KTS',
    },
    {
      id: `sch-baksos-nov-${startYear}`,
      title: 'Bakti Sosial & Review Puncak Tema P5 (TK)',
      startDate: `${startYear}-11-16`,
      endDate: `${startYear}-11-27`,
      categoryId: 'KTS',
    },
    {
      id: `sch-sas-pekan-${startYear}`,
      title: 'Pekan SAS Ganjil (SD-SMP-SMA)',
      startDate: `${startYear}-11-19`,
      endDate: `${startYear}-11-30`,
      categoryId: 'AS',
    },

    // --- DESEMBER 2026 ---
    {
      id: `sch-sas-pekan-lanjut-${startYear}`,
      title: 'Lanjutan Pekan SAS Ganjil',
      startDate: `${startYear}-12-01`,
      endDate: `${startYear}-12-03`,
      categoryId: 'AS',
    },
    {
      id: `sch-gladi-natal-${startYear}`,
      title: 'Gladi Bersih Natal & Perayaan Natal PG-TK',
      startDate: `${startYear}-12-02`,
      endDate: `${startYear}-12-04`,
      categoryId: 'KTS',
    },
    {
      id: `sch-cetak-raport-des-${startYear}`,
      title: 'DKN, Rapat Nilai, Cetak & Penandatanganan Rapor Ganjil',
      startDate: `${startYear}-12-07`,
      endDate: `${startYear}-12-09`,
      categoryId: 'HE',
    },
    {
      id: `sch-pasca-sas-${startYear}`,
      title: 'Kegiatan PASCA SAS Ganjil & Perayaan Natal Bersama',
      startDate: `${startYear}-12-07`,
      endDate: `${startYear}-12-11`,
      categoryId: 'KTS',
    },
    {
      id: `sch-rapor-ganjil-${startYear}`,
      title: 'Pembagian Raport Semester Ganjil (TK, SD, SMP, SMA)',
      startDate: `${startYear}-12-12`,
      endDate: `${startYear}-12-12`,
      categoryId: 'RPR',
    },
    {
      id: `sch-libur-semester1-${startYear}`,
      title: 'Libur Akhir Semester Ganjil untuk Siswa',
      startDate: `${startYear}-12-13`,
      endDate: `${nextYear}-01-04`,
      categoryId: 'LS1',
    },
    {
      id: `sch-libur-guru-${startYear}`,
      title: 'Libur Akhir Semester Ganjil untuk Guru (Tentative)',
      startDate: `${startYear}-12-24`,
      endDate: `${nextYear}-01-01`,
      categoryId: 'LKH',
    },
    {
      id: `sch-cuti-bersama-natal-${startYear}`,
      title: 'Cuti Bersama Hari Raya Natal',
      startDate: `${startYear}-12-26`,
      endDate: `${startYear}-12-26`,
      categoryId: 'LKH',
    },

    // --- JANUARI 2027 (Semester Genap) ---
    {
      id: `sch-masuk-guru-${startYear}`,
      title: 'Guru dan Pegawai Masuk Kerja',
      startDate: `${nextYear}-01-02`,
      endDate: `${nextYear}-01-02`,
      categoryId: 'HE',
    },
    {
      id: `sch-masuk-siswa-${startYear}`,
      title: 'Siswa Masuk Hari Pertama Semester Genap',
      startDate: `${nextYear}-01-05`,
      endDate: `${nextYear}-01-05`,
      categoryId: 'HE',
    },

    // --- SEMESTER GENAP 2027 ---
    {
      id: `sch-pts-genap-${nextYear}`,
      title: 'Asesmen Tengah Semester (ATS) Genap',
      startDate: `${nextYear}-03-08`,
      endDate: `${nextYear}-03-12`,
      categoryId: 'AS',
    },
    {
      id: `sch-kts-genap-${nextYear}`,
      title: 'Kegiatan Tengah Semester (KTS) Genap',
      startDate: `${nextYear}-03-15`,
      endDate: `${nextYear}-03-17`,
      categoryId: 'KTS',
    },
    {
      id: `sch-pat-genap-${nextYear}`,
      title: 'Asesmen Akhir Tahun (AAT)',
      startDate: `${nextYear}-06-07`,
      endDate: `${nextYear}-06-11`,
      categoryId: 'AS',
    },
    {
      id: `sch-rapor-genap-${nextYear}`,
      title: 'Pembagian Rapor Semester Genap',
      startDate: `${nextYear}-06-18`,
      endDate: `${nextYear}-06-18`,
      categoryId: 'RPR',
    },
    {
      id: `sch-libur-sem2-${nextYear}`,
      title: 'Libur Akhir Semester Genap',
      startDate: `${nextYear}-06-21`,
      endDate: `${nextYear}-07-02`,
      categoryId: 'LS2',
    },
  ];
}

// Full helper function to calculate the calendar statistics for an entire Academic Year.
// Given a year start, events, categories and weekend holiday config (5 or 6 day work-week).
export function generateMonthData(monthIndex: number, startYear: number): { year: number; month: number } {
  // Academic months: index 0 is July of startYear, index 11 is June of nextYear.
  const month = (monthIndex + 6) % 12; // 0=July, 1=August, ..., 5=December, 6=January, 11=June
  const year = monthIndex < 6 ? startYear : startYear + 1;
  return { year, month };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthNameIndonesian(month: number): string {
  const names = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return names[month];
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
  return dateStr >= startStr && dateStr <= endStr;
}
