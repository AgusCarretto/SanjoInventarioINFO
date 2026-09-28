import { useState } from 'react';
import { Loader2, PackagePlus, Search } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { apiSend } from '../../lib/api.js';
import { filtrarArticulos } from '../../lib/filtrarArticulos.js';
import { NIVELES } from '../../lib/nivelEstilos.js';
import { elegibilidadParaReponer } from '../../lib/reponerArticulo.js';
import Dialogo from '../ui/Dialogo.jsx';
import ErrorConexion from '../ui/ErrorConexion.jsx';
import NivelBadge from '../ui/NivelBadge.jsx';

function FilaArticuloReponer({ articulo, procesando, error, detalleAbierto, alAbrirDetalle, alReponer }) {
  const estilo = NIVELES[articulo.nivel];
  const clasificacion = [articulo.categoria, articulo.tipo].filter(Boolean).join(', ');
  const marcaModelo = [articulo.marca, articulo.modelo].filter(Boolean).join(' ');
  const elegibilidad = elegibilidadParaReponer(articulo);
  const [cantidad, setCantidad] = useState('1');
  const [detalle, setDetalle] = useState('');

  return (
    <li className={`px-5 py-4 ${estilo?.fila ?? ''} ${estilo?.borde ?? 'border-l-4 border-transparent'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-marino-900">{articulo.nombre}</p>
          {clasificacion && <p className="text-sm text-slate-600">{clasificacion}</p>}
          {marcaModelo && <p className="text-sm text-slate-600">{marcaModelo}</p>}
          {articulo.paraQuienes && <p className="text-sm text-slate-600">Para {articulo.paraQuienes}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-marino-900">{articulo.stockActual ?? '—'}</span> en stock
            </p>
            {articulo.nivel && <NivelBadge nivel={articulo.nivel} />}
          </div>
          {elegibilidad.puede ? (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(evento) => setCantidad(evento.target.value)}
                  aria-label={`Cantidad a reponer de ${articulo.nombre}`}
                  className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-marino-900 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30"
                />
                <button
                  type="button"
                  onClick={() => alReponer(articulo.id, Number(cantidad) || 1, null)}
                  disabled={procesando}
                  className="inline-flex items-center gap-2 rounded-lg bg-marino-950 px-3 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {procesando ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <PackagePlus className="size-4" aria-hidden="true" />
                  )}
                  Reponer
                </button>
              </div>
              <button
                type="button"
                onClick={() => alAbrirDetalle(detalleAbierto ? null : articulo.id)}
                className="text-xs font-medium text-marino-700 underline-offset-2 hover:underline"
              >
                {detalleAbierto ? 'Cancelar detalle' : '+ Detalle'}
              </button>
              {detalleAbierto && (
                <input
                  type="text"
                  value={detalle}
                  onChange={(evento) => setDetalle(evento.target.value)}
                  placeholder="Ej: Factura 123"
                  autoFocus
                  className="w-48 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30"
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') alReponer(articulo.id, Number(cantidad) || 1, detalle);
                  }}
                />
              )}
              {detalleAbierto && (
                <button
                  type="button"
                  onClick={() => alReponer(articulo.id, Number(cantidad) || 1, detalle)}
                  disabled={procesando}
                  className="rounded-lg border border-marino-600 px-2.5 py-1.5 text-sm font-medium text-marino-800 hover:bg-marino-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reponer con detalle
                </button>
              )}
            </div>
          ) : (
            <p className="max-w-40 shrink-0 text-right text-sm text-slate-500">{elegibilidad.motivo}</p>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}

/**
 * Busca un artículo consumible y suma stock (registra un movimiento de
 * ENTRADA), por ejemplo al llegar una compra. Simétrico a UsarArticuloModal.
 */
export default function ReponerArticuloModal({ alCerrar }) {
  const { data, error, loading, reload } = useApi('/articulos');
  const [filtro, setFiltro] = useState('');
  const [enCurso, setEnCurso] = useState(() => new Set());
  const [erroresPorFila, setErroresPorFila] = useState({});
  const [detalleAbiertoPara, setDetalleAbiertoPara] = useState(null);

  const filtrados = filtrarArticulos(data ?? [], filtro);

  async function reponer(articuloId, cantidad, detalle) {
    setEnCurso((previos) => new Set(previos).add(articuloId));
    setErroresPorFila((previos) => {
      const { [articuloId]: _omitido, ...resto } = previos;
      return resto;
    });
    try {
      await apiSend('POST', '/movimientos', { articuloId, tipo: 'ENTRADA', cantidad, detalle: detalle || null });
      setDetalleAbiertoPara(null);
      reload();
    } catch (fallo) {
      setErroresPorFila((previos) => ({ ...previos, [articuloId]: fallo.message }));
    } finally {
      setEnCurso((previos) => {
        const copia = new Set(previos);
        copia.delete(articuloId);
        return copia;
      });
    }
  }

  let cuerpo;
  if (loading) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando artículos…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={reload} />;
  } else if (filtrados.length === 0) {
    cuerpo = (
      <p className="px-5 py-8 text-sm text-slate-600">
        {filtro.trim() === '' ? 'Todavía no hay artículos cargados.' : 'No se encontraron artículos con ese filtro.'}
      </p>
    );
  } else {
    cuerpo = (
      <ul className="max-h-96 divide-y divide-slate-200 overflow-y-auto">
        {filtrados.map((articulo) => (
          <FilaArticuloReponer
            key={articulo.id}
            articulo={articulo}
            procesando={enCurso.has(articulo.id)}
            error={erroresPorFila[articulo.id]}
            detalleAbierto={detalleAbiertoPara === articulo.id}
            alAbrirDetalle={setDetalleAbiertoPara}
            alReponer={reponer}
          />
        ))}
      </ul>
    );
  }

  return (
    <Dialogo titulo="Reponer stock" alCerrar={alCerrar} ancho="ancho">
      <div className="border-b border-slate-200 px-5 py-4">
        <label htmlFor="reponer-filtro" className="mb-1 block text-sm font-medium text-marino-900">
          Buscar por nombre, modelo, compatibilidad o a quién le sirve
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="reponer-filtro"
            data-foco-inicial
            type="text"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            placeholder="Ej: tóner, 26A, LaserJet…"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30"
          />
        </div>
      </div>
      {cuerpo}
      <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
        <button
          type="button"
          onClick={alCerrar}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-marino-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
        >
          Cerrar
        </button>
      </div>
    </Dialogo>
  );
}
