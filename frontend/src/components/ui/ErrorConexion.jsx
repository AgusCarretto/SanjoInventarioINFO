import { RefreshCw, WifiOff } from 'lucide-react';

export default function ErrorConexion({ onReintentar }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-6">
      <WifiOff className="size-6 shrink-0 text-red-700" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-marino-900">No se pudo conectar con el servidor.</p>
        <p className="text-sm text-slate-600">
          Revisá que el backend esté en marcha (<strong>npm run start:dev</strong> en la carpeta backend) y volvé a
          intentar.
        </p>
      </div>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-marino-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
