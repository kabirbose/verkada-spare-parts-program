"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

type ImportType = "device" | "part";

interface ParsedRow {
  raw: Record<string, string>;
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  succeeded: number;
  failed: Array<{ index: number; id: string; reason: string }>;
}

// ─── Config per type ──────────────────────────────────────────────────────────

const DEVICE_HEADERS = ["Device ID", "Device Name", "Device Category", "Image URL"];
const PART_HEADERS   = ["Part ID", "Part Name", "Compatible Devices", "Part Type", "Location", "Stock Status", "ETA", "Notes"];

const DEVICE_REQUIRED = DEVICE_HEADERS; // all required
const PART_REQUIRED   = ["Part ID", "Part Name", "Compatible Devices", "Part Type"];

// For update mode, only the ID is strictly required — other fields are optional patches
const DEVICE_UPDATE_REQUIRED = ["Device ID"];
const PART_UPDATE_REQUIRED   = ["Part ID"];

function buildDevicePayload(row: Record<string, string>) {
  return {
    _id:         row["Device ID"].trim().toLowerCase(),
    name:        row["Device Name"].trim(),
    description: row["Device Category"].trim(),
    imageUrl:    row["Image URL"].trim(),
  };
}

function buildDeviceUpdatePayload(row: Record<string, string>) {
  const patch: Record<string, string> = {};
  if (row["Device Name"]?.trim())     patch.name        = row["Device Name"].trim();
  if (row["Device Category"]?.trim()) patch.description = row["Device Category"].trim();
  if (row["Image URL"]?.trim())       patch.imageUrl    = row["Image URL"].trim();
  return patch;
}

function buildPartPayload(row: Record<string, string>) {
  return {
    _id:              row["Part ID"].trim(),
    sparePart:        row["Part Name"].trim(),
    compatibleProduct: (row["Compatible Devices"] || "").split(",").map((s) => s.trim()).filter(Boolean),
    type:             row["Part Type"].trim(),
    availableAt:      (row["Location"] || "").trim(),
    inStockStatus:    (row["Stock Status"] || "").trim(),
    eta:              (row["ETA"] || "").trim(),
    notes:            (row["Notes"] || "").trim(),
  };
}

function buildPartUpdatePayload(row: Record<string, string>) {
  const patch: Record<string, string | string[]> = {};
  if (row["Part Name"]?.trim())          patch.sparePart        = row["Part Name"].trim();
  if (row["Compatible Devices"]?.trim()) patch.compatibleProduct = row["Compatible Devices"].split(",").map((s) => s.trim()).filter(Boolean);
  if (row["Part Type"]?.trim())          patch.type             = row["Part Type"].trim();
  if (row["Location"]?.trim())           patch.availableAt      = row["Location"].trim();
  if (row["Stock Status"]?.trim())       patch.inStockStatus    = row["Stock Status"].trim();
  if (row["ETA"]?.trim())               patch.eta              = row["ETA"].trim();
  if (row["Notes"]?.trim())             patch.notes            = row["Notes"].trim();
  return patch;
}

const CONFIG = {
  device: {
    headers:             DEVICE_HEADERS,
    required:            DEVICE_REQUIRED,
    updateRequired:      DEVICE_UPDATE_REQUIRED,
    endpoint:            "/api/products",
    buildPayload:        buildDevicePayload,
    buildUpdatePayload:  buildDeviceUpdatePayload,
    idField:             "Device ID",
    idKey:               (row: Record<string, string>) => row["Device ID"].trim().toLowerCase(),
    label:               "device",
    exampleRows:         [["cd63", "CD63", "Indoor Dome Camera", "https://example.com/image.jpg"]],
  },
  part: {
    headers:             PART_HEADERS,
    required:            PART_REQUIRED,
    updateRequired:      PART_UPDATE_REQUIRED,
    endpoint:            "/api/parts",
    buildPayload:        buildPartPayload,
    buildUpdatePayload:  buildPartUpdatePayload,
    idField:             "Part ID",
    idKey:               (row: Record<string, string>) => row["Part ID"].trim(),
    label:               "spare part",
    // Compatible Devices uses papaparse unparse so commas in the field are quoted automatically
    exampleRows:         [["267", "CD61 Bubble", "CD61, CD62", "Bubble", "Warehouse Aisle 4", "Yes", "5/23/2026", ""]],
  },
};

// ─── Template download ────────────────────────────────────────────────────────

function downloadTemplate(type: ImportType) {
  const { headers, exampleRows } = CONFIG[type];
  const csv = Papa.unparse({ fields: headers, data: exampleRows });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${type}-import-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Row validation ───────────────────────────────────────────────────────────

function validateRow(row: Record<string, string>, required: string[]): { valid: boolean; errors: string[] } {
  const errors = required
    .filter((col) => !row[col]?.trim())
    .map((col) => `"${col}" is required`);
  return { valid: errors.length === 0, errors };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CsvImport({ type }: { type: ImportType }) {
  const cfg = CONFIG[type];

  const [isOpen,      setIsOpen]      = useState(false);
  const [importMode,  setImportMode]  = useState<"create" | "update">("create");
  const [fileName,    setFileName]    = useState("");
  const [rows,        setRows]        = useState<ParsedRow[]>([]);
  const [headerErr,   setHeaderErr]   = useState<string | null>(null);
  const [importing,   setImporting]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [result,      setResult]      = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeRequired = importMode === "update" ? cfg.updateRequired : cfg.required;

  const validRows   = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  // ── File parsing ──────────────────────────────────────────────────────────

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setHeaderErr(null);
    setResult(null);
    setProgress(0);

    Papa.parse<Record<string, string>>(file, {
      header:         true,
      skipEmptyLines: true,
      complete(parsed: Papa.ParseResult<Record<string, string>>) {
        // Validate that all expected columns are present
        const fileHeaders = parsed.meta.fields ?? [];
        const missing = cfg.headers.filter((h) => !fileHeaders.includes(h));
        if (missing.length > 0) {
          setHeaderErr(`Missing columns: ${missing.join(", ")}`);
          return;
        }

        const parsed_rows: ParsedRow[] = (parsed.data as Record<string, string>[]).map((raw) => {
          const { valid, errors } = validateRow(raw, activeRequired);
          return { raw, valid, errors };
        });
        setRows(parsed_rows);
      },
    });

    // Reset the file input so the same file can be re-selected
    e.target.value = "";
  }

  // ── Import ────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    let succeeded = 0;
    const failed: ImportResult["failed"] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row    = validRows[i];
      const rowId  = cfg.idKey(row.raw);
      const dispId = row.raw[cfg.idField] || `row ${i + 1}`;
      try {
        const isUpdate = importMode === "update";
        const url      = isUpdate ? `${cfg.endpoint}/${rowId}` : cfg.endpoint;
        const payload  = isUpdate ? cfg.buildUpdatePayload(row.raw) : cfg.buildPayload(row.raw);
        const res = await fetch(url, {
          method:  isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (res.ok) {
          succeeded++;
        } else {
          const data = await res.json().catch(() => ({}));
          const reason = isUpdate && res.status === 404
            ? `ID "${rowId}" not found`
            : (data.error || `HTTP ${res.status}`);
          failed.push({ index: i + 1, id: dispId, reason });
        }
      } catch {
        failed.push({ index: i + 1, id: dispId, reason: "Network error" });
      }
      setProgress(i + 1);
    }

    setResult({ succeeded, failed });
    setImporting(false);
    setRows([]);
    setFileName("");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mt-6">
      {/* Toggle */}
      <button
        type="button"
        onClick={() => { setIsOpen((o) => !o); setResult(null); setRows([]); setFileName(""); setHeaderErr(null); setImportMode("create"); }}
        className="w-full flex items-center justify-between px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Bulk Import via CSV
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">

          {/* Mode Toggle */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Import Mode</p>
            <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner">
              {(["create", "update"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setImportMode(mode);
                    setRows([]);
                    setFileName("");
                    setHeaderErr(null);
                    setResult(null);
                  }}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                    importMode === mode
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {mode === "create" ? "Create New" : "Update Existing"}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {importMode === "create"
                ? `All required fields must be present. Rows with existing IDs will fail.`
                : `Matches rows by ${cfg.idField}. Only non-empty fields will be overwritten.`}
            </p>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">CSV Template</p>
              <p className="text-xs text-slate-400 mt-0.5">Download the template to see the required column structure.</p>
            </div>
            <button
              type="button"
              onClick={() => downloadTemplate(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>

          {/* File picker */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-slate-500">
                {fileName ? fileName : "Click to choose a CSV file"}
              </span>
              {fileName && <span className="text-xs text-slate-400">Click to choose a different file</span>}
            </button>
          </div>

          {/* Header error */}
          {headerErr && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-medium">
              {headerErr}
              <p className="mt-1 text-xs font-normal text-red-500">
                Required columns: {cfg.headers.join(", ")}
              </p>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preview — {rows.length} row{rows.length !== 1 ? "s" : ""} &nbsp;
                  <span className="text-green-600">{validRows.length} valid</span>
                  {invalidRows.length > 0 && <span className="text-red-500"> · {invalidRows.length} invalid</span>}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider w-8">#</th>
                        {cfg.headers.map((h) => (
                          <th key={h} className="px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                        <th className="px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={i} className={row.valid ? "hover:bg-slate-50" : "bg-red-50/40 hover:bg-red-50"}>
                          <td className="px-3 py-2 text-slate-400 font-medium">{i + 1}</td>
                          {cfg.headers.map((h) => (
                            <td key={h} className="px-3 py-2 text-slate-700 max-w-[10rem] truncate" title={row.raw[h]}>
                              {row.raw[h] || <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.valid ? (
                              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium" title={row.errors.join("; ")}>
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {row.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import button + progress */}
          {validRows.length > 0 && (
            <div>
              {importing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Importing…</span>
                    <span>{progress} / {validRows.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(progress / validRows.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer text-sm"
                >
                  {importMode === "update" ? "Update" : "Import"} {validRows.length} {cfg.label}{validRows.length !== 1 ? "s" : ""}
                  {invalidRows.length > 0 && ` (${invalidRows.length} invalid row${invalidRows.length !== 1 ? "s" : ""} will be skipped)`}
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className={`p-4 rounded-xl border text-sm ${result.failed.length === 0 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
              <p className="font-semibold text-slate-800">
                {result.succeeded > 0 && (
                  <span className="text-emerald-700">
                    {result.succeeded} {cfg.label}{result.succeeded !== 1 ? "s" : ""} {importMode === "update" ? "updated" : "imported"} successfully.{" "}
                  </span>
                )}
                {result.failed.length > 0 && (
                  <span className="text-amber-700">{result.failed.length} failed.</span>
                )}
              </p>
              {result.failed.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.failed.map((f) => (
                    <li key={f.index} className="text-xs text-amber-700">
                      Row {f.index} ({f.id}): {f.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
