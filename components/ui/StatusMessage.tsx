interface StatusMessageProps {
  type: "success" | "error" | "";
  message: string;
}

export default function StatusMessage({ type, message }: StatusMessageProps) {
  if (!message) return null;
  return (
    <div
      className={`p-4 rounded-xl mb-8 text-sm font-semibold border ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-red-50 text-red-700 border-red-100"
      }`}
    >
      {message}
    </div>
  );
}
