"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IProduct } from "@/models/Product";
import { ISparePart } from "@/models/SparePart";
import StatusBadge from "@/components/ui/StatusBadge";

interface ProductDetailProps {
  product: IProduct;
  parts: ISparePart[];
}

export default function ProductDetail({ product, parts }: ProductDetailProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        const count = (data.items ?? []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
        setCartCount(count);
      })
      .catch(() => {});
  }, []);

  const handleAddToCart = async (part: ISparePart) => {
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

  const filteredParts = parts.filter(
    (part) =>
      part.sparePart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.type && part.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Back Button & Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Storefront
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-6">
              <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-lg object-cover border border-slate-200 shadow-sm bg-white" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{product.name} Spare Parts</h1>
                <p className="text-slate-500 mt-1">{product.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Cart Link */}
              <Link
                href="/cart"
                className="relative px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 shrink-0"
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
              {/* Search */}
              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search spare parts by name or type..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spare Parts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  <th className="px-6 py-4">Spare Part</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">In Stock</th>
                  <th className="px-6 py-4">ETA</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredParts.length > 0 ? (
                  filteredParts.map((part) => (
                    <tr key={part._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{part.sparePart}</td>
                      <td className="px-6 py-4 text-slate-600">{part.type || "-"}</td>
                      <td className="px-6 py-4">
                        <StatusBadge value={part.availableAt} variant="location" />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge value={part.inStockStatus} variant="stock" />
                      </td>
                      <td className="px-6 py-4 text-slate-600">{part.eta || "-"}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate" title={part.notes}>
                        {part.notes || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleAddToCart(part)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                            addedId === part._id
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                          }`}
                        >
                          {addedId === part._id ? "Added!" : "+ Add to Cart"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {parts.length === 0
                        ? `No spare parts are currently listed for the ${product.name}.`
                        : `No spare parts found matching "${searchTerm}".`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
