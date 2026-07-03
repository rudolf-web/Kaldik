import React from 'react';
import { CalendarEvent, SchoolConfig, YearAnalysis } from '../types';
import { generateMonthDays, generateMonthData, getMonthNameIndonesian } from '../utils';
import { ClipboardList, TrendingUp } from 'lucide-react';

interface AnalysisTableProps {
  config: SchoolConfig;
  events: CalendarEvent[];
  analysis: YearAnalysis;
}

export const AnalysisTable: React.FC<AnalysisTableProps> = ({ config, events, analysis }) => {
  // Helper to format events in a month as compact text, e.g., "13-15: MPLS, 17: Hari Kemerdekaan RI"
  const getMonthEventsSummary = (monthIndex: number): string => {
    const { year, month } = generateMonthData(monthIndex, config.startYear);
    const monthStart = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const monthEnd = `${year}-${(month + 1).toString().padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    // Get events for this month
    const monthEvents = events.filter((e) => {
      // Overlap with month range
      return e.startDate <= monthEnd && e.endDate >= monthStart;
    });

    if (monthEvents.length === 0) return '-';

    // Sort events by start date
    const sortedEvents = [...monthEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));

    // Format each event nicely
    return sortedEvents
      .map((e) => {
        const sDate = new Date(e.startDate);
        const eDate = new Date(e.endDate);
        const sDay = sDate.getDate();
        const eDay = eDate.getDate();

        const dateRangeStr = sDay === eDay ? `${sDay}` : `${sDay}-${eDay}`;
        return `${dateRangeStr}: ${e.title}`;
      })
      .join('; ');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs print:shadow-none print:border-slate-300 print:p-2 print:rounded-none">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3 print:mb-2 print:pb-1">
        <span className="text-blue-600 print:hidden">
          <ClipboardList size={22} />
        </span>
        <h2 className="font-sans font-bold text-slate-800 text-xl print:text-sm">
          Analisis Hari Efektif Belajar & Minggu Efektif
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse print:text-[10px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-sans font-semibold text-slate-700 print:bg-transparent print:border-b-2">
              <th className="py-3 px-4 text-center w-12 print:py-1 print:px-1">No</th>
              <th className="py-3 px-4 print:py-1 print:px-2">Bulan</th>
              <th className="py-3 px-4 text-center print:py-1 print:px-1">Hari Kalender (HK)</th>
              <th className="py-3 px-4 text-center print:py-1 print:px-1">Hari Libur (HL)</th>
              <th className="py-3 px-4 text-center text-blue-700 font-bold print:py-1 print:px-1">Hari Efektif (HE)</th>
              <th className="py-3 px-4 text-center text-indigo-700 font-bold print:py-1 print:px-1">Minggu Efektif (ME)</th>
              <th className="py-3 px-4 print:py-1 print:px-2 print:max-w-[200px] truncate">Keterangan Kegiatan / Libur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-200">
            {analysis.months.map((m, idx) => {
              const isSemesterBreak = idx === 5 || idx === 11; // Dec and June (semester break months)
              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    isSemesterBreak ? 'bg-slate-50/30' : ''
                  } print:hover:bg-transparent`}
                >
                  <td className="py-3 px-4 text-center font-medium print:py-1 print:px-1">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 print:py-1 print:px-2">
                    {m.monthName} {m.year}
                  </td>
                  <td className="py-3 px-4 text-center print:py-1 print:px-1">{m.totalDays}</td>
                  <td className="py-3 px-4 text-center text-rose-600 font-medium print:py-1 print:px-1">
                    {m.holidayDays}
                  </td>
                  <td className="py-3 px-4 text-center text-blue-600 font-bold print:py-1 print:px-1">
                    {m.effectiveDays}
                  </td>
                  <td className="py-3 px-4 text-center text-indigo-600 font-bold print:py-1 print:px-1">
                    {m.effectiveWeeks}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-md print:py-1 print:px-2 print:text-[8px] print:max-w-[200px] whitespace-normal break-words">
                    {getMonthEventsSummary(idx)}
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200 print:bg-transparent">
              <td className="py-3.5 px-4 text-center print:py-1 print:px-1" colSpan={2}>
                TOTAL TAHUN PELAJARAN
              </td>
              <td className="py-3.5 px-4 text-center print:py-1 print:px-1">{analysis.totalHK}</td>
              <td className="py-3.5 px-4 text-center text-rose-600 print:py-1 print:px-1">
                {analysis.totalHL}
              </td>
              <td className="py-3.5 px-4 text-center text-blue-600 font-bold text-base print:py-1 print:px-1 print:text-[10px]">
                {analysis.totalHE}
              </td>
              <td className="py-3.5 px-4 text-center text-indigo-600 font-bold text-base print:py-1 print:px-1 print:text-[10px]">
                {analysis.totalME}
              </td>
              <td className="py-3.5 px-4 text-xs text-slate-500 font-normal italic print:py-1 print:px-2">
                * ME dihitung otomatis berdasarkan rumus: Minggu dalam satu bulan dinyatakan efektif jika terdapat minimal 3 hari efektif belajar (HE ≥ 3).
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 print:hidden">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Total Hari Efektif</p>
            <h4 className="text-2xl font-bold text-blue-800 mt-1">{analysis.totalHE} HE</h4>
          </div>
          <span className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <TrendingUp size={20} />
          </span>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-700 font-semibold uppercase tracking-wider">Total Minggu Efektif</p>
            <h4 className="text-2xl font-bold text-indigo-800 mt-1">{analysis.totalME} ME</h4>
          </div>
          <span className="p-3 bg-indigo-500/10 text-indigo-600 rounded-lg">
            <TrendingUp size={20} />
          </span>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-700 font-semibold uppercase tracking-wider">Total Hari Libur</p>
            <h4 className="text-2xl font-bold text-rose-800 mt-1">{analysis.totalHL} Hari</h4>
          </div>
          <span className="p-3 bg-rose-500/10 text-rose-600 rounded-lg">
            <TrendingUp size={20} />
          </span>
        </div>
      </div>
    </div>
  );
};
