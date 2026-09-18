import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { apiSend } from '../../lib/api.js';
import Dialogo from '../ui/Dialogo.jsx';

export default function ConfirmarEliminar({ articulo, alEliminar, alCerrar }) {
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  async function confirmar() {
    setError(null);
    setEliminando(true);
    try {
      await apiSend('DELETE', `/articulos/${articulo.id}`);
      alEliminar();
    } catch (fallo) {
      setError(fallo.message);
      setEliminando(false);
    }
  }

  return (
    <Dialogo titulo="Eliminar artículo" alCerrar={alCerrar}>
      <div className="space-y-4 px-5 py-5">
        <p>
          Vas a eliminar <strong>{articulo.nombre}</strong>. Esta acción no se puede deshacer.
        </p>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
        <button
          type="button"
          data-foco-inicial
          onClick={alCerrar}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-marino-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={eliminando}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {eliminando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </Dialogo>
  );
}
