import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Search } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ErrorConexion from '../components/ui/ErrorConexion.jsx';
import { useApi } from '../hooks/useApi.js';

function SinDato() {
  return <span className="text-slate-500">—</span>;
}

const TIPOS = {
  ENTRADA: { Icono: ArrowDownCircle, clase: 'bg-emerald-100 text-emerald-800', etiqueta: 'Entrada' },
  SALIDA: { Icono: ArrowUpCircle, clase: 'bg-amber-100 text-amber-800', etiqueta: 'Salida' },
  DEVOLUCION: { Icono: RotateCcw, clase: 'bg-marino-100 text-marino-800', etiqueta: 'Devolución' },
};

function BadgeTipo({ tipo }) {
  const { Icono, clase, etiqueta } = TIPOS[tipo];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${clase}`}>
      <Icono className="size-3.5" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

function fechaLegible(iso) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function coincide(movimiento, texto) {
  const buscado = texto.trim().toLocaleLowerCase('es');
  if (buscado === '') return true;
  return [movimiento.articulo?.nombre, movimiento.articulo?.modelo, movimiento.detalle].some((campo) =>
    campo?.toLocaleLowerCase('es').includes(buscado),
  );
}

function FilaMovimiento({ movimiento }) {
  const marcaModelo = [movimiento.articulo?.marca, movimiento.articulo?.modelo].filter(Boolean).join(' ');
  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-3 text-slate-700">{fechaLegible(movimiento.fecha)}</td>
      <td className="px-3 py-3">
        <p className="font-medium text-marino-900">{movimiento.articulo?.nombre}</p>
        {marcaModelo && <p className="text-slate-600">{marcaModelo}</p>}
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <BadgeTipo tipo={movimiento.tipo} />
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums font-semibold text-marino-900">
        {movimiento.cantidad}
      </td>
      <td className="px-3 py-3 text-slate-700">{movimiento.detalle ?? <SinDato />}</td>
    </tr>
  );
}

export default function Movimientos() {
  const { data, error, loading, reload } = useApi('/movimientos');
  const [filtro, setFiltro] = useState('');

  const filtrados = (data ?? []).filter((m) => coincide(m, filtro));

  let cuerpo;
  if (loading) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando movimientos…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={reload} />;
  } else if (filtrados.length === 0) {
    cuerpo = (
      <p className="px-5 py-8 text-sm text-slate-600">
        {data?.length === 0
          ? 'Todavía no hay movimientos registrados.'
          : 'No se encontraron movimientos con ese filtro.'}
      </p>
    );
  } else {
    cuerpo = (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left font-medium text-slate-600">
            <tr>
              <th scope="col" className="px-3 py-3">Fecha</th>
              <th scope="col" className="px-3 py-3">Artículo</th>
              <th scope="col" className="px-3 py-3">Tipo</th>
              <th scope="col" className="px-3 py-3 text-right">Cantidad</th>
              <th scope="col" className="px-3 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtrados.map((m) => (
              <FilaMovimiento key={m.id} movimiento={m} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <PageHeader titulo="Movimientos" descripcion="Historial de entradas y salidas de stock." />
      <div className="mb-4">
        <label htmlFor="movimientos-filtro" className="mb-1 block text-sm font-medium text-marino-900">
          Buscar por artículo, modelo o detalle
        </label>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="movimientos-filtro"
            type="text"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            placeholder="Ej: tóner, 26A, Secretaría…"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{cuerpo}</div>
    </>
  );
}
