"use client";

import React from "react";
import Modal from "./Modal";

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
  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-sm">
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
    </Modal>
  );
}

