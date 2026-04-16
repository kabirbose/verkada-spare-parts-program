"use client";

import { useRef, useState } from "react";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ value, onChange }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"url" | "upload">("url");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Image must be under 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const isDataUrl = value.startsWith("data:");

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
        Part Image
      </label>

      {/* Tab switcher */}
      <div className="flex mb-2 bg-slate-100 p-0.5 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            tab === "url" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            tab === "upload" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Upload File
        </button>
      </div>

      {tab === "url" ? (
        <input
          type="url"
          value={isDataUrl ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-700 placeholder:text-slate-300"
        />
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Choose File
          </button>
          {value && (
            <span className="text-xs text-slate-500 truncate max-w-xs">
              {isDataUrl ? "Image selected" : value}
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-3 flex items-start gap-3">
          <img
            src={value}
            alt="Part preview"
            className="w-24 h-24 object-cover rounded-lg border border-slate-200 bg-slate-50"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer mt-1"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
}
