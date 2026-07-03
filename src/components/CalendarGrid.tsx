import React from 'react';
import { CalendarEvent, DayInfo, SchoolConfig } from '../types';
import { generateMonthDays, generateMonthData, getMonthNameIndonesian } from '../utils';
import { EVENT_CATEGORIES } from '../data';
import { Calendar, CheckCircle } from 'lucide-react';

interface CalendarGridProps {
  config: SchoolConfig;
  events: CalendarEvent[];
  selectedDate: string | null;
  onDateClick: (dateStr: string) => void;
  hoveredDate: string | null;
  onDateMouseEnter: (dateStr: string) => void;
  onDateMouseLeave: () => void;
  activeBrushCategory: string | null; // For the "paint brush" tool
}

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FONT_MAP: Record<string, string> = {
  'Inter': '"Inter", sans-serif',
  'Outfit': '"Outfit", sans-serif',
  'Space Grotesk': '"Space Grotesk", sans-serif',
  'Playfair Display': '"Playfair Display", serif',
  'Nunito': '"Nunito", sans-serif',
  'Lexend': '"Lexend", sans-serif',
  'JetBrains Mono': '"JetBrains Mono", monospace',
};

const getMonthEvents = (days: DayInfo[]): { event: CalendarEvent; datesText: string }[] => {
  const seenEventIds = new Set<string>();
  const monthEvents: { event: CalendarEvent; datesText: string }[] = [];

  days.forEach((day) => {
    if (day.event && !seenEventIds.has(day.event.id)) {
      seenEventIds.add(day.event.id);
      
      const start = new Date(day.event.startDate);
      const end = new Date(day.event.endDate);
      let datesText = '';
      
      if (day.event.startDate === day.event.endDate) {
        datesText = `${start.getDate()}`;
      } else {
        if (start.getMonth() === end.getMonth()) {
          datesText = `${start.getDate()}-${end.getDate()}`;
        } else {
          const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
          datesText = `${start.getDate()} ${monthsIndo[start.getMonth()]} - ${end.getDate()} ${monthsIndo[end.getMonth()]}`;
        }
      }
      
      monthEvents.push({ event: day.event, datesText });
    }
  });

  return monthEvents.sort((a, b) => a.event.startDate.localeCompare(b.event.startDate));
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  config,
  events,
  selectedDate,
  onDateClick,
  hoveredDate,
  onDateMouseEnter,
  onDateMouseLeave,
  activeBrushCategory,
}) => {
  const dayNamesAbbr = ['M', 'S', 'S', 'R', 'K', 'J', 'S']; // Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu

  // Determine grid container layout class based on preset
  const isMonthlyEventsActive = !!config.showMonthlyEventsInPrint;

  let gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4';
  if (config.layoutPreset === 'grid-3x4') {
    gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4';
  } else if (config.layoutPreset === 'grid-2x6') {
    gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4';
  } else if (config.layoutPreset === 'list-12x1') {
    gridClass = 'grid grid-cols-1 max-w-2xl mx-auto gap-6 print:grid-cols-1 print:gap-4';
  }

  // Adjust container width if monthly events are active
  if (isMonthlyEventsActive) {
    if (config.layoutPreset === 'list-12x1') {
      gridClass = 'grid grid-cols-1 max-w-4xl mx-auto gap-6 print:grid-cols-1 print:gap-4';
    } else {
      gridClass = 'grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4';
    }
  }

  // Get active layout font families
  const titleFontFamily = config.fontFamilyTitle ? FONT_MAP[config.fontFamilyTitle] || config.fontFamilyTitle : undefined;
  const bodyFontFamily = config.fontFamilyBody ? FONT_MAP[config.fontFamilyBody] || config.fontFamilyBody : undefined;

  return (
    <div className={gridClass} style={{ fontFamily: bodyFontFamily }}>
      {Array.from({ length: 12 }).map((_, monthIndex) => {
        const { year, month } = generateMonthData(monthIndex, config.startYear);
        const days = generateMonthDays(year, month, events, config.isSixDayWeek);
        const monthName = getMonthNameIndonesian(month);

        // Find the day of week for the first day of the month to pad the start
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const paddingDays = Array.from({ length: firstDayOfWeek });

        // Month Header styling setup
        const headerStyleType = config.headerStyle || 'solid';
        const headerBg = config.monthHeaderBg || '#2563eb';
        const headerText = config.monthHeaderTextColor || '#ffffff';

        let headerElement = null;

        if (headerStyleType === 'outline') {
          headerElement = (
            <div
              className="text-center mb-3 p-1.5 rounded-lg border-2 print:mb-1 print:p-1 flex items-center justify-center"
              style={{
                borderColor: headerBg,
                color: headerBg,
                backgroundColor: 'transparent',
              }}
            >
              <h3
                className="font-bold text-base tracking-tight flex items-center justify-center gap-1.5"
                style={{ fontFamily: titleFontFamily }}
              >
                <span className="print:hidden">
                  <Calendar size={14} />
                </span>
                {monthName} {year}
              </h3>
            </div>
          );
        } else if (headerStyleType === 'minimal-underline') {
          headerElement = (
            <div
              className="text-center mb-3 pb-1.5 border-b-2 print:mb-1 print:pb-1 flex items-center justify-center"
              style={{
                borderBottomColor: headerBg,
              }}
            >
              <h3
                className="font-bold text-lg print:text-sm tracking-tight flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: titleFontFamily,
                  color: headerBg,
                }}
              >
                <span className="print:hidden" style={{ color: headerBg }}>
                  <Calendar size={14} />
                </span>
                {monthName} {year}
              </h3>
            </div>
          );
        } else if (headerStyleType === 'rounded-pills') {
          headerElement = (
            <div
              className="text-center mb-3 py-1.5 px-4 rounded-full print:mb-1 print:py-1 print:px-2 flex items-center justify-center"
              style={{
                backgroundColor: headerBg,
                color: headerText,
              }}
            >
              <h3
                className="font-bold text-sm tracking-tight flex items-center justify-center gap-1.5"
                style={{ fontFamily: titleFontFamily }}
              >
                <span className="print:hidden" style={{ color: headerText }}>
                  <Calendar size={13} />
                </span>
                {monthName} {year}
              </h3>
            </div>
          );
        } else {
          // Default: solid background banner
          headerElement = (
            <div
              className="text-center mb-3 p-1.5 rounded-lg print:mb-1 print:p-1 flex items-center justify-center"
              style={{
                backgroundColor: headerBg,
                color: headerText,
              }}
            >
              <h3
                className="font-bold text-sm tracking-tight flex items-center justify-center gap-1.5"
                style={{ fontFamily: titleFontFamily }}
              >
                <span className="print:hidden" style={{ color: headerText }}>
                  <Calendar size={13} />
                </span>
                {monthName} {year}
              </h3>
            </div>
          );
        }

        const monthlyEvents = getMonthEvents(days);
        const showEventsColumn = isMonthlyEventsActive && monthlyEvents.length > 0;

        return (
          <div
            key={monthIndex}
            className={`bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col print:shadow-none print:border-slate-300 print:p-2 print:rounded-none break-inside-avoid ${
              showEventsColumn ? 'col-span-1 md:col-span-2' : ''
            }`}
            id={`month-card-${monthIndex}`}
          >
            {showEventsColumn ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 print:grid-cols-12 print:gap-3 grow">
                {/* Left side: Calendar (Takes 7/12 columns) */}
                <div className="md:col-span-7 print:col-span-7 flex flex-col justify-between">
                  <div>
                    {/* Dynamic Month Header */}
                    {headerElement}

                    {/* Days of the Week Abbr Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-sans font-semibold text-xs text-slate-500 mb-1 print:gap-0.5 print:mb-0.5">
                      {dayNamesAbbr.map((abbr, idx) => {
                        let headerColStyle: React.CSSProperties = {};
                        if (idx === 0) {
                          headerColStyle = { color: config.sundayTextColor || '#ef4444', fontWeight: 'bold' };
                        } else if (idx === 6 && !config.isSixDayWeek) {
                          headerColStyle = { color: '#94a3b8' }; // text-slate-400
                        } else {
                          headerColStyle = { color: '#475569' }; // text-slate-600
                        }

                        return (
                          <div
                            key={idx}
                            className="py-1 print:py-0.5 print:text-[10px]"
                            style={headerColStyle}
                          >
                            {abbr}
                          </div>
                        );
                      })}
                    </div>

                    {/* Calendar Days Grid */}
                    <div className="grid grid-cols-7 gap-1 print:gap-0.5 grow">
                      {/* Padding for empty days at the start of the month */}
                      {paddingDays.map((_, idx) => (
                        <div key={`pad-${idx}`} className="aspect-square" />
                      ))}

                      {/* Month Days */}
                      {days.map((day) => {
                        const isSelected = selectedDate === day.dateStr;
                        const isHovered = hoveredDate === day.dateStr;

                        // Determine CSS colors for background and text
                        let bgClass = 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-100';
                        let textClass = 'text-slate-800 font-medium';
                        let borderClass = 'border-transparent';
                        let symbolBadge = '';
                        let customCellStyle: React.CSSProperties = {};
                        let customBadgeStyle: React.CSSProperties = {};

                        if (day.isSunday) {
                          const sunBg = config.sundayBg || '#fef2f2';
                          const sunText = config.sundayTextColor || '#ef4444';
                          customCellStyle = {
                            backgroundColor: sunBg,
                            color: sunText,
                            borderColor: hexToRgba(sunText, 0.15),
                          };
                          textClass = 'font-bold';
                        } else if (day.isSaturday && !config.isSixDayWeek) {
                          bgClass = 'bg-slate-100/70 hover:bg-slate-200 text-slate-500 border border-slate-200/50';
                          textClass = 'text-slate-500';
                        }

                        // If day has an assigned category
                        if (day.category) {
                          const customCatHex = config.customCategoryColors?.[day.category.id];
                          if (customCatHex) {
                            const lightBg = hexToRgba(customCatHex, 0.12);
                            const borderCol = hexToRgba(customCatHex, 0.35);
                            customCellStyle = {
                              backgroundColor: lightBg,
                              borderColor: borderCol,
                              color: customCatHex,
                            };
                            textClass = 'font-bold';
                            customBadgeStyle = {
                              backgroundColor: customCatHex,
                              color: '#ffffff',
                            };
                          } else {
                            bgClass = `${day.category.lightBgColor} hover:opacity-90 border ${day.category.borderColor}`;
                            textClass = day.category.lightTextColor;
                          }
                          symbolBadge = day.category.symbol;
                        }

                        // Highlight active brush selection or hover states
                        if (isSelected) {
                          borderClass = 'ring-2 ring-blue-500 ring-offset-1 z-10';
                        } else if (isHovered) {
                          borderClass = 'ring-1 ring-slate-400 z-10';
                        }

                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => onDateClick(day.dateStr)}
                            onMouseEnter={() => onDateMouseEnter(day.dateStr)}
                            onMouseLeave={onDateMouseLeave}
                            className={`aspect-square rounded-md text-xs flex flex-col items-center justify-between p-0.5 cursor-pointer relative transition-all duration-150 ${bgClass} ${borderClass} print:rounded-none print:border-slate-300 print:text-[9px] print:aspect-square`}
                            title={`${day.dateStr}${day.event ? ` - ${day.event.title} (${day.category?.name})` : ''}`}
                            id={`day-btn-${day.dateStr}`}
                            style={customCellStyle}
                            type="button"
                          >
                            {/* Day Number */}
                            <span className={`text-xs print:text-[9px] ${textClass} leading-none mt-0.5`}>
                              {day.dayNum}
                            </span>

                            {/* Symmetrical indicator representing the event symbol shorthand (e.g. "LU", "AS") */}
                            {symbolBadge ? (
                              <span
                                className={`text-[8px] print:text-[7px] px-0.5 leading-none rounded-sm uppercase tracking-tight scale-90 ${
                                  day.category && !config.customCategoryColors?.[day.category.id]
                                    ? `${day.category.bgColor} ${day.category.textColor}`
                                    : 'bg-slate-500 text-white'
                                } font-semibold mb-0.5 truncate max-w-full`}
                                style={customBadgeStyle}
                              >
                                {symbolBadge}
                              </span>
                            ) : (
                              <span className="h-2.5 w-2" /> // empty space maintaining ratio
                            )}

                            {/* Miniature dot for hovered states with Brush tool active */}
                            {activeBrushCategory && isHovered && !day.isSunday && (!day.isSaturday || config.isSixDayWeek) && (
                              <span
                                className="absolute inset-0 rounded-md flex items-center justify-center print:hidden"
                                style={{ backgroundColor: hexToRgba(config.monthHeaderBg || '#2563eb', 0.25) }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full animate-ping"
                                  style={{ backgroundColor: config.monthHeaderBg || '#2563eb' }}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mini Footer counting HE of the month */}
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium print:hidden">
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.monthHeaderBg || '#2563eb' }}
                      />
                      HE:{' '}
                      {days.filter((d) => !d.isOffDay).length}
                    </span>
                    <span>
                      HL:{' '}
                      {days.filter((d) => d.isOffDay).length}
                    </span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block print:block w-px bg-slate-200 self-stretch my-1" />

                {/* Right side: Events List (Takes 5/12 columns) */}
                <div className="md:col-span-4 print:col-span-4 flex flex-col justify-start">
                  <div className="text-[10px] font-bold text-slate-500 border-b border-slate-100 pb-1 mb-2 uppercase tracking-wider">
                    Keterangan Kegiatan
                  </div>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {monthlyEvents.map(({ event, datesText }, idx) => {
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
                        <div key={idx} className="flex gap-1.5 text-[10.5px] print:text-[8px] leading-tight items-start">
                          <span
                            className={`font-mono font-bold text-[9px] print:text-[7.5px] px-1 py-0.5 rounded flex-shrink-0 min-w-[22px] text-center ${
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
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Dynamic Month Header */}
                {headerElement}

                {/* Days of the Week Abbr Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-sans font-semibold text-xs text-slate-500 mb-1 print:gap-0.5 print:mb-0.5">
                  {dayNamesAbbr.map((abbr, idx) => {
                    let headerColStyle: React.CSSProperties = {};
                    if (idx === 0) {
                      headerColStyle = { color: config.sundayTextColor || '#ef4444', fontWeight: 'bold' };
                    } else if (idx === 6 && !config.isSixDayWeek) {
                      headerColStyle = { color: '#94a3b8' }; // text-slate-400
                    } else {
                      headerColStyle = { color: '#475569' }; // text-slate-600
                    }

                    return (
                      <div
                        key={idx}
                        className="py-1 print:py-0.5 print:text-[10px]"
                        style={headerColStyle}
                      >
                        {abbr}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 print:gap-0.5 grow">
                  {/* Padding for empty days at the start of the month */}
                  {paddingDays.map((_, idx) => (
                    <div key={`pad-${idx}`} className="aspect-square" />
                  ))}

                  {/* Month Days */}
                  {days.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    const isHovered = hoveredDate === day.dateStr;

                    // Determine CSS colors for background and text
                    let bgClass = 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-100';
                    let textClass = 'text-slate-800 font-medium';
                    let borderClass = 'border-transparent';
                    let symbolBadge = '';
                    let customCellStyle: React.CSSProperties = {};
                    let customBadgeStyle: React.CSSProperties = {};

                    if (day.isSunday) {
                      const sunBg = config.sundayBg || '#fef2f2';
                      const sunText = config.sundayTextColor || '#ef4444';
                      customCellStyle = {
                        backgroundColor: sunBg,
                        color: sunText,
                        borderColor: hexToRgba(sunText, 0.15),
                      };
                      textClass = 'font-bold';
                    } else if (day.isSaturday && !config.isSixDayWeek) {
                      bgClass = 'bg-slate-100/70 hover:bg-slate-200 text-slate-500 border border-slate-200/50';
                      textClass = 'text-slate-500';
                    }

                    // If day has an assigned category
                    if (day.category) {
                      const customCatHex = config.customCategoryColors?.[day.category.id];
                      if (customCatHex) {
                        const lightBg = hexToRgba(customCatHex, 0.12);
                        const borderCol = hexToRgba(customCatHex, 0.35);
                        customCellStyle = {
                          backgroundColor: lightBg,
                          borderColor: borderCol,
                          color: customCatHex,
                        };
                        textClass = 'font-bold';
                        customBadgeStyle = {
                          backgroundColor: customCatHex,
                          color: '#ffffff',
                        };
                      } else {
                        bgClass = `${day.category.lightBgColor} hover:opacity-90 border ${day.category.borderColor}`;
                        textClass = day.category.lightTextColor;
                      }
                      symbolBadge = day.category.symbol;
                    }

                    // Highlight active brush selection or hover states
                    if (isSelected) {
                      borderClass = 'ring-2 ring-blue-500 ring-offset-1 z-10';
                    } else if (isHovered) {
                      borderClass = 'ring-1 ring-slate-400 z-10';
                    }

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => onDateClick(day.dateStr)}
                        onMouseEnter={() => onDateMouseEnter(day.dateStr)}
                        onMouseLeave={onDateMouseLeave}
                        className={`aspect-square rounded-md text-xs flex flex-col items-center justify-between p-0.5 cursor-pointer relative transition-all duration-150 ${bgClass} ${borderClass} print:rounded-none print:border-slate-300 print:text-[9px] print:aspect-square`}
                        title={`${day.dateStr}${day.event ? ` - ${day.event.title} (${day.category?.name})` : ''}`}
                        id={`day-btn-${day.dateStr}`}
                        style={customCellStyle}
                        type="button"
                      >
                        {/* Day Number */}
                        <span className={`text-xs print:text-[9px] ${textClass} leading-none mt-0.5`}>
                          {day.dayNum}
                        </span>

                        {/* Symmetrical indicator representing the event symbol shorthand (e.g. "LU", "AS") */}
                        {symbolBadge ? (
                          <span
                            className={`text-[8px] print:text-[7px] px-0.5 leading-none rounded-sm uppercase tracking-tight scale-90 ${
                              day.category && !config.customCategoryColors?.[day.category.id]
                                ? `${day.category.bgColor} ${day.category.textColor}`
                                : 'bg-slate-500 text-white'
                            } font-semibold mb-0.5 truncate max-w-full`}
                            style={customBadgeStyle}
                          >
                            {symbolBadge}
                          </span>
                        ) : (
                          <span className="h-2.5 w-2" /> // empty space maintaining ratio
                        )}

                        {/* Miniature dot for hovered states with Brush tool active */}
                        {activeBrushCategory && isHovered && !day.isSunday && (!day.isSaturday || config.isSixDayWeek) && (
                          <span
                            className="absolute inset-0 rounded-md flex items-center justify-center print:hidden"
                            style={{ backgroundColor: hexToRgba(config.monthHeaderBg || '#2563eb', 0.25) }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-ping"
                              style={{ backgroundColor: config.monthHeaderBg || '#2563eb' }}
                            />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Mini Footer counting HE of the month */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium print:hidden">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.monthHeaderBg || '#2563eb' }}
                    />
                    HE:{' '}
                    {days.filter((d) => !d.isOffDay).length}
                  </span>
                  <span>
                    HL:{' '}
                    {days.filter((d) => d.isOffDay).length}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
