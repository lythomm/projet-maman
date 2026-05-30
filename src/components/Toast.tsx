"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2 max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const { id, type, message } = toast;
          
          let bgColor = "bg-white border-slate-200 text-slate-800";
          let icon = <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
          
          if (type === "success") {
            bgColor = "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/50";
            icon = <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
          } else if (type === "error") {
            bgColor = "bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100/50";
            icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
          } else if (type === "warning") {
            bgColor = "bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/50";
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
          }
          
          return (
            <div
              key={id}
              className={`flex items-center justify-between gap-5 py-3 px-4 rounded-lg border shadow-lg pointer-events-auto transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 ${bgColor}`}
            >
              <div className="flex gap-2.5">
                {icon}
                <p className="text-xs font-semibold leading-5">{message}</p>
              </div>
              <button
                onClick={() => removeToast(id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
