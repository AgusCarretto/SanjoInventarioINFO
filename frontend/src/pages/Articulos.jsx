import { useMemo, useState } from 'react';
import { CircleCheck, CircleHelp, Pencil, Plus, Trash2 } from 'lucide-react';
import ConfirmarEliminar from '../components/articulos/ConfirmarEliminar.jsx';
import FormularioArticulo from '../components/articulos/FormularioArticulo.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ErrorConexion from '../components/ui/ErrorConexion.jsx';
import NivelBadge from '../components/ui/NivelBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { NIVELES } from '../lib/nivelEstilos.js';

// tabular-nums solo en columnas de números, para que se alineen en vertical.
const COLUMNA_NUMERICA = 'whitespace-nowrap px-3 py-3 text-right tabular-nums';
// Acciones solo con ícono para que la tabla entre sin scroll; el nombre accesible va en aria-label.
const CLASE_ACCION =
  'inline-flex size-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2';

function NoAplica() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">No aplica</span>
    </>
  );
}

function SinDato({ texto = 'Sin dato' }) {
  return <span className="text-slate-500">{texto}</span>;
}

function EstadoArticulo({ articulo }) {
  if (articulo.nivel) return <NivelBadge nivel={articulo.nivel} />;
  if (articulo.stockActual === null || articulo.stockMinimo === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <CircleHelp className="size-3.5" aria-hidden="true" />
        Sin dato de stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
      <CircleCheck className="size-3.5" aria-hidden="true" />
      En orden
    </span>
  );
}

function FilaArticulo({ articulo, alEditar, alEliminar }) {
  const estilo = NIVELES[articulo.nivel];
  const retornable = articulo.esRetornable === true;
  let tipo = <SinDato texto="Sin definir" />;
  if (articulo.esRetornable !== null) tipo = articulo.esRetornable ? 'Retornable' : 'Consumible';

  return (
    <tr className={estilo?.fila ?? ''}>
      <td className={`min-w-40 px-3 py-3 font-medium text-marino-900 ${estilo?.borde ?? 'border-l-4 border-transparent'}`}>
        {articulo.nombre}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-700">
        {articulo.categoria ?? <SinDato texto="Sin categoría" />}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-700">{tipo}</td>
      <td className={`${COLUMNA_NUMERICA} font-semibold text-marino-900`}>{articulo.stockActual ?? <SinDato />}</td>
      <td className={`${COLUMNA_NUMERICA} text-slate-700`}>{articulo.stockMinimo ?? <SinDato />}</td>
      <td className={`${COLUMNA_NUMERICA} text-slate-700`}>{retornable ? articulo.prestados : <NoAplica />}</td>
      <td className={`${COLUMNA_NUMERICA} text-slate-700`}>
        {retornable ? (articulo.disponibles ?? <SinDato />) : <NoAplica />}
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <EstadoArticulo articulo={articulo} />
      </td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => alEditar(articulo)}
            aria-label={`Editar ${articulo.nombre}`}
            title="Editar"
            className={`${CLASE_ACCION} text-marino-700 hover:bg-marino-50 focus-visible:ring-marino-600`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => alEliminar(articulo)}
            aria-label={`Eliminar ${articulo.nombre}`}
            title="Eliminar"
            className={`${CLASE_ACCION} text-red-700 hover:bg-red-50 focus-visible:ring-red-700`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Articulos() {
  const { data, error, loading, reload } = useApi('/articulos');
  const [dialogo, setDialogo] = useState(null);

  const categorias = useMemo(
    () => [...new Set((data ?? []).map((a) => a.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [data],
  );

  const cerrarDialogo = () => setDialogo(null);
  const terminar = () => {
    setDialogo(null);
    reload();
  };

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
        Todavía no hay artículos cargados. Cargá el primero con <strong>Nuevo artículo</strong>.
      </p>
    );
  } else {
    cuerpo = (
      // `relative` contiene los textos sr-only (absolutos) dentro del scroll horizontal.
      <div className="relative overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left font-medium text-slate-600">
            <tr>
              <th scope="col" className="border-l-4 border-transparent px-3 py-3">Artículo</th>
              <th scope="col" className="px-3 py-3">Categoría</th>
              <th scope="col" className="px-3 py-3">Tipo</th>
              <th scope="col" className="px-3 py-3 text-right">Stock</th>
              <th scope="col" className="px-3 py-3 text-right">Mínimo</th>
              <th scope="col" className="px-3 py-3 text-right">Prestados</th>
              <th scope="col" className="px-3 py-3 text-right">Disponibles</th>
              <th scope="col" className="px-3 py-3">Estado</th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((articulo) => (
              <FilaArticulo
                key={articulo.id}
                articulo={articulo}
                alEditar={(a) => setDialogo({ tipo: 'formulario', articulo: a })}
                alEliminar={(a) => setDialogo({ tipo: 'eliminar', articulo: a })}
              />
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
        acciones={
          <button
            type="button"
            onClick={() => setDialogo({ tipo: 'formulario', articulo: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-marino-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo artículo
          </button>
        }
      />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{cuerpo}</div>

      {dialogo?.tipo === 'formulario' && (
        <FormularioArticulo
          key={dialogo.articulo?.id ?? 'nuevo'}
          articulo={dialogo.articulo}
          categorias={categorias}
          alGuardar={terminar}
          alCerrar={cerrarDialogo}
        />
      )}
      {dialogo?.tipo === 'eliminar' && (
        <ConfirmarEliminar articulo={dialogo.articulo} alEliminar={terminar} alCerrar={cerrarDialogo} />
      )}
    </>
  );
}
