"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CalendarDays,
  User,
  Mail,
  Phone,
  Truck,
  MapPin,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import AdminLayout from "../AdminLayout";
import { prettyDisplayDate } from "@/lib/date";

interface CalendarClientProps {
  token: string;
}

export default function CalendarClient({ token }: CalendarClientProps) {
  const bookings = useQuery(api.bookings.list, { token });

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [typeFilter, setTypeFilter] = useState<"all" | "pickup" | "delivery">("all");

  // Filter accepted bookings
  const acceptedBookings = bookings?.filter((b) => b.status === "accepted") || [];

  // Helper: check bookings active on a date (taking filter into account)
  const getBookingsForDate = (dateStr: string) => {
    return acceptedBookings.filter((b) => {
      const isActive = dateStr >= b.startDate && dateStr <= b.endDate;
      if (!isActive) return false;
      if (typeFilter === "pickup") return !b.delivery;
      if (typeFilter === "delivery") return b.delivery;
      return true;
    });
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1, ...
  
  // Shift so Monday is index 0
  const startOffset = (firstDayIndex + 6) % 7;

  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const gridCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // 1. Previous month trailing days
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    gridCells.push({
      dateStr: `${y}-${m}-${d}`,
      dayNum: day,
      isCurrentMonth: false,
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    gridCells.push({
      dateStr: `${y}-${m}-${d}`,
      dayNum: day,
      isCurrentMonth: true,
    });
  }

  // 3. Next month leading days (fill up to complete multiple of 7, 42 cells)
  const remainingCells = 42 - gridCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const y = nextMonthDate.getFullYear();
    const m = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    gridCells.push({
      dateStr: `${y}-${m}-${d}`,
      dayNum: day,
      isCurrentMonth: false,
    });
  }

  // Formatting header string for Month
  const rawMonthName = currentMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const capitalizedMonth = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

  // Selected date bookings list
  const selectedDateBookings = getBookingsForDate(selectedDate);

  const displaySelectedDateStr = new Date(selectedDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const capitalizedSelectedDate = displaySelectedDateStr.charAt(0).toUpperCase() + displaySelectedDateStr.slice(1);

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  return (
    <AdminLayout fullWidth={true}>
      <div className="space-y-6">
        {/* Page Title */}
        <h2 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Agenda & Visites</h2>

        {bookings === undefined ? (
          <div className="h-[600px] flex items-center justify-center bg-brand-soft rounded-2xl border border-brand-hairline">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left side: Month View Calendar */}
            <div className="lg:col-span-2 space-y-4">
              {/* Calendar Control & Month Name */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Mois précédent"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-extrabold text-slate-800 text-xl tracking-tight text-center min-w-[160px]">
                  {capitalizedMonth}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Mois suivant"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Days of week labels */}
              <div className="grid grid-cols-7 text-center">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((dayName) => (
                  <div
                    key={dayName}
                    className="text-xs font-bold text-slate-400 py-1.5 uppercase tracking-wide"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Days grid cards */}
              <div className="grid grid-cols-7 gap-3 sm:gap-4">
                {gridCells.map(({ dateStr, dayNum, isCurrentMonth }, idx) => {
                  const isSelected = selectedDate === dateStr;
                  const isToday = todayStr === dateStr;
                  const dayBookings = getBookingsForDate(dateStr);

                  // Differentiate types
                  const hasDelivery = dayBookings.some((b) => b.delivery);
                  const hasPickup = dayBookings.some((b) => !b.delivery);

                  return (
                    <div
                      key={`${dateStr}-${idx}`}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[5.5rem] sm:min-h-[7.5rem] lg:min-h-[8.5rem] p-3 rounded-2xl flex flex-col justify-between transition cursor-pointer select-none border shadow-2xs hover:shadow-xs group ${
                        isSelected
                          ? "border-transparent ring-2 ring-indigo-600 bg-indigo-50/40"
                          : isToday
                            ? "border-brand-primary/50 bg-brand-soft/20"
                            : isCurrentMonth
                              ? "bg-white border-slate-200"
                              : "bg-slate-50/80 border-slate-100 text-slate-400"
                      }`}
                    >
                      {/* Day number cell top */}
                      <div className="flex justify-between items-start">
                        <span
                          className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${
                            isToday
                              ? "bg-brand-primary text-white font-black"
                              : isSelected
                                ? "bg-indigo-600 text-white font-extrabold"
                                : "text-slate-700"
                          }`}
                        >
                          {dayNum}
                        </span>
                      </div>

                      {/* Display bookings inside cell */}
                      <div className="mt-1 flex-grow flex flex-col justify-end">
                        {/* Desktop: Mini Badges */}
                        <div className="hidden sm:flex flex-col gap-1">
                          {dayBookings.slice(0, 2).map((booking) => {
                            const isDelivery = booking.delivery;
                            return (
                              <div
                                key={booking._id}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate flex items-center gap-1 shrink-0 ${
                                  isDelivery
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    : "bg-blue-50 text-blue-700 border border-blue-100"
                                }`}
                              >
                                {isDelivery ? (
                                  <Truck className="w-2.5 h-2.5 shrink-0" />
                                ) : (
                                  <User className="w-2.5 h-2.5 shrink-0" />
                                )}
                                <span className="truncate">{booking.firstName} {booking.lastName.charAt(0)}.</span>
                              </div>
                            );
                          })}
                          {dayBookings.length > 2 && (
                            <span className="text-[8px] font-semibold text-slate-400 pl-1">
                              + {dayBookings.length - 2} de plus
                            </span>
                          )}
                        </div>

                        {/* Mobile: Dynamic colored dots */}
                        <div className="flex sm:hidden justify-center gap-1.5 mt-1">
                          {hasPickup && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {hasDelivery && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Selected Day Detail Sidebar Cards */}
            <div className="space-y-6 lg:sticky lg:top-20">
              
              {/* Card 1: Filter */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>Filtre par type de location :</span>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="all">Toutes les locations</option>
                  <option value="pickup">Retraits clients uniquement</option>
                  <option value="delivery">Livraisons uniquement</option>
                </select>
              </div>

              {/* Card 2: Date Selector & Selected Day Detail */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                
                {/* Top Section with selected period and action button */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                      Période Sélectionnée
                    </span>
                    <h4 className="text-md font-bold text-slate-800 leading-tight">
                      {capitalizedSelectedDate}
                    </h4>
                  </div>
                  <Link
                    href="/"
                    className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold rounded-lg px-3.5 py-2 text-xs tracking-wide transition shrink-0 select-none text-center"
                  >
                    + Nouvelle location
                  </Link>
                </div>

                <hr className="border-slate-100" />

                {/* Subtitle */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider pb-1">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span>Locations & Livraisons</span>
                </div>

                {/* Bookings List or Empty State */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {selectedDateBookings.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-xs font-medium">Aucune location configurée pour ce jour.</p>
                    </div>
                  ) : (
                    selectedDateBookings.map((booking) => {
                      const isDelivery = booking.delivery;
                      return (
                        <div
                          key={booking._id}
                          className={`p-4 rounded-xl border flex flex-col gap-3 transition hover:shadow-2xs ${
                            isDelivery
                              ? "bg-indigo-50/20 border-indigo-100/70 hover:bg-indigo-50/40"
                              : "bg-blue-50/20 border-blue-100/70 hover:bg-blue-50/40"
                          }`}
                        >
                          {/* Top badge */}
                          <div className="flex items-center justify-between">
                            <div
                              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isDelivery
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {isDelivery ? (
                                <>
                                  <Truck className="w-3 h-3" />
                                  <span>Livraison Admin</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3" />
                                  <span>Retrait Client</span>
                                </>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                              Ref: {booking._id.slice(-6)}
                            </span>
                          </div>

                          {/* Client Detail */}
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-800 text-sm">
                              {booking.firstName} {booking.lastName}
                            </p>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-500 font-semibold">
                              <a href={`tel:${booking.phone}`} className="flex items-center gap-1.5 hover:text-brand-primary">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{booking.phone}</span>
                              </a>
                              <a href={`mailto:${booking.email}`} className="flex items-center gap-1.5 hover:text-brand-primary">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{booking.email}</span>
                              </a>
                            </div>
                          </div>

                          {/* Address & Itineraries */}
                          {isDelivery && booking.deliveryAddress && (
                            <div className="bg-white border border-indigo-100/50 rounded-lg p-2.5 space-y-2">
                              <div className="flex items-start gap-1.5 text-xs text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="font-semibold leading-normal">{booking.deliveryAddress}</span>
                              </div>
                              <div className="flex items-center gap-2 pt-1 border-t border-indigo-50">
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                    booking.deliveryAddress
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 transition"
                                >
                                  <Navigation className="w-3 h-3 text-emerald-600" />
                                  <span>Google Maps</span>
                                </a>
                                <a
                                  href={`https://waze.com/ul?q=${encodeURIComponent(
                                    booking.deliveryAddress
                                  )}&navigate=yes`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 transition"
                                >
                                  <Navigation className="w-3 h-3 text-sky-500" />
                                  <span>Waze</span>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Items and Period */}
                          <div className="space-y-1.5 border-t border-slate-200/50 pt-2 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Durée & Matériels
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {prettyDisplayDate(booking.startDate, booking.endDate)}
                            </span>
                            <div className="space-y-1 mt-1">
                              {booking.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-xs text-slate-600">
                                  <span className="font-semibold truncate pr-4">{item.title}</span>
                                  <span className="font-extrabold shrink-0 text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Price details */}
                          <div className="border-t border-slate-200/50 pt-2 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-slate-400 font-bold uppercase text-[9px]">Caution : </span>
                              <span className="font-extrabold text-slate-700">{booking.totalDeposit}€</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold uppercase text-[9px]">Total : </span>
                              <span className="font-black text-brand-primary text-sm">{booking.totalPrice}€</span>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
