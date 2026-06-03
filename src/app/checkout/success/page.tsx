"use client";

import Link from "next/link";
import { CheckCircle, ShoppingBag } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="relative flex-grow bg-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
              p.
            </div>
            <span className="font-semibold text-lg tracking-tight text-brand-primary">
              projet-maman
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-brand-soft border border-brand-hairline flex items-center justify-center text-badge-emerald shrink-0 mb-6 shadow-xs">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-4">
          Demande de réservation enregistrée !
        </h1>

        <p className="text-slate-600 text-md max-w-lg leading-relaxed mb-4">
          Votre demande a bien été envoyée. Vous recevrez une réponse très prochainement pour convenir des modalités logistiques.
        </p>

        <div className="bg-brand-soft border border-brand-hairline rounded-lg p-4 max-w-lg text-left mb-8">
          <p className="text-md font-bold text-brand-primary mb-1">💶 Modalités de paiement</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Le règlement s&apos;effectue <strong>en espèces et/ou par chèque</strong>, au moment de la livraison ou du retrait du matériel.
          </p>
        </div>

        <Link
          href="/"
          className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md font-bold text-sm tracking-tight transition duration-200 shadow-xs"
        >
          Retour au catalogue
        </Link>
      </main>
    </div>
  );
}
