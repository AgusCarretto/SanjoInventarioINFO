import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { apiSend } from '../../lib/api.js';
import Aviso from '../ui/Aviso.jsx';
import Dialogo from '../ui/Dialogo.jsx';

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30 disabled:bg-slate-100 disabled:text-slate-500';

function Campo({ id, etiqueta, ayuda, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-marino-900">
        {etiqueta}
      </label>
      {children}
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-sm text-slate-600">
          {ayuda}
        </p>
      )}
    </div>
  );
}

/** Solo retornables con algo disponible para prestar ahora mismo. */
function articulosPrestables(articulos) {
  return (articulos ?? []).filter((a) => a.esRetornable === true && (a.stockActual ?? 0) > 0);
}

export default function NuevoPrestamoModal({ alGuardar, alCerrar }) {
  const catalogo = useApi('/articulos');
  const disponibles = articulosPrestables(catalogo.data);
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [prestadoA, setPrestadoA] = useState('');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const elegido = disponibles.find((a) => String(a.id) === articuloId);

  async function enviar(evento) {
    evento.preventDefault();
    if (articuloId === '') {
      setError('Elegí un artículo.');
      return;
    }
    if (prestadoA.trim() === '') {
      setError('Decí a quién se le presta.');
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await apiSend('POST', '/prestamos', {
        articuloId: Number(articuloId),
        cantidad: Number(cantidad) || 1,
        prestadoA: prestadoA.trim(),
      });
      alGuardar();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <Dialogo titulo="Nuevo préstamo" alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate>
        <div className="space-y-4 px-5 py-5">
          <Campo id="prestamo-articulo" etiqueta="Artículo">
            {catalogo.loading ? (
              <p className="text-sm text-slate-600">Cargando artículos…</p>
            ) : disponibles.length === 0 ? (
              <p className="text-sm text-slate-600">No hay artículos retornables con stock disponible.</p>
            ) : (
              <select
                id="prestamo-articulo"
                data-foco-inicial
                value={articuloId}
                onChange={(e) => {
                  setArticuloId(e.target.value);
                  setCantidad('1');
                }}
                className={CLASE_CAMPO}
              >
                <option value="">Elegir…</option>
                {disponibles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {[a.nombre, a.marca, a.modelo].filter(Boolean).join(' ')} — {a.stockActual} disponible
                    {a.stockActual === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            )}
          </Campo>

          <Campo id="prestamo-cantidad" etiqueta="Cantidad">
            <input
              id="prestamo-cantidad"
              type="number"
              inputMode="numeric"
              min="1"
              max={elegido?.stockActual ?? undefined}
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={!elegido}
              className={CLASE_CAMPO}
            />
          </Campo>

          <Campo id="prestamo-a" etiqueta="Prestado a" ayuda="Docente, curso o área, por ejemplo «Prof. Gómez - 3° B».">
            <input
              id="prestamo-a"
              type="text"
              value={prestadoA}
              onChange={(e) => setPrestadoA(e.target.value)}
              maxLength={120}
              autoComplete="off"
              aria-describedby="prestamo-a-ayuda"
              className={CLASE_CAMPO}
            />
          </Campo>

          {error && (
            <Aviso>
              <p>{error}</p>
            </Aviso>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-marino-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !elegido}
            className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {guardando ? 'Guardando…' : 'Prestar'}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
