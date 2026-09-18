import { CircleCheck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ErrorConexion from '../components/ui/ErrorConexion.jsx';
import NivelBadge from '../components/ui/NivelBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { NIVELES } from '../lib/nivelEstilos.js';

// tabular-nums solo en columnas de números, para que se alineen en vertical.
const COLUMNA_NUMERICA = 'px-4 py-3 text-right tabular-nums';

function NoAplica() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">No aplica</span>
    </>
  );
}

function FilaArticulo({ articulo }) {
  const estilo = NIVELES[articulo.nivel];
  return (
    <tr className={estilo?.fila ?? ''}>
      <td className={`px-4 py-3 font-medium text-marino-900 ${estilo?.borde ?? 'border-l-4 border-transparent'}`}>
        {articulo.nombre}
      </td>
      <td className="px-4 py-3 text-slate-700">{articulo.categoria}</td>
      <td className="px-4 py-3 text-slate-700">{articulo.esRetornable ? 'Retornable' : 'Consumible'}</td>
      <td className={`${COLUMNA_NUMERICA} font-semibold text-marino-900`}>{articulo.stockActual}</td>
      <td className={`${COLUMNA_NUMERICA} text-slate-700`}>{articulo.stockMinimo}</td>
      <td className={`${COLUMNA_NUMERICA} text-slate-700`}>
        {articulo.esRetornable ? articulo.prestados : <NoAplica />}
      </td>
      <td className={`${COLUMNA_NUMERICA} text-slate-700`}>
        {articulo.esRetornable ? articulo.disponibles : <NoAplica />}
      </td>
      <td className="px-4 py-3">
        {articulo.nivel ? (
          <NivelBadge nivel={articulo.nivel} />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            En orden
          </span>
        )}
      </td>
    </tr>
  );
}

export default function Articulos() {
  const { data, error, loading, reload } = useApi('/articulos');

  let cuerpo;
  if (loading) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando artículos…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={reload} />;
  } else if (data.length === 0) {
    cuerpo = (
      <p className="px-5 py-8 text-sm text-slate-600">
        Todavía no hay artículos cargados. Para ver datos de ejemplo, ejecutá <strong>npm run seed</strong> en la
        carpeta backend.
      </p>
    );
  } else {
    cuerpo = (
      // `relative` contiene los textos sr-only (absolutos) dentro del scroll horizontal.
      <div className="relative overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left font-medium text-slate-600">
            <tr>
              <th scope="col" className="border-l-4 border-transparent px-4 py-3">Artículo</th>
              <th scope="col" className="px-4 py-3">Categoría</th>
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-4 py-3 text-right">Stock</th>
              <th scope="col" className="px-4 py-3 text-right">Mínimo</th>
              <th scope="col" className="px-4 py-3 text-right">Prestados</th>
              <th scope="col" className="px-4 py-3 text-right">Disponibles</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((articulo) => (
              <FilaArticulo key={articulo.id} articulo={articulo} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Artículos"
        descripcion="Stock total del colegio, lo que está prestado y lo que queda disponible."
      />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{cuerpo}</div>
    </>
  );
}
