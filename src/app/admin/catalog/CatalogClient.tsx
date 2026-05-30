"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/Toast";
import { compressImage } from "@/lib/image-compress";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  X,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import AdminLayout from "../AdminLayout";

interface CatalogClientProps {
  token: string;
}

export default function CatalogClient({ token }: CatalogClientProps) {
  const { showToast } = useToast();
  // Fetch items
  const items = useQuery(api.items.list);

  // Mutations
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const nextStep = () => {
    if (step === 1) {
      if (!title.trim() || !description.trim()) {
        setErrorMsg("Veuillez remplir le titre et la description.");
        return;
      }
    } else if (step === 2) {
      if (price <= 0 || deposit <= 0 || stock < 1) {
        setErrorMsg("Le prix par jour et la caution doivent être strictement supérieurs à 0.");
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

  // Image upload handler with compression (supports multiple files)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await compressImage(file, 1);
        const uploadUrl = await generateUploadUrl({ token });

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": compressedFile.type },
          body: compressedFile,
        });

        if (!response.ok) throw new Error(`Erreur lors du transfert de l'image ${file.name}`);

        const { storageId } = await response.json();
        return {
          storageId,
          previewUrl: URL.createObjectURL(compressedFile),
        };
      });

      const results = await Promise.all(uploadPromises);

      const newStorageIds = results.map((r) => r.storageId);
      const newPreviewUrls = results.map((r) => r.previewUrl);

      setImageStorageIds((prev) => [...prev, ...newStorageIds]);
      setImagePreviews((prev) => [...prev, ...newPreviewUrls]);
      showToast(`${results.length} image(s) ajoutée(s) !`, "success");
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de compression ou de transfert.");
      showToast(err.message || "Erreur de compression ou de transfert.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImageStorageIds((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Reorder images
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImageStorageIds((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });

    setImagePreviews((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveImage(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTouchStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const previewItem = element.closest("[data-index]");
    if (previewItem) {
      const targetIndex = parseInt(previewItem.getAttribute("data-index") || "", 10);
      if (!isNaN(targetIndex) && targetIndex !== draggedIndex) {
        moveImage(draggedIndex, targetIndex);
        setDraggedIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    setDraggedIndex(null);
  };

  // Handle submit
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (price <= 0 || deposit <= 0 || stock < 1) {
      const msg = "Le prix par jour et la caution doivent être strictement supérieurs à 0.";
      setErrorMsg(msg);
      showToast(msg, "error");
      return;
    }

    try {
      if (editingItem) {
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
      showToast(editingItem ? "Matériel mis à jour !" : "Matériel créé avec succès !", "success");
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de sauvegarde de l'objet.");
      showToast(err.message || "Erreur de sauvegarde de l'objet.", "error");
    }
  };

  // Delete handler
  const handleItemDelete = async (id: Id<"items">) => {
    if (!confirm("Voulez-vous vraiment supprimer cet objet du catalogue ?")) return;
    try {
      await removeItem({ token, id });
      showToast("Matériel supprimé avec succès !", "success");
    } catch (err: any) {
      showToast(err.message || "Erreur de suppression.", "error");
    }
  };

  return (
    <AdminLayout>
      {isModalOpen ? (
        <div className="w-full">
          {/* Form Header */}
          <div className="border-b border-brand-hairline pb-5 mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-brand-primary">
              {editingItem ? "Modifier le matériel" : "Ajouter un nouveau matériel"}
            </h2>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span>Étape {step} sur 3</span>
              <span className="text-slate-600 font-semibold">
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
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-center flex items-center justify-center space-x-2 text-rose-700 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="modalTitle" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Titre du matériel *
                  </label>
                  <input
                    type="text"
                    id="modalTitle"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Tente de réception 3x6m"
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="modalDesc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Description *
                  </label>
                  <textarea
                    id="modalDesc"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Dimensions, état, conseils d'utilisation..."
                    className="w-full p-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Pricing & Stock */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="modalPrice" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Prix / Jour (€) *
                  </label>
                  <input
                    type="number"
                    id="modalPrice"
                    required
                    min={0.01}
                    step={0.01}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="modalDeposit" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Caution (€) *
                  </label>
                  <input
                    type="number"
                    id="modalDeposit"
                    required
                    min={0.01}
                    step={0.01}
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="modalStock" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Photos */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Photos (Max 1 Mo - Compressé)
                  </span>

                  {/* Previews Grid */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                      {imagePreviews.map((url, idx) => (
                        <div
                          key={idx}
                          data-index={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={() => handleTouchStart(idx)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className={`relative w-full aspect-square bg-zinc-50 border rounded-md overflow-hidden group shadow-2xs touch-none cursor-move transition-all duration-200 ${draggedIndex === idx
                            ? "opacity-50 border-brand-primary scale-95 ring-2 ring-brand-primary/20"
                            : "border-slate-200"
                            }`}
                        >
                          <img src={url} alt="Aperçu" className="w-full h-full object-cover pointer-events-none" />
                          {idx === 0 && (
                            <span className="absolute bottom-2 left-2 bg-brand-primary text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs shadow-xs z-10 select-none">
                              Image de couverture
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition z-10 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Full-width Dropzone */}
                  <label className="w-full h-40 border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-md flex flex-col items-center justify-center text-slate-400 hover:text-brand-primary cursor-pointer transition bg-slate-50 mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Ajouter une photo</span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-slate-400">
                    Glissez/déposez ou sélectionnez des images. Taille max par fichier : 1 Mo.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-6">
              <div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-10 border border-slate-200 text-slate-500 rounded-md text-sm font-bold hover:bg-brand-soft transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 h-10 border border-slate-200 text-slate-700 rounded-md text-sm font-bold hover:bg-brand-soft transition cursor-pointer"
                  >
                    Précédent
                  </button>
                )}

                {step < 3 && (
                  <button
                    key="next-btn"
                    type="button"
                    onClick={nextStep}
                    className="px-5 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-sm font-bold transition shadow-xs cursor-pointer"
                  >
                    Suivant
                  </button>
                )}

                {step === 3 && (
                  <button
                    key="submit-btn"
                    type="submit"
                    disabled={uploadingImage}
                    className="px-5 h-10 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-50 text-white rounded-md text-sm font-bold transition shadow-xs cursor-pointer"
                  >
                    Sauvegarder
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-brand-primary">Catalogue & Matériels</h2>
            <button
              onClick={openNewItemModal}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-sm font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter un matériel</span>
            </button>
          </div>

          {items === undefined ? (
            <div className="h-64 flex items-center justify-center bg-brand-soft rounded-lg border border-brand-hairline">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="bg-brand-soft rounded-lg border border-brand-hairline py-16 text-center shadow-xs">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-base">Votre catalogue est vide</p>
              <p className="text-sm text-slate-400 mt-1">Cliquez sur ajouter du matériel pour commencer.</p>
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
                    <div className="absolute top-2 right-2 bg-brand-dark/80 text-white px-2 py-0.5 rounded-sm text-xs font-bold">
                      Stock total : {item.stock}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-primary text-base leading-tight">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-sm">
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
                        className="flex items-center justify-center space-x-1.5 h-10 border border-brand-hairline hover:bg-white text-slate-700 rounded-md text-sm font-bold transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleItemDelete(item._id)}
                        className="flex items-center justify-center space-x-1.5 h-10 border border-brand-hairline hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-md text-sm font-bold transition cursor-pointer"
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
    </AdminLayout>
  );
}
