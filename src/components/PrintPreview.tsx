import React, { useState } from 'react';
import { CalendarEvent, SchoolConfig, YearAnalysis } from '../types';
import { EVENT_CATEGORIES } from '../data';
import { CalendarGrid } from './CalendarGrid';
import { AnalysisTable } from './AnalysisTable';
import { Printer, ArrowLeft, Download, ClipboardList } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { generateMonthData, getMonthNameIndonesian } from '../utils';
import { uploadExportToDrive } from '../lib/drive';
import { User as FirebaseUser } from 'firebase/auth';

const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

const getMonthEvents = (monthIndex: number, startYear: number, events: CalendarEvent[]): { event: CalendarEvent; datesText: string }[] => {
  const { year, month } = generateMonthData(monthIndex, startYear);
  const monthStart = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
  const monthEnd = `${year}-${(month + 1).toString().padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

  // Get events for this month
  const monthEvents = events.filter((e) => {
    return e.startDate <= monthEnd && e.endDate >= monthStart;
  });

  // Sort events by start date
  const sortedEvents = [...monthEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return sortedEvents.map((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    
    const startYearVal = start.getFullYear();
    const startMonthVal = start.getMonth();
    const endYearVal = end.getFullYear();
    const endMonthVal = end.getMonth();

    const isStartInThisMonth = startMonthVal === month && startYearVal === year;
    const isEndInThisMonth = endMonthVal === month && endYearVal === year;

    const startDay = isStartInThisMonth ? start.getDate() : 1;
    const endDay = isEndInThisMonth ? end.getDate() : new Date(year, month + 1, 0).getDate();

    let datesText = '';
    if (startDay === endDay) {
      datesText = `${startDay}`;
    } else {
      datesText = `${startDay}-${endDay}`;
    }

    return { event: e, datesText };
  });
};

interface PrintPreviewProps {
  config: SchoolConfig;
  events: CalendarEvent[];
  analysis: YearAnalysis;
  onBack: () => void;
  gUser: FirebaseUser | null;
  gToken: string | null;
  onGoogleLogin: () => Promise<void>;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  config,
  events,
  analysis,
  onBack,
  gUser,
  gToken,
  onGoogleLogin,
}) => {
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleUploadToDrive = async (format: 'png' | 'jpeg') => {
    if (!gToken) {
      alert("Harap hubungkan Google Drive Anda terlebih dahulu.");
      return;
    }

    const element = document.getElementById('printable-kaldik-sheet');
    if (!element) {
      alert("Elemen lembar kalender tidak ditemukan!");
      return;
    }

    setIsUploadingToDrive(true);
    try {
      const options = {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          borderRadius: '0px',
          boxShadow: 'none',
          border: 'none',
        }
      };

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await toPng(element, options);
      } else {
        dataUrl = await toJpeg(element, options);
      }

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const blob = dataURItoBlob(dataUrl);
      
      const sanitizedSchoolName = config.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const sanitizedYear = config.schoolYear.replace('/', '_');
      const fileName = `kaldik_${sanitizedSchoolName}_${sanitizedYear}.${format}`;

      const res = await uploadExportToDrive(gToken, fileName, mimeType, blob);
      alert(`Berhasil mengunggah hasil cetak "${res.name}" ke Google Drive!`);
    } catch (error: any) {
      console.error('Error uploading to Google Drive:', error);
      alert(`Gagal mengunggah gambar ke Google Drive: ${error.message}`);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    const element = document.getElementById('printable-kaldik-sheet');
    if (!element) {
      alert("Elemen lembar kalender tidak ditemukan!");
      return;
    }

    try {
      // High pixelRatio (2) provides clear, sharp text suited for display and printing
      const options = {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          borderRadius: '0px',
          boxShadow: 'none',
          border: 'none',
        }
      };

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await toPng(element, options);
      } else {
        dataUrl = await toJpeg(element, options);
      }

      const link = document.createElement('a');
      const sanitizedSchoolName = config.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const sanitizedYear = config.schoolYear.replace('/', '_');
      link.download = `kaldik_${sanitizedSchoolName}_${sanitizedYear}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert("Gagal mengunduh gambar kalender.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0 font-sans">
      {/* Control panel - Hidden when printing */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Kembali ke Editor
          </button>
          <div>
            <h1 className="font-sans font-bold text-slate-800 text-base">Pratinjau Cetak Kalender Pendidikan</h1>
            <p className="text-xs text-slate-500">Tampilan ini dioptimalkan untuk ukuran kertas A4 (potret atau lanskap)</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {gUser ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
              <button
                onClick={() => handleUploadToDrive('png')}
                disabled={isUploadingToDrive}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Simpan cetakan PNG langsung ke Google Drive"
              >
                {isUploadingToDrive ? 'Mengunggah...' : 'Simpan ke Drive (PNG)'}
              </button>
              <button
                onClick={() => handleUploadToDrive('jpeg')}
                disabled={isUploadingToDrive}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Simpan cetakan JPG langsung ke Google Drive"
              >
                {isUploadingToDrive ? 'Mengunggah...' : 'Simpan ke Drive (JPG)'}
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleLogin}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-lg px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Hubungkan Google Drive untuk menyimpan cetakan secara awan"
            >
              <svg viewBox="0 0 87.3 78" className="w-3.5 h-3.5">
                <path fill="#0066da" d="M6.2 19l19.5 33.7 13-22.5L25.7 1z"/>
                <path fill="#00ac47" d="M38.7 30.2L25.7 52.7h39l13-22.5z"/>
                <path fill="#ffba00" d="M19.2 52.7L6.2 75.2h52L71.2 52.7z"/>
              </svg>
              Hubungkan Drive
            </button>
          )}

          <button
            onClick={() => handleDownloadImage('png')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Unduh seluruh kalender beresolusi tinggi format PNG"
          >
            <Download size={14} /> Unduh Gambar PNG
          </button>
          <button
            onClick={() => handleDownloadImage('jpeg')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Unduh seluruh kalender beresolusi tinggi format JPG"
          >
            <Download size={14} /> Unduh Gambar JPG
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 py-2 text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer size={14} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard Portrait/A4 Container) */}
      <div id="printable-kaldik-sheet" className="max-w-[1200px] mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg print:border-none print:shadow-none print:p-0 print:rounded-none">
        {/* Letterhead Header */}
        <div className="text-center border-b-4 border-double border-slate-800 pb-5 mb-6 flex flex-col items-center justify-center relative">
          {/* Logo Icon */}
          {config.logoUrl ? (
            <div className="absolute left-4 top-2 w-16 h-16 flex items-center justify-center print:w-14 print:h-14">
              <img 
                src={config.logoUrl} 
                alt="Logo Sekolah" 
                className="max-w-full max-h-full object-contain rounded-md" 
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="absolute left-4 top-2 w-16 h-16 bg-blue-600 rounded-lg text-white font-sans font-black flex items-center justify-center text-xl shadow-sm print:w-14 print:h-14 print:text-lg">
              {config.schoolName ? config.schoolName.charAt(0).toUpperCase() : 'M'}
            </div>
          )}

          <h3 className="font-sans font-extrabold text-slate-900 text-lg uppercase tracking-wider print:text-base">
            {config.schoolName.toLowerCase().includes('mimi') ? 'YAYASAN PENDIDIKAN MIMI SURABAYA' : 'KOP SURAT RESMI SEKOLAH'}
          </h3>
          <h1 className="font-sans font-black text-slate-900 text-2xl uppercase tracking-widest mt-0.5 print:text-lg">
            {config.schoolName}
          </h1>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5 print:text-[10px]">
            {config.schoolName.toLowerCase().includes('mimi') 
              ? 'Terakreditasi A • Citraland Utama Block I, Surabaya' 
              : `Terakreditasi A • ${config.city}`}
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 print:text-[8px]">
            {config.schoolName.toLowerCase().includes('mimi') 
              ? 'Telp: (031) 7451234 • Email: info@mimi-school.sch.id • Web: www.mimi-school.sch.id' 
              : `Pemerintah Kota ${config.city} • Dinas Pendidikan`}
          </p>

          <h2 className="font-sans font-black text-blue-800 text-lg uppercase tracking-wide border-t border-slate-200 mt-4 pt-3 w-full print:text-sm print:pt-2 print:mt-3">
            KALENDER PENDIDIKAN (KALDIK)
          </h2>
          <p className="font-mono font-bold text-slate-700 text-xs uppercase tracking-widest print:text-[10px]">
            TAHUN PELAJARAN {config.schoolYear}
          </p>
        </div>

        {/* Calendar Grid Area */}
        <div className="mb-8">
          <CalendarGrid
            config={config}
            events={events}
            selectedDate={null}
            onDateClick={() => {}}
            hoveredDate={null}
            onDateMouseEnter={() => {}}
            onDateMouseLeave={() => {}}
            activeBrushCategory={null}
          />
        </div>

        {/* Page break in printing before data analysis if needed, but often we can fit them nicely */}
        <div className="print:break-before-page">
          {/* Analysis Table */}
          <div className="mb-6">
            <AnalysisTable config={config} events={events} analysis={analysis} />
          </div>

          {/* Detail Rincian Kegiatan Bulanan */}
          {config.showMonthlyEventsInPrint && (
            <div className="border border-slate-200 rounded-xl p-6 mb-8 bg-white shadow-xs print:shadow-none print:border-slate-300 print:p-4 print:rounded-none break-inside-avoid">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3 print:mb-2 print:pb-1">
                <span className="text-blue-600 print:hidden">
                  <ClipboardList size={18} />
                </span>
                <h3 className="font-sans font-black text-slate-800 text-sm uppercase tracking-wider print:text-[11px]">
                  Rincian Kegiatan Pembelajaran Per Bulan
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3">
                {Array.from({ length: 12 }).map((_, monthIndex) => {
                  const { year, month } = generateMonthData(monthIndex, config.startYear);
                  const monthName = getMonthNameIndonesian(month);
                  const monthlyEventsList = getMonthEvents(monthIndex, config.startYear, events);

                  return (
                    <div 
                      key={monthIndex} 
                      className="border border-slate-150 rounded-lg p-3 bg-slate-50/20 flex flex-col h-full break-inside-avoid print:p-1.5 print:rounded-none"
                    >
                      {/* Header bulan */}
                      <div 
                        className="font-bold text-[11px] uppercase px-2.5 py-1 rounded-md text-white mb-2 tracking-wide text-center font-sans print:text-[9px] print:px-1.5 print:py-0.5 print:mb-1.5"
                        style={{ backgroundColor: config.monthHeaderBg || '#2563eb' }}
                      >
                        {monthName} {year}
                      </div>

                      {/* List kegiatan */}
                      <div className="space-y-1.5 flex-grow">
                        {monthlyEventsList.length > 0 ? (
                          monthlyEventsList.map(({ event, datesText }, idx) => {
                            const category = EVENT_CATEGORIES[event.categoryId];
                            
                            let badgeStyle: React.CSSProperties = {};
                            if (category) {
                              const customCatHex = config.customCategoryColors?.[category.id];
                              if (customCatHex) {
                                badgeStyle = {
                                  backgroundColor: customCatHex,
                                  color: '#ffffff',
                                };
                              }
                            }

                            return (
                              <div key={idx} className="flex gap-2 text-[10.5px] print:text-[8px] leading-tight items-start">
                                <span
                                  className={`font-mono font-bold text-[9px] print:text-[7.5px] px-1 py-0.5 rounded flex-shrink-0 min-w-[20px] text-center ${
                                    category && !config.customCategoryColors?.[category.id]
                                      ? `${category.textColor} ${category.bgColor}`
                                      : 'bg-slate-500 text-white'
                                  }`}
                                  style={badgeStyle}
                                >
                                  {datesText}
                                </span>
                                <span className="text-slate-700 font-medium break-words leading-tight">{event.title}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[10px] text-slate-400 italic text-center py-2 print:text-[7.5px] print:py-1">
                            Tidak ada kegiatan khusus
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Legend for print (Rendered beautifully in grid) */}
          <div className="border border-slate-200 rounded-xl p-4 mb-8 bg-slate-50/50 print:p-2 print:rounded-none">
            <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5">
              Keterangan Warna & Simbol Kalender:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs print:grid-cols-3 print:text-[9px] print:gap-1.5">
              {Object.values(EVENT_CATEGORIES).map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 bg-white border border-slate-150 p-1.5 rounded-lg print:p-1">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${cat.bgColor} ${cat.textColor} flex-shrink-0 print:w-5 print:h-5 print:text-[8px]`}
                  >
                    {cat.symbol}
                  </span>
                  <span className="text-slate-700 font-medium truncate">{cat.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-white border border-slate-150 p-1.5 rounded-lg print:p-1">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex-shrink-0 print:w-5 print:h-5 print:text-[8px]">
                  M
                </span>
                <span className="text-slate-700 font-medium">Hari Minggu (Libur Pekan)</span>
              </div>
            </div>
          </div>

          {/* Signature Block (Standard official format) */}
          <div className="grid grid-cols-2 gap-8 text-center text-sm font-sans mt-12 print:text-[11px] print:mt-8 break-inside-avoid">
            <div>
              <p className="font-semibold text-slate-800">Mengetahui,</p>
              <p className="font-bold text-slate-800">Kepala {config.schoolName}</p>
              <div className="h-20" /> {/* Space for physical signature */}
              <p className="font-bold text-slate-900 underline">{config.principalName}</p>
              <p className="text-xs text-slate-500 font-mono">NIP. {config.principalNip || '-'}</p>
            </div>

            <div>
              <p className="text-slate-600 italic">{config.city}, {config.issueDate}</p>
              <p className="font-bold text-slate-800">Koordinator Kurikulum / Pembuat</p>
              <div className="h-20" /> {/* Space for physical signature */}
              <p className="font-bold text-slate-900 underline">
                {config.schoolName.toLowerCase().includes('mimi') ? 'Rudolf A. Luhukay, S.Th.' : '_______________________'}
              </p>
              <p className="text-xs text-slate-500 font-mono">NIP. -</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
