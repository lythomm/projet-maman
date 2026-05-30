"use client";

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
} from "lucide-react";
import AdminLayout from "../AdminLayout";

import { formatConvexError } from "@/lib/error";

interface BookingsClientProps {
  token: string;
}

export default function BookingsClient({ token }: BookingsClientProps) {
  const { showToast } = useToast();
  const bookings = useQuery(api.bookings.list, { token });
  const updateBookingStatus = useMutation(api.bookings.updateStatus);
  const removeBooking = useMutation(api.bookings.remove);

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
        <h2 className="text-2xl font-bold tracking-tight text-brand-primary">Suivi des Réservations</h2>

        {bookings === undefined ? (
          <div className="h-64 flex items-center justify-center bg-brand-soft rounded-lg border border-brand-hairline">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-brand-soft rounded-lg border border-brand-hairline py-16 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-base">Aucune demande reçue</p>
            <p className="text-sm text-slate-400 mt-1">Les demandes de réservation de vos clients s'afficheront ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isPending = booking.status === "pending";
              const isAccepted = booking.status === "accepted";
              const isRejected = booking.status === "rejected";

              return (
                <div
                  key={booking._id}
                  className="bg-brand-card rounded-lg border border-brand-hairline p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6"
                >
                  {/* Booking details */}
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700 bg-white border border-brand-hairline px-2 py-0.5 rounded-sm">
                        Reçu le {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isPending
                            ? "bg-badge-orange/10 text-badge-orange border border-badge-orange/20"
                            : isAccepted
                            ? "bg-badge-emerald/10 text-slate-800 border border-badge-emerald/20"
                            : "bg-badge-pink/10 text-badge-pink border border-badge-pink/20"
                        }`}
                      >
                        {isPending ? "En attente" : isAccepted ? "Accepté" : "Refusé"}
                      </span>
                    </div>

                    {/* Contact block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3 rounded-md border border-brand-hairline">
                      <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{booking.firstName} {booking.lastName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a href={`tel:${booking.phone}`} className="hover:underline">{booking.phone}</a>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a href={`mailto:${booking.email}`} className="hover:underline truncate">{booking.email}</a>
                      </div>
                    </div>

                    {/* Logistics */}
                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Période : Du {booking.startDate} au {booking.endDate}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <span>{booking.delivery ? "Livraison requise" : "Retrait sur place"}</span>
                      </div>
                    </div>

                    {/* Items checklist */}
                    <div className="border-t border-slate-200/60 pt-3">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                        Articles commandés
                      </h4>
                      <div className="space-y-2">
                        {booking.items.map((item: any, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-800 font-semibold">{item.title}</span>
                            <span className="text-slate-500">Qté : <strong>{item.quantity}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order financials & actions */}
                  <div className="lg:w-60 border-t lg:border-t-0 lg:border-l border-brand-hairline pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between shrink-0">
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Total Location :</span>
                        <span className="font-extrabold text-brand-primary text-lg">{booking.totalPrice}€</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Caution Globale :</span>
                        <span className="font-bold text-slate-700">{booking.totalDeposit}€</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-2">
                      {isPending && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleBookingStatus(booking._id, "accepted")}
                            className="h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-sm font-bold transition cursor-pointer"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleBookingStatus(booking._id, "rejected")}
                            className="h-10 bg-white border border-brand-hairline hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-md text-sm font-bold transition cursor-pointer"
                          >
                            Refuser
                          </button>
                        </div>
                      )}

                      {!isPending && (
                        <button
                          onClick={() => handleBookingStatus(booking._id, "pending")}
                          className="w-full h-10 bg-white border border-brand-hairline hover:bg-brand-soft text-slate-700 rounded-md text-sm font-bold transition cursor-pointer"
                        >
                          Remettre en attente
                        </button>
                      )}

                      <button
                        onClick={() => handleBookingDelete(booking._id)}
                        className="w-full h-10 bg-white border border-brand-hairline hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md text-sm font-semibold transition cursor-pointer"
                      >
                        Supprimer la demande
                      </button>
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
