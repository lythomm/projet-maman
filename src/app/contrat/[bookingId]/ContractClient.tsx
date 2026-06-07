"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  FileText, 
  CheckCircle2, 
  User, 
  Calendar, 
  Truck, 
  Info, 
  Loader2,
  Printer,
  ShieldCheck,
  Scale
} from "lucide-react";
import { prettyDisplayDate } from "@/lib/date";
import { formatConvexError } from "@/lib/error";

interface ContractClientProps {
  bookingId: Id<"bookings">;
}

export default function ContractClient({ bookingId }: ContractClientProps) {
  const booking = useQuery(api.bookings.getPublicBooking, { id: bookingId });
  const signContract = useMutation(api.bookings.signContract);

  const [signedName, setSignedName] = useState("");
  const [consent, setConsent] = useState(false);
  const [ip, setIp] = useState("127.0.0.1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch client IP on mount
  useEffect(() => {
    fetch("/api/get-ip")
      .then((res) => res.json())
      .then((data) => setIp(data.ip || "127.0.0.1"))
      .catch(() => setIp("127.0.0.1"));
  }, []);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Vous devez accepter les conditions et règles pour continuer.");
      return;
    }
    if (!signedName.trim()) {
      setError("Veuillez saisir votre nom et prénom.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signContract({
        id: bookingId,
        signedName: signedName.trim(),
        ip,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(formatConvexError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (booking === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement du contrat de location...</p>
        </div>
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-100 p-8 text-center shadow-xs">
          <FileText className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Contrat introuvable</h2>
          <p className="text-slate-500 text-sm mt-2">
            Ce lien de contrat semble invalide ou la réservation associée a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const isAlreadySigned = !!booking.contractSignedAt;
  const showSignedSuccess = success || isAlreadySigned;
  const signatureName = success ? signedName.trim() : booking.contractSignedName;
  const signatureDate = success ? new Date() : new Date(booking.contractSignedAt || 0);
  const signatureIp = success ? ip : booking.contractSignedIp;

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-brand-hairline shadow-2xs print:hidden">
          <div className="flex items-center space-x-2 text-brand-primary">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold tracking-tight">Contrat de location sécurisé</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / PDF</span>
          </button>
        </div>

        {/* The Contract Document */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="border-b border-slate-100 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-brand-primary mb-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain print:h-6 print:w-6" />
                <span className="font-semibold text-lg tracking-tight text-brand-primary">
                  LSmaloc
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                CONTRAT DE LOCATION
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Réf Réservation : {booking._id}
              </p>
            </div>
            
            <div className="bg-brand-soft border border-brand-hairline rounded-xl p-4 md:text-right print:bg-transparent print:border-none print:p-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Période de Location
              </span>
              <div className="font-bold text-brand-primary text-sm sm:text-base flex items-center md:justify-end gap-1.5">
                <Calendar className="w-4 h-4 text-brand-primary print:hidden" />
                <span>{prettyDisplayDate(booking.startDate, booking.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-slate-400" />
                Le Propriétaire (Bailleur)
              </h3>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p className="font-extrabold text-slate-800">LSmaloc</p>
                <p>Location de matériel évènementiel</p>
                <p>Contact principal : admin@lsmaloc.fr</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                Le Locataire (Client)
              </h3>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p className="font-extrabold text-slate-800">
                  {booking.firstName} {booking.lastName}
                </p>
                <p>Tél : {booking.phone}</p>
                <p>Email : {booking.email}</p>
                {booking.delivery && booking.deliveryAddress && (
                  <p className="text-xs text-slate-500 italic mt-1">
                    Adresse de livraison : {booking.deliveryAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-8 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Description du matériel loué
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                    <th className="py-2.5">Matériel</th>
                    <th className="py-2.5 text-center">Quantité</th>
                    <th className="py-2.5 text-right">Prix Unitaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {booking.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 text-slate-800 font-semibold">{item.title}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">{Math.ceil(item.price)} € / jour</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 bg-slate-50/70 border border-slate-100 rounded-xl p-6 space-y-3 print:bg-transparent print:border-slate-200">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                <span>Total Location :</span>
                <span className="text-lg font-black text-slate-800">{booking.totalPrice} €</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-600 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1 text-slate-600">
                  <Info className="w-4 h-4 text-amber-600 print:hidden" />
                  Dépôt de garantie (Caution totale non encaissée) :
                </span>
                <span className="text-lg font-black text-amber-700">{booking.totalDeposit} €</span>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="py-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Règles et conditions de location à respecter
            </h3>
            <div className="text-xs text-slate-600 space-y-4 leading-relaxed font-medium">
              <p>
                <strong>1. Durée de location :</strong> La durée de location est fixée à 3 jours calendaires à compter de la date de retrait ou de livraison du matériel.
              </p>
              <p>
                <strong>2. Propriété du matériel :</strong> Le matériel loué (vaisselle, décoration, mobilier, accessoires, etc.) demeure la propriété du loueur.
              </p>
              <p>
                <strong>3. Utilisation et soin :</strong> Le locataire s'engage à utiliser le matériel avec soin et à le restituer à la date convenue.
              </p>
              <p>
                <strong>4. Restitution de la vaisselle :</strong> La vaisselle n'a pas besoin d'être lavée, mais doit être débarrassée de tous déchets et restes alimentaires avant restitution.
              </p>
              <p>
                <strong>5. Éléments de décoration :</strong> Les éléments de décoration doivent être rendus en bon état, sans dégradation ni dommage apparent.
              </p>
              <p>
                <strong>6. Modalités financières et caution :</strong>
                <br />• Un acompte de 30 % du montant total de la location est exigé à la signature du contrat afin de valider la réservation.
                <br />• Le solde de la location devra être réglé intégralement au moment du retrait ou de la livraison du matériel.
                <br />• Une caution sous forme de chèque sera demandée lors du retrait du matériel. Cette caution ne sera pas encaissée et sera restituée après vérification du matériel au retour, sous réserve de l'absence de casse, perte, dégradation ou retard de restitution.
              </p>
              <p>
                <strong>7. Dégradations, casse, perte ou manquants :</strong> Tout dégât apparent, casse, perte ou élément manquant sera déduit de la caution, selon le coût de réparation ou de remplacement du matériel concerné. En cas de dégradation, de casse, de perte ou de non-restitution du matériel, le loueur se réserve le droit d'encaisser tout ou partie de la caution correspondant aux frais engagés.
              </p>
              <p>
                <strong>8. Responsabilité :</strong> Le locataire est responsable du matériel pendant toute la durée de la location, de sa remise jusqu'à sa restitution.
              </p>
              <p>
                <strong>9. Retard de restitution :</strong> Tout retard de restitution entraînera la facturation d'une période de location supplémentaire de 3 jours calendaires, non fractionnable.
              </p>
              <p>
                <strong>10. Acceptation du règlement :</strong> Toute réservation ou signature du contrat vaut acceptation du présent règlement.
              </p>
            </div>
          </div>

          {/* Signature Block */}
          <div className="border-t border-slate-100 pt-8 mt-6">
            {showSignedSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1 text-sm text-emerald-800">
                  <h4 className="font-extrabold text-base">Contrat valablement signé et accepté</h4>
                  <p className="font-semibold">Signataire : <span className="underline">{signatureName}</span></p>
                  <p className="text-xs text-emerald-700/80">
                    Signé le {signatureDate.toLocaleDateString("fr-FR")} à {signatureDate.toLocaleTimeString("fr-FR")}
                  </p>
                  <p className="text-xs text-emerald-700/80">
                    Adresse IP : {signatureIp} (Horodatage électronique faisant foi)
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSign} className="space-y-6 print:hidden">
                <div className="bg-brand-soft border border-brand-hairline rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded-sm border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer shrink-0"
                    />
                    <label htmlFor="consent" className="text-xs text-slate-600 font-semibold select-none leading-relaxed cursor-pointer">
                      En cochant cette case et en saisissant mon nom ci-dessous, je certifie avoir pris connaissance des conditions générales de location et des règles ci-dessus, et je m'engage à les respecter dans leur intégralité. Je reconnais que cette validation électronique a valeur de signature.
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                    <div>
                      <label htmlFor="signedName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Nom et Prénom du Locataire
                      </label>
                      <input
                        type="text"
                        id="signedName"
                        value={signedName}
                        onChange={(e) => setSignedName(e.target.value)}
                        placeholder="Ex: Thomas Martin"
                        className="w-full h-10 px-3.5 rounded-md border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-hidden focus:border-brand-primary transition placeholder:font-normal"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !consent || !signedName.trim()}
                      className="h-10 px-6 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-40 disabled:hover:bg-brand-primary text-white rounded-md text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signature en cours...</span>
                        </>
                      ) : (
                        <span>Signer et Accepter le Contrat</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Votre adresse IP ({ip}) sera enregistrée avec votre signature à des fins de preuve juridique.
                  </p>
                </div>

                {error && (
                  <div className="text-rose-600 text-xs font-bold bg-rose-50 border border-rose-100 rounded-lg p-3">
                    {error}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
