"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Package, Settings, LogOut, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { adminLogoutAction } from "@/app/actions/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push("/");
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
          </nav>

          {/* Right: User Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-brand-hairline hover:bg-brand-soft text-slate-700 rounded-md text-sm font-semibold transition cursor-pointer select-none"
            >
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-brand-hairline">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="hidden sm:inline">Admin</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-250 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-hairline rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-brand-soft hover:text-brand-primary transition font-semibold"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configuration</span>
                  </Link>
                  <hr className="border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition font-bold text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </>
            )}
          </div>
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

          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
