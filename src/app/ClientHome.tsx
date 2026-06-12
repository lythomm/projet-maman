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
} from "lucide-react";

import { formatConvexError } from "@/lib/error";
import { prettyDisplayDate } from "@/lib/date";
import CalendarRangePicker from "@/components/CalendarRangePicker";

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>("Tous");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
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

  // Save to localStorage when state changes
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



  // Fetch items from Convex
  const items = useQuery(api.items.list, {});
  const settings = useQuery(api.settings.get);

  // Group items by category
  const groupedItems = items
    ? items.reduce(
      (groups, item) => {
        const catName = item.categoryName || "Autres";
        if (!groups[catName]) {
          groups[catName] = [];
        }
        groups[catName].push(item);
        return groups;
      },
      {} as Record<string, typeof items>
    )
    : {};

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === "Autres") return 1;
    if (b === "Autres") return -1;
    return a.localeCompare(b);
  });

  const activeFilter = selectedFilter === "Tous" || sortedCategories.includes(selectedFilter)
    ? selectedFilter
    : "Tous";

  // Fetch dynamic stock if dates are selected
  const availableStocks = useQuery(
    api.bookings.getAvailableStock,
    startDate && endDate ? { startDate, endDate } : "skip"
  );



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

  const itemsPriceTotal = Math.ceil(
    cart.reduce(
      (sum, item) => sum + Math.ceil(item.price) * item.quantity * rentalDays,
      0
    )
  );
  const grandTotal = itemsPriceTotal;
  const cautionTotal = Math.ceil(
    cart.reduce((sum, item) => sum + Math.ceil(item.deposit) * item.quantity, 0)
  );

  // Reset cart when dates change to prevent stock conflicts
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCart([]); // Clear cart as stocks are recalculated
  };



  return (
    <div className="relative flex-grow bg-white min-h-screen">
      {/* Top Navigation - Pinned header (White floor, Hairline border bottom) */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-lg tracking-tight text-brand-primary">
              LSmaloc
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
          <h1 className="text-4xl font-semibold tracking-tighter text-brand-primary leading-tight">
            Location de matériel pour vos évènements
          </h1>
        </div>

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



        {/* Catalogue section */}
        {items === undefined ? (
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
          <div className="space-y-12">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-brand-hairline">
              <button
                onClick={() => setSelectedFilter("Tous")}
                className={`px-4 py-2 text-xs font-bold rounded-full border transition duration-200 cursor-pointer select-none ${activeFilter === "Tous"
                  ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-zinc-50"
                  }`}
              >
                Tous ({items.length})
              </button>
              {sortedCategories.map((catName) => (
                <button
                  key={catName}
                  onClick={() => setSelectedFilter(catName)}
                  className={`px-4 py-2 text-xs font-bold rounded-full border transition duration-200 cursor-pointer select-none ${activeFilter === catName
                    ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-zinc-50"
                    }`}
                >
                  {catName} ({groupedItems[catName].length})
                </button>
              ))}
            </div>

            {sortedCategories
              .filter((catName) => activeFilter === "Tous" || activeFilter === catName)
              .map((catName) => {
                const catItems = groupedItems[catName];
                return (
                  <div key={catName} className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-lg font-bold tracking-tight text-brand-primary shrink-0 uppercase">
                        {catName} <span className="text-xs text-slate-400 font-normal lowercase">({catItems.length})</span>
                      </h2>
                      <div className="h-px bg-slate-200 flex-grow" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catItems.map((item) => {
                        const available = getStockFor(item._id, item.stock);
                        const isOutOfStock = available <= 0;

                        return (
                          <Link
                            key={item._id}
                            href={`/items/${item._id}`}
                            className="group flex flex-col bg-white rounded-lg overflow-hidden border border-slate-200 hover:shadow-md hover:border-slate-300 transition duration-200 cursor-pointer"
                          >
                            {/* Image Area - Product UI embedded fragment */}
                            <div className="relative aspect-video w-full bg-zinc-50 border-b border-slate-200/80 flex items-center justify-center overflow-hidden">
                              {item.imageUrls && item.imageUrls.length > 0 ? (
                                <img
                                  src={item.imageUrls[0]}
                                  alt={item.title}
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

                            {/* Details content inside card */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                              <div>
                                {item.categoryName && (
                                  <span className="text-[10px] text-brand-accent uppercase tracking-wider font-extrabold block mb-1">
                                    {item.categoryName}
                                  </span>
                                )}
                                {/* Title - changes color on group hover to match Amazon anchor behaviors */}
                                <h3 className="text-sm font-bold tracking-tight text-slate-900 leading-tight group-hover:text-brand-accent transition-colors duration-200">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex flex-col justify-between">
                                {/* Pricing details */}
                                <div className="flex items-baseline space-x-1">
                                  <span className="text-lg font-extrabold text-slate-900">{Math.ceil(item.price)}€</span>
                                  <span className="text-[10px] text-slate-500 font-normal">/ jour</span>
                                </div>
                                {/* Stock status indicator */}
                                {isOutOfStock ? (
                                  <p className="text-rose-600 text-[10px] font-bold mt-2">Actuellement indisponible.</p>
                                ) : startDate && endDate ? (
                                  available <= 3 ? (
                                    <p className="text-amber-600 text-[10px] font-bold mt-2">
                                      Plus que {available} en stock - commandez vite.
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
                );
              })}
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
                              {Math.ceil(item.price)}€ × {item.quantity} × {rentalDays}j
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
                        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-badge-orange" /> Caution totale à déposer</span>
                        <span>{cautionTotal}€</span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <div className="border-t border-brand-hairline pt-6">
                      <Link
                        href="/checkout"
                        className={`w-full h-11 bg-brand-primary hover:bg-brand-primary-active text-white font-bold text-sm rounded-md transition duration-200 flex items-center justify-center ${
                          cart.length === 0 ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
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
      )}
      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDatePickerOpen(false)}
          />
          <div className="relative bg-white rounded-xl border border-brand-hairline p-6 shadow-xl max-w-sm w-full mx-4 z-10">
            <button
              onClick={() => setIsDatePickerOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

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
          </div>
        </div>
      )}
    </div>
  );
}
