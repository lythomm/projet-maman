"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import {
  Calendar,
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  User,
  Loader2,
} from "lucide-react";
import AdminLayout from "../AdminLayout";

import { formatConvexError } from "@/lib/error";
import { prettyDisplayDate } from "@/lib/date";

interface DashboardOverviewClientProps {
  token: string;
}

export default function DashboardOverviewClient({ token }: DashboardOverviewClientProps) {
  const { showToast } = useToast();
  const bookings = useQuery(api.bookings.list, { token });
  const items = useQuery(api.items.list);

  const isLoading = bookings === undefined || items === undefined;

  // Compute metrics if loaded
  const stats = !isLoading
    ? (() => {
      const total = bookings.length;
      const pending = bookings.filter((b) => b.status === "pending");
      const accepted = bookings.filter((b) => b.status === "accepted");
      const revenue = accepted.reduce((sum, b) => sum + b.totalPrice, 0);

      // Upcoming rentals (accepted and starting soon)
      const todayStr = new Date().toISOString().split("T")[0];
      const upcoming = [...accepted]
        .filter((b) => b.startDate >= todayStr)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 4);

      const recentPending = [...pending].slice(0, 3);

      const totalItemsCount = items.length;
      const totalStockCount = items.reduce((sum, i) => sum + i.stock, 0);

      return {
        total,
        pendingCount: pending.length,
        acceptedCount: accepted.length,
        revenue,
        upcoming,
        recentPending,
        totalItemsCount,
        totalStockCount,
      };
    })()
    : null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-primary">Tableau de bord</h2>
            <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de l'activité de location</p>
          </div>
          <span className="self-start md:self-auto text-xs font-bold text-slate-600 bg-brand-soft border border-brand-hairline px-3 py-1.5 rounded-md">
            Aujourd'hui : {new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {isLoading || !stats ? (
          <div className="h-64 flex items-center justify-center bg-brand-soft rounded-lg border border-brand-hairline">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Revenue */}
              <div className="bg-brand-card rounded-lg border border-brand-hairline p-6 shadow-2xs hover:shadow-xs transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</span>
                  <div className="w-8 h-8 rounded-md bg-badge-emerald/10 text-brand-primary flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-brand-primary">{stats.revenue}€</span>
                  <span className="text-xs text-slate-400 font-semibold">validé</span>
                </div>
              </div>

              {/* Card 2: Pending Bookings */}
              <Link href="/admin/bookings" className="bg-brand-card rounded-lg border border-brand-hairline p-6 shadow-2xs hover:shadow-xs transition duration-200 block group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-brand-primary transition">Demandes en attente</span>
                  <div className="w-8 h-8 rounded-md bg-badge-orange/10 text-badge-orange flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-800">{stats.pendingCount}</span>
                  <span className="text-xs text-slate-400 font-semibold">à traiter</span>
                </div>
              </Link>

              {/* Card 3: Accepted Bookings */}
              <Link href="/admin/bookings" className="bg-brand-card rounded-lg border border-brand-hairline p-6 shadow-2xs hover:shadow-xs transition duration-200 block group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-brand-primary transition">Locations acceptées</span>
                  <div className="w-8 h-8 rounded-md bg-brand-soft border border-brand-hairline text-brand-primary flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-800">{stats.acceptedCount}</span>
                  <span className="text-xs text-slate-400 font-semibold">au total</span>
                </div>
              </Link>

              {/* Card 4: Catalog Stock */}
              <Link href="/admin/catalog" className="bg-brand-card rounded-lg border border-brand-hairline p-6 shadow-2xs hover:shadow-xs transition duration-200 block group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-brand-primary transition">Matériel référencé</span>
                  <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-800">{stats.totalItemsCount}</span>
                  <span className="text-xs text-slate-400 font-semibold">({stats.totalStockCount} articles)</span>
                </div>
              </Link>
            </div>

            {/* Dashboard Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left Column: Recent Pending Requests */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-badge-orange" />
                    Nouvelles demandes à traiter
                  </h3>
                  <Link href="/admin/bookings" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-0.5">
                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {stats.recentPending.length === 0 ? (
                  <div className="bg-brand-soft border border-brand-hairline rounded-lg p-8 text-center text-sm text-slate-500">
                    Aucune nouvelle demande en attente. Tout est à jour !
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentPending.map((booking) => (
                      <Link key={booking._id} href="/admin/bookings" className="block bg-white border border-brand-hairline rounded-lg p-5 shadow-3xs hover:shadow-xs hover:border-slate-300 transition duration-200 group">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700 bg-brand-soft border border-brand-hairline px-2 py-0.5 rounded-sm">
                              Reçu le {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                            <span className="text-sm font-extrabold text-brand-primary">{booking.totalPrice}€</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>{booking.firstName} {booking.lastName}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{prettyDisplayDate(booking.startDate, booking.endDate)}</span>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-brand-primary mt-3 pt-3 border-t border-slate-100 group-hover:underline flex items-center gap-1">
                          Voir les détails <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Upcoming Rentals */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    Prochaines locations validées
                  </h3>
                  <Link href="/admin/bookings" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-0.5">
                    Planning <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {stats.upcoming.length === 0 ? (
                  <div className="bg-brand-soft border border-brand-hairline rounded-lg p-8 text-center text-sm text-slate-500">
                    Aucune location acceptée à venir.
                  </div>
                ) : (
                  <div className="bg-white border border-brand-hairline rounded-lg divide-y divide-slate-100 shadow-3xs overflow-hidden">
                    {stats.upcoming.map((booking) => (
                      <div key={booking._id} className="p-4 hover:bg-brand-soft/30 transition flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-slate-800">
                            {booking.firstName} {booking.lastName}
                          </div>
                          <div className="text-slate-600 text-xs font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {prettyDisplayDate(booking.startDate, booking.endDate)}
                          </div>
                          <div className="text-slate-500 text-xs truncate max-w-xs">
                            {booking.items.map((i: any) => i.title).join(", ")}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-brand-primary">{booking.totalPrice}€</div>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded-sm">
                            Accepté
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stock Overview Banner / Catalog Link */}
                <div className="bg-brand-card border border-brand-hairline rounded-lg p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-brand-primary">Gestion du Catalogue</h4>
                    <p className="text-xs text-slate-500">Ajouter du nouveau matériel, modifier les stocks et tarifs de location.</p>
                  </div>
                  <Link
                    href="/admin/catalog"
                    className="h-10 px-4 bg-white border border-brand-hairline hover:bg-brand-soft text-slate-700 hover:text-brand-primary rounded-md text-sm font-bold transition flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <span>Modifier</span>
                    <ArrowUpRight className="w-4 h-4 ml-1 text-slate-400" />
                  </Link>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
