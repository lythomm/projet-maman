"use client";

import React from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog container */}
      <div className="relative bg-white rounded-xl border border-brand-hairline p-6 shadow-xl max-w-sm w-full mx-4 z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 min-w-0 mt-1">
          <h3 className="text-base font-bold text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed break-words">
            {description}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-bold transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md text-xs font-bold transition cursor-pointer shadow-2xs ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-brand-primary hover:bg-brand-primary-active"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
