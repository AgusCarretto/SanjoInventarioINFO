import { useState } from 'react';
import { apiSend } from '../../lib/api.js';
import Aviso from '../ui/Aviso.jsx';
import Dialogo from '../ui/Dialogo.jsx';

export default function ConfirmarDevolver({ prestamo, alDevolver, alCerrar }) {
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      await apiSend('PATCH', `/prestamos/${prestamo.id}/devolver`);
      alDevolver();
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  }

  return (
    <Dialogo titulo="Registrar devolución" alCerrar={alCerrar}>
      <div className="space-y-4 px-5 py-5">
        <p>
          Vas a marcar como devuelto <strong>{prestamo.articulo.nombre}</strong> ({prestamo.prestadoA}). Va a sumarse
          de vuelta al stock disponible.
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
          disabled={enviando}
          className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {enviando ? 'Guardando…' : 'Devolver'}
        </button>
      </div>
    </Dialogo>
  );
}
