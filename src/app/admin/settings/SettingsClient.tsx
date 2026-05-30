"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/Toast";
import { Loader2 } from "lucide-react";
import AdminLayout from "../AdminLayout";

import { formatConvexError } from "@/lib/error";

interface SettingsClientProps {
  token: string;
}

export default function SettingsClient({ token }: SettingsClientProps) {
  const { showToast } = useToast();
  // Fetch data
  const settings = useQuery(api.settings.get);

  // Mutations
  const updateSettings = useMutation(api.settings.update);

  // Form state
  const [deliveryFee, setDeliveryFee] = useState<number | "">("");

  // Settings submit handler
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryFee === "") return;
    try {
      await updateSettings({ token, deliveryFee: Number(deliveryFee) });
      showToast("Frais de livraison mis à jour !", "success");
    } catch (err: any) {
      showToast(formatConvexError(err), "error");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-xl bg-brand-card rounded-lg border border-brand-hairline p-8 shadow-xs">
        <h2 className="text-2xl font-bold tracking-tight text-brand-primary mb-6">Paramètres Généraux</h2>

        {settings === undefined ? (
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        ) : (
          <form
            onSubmit={handleSettingsSubmit}
            className="space-y-6"
            ref={() => {
              if (deliveryFee === "" && settings) {
                setDeliveryFee(settings.deliveryFee);
              }
            }}
          >
            <div>
              <label htmlFor="deliveryFee" className="block text-sm font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Frais de livraison fixes (€)
              </label>
              <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                Saisissez le montant forfaitaire à ajouter à la commande globale si la livraison est demandée.
              </p>
              <input
                type="number"
                id="deliveryFee"
                required
                min={0}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full max-w-xs h-10 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition"
              />
            </div>

            <button
              type="submit"
              className="px-5 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-sm font-bold tracking-tight transition cursor-pointer"
            >
              Enregistrer les paramètres
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
