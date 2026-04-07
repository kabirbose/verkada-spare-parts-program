"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface OrderItem {
  partId: string;
  partName: string;
  quantity: number;
}

interface Order {
  _id: string;
  supportEngineerName: string;
  caseNumber: string;
  companyName: string;
  customerAddress: string;
  attentionTo: string;
  shippingMethod: "standard" | "expedited";
  contactInfo: string;
  notes: string;
  items: OrderItem[];
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [shippingFilter, setShippingFilter] = useState<"all" | "standard" | "expedited">("all");
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let result = orders.filter((o) => {
      const matchesSearch =
        !term ||
        o.caseNumber.toLowerCase().includes(term) ||
        o.companyName.toLowerCase().includes(term) ||
        o.supportEngineerName.toLowerCase().includes(term) ||
        o.attentionTo.toLowerCase().includes(term);
      const matchesShipping = shippingFilter === "all" || o.shippingMethod === shippingFilter;
      return matchesSearch && matchesShipping;
    });
    if (sortDir === "oldest") result = [...result].reverse();
    return result;
  }, [orders, search, shippingFilter, sortDir]);

  if (loading) return <div className="p-10 text-center text-slate-500">Loading orders...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto mt-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors">
            ← Back to Storefront
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Orders</h1>
              <p className="text-slate-500 mt-1">
                {orders.length === 0 ? "No orders yet" : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by case #, company, engineer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 sm:max-w-sm px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm bg-white text-sm"
          />

          {/* Shipping Filter */}
          <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner shrink-0">
            {(["all", "standard", "expedited"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShippingFilter(s)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer capitalize ${
                  shippingFilter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "all" ? "All Shipping" : s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner shrink-0">
            {(["newest", "oldest"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSortDir(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer capitalize ${
                  sortDir === d ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {d === "newest" ? "Newest first" : "Oldest first"}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm p-16 text-center">
            <p className="text-slate-400 text-lg">
              {orders.length === 0 ? "No orders have been submitted yet." : "No orders match your filters."}
            </p>
            {search || shippingFilter !== "all" ? (
              <button
                onClick={() => { setSearch(""); setShippingFilter("all"); }}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const isExpanded = expandedId === order._id;
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Summary Row — always visible, click to expand */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    className="w-full text-left px-6 py-5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Case # */}
                        <span className="font-bold text-slate-800 text-base">{order.caseNumber}</span>

                        {/* Shipping badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          order.shippingMethod === "expedited"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {order.shippingMethod === "expedited" ? "Expedited" : "Standard"}
                        </span>

                        {/* Parts count */}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          {totalQty} part{totalQty !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{order.companyName}</span>
                        <span>{order.supportEngineerName}</span>
                        <span className="text-slate-400">{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</span>
                        {/* Chevron */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-6 py-6 space-y-6">

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <Detail label="Support Engineer" value={order.supportEngineerName} />
                        <Detail label="Case Number" value={order.caseNumber} />
                        <Detail label="Company Name" value={order.companyName} />
                        <Detail label="Attention To" value={order.attentionTo} />
                        <Detail label="Customer Address" value={order.customerAddress} />
                        <Detail label="Contact Info" value={order.contactInfo} />
                        <Detail
                          label="Shipping Method"
                          value={
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              order.shippingMethod === "expedited"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {order.shippingMethod === "expedited" ? "Expedited" : "Standard"}
                            </span>
                          }
                        />
                        <Detail label="Submitted" value={`${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}`} />
                        {order.notes && <Detail label="Notes" value={order.notes} className="sm:col-span-2" />}
                      </div>

                      {/* Parts Table */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Parts Requested</p>
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Part Name</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {order.items.map((item) => (
                                <tr key={item.partId} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-slate-700">{item.partName}</td>
                                  <td className="px-4 py-3 text-right text-slate-500 font-semibold">{item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  );
}
