import { ChevronRight, PackagePlus } from 'lucide-react';

/** Cartel clickable que abre el modal de reponer stock (entrada, ej. una compra). */
export default function ReponerStockCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-marino-300 hover:bg-marino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-marino-50 text-marino-700">
        <PackagePlus className="size-6" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-marino-900">Reponer stock</span>
        <span className="block text-sm text-slate-600">Buscá un artículo y sumale stock, por ejemplo al llegar una compra.</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  );
}
