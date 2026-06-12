"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import Modal from "./Modal";

export default function ContactButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full hover:bg-brand-soft transition duration-200 text-brand-primary cursor-pointer"
        aria-label="Me contacter"
        title="Me contacter"
      >
        <Phone className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="max-w-xs sm:max-w-sm">
        <div className="mt-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-soft text-brand-primary rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Me contacter
              </h3>
              <p className="text-xs text-slate-500">
                Une question sur votre location ?
              </p>
            </div>
          </div>

          <hr className="border-brand-hairline" />

          <div className="space-y-2.5">
            <a
              href="tel:0614220651"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-primary hover:bg-brand-soft/40 transition group"
            >
              <Phone className="w-4 h-4 text-slate-400 group-hover:text-brand-primary transition shrink-0" />
              <div className="text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Téléphone</p>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-primary transition">
                  06 14 22 06 51
                </p>
              </div>
            </a>

            <a
              href="mailto:sabinely81700@gmail.com"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-primary hover:bg-brand-soft/40 transition group"
            >
              <Mail className="w-4 h-4 text-slate-400 group-hover:text-brand-primary transition shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-primary transition break-all">
                  sabinely81700@gmail.com
                </p>
              </div>
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
