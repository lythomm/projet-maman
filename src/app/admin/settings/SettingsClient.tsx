"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/Toast";
import { Loader2, Truck, FileText, Info, Save } from "lucide-react";
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
  const [terms, setTerms] = useState<string>("");

  // Settings submit handler
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryFee === "") return;
    try {
      await updateSettings({
        token,
        deliveryFee: Number(deliveryFee),
        terms: terms.trim() || undefined,
      });
      showToast("Paramètres mis à jour !", "success");
    } catch (err: any) {
      showToast(formatConvexError(err), "error");
    }
  };

  return (
    <AdminLayout>
      <div className="w-full space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Paramètres Généraux</h2>
          <p className="text-slate-500 mt-2">Gérez les configurations générales du site et les documents légaux du contrat.</p>
        </div>

        {settings === undefined ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-xs">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : (
          <form
            onSubmit={handleSettingsSubmit}
            className="space-y-8"
            ref={() => {
              if (deliveryFee === "" && settings) {
                setDeliveryFee(settings.deliveryFee);
              }
              if (terms === "" && settings) {
                setTerms(settings.terms || "");
              }
            }}
          >
            {/* Section 1: Frais de livraison */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 sm:p-8 shadow-xs hover:shadow-sm transition duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-brand-soft text-brand-primary rounded-xl">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Frais de livraison</h3>
                  <p className="text-slate-500 text-sm mt-1">Configurez le tarif appliqué pour le service de livraison.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                  <label htmlFor="deliveryFee" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Frais de livraison fixes
                  </label>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                    Saisissez le montant forfaitaire ajouté à la commande si la livraison est demandée par le client.
                  </p>
                </div>
                <div>
                  <div className="relative rounded-lg shadow-2xs">
                    <input
                      type="number"
                      id="deliveryFee"
                      required
                      min={0}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-11 pl-4 pr-10 border border-slate-200 bg-white rounded-lg text-base text-slate-900 focus:outline-hidden focus:border-brand-primary transition font-semibold"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-semibold">
                      €
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Conditions générales */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 sm:p-8 shadow-xs hover:shadow-sm transition duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-brand-soft text-brand-primary rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Conditions générales et règles</h3>
                  <p className="text-slate-500 text-sm mt-1">Modifiez les mentions légales du contrat de location généré au format PDF.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold block mb-1">Guide de mise en forme</span>
                    Saisissez une règle par ligne. Pour mettre en valeur le titre d'une règle (en gras), utilisez le format : <strong className="text-slate-800">Numéro. Titre : Description</strong> (le caractère <code className="bg-white px-1 py-0.5 border border-slate-200 rounded text-slate-700">:</code> sert de séparateur).
                  </div>
                </div>

                <textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={14}
                  className="w-full border border-slate-200 bg-white rounded-xl p-4 text-slate-800 focus:outline-hidden focus:border-brand-primary transition font-mono text-sm leading-relaxed"
                  placeholder="Ex: 1. Durée de location : La durée de location est fixée à..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 h-12 bg-brand-primary hover:bg-brand-primary-active text-white rounded-xl text-sm font-bold tracking-tight transition duration-200 cursor-pointer shadow-xs flex items-center gap-2 hover:shadow-md"
              >
                <Save className="w-4 h-4" />
                Enregistrer les paramètres
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
