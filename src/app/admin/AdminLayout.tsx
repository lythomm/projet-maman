"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Package, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { adminLogoutAction } from "@/app/actions/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex-grow flex flex-col bg-white min-h-screen text-slate-800 font-sans">
      {/* Top Navigation - Center nav links, ends are logo and logout */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-hairline shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
              p.
            </div>
            <span className="font-semibold text-xl tracking-tight text-brand-primary">
              projet-maman
            </span>
          </div>

          {/* Center: Simple Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/admin/dashboard"
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 pb-1 ${
                pathname === "/admin/dashboard"
                  ? "text-brand-primary border-brand-primary"
                  : "text-slate-500 border-transparent hover:text-brand-primary"
              }`}
            >
              Tableau de bord
            </Link>
            <Link
              href="/admin/bookings"
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 pb-1 ${
                pathname === "/admin/bookings"
                  ? "text-brand-primary border-brand-primary"
                  : "text-slate-500 border-transparent hover:text-brand-primary"
              }`}
            >
              Réservations
            </Link>
            <Link
              href="/admin/catalog"
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 pb-1 ${
                pathname === "/admin/catalog"
                  ? "text-brand-primary border-brand-primary"
                  : "text-slate-500 border-transparent hover:text-brand-primary"
              }`}
            >
              Catalogue
            </Link>
            <Link
              href="/admin/settings"
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 pb-1 ${
                pathname === "/admin/settings"
                  ? "text-brand-primary border-brand-primary"
                  : "text-slate-500 border-transparent hover:text-brand-primary"
              }`}
            >
              Configuration
            </Link>
          </nav>

          {/* Right: Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-brand-hairline hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-md text-sm font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-10 flex-grow flex flex-col w-full">
        {/* Mobile Navigation bar - Fixed at the bottom like Instagram */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-hairline shadow-md md:hidden px-2 h-16 flex items-center justify-around">
          <nav className="w-full flex items-center justify-around h-full">
            <Link
              href="/admin/dashboard"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                pathname === "/admin/dashboard"
                  ? "text-brand-primary"
                  : "text-slate-400 hover:text-brand-primary"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Tableau</span>
            </Link>
            <Link
              href="/admin/bookings"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                pathname === "/admin/bookings"
                  ? "text-brand-primary"
                  : "text-slate-400 hover:text-brand-primary"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Résas</span>
            </Link>
            <Link
              href="/admin/catalog"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                pathname === "/admin/catalog"
                  ? "text-brand-primary"
                  : "text-slate-400 hover:text-brand-primary"
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Catalogue</span>
            </Link>
            <Link
              href="/admin/settings"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                pathname === "/admin/settings"
                  ? "text-brand-primary"
                  : "text-slate-400 hover:text-brand-primary"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Config</span>
            </Link>
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
