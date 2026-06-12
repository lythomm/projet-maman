"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
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
  Plus,
  Minus,
  Trash2,
  X,
  Package,
  ArrowLeft,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { formatConvexError } from "@/lib/error";
import { prettyDisplayDate } from "@/lib/date";
import CalendarRangePicker from "@/components/CalendarRangePicker";
import ContactButton from "@/components/ContactButton";
import Modal from "@/components/Modal";

interface CartItem {
  itemId: Id<"items">;
  title: string;
  price: number;
  deposit: number;
  quantity: number;
  maxAvailable: number;
  imageUrls: string[];
}

interface ItemDetailClientProps {
  itemId: string;
}

export default function ItemDetailClient({ itemId }: ItemDetailClientProps) {
  const { showToast } = useToast();
  const validItemId = itemId as Id<"items">;

  // Load state from localStorage asynchronously after mount
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [unavailabilityMessage, setUnavailabilityMessage] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);



  // Fetch item, settings, and stock from Convex
  const item = useQuery(api.items.get, { id: validItemId });
  const allItems = useQuery(api.items.list, {});
  const settings = useQuery(api.settings.get);

  const availableStocks = useQuery(
    api.bookings.getAvailableStock,
    startDate && endDate ? { startDate, endDate } : "skip"
  );



  // Calculate today and tomorrow
  const todayStr = new Date().toISOString().split("T")[0];

  // Helper: get available stock
  const getStockFor = (id: Id<"items">, defaultStock: number) => {
    if (!availableStocks) return defaultStock;
    const stockInfo = availableStocks.find((s) => s.itemId === id);
    return stockInfo ? stockInfo.availableStock : defaultStock;
  };

  // Get recommendations: same category first, excluding current item
  const recommendations = allItems && item
    ? allItems
        .filter((i) => i._id !== item._id)
        .sort((a, b) => {
          if (a.categoryName === item.categoryName && b.categoryName !== item.categoryName) return -1;
          if (a.categoryName !== item.categoryName && b.categoryName === item.categoryName) return 1;
          return 0;
        })
        .slice(0, 3)
    : [];

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedStart = localStorage.getItem("startDate");
      const storedEnd = localStorage.getItem("endDate");
      const storedCart = localStorage.getItem("cart");

      if (storedStart) setStartDate(storedStart);
      if (storedEnd) setEndDate(storedEnd);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // Carousel & Lightbox state
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollTo = (index: number) => {
    emblaApi?.scrollTo(index);
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Save state to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("startDate", startDate);
      localStorage.setItem("endDate", endDate);
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [startDate, endDate, cart, isLoaded]);



  // Add to cart click handler
  const handleRentClick = () => {
    if (!item) return;

    if (!startDate || !endDate) {
      setIsDatePickerOpen(true);
      return;
    }

    const available = getStockFor(item._id, item.stock);
    const inCart = cart.find((i) => i.itemId === item._id);
    const currentQty = inCart ? inCart.quantity : 0;
    const nextQty = currentQty + 1;

    if (available <= 0 || nextQty > available) {
      setUnavailabilityMessage(
        `Ce matériel n'est plus disponible en quantité suffisante pour la période du ${prettyDisplayDate(startDate, endDate)}.`
      );
      setIsErrorDialogOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item._id);
      if (existing) {
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


    showToast("Matériel ajouté au panier.", "success");
  };

  const updateQuantity = (id: Id<"items">, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.itemId === id) {
            const newQty = i.quantity + delta;
            return { ...i, quantity: Math.min(Math.max(1, newQty), i.maxAvailable) };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id: Id<"items">) => {
    setCart((prev) => prev.filter((i) => i.itemId !== id));
  };

  // Cart calculations
  const totalItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
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

  const itemsPriceTotal = Math.ceil(
    cart.reduce(
      (sum, i) => sum + Math.ceil(i.price) * i.quantity * rentalDays,
      0
    )
  );
  const grandTotal = itemsPriceTotal;
  const cautionTotal = Math.ceil(
    cart.reduce((sum, i) => sum + Math.ceil(i.deposit) * i.quantity, 0)
  );

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCart([]); // Clear cart to avoid conflict
  };



  if (item === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-brand-primary">Matériel introuvable</h1>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-sm">
          Le matériel demandé n'existe pas ou a été retiré du catalogue.
        </p>
        <Link
          href="/"
          className="mt-6 px-4 py-2 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-sm font-semibold transition"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const availableStock = getStockFor(item._id, item.stock);
  const isOutOfStock = availableStock <= 0;
  const inCartItem = cart.find((i) => i.itemId === item._id);

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

          <div className="flex items-center space-x-2">
            <ContactButton />
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-brand-primary transition mb-8 text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>



        {/* Date Selector Banner replacement */}
        {startDate && endDate && (
          <div className="bg-brand-soft rounded-xl border border-brand-hairline p-4 mb-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-brand-primary text-sm font-semibold">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>
                Location prévue : <strong className="font-extrabold">{prettyDisplayDate(startDate, endDate)}</strong> ({rentalDays} jour{rentalDays > 1 ? "s" : ""})
              </span>
            </div>
            <button
              onClick={() => setIsDatePickerOpen(true)}
              className="px-3.5 py-1.5 bg-white border border-brand-hairline hover:bg-zinc-50 text-brand-primary text-xs font-bold rounded-md transition"
            >
              Modifier les dates
            </button>
          </div>
        )}

        {/* Detail Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
          {/* Left: Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-xl bg-zinc-100 border border-brand-hairline overflow-hidden group">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <>
                  {/* Embla Viewport */}
                  <div className="overflow-hidden w-full h-full cursor-zoom-in" ref={emblaRef}>
                    <div className="flex h-full">
                      {item.imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="flex-[0_0_100%] min-w-0 h-full relative select-none"
                          onClick={() => handleImageClick(idx)}
                        >
                          <img
                            src={url}
                            alt={`${item.title} - image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Maximize Button overlay */}
                  <button
                    onClick={() => handleImageClick(selectedIndex)}
                    className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                    title="Voir en grand"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Navigation Chevrons */}
                  {item.imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={() => emblaApi?.scrollPrev()}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/95 hover:bg-white text-slate-700 rounded-full transition shadow-md border border-slate-100 cursor-pointer opacity-0 group-hover:opacity-100"
                        aria-label="Image précédente"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => emblaApi?.scrollNext()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/95 hover:bg-white text-slate-700 rounded-full transition shadow-md border border-slate-100 cursor-pointer opacity-0 group-hover:opacity-100"
                        aria-label="Image suivante"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-12 h-12 mb-3" />
                  <span className="text-xs font-medium tracking-tight">Aucune image disponible</span>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {item.imageUrls && item.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollTo(idx)}
                    className={`aspect-square rounded-md overflow-hidden bg-zinc-50 border transition-all cursor-pointer ${
                      selectedIndex === idx
                        ? "border-brand-primary ring-2 ring-brand-primary/25 scale-95"
                        : "border-brand-hairline hover:border-slate-300"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Specifications & CTA */}
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                {item.categoryName && (
                  <span className="text-xs text-brand-accent uppercase tracking-wider font-extrabold block mb-1">
                    {item.categoryName}
                  </span>
                )}
                <h1 className="text-3xl font-bold tracking-tight text-brand-primary leading-tight">
                  {item.title}
                </h1>
                <div className="mt-3 flex items-center space-x-3">
                  <span className="text-2xl font-extrabold text-brand-primary">
                    {Math.ceil(item.price)}€ <span className="text-xs text-slate-500 font-normal">/ jour</span>
                  </span>
                  <span className="h-4 w-px bg-slate-300"></span>
                  <span className="text-sm text-slate-600 font-medium">
                    Caution : {Math.ceil(item.deposit)}€
                  </span>
                </div>
              </div>

              <div className="border-t border-brand-hairline pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Description
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>

              <div className="border-t border-brand-hairline pt-6">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 bg-brand-soft p-3 rounded-md border border-brand-hairline">
                  <span className="font-semibold text-brand-primary">État des stocks</span>
                  {startDate && endDate ? (
                    <span className={`font-bold uppercase tracking-wider ${isOutOfStock ? "text-badge-pink" : "text-badge-emerald"}`}>
                      {isOutOfStock
                        ? "Épuisé aux dates choisies"
                        : `${availableStock} disponible(s) pour ces dates`}
                    </span>
                  ) : (
                    <span className="italic text-slate-500">
                      Définir des dates pour voir le stock ({item.stock} au total)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-brand-hairline pt-6 mt-8">
              {isOutOfStock && startDate && endDate ? (
                <button
                  disabled
                  className="w-full h-12 bg-zinc-200 text-slate-400 rounded-md font-bold text-sm cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Épuisé aux dates choisies</span>
                </button>
              ) : (
                <button
                  onClick={handleRentClick}
                  className="w-full h-12 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md font-bold text-sm tracking-tight transition duration-200"
                >
                  {startDate && endDate ? "Ajouter au panier" : "Choisir des dates et louer"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vous aimerez aussi */}
        {recommendations.length > 0 && (
          <div className="border-t border-slate-200/80 pt-12 mt-16 space-y-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold tracking-tight text-brand-primary uppercase">
                Vous aimerez aussi
              </h2>
              <div className="h-px bg-slate-200 flex-grow" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recItem) => {
                const available = getStockFor(recItem._id, recItem.stock);
                const isOutOfStock = available <= 0;

                return (
                  <Link
                    key={recItem._id}
                    href={`/items/${recItem._id}`}
                    className="group flex flex-col bg-white rounded-lg overflow-hidden border border-slate-200 hover:shadow-md hover:border-slate-300 transition duration-200 cursor-pointer animate-fade-in"
                  >
                    <div className="relative aspect-video w-full bg-zinc-50 border-b border-slate-200/80 flex items-center justify-center overflow-hidden">
                      {recItem.imageUrls && recItem.imageUrls.length > 0 ? (
                        <img
                          src={recItem.imageUrls[0]}
                          alt={recItem.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Package className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-medium tracking-tight">Pas d'image</span>
                        </div>
                      )}
                      {isOutOfStock ? (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2.5 py-1 bg-zinc-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                            Épuisé
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {recItem.categoryName && (
                          <span className="text-[10px] text-brand-accent uppercase tracking-wider font-extrabold block mb-1">
                            {recItem.categoryName}
                          </span>
                        )}
                        <h3 className="text-sm font-bold tracking-tight text-slate-900 leading-tight group-hover:text-brand-accent transition-colors duration-200">
                          {recItem.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {recItem.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col justify-between">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-extrabold text-slate-900">{Math.ceil(recItem.price)}€</span>
                          <span className="text-[10px] text-slate-500 font-normal">/ jour</span>
                        </div>
                        {isOutOfStock ? (
                          <p className="text-rose-600 text-[10px] font-bold mt-2">Actuellement indisponible.</p>
                        ) : startDate && endDate ? (
                          available <= 3 ? (
                            <p className="text-amber-600 text-[10px] font-bold mt-2">
                              Plus que {available} en stock.
                            </p>
                          ) : (
                            <p className="text-emerald-600 text-[10px] font-bold mt-2">En stock.</p>
                          )
                        ) : (
                          <p className="text-slate-500 text-[10px] italic mt-2">Vérifier stock aux dates voulues.</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Date Picker Modal */}
      <Modal isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} maxWidth="max-w-sm">
        <div className="flex items-center space-x-2.5 mb-4 text-brand-primary font-bold text-sm tracking-tight">
          <Calendar className="w-4 h-4" />
          <span>Période de location</span>
        </div>

        <div className="space-y-4">
          <CalendarRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />

          {startDate && endDate ? (
            <div className="bg-brand-soft border border-brand-hairline rounded-xl p-3.5 text-center text-xs text-brand-primary font-bold">
              <span className="text-brand-accent font-extrabold text-sm block">
                Durée de location : {rentalDays} jour{rentalDays > 1 ? "s" : ""}
              </span>
            </div>
          ) : startDate ? (
            <div className="bg-brand-soft border border-brand-hairline rounded-xl p-3.5 text-center text-xs text-slate-400 italic">
              Sélectionnez la date de fin sur le calendrier
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-400 italic">
              Sélectionnez la date de début sur le calendrier
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsDatePickerOpen(false)}
            disabled={!startDate || !endDate}
            className="w-full h-10 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-40 disabled:hover:bg-brand-primary text-white rounded-lg font-bold text-xs tracking-tight transition cursor-pointer"
          >
            Confirmer les dates
          </button>
        </div>
      </Modal>

      {/* Error Dialog Modal (Unavailability message) */}
      <Modal isOpen={isErrorDialogOpen} onClose={() => setIsErrorDialogOpen(false)} maxWidth="max-w-sm">
        <div className="flex items-center space-x-3 text-rose-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-base font-bold">Matériel indisponible</h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {unavailabilityMessage}
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => setIsErrorDialogOpen(false)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs tracking-tight transition"
          >
            Fermer
          </button>
        </div>
      </Modal>

      {/* Cart Drawer Overlay */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isCartOpen ? "visible" : "invisible pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsCartOpen(false)}
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className={`w-screen max-w-md bg-white shadow-xl flex flex-col h-full border-l border-brand-hairline transition-transform duration-300 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}>
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
                    {cart.map((cartItem) => (
                      <div
                        key={cartItem.itemId}
                        className="flex space-x-4 border-b border-brand-hairline pb-4"
                      >
                        <div className="w-14 h-14 rounded-md bg-zinc-100 border border-brand-hairline flex items-center justify-center overflow-hidden shrink-0">
                          {cartItem.imageUrls.length > 0 ? (
                            <img
                              src={cartItem.imageUrls[0]}
                              alt={cartItem.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-brand-primary text-xs leading-snug truncate">
                            {cartItem.title}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {Math.ceil(cartItem.price)}€ × {cartItem.quantity} × {rentalDays}j
                          </span>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity selectors */}
                            <div className="flex items-center border border-brand-hairline rounded-md bg-brand-soft p-0.5">
                              <button
                                onClick={() => updateQuantity(cartItem.itemId, -1)}
                                className="p-1 text-slate-500 hover:bg-white rounded-sm transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(cartItem.itemId, 1)}
                                disabled={cartItem.quantity >= cartItem.maxAvailable}
                                className="p-1 text-slate-500 hover:bg-white rounded-sm disabled:opacity-35 transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(cartItem.itemId)}
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

                  {/* Cost summary */}
                  <div className="border-t border-brand-hairline pt-4 space-y-2.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Sous-total matériel</span>
                      <span>{itemsPriceTotal}€</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-brand-primary border-t border-brand-hairline pt-2">
                      <span>Total Location</span>
                      <span>{grandTotal}€</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 bg-badge-orange/10 p-2.5 rounded-md border border-badge-orange/20 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-badge-orange" /> Caution totale à déposer
                      </span>
                      <span>{cautionTotal}€</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="border-t border-brand-hairline pt-6">
                    <Link
                      href="/checkout"
                      className={`w-full h-11 bg-brand-primary hover:bg-brand-primary-active text-white font-bold text-sm rounded-md transition duration-200 flex items-center justify-center ${cart.length === 0 ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
                        }`}
                    >
                      Valider ma commande
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Component */}
      {item.imageUrls && item.imageUrls.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={item.imageUrls.map((url) => ({ src: url }))}
        />
      )}
    </div>
  );
}
