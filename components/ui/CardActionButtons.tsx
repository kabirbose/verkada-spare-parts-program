import React from "react";

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface CardActionButtonsProps {
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  editLabel?: string;
  deleteLabel?: string;
  withBackground?: boolean;
}

export default function CardActionButtons({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  withBackground = false,
}: CardActionButtonsProps) {
  const base = "p-2 rounded-md transition-colors cursor-pointer";
  const bg = withBackground ? "bg-white/80 backdrop-blur-sm shadow-sm" : "";

  return (
    <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 sm:opacity-100">
      <button
        onClick={onEdit}
        className={`${base} ${bg} text-gray-400 hover:text-blue-600 hover:bg-blue-50`}
        title={editLabel}
      >
        <EditIcon />
      </button>
      <button
        onClick={onDelete}
        className={`${base} ${bg} text-gray-400 hover:text-red-600 hover:bg-red-50`}
        title={deleteLabel}
      >
        <TrashIcon />
      </button>
    </div>
  );
}
