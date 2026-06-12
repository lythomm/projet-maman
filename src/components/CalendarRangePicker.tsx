"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
}

export default function CalendarRangePicker({ startDate, endDate, onChange }: CalendarRangePickerProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const start = startDate ? new Date(startDate) : new Date();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });

  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get number of days in current month
  const numDays = new Date(year, month + 1, 0).getDate();
  // Get day of the week of the 1st of the month (Monday-indexed: 0=Mon, 6=Sun)
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  // Month name in French
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Generate days array
  const days: (string | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(dateStr);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const handleDayClick = (dateStr: string) => {
    if (dateStr < todayStr) return; // Disabled

    if (!startDate || (startDate && endDate)) {
      onChange(dateStr, "");
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, "");
      } else {
        onChange(startDate, dateStr);
      }
    }
  };

  const isSelected = (dateStr: string) => dateStr === startDate || dateStr === endDate;

  const isInRange = (dateStr: string) => {
    if (!startDate) return false;
    if (endDate) {
      return dateStr > startDate && dateStr < endDate;
    }
    if (hoveredDate) {
      return dateStr > startDate && dateStr <= hoveredDate;
    }
    return false;
  };

  const dayOfWeekLabels = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  return (
    <div className="w-full select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-slate-800 text-sm tracking-tight">{capitalizedMonthName}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayOfWeekLabels.map((label) => (
          <span key={label} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
        {days.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const isPast = dateStr < todayStr;
          const selected = isSelected(dateStr);
          const inRange = isInRange(dateStr);
          const isStart = dateStr === startDate;
          const isEnd = dateStr === endDate;

          const d = new Date(dateStr).getDate();

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => handleDayClick(dateStr)}
              onMouseEnter={() => !isPast && setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              className={`aspect-square text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${isPast
                ? "text-slate-300 cursor-not-allowed opacity-40"
                : selected
                  ? "bg-brand-primary text-white shadow-xs z-10 rounded-md"
                  : inRange
                    ? "bg-brand-primary/50 text-white rounded-none"
                    : "text-slate-700 hover:bg-slate-100 rounded-md"
                } ${isStart && !isEnd && (endDate || hoveredDate) ? "rounded-r-none rounded-l-md" : ""} ${isEnd && !isStart ? "rounded-l-none rounded-r-md" : ""
                }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
