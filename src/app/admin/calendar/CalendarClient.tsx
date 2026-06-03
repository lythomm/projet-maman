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
  Loader2,
  Filter,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import AdminLayout from "../AdminLayout";
import { prettyDisplayDate } from "@/lib/date";

interface CalendarClientProps {
  token: string;
}

type EventType = "pickup" | "delivery" | "return";

interface OperationalEvent {
  booking: any;
  type: EventType;
}

export default function CalendarClient({ token }: CalendarClientProps) {
  const bookings = useQuery(api.bookings.list, { token });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [typeFilter, setTypeFilter] = useState<"all" | "pickup" | "delivery" | "return">("all");

  // Filter accepted bookings
  const acceptedBookings = bookings?.filter((b) => b.status === "accepted") || [];

  // Helper: Get operational events (delivery, pickup, return) for a specific date Str
  const getEventsForDate = (dateStr: string): OperationalEvent[] => {
    const events: OperationalEvent[] = [];

    for (const b of acceptedBookings) {
      // 1. Check Start Date (delivery or pickup)
      if (b.startDate === dateStr) {
        if (b.delivery) {
          if (typeFilter === "all" || typeFilter === "delivery") {
            events.push({ booking: b, type: "delivery" });
          }
        } else {
          if (typeFilter === "all" || typeFilter === "pickup") {
            events.push({ booking: b, type: "pickup" });
          }
        }
      }

      // 2. Check End Date (always return)
      if (b.endDate === dateStr) {
        if (typeFilter === "all" || typeFilter === "return") {
          events.push({ booking: b, type: "return" });
        }
      }
    }

    return events;
  };

  // Helper: Get list of next 6 months starting from today
  const getSixMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      months.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }
    return months;
  };

  // Helper: Generate calendar cells for a specific month
  const getMonthGridCells = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1, ...

    // Shift so Monday is index 0
    const startOffset = (firstDayIndex + 6) % 7;

    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: ({ dateStr: string; dayNum: number } | null)[] = [];

    // 1. Previous month trailing placeholders
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const y = year;
      const m = String(month + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      cells.push({
        dateStr: `${y}-${m}-${d}`,
        dayNum: day,
      });
    }

    // 3. Next month leading placeholders
    const totalWeeks = Math.ceil((startOffset + daysInMonth) / 7);
    const neededCells = totalWeeks * 7;
    const remainingCells = neededCells - cells.length;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(null);
    }

    return cells;
  };

  const sixMonthsList = getSixMonths();
  const selectedDateEvents = getEventsForDate(selectedDate);

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
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">Agenda & Visites</h2>
          <button
            onClick={() => {
              const today = new Date();
              const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              setSelectedDate(dateStr);
              const element = document.getElementById(`month-container-${today.getFullYear()}-${today.getMonth()}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-brand-soft rounded-lg text-xs font-bold text-slate-800 border border-slate-200 transition cursor-pointer select-none"
          >
            Aujourd'hui
          </button>
        </div>

        {bookings === undefined ? (
          <div className="h-[600px] flex items-center justify-center bg-brand-soft rounded-2xl border border-brand-hairline">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left side: Scrollable 6 Months Column */}
            <div className="lg:col-span-2 space-y-10">
              {sixMonthsList.map((monthDate, mIdx) => {
                const rawMonthName = monthDate.toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                });
                const capitalizedMonth = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
                const gridCells = getMonthGridCells(monthDate);
                const containerId = `month-container-${monthDate.getFullYear()}-${monthDate.getMonth()}`;

                return (
                  <div key={mIdx} id={containerId} className="space-y-4 bg-white/40 p-4 rounded-3xl border border-slate-200/50 backdrop-blur-xs">

                    {/* Month Name Header */}
                    <div className="flex items-center justify-between px-2">
                      <span className="font-extrabold text-slate-800 text-xl tracking-tight">
                        {capitalizedMonth}
                      </span>
                      <div className="flex gap-2 text-[9px] font-bold">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100/50 uppercase tracking-wider">
                          <User className="w-2.5 h-2.5 shrink-0" />
                          <span>Retrait</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100/50 uppercase tracking-wider">
                          <Truck className="w-2.5 h-2.5 shrink-0" />
                          <span>Livraison</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100/50 uppercase tracking-wider">
                          <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                          <span>Retour</span>
                        </div>
                      </div>
                    </div>

                    {/* Days of week labels */}
                    <div className="grid grid-cols-7 text-center">
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((dayName) => (
                        <div
                          key={dayName}
                          className="text-[11px] font-extrabold text-slate-400 py-1 uppercase tracking-wider"
                        >
                          {dayName}
                        </div>
                      ))}
                    </div>

                    {/* Days grid cards */}
                    <div className="grid grid-cols-7 gap-2">
                      {gridCells.map((cell, idx) => {
                        if (!cell) {
                          return (
                            <div
                              key={`empty-${monthDate.getFullYear()}-${monthDate.getMonth()}-${idx}`}
                              className="min-h-[8rem] bg-transparent border border-transparent pointer-events-none"
                            />
                          );
                        }

                        const { dateStr, dayNum } = cell;
                        const isSelected = selectedDate === dateStr;
                        const isToday = todayStr === dateStr;
                        const dayEvents = getEventsForDate(dateStr);

                        const hasPickup = dayEvents.some((ev) => ev.type === "pickup");
                        const hasDelivery = dayEvents.some((ev) => ev.type === "delivery");
                        const hasReturn = dayEvents.some((ev) => ev.type === "return");

                        return (
                          <div
                            key={`${dateStr}-${idx}`}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`min-h-[8rem] p-2.5 rounded-2xl bg-white flex flex-col justify-between transition cursor-pointer select-none border shadow-3xs hover:shadow-2xs group ${isSelected
                              ? "border-transparent ring-2 ring-brand-primary bg-indigo-50/40"
                              : isToday
                                ? "border-brand-primary/50 bg-brand-soft/20"
                                : "border-slate-200"
                              }`}
                          >
                            {/* Day number cell top */}
                            <div className="flex justify-between items-start">
                              <span
                                className={`size-6 flex items-center justify-center text-xs font-bold rounded-full ${isToday
                                  ? "bg-brand-primary text-white font-black"
                                  : isSelected
                                    ? "bg-brand-primary text-white font-extrabold"
                                    : "text-slate-700"
                                  }`}
                              >
                                {dayNum}
                              </span>
                            </div>

                            {/* Display operational events inside cell */}
                            <div className="mt-1 flex-grow flex flex-col justify-end">
                              {/* Desktop: Mini Badges */}
                              <div className="hidden sm:flex flex-col gap-1">
                                {dayEvents.slice(0, 2).map((ev, eIdx) => {
                                  const booking = ev.booking;
                                  return (
                                    <div
                                      key={`${booking._id}-${ev.type}-${eIdx}`}
                                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 shrink-0 ${ev.type === "delivery"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50"
                                        : ev.type === "pickup"
                                          ? "bg-blue-50 text-blue-700 border border-blue-100/50"
                                          : "bg-amber-50 text-amber-700 border border-amber-100/50"
                                        }`}
                                    >
                                      {ev.type === "delivery" ? (
                                        <Truck className="w-2.5 h-2.5 shrink-0" />
                                      ) : ev.type === "pickup" ? (
                                        <User className="w-2.5 h-2.5 shrink-0" />
                                      ) : (
                                        <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                                      )}
                                      <span className="truncate">
                                        {booking.firstName} {booking.lastName.charAt(0)}.
                                      </span>
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 2 && (
                                  <span className="text-[7.5px] font-semibold text-slate-400 pl-1">
                                    + {dayEvents.length - 2} de plus
                                  </span>
                                )}
                              </div>

                              {/* Mobile: Dynamic colored dots */}
                              <div className="flex sm:hidden justify-center gap-1 mt-1">
                                {hasPickup && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                {hasDelivery && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                {hasReturn && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side: Selected Day Detail Sidebar Cards */}
            <div className="space-y-6 lg:sticky lg:top-20">

              {/* Card 1: Filter */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-brand-primary" />
                  <span>Filtre par type d'action :</span>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:to-brand-primary cursor-pointer"
                >
                  <option value="all">Toutes les actions</option>
                  <option value="pickup">Retraits uniquement</option>
                  <option value="delivery">Livraisons uniquement</option>
                  <option value="return">Retours uniquement</option>
                </select>
              </div>

              {/* Card 2: Date Selector & Selected Day Detail */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">

                {/* Top Section with selected period and action button */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider">
                      Période Sélectionnée
                    </span>
                    <h4 className="text-md font-bold text-slate-800 leading-tight">
                      {capitalizedSelectedDate}
                    </h4>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Subtitle */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider pb-1">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span>Actions du jour</span>
                </div>

                {/* Events List or Empty State */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {selectedDateEvents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-xs font-medium">Aucune action configurée pour ce jour.</p>
                    </div>
                  ) : (
                    selectedDateEvents.map((ev, eIdx) => {
                      const booking = ev.booking;
                      const isDelivery = ev.type === "delivery";
                      const isPickup = ev.type === "pickup";
                      const isReturn = ev.type === "return";

                      return (
                        <div
                          key={`${booking._id}-${ev.type}-${eIdx}`}
                          className={`p-4 rounded-xl border flex flex-col gap-3 transition hover:shadow-2xs ${isDelivery
                            ? "bg-emerald-50/20 border-emerald-100/70 hover:bg-emerald-50/40"
                            : isPickup
                              ? "bg-blue-50/20 border-blue-100/70 hover:bg-blue-50/40"
                              : "bg-amber-50/20 border-amber-100/70 hover:bg-amber-50/40"
                            }`}
                        >
                          {/* Top badge */}
                          <div className="flex items-center justify-between">
                            <div
                              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isDelivery
                                ? "bg-emerald-100 text-emerald-800"
                                : isPickup
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                                }`}
                            >
                              {isDelivery ? (
                                <>
                                  <Truck className="w-3 h-3" />
                                  <span>Livraison ce jour</span>
                                </>
                              ) : isPickup ? (
                                <>
                                  <User className="w-3 h-3" />
                                  <span>Retrait ce jour</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Retour ce jour</span>
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

                          {/* Address & Itineraries (only show for deliveries) */}
                          {isDelivery && booking.deliveryAddress && (
                            <div className="bg-white border border-emerald-100/50 rounded-lg p-2.5 space-y-2">
                              <div className="flex items-start gap-1.5 text-xs text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="font-semibold leading-normal">{booking.deliveryAddress}</span>
                              </div>
                              <div className="flex items-center gap-2 pt-1 border-t border-emerald-50">
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
                              {booking.items.map((item: any, i: number) => (
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
