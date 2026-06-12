"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  FileText, 
  CheckCircle2, 
  Loader2,
  ShieldCheck
} from "lucide-react";
import { formatConvexError } from "@/lib/error";
import dynamic from "next/dynamic";

const ContractPDFSection = dynamic(
  () => import("./ContractPDFSection"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    )
  }
);

interface ContractClientProps {
  bookingId: Id<"bookings">;
}

export default function ContractClient({ bookingId }: ContractClientProps) {
  const booking = useQuery(api.bookings.getPublicBooking, { id: bookingId });
  const settings = useQuery(api.settings.get);
  const signContract = useMutation(api.bookings.signContract);
  const generateContractUploadUrl = useMutation(api.bookings.generateContractUploadUrl);
  const saveContractFileId = useMutation(api.bookings.saveContractFileId);

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

      // Generate the PDF blob and upload it
      try {
        const uploadUrl = await generateContractUploadUrl({ bookingId });
        const { pdf } = await import("@react-pdf/renderer");
        const { default: ContractPDF } = await import("./ContractPDF");
        
        const doc = <ContractPDF booking={{
          ...booking,
          contractSignedAt: Date.now(),
          contractSignedName: signedName.trim(),
          contractSignedIp: ip
        }} settings={settings} />;
        
        const pdfBlob = await pdf(doc).toBlob();

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: pdfBlob,
        });
        const { storageId } = await response.json();
        
        await saveContractFileId({
          id: bookingId,
          storageId,
        });
      } catch (uploadErr) {
        console.error("Erreur de sauvegarde du PDF signé dans le stockage:", uploadErr);
      }

    } catch (err: any) {
      setError(formatConvexError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (booking === undefined || settings === undefined) {
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
    <div className="min-h-screen bg-slate-50/70 py-4 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-brand-hairline shadow-2xs">
          <div className="flex items-center space-x-2 text-brand-primary">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold tracking-tight">Contrat de location sécurisé</span>
          </div>
        </div>

        {/* Dynamic PDF Viewer & Download Block */}
        <ContractPDFSection booking={booking} settings={settings} />

        {/* Signature Block (HTML) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Signature du contrat
          </h3>
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
            <form onSubmit={handleSign} className="space-y-6">
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
                    En cochant cette case et en saisissant mon nom ci-dessous, je certifie avoir pris connaissance du contrat de location et des règles ci-dessus, et je m'engage à les respecter dans leur intégralité. Je reconnais que cette validation électronique a valeur de signature.
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
  );
}
