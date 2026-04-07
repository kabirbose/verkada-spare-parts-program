interface StatusBadgeProps {
  value: string | null | undefined;
  variant: "location" | "stock";
}

function getLocationClass(value: string) {
  if (value === "Warehouse") return "bg-blue-100 text-blue-800";
  if (value === "HQ") return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-800";
}

function getStockClass(value: string) {
  if (value === "Yes") return "bg-green-100 text-green-800";
  if (value === "No") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

export default function StatusBadge({ value, variant }: StatusBadgeProps) {
  const display = value || "-";
  const colorClass = !value
    ? "bg-gray-100 text-gray-800"
    : variant === "location"
    ? getLocationClass(value)
    : getStockClass(value);

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {display}
    </span>
  );
}
