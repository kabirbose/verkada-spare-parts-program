import React from "react";

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  hint?: string;
  rows?: number;
}

const inputClass =
  "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg " +
  "focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 " +
  "outline-none transition-all text-slate-700 placeholder:text-slate-300";

const disabledClass =
  "w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg " +
  "text-slate-400 cursor-not-allowed outline-none";

export default function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  type = "text",
  hint,
  rows,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
        {label}
      </label>

      {rows ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          // Tooltip clarifies why IDs are locked after creation
          title={disabled ? "This ID cannot be changed after creation." : undefined}
          className={disabled ? disabledClass : inputClass}
        />
      )}

      {hint && (
        <p className="text-xs text-slate-400 mt-1.5 font-medium">{hint}</p>
      )}
    </div>
  );
}
