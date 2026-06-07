"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  Calendar,
  ShoppingBag,
  Phone,
  Mail,
  User,
  Truck,
  Info,
  CheckCircle,
  ArrowLeft,
  Package,
  Loader2,
} from "lucide-react";
import { formatConvexError } from "@/lib/error";
import { prettyDisplayDate } from "@/lib/date";

interface CartItem {
  itemId: Id<"items">;
  title: string;
  price: number;
  deposit: number;
  quantity: number;
  maxAvailable: number;
  imageUrls: string[];
}

export default function CheckoutClient() {
  const { showToast } = useToast();
  const router = useRouter();

  // Local storage loaded states
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Contact details form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch settings from Convex
  const settings = useQuery(api.settings.get);
  const createBooking = useMutation(api.bookings.create);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedStart = localStorage.getItem("startDate");
      const storedEnd = localStorage.getItem("endDate");
      const storedCart = localStorage.getItem("cart");

      if (storedStart) setStartDate(storedStart);
      if (storedEnd) setEndDate(storedEnd);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart) as CartItem[];
        setCart(parsedCart);
      }
    } catch (e) {
      console.error("Failed to load checkout state from localStorage", e);
    }
    setMounted(true);
  }, []);

  // Validation and automatic redirection
  useEffect(() => {
    if (!mounted) return;
    if (cart.length === 0 || !startDate || !endDate) {
      showToast("Votre panier est vide ou les dates de location ne sont pas définies.", "warning");
      router.push("/");
    }
  }, [mounted, cart, startDate, endDate, router, showToast]);

  if (!mounted || cart.length === 0 || !startDate || !endDate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  // Pricing computations (rounded up)
  const rentalDays = Math.max(
    1,
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const itemsPriceTotal = Math.ceil(
    cart.reduce(
      (sum, item) => sum + Math.ceil(item.price) * item.quantity * rentalDays,
      0
    )
  );

  const deliveryPrice = delivery && settings ? Math.ceil(settings.deliveryFee) : 0;
  const grandTotal = Math.ceil(itemsPriceTotal + deliveryPrice);
  const cautionTotal = Math.ceil(
    cart.reduce((sum, item) => sum + Math.ceil(item.deposit) * item.quantity, 0)
  );

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !startDate || !endDate) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderItems = cart.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
      }));

      await createBooking({
        firstName,
        lastName,
        email,
        phone,
        startDate,
        endDate,
        delivery,
        deliveryAddress: delivery ? deliveryAddress : undefined,
        items: orderItems,
        totalPrice: grandTotal,
        totalDeposit: cautionTotal,
      });

      // Clear local storage on success
      localStorage.removeItem("cart");
      localStorage.removeItem("startDate");
      localStorage.removeItem("endDate");

      router.push("/checkout/success");
    } catch (err: any) {
      setSubmitError(formatConvexError(err));
      showToast(formatConvexError(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex-grow bg-white min-h-screen">
      {/* Pinned Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-lg tracking-tight text-brand-primary">
              LSmaloc
            </span>
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-brand-primary transition mb-8 text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-8">
          Finaliser ma réservation
        </h1>

        {submitError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-8">
            <p className="text-rose-800 font-semibold text-xs">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Column Left: Contact Details Form */}
          <div className="md:col-span-7 bg-white rounded-xl border border-brand-hairline p-6 shadow-2xs">
            <h2 className="text-base font-bold text-brand-primary uppercase tracking-wider mb-6 border-b border-brand-hairline pb-3">
              Vos Coordonnées
            </h2>

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-brand-primary transition"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-brand-primary transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@example.com"
                  className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-brand-primary transition"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Numéro de Téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-brand-primary transition"
                />
              </div>

              {/* Delivery Toggle Option */}
              <div className="bg-brand-card rounded-lg p-4 border border-brand-hairline space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-brand-primary">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-bold">Option Livraison</span>
                  </div>
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={delivery}
                    onChange={(e) => setDelivery(e.target.checked)}
                    className="w-4 h-4 text-brand-primary focus:ring-0 border-slate-300 rounded-sm"
                  />
                </div>
                {settings && (
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Frais de livraison fixes de <strong>{Math.ceil(settings.deliveryFee)}€</strong>.
                    Si décoché, retrait sur place.
                  </p>
                )}
                {delivery && (
                  <div className="mt-3">
                    <label htmlFor="deliveryAddress" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Adresse de livraison *
                    </label>
                    <input
                      type="text"
                      id="deliveryAddress"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="12 rue de la Paix, 75002 Paris"
                      className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-brand-primary transition"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-50 text-white font-bold text-sm rounded-md transition duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Confirmer ma demande de réservation"
                )}
              </button>
            </form>
          </div>

          {/* Column Right: Order Summary */}
          <div className="md:col-span-5 bg-white rounded-xl border border-brand-hairline p-6 shadow-2xs space-y-6">
            <h2 className="text-base font-bold text-brand-primary uppercase tracking-wider border-b border-brand-hairline pb-3">
              Récapitulatif
            </h2>

            {/* Rental Dates Summary */}
            <div className="flex items-start space-x-3 text-brand-primary text-xs bg-brand-soft border border-brand-hairline p-3 rounded-lg">
              <Calendar className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Période de location :</p>
                <p className="text-slate-600 mt-1 font-semibold">
                  {prettyDisplayDate(startDate, endDate)}
                </p>
                <p className="text-slate-500 text-[10px] mt-0.5">({rentalDays} jour{rentalDays > 1 ? "s" : ""})</p>
              </div>
            </div>

            {/* Rented Items List */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.itemId} className="flex space-x-3 border-b border-brand-hairline pb-3 last:border-b-0 last:pb-0">
                  <div className="w-12 h-12 rounded-md bg-zinc-100 border border-brand-hairline flex items-center justify-center overflow-hidden shrink-0">
                    {item.imageUrls.length > 0 ? (
                      <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-brand-primary text-xs leading-snug truncate">
                      {item.title}
                    </h4>
                    <div className="flex justify-between items-baseline mt-1 text-[11px] text-slate-500">
                      <span>
                        {Math.ceil(item.price)}€ × {item.quantity} × {rentalDays}j
                      </span>
                      <span className="font-bold text-slate-700">
                        {Math.ceil(item.price) * item.quantity * rentalDays}€
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-t border-brand-hairline pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Sous-total matériel</span>
                <span className="font-semibold text-slate-700">{itemsPriceTotal}€</span>
              </div>
              {delivery && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Frais de livraison</span>
                  <span className="font-semibold text-slate-700">{deliveryPrice}€</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-brand-primary border-t border-brand-hairline pt-2">
                <span>Total Location</span>
                <span className="text-base">{grandTotal}€</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-700 bg-badge-orange/10 p-2.5 rounded-md border border-badge-orange/20 mt-2">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-badge-orange" /> Caution totale à déposer
                </span>
                <span>{cautionTotal}€</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
