"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import FormActions from "@/components/ui/FormActions";
import ImageUploadField from "@/components/ui/ImageUploadField";

interface ProductFormData {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: ProductFormData = { _id: "", name: "", description: "", imageUrl: "" };

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router     = useRouter();
  const { id }     = use(params);
  const [form, setForm]       = useState<ProductFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  // ── Load device data ────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setForm({
          _id:         data._id || id,
          name:        data.name || "",
          description: data.description || "",
          imageUrl:    data.imageUrl || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load device:", err);
        alert("Could not load device data. Check the console.");
        setLoading(false);
      });
  }, [id]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const update =
    (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, ...payload } = form;
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      console.error("Error deleting device:", err);
      alert("An error occurred while deleting.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 mt-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Edit Device</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="flex gap-4">
          <div className="w-1/3">
            <FormField label="Device ID" value={form._id} disabled />
          </div>
          <div className="w-2/3">
            <FormField label="Device Name" value={form.name} onChange={update("name")} required />
          </div>
        </div>

        <FormField
          label="Device Category"
          value={form.description}
          onChange={update("description")}
          required
        />

        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
        />

        <FormActions onDelete={handleDelete} />
      </form>
    </div>
  );
}
