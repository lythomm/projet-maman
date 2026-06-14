"use client";

import { useState } from "react";
import { Phone, Mail, ArrowLeft, Send } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Modal from "./Modal";

export default function ContactButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const sendMessage = useAction(api.emails.sendContactMessage);

  const handleClose = () => {
    setIsOpen(false);
    // Reset states after animation closes
    setTimeout(() => {
      setShowForm(false);
      setName("");
      setEmail("");
      setMessage("");
      setStatus("idle");
      setErrorMessage("");
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      await sendMessage({ name, email, message });
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-xs sm:max-w-sm">
        <div className="mt-1 space-y-4">
          {!showForm ? (
            // Mode 1: Sélection de contact
            <>
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

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-primary hover:bg-brand-soft/40 transition group cursor-pointer text-left"
                >
                  <Mail className="w-4 h-4 text-slate-400 group-hover:text-brand-primary transition shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-primary transition break-all font-sans">
                      Envoyer un message en ligne
                    </p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            // Mode 2: Formulaire d'envoi de mail
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setStatus("idle");
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-500"
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                    Envoyer un message
                  </h3>
                  <p className="text-xs text-slate-500">
                    Réponse sous 24-48h
                  </p>
                </div>
              </div>

              <hr className="border-brand-hairline" />

              {status === "success" ? (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex p-3 bg-green-50 text-green-500 rounded-full border border-green-100">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Message envoyé !</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                      Votre message a bien été envoyé. Nous vous répondrons très prochainement.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 text-xs font-semibold text-brand-primary hover:text-brand-dark transition bg-brand-soft px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="contact-name" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Votre nom *
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jean Dupont"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-primary disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Votre adresse e-mail *
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jean.dupont@example.com"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-primary disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Bonjour, je souhaiterais en savoir plus sur..."
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-primary resize-none disabled:bg-slate-50"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
