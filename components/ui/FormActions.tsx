import Link from "next/link";

interface FormActionsProps {
  onDelete: () => void;
}

export default function FormActions({ onDelete }: FormActionsProps) {
  return (
    <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
      <div className="flex gap-3">
        <button
          type="submit"
          className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Save Changes
        </button>
        <Link
          href="/"
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="cursor-pointer px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 font-medium rounded-lg transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
