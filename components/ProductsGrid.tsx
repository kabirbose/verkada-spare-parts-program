"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { IProduct } from "@/models/Product";
import { ISparePart } from "@/models/SparePart";
import CardActionButtons from "@/components/ui/CardActionButtons";

export default function ProductsGrid({
  products,
  spareParts = [],
}: {
  products: IProduct[];
  spareParts: ISparePart[];
}) {
  const router = useRouter();

  const [localProducts, setLocalProducts] = useState<IProduct[]>(products);
  const [localParts,    setLocalParts]    = useState<ISparePart[]>(spareParts);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [viewMode,      setViewMode]      = useState<"all" | "parts">("all");

  // Cart state
  const [cartCount, setCartCount] = useState(0);
  const [addedId,   setAddedId]   = useState<string | null>(null);

  // Selection state
  const [selectMode,   setSelectMode]   = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Drag-select state
  const dragStartRef  = useRef<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => { setLocalProducts(products); }, [products]);
  useEffect(() => { setLocalParts(spareParts); },  [spareParts]);
  useEffect(() => {
    setSearchTerm("");
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [viewMode]);

  // Drag-select mouse handlers
  useEffect(() => {
    if (!selectMode) {
      dragStartRef.current = null;
      setSelectionBox(null);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const x1 = dragStartRef.current.x;
      const y1 = dragStartRef.current.y;
      const x2 = e.clientX;
      const y2 = e.clientY;
      setSelectionBox({
        left:   Math.min(x1, x2),
        top:    Math.min(y1, y2),
        width:  Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);

      if (dx > 6 || dy > 6) {
        const x1 = Math.min(dragStartRef.current.x, e.clientX);
        const x2 = Math.max(dragStartRef.current.x, e.clientX);
        const y1 = Math.min(dragStartRef.current.y, e.clientY);
        const y2 = Math.max(dragStartRef.current.y, e.clientY);

        const els = document.querySelectorAll<HTMLElement>("[data-selectable-id]");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          els.forEach((el) => {
            const b = el.getBoundingClientRect();
            if (b.left < x2 && b.right > x1 && b.top < y2 && b.bottom > y1) {
              next.add(el.dataset.selectableId!);
            }
          });
          return next;
        });
      }

      dragStartRef.current = null;
      setSelectionBox(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [selectMode]);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        const count = (data.items ?? []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
        setCartCount(count);
      })
      .catch(() => {});
  }, []);

  // ── Derived lists ────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() =>
    localProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [localProducts, searchTerm]);

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: typeof localProducts } = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.description]) groups[p.description] = [];
      groups[p.description].push(p);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProducts]);

  const filteredParts = useMemo(() =>
    localParts.filter((p) =>
      p.sparePart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [localParts, searchTerm]);

  // ── Selection helpers ────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () => {
    const ids = viewMode === "all"
      ? filteredProducts.map((p) => p._id as string)
      : filteredParts.map((p)    => p._id as string);
    setSelectedIds(new Set(ids));
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) setLocalProducts((prev) => prev.filter((p) => p._id !== id));
      else alert("Failed to delete device. Please try again.");
    } catch (err) { console.error(err); }
  };

  const handleDeletePart = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this spare part?")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) setLocalParts((prev) => prev.filter((p) => p._id !== id));
      else alert("Failed to delete spare part. Please try again.");
    } catch (err) { console.error(err); }
  };

  const handleAddToCart = async (e: React.MouseEvent, part: ISparePart) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId: part._id, partName: part.sparePart }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = (data.items ?? []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
        setCartCount(count);
        setAddedId(part._id as string);
        setTimeout(() => setAddedId(null), 1500);
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
    const count    = selectedIds.size;
    const typeLabel = viewMode === "all" ? `device${count !== 1 ? "s" : ""}` : `spare part${count !== 1 ? "s" : ""}`;
    if (!confirm(`Permanently delete ${count} ${typeLabel}? This cannot be undone.`)) return;

    setBulkDeleting(true);
    const endpoint = viewMode === "all" ? "products" : "parts";
    const ids      = Array.from(selectedIds);

    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/${endpoint}/${id}`, { method: "DELETE" })
          .then((res) => ({ id, ok: res.ok }))
          .catch(() => ({ id, ok: false }))
      )
    );

    const deleted = new Set(results.filter((r) => r.ok).map((r) => r.id));
    if (viewMode === "all") {
      setLocalProducts((prev) => prev.filter((p) => !deleted.has(p._id as string)));
    } else {
      setLocalParts((prev) => prev.filter((p) => !deleted.has(p._id as string)));
    }

    setBulkDeleting(false);
    exitSelectMode();
  };

  const handleBulkExport = () => {
    const ids = selectedIds;
    let rows: Record<string, string>[];
    let filename: string;

    if (viewMode === "all") {
      const selected = localProducts.filter((p) => ids.has(p._id as string));
      rows = selected.map((d) => ({
        "Device ID":       d._id as string,
        "Device Name":     d.name,
        "Device Category": d.description,
        "Image URL":       d.imageUrl,
      }));
      filename = "devices-export.csv";
    } else {
      const selected = localParts.filter((p) => ids.has(p._id as string));
      rows = selected.map((p) => ({
        "Part ID":            p._id as string,
        "Part Name":          p.sparePart,
        "Compatible Devices": (p.compatibleProduct ?? []).join(", "),
        "Part Type":          p.type,
        "Location":           p.availableAt ?? "",
        "Stock Status":       p.inStockStatus ?? "",
        "ETA":                p.eta ?? "",
        "Notes":              p.notes ?? "",
      }));
      filename = "parts-export.csv";
    }

    const csv  = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Shared checkbox indicator ────────────────────────────────────────────

  function Checkbox({ id }: { id: string }) {
    const checked = selectedIds.has(id);
    return (
      <div
        className={`absolute top-2 left-2 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${
          checked ? "bg-blue-600 border-blue-600" : "bg-white/90 border-slate-300"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Spare Parts Program</h1>
          <p className="text-slate-500 mt-2 text-lg">Select a device or spare part to view details.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center flex-wrap xl:flex-nowrap">
          {/* Search Input */}
          <input
            type="text"
            placeholder={viewMode === "all" ? "Search devices..." : "Search spare parts..."}
            className="w-full sm:w-72 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* View Mode Toggle + Select button (grouped) */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner flex-1 sm:flex-none">
              {(["all", "parts"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`cursor-pointer flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode === "all" ? "Devices" : "Spare Parts"}
                </button>
              ))}
            </div>

            {/* Select toggle — icon button, sits flush with the view toggle */}
            <button
              title={selectMode ? "Exit selection mode" : "Select items"}
              onClick={() => { selectMode ? exitSelectMode() : setSelectMode(true); }}
              className={`shrink-0 p-2 rounded-lg border transition-colors cursor-pointer shadow-sm ${
                selectMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : "bg-white hover:bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              {selectMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              )}
            </button>
          </div>

          {/* Cart Link */}
          <Link href="/cart" className="relative w-full sm:w-auto px-5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Admin Link */}
          <Link href="/admin" className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin
          </Link>
        </div>
      </div>

      {/* DEVICES (Grouped by Category) */}
      {viewMode === "all" && (
        <div
          className={`space-y-12 ${selectMode ? "select-none" : ""}`}
          onMouseDown={(e) => {
            if (!selectMode) return;
            // Only start drag from the background (not from within a card)
            if ((e.target as HTMLElement).closest("button, a, input")) return;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
          }}
        >
          {groupedProducts.map(([category, prods]) => (
            <section key={category}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {prods.map((product) => {
                  const id       = product._id as string;
                  const selected = selectedIds.has(id);
                  return (
                    <Link
                      href={`/product/${id}`}
                      key={id}
                      data-selectable-id={id}
                      onClick={(e) => { if (selectMode) { e.preventDefault(); toggleSelect(id); } }}
                      className={`group bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col relative ${
                        selectMode
                          ? selected
                            ? "border-blue-500 ring-2 ring-blue-200 cursor-pointer"
                            : "border-slate-200 hover:border-blue-300 cursor-pointer"
                          : "border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="aspect-video w-full bg-slate-100 overflow-hidden relative shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div className={`${product.imageUrl ? "hidden" : ""} absolute inset-0 flex items-center justify-center`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        {selectMode ? (
                          <Checkbox id={id} />
                        ) : (
                          <CardActionButtons
                            withBackground
                            onEdit={(e) => { e.preventDefault(); router.push(`/admin/edit-product/${id}`); }}
                            onDelete={(e) => handleDeleteProduct(e, id)}
                            editLabel="Edit Device"
                            deleteLabel="Delete Device"
                          />
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col justify-start">
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{product.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
          {groupedProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
              <p className="text-slate-500 text-lg">No devices found matching your search.</p>
              <button onClick={() => setSearchTerm("")} className="mt-4 text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* SPARE PARTS (Flat Grid) */}
      {viewMode === "parts" && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${selectMode ? "select-none" : ""}`}
          onMouseDown={(e) => {
            if (!selectMode) return;
            if ((e.target as HTMLElement).closest("button, a, input")) return;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
          }}
        >
          {filteredParts.map((part) => {
            const id       = part._id as string;
            const selected = selectedIds.has(id);
            return (
              <div
                key={id}
                data-selectable-id={id}
                onClick={() => { if (selectMode) toggleSelect(id); }}
                className={`group bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col relative ${
                  selectMode
                    ? selected
                      ? "border-blue-500 ring-2 ring-blue-200 cursor-pointer"
                      : "border-slate-200 hover:border-blue-300 cursor-pointer"
                    : "border-slate-200 hover:border-blue-400"
                }`}
              >
                {/* Image at top — outside the padded content area */}
                {part.imageUrl ? (
                  <div className="aspect-video w-full bg-slate-100 overflow-hidden relative shrink-0">
                    <img
                      src={part.imageUrl}
                      alt={part.sparePart}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {selectMode ? (
                      <Checkbox id={id} />
                    ) : (
                      <CardActionButtons
                        withBackground
                        onEdit={(e) => { e.preventDefault(); router.push(`/admin/edit-part/${id}`); }}
                        onDelete={(e) => handleDeletePart(e, id)}
                        editLabel="Edit Spare Part"
                        deleteLabel="Delete Spare Part"
                      />
                    )}
                  </div>
                ) : (
                  selectMode ? (
                    <Checkbox id={id} />
                  ) : (
                    <CardActionButtons
                      onEdit={(e) => { e.preventDefault(); router.push(`/admin/edit-part/${id}`); }}
                      onDelete={(e) => handleDeletePart(e, id)}
                      editLabel="Edit Spare Part"
                      deleteLabel="Delete Spare Part"
                    />
                  )
                )}

                {/* Padded content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className={`flex items-center gap-3 mb-3 pr-16 ${selectMode && !part.imageUrl ? "pl-7" : ""}`}>
                    {!part.imageUrl && (
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{part.sparePart}</h3>
                  </div>

                  <div className="text-sm text-slate-600 flex flex-col gap-1 mt-2 mb-4">
                    <p><span className="font-semibold text-slate-700">Type:</span> {part.type || "N/A"}</p>
                    {part.compatibleProduct && part.compatibleProduct.length > 0 && (
                      <p><span className="font-semibold text-slate-700">Compatible Devices:</span> {part.compatibleProduct.join(", ")}</p>
                    )}
                    <p><span className="font-semibold text-slate-700">Location:</span> {part.availableAt || "N/A"}</p>
                    <p><span className="font-semibold text-slate-700">In Stock:</span> {part.inStockStatus || "Unknown"}</p>
                    {part.eta && <p><span className="font-semibold text-slate-700">ETA:</span> {part.eta}</p>}
                    {part.notes && <p className="mt-2 text-slate-500 italic line-clamp-2">{part.notes}</p>}
                  </div>

                  {!selectMode && (
                    <button
                      onClick={(e) => handleAddToCart(e, part)}
                      className={`mt-auto w-full py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                        addedId === id
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      {addedId === id ? "Added!" : "+ Add to Cart"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredParts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
              <p className="text-slate-500 text-lg">No spare parts found matching your search.</p>
              <button onClick={() => setSearchTerm("")} className="mt-4 text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drag-select rubber-band box */}
      {selectionBox && selectionBox.width > 4 && selectionBox.height > 4 && (
        <div
          className="fixed pointer-events-none z-40 border border-blue-500 bg-blue-500/10 rounded"
          style={{
            left:   selectionBox.left,
            top:    selectionBox.top,
            width:  selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectMode && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl pointer-events-auto">
            <span className="text-sm font-semibold text-slate-200">
              {selectedIds.size} selected
            </span>

            <div className="w-px h-4 bg-slate-700" />

            <button
              onClick={selectAll}
              className="text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Select all
            </button>

            {selectedIds.size > 0 && (
              <>
                <div className="w-px h-4 bg-slate-700" />
                <button
                  onClick={handleBulkExport}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Export {selectedIds.size}
                </button>
                <div className="w-px h-4 bg-slate-700" />
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {bulkDeleting ? "Deleting…" : `Delete ${selectedIds.size}`}
                </button>
              </>
            )}

            <div className="w-px h-4 bg-slate-700" />

            <button
              onClick={exitSelectMode}
              className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
