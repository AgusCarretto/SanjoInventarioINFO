import { ChevronRight, PackageMinus } from 'lucide-react';

/** Cartel clickable que abre el modal de registrar uso de stock. */
export default function UsarStockCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-marino-300 hover:bg-marino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-marino-50 text-marino-700">
        <PackageMinus className="size-6" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-marino-900">Registrar uso de stock</span>
        <span className="block text-sm text-slate-600">Buscá un artículo por nombre, modelo o compatibilidad y descontá una unidad.</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  );
}
