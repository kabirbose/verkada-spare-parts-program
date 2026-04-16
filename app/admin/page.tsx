"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import FormField from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import CsvImport from "@/components/CsvImport";
import ImageUploadField from "@/components/ui/ImageUploadField";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductForm {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface PartForm {
  _id: string;
  sparePart: string;
  compatibleProduct: string;
  type: string;
  availableAt: string;
  inStockStatus: string;
  eta: string;
  notes: string;
  imageUrl: string;
}

const EMPTY_PRODUCT: ProductForm = { _id: "", name: "", description: "", imageUrl: "" };
const EMPTY_PART: PartForm = {
  _id: "", sparePart: "", compatibleProduct: "", type: "",
  availableAt: "", inStockStatus: "", eta: "", notes: "", imageUrl: "",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab,    setActiveTab]    = useState<"part" | "product">("part");
  const [status,       setStatus]       = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exporting,    setExporting]    = useState<"device" | "part" | null>(null);
  const [productForm,  setProductForm]  = useState<ProductForm>(EMPTY_PRODUCT);
  const [partForm,     setPartForm]     = useState<PartForm>(EMPTY_PART);

  // ── Export helpers ──────────────────────────────────────────────────────────

  // Fetch all records of the given type, convert to CSV, and trigger a download
  const handleExport = async (type: "device" | "part") => {
    setExporting(type);
    try {
      const res  = await fetch(type === "device" ? "/api/products" : "/api/parts");
      const data = await res.json();

      let rows: Record<string, string>[];
      let filename: string;

      if (type === "device") {
        rows = data.map((d: { _id: string; name: string; description: string; imageUrl: string }) => ({
          "Device ID":       d._id,
          "Device Name":     d.name,
          "Device Category": d.description,
          "Image URL":       d.imageUrl,
        }));
        filename = "devices-export.csv";
      } else {
        rows = data.map((p: {
          _id: string; sparePart: string; compatibleProduct?: string[];
          type: string; availableAt?: string; inStockStatus?: string; eta?: string; notes?: string;
        }) => ({
          "Part ID":            p._id,
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
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  // ── Form submission handlers ────────────────────────────────────────────────

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Normalize the ID to lowercase for URL consistency
        body: JSON.stringify({ ...productForm, _id: productForm._id.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      setStatus({ type: "success", message: "Device added successfully!" });
      setProductForm(EMPTY_PRODUCT);
    } catch (err: unknown) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "An unknown error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });
    try {
      const payload = {
        ...partForm,
        compatibleProduct: partForm.compatibleProduct
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      };
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add spare part");
      setStatus({ type: "success", message: "Spare part added successfully!" });
      setPartForm(EMPTY_PART);
    } catch (err: unknown) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "An unknown error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-2xl mx-auto mt-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors">
            ← Back to Storefront
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Dashboard</h1>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Orders
            </Link>
          </div>
          <p className="text-slate-500 mt-2">Add new devices and parts to the catalog.</p>
        </div>

        {/* Export panel */}
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-0.5">Export Catalog</p>
          <p className="text-xs text-slate-400 mb-4">Download all devices or parts as a CSV file.</p>
          <div className="flex gap-3">
            {(["part", "device"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleExport(type)}
                disabled={exporting !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {exporting === type ? (
                  "Exporting…"
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All {type === "part" ? "Parts" : "Devices"}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex space-x-2 mb-8 bg-slate-100 p-1 rounded-xl shadow-inner">
          {(["part", "product"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setStatus({ type: "", message: "" }); }}
              className={`flex-1 py-2.5 px-4 font-semibold text-sm transition-all rounded-lg cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab === "part" ? "Add Part" : "Add Device"}
            </button>
          ))}
        </div>

        <StatusMessage type={status.type} message={status.message} />

        {/* ── Add Part form ──────────────────────────────────────────────────── */}
        {activeTab === "part" && (
          <>
            <form onSubmit={handlePartSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">

              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3">
                  <FormField
                    label="Part ID"
                    value={partForm._id}
                    onChange={(e) => setPartForm({ ...partForm, _id: e.target.value })}
                    placeholder="e.g. 267"
                    required
                  />
                </div>
                <div className="md:w-2/3">
                  <FormField
                    label="Part Name"
                    value={partForm.sparePart}
                    onChange={(e) => setPartForm({ ...partForm, sparePart: e.target.value })}
                    placeholder="e.g. CD61 Bubble"
                    required
                  />
                </div>
              </div>

              <FormField
                label="Compatible Devices (comma-separated)"
                value={partForm.compatibleProduct}
                onChange={(e) => setPartForm({ ...partForm, compatibleProduct: e.target.value })}
                placeholder="e.g. CD61, CD62, CD61-E"
                required
                hint="Must exactly match existing device names."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Part Type"
                  value={partForm.type}
                  onChange={(e) => setPartForm({ ...partForm, type: e.target.value })}
                  placeholder="e.g. Bubble, Mount"
                  required
                />
                <FormField
                  label="Location / Available At"
                  value={partForm.availableAt}
                  onChange={(e) => setPartForm({ ...partForm, availableAt: e.target.value })}
                  placeholder="e.g. Warehouse Aisle 4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Stock Status"
                  value={partForm.inStockStatus}
                  onChange={(e) => setPartForm({ ...partForm, inStockStatus: e.target.value })}
                  placeholder="e.g. Yes, No, 5 Left"
                />
                <FormField
                  label="ETA (if out of stock)"
                  value={partForm.eta}
                  onChange={(e) => setPartForm({ ...partForm, eta: e.target.value })}
                  placeholder="e.g. 5/23/2026"
                />
              </div>

              <FormField
                label="Notes"
                value={partForm.notes}
                onChange={(e) => setPartForm({ ...partForm, notes: e.target.value })}
                placeholder="Any specific instructions..."
                rows={2}
              />

              <ImageUploadField
                value={partForm.imageUrl}
                onChange={(url) => setPartForm({ ...partForm, imageUrl: url })}
              />

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Saving Part…" : "Create Part"}
                </button>
              </div>
            </form>

            <CsvImport type="part" />
          </>
        )}

        {/* ── Add Device form ────────────────────────────────────────────────── */}
        {activeTab === "product" && (
          <>
            <form onSubmit={handleProductSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">

              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3">
                  <FormField
                    label="Device ID"
                    value={productForm._id}
                    onChange={(e) => setProductForm({ ...productForm, _id: e.target.value })}
                    placeholder="e.g. cd63"
                    required
                    hint="Used in URLs. No spaces."
                  />
                </div>
                <div className="md:w-2/3">
                  <FormField
                    label="Device Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. CD63"
                    required
                  />
                </div>
              </div>

              <FormField
                label="Device Category"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="e.g. Indoor Dome Camera"
                required
              />

              <ImageUploadField
                value={productForm.imageUrl}
                onChange={(url) => setProductForm({ ...productForm, imageUrl: url })}
              />

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Saving Device…" : "Create Device"}
                </button>
              </div>
            </form>

            <CsvImport type="device" />
          </>
        )}

      </div>
    </main>
  );
}
