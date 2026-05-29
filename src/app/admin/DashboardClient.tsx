"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { adminLogoutAction } from "@/app/actions/auth";
import { compressImage } from "@/lib/image-compress";
import {
  Calendar,
  Package,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  User,
  Phone,
  Mail,
  Truck,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface DashboardClientProps {
  token: string;
}

export default function DashboardClient({ token }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "catalog" | "settings">("bookings");

  // Fetch data
  const bookings = useQuery(api.bookings.list, { token });
  const items = useQuery(api.items.list);
  const settings = useQuery(api.settings.get);

  // Mutations
  const updateBookingStatus = useMutation(api.bookings.updateStatus);
  const removeBooking = useMutation(api.bookings.remove);
  
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  
  const updateSettings = useMutation(api.settings.update);

  // Modal / form states for Catalog CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [stock, setStock] = useState(1);
  const [imageStorageIds, setImageStorageIds] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step === 1) {
      if (!title.trim() || !description.trim()) {
        setErrorMsg("Veuillez remplir le titre et la description.");
        return;
      }
    } else if (step === 2) {
      if (price < 0 || deposit < 0 || stock < 1) {
        setErrorMsg("Veuillez entrer des valeurs valides pour le prix, la caution et le stock.");
        return;
      }
    }
    setErrorMsg(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep((prev) => prev - 1);
  };

  // Settings form state
  const [deliveryFee, setDeliveryFee] = useState<number | "">("");

  // Handling logout
  const handleLogout = async () => {
    await adminLogoutAction();
    router.push("/admin/login");
    router.refresh();
  };

  // Open modal for new item
  const openNewItemModal = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setPrice(0);
    setDeposit(0);
    setStock(1);
    setImageStorageIds([]);
    setImagePreviews([]);
    setErrorMsg(null);
    setStep(1);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditItemModal = (item: any) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price);
    setDeposit(item.deposit);
    setStock(item.stock);
    setImageStorageIds(item.imageStorageIds || []);
    setImagePreviews(item.imageUrls || []);
    setErrorMsg(null);
    setStep(1);
    setIsModalOpen(true);
  };

  // Image upload handler with compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg(null);

    try {
      const file = files[0];
      
      // 1. Compress image to max 1MB
      const compressedFile = await compressImage(file, 1);
      
      // 2. Generate Convex upload URL
      const uploadUrl = await generateUploadUrl({ token });

      // 3. Upload to storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": compressedFile.type },
        body: compressedFile,
      });

      if (!response.ok) throw new Error("Erreur lors du transfert de l'image");

      const { storageId } = await response.json();

      // 4. Save storageId and create local preview URL
      setImageStorageIds((prev) => [...prev, storageId]);
      setImagePreviews((prev) => [...prev, URL.createObjectURL(compressedFile)]);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de compression ou de transfert.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image from form state
  const handleRemoveImage = (index: number) => {
    setImageStorageIds((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle CRUD submit
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (editingItem) {
        // Update
        await updateItem({
          token,
          id: editingItem._id,
          title,
          description,
          price,
          deposit,
          stock,
          imageStorageIds,
        });
      } else {
        // Create
        await createItem({
          token,
          title,
          description,
          price,
          deposit,
          stock,
          imageStorageIds,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de sauvegarde de l'objet.");
    }
  };

  // Booking status update handler
  const handleBookingStatus = async (id: Id<"bookings">, status: "accepted" | "rejected" | "pending") => {
    try {
      await updateBookingStatus({ token, id, status });
    } catch (err: any) {
      alert(err.message || "Impossible de mettre à jour le statut.");
    }
  };

  // Booking delete handler
  const handleBookingDelete = async (id: Id<"bookings">) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande de réservation ?")) return;
    try {
      await removeBooking({ token, id });
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression.");
    }
  };

  // Item delete handler
  const handleItemDelete = async (id: Id<"items">) => {
    if (!confirm("Voulez-vous vraiment supprimer cet objet du catalogue ?")) return;
    try {
      await removeItem({ token, id });
    } catch (err: any) {
      alert(err.message || "Erreur de suppression.");
    }
  };

  // Settings submit handler
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryFee === "") return;
    try {
      await updateSettings({ token, deliveryFee: Number(deliveryFee) });
      alert("Frais de livraison mis à jour !");
    } catch (err: any) {
      alert(err.message || "Erreur de mise à jour des paramètres.");
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-white min-h-screen text-slate-800 font-sans">
      
      {/* Top Navigation - Pinned header (White floor, Hairline border bottom) */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
              p.
            </div>
            <span className="font-semibold text-lg tracking-tight text-brand-primary">
              projet-maman <span className="text-[10px] text-slate-400 font-normal uppercase ml-1.5 tracking-wider border-l border-slate-200 pl-2">Console Admin</span>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-brand-hairline hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-md text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col w-full">
        {isModalOpen ? (
          <div className="bg-white rounded-xl border border-brand-hairline p-8 max-w-xl mx-auto w-full shadow-xs">
            {/* Form Header */}
            <div className="border-b border-brand-hairline pb-5 mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold tracking-tight text-brand-primary">
                {editingItem ? "Modifier le matériel" : "Ajouter un nouveau matériel"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                <span>Étape {step} sur 3</span>
                <span className="text-slate-600">
                  {step === 1 ? "Informations de base" : step === 2 ? "Prix & Stock" : "Photos du matériel"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-primary h-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) {
                  nextStep();
                } else {
                  handleItemSubmit(e);
                }
              }}
              className="space-y-6"
            >
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-center flex items-center justify-center space-x-2 text-rose-700 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="modalTitle" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Titre du matériel *
                    </label>
                    <input
                      type="text"
                      id="modalTitle"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Tente de réception 3x6m"
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="modalDesc" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Description *
                    </label>
                    <textarea
                      id="modalDesc"
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Dimensions, état, conseils d'utilisation..."
                      className="w-full p-3 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Pricing & Stock */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="modalPrice" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Prix / Jour (€) *
                    </label>
                    <input
                      type="number"
                      id="modalPrice"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="0"
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="modalDeposit" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Caution (€) *
                    </label>
                    <input
                      type="number"
                      id="modalDeposit"
                      required
                      min={0}
                      value={deposit}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      placeholder="0"
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="modalStock" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Stock total disponible *
                    </label>
                    <input
                      type="number"
                      id="modalStock"
                      required
                      min={1}
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      placeholder="1"
                      className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Photos */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Photos (Max 1 Mo - Compressé)
                    </span>

                    <div className="flex flex-wrap gap-3 mb-3">
                      {imagePreviews.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 bg-zinc-50 border border-slate-200 rounded-md overflow-hidden shrink-0 group shadow-2xs"
                        >
                          <img src={url} alt="Aperçu" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <label className="w-20 h-20 border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-md flex flex-col items-center justify-center text-slate-400 hover:text-brand-primary cursor-pointer transition shrink-0 bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[8px] font-bold uppercase">Ajouter</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Glissez/déposez ou sélectionnez des images. Taille max par fichier : 1 Mo.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Footer / Actions */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 h-10 border border-slate-200 text-slate-500 rounded-md text-xs font-bold hover:bg-brand-soft transition"
                  >
                    Annuler
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 h-10 border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-brand-soft transition"
                    >
                      Précédent
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-5 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-xs font-bold transition shadow-xs"
                    >
                      Suivant
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className="px-5 h-10 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-50 text-white rounded-md text-xs font-bold transition shadow-xs"
                    >
                      Sauvegarder
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {/* Navigation Switcher - Cal.com signature nav-pill-group */}
            <div className="flex justify-center sm:justify-start">
              <div className="bg-brand-soft p-1.5 rounded-full border border-brand-hairline flex items-center space-x-1">
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition duration-200 ${
                    activeTab === "bookings"
                      ? "bg-white text-brand-primary shadow-xs"
                      : "text-slate-500 hover:text-brand-primary"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Réservations</span>
                </button>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition duration-200 ${
                    activeTab === "catalog"
                      ? "bg-white text-brand-primary shadow-xs"
                      : "text-slate-500 hover:text-brand-primary"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Matériel & Catalogue</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition duration-200 ${
                    activeTab === "settings"
                      ? "bg-white text-brand-primary shadow-xs"
                      : "text-slate-500 hover:text-brand-primary"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Configuration</span>
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <main className="flex-grow">
              {/* TAB 1: BOOKINGS */}
              {activeTab === "bookings" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold tracking-tight text-brand-primary">Suivi des Réservations</h2>

                  {bookings === undefined ? (
                    <div className="h-64 flex items-center justify-center bg-brand-soft rounded-lg border border-brand-hairline">
                      <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="bg-brand-soft rounded-lg border border-brand-hairline py-16 text-center shadow-xs">
                      <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="font-bold text-slate-700 text-sm">Aucune demande reçue</p>
                      <p className="text-xs text-slate-400 mt-1">Les demandes de réservation de vos clients s'afficheront ici.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => {
                        const isPending = booking.status === "pending";
                        const isAccepted = booking.status === "accepted";
                        const isRejected = booking.status === "rejected";

                        return (
                          <div
                            key={booking._id}
                            className="bg-brand-card rounded-lg border border-brand-hairline p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6"
                          >
                            {/* Booking details */}
                            <div className="space-y-4 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 bg-white border border-brand-hairline px-2 py-0.5 rounded-sm">
                                  Reçu le {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                    isPending
                                      ? "bg-badge-orange/10 text-badge-orange border border-badge-orange/20"
                                      : isAccepted
                                      ? "bg-badge-emerald/10 text-slate-800 border border-badge-emerald/20"
                                      : "bg-badge-pink/10 text-badge-pink border border-badge-pink/20"
                                  }`}
                                >
                                  {isPending ? "En attente" : isAccepted ? "Accepté" : "Refusé"}
                                </span>
                              </div>

                              {/* Contact block */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3 rounded-md border border-brand-hairline">
                                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{booking.firstName} {booking.lastName}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-slate-600">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <a href={`tel:${booking.phone}`} className="hover:underline">{booking.phone}</a>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-slate-600">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <a href={`mailto:${booking.email}`} className="hover:underline truncate">{booking.email}</a>
                                </div>
                              </div>

                              {/* Logistics */}
                              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                                <div className="flex items-center space-x-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Période : Du {booking.startDate} au {booking.endDate}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{booking.delivery ? "Livraison requise" : "Retrait sur place"}</span>
                                </div>
                              </div>

                              {/* Items checklist */}
                              <div className="border-t border-slate-200/60 pt-3">
                                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                                  Articles commandés
                                </h4>
                                <div className="space-y-1.5">
                                  {booking.items.map((item: any, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                      <span className="text-slate-800 font-semibold">{item.title}</span>
                                      <span className="text-slate-500">Qté : <strong>{item.quantity}</strong></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Order financials & actions */}
                            <div className="lg:w-60 border-t lg:border-t-0 lg:border-l border-brand-hairline pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between shrink-0">
                              <div className="space-y-2 mb-4 text-xs">
                                <div className="flex justify-between text-slate-500">
                                  <span>Total Location :</span>
                                  <span className="font-extrabold text-brand-primary text-sm">{booking.totalPrice}€</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                  <span>Caution Globale :</span>
                                  <span className="font-bold text-slate-700">{booking.totalDeposit}€</span>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="space-y-2">
                                {isPending && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => handleBookingStatus(booking._id, "accepted")}
                                      className="h-9 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-xs font-bold transition"
                                    >
                                      Accepter
                                    </button>
                                    <button
                                      onClick={() => handleBookingStatus(booking._id, "rejected")}
                                      className="h-9 bg-white border border-brand-hairline hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-md text-xs font-bold transition"
                                    >
                                      Refuser
                                    </button>
                                  </div>
                                )}

                                {!isPending && (
                                  <button
                                    onClick={() => handleBookingStatus(booking._id, "pending")}
                                    className="w-full h-9 bg-white border border-brand-hairline hover:bg-brand-soft text-slate-700 rounded-md text-xs font-bold transition"
                                  >
                                    Remettre en attente
                                  </button>
                                )}

                                <button
                                  onClick={() => handleBookingDelete(booking._id)}
                                  className="w-full h-9 bg-white border border-brand-hairline hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md text-xs font-semibold transition"
                                >
                                  Supprimer la demande
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CATALOG */}
              {activeTab === "catalog" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight text-brand-primary">Catalogue & Matériels</h2>
                    <button
                      onClick={openNewItemModal}
                      className="flex items-center space-x-1.5 px-4 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-xs font-bold transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un matériel</span>
                    </button>
                  </div>

                  {items === undefined ? (
                    <div className="h-64 flex items-center justify-center bg-brand-soft rounded-lg border border-brand-hairline">
                      <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                    </div>
                  ) : items.length === 0 ? (
                    <div className="bg-brand-soft rounded-lg border border-brand-hairline py-16 text-center shadow-xs">
                      <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="font-bold text-slate-700 text-sm">Votre catalogue est vide</p>
                      <p className="text-xs text-slate-400 mt-1">Cliquez sur ajouter du matériel pour commencer.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          className="bg-brand-card rounded-lg overflow-hidden border border-brand-hairline flex flex-col justify-between"
                        >
                          {/* Image Preview */}
                          <div className="aspect-video w-full bg-zinc-200 border-b border-brand-hairline flex items-center justify-center overflow-hidden relative">
                            {item.imageUrls && item.imageUrls.length > 0 ? (
                              <img
                                src={item.imageUrls[0]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                            <div className="absolute top-2 right-2 bg-brand-dark/80 text-white px-2 py-0.5 rounded-sm text-[10px] font-bold">
                              Stock total : {item.stock}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-brand-primary text-sm leading-tight">{item.title}</h3>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                              
                              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs">
                                <div>
                                  <span className="text-slate-400 block">Prix / Jour</span>
                                  <span className="font-bold text-slate-800">{item.price}€</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Caution</span>
                                  <span className="font-bold text-slate-800">{item.deposit}€</span>
                                </div>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-2 gap-2 mt-5">
                              <button
                                onClick={() => openEditItemModal(item)}
                                className="flex items-center justify-center space-x-1.5 h-9 border border-brand-hairline hover:bg-white text-slate-700 rounded-md text-xs font-bold transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Modifier</span>
                              </button>
                              <button
                                onClick={() => handleItemDelete(item._id)}
                                className="flex items-center justify-center space-x-1.5 h-9 border border-brand-hairline hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-md text-xs font-bold transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeTab === "settings" && (
                <div className="max-w-xl bg-white rounded-lg border border-brand-hairline p-8 shadow-xs">
                  <h2 className="text-xl font-bold tracking-tight text-brand-primary mb-6">Paramètres Généraux</h2>

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
                        <label htmlFor="deliveryFee" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                          Frais de livraison fixes (€)
                        </label>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          Saisissez le montant forfaitaire à ajouter à la commande globale si la livraison est demandée.
                        </p>
                        <input
                          type="number"
                          id="deliveryFee"
                          required
                          min={0}
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full max-w-xs h-10 px-3.5 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-xs font-bold tracking-tight transition"
                      >
                        Enregistrer les paramètres
                      </button>
                    </form>
                  )}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
