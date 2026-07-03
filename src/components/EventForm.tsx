import React, { useState, useEffect } from 'react';
import { CalendarEvent, CategoryId, SchoolConfig } from '../types';
import { EVENT_CATEGORIES } from '../data';
import { Plus, Trash2, Calendar, Paintbrush, ShieldAlert, Check, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

interface EventFormProps {
  config: SchoolConfig;
  events: CalendarEvent[];
  selectedDate: string | null;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onResetToDefault: () => void;
  activeBrushCategory: CategoryId | null;
  setActiveBrushCategory: (cat: CategoryId | null) => void;
  onTriggerGeminiAI?: () => void; // Optional AI enhancement trigger
  isAILoading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  config,
  events,
  selectedDate,
  onAddEvent,
  onDeleteEvent,
  onResetToDefault,
  activeBrushCategory,
  setActiveBrushCategory,
  onTriggerGeminiAI,
  isAILoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('KTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Pre-fill start/end date when a date is selected on the calendar
  useEffect(() => {
    if (selectedDate) {
      setStartDate(selectedDate);
      if (!endDate || endDate < selectedDate) {
        setEndDate(selectedDate);
      }
    }
  }, [selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    onAddEvent({
      title: title.trim(),
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      categoryId,
    });

    // Reset form
    setTitle('');
  };

  // Filter events list
  const filteredEvents = events.filter((evt) => {
    const matchesSearch = evt.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || evt.categoryId === filterCategory;
    return matchesSearch && matchesCat;
  });

  // Sort events by date
  const sortedFilteredEvents = [...filteredEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-6 print:hidden">
      {/* 1. Paint Brush (Quick Marker Tool) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">
              <Paintbrush size={20} />
            </span>
            <h3 className="font-sans font-bold text-slate-800 text-base">Alat Lukis Cepat (Brush)</h3>
          </div>
          {activeBrushCategory && (
            <button
              onClick={() => setActiveBrushCategory(null)}
              className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-200 font-medium transition-colors"
            >
              Matikan
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Aktifkan brush, lalu <strong>klik sel tanggal mana saja</strong> pada kalender untuk langsung mewarnainya dengan kategori yang Anda pilih!
        </p>

        <div className="grid grid-cols-2 gap-2">
          {Object.values(EVENT_CATEGORIES).map((cat) => {
            const isBrushActive = activeBrushCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveBrushCategory(isBrushActive ? null : cat.id)}
                className={`flex items-center justify-between p-2 rounded-lg text-left border transition-all cursor-pointer ${
                  isBrushActive
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/25'
                    : 'border-slate-150 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md ${cat.bgColor} ${cat.textColor} text-[9px] font-bold flex items-center justify-center flex-shrink-0`}
                  >
                    {cat.symbol}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate">{cat.name}</span>
                </div>
                {isBrushActive && (
                  <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Standard Form Editor */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
          <span className="text-blue-600">
            <Plus size={20} />
          </span>
          <h3 className="font-sans font-bold text-slate-800 text-base">Tambah / Edit Kegiatan</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kegiatan / Libur</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ujian Tengah Semester"
              required
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Warna</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as CategoryId)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white"
            >
              {Object.values(EVENT_CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.symbol} - {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Simpan Kegiatan
          </button>
        </form>
      </div>

      {/* 3. Gemini AI Helper Option */}
      {onTriggerGeminiAI && (
        <div className="bg-linear-to-br from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-600">
              <Sparkles size={18} />
            </span>
            <h3 className="font-sans font-bold text-slate-800 text-sm">Asisten AI Kaldik</h3>
          </div>
          <p className="text-xs text-indigo-950 mb-3 leading-relaxed">
            Biarkan Gemini AI mengaudit kalender Anda dan otomatis menambahkan hari libur nasional atau mengorganisir jadwal ujian sekolah!
          </p>
          <button
            type="button"
            onClick={onTriggerGeminiAI}
            disabled={isAILoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl py-2 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {isAILoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Menghubungkan ke Gemini...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Sinkronisasi & Auto-Fill AI
              </>
            )}
          </button>
        </div>
      )}

      {/* 4. Active Events List & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">
              <Calendar size={20} />
            </span>
            <h3 className="font-sans font-bold text-slate-800 text-base">Daftar Kegiatan ({events.length})</h3>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin mengembalikan semua kegiatan ke setelan default SD MIMI?')) {
                onResetToDefault();
              }
            }}
            title="Reset ke setelan default"
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-2 mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kegiatan..."
            className="w-full border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kategori</option>
            {Object.values(EVENT_CATEGORIES).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.symbol} - {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable list */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
          {sortedFilteredEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} className="text-slate-300" />
              Tidak ada kegiatan ditemukan.
            </div>
          ) : (
            sortedFilteredEvents.map((evt) => {
              const cat = EVENT_CATEGORIES[evt.categoryId];
              const isNational = evt.isNationalHoliday;

              // Format date nicely
              const startObj = new Date(evt.startDate);
              const endObj = new Date(evt.endDate);
              const dateStr =
                evt.startDate === evt.endDate
                  ? startObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : `${startObj.getDate()} - ${endObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}`;

              return (
                <div key={evt.id} className="flex items-center justify-between py-2.5 gap-2 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`text-[8px] font-bold px-1 py-0.5 rounded-md ${cat.bgColor} ${cat.textColor}`}
                      >
                        {cat.symbol}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium font-mono">{dateStr}</span>
                      {isNational && (
                        <span className="text-[8px] font-semibold px-1 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-sm">
                          Nasional
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={evt.title}>
                      {evt.title}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteEvent(evt.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Hapus kegiatan"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
