import { CircleCheck, Download } from 'lucide-react';
import { armarCsvReporteCompra, descargarCsv, nombreArchivoReporte } from '../../lib/csv.js';
import { NIVELES } from '../../lib/nivelEstilos.js';
import { porcentajeStock } from '../../lib/porcentaje.js';
import ErrorConexion from '../ui/ErrorConexion.jsx';
import NivelBadge from '../ui/NivelBadge.jsx';

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

function FilaAlerta({ item }) {
  const estilo = NIVELES[item.nivel];
  const porcentaje = porcentajeStock(item.stockActual, item.stockMinimo);
  const clasificacion = [item.categoria, item.tipo].filter(Boolean).join(', ');
  const marcaModelo = [item.marca, item.modelo].filter(Boolean).join(' ');
  return (
    <li
      className={`grid gap-x-6 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_8rem] md:items-center ${estilo.fila} ${estilo.borde}`}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-marino-900">{item.nombre}</p>
        {clasificacion && <p className="text-sm text-slate-600">{clasificacion}</p>}
        {marcaModelo && <p className="text-sm text-slate-600">{marcaModelo}</p>}
        {item.compatibilidad && (
          <p className="text-sm text-slate-600" title={item.compatibilidad}>
            Compatible con {item.compatibilidad}
          </p>
        )}
        {item.esRetornable && (
          <p className="text-sm text-slate-600">
            {plural(item.prestados, 'prestado', 'prestados')} y {plural(item.disponibles, 'disponible', 'disponibles')}
          </p>
        )}
      </div>

      <div>
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-marino-900">{item.stockActual}</span> en stock, mínimo {item.stockMinimo}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={porcentaje}
          aria-label={`Stock de ${item.nombre} respecto del mínimo`}
          className={`mt-1.5 h-2 overflow-hidden rounded-full ${estilo.pista}`}
        >
          <div className={`h-full rounded-full ${estilo.relleno}`} style={{ width: `${porcentaje}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1">
        <NivelBadge nivel={item.nivel} />
        <span className="text-sm font-medium text-slate-700">
          {item.faltante > 0 ? `Faltan ${item.faltante}` : 'En el mínimo'}
        </span>
      </div>
    </li>
  );
}

export default function AlertasStock({ datos, cargando, error, onReintentar }) {
  const items = datos?.items ?? [];
  const hayAlertas = items.length > 0;
  const subtitulo = hayAlertas
    ? `${items.length} ${items.length === 1 ? 'artículo requiere' : 'artículos requieren'} reposición`
    : 'Compara el stock actual con el mínimo de cada artículo.';

  let cuerpo;
  if (cargando) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando alertas…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={onReintentar} />;
  } else if (!hayAlertas) {
    cuerpo = (
      <div className="flex items-center gap-3 bg-emerald-50 px-5 py-6 text-emerald-900">
        <CircleCheck className="size-6 text-emerald-700" aria-hidden="true" />
        <p className="font-medium">Todo el stock está por encima del mínimo.</p>
      </div>
    );
  } else {
    cuerpo = (
      <ul className="divide-y divide-slate-200">
        {items.map((item) => (
          <FilaAlerta key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  const conAlertas = hayAlertas && !cargando && !error;
  return (
    <section aria-labelledby="titulo-alertas" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${conAlertas ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}
      >
        <div>
          <h2 id="titulo-alertas" className="text-base font-semibold text-marino-900">
            Alertas de stock
          </h2>
          <p className="text-sm text-slate-600">{cargando ? 'Cargando…' : subtitulo}</p>
        </div>
        <button
          type="button"
          disabled={!hayAlertas || cargando || Boolean(error)}
          onClick={() => descargarCsv(nombreArchivoReporte(), armarCsvReporteCompra(items))}
          title="Se descarga como archivo CSV, que se abre en Excel"
          className="inline-flex items-center gap-2 rounded-lg bg-marino-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar reporte de compra
        </button>
      </header>
      {cuerpo}
    </section>
  );
}
