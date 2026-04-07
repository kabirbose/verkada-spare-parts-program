"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CartItem {
  partId: string;
  partName: string;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateQuantity = async (partId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(partId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.partId === partId ? { ...item, quantity } : item))
    );
    await fetch(`/api/cart/${partId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
  };

  const removeItem = async (partId: string) => {
    setItems((prev) => prev.filter((item) => item.partId !== partId));
    await fetch(`/api/cart/${partId}`, { method: "DELETE" });
  };

  const clearCart = async () => {
    if (!confirm("Remove all items from the cart?")) return;
    setItems([]);
    await fetch("/api/cart", { method: "DELETE" });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) return <div className="p-10 text-center text-slate-500">Loading cart...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto mt-8">

        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors">
            ← Back to Storefront
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Cart</h1>
              <p className="text-slate-500 mt-1">
                {totalItems === 0 ? "No items" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Clear cart
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <p className="text-slate-400 text-lg mb-4">Your cart is empty.</p>
            <Link href="/" className="inline-flex px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Browse Devices
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Spare Part</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.partId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{item.partName}</td>

                    {/* Quantity Controls */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.partId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors cursor-pointer"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updateQuantity(item.partId, val);
                          }}
                          className="w-12 text-center border border-slate-200 rounded-lg py-1 text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.partId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Remove */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeItem(item.partId)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove from cart"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
