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
  Minus,
  Trash2,
  Edit2,
  X,
  Upload,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatConvexError } from "@/lib/error";

interface CatalogClientProps {
  token: string;
}

export default function CatalogClient({ token }: CatalogClientProps) {
  const { showToast } = useToast();
  // Fetch items and categories
  const items = useQuery(api.items.list, { token });
  const categories = useQuery(api.categories.list);

  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const [selectedFilter, setSelectedFilter] = useState<string>("Tous");

  // Group items by category name
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


  const handleNextImage = (itemId: string, max: number) => {
    setActiveImageIndices((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: (current + 1) % max };
    });
  };

  const handlePrevImage = (itemId: string, max: number) => {
    setActiveImageIndices((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: (current - 1 + max) % max };
    });
  };

  // Mutations
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const deleteStorageFiles = useMutation(api.items.deleteStorageFiles);

  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  // Modal / form states for Catalog CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [stock, setStock] = useState(1);
  const [visible, setVisible] = useState(true);
  const [imageStorageIds, setImageStorageIds] = useState<string[]>([]);
  const [initialStorageIds, setInitialStorageIds] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Item category states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [quickNewCategoryName, setQuickNewCategoryName] = useState("");

  // Categories management modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [manageNewCategoryName, setManageNewCategoryName] = useState("");
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [categoryErrorMsg, setCategoryErrorMsg] = useState<string | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Custom delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Id<"items"> | null>(null);

  const nextStep = () => {
    if (step === 1) {
      if (!title.trim() || !description.trim()) {
        setErrorMsg("Veuillez remplir le titre et la description.");
        return;
      }
      if (selectedCategoryId === "__new__" && !quickNewCategoryName.trim()) {
        setErrorMsg("Veuillez saisir le nom de la nouvelle catégorie.");
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
    setVisible(true);
    setImageStorageIds([]);
    setInitialStorageIds([]);
    setImagePreviews([]);
    setSelectedCategoryId("");
    setIsCreatingNewCategory(false);
    setQuickNewCategoryName("");
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
    setVisible(item.visible !== false);
    setImageStorageIds(item.imageStorageIds || []);
    setInitialStorageIds(item.imageStorageIds || []);
    setImagePreviews(item.imageUrls || []);
    setSelectedCategoryId(item.categoryId || "");
    setIsCreatingNewCategory(false);
    setQuickNewCategoryName("");
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
      const formatted = formatConvexError(err);
      setErrorMsg(formatted);
      showToast(formatted, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const handleRemoveImage = async (index: number) => {
    const imageId = imageStorageIds[index];
    if (imageId && !initialStorageIds.includes(imageId)) {
      try {
        await deleteStorageFiles({ token, storageIds: [imageId] as any });
      } catch (err) {
        console.error("Failed to delete removed image from storage:", err);
      }
    }
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
      let catIdParam = selectedCategoryId && selectedCategoryId !== "__new__" 
        ? (selectedCategoryId as Id<"categories">) 
        : undefined;

      if (selectedCategoryId === "__new__") {
        const trimmedName = quickNewCategoryName.trim();
        if (!trimmedName) {
          setErrorMsg("Veuillez saisir le nom de la catégorie.");
          return;
        }
        const newCatId = await createCategory({ token, name: trimmedName });
        catIdParam = newCatId;
      }

      if (editingItem) {
        await updateItem({
          token,
          id: editingItem._id,
          title,
          description,
          price,
          deposit,
          stock,
          imageStorageIds: imageStorageIds as any,
          categoryId: catIdParam,
          visible,
        });
      } else {
        await createItem({
          token,
          title,
          description,
          price,
          deposit,
          stock,
          imageStorageIds: imageStorageIds as any,
          categoryId: catIdParam,
          visible,
        });
      }

      // Clean up old images that were removed during edit
      const removedStorageIds = initialStorageIds.filter(id => !imageStorageIds.includes(id));
      if (removedStorageIds.length > 0) {
        try {
          await deleteStorageFiles({ token, storageIds: removedStorageIds as any });
        } catch (err) {
          console.error("Failed to delete removed files:", err);
        }
      }

      showToast(editingItem ? "Matériel mis à jour !" : "Matériel créé avec succès !", "success");
      setIsModalOpen(false);
    } catch (err: any) {
      const formatted = formatConvexError(err);
      setErrorMsg(formatted);
      showToast(formatted, "error");
    }
  };

  // Handle cancel & cleanup new images
  const handleCancel = async () => {
    const newStorageIds = imageStorageIds.filter(id => !initialStorageIds.includes(id));
    if (newStorageIds.length > 0) {
      try {
        await deleteStorageFiles({ token, storageIds: newStorageIds as any });
      } catch (err) {
        console.error("Failed to delete unused uploaded files:", err);
      }
    }
    setIsModalOpen(false);
  };

  // Delete trigger (opens custom ConfirmDialog instead of window.confirm)
  const triggerItemDelete = (id: Id<"items">) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Actual submit delete handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await removeItem({ token, id: itemToDelete });
      showToast("Matériel supprimé avec succès !", "success");
    } catch (err: any) {
      showToast(formatConvexError(err), "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
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
              onClick={handleCancel}
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

                <div>
                  <label htmlFor="modalCategory" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Catégorie / Type
                  </label>
                  <select
                    id="modalCategory"
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      if (e.target.value !== "__new__") {
                        setQuickNewCategoryName("");
                      }
                    }}
                    className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
                  >
                    <option value="">-- Sans catégorie --</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__new__">+ Créer une nouvelle catégorie...</option>
                  </select>

                  {selectedCategoryId === "__new__" && (
                    <input
                      type="text"
                      required
                      value={quickNewCategoryName}
                      onChange={(e) => setQuickNewCategoryName(e.target.value)}
                      placeholder="Nom de la nouvelle catégorie (ex: Décorations)"
                      className="w-full h-11 px-3.5 border border-slate-200 bg-white rounded-md text-base focus:outline-hidden focus:border-brand-primary transition shadow-2xs mt-2"
                    />
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Pricing & Stock */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="modalPrice" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Prix (€) *
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
                  <div className="flex items-center space-x-2 w-full">
                    <input
                      type="number"
                      id="modalStock"
                      required
                      min={1}
                      value={stock}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStock(isNaN(val) || val < 1 ? 1 : val);
                      }}
                      placeholder="1"
                      className="flex-1 h-11 border border-slate-200 bg-white rounded-md text-center text-base font-bold focus:outline-hidden focus:border-brand-primary transition shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setStock((prev) => Math.max(1, prev - 1))}
                      disabled={stock <= 1}
                      className="w-11 h-11 border border-slate-200 hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent rounded-md flex items-center justify-center text-slate-600 transition shrink-0 cursor-pointer select-none"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStock((prev) => prev + 1)}
                      className="w-11 h-11 border border-slate-200 hover:bg-brand-soft rounded-md flex items-center justify-center text-slate-600 transition shrink-0 cursor-pointer select-none"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => setVisible(e.target.checked)}
                      className="w-4 h-4 text-brand-primary border-slate-200 rounded-sm focus:ring-brand-primary accent-brand-primary"
                    />
                    <span className="text-sm font-semibold text-slate-700">Mettre en ligne (visible pour les clients)</span>
                  </label>
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
                  onClick={handleCancel}
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCategoryErrorMsg(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 bg-white border border-brand-hairline hover:bg-zinc-50 text-brand-primary rounded-md text-sm font-bold transition cursor-pointer"
              >
                <span>Gérer les catégories</span>
              </button>
              <button
                onClick={openNewItemModal}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 bg-brand-primary hover:bg-brand-primary-active text-white rounded-md text-sm font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un matériel</span>
              </button>
            </div>
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
            <>
              {/* Filter pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
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
                    type="button"
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

              <div className="space-y-12">
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
                            const imageUrls = item.imageUrls || [];
                            const activeIdx = activeImageIndices[item._id] || 0;
                            const currentImgUrl = imageUrls[activeIdx];

                            return (
                              <div
                                key={item._id}
                                className="bg-brand-card rounded-lg overflow-hidden border border-brand-hairline flex flex-col justify-between group/card"
                              >
                                {/* Image Preview */}
                                <div className="aspect-video w-full bg-zinc-200 border-b border-brand-hairline flex items-center justify-center overflow-hidden relative">
                                  {currentImgUrl ? (
                                    <>
                                      <img
                                        src={currentImgUrl}
                                        alt={item.title}
                                        className={`w-full h-full object-cover transition-all duration-300 ${
                                          item.visible === false ? "grayscale opacity-75" : ""
                                        }`}
                                      />
                                      
                                      {/* Mini Slider Controls */}
                                      {imageUrls.length > 1 && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handlePrevImage(item._id, imageUrls.length);
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/75 text-white rounded-full transition cursor-pointer select-none opacity-0 group-hover/card:opacity-100 z-20"
                                          >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleNextImage(item._id, imageUrls.length);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/75 text-white rounded-full transition cursor-pointer select-none opacity-0 group-hover/card:opacity-100 z-20"
                                          >
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </button>
                                          
                                          {/* Dots / Indicator */}
                                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs select-none z-15">
                                            {activeIdx + 1} / {imageUrls.length}
                                          </div>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <Package className="w-6 h-6 text-slate-400" />
                                  )}
                                  <div className="absolute top-2 left-2 bg-brand-dark/80 text-white px-2 py-0.5 rounded-sm text-xs font-bold z-20">
                                    Stock : {item.stock}
                                  </div>
                                  {item.visible === false && (
                                    <div className="absolute bottom-2 left-2 bg-rose-600/90 text-white px-2 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider z-20">
                                      Hors ligne
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await updateItem({
                                          token,
                                          id: item._id,
                                          title: item.title,
                                          description: item.description,
                                          price: item.price,
                                          deposit: item.deposit,
                                          stock: item.stock,
                                          imageStorageIds: item.imageStorageIds || [],
                                          categoryId: item.categoryId,
                                          visible: item.visible === false,
                                        });
                                        showToast(item.visible === false ? "Matériel mis en ligne !" : "Matériel masqué !", "success");
                                      } catch (err: any) {
                                        showToast(formatConvexError(err), "error");
                                      }
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-brand-primary rounded-full shadow-md transition z-20 cursor-pointer select-none"
                                    title={item.visible === false ? "Mettre en ligne" : "Masquer"}
                                  >
                                    {item.visible === false ? (
                                      <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                    )}
                                  </button>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h3 className="font-bold text-brand-primary text-base leading-tight">{item.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>

                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-sm">
                                      <div>
                                        <span className="text-slate-400 block">Prix</span>
                                        <span className="font-bold text-slate-800">{Math.ceil(item.price)}€</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block">Caution</span>
                                        <span className="font-bold text-slate-800">{Math.ceil(item.deposit)}€</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Controls */}
                                  <div className="grid grid-cols-2 gap-2 mt-5">
                                    <button
                                      type="button"
                                      onClick={() => openEditItemModal(item)}
                                      className="flex items-center justify-center space-x-1.5 h-10 border border-brand-hairline hover:bg-white text-slate-700 rounded-md text-sm font-bold transition cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Modifier</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => triggerItemDelete(item._id)}
                                      className="flex items-center justify-center space-x-1.5 h-10 border border-brand-hairline hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-md text-sm font-bold transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Supprimer</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}
      {/* Categories Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCategoryModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl border border-brand-hairline p-6 shadow-xl max-w-md w-full mx-4 z-10 text-slate-800 font-sans">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-brand-soft hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-brand-primary mb-4">Gérer les catégories</h3>

            {categoryErrorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs font-semibold text-rose-700 mb-4">
                {categoryErrorMsg}
              </div>
            )}

            {/* Add Category Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCategoryErrorMsg(null);
                const trimmed = manageNewCategoryName.trim();
                if (!trimmed) return;
                try {
                  await createCategory({ token, name: trimmed });
                  setManageNewCategoryName("");
                  showToast("Catégorie ajoutée !", "success");
                } catch (err: any) {
                  setCategoryErrorMsg(formatConvexError(err));
                }
              }}
              className="flex space-x-2 mb-6"
            >
              <input
                type="text"
                required
                value={manageNewCategoryName}
                onChange={(e) => setManageNewCategoryName(e.target.value)}
                placeholder="Nouvelle catégorie (ex: Mobilier)"
                className="flex-1 h-10 px-3 border border-slate-200 bg-white rounded-md text-sm focus:outline-hidden focus:border-brand-primary transition"
              />
              <button
                type="submit"
                className="px-4 bg-brand-primary hover:bg-brand-primary-active text-white font-bold text-xs rounded-md transition cursor-pointer"
              >
                Ajouter
              </button>
            </form>

            {/* Categories List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {categories === undefined ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 text-brand-primary animate-spin mx-auto" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aucune catégorie créée pour le moment.</p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-2 rounded-md bg-brand-soft border border-brand-hairline text-sm"
                  >
                    {editingCategory?.id === cat._id ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setCategoryErrorMsg(null);
                          const trimmed = renameCategoryName.trim();
                          if (!trimmed) return;
                          try {
                            await updateCategory({ token, id: cat._id, name: trimmed });
                            setEditingCategory(null);
                            showToast("Catégorie renommée !", "success");
                          } catch (err: any) {
                            setCategoryErrorMsg(formatConvexError(err));
                          }
                        }}
                        className="flex-1 flex items-center space-x-1.5"
                      >
                        <input
                          type="text"
                          required
                          value={renameCategoryName}
                          onChange={(e) => setRenameCategoryName(e.target.value)}
                          className="flex-1 h-8 px-2 border border-slate-200 bg-white rounded-md text-xs focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          className="px-2.5 h-8 bg-brand-primary text-white text-[10px] font-bold rounded-md hover:bg-brand-primary-active"
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="px-2.5 h-8 bg-zinc-200 text-slate-600 text-[10px] font-bold rounded-md hover:bg-zinc-300"
                        >
                          Annuler
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setEditingCategory({ id: cat._id, name: cat.name });
                              setRenameCategoryName(cat.name);
                              setCategoryErrorMsg(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-white rounded-md transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Voulez-vous vraiment supprimer cette catégorie ? Tous les matériels associés seront détachés."
                                )
                              )
                                return;
                              setCategoryErrorMsg(null);
                              try {
                                await removeCategory({ token, id: cat._id });
                                showToast("Catégorie supprimée !", "success");
                              } catch (err: any) {
                                setCategoryErrorMsg(formatConvexError(err));
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Dialog replacing window.confirm */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Supprimer le matériel"
        description="Voulez-vous vraiment supprimer cet objet du catalogue ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
      />
    </AdminLayout>
  );
}
