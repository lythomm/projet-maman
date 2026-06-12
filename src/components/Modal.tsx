"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string; // e.g. "max-w-sm", "max-w-md", default: "max-w-sm"
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-sm",
}: ModalProps) {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex items-center justify-center transition-all duration-300 ${isOpen ? "visible" : "invisible pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      
      {/* Dialog container */}
      <div className={`relative bg-white rounded-2xl border border-brand-hairline p-6 shadow-2xl w-full mx-4 z-10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0"} ${maxWidth}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </div>
    </div>
  );
}
