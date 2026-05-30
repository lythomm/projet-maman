"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useToast } from "@/components/Toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar,
  ShoppingBag,
  Phone,
  Mail,
  User,
  Truck,
  Info,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  X,
  Package,
} from "lucide-react";

interface CartItem {
  itemId: Id<"items">;
  title: string;
  price: number;
  deposit: number;
  quantity: number;
  maxAvailable: number;
  imageUrls: string[];
}

export default function ClientHome() {
  const { showToast } = useToast();
  // Date states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Client info form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState(false);

  // Status of the submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch items from Convex
  const items = useQuery(api.items.list);
  const settings = useQuery(api.settings.get);

  // Fetch dynamic stock if dates are selected
  const availableStocks = useQuery(
    api.bookings.getAvailableStock,
    startDate && endDate ? { startDate, endDate } : "skip"
  );

  const createBooking = useMutation(api.bookings.create);

  // Calculate today and tomorrow to set minimums in date inputs
  const todayStr = new Date().toISOString().split("T")[0];

  // Helper: get available stock for an item
  const getStockFor = (itemId: Id<"items">, defaultStock: number) => {
    if (!availableStocks) return defaultStock;
    const stockInfo = availableStocks.find((s) => s.itemId === itemId);
    return stockInfo ? stockInfo.availableStock : defaultStock;
  };

  // Add to cart helper
  const addToCart = (item: any) => {
    if (!startDate || !endDate) {
      showToast("Veuillez sélectionner vos dates de début et de fin de location.", "warning");
      return;
    }

    const available = getStockFor(item._id, item.stock);
    if (available <= 0) {
      showToast("Ce matériel n'est plus disponible aux dates sélectionnées.", "error");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item._id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, available);
        return prev.map((i) =>
          i.itemId === item._id ? { ...i, quantity: nextQty } : i
        );
      }
      return [
        ...prev,
        {
          itemId: item._id,
          title: item.title,
          price: item.price,
          deposit: item.deposit,
          quantity: 1,
          maxAvailable: available,
          imageUrls: item.imageUrls || [],
        },
      ];
    });
  };

  const updateQuantity = (itemId: Id<"items">, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.itemId === itemId) {
            const newQty = i.quantity + delta;
            return { ...i, quantity: Math.min(Math.max(1, newQty), i.maxAvailable) };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (itemId: Id<"items">) => {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  // Cart calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rentalDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 1;

  const itemsPriceTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity * rentalDays,
    0
  );
  const deliveryPrice = delivery && settings ? settings.deliveryFee : 0;
  const grandTotal = itemsPriceTotal + deliveryPrice;
  const cautionTotal = cart.reduce((sum, item) => sum + item.deposit * item.quantity, 0);

  // Reset cart when dates change to prevent stock conflicts
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCart([]); // Clear cart as stocks are recalculated
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!startDate || !endDate) return;

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
        items: orderItems,
        totalPrice: grandTotal,
        totalDeposit: cautionTotal,
      });

      setSubmitSuccess("Votre demande de réservation a été enregistrée avec succès !");
      setCart([]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDelivery(false);
    } catch (err: any) {
      setSubmitError(err.message || "Une erreur est survenue lors de la réservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex-grow bg-white min-h-screen">
      {/* Top Navigation - Pinned header (White floor, Hairline border bottom) */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
              p.
            </div>
            <span className="font-semibold text-lg tracking-tight text-brand-primary">
              projet-maman
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-brand-soft transition duration-200 text-brand-primary"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero Section - Confident Display Typography */}
        <div className="text-left max-w-2xl mb-12">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter text-brand-primary leading-tight">
            The better way to rent event equipment.
          </h1>
          <p className="mt-3 text-base text-slate-600 font-normal">
            Sélectionnez vos dates, constituez votre panier de matériel et soumettez votre demande de location instantanément.
          </p>
        </div>

        {/* Date Selector Banner - White card with hairline border */}
        <div className="bg-white rounded-xl border border-brand-hairline p-6 mb-16 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-4 text-brand-primary font-semibold text-sm tracking-tight">
            <Calendar className="w-4 h-4" />
            <span>Sélectionnez votre période d'événement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Date de début
              </label>
              <input
                type="date"
                id="startDate"
                min={todayStr}
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value, endDate)}
                className="w-full h-10 px-3.5 rounded-md border border-brand-hairline bg-white text-slate-800 text-sm focus:outline-hidden focus:border-brand-primary transition"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Date de fin
              </label>
              <input
                type="date"
                id="endDate"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => handleDateChange(startDate, e.target.value)}
                className="w-full h-10 px-3.5 rounded-md border border-brand-hairline bg-white text-slate-800 text-sm focus:outline-hidden focus:border-brand-primary transition"
              />
            </div>
          </div>
          {startDate && endDate && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 bg-brand-soft p-3 rounded-md border border-brand-hairline">
              <span>Durée totale : <strong className="text-brand-primary font-semibold">{rentalDays} jour(s)</strong></span>
              <span className="text-brand-accent font-semibold">Stocks actualisés pour ces dates.</span>
            </div>
          )}
        </div>

        {/* Success Modal / Banner */}
        {submitSuccess && (
          <div className="bg-white border border-brand-hairline rounded-xl p-6 text-left shadow-md max-w-2xl mb-16">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-brand-soft border border-brand-hairline flex items-center justify-center text-badge-emerald shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-brand-primary mb-1">{submitSuccess}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Votre demande a bien été envoyée à l'administrateur. Vous recevrez une réponse très prochainement pour convenir des modalités logistiques et du paiement (en espèces ou chèque à la livraison/retrait).
                </p>
                <button
                  onClick={() => setSubmitSuccess(null)}
                  className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md font-semibold text-xs tracking-tight transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error notice */}
        {submitError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-8">
            <p className="text-rose-800 font-semibold text-xs">{submitError}</p>
          </div>
        )}

        {/* Catalogue section */}
        {!startDate || !endDate ? (
          <div className="text-center py-20 bg-brand-soft rounded-xl border border-brand-hairline max-w-2xl mx-auto">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-brand-primary tracking-tight">Sélectionnez des dates</h3>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
              Veuillez configurer vos dates de location en haut de page pour vérifier la disponibilité de nos matériels.
            </p>
          </div>
        ) : items === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-brand-card rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-brand-soft rounded-xl border border-brand-hairline max-w-2xl mx-auto">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-brand-primary tracking-tight">Catalogue vide</h3>
            <p className="text-slate-500 text-xs mt-1">Aucun matériel n'est enregistré pour le moment.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold tracking-tight text-brand-primary mb-6">
              Matériels disponibles <span className="text-xs text-slate-400 font-normal">({items.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const available = getStockFor(item._id, item.stock);
                const isOutOfStock = available <= 0;
                const inCartItem = cart.find((i) => i.itemId === item._id);

                return (
                  <div
                    key={item._id}
                    className="flex flex-col bg-brand-card hover:bg-zinc-100 rounded-lg overflow-hidden border border-brand-hairline transition duration-200"
                  >
                    {/* Image Area - Product UI embedded fragment */}
                    <div className="relative aspect-video w-full bg-zinc-200 border-b border-brand-hairline flex items-center justify-center overflow-hidden">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Package className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-medium tracking-tight">Pas d'image</span>
                        </div>
                      )}
                      {isOutOfStock ? (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-3 py-1 bg-brand-dark text-white font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                            Épuisé
                          </span>
                        </div>
                      ) : available <= 3 ? (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 bg-badge-orange text-white font-bold text-[9px] uppercase rounded-sm">
                            Stock : {available} restants
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Details content inside card */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold tracking-tight text-brand-primary leading-tight">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200/60">
                        {/* Features rows */}
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Prix / Jour</span>
                            <span className="font-extrabold text-brand-primary text-sm">{item.price}€</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Caution unit.</span>
                            <span className="font-bold text-slate-600">{item.deposit}€</span>
                          </div>
                        </div>

                        {/* CTA button (Confient SaaS style) */}
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="w-full h-10 bg-zinc-200 text-slate-400 rounded-md font-semibold text-xs cursor-not-allowed"
                          >
                            Indisponible
                          </button>
                        ) : inCartItem ? (
                          <div className="flex items-center justify-between bg-white border border-brand-hairline rounded-md p-1">
                            <button
                              onClick={() => updateQuantity(item._id, -1)}
                              className="p-1.5 text-slate-600 hover:bg-brand-soft rounded-md transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-brand-primary text-xs">
                              {inCartItem.quantity} réservé(s)
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, 1)}
                              disabled={inCartItem.quantity >= available}
                              className="p-1.5 text-slate-600 hover:bg-brand-soft rounded-md disabled:opacity-30 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-full h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md font-bold text-xs tracking-tight transition duration-200"
                          >
                            Ajouter au panier
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full border-l border-brand-hairline">
              
              {/* Header Drawer */}
              <div className="px-6 py-5 bg-white border-b border-brand-hairline flex items-center justify-between">
                <div className="flex items-center space-x-2 text-brand-primary">
                  <ShoppingBag className="w-4 h-4" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Mon Panier</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-3" />
                    <p className="font-semibold text-slate-800 text-sm">Votre panier est vide</p>
                    <p className="text-xs mt-1">Choisissez des articles du catalogue.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex space-x-4 border-b border-brand-hairline pb-4"
                        >
                          <div className="w-14 h-14 rounded-md bg-zinc-100 border border-brand-hairline flex items-center justify-center overflow-hidden shrink-0">
                            {item.imageUrls.length > 0 ? (
                              <img
                                src={item.imageUrls[0]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-brand-primary text-xs leading-snug truncate">{item.title}</h4>
                            <span className="text-[11px] text-slate-500">
                              {item.price}€ × {item.quantity} × {rentalDays}j
                            </span>

                            <div className="flex items-center justify-between mt-2">
                              {/* Quantity selectors */}
                              <div className="flex items-center border border-brand-hairline rounded-md bg-brand-soft p-0.5">
                                <button
                                  onClick={() => updateQuantity(item.itemId, -1)}
                                  className="p-1 text-slate-500 hover:bg-white rounded-sm transition"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-slate-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.itemId, 1)}
                                  disabled={item.quantity >= item.maxAvailable}
                                  className="p-1 text-slate-500 hover:bg-white rounded-sm disabled:opacity-35 transition"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.itemId)}
                                className="text-slate-400 hover:text-rose-600 transition p-1"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Toggle (Standard friendly-SaaS cards) */}
                    <div className="bg-brand-card rounded-lg p-4 border border-brand-hairline space-y-2">
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
                          className="w-4 h-4 text-brand-primary focus:ring-0 border-brand-hairline rounded-sm"
                        />
                      </div>
                      {delivery && settings && (
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Les frais de livraison fixes de <strong>{settings.deliveryFee}€</strong> ont été ajoutés à la commande.
                        </p>
                      )}
                    </div>

                    {/* Cost summary */}
                    <div className="border-t border-brand-hairline pt-4 space-y-2.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Sous-total matériel</span>
                        <span>{itemsPriceTotal}€</span>
                      </div>
                      {delivery && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Frais de livraison</span>
                          <span>{deliveryPrice}€</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-extrabold text-brand-primary border-t border-brand-hairline pt-2">
                        <span>Total Location</span>
                        <span>{grandTotal}€</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-700 bg-badge-orange/10 p-2.5 rounded-md border border-badge-orange/20 mt-2">
                        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-badge-orange" /> Caution totale à déposer</span>
                        <span>{cautionTotal}€</span>
                      </div>
                    </div>

                    {/* Client form */}
                    <form onSubmit={handleCheckout} className="border-t border-brand-hairline pt-6 space-y-4">
                      <h3 className="font-bold text-xs text-brand-primary uppercase tracking-wider">
                        Vos Coordonnées
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="firstName" className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Prénom
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Jean"
                            className="w-full h-10 px-3 rounded-md border border-brand-hairline bg-white text-sm focus:outline-hidden focus:border-brand-primary transition"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Nom
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Dupont"
                            className="w-full h-10 px-3 rounded-md border border-brand-hairline bg-white text-sm focus:outline-hidden focus:border-brand-primary transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jean.dupont@example.com"
                          className="w-full h-10 px-3 rounded-md border border-brand-hairline bg-white text-sm focus:outline-hidden focus:border-brand-primary transition"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="06 12 34 56 78"
                          className="w-full h-10 px-3 rounded-md border border-brand-hairline bg-white text-sm focus:outline-hidden focus:border-brand-primary transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-50 text-white font-bold text-sm rounded-md transition duration-200"
                      >
                        {isSubmitting ? "Envoi de la demande..." : "Envoyer ma demande"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
