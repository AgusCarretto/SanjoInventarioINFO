import { useState } from 'react';
import { apiSend } from '../../lib/api.js';
import Aviso from '../ui/Aviso.jsx';
import Dialogo from '../ui/Dialogo.jsx';

export default function ConfirmarEliminarEquipo({ equipo, alEliminar, alCerrar }) {
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  async function confirmar() {
    setError(null);
    setEliminando(true);
    try {
      await apiSend('DELETE', `/red/equipos/${equipo.id}`);
      alEliminar();
    } catch (fallo) {
      setError(fallo.message);
      setEliminando(false);
    }
  }

  return (
    <Dialogo titulo="Eliminar equipo" alCerrar={alCerrar}>
      <div className="space-y-4 px-5 py-5">
        <p>
          Vas a eliminar <strong>{equipo.nombre}</strong> ({equipo.ip}). Esta acción no se puede deshacer.
        </p>
        {error && (
          <Aviso>
            <p>{error}</p>
          </Aviso>
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
