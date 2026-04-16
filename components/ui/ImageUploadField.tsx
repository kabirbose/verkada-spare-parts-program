"use client";

import { useRef, useState } from "react";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
}

// Max file size before base64 encoding (3 MB → ~4 MB encoded).
// MongoDB documents support up to 16 MB, so this is well within limits.
const MAX_FILE_BYTES = 3 * 1024 * 1024;

export default function ImageUploadField({ value, onChange }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"url" | "upload">("url");

  // Convert the selected file to a base64 data URL entirely client-side.
  // This avoids writing to disk, which would trigger Next.js file-watcher
  // hot-reloads and silently wipe React state before the form could be submitted.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      alert("Image must be under 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);

    // Reset so the same file can be re-selected if needed
    e.target.value = "";
  };

  const isDataUrl = value.startsWith("data:");

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
        Image
      </label>

      {/* Tab switcher: URL entry vs. file upload */}
      <div className="flex mb-2 bg-slate-100 p-0.5 rounded-lg w-fit">
        {(["url", "upload"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              tab === t
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "url" ? "URL" : "Upload File"}
          </button>
        ))}
      </div>

      {tab === "url" ? (
        <input
          type="url"
          // Hide the raw data URL in the text box — it's thousands of characters
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

      {/* Image preview */}
      {value && (
        <div className="mt-3 flex items-start gap-3">
          <img
            src={value}
            alt="Preview"
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
