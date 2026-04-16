"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import FormActions from "@/components/ui/FormActions";
import ImageUploadField from "@/components/ui/ImageUploadField";

export default function EditPartPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [formData, setFormData] = useState({
    _id: "",
    sparePart: "",
    compatibleProduct: "",
    type: "",
    inStockStatus: "",
    eta: "",
    availableAt: "",
    notes: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parts/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server returned ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        setFormData({
          _id: data._id || id,
          sparePart: data.sparePart || "",
          compatibleProduct: data.compatibleProduct ? data.compatibleProduct.join(", ") : "",
          type: data.type || "",
          inStockStatus: data.inStockStatus || "",
          eta: data.eta || "",
          availableAt: data.availableAt || "",
          notes: data.notes || "",
          imageUrl: data.imageUrl || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        alert("Could not load part data. Check the console.");
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, ...rest } = formData;
    const payload = {
      ...rest,
      compatibleProduct: rest.compatibleProduct.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch(`/api/parts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) router.push("/");
    else alert("Failed to update spare part");
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

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  const update = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 mt-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Edit Spare Part</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3">
            <FormField label="Part ID" value={formData._id} disabled />
          </div>
          <div className="md:w-2/3">
            <FormField label="Part Name" value={formData.sparePart} onChange={update("sparePart")} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Part Type" value={formData.type} onChange={update("type")} />
          <FormField label="Stock Status" value={formData.inStockStatus} onChange={update("inStockStatus")} placeholder="e.g., In Stock, Low, Out of Stock" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <FormField label="ETA (If out of stock)" value={formData.eta} onChange={update("eta")} placeholder="e.g., 2 weeks" />
          </div>
          <div className="md:col-span-2">
            <FormField label="Compatible Devices (Comma Separated)" value={formData.compatibleProduct} onChange={update("compatibleProduct")} placeholder="e.g., Model X, Model Y" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Location / Available At" value={formData.availableAt} onChange={update("availableAt")} placeholder="e.g., Aisle 4, Bin B" />
          <FormField label="Notes" value={formData.notes} onChange={update("notes")} placeholder="Any additional info..." />
        </div>

        <ImageUploadField
          value={formData.imageUrl}
          onChange={(url) => setFormData({ ...formData, imageUrl: url })}
        />

        <FormActions onDelete={handleDelete} />
      </form>
    </div>
  );
}
