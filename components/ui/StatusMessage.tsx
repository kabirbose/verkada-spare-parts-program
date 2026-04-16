interface StatusMessageProps {
  type: "success" | "error" | "";
  message: string;
}

// Inline banner shown after form submission (success or error).
export default function StatusMessage({ type, message }: StatusMessageProps) {
  if (!message) return null;

  const colorClass =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-red-50 text-red-700 border-red-100";

  return (
    <div className={`p-4 mb-8 rounded-xl text-sm font-semibold border ${colorClass}`}>
      {message}
    </div>
  );
}
