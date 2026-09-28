import { useState } from 'react';
import { Plus, Undo2 } from 'lucide-react';
import ConfirmarDevolver from '../components/prestamos/ConfirmarDevolver.jsx';
import NuevoPrestamoModal from '../components/prestamos/NuevoPrestamoModal.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ErrorConexion from '../components/ui/ErrorConexion.jsx';
import { useApi } from '../hooks/useApi.js';

function fechaLegible(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function FilaPrestamo({ prestamo, alDevolver }) {
  const marcaModelo = [prestamo.articulo.marca, prestamo.articulo.modelo].filter(Boolean).join(' ');
  return (
    <tr>
      <td className="px-3 py-3">
        <p className="font-medium text-marino-900">{prestamo.articulo.nombre}</p>
        {marcaModelo && <p className="text-slate-600">{marcaModelo}</p>}
      </td>
      <td className="px-3 py-3 text-slate-700">{prestamo.prestadoA}</td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-700">{fechaLegible(prestamo.fechaSalida)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums font-semibold text-marino-900">
        {prestamo.cantidad}
      </td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          onClick={() => alDevolver(prestamo)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marino-600 px-3 py-1.5 text-sm font-medium text-marino-800 hover:bg-marino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
        >
          <Undo2 className="size-4" aria-hidden="true" />
          Devolver
        </button>
      </td>
    </tr>
  );
}

export default function Prestamos() {
  const { data, error, loading, reload } = useApi('/prestamos');
  const [dialogo, setDialogo] = useState(null);

  const cerrarDialogo = () => setDialogo(null);
  const terminar = () => {
    setDialogo(null);
    reload();
  };

  let cuerpo;
  if (loading) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando préstamos…
      </p>
    );
  } else if (error) {
    cuerpo = <ErrorConexion onReintentar={reload} />;
  } else if (data.length === 0) {
    cuerpo = (
      <p className="px-5 py-8 text-sm text-slate-600">
        No hay nada prestado ahora mismo. Registrá uno con <strong>Nuevo préstamo</strong>.
      </p>
    );
  } else {
    cuerpo = (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left font-medium text-slate-600">
            <tr>
              <th scope="col" className="px-3 py-3">Artículo</th>
              <th scope="col" className="px-3 py-3">Prestado a</th>
              <th scope="col" className="px-3 py-3">Salida</th>
              <th scope="col" className="px-3 py-3 text-right">Cantidad</th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((p) => (
              <FilaPrestamo key={p.id} prestamo={p} alDevolver={(pr) => setDialogo({ tipo: 'devolver', prestamo: pr })} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Préstamos"
        descripcion="Lo que está prestado ahora mismo. Al devolverlo, pasa a figurar en Movimientos."
        acciones={
          <button
            type="button"
            onClick={() => setDialogo({ tipo: 'nuevo' })}
            className="inline-flex items-center gap-2 rounded-lg bg-marino-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo préstamo
          </button>
        }
      />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{cuerpo}</div>

      {dialogo?.tipo === 'nuevo' && <NuevoPrestamoModal alGuardar={terminar} alCerrar={cerrarDialogo} />}
      {dialogo?.tipo === 'devolver' && (
        <ConfirmarDevolver prestamo={dialogo.prestamo} alDevolver={terminar} alCerrar={cerrarDialogo} />
      )}
    </>
  );
}
