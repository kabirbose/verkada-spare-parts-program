"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FormField from "@/components/ui/FormField";

interface CartItem {
  partId: string;
  partName: string;
  quantity: number;
}

const emptyForm = {
  supportEngineerName: "",
  caseNumber: "",
  companyName: "",
  customerAddress: "",
  attentionTo: "",
  shippingMethod: "standard" as "standard" | "expedited",
  contactInfo: "",
  notes: "",
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to submit request.");
        return;
      }
      setItems([]);
      setForm(emptyForm);
      setSubmitted(true);
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (key: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) return <div className="p-10 text-center text-slate-500">Loading cart...</div>;

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted</h2>
            <p className="text-slate-500 mb-8">Your spare parts request has been submitted successfully.</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/" className="inline-flex px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Back to Storefront
              </Link>
              <Link href="/orders" className="inline-flex px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
              <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
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
          <>
            {/* Cart Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
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

            {/* Request Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Request Details</h2>
                <p className="text-slate-500 text-sm mt-1">Fill in the details below to submit your parts request.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Support Engineer Name" value={form.supportEngineerName} onChange={field("supportEngineerName")} placeholder="e.g. John Smith" required />
                <FormField label="Case Number" value={form.caseNumber} onChange={field("caseNumber")} placeholder="e.g. CASE-1234" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company Name" value={form.companyName} onChange={field("companyName")} placeholder="e.g. Acme Corp" required />
                <FormField label="Attention To" value={form.attentionTo} onChange={field("attentionTo")} placeholder="e.g. Jane Doe" required />
              </div>

              <FormField label="Customer Address" value={form.customerAddress} onChange={field("customerAddress")} placeholder="e.g. 123 Main St, New York, NY 10001" required />

              <FormField label="Customer Email / Phone" value={form.contactInfo} onChange={field("contactInfo")} placeholder="e.g. customer@example.com or +1 555 000 0000" required />

              {/* Shipping Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Shipping Method</label>
                <div className="flex gap-6">
                  {(["standard", "expedited"] as const).map((method) => (
                    <label key={method} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method}
                        checked={form.shippingMethod === method}
                        onChange={() => setForm({ ...form, shippingMethod: method })}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                        required
                      />
                      <span className="text-sm font-medium text-slate-700 capitalize group-hover:text-slate-900 transition-colors">
                        {method}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <FormField label="Notes" value={form.notes} onChange={field("notes")} placeholder="Any additional instructions or comments..." rows={3} />

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
