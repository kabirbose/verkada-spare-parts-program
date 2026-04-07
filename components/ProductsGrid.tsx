"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [localParts, setLocalParts] = useState<ISparePart[]>(spareParts);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "parts">("all");

  // Cart state
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => { setLocalProducts(products); }, [products]);
  useEffect(() => { setLocalParts(spareParts); }, [spareParts]);
  useEffect(() => { setSearchTerm(""); }, [viewMode]);

  // Fetch cart count on mount
  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        const count = (data.items ?? []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
        setCartCount(count);
      })
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    return localProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localProducts, searchTerm]);

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: typeof localProducts } = {};
    filteredProducts.forEach((product) => {
      if (!groups[product.description]) groups[product.description] = [];
      groups[product.description].push(product);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProducts]);

  const filteredParts = useMemo(() => {
    return localParts.filter((part) =>
      part.sparePart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.notes && part.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [localParts, searchTerm]);

  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) setLocalProducts((prev) => prev.filter((p) => p._id !== id));
      else alert("Failed to delete product. Please try again.");
    } catch (err) { console.error("Error deleting product:", err); }
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
        const count = (data.items ?? []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
        setCartCount(count);
        setAddedId(part._id as string);
        setTimeout(() => setAddedId(null), 1500);
      }
    } catch (err) { console.error("Error adding to cart:", err); }
  };

  const handleDeletePart = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this spare part?")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) setLocalParts((prev) => prev.filter((p) => p._id !== id));
      else alert("Failed to delete part. Please try again.");
    } catch (err) { console.error("Error deleting part:", err); }
  };

  return (
    <>
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Spare Parts Program</h1>
          <p className="text-gray-500 mt-2 text-lg">Select a device or part to view details.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center flex-wrap xl:flex-nowrap">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto shrink-0 shadow-inner">
            {(["all", "parts"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`cursor-pointer flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode === "all" ? "Devices" : "Parts"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder={viewMode === "all" ? "Search devices..." : "Search parts..."}
            className="w-full sm:w-72 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Orders Link */}
          <Link
            href="/orders"
            className="w-full sm:w-auto px-5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-2 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </Link>

          {/* Cart Link */}
          <Link
            href="/cart"
            className="relative w-full sm:w-auto px-5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-2 shrink-0"
          >
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
          <Link
            href="/admin"
            className="w-full sm:w-auto px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-2 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin
          </Link>
        </div>
      </div>

      {/* RENDER MODELS (Grouped by Category) */}
      {viewMode === "all" && (
        <div className="space-y-12">
          {groupedProducts.map(([category, prods]) => (
            <section key={category}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {prods.map((product) => (
                  <Link
                    href={`/product/${product._id}`}
                    key={product._id}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col relative"
                  >
                    <div className="aspect-video w-full bg-gray-100 overflow-hidden relative shrink-0">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <CardActionButtons
                        withBackground
                        onEdit={(e) => { e.preventDefault(); router.push(`/admin/edit-product/${product._id}`); }}
                        onDelete={(e) => handleDeleteProduct(e, product._id as string)}
                        editLabel="Edit Product"
                        deleteLabel="Delete Product"
                      />
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-start">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {groupedProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500 text-lg">No models found matching your search.</p>
              <button onClick={() => setSearchTerm("")} className="mt-4 text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* RENDER SPARE PARTS (Flat Grid) */}
      {viewMode === "parts" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredParts.map((part) => (
            <div key={part._id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col relative p-5">
              <CardActionButtons
                onEdit={(e) => { e.preventDefault(); router.push(`/admin/edit-part/${part._id}`); }}
                onDelete={(e) => handleDeletePart(e, part._id as string)}
                editLabel="Edit Part"
                deleteLabel="Delete Part"
              />

              <div className="flex items-center gap-3 mb-3 pr-16">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{part.sparePart}</h3>
              </div>

              <div className="text-sm text-gray-600 flex flex-col gap-1 mt-2 mb-4">
                <p><span className="font-semibold text-gray-700">Type:</span> {part.type || "N/A"}</p>
                {part.compatibleProduct && part.compatibleProduct.length > 0 && (
                  <p><span className="font-semibold text-gray-700">Compatibility:</span> {part.compatibleProduct.join(", ")}</p>
                )}
                <p><span className="font-semibold text-gray-700">Location:</span> {part.availableAt || "N/A"}</p>
                <p><span className="font-semibold text-gray-700">Stock:</span> {part.inStockStatus || "Unknown"}</p>
                {part.eta && <p><span className="font-semibold text-gray-700">ETA:</span> {part.eta}</p>}
                {part.notes && <p className="mt-2 text-gray-500 italic line-clamp-2">{part.notes}</p>}
              </div>
              <button
                onClick={(e) => handleAddToCart(e, part)}
                className={`mt-auto w-full py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                  addedId === part._id
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {addedId === part._id ? "Added!" : "+ Add to Cart"}
              </button>
            </div>
          ))}
          {filteredParts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500 text-lg">No spare parts found matching your search.</p>
              <button onClick={() => setSearchTerm("")} className="mt-4 text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
