import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import ConfirmarEliminarEquipo from '../components/red/ConfirmarEliminarEquipo.jsx';
import EditarDnsModal from '../components/red/EditarDnsModal.jsx';
import FormularioEquipoRed from '../components/red/FormularioEquipoRed.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ErrorConexion from '../components/ui/ErrorConexion.jsx';
import { useApi } from '../hooks/useApi.js';

const CLASE_ACCION =
  'inline-flex size-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2';

function SinDato() {
  return <span className="text-slate-500">—</span>;
}

function FilaEquipo({ equipo, alEditar, alEliminar }) {
  return (
    <tr>
      <td className="px-3 py-3 font-medium text-marino-900">{equipo.nombre}</td>
      <td className="px-3 py-3 tabular-nums text-slate-700">{equipo.ip}</td>
      <td className="px-3 py-3 tabular-nums text-slate-700">{equipo.puertaEnlace ?? <SinDato />}</td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => alEditar(equipo)}
            aria-label={`Editar ${equipo.nombre}`}
            title="Editar"
            className={`${CLASE_ACCION} text-marino-700 hover:bg-marino-50 focus-visible:ring-marino-600`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => alEliminar(equipo)}
            aria-label={`Eliminar ${equipo.nombre}`}
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

export default function Red() {
  const equipos = useApi('/red/equipos');
  const config = useApi('/red/config');
  const [dialogo, setDialogo] = useState(null);

  const cerrarDialogo = () => setDialogo(null);
  const terminarEquipos = () => {
    setDialogo(null);
    equipos.reload();
  };
  const terminarConfig = () => {
    setDialogo(null);
    config.reload();
  };

  let cuerpo;
  if (equipos.loading) {
    cuerpo = (
      <p role="status" className="px-5 py-8 text-sm text-slate-600">
        Cargando…
      </p>
    );
  } else if (equipos.error) {
    cuerpo = <ErrorConexion onReintentar={equipos.reload} />;
  } else if (equipos.data.length === 0) {
    cuerpo = (
      <p className="px-5 py-8 text-sm text-slate-600">
        Todavía no hay equipos cargados. Agregá el primero con <strong>Nueva IP</strong>.
      </p>
    );
  } else {
    cuerpo = (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left font-medium text-slate-600">
            <tr>
              <th scope="col" className="px-3 py-3">PC</th>
              <th scope="col" className="px-3 py-3">IP</th>
              <th scope="col" className="px-3 py-3">Puerta de enlace</th>
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {equipos.data.map((e) => (
              <FilaEquipo
                key={e.id}
                equipo={e}
                alEditar={(eq) => setDialogo({ tipo: 'formulario', equipo: eq })}
                alEliminar={(eq) => setDialogo({ tipo: 'eliminar', equipo: eq })}
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
        titulo="Red"
        descripcion="IPs fijas de la red del colegio."
        acciones={
          <button
            type="button"
            onClick={() => setDialogo({ tipo: 'formulario', equipo: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-marino-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva IP
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
        <p>
          <span className="font-medium text-marino-900">DNS:</span>{' '}
          {config.data?.dns ?? <SinDato />}
        </p>
        <p>
          <span className="font-medium text-marino-900">DNS alternativo:</span>{' '}
          {config.data?.dnsAlternativo ?? <SinDato />}
        </p>
        <button
          type="button"
          onClick={() => setDialogo({ tipo: 'dns' })}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-marino-700 hover:bg-marino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Editar
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{cuerpo}</div>

      {dialogo?.tipo === 'formulario' && (
        <FormularioEquipoRed
          key={dialogo.equipo?.id ?? 'nuevo'}
          equipo={dialogo.equipo}
          alGuardar={terminarEquipos}
          alCerrar={cerrarDialogo}
        />
      )}
      {dialogo?.tipo === 'eliminar' && (
        <ConfirmarEliminarEquipo equipo={dialogo.equipo} alEliminar={terminarEquipos} alCerrar={cerrarDialogo} />
      )}
      {dialogo?.tipo === 'dns' && (
        <EditarDnsModal config={config.data} alGuardar={terminarConfig} alCerrar={cerrarDialogo} />
      )}
    </>
  );
}
