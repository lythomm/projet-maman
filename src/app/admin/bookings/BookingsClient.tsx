"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useToast } from "@/components/Toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar,
  User,
  Phone,
  Mail,
  Truck,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";
import AdminLayout from "../AdminLayout";

import { formatConvexError } from "@/lib/error";
import { prettyDisplayDate } from "@/lib/date";

interface BookingsClientProps {
  token: string;
}

export default function BookingsClient({ token }: BookingsClientProps) {
  const { showToast } = useToast();
  const bookings = useQuery(api.bookings.list, { token });
  const updateBookingStatus = useMutation(api.bookings.updateStatus);
  const removeBooking = useMutation(api.bookings.remove);

  const [statusFilter, setStatusFilter] = useState<"pending" | "accepted" | "rejected">("pending");

  // Get counts for each status
  const pendingCount = bookings?.filter((b) => b.status === "pending").length ?? 0;
  const acceptedCount = bookings?.filter((b) => b.status === "accepted").length ?? 0;
  const rejectedCount = bookings?.filter((b) => b.status === "rejected").length ?? 0;

  const filteredBookings = bookings?.filter((b) => b.status === statusFilter) || [];

  // Booking status update handler
  const handleBookingStatus = async (id: Id<"bookings">, status: "accepted" | "rejected" | "pending") => {
    try {
      await updateBookingStatus({ token, id, status });
      const statusText = status === "accepted" ? "acceptée" : status === "rejected" ? "refusée" : "remise en attente";
      showToast(`Demande de réservation ${statusText}.`, "success");
    } catch (err: any) {
      showToast(formatConvexError(err), "error");
    }
  };

  // Booking delete handler
  const handleBookingDelete = async (id: Id<"bookings">) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande de réservation ?")) return;
    try {
      await removeBooking({ token, id });
      showToast("Demande de réservation supprimée.", "success");
    } catch (err: any) {
      showToast(formatConvexError(err), "error");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-hairline pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-brand-primary">Suivi des Réservations</h2>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${statusFilter === "pending"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <span>À valider</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${statusFilter === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                }`}>
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${statusFilter === "accepted"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <span>Acceptées</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${statusFilter === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}>
                {acceptedCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${statusFilter === "rejected"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <span>Refusées</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${statusFilter === "rejected" ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-600"
                }`}>
                {rejectedCount}
              </span>
            </button>
          </div>
        </div>

        {bookings === undefined ? (
          <div className="h-64 flex items-center justify-center bg-brand-soft rounded-lg border border-brand-hairline">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-hairline py-16 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-base">Aucune demande</p>
            <p className="text-sm text-slate-400 mt-1">
              {bookings.length === 0
                ? "Les demandes de réservation de vos clients s'afficheront ici."
                : statusFilter === "pending"
                  ? "Vous n'avez aucune demande de réservation à valider pour le moment."
                  : statusFilter === "accepted"
                    ? "Vous n'avez pas encore accepté de demande de réservation."
                    : "Vous n'avez rejeté aucune demande de réservation."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isPending = booking.status === "pending";
              const isAccepted = booking.status === "accepted";
              const isRejected = booking.status === "rejected";

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl border border-brand-hairline shadow-xs overflow-hidden flex flex-col transition hover:shadow-sm"
                >
                  {/* Card Header: Request Date, Status, Total Location Price */}
                  <div className="bg-brand-soft border-b border-brand-hairline px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Reçu le {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPending
                          ? "bg-badge-orange/10 text-badge-orange border border-badge-orange/20"
                          : isAccepted
                            ? "bg-badge-emerald/10 text-slate-800 border border-badge-emerald/20"
                            : "bg-badge-pink/10 text-badge-pink border border-badge-pink/20"
                          }`}
                      >
                        {isPending ? "À valider" : isAccepted ? "Acceptée" : "Refusée"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Total Location :</span>
                      <span className="text-2xl font-black text-brand-primary leading-none">
                        {booking.totalPrice}€
                      </span>
                    </div>
                  </div>

                  {/* Card Body: 3-column Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Column 1: Client profile & contacts */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Informations Client
                        </h4>
                        <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <User className="w-5 h-5 text-slate-400 shrink-0" />
                          <span>{booking.firstName} {booking.lastName}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <a
                          href={`tel:${booking.phone}`}
                          className="flex items-center gap-2 hover:text-brand-primary transition group"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-brand-soft border border-brand-hairline flex items-center justify-center shrink-0 transition">
                            <Phone className="w-4 h-4 text-slate-500 group-hover:text-brand-primary transition" />
                          </div>
                          <span className="font-medium">{booking.phone}</span>
                        </a>
                        <a
                          href={`mailto:${booking.email}`}
                          className="flex items-center gap-2 hover:text-brand-primary transition group min-w-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-brand-soft border border-brand-hairline flex items-center justify-center shrink-0 transition">
                            <Mail className="w-4 h-4 text-slate-500 group-hover:text-brand-primary transition" />
                          </div>
                          <span className="font-medium truncate">{booking.email}</span>
                        </a>
                      </div>
                    </div>

                    {/* Column 2: Date and Logistics */}
                    <div className="space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Détails Location
                        </h4>
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                          <Calendar className="w-5 h-5 text-brand-primary shrink-0" />
                          <span>{prettyDisplayDate(booking.startDate, booking.endDate)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                          <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{booking.delivery ? "Livraison demandée" : "Retrait direct à l'atelier"}</span>
                        </div>

                        {booking.delivery && booking.deliveryAddress && (
                          <div className="bg-brand-soft border border-brand-hairline rounded-lg p-3 space-y-2.5">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Adresse de livraison
                              </span>
                              <p className="text-sm text-slate-700 font-medium break-words leading-relaxed">
                                {booking.deliveryAddress}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.deliveryAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-bold transition shadow-2xs cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                                <span>Google Maps</span>
                              </a>
                              <a
                                href={`https://waze.com/ul?q=${encodeURIComponent(booking.deliveryAddress)}&navigate=yes`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-bold transition shadow-2xs cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5 text-brand-primary" />
                                <span>Waze</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Equipment detail & deposit */}
                    <div className="space-y-4 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Matériel loué
                        </h4>
                        <div className=" max-h-48 overflow-y-auto pr-1">
                          {booking.items.map((item: any, idx) => (
                            <div key={idx} className="py-1 flex justify-between items-center text-sm gap-2">
                              <span className="text-slate-800 font-semibold">{item.title}</span>
                              <span className="text-xs bg-slate-50 text-slate-700 px-2.5 py-0.5 rounded-full font-bold shrink-0 border border-brand-hairline">
                                x {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-medium">
                        <span>Caution globale :</span>
                        <span className="font-bold text-slate-700">{booking.totalDeposit}€</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Controls */}
                  <div className="bg-brand-soft border-t border-brand-hairline px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      {!isPending && (
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isAccepted ? "bg-badge-emerald" : "bg-badge-pink"}`}></span>
                          <span className="text-xs text-slate-500 font-semibold">
                            Demande traitée ({isAccepted ? "Acceptée" : "Refusée"})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row-reverse items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleBookingStatus(booking._id, "accepted")}
                            className="w-full sm:w-auto px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-active text-white rounded-lg text-sm font-bold transition cursor-pointer shadow-xs text-center justify-center inline-flex items-center"
                          >
                            Accepter la demande
                          </button>
                          <button
                            onClick={() => handleBookingStatus(booking._id, "rejected")}
                            className="w-full sm:w-auto px-4 py-2.5 border border-brand-hairline bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-lg text-sm font-bold transition cursor-pointer shadow-2xs text-center justify-center inline-flex items-center"
                          >
                            Refuser la demande
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleBookingStatus(booking._id, "pending")}
                          className="w-full sm:w-auto px-4 py-2.5 border border-brand-hairline bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition cursor-pointer text-center justify-center inline-flex items-center"
                        >
                          Remettre en attente
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
