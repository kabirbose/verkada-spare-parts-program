"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import FormActions from "@/components/ui/FormActions";
import ImageUploadField from "@/components/ui/ImageUploadField";

// Shape of the edit form — compatibleProduct is a comma-separated string here,
// converted to/from an array when talking to the API.
interface PartFormData {
  _id: string;
  sparePart: string;
  compatibleProduct: string;
  type: string;
  inStockStatus: string;
  eta: string;
  availableAt: string;
  notes: string;
  imageUrl: string;
}

const EMPTY_FORM: PartFormData = {
  _id: "", sparePart: "", compatibleProduct: "", type: "",
  inStockStatus: "", eta: "", availableAt: "", notes: "", imageUrl: "",
};

export default function EditPartPage({ params }: { params: Promise<{ id: string }> }) {
  const router     = useRouter();
  const { id }     = use(params);
  const [form, setForm]       = useState<PartFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  // ── Load part data ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/parts/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setForm({
          _id:              data._id || id,
          sparePart:        data.sparePart || "",
          compatibleProduct: (data.compatibleProduct ?? []).join(", "),
          type:             data.type || "",
          inStockStatus:    data.inStockStatus || "",
          eta:              data.eta || "",
          availableAt:      data.availableAt || "",
          notes:            data.notes || "",
          imageUrl:         data.imageUrl || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load part:", err);
        alert("Could not load part data. Check the console.");
        setLoading(false);
      });
  }, [id]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Returns an onChange handler for a given form field
  const update =
    (field: keyof PartFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, compatibleProduct, ...rest } = form;
    const payload = {
      ...rest,
      compatibleProduct: compatibleProduct.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch(`/api/parts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push("/");
    else alert("Failed to update spare part.");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this spare part?")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/");
      else alert("Failed to delete part. Please try again.");
    } catch (err) {
      console.error("Error deleting part:", err);
      alert("An error occurred while deleting.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 mt-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Edit Spare Part</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3">
            <FormField label="Part ID" value={form._id} disabled />
          </div>
          <div className="md:w-2/3">
            <FormField label="Part Name" value={form.sparePart} onChange={update("sparePart")} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Part Type" value={form.type} onChange={update("type")} />
          <FormField
            label="Stock Status"
            value={form.inStockStatus}
            onChange={update("inStockStatus")}
            placeholder="e.g. In Stock, Low, Out of Stock"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <FormField label="ETA (if out of stock)" value={form.eta} onChange={update("eta")} placeholder="e.g. 2 weeks" />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Compatible Devices (comma-separated)"
              value={form.compatibleProduct}
              onChange={update("compatibleProduct")}
              placeholder="e.g. Model X, Model Y"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Location / Available At" value={form.availableAt} onChange={update("availableAt")} placeholder="e.g. Aisle 4, Bin B" />
          <FormField label="Notes" value={form.notes} onChange={update("notes")} placeholder="Any additional info..." />
        </div>

        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
        />

        <FormActions onDelete={handleDelete} />
      </form>
    </div>
  );
}
