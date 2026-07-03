import React, { useState, useEffect, ChangeEvent } from 'react';
import { CalendarEvent, CategoryId, SchoolConfig, YearAnalysis } from './types';
import { getDefaultNationalHolidays, getDefaultSchoolEvents, EVENT_CATEGORIES } from './data';
import { calculateYearAnalysis } from './utils';
import { CalendarGrid } from './components/CalendarGrid';
import { EventForm } from './components/EventForm';
import { AnalysisTable } from './components/AnalysisTable';
import { PrintPreview } from './components/PrintPreview';
import { User as FirebaseUser } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout as googleLogout,
  listKaldikFiles,
  loadKaldikFile,
  saveKaldikFile,
  deleteKaldikFile,
  DriveFile
} from './lib/drive';
import {
  Printer,
  Sparkles,
  School,
  FileText,
  User,
  MapPin,
  CalendarDays,
  Settings,
  HelpCircle,
  Clock,
  X,
  CheckCircle,
  ChevronDown,
  Download,
  Upload,
  Palette,
  Database,
  Link2,
  Image,
} from 'lucide-react';

const LOCAL_STORAGE_KEY_CONFIG = 'kaldik_school_config';
const LOCAL_STORAGE_KEY_EVENTS = 'kaldik_school_events';

const FONT_TITLE_OPTIONS = [
  { id: 'Inter', name: 'Inter (Sleek Sans)' },
  { id: 'Outfit', name: 'Outfit (Elegant Round)' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech Modern)' },
  { id: 'Playfair Display', name: 'Playfair Display (Editorial Serif)' },
  { id: 'Nunito', name: 'Nunito (Friendly Rounded)' },
  { id: 'Lexend', name: 'Lexend (Highly Legible Education)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Technical Mono)' },
];

const FONT_BODY_OPTIONS = [
  { id: 'Inter', name: 'Inter (Clean Sans)' },
  { id: 'Outfit', name: 'Outfit (Soft Round)' },
  { id: 'Nunito', name: 'Nunito (Friendly)' },
  { id: 'Lexend', name: 'Lexend (Education Friendly)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Code)' },
];

const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: 'SD "MIMI" Citraland',
  schoolYear: '2026/2027',
  startYear: 2026,
  principalName: 'Rudolf A. Luhukay, S.Th.',
  principalNip: '197908242005011002',
  city: 'Surabaya',
  issueDate: '13 Juli 2026',
  isSixDayWeek: false,
  fontFamilyTitle: 'Inter',
  fontFamilyBody: 'Inter',
  monthHeaderBg: '#2563eb', // Royal Blue
  monthHeaderTextColor: '#ffffff',
  sundayBg: '#fef2f2',
  sundayTextColor: '#ef4444',
  layoutPreset: 'grid-4x3',
  headerStyle: 'solid',
  customCategoryColors: {},
  showMonthlyEventsInPrint: true,
};

export default function App() {
  // --- States ---
  const [config, setConfig] = useState<SchoolConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONFIG, ...parsed };
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_CONFIG;
  });

  const [settingsTab, setSettingsTab] = useState<'identity' | 'design' | 'backup'>('identity');

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      ...getDefaultNationalHolidays(DEFAULT_CONFIG.startYear),
      ...getDefaultSchoolEvents(DEFAULT_CONFIG.startYear),
    ];
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [activeBrushCategory, setActiveBrushCategory] = useState<CategoryId | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Gemini AI state
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiSuggestedEvents, setAiSuggestedEvents] = useState<CalendarEvent[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Time indicator (UTC / Local)
  const [currentTime, setCurrentTime] = useState('');

  // Google Drive state
  const [gUser, setGUser] = useState<FirebaseUser | null>(null);
  const [gToken, setGToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [currentDriveFileId, setCurrentDriveFileId] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveFileName, setDriveFileName] = useState('');

  // --- Effects ---
  // Live Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Google auth and list files
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGUser(user);
        setGToken(token);
      },
      () => {
        setGUser(null);
        setGToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set default drive filename based on active schoolName and schoolYear
  useEffect(() => {
    if (config) {
      const sanitizedSchoolName = config.schoolName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const sanitizedYear = config.schoolYear.replace('/', '_');
      setDriveFileName(`kaldik_${sanitizedSchoolName}_${sanitizedYear}`);
    }
  }, [config.schoolName, config.schoolYear]);

  // Load drive files on login
  useEffect(() => {
    if (gToken) {
      loadDriveFiles();
    } else {
      setDriveFiles([]);
    }
  }, [gToken]);

  // Save config to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  // Save events to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  // --- Calculations ---
  const analysis: YearAnalysis = calculateYearAnalysis(config.startYear, events, config.isSixDayWeek);

  // --- Handlers ---
  const loadDriveFiles = async () => {
    if (!gToken) return;
    setIsDriveLoading(true);
    try {
      const files = await listKaldikFiles(gToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsDriveLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGUser(result.user);
        setGToken(result.accessToken);
        alert(`Berhasil masuk sebagai ${result.user.displayName}!`);
      }
    } catch (err: any) {
      alert(`Gagal login Google: ${err.message}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGUser(null);
      setGToken(null);
      setCurrentDriveFileId(null);
      setDriveFiles([]);
      alert("Berhasil keluar dari akun Google.");
    } catch (err: any) {
      alert(`Gagal logout: ${err.message}`);
    }
  };

  const handleSaveToDrive = async (overwrite: boolean) => {
    if (!gToken) {
      alert("Harap hubungkan akun Google Drive Anda terlebih dahulu.");
      return;
    }
    if (!driveFileName.trim()) {
      alert("Harap masukkan nama file.");
      return;
    }

    setIsSavingToDrive(true);
    try {
      const fileId = overwrite ? currentDriveFileId : null;
      const res = await saveKaldikFile(gToken, driveFileName, fileId, { config, events });
      setCurrentDriveFileId(res.id);
      
      if (res.name) {
        setDriveFileName(res.name.replace(/\.kaldik$/, ''));
      }
      
      alert(`Berhasil menyimpan file "${res.name}" ke Google Drive!`);
      await loadDriveFiles();
    } catch (err: any) {
      alert(`Gagal menyimpan ke Google Drive: ${err.message}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleLoadFromDrive = async (file: DriveFile) => {
    if (!gToken) return;
    const confirmLoad = window.confirm(
      `Apakah Anda yakin ingin memuat draf "${file.name}" dari Google Drive? Seluruh rancangan kalender aktif Anda akan digantikan.`
    );
    if (!confirmLoad) return;

    setIsDriveLoading(true);
    try {
      const data = await loadKaldikFile(gToken, file.id);
      if (data && typeof data === 'object') {
        if (data.config) {
          setConfig({ ...DEFAULT_CONFIG, ...data.config });
        }
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
        setCurrentDriveFileId(file.id);
        setDriveFileName(file.name.replace(/\.kaldik$/, ''));
        alert(`Berhasil memuat draf "${file.name}" dari Google Drive!`);
      }
    } catch (err: any) {
      alert(`Gagal memuat file dari Google Drive: ${err.message}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDeleteFromDrive = async (file: DriveFile) => {
    if (!gToken) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus file "${file.name}" secara permanen dari Google Drive? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmDelete) return;

    setIsDriveLoading(true);
    try {
      await deleteKaldikFile(gToken, file.id);
      if (currentDriveFileId === file.id) {
        setCurrentDriveFileId(null);
      }
      alert(`Berhasil menghapus file "${file.name}" dari Google Drive.`);
      await loadDriveFiles();
    } catch (err: any) {
      alert(`Gagal menghapus file: ${err.message}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Ukuran file logo terlalu besar. Maksimal 1 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({ ...prev, logoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleDateClick = (dateStr: string) => {
    if (activeBrushCategory) {
      // BRUSH PAINT MODE
      const existingIdx = events.findIndex((e) => e.startDate === dateStr && e.endDate === dateStr);

      if (existingIdx >= 0) {
        const existing = events[existingIdx];
        if (existing.categoryId === activeBrushCategory) {
          // Erase (toggle off) if clicking with the exact same category
          setEvents(events.filter((_, i) => i !== existingIdx));
        } else {
          // Update category
          const updated = [...events];
          updated[existingIdx] = {
            ...existing,
            categoryId: activeBrushCategory,
            title: EVENT_CATEGORIES[activeBrushCategory].name,
          };
          setEvents(updated);
        }
      } else {
        // Add new single-day event
        const newEvent: CalendarEvent = {
          id: `brush-${dateStr}-${Date.now()}`,
          title: EVENT_CATEGORIES[activeBrushCategory].name,
          startDate: dateStr,
          endDate: dateStr,
          categoryId: activeBrushCategory,
        };
        setEvents([...events, newEvent]);
      }
    } else {
      // STANDARD SELECTION MODE (opens manual addition form)
      setSelectedDate(dateStr);
    }
  };

  const handleAddEvent = (newEventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...newEventData,
      id: `manual-${Date.now()}`,
    };
    setEvents([...events, newEvent]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const handleResetToDefault = () => {
    setEvents([
      ...getDefaultNationalHolidays(config.startYear),
      ...getDefaultSchoolEvents(config.startYear),
    ]);
    setSelectedDate(null);
  };

  const handleAcademicYearChange = (startYearStr: string) => {
    const startYear = parseInt(startYearStr, 10);
    const endYear = startYear + 1;
    const schoolYear = `${startYear}/${endYear}`;

    if (
      window.confirm(
        `Apakah Anda ingin mereset kalender dan memuat agenda default untuk Tahun Pelajaran ${schoolYear}? Semua agenda kustom Anda saat ini akan dihapus.`
      )
    ) {
      setConfig({
        ...config,
        startYear,
        schoolYear,
        issueDate: `13 Juli ${startYear}`,
      });
      setEvents([...getDefaultNationalHolidays(startYear), ...getDefaultSchoolEvents(startYear)]);
      setSelectedDate(null);
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify({ config, events }, null, 2)
      );
      const downloadAnchor = document.createElement('a');
      const sanitizedSchoolName = config.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const sanitizedYear = config.schoolYear.replace('/', '_');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `kaldik_${sanitizedSchoolName}_${sanitizedYear}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Gagal melakukan ekspor file desain.");
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (!e.target.files || e.target.files.length === 0) return;
    
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          if (parsed.config) {
            setConfig({ ...DEFAULT_CONFIG, ...parsed.config });
          }
          if (parsed.events && Array.isArray(parsed.events)) {
            setEvents(parsed.events);
          }
          alert("Konfigurasi dan agenda Kaldik berhasil diimpor!");
        } else {
          alert("Format file JSON tidak valid.");
        }
      } catch (err) {
        alert("Gagal membaca file JSON. Pastikan file valid.");
      }
    };
  };

  // Trigger server-side Gemini AI audit & sync
  const handleTriggerGeminiAI = async () => {
    setIsAILoading(true);
    setAiSuggestions(null);
    setAiSuggestedEvents([]);

    try {
      const response = await fetch('/api/gemini/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, events }),
      });

      if (!response.ok) {
        throw new Error('Gagal merespon dari server.');
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
      setAiSuggestedEvents(data.missingEvents || []);
      setAiModalOpen(true);
    } catch (err: any) {
      alert(`Error: ${err.message || 'Koneksi ke server terganggu.'}`);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleImportAIEvents = () => {
    if (aiSuggestedEvents.length === 0) return;

    // Filter out duplicates based on startDate & endDate (or append them)
    const existingDates = new Set(events.map((e) => `${e.startDate}_${e.categoryId}`));
    const newEvents = aiSuggestedEvents.filter((e) => !existingDates.has(`${e.startDate}_${e.categoryId}`));

    if (newEvents.length === 0) {
      alert('Semua rekomendasi kegiatan AI sudah ada di kalender Anda!');
      setAiModalOpen(false);
      return;
    }

    setEvents([...events, ...newEvents]);
    alert(`Berhasil menambahkan ${newEvents.length} kegiatan baru dari audit AI!`);
    setAiModalOpen(false);
  };

  if (showPrintView) {
    return (
      <PrintPreview
        config={config}
        events={events}
        analysis={analysis}
        onBack={() => setShowPrintView(false)}
        gUser={gUser}
        gToken={gToken}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand/School Identity */}
          <div className="flex items-center gap-3">
            {config.logoUrl ? (
              <div className="w-10 h-10 border border-slate-100 rounded-lg flex items-center justify-center bg-slate-50 p-1 shadow-xs">
                <img 
                  src={config.logoUrl} 
                  alt="Logo Sekolah" 
                  className="max-w-full max-h-full object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs">
                {config.schoolName ? config.schoolName.charAt(0).toUpperCase() : 'M'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-slate-800 text-lg uppercase tracking-tight leading-none">
                  Generator Kaldik {config.schoolName}
                </h1>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                  Citraland Surabaya
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sistem Penyusunan Kalender Akademik Terintegrasi
              </p>
            </div>
          </div>

          {/* Quick Stats & Print Controls */}
          <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-end">
            {/* Live Clock Helper */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Clock size={13} className="text-blue-500" />
              <span>{currentTime}</span>
            </div>

            {/* Academic Year Selector */}
            <div className="relative">
              <select
                value={config.startYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer hover:bg-slate-50/50"
              >
                <option value="2025">TP 2025/2026</option>
                <option value="2026">TP 2026/2027</option>
                <option value="2027">TP 2027/2028</option>
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={14} />
              </span>
            </div>

            {/* School System Work Toggler */}
            <button
              onClick={() => setConfig({ ...config, isSixDayWeek: !config.isSixDayWeek })}
              className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all cursor-pointer ${
                config.isSixDayWeek
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
              title="Sistem kerja 5 hari sekolah (Sabtu libur) atau 6 hari sekolah (Sabtu masuk)"
            >
              {config.isSixDayWeek ? '6 Hari Kerja' : '5 Hari Kerja'}
            </button>

            {/* Toggle Configuration Settings Panel */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                showSettings
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Pengaturan Identitas Sekolah"
            >
              <Settings size={16} />
            </button>

            {/* View Printable Document */}
            <button
              onClick={() => setShowPrintView(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Printer size={14} /> Pratinjau Cetak / PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-grow space-y-6">
        {/* 1. School Metadata Settings Panel (Collapsible with Tabs) */}
        {showSettings && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200 font-sans">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <h2 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  Konfigurasi & Desain Kaldik
                </h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Buttons */}
            <div className="flex border-b border-slate-100 mb-5 gap-2 pb-1 text-xs">
              <button
                onClick={() => setSettingsTab('identity')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
                  settingsTab === 'identity'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <School size={14} /> Identitas Sekolah
              </button>
              <button
                onClick={() => setSettingsTab('design')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
                  settingsTab === 'design'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Palette size={14} /> Desain & Kustomisasi
              </button>
              <button
                onClick={() => setSettingsTab('backup')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
                  settingsTab === 'backup'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database size={14} /> Cadangan (Save & Load)
              </button>
            </div>

            {/* TAB CONTENT: IDENTITY */}
            {settingsTab === 'identity' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <School size={12} /> Nama Sekolah
                  </label>
                  <input
                    type="text"
                    value={config.schoolName}
                    onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <User size={12} /> Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={config.principalName}
                    onChange={(e) => setConfig({ ...config, principalName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <FileText size={12} /> NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={config.principalNip}
                    onChange={(e) => setConfig({ ...config, principalNip: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Kota & Tanggal Pengesahan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={config.city}
                      onChange={(e) => setConfig({ ...config, city: e.target.value })}
                      placeholder="Kota"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={config.issueDate}
                      onChange={(e) => setConfig({ ...config, issueDate: e.target.value })}
                      placeholder="Tanggal"
                      className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Custom Logo Upload / Link Section */}
                <div className="col-span-1 md:col-span-4 border-t border-slate-100 pt-4 mt-2">
                  <h3 className="font-sans font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                    <Image size={13} className="text-blue-600" /> Logo Sekolah & Kop Surat
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Preview Area */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50 h-24">
                      {config.logoUrl ? (
                        <div className="relative group w-20 h-20 flex items-center justify-center">
                          <img 
                            src={config.logoUrl} 
                            alt="Logo Sekolah" 
                            className="max-w-full max-h-full object-contain rounded-md" 
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setConfig({ ...config, logoUrl: '' })}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md cursor-pointer hover:scale-105 transition-all"
                            title="Hapus Logo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <div className="w-8 h-8 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-1">
                            <School size={14} className="text-slate-400" />
                          </div>
                          <span className="text-[10px] block">Belum ada logo</span>
                        </div>
                      )}
                    </div>

                    {/* Inputs Area */}
                    <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Upload Logo File */}
                      <div className="border border-slate-100 rounded-lg p-3 bg-white">
                        <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Upload size={12} className="text-blue-500" /> Unggah File Logo
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            id="logo-upload"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition-all w-full text-center text-xs shadow-xs"
                          >
                            <Image size={14} className="text-blue-500" />
                            Pilih File Gambar
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Mendukung PNG, JPG, WEBP, atau SVG (Maks. 1MB)
                        </p>
                      </div>

                      {/* Direct Logo URL */}
                      <div className="border border-slate-100 rounded-lg p-3 bg-white">
                        <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Link2 size={12} className="text-blue-500" /> Tautan Gambar Langsung (Direct Link / URL)
                        </label>
                        <input
                          type="text"
                          value={config.logoUrl || ''}
                          onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png atau data:image/..."
                          className="w-full border border-slate-200 rounded-lg p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Tempel tautan gambar web langsung atau string base64
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DESIGN */}
            {settingsTab === 'design' && (
              <div className="space-y-6 text-xs animate-in fade-in duration-150">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Font Title Selector */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Font Judul & Header Bulan</label>
                    <select
                      value={config.fontFamilyTitle || 'Inter'}
                      onChange={(e) => setConfig({ ...config, fontFamilyTitle: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {FONT_TITLE_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Font Body Selector */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Font Konten & Hari</label>
                    <select
                      value={config.fontFamilyBody || 'Inter'}
                      onChange={(e) => setConfig({ ...config, fontFamilyBody: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {FONT_BODY_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Layout Preset Selector */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Preset Grid Tata Letak</label>
                    <select
                      value={config.layoutPreset || 'grid-4x3'}
                      onChange={(e) => setConfig({ ...config, layoutPreset: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="grid-4x3">Grid 4x3 (Standar Poster - Landscape)</option>
                      <option value="grid-3x4">Grid 3x4 (Sedang - Portrait)</option>
                      <option value="grid-2x6">Grid 2x6 (Langsing - Vertikal)</option>
                      <option value="list-12x1">Daftar Berurutan 12x1 (Full Portrait)</option>
                    </select>
                  </div>

                  {/* Month Header Style Selector */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Gaya Header Bulan</label>
                    <select
                      value={config.headerStyle || 'solid'}
                      onChange={(e) => setConfig({ ...config, headerStyle: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="solid">Solid Banner (Warna Blok)</option>
                      <option value="outline">Outline Box (Garis Pinggir)</option>
                      <option value="minimal-underline">Minimal Underline (Garis Bawah)</option>
                      <option value="rounded-pills">Rounded Pills (Bentuk Kapsul)</option>
                    </select>
                  </div>
                </div>

                {/* View Options / Switch */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="font-extrabold text-slate-700 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <Settings size={13} className="text-blue-500" />
                    Opsi Tampilan Cetak
                  </h3>
                  <div className="flex flex-wrap gap-6 items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-xs">
                      <input
                        type="checkbox"
                        checked={config.showMonthlyEventsInPrint ?? true}
                        onChange={(e) => setConfig({ ...config, showMonthlyEventsInPrint: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Tampilkan Kolom Keterangan Kegiatan Per Bulan di Lembar Pratinjau</span>
                    </label>
                  </div>
                </div>

                {/* Color Scheme Picker Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                  {/* Month Header Bg Color */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: config.monthHeaderBg }} />
                      Warna Latar Header Bulan
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={config.monthHeaderBg || '#2563eb'}
                        onChange={(e) => setConfig({ ...config, monthHeaderBg: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={config.monthHeaderBg || '#2563eb'}
                        onChange={(e) => setConfig({ ...config, monthHeaderBg: e.target.value })}
                        className="font-mono text-[11px] border border-slate-200 rounded p-1.5 w-20 uppercase"
                      />
                    </div>
                  </div>

                  {/* Month Header Text Color */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: config.monthHeaderTextColor }} />
                      Warna Teks Header Bulan
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={config.monthHeaderTextColor || '#ffffff'}
                        onChange={(e) => setConfig({ ...config, monthHeaderTextColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={config.monthHeaderTextColor || '#ffffff'}
                        onChange={(e) => setConfig({ ...config, monthHeaderTextColor: e.target.value })}
                        className="font-mono text-[11px] border border-slate-200 rounded p-1.5 w-20 uppercase"
                      />
                    </div>
                  </div>

                  {/* Sunday Bg Color */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: config.sundayBg }} />
                      Warna Latar Hari Minggu
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={config.sundayBg || '#fef2f2'}
                        onChange={(e) => setConfig({ ...config, sundayBg: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={config.sundayBg || '#fef2f2'}
                        onChange={(e) => setConfig({ ...config, sundayBg: e.target.value })}
                        className="font-mono text-[11px] border border-slate-200 rounded p-1.5 w-20 uppercase"
                      />
                    </div>
                  </div>

                  {/* Sunday Text Color */}
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: config.sundayTextColor }} />
                      Warna Teks Hari Minggu
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={config.sundayTextColor || '#ef4444'}
                        onChange={(e) => setConfig({ ...config, sundayTextColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={config.sundayTextColor || '#ef4444'}
                        onChange={(e) => setConfig({ ...config, sundayTextColor: e.target.value })}
                        className="font-mono text-[11px] border border-slate-200 rounded p-1.5 w-20 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Category Custom Colors */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="font-extrabold text-slate-700 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <Palette size={13} className="text-blue-500" />
                    Kustomisasi Warna Kategori Kegiatan Sekolah
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {Object.values(EVENT_CATEGORIES).map((cat) => {
                      const currentVal = config.customCategoryColors?.[cat.id] || (cat.id === 'HE' ? '#2563eb' : cat.id === 'LU' ? '#ef4444' : cat.id === 'LS1' ? '#f59e0b' : cat.id === 'LS2' ? '#f59e0b' : cat.id === 'AS' ? '#8b5cf6' : cat.id === 'MPLS' ? '#10b981' : '#64748b');
                      
                      return (
                        <div key={cat.id} className="bg-slate-50 border border-slate-150 p-2 rounded-lg flex flex-col justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${cat.bgColor} ${cat.textColor}`}>
                              {cat.symbol}
                            </span>
                            <span className="text-slate-600 font-bold truncate text-[10px]">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={currentVal}
                              onChange={(e) => {
                                const updatedColors = { ...(config.customCategoryColors || {}) };
                                updatedColors[cat.id] = e.target.value;
                                setConfig({ ...config, customCategoryColors: updatedColors });
                              }}
                              className="w-6 h-6 rounded cursor-pointer border border-slate-200"
                            />
                            <button
                              onClick={() => {
                                const updatedColors = { ...(config.customCategoryColors || {}) };
                                delete updatedColors[cat.id];
                                setConfig({ ...config, customCategoryColors: updatedColors });
                              }}
                              className="text-[9px] text-slate-400 hover:text-slate-600 cursor-pointer underline"
                              title="Reset ke warna default"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: BACKUP (SAVE / LOAD) */}
            {settingsTab === 'backup' && (
              <div className="space-y-6 text-xs animate-in fade-in duration-150">
                {/* Google Drive Integration Card */}
                <div className="bg-slate-50 border border-blue-100 rounded-xl p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-100">
                        <svg viewBox="0 0 87.3 78" className="w-5 h-5">
                          <path fill="#0066da" d="M6.2 19l19.5 33.7 13-22.5L25.7 1z"/>
                          <path fill="#00ac47" d="M38.7 30.2L25.7 52.7h39l13-22.5z"/>
                          <path fill="#ffba00" d="M19.2 52.7L6.2 75.2h52L71.2 52.7z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">Penyimpanan Awan Google Drive</h3>
                        <p className="text-[10px] text-slate-500">Sinkronisasikan, cadangkan, dan muat rancangan kalender pendidikan Anda langsung dengan Google Drive.</p>
                      </div>
                    </div>

                    {/* User Auth State Control */}
                    {gUser ? (
                      <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                        {gUser.photoURL && (
                          <img src={gUser.photoURL} alt="Foto Profil" className="w-6 h-6 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
                        )}
                        <div className="text-left">
                          <p className="font-bold text-[10px] text-slate-800 leading-tight">{gUser.displayName}</p>
                          <p className="text-[9px] text-slate-400 leading-none">{gUser.email}</p>
                        </div>
                        <button
                          onClick={handleGoogleLogout}
                          className="ml-1 text-[9px] font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200/50 rounded-full px-2.5 py-1 cursor-pointer transition-all"
                        >
                          Keluar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGoogleLogin}
                        disabled={isDriveLoading}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3.5 py-2 font-bold cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-sm transition-all"
                      >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        Hubungkan Google Drive
                      </button>
                    )}
                  </div>

                  {gUser ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Simpan file */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                            <Download size={14} className="text-blue-600" />
                            Simpan Kaldik ke Drive
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                            Simpan rancangan kalender pendidikan aktif Anda langsung ke akun Google Drive Anda agar aman dan dapat diakses dari perangkat lain.
                          </p>

                          <div className="mb-4">
                            <label className="block text-[10px] font-extrabold text-slate-500 mb-1">Nama File di Drive</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={driveFileName}
                                onChange={(e) => setDriveFileName(e.target.value)}
                                className="flex-1 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium"
                                placeholder="nama_file_kaldik"
                              />
                              <span className="self-center font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-200/50">
                                .kaldik
                              </span>
                            </div>
                          </div>

                          {currentDriveFileId && (
                            <div className="bg-blue-50 border border-blue-200/30 rounded-lg p-2.5 mb-4 text-[10px] text-blue-800 flex items-center justify-between">
                              <span>Menghubungkan draf aktif Google Drive.</span>
                              <button
                                onClick={() => setCurrentDriveFileId(null)}
                                className="text-[9px] underline font-bold cursor-pointer hover:text-blue-950"
                              >
                                Buat Baru
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {currentDriveFileId && (
                            <button
                              onClick={() => handleSaveToDrive(true)}
                              disabled={isSavingToDrive}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              {isSavingToDrive ? 'Menyimpan...' : 'Perbarui File'}
                            </button>
                          )}
                          <button
                            onClick={() => handleSaveToDrive(false)}
                            disabled={isSavingToDrive}
                            className={`flex-1 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                              currentDriveFileId 
                                ? 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50' 
                                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
                            }`}
                          >
                            {isSavingToDrive && !currentDriveFileId ? 'Menyimpan...' : 'Simpan Baru'}
                          </button>
                        </div>
                      </div>

                      {/* Daftar file */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col shadow-xs">
                        <h4 className="font-extrabold text-slate-800 text-xs mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Database size={14} className="text-emerald-600" />
                            File Kaldik di Google Drive
                          </span>
                          <button
                            onClick={loadDriveFiles}
                            disabled={isDriveLoading}
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer disabled:opacity-50"
                          >
                            Segarkan
                          </button>
                        </h4>

                        {isDriveLoading ? (
                          <div className="flex-grow flex flex-col items-center justify-center py-8 text-slate-400">
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full mb-1"></span>
                            <span>Memuat file...</span>
                          </div>
                        ) : driveFiles.length > 0 ? (
                          <div className="flex-grow max-h-44 overflow-y-auto border border-slate-150 rounded-lg divide-y divide-slate-100 bg-slate-50/10">
                            {driveFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 text-[10.5px] hover:bg-slate-50/50">
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-bold text-slate-700 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-[8.5px] text-slate-400">
                                    Diubah: {new Date(file.modifiedTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleLoadFromDrive(file)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/30 font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                                  >
                                    Buka
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFromDrive(file)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/30 font-bold px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                                    title="Hapus permanen"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-grow flex flex-col items-center justify-center py-8 text-slate-400 italic text-[10px]">
                            Belum ada file draf .kaldik di Google Drive Anda.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/30 border border-blue-100/30 rounded-lg p-5 text-center text-slate-500">
                      <p className="font-extrabold text-slate-700 mb-1">Mendukung Pencadangan Otomatis Awan</p>
                      <p className="text-[10.5px] leading-relaxed max-w-md mx-auto">
                        Hubungkan akun Google Drive Anda untuk menyimpan seluruh setelan kalender pendidikan secara awan (Cloud), melacak versi draf desain, serta mengekspor langsung hasil cetakan.
                      </p>
                    </div>
                  )}
                </div>

                {/* Local JSON backup block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Save Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
                        <Download size={16} className="text-emerald-600" />
                        Ekspor Desain Kaldik Lokal (.JSON)
                      </h3>
                      <p className="text-slate-500 leading-relaxed mb-4">
                        Simpan rancangan kalender pendidikan ini ke komputer lokal Anda. File cadangan ini akan merekam seluruh data kegiatan sekolah, hari libur, identitas sekolah, serta pengaturan gaya visual Anda.
                      </p>
                    </div>
                    <button
                      onClick={handleExportJSON}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <Download size={15} /> Simpan File Desain
                    </button>
                  </div>

                  {/* Load Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
                        <Upload size={16} className="text-indigo-600 animate-pulse" />
                        Impor File Desain Lokal (.JSON)
                      </h3>
                      <p className="text-slate-500 leading-relaxed mb-4">
                        Memuat rancangan kalender pendidikan dari file .JSON lokal yang telah diekspor sebelumnya. Proses ini akan menggantikan seluruh data kegiatan dan desain aktif dengan setelan dari file lokal tersebut.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        id="json-file-input"
                        className="hidden"
                      />
                      <button
                        onClick={() => document.getElementById('json-file-input')?.click()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <Upload size={15} /> Unggah & Muat File Desain
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Main Workspace (Grid columns: Calendar + Editor) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Calendar 12 Months Grid (2/3 Width) */}
          <div className="xl:col-span-8 space-y-4">
            <div className="bg-slate-100 rounded-xl p-4 border border-slate-200/50 shadow-xs">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <CalendarDays size={14} className="text-blue-600" />
                  Rancangan Kalender Pendidikan - TP {config.schoolYear}
                </span>
                <span className="text-[10px] text-slate-500 italic">
                  *Klik tanggal untuk menambah kegiatan, atau aktifkan alat lukis kuas (Brush).
                </span>
              </div>

              <CalendarGrid
                config={config}
                events={events}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
                hoveredDate={hoveredDate}
                onDateMouseEnter={setHoveredDate}
                onDateMouseLeave={() => setHoveredDate(null)}
                activeBrushCategory={activeBrushCategory}
              />
            </div>
          </div>

          {/* Event Form Editor Sidebar (1/3 Width) */}
          <div className="xl:col-span-4">
            <EventForm
              config={config}
              events={events}
              selectedDate={selectedDate}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onResetToDefault={handleResetToDefault}
              activeBrushCategory={activeBrushCategory}
              setActiveBrushCategory={setActiveBrushCategory}
              onTriggerGeminiAI={handleTriggerGeminiAI}
              isAILoading={isAILoading}
            />
          </div>
        </div>

        {/* 3. Analysis calculations section */}
        <div>
          <AnalysisTable config={config} events={events} analysis={analysis} />
        </div>
      </main>

      {/* Footer credits block */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 font-sans px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold">
            Kalender Pendidikan SD &quot;MIMI&quot; Citraland Surabaya &bull; TP {config.schoolYear}
          </p>
          <p className="text-slate-400">
            Dibuat oleh <strong>Rudolf A. Luhukay, S.Th.</strong> &bull; Terintegrasi Google AI Studio & Gemini
          </p>
        </div>
      </footer>

      {/* Gemini AI Suggestions Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-violet-600 to-indigo-600 p-5 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="animate-pulse" />
                <div>
                  <h3 className="font-sans font-black text-base tracking-tight leading-none">
                    Hasil Audit Kurikulum Gemini AI
                  </h3>
                  <p className="text-[10px] text-violet-100 mt-1">TP {config.schoolYear} &bull; SD MIMI Surabaya</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="text-violet-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm leading-relaxed grow">
              {/* Written Suggestions */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs font-medium whitespace-pre-wrap font-sans text-indigo-950">
                {aiSuggestions}
              </div>

              {/* Recommended Events to Import */}
              {aiSuggestedEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-sans font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-blue-600" />
                    Rekomendasi Agenda Libur/Kegiatan Baru ({aiSuggestedEvents.length})
                  </h4>
                  <div className="border border-slate-150 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {aiSuggestedEvents.map((e) => {
                      const cat = EVENT_CATEGORIES[e.categoryId as CategoryId] || EVENT_CATEGORIES.HE;
                      const sD = new Date(e.startDate);
                      const eD = new Date(e.endDate);
                      const dStr =
                        e.startDate === e.endDate
                          ? sD.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          : `${sD.getDate()} - ${eD.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}`;

                      return (
                        <div key={e.id} className="flex items-center justify-between p-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${cat.bgColor} ${cat.textColor} uppercase mr-2`}
                            >
                              {cat.symbol}
                            </span>
                            <span className="font-bold text-slate-800">{e.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono whitespace-nowrap ml-2">
                            {dStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="text-xs text-slate-600 hover:text-slate-800 font-bold px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {aiSuggestedEvents.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportAIEvents}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 shadow-xs hover:shadow-md transition-colors cursor-pointer"
                >
                  <CheckCircle size={14} /> Import Semua ({aiSuggestedEvents.length}) Agenda
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
