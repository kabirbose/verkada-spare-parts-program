"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import FormActions from "@/components/ui/FormActions";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [formData, setFormData] = useState({ _id: "", name: "", description: "", imageUrl: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
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
          name: data.name || "",
          description: data.description || "",
          imageUrl: data.imageUrl || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        alert("Could not load device data. Check the console.");
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, ...updatePayload } = formData;
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) router.push("/");
    else alert("Failed to update device.");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this device?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/");
      else alert("Failed to delete device. Please try again.");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("An error occurred while deleting.");
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  const update = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 mt-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Edit Device</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="flex gap-4">
          <div className="w-1/3">
            <FormField label="Device ID" value={formData._id} disabled />
          </div>
          <div className="w-2/3">
            <FormField label="Device Name" value={formData.name} onChange={update("name")} required />
          </div>
        </div>

        <FormField label="Device Category" value={formData.description} onChange={update("description")} required />

        {/* Image Input and Preview */}
        <div className="flex gap-4 items-start">
          <div className="flex-grow">
            <FormField label="Image URL" value={formData.imageUrl} onChange={update("imageUrl")} required />
          </div>
          {formData.imageUrl && (
            <div className="shrink-0 w-24 h-24 mt-5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-1 overflow-hidden">
              <img src={formData.imageUrl} alt="Preview" className="max-h-full max-w-full object-contain mix-blend-multiply" />
            </div>
          )}
        </div>

        <FormActions onDelete={handleDelete} />
      </form>
    </div>
  );
}
