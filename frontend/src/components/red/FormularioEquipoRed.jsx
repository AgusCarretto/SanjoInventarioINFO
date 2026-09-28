import { useState } from 'react';
import { apiSend } from '../../lib/api.js';
import Aviso from '../ui/Aviso.jsx';
import Dialogo from '../ui/Dialogo.jsx';

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30';

/** Gateway que más se repite en la red del colegio: se precarga para no tipearlo cada vez. */
const PUERTA_ENLACE_HABITUAL = '192.168.1.251';

function Campo({ id, etiqueta, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-marino-900">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

export default function FormularioEquipoRed({ equipo, alGuardar, alCerrar }) {
  const esEdicion = equipo !== null;
  const [nombre, setNombre] = useState(equipo?.nombre ?? '');
  const [ip, setIp] = useState(equipo?.ip ?? '');
  const [puertaEnlace, setPuertaEnlace] = useState(equipo?.puertaEnlace ?? PUERTA_ENLACE_HABITUAL);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    const payload = { nombre: nombre.trim(), ip: ip.trim(), puertaEnlace: puertaEnlace.trim() || null };
    try {
      if (esEdicion) await apiSend('PATCH', `/red/equipos/${equipo.id}`, payload);
      else await apiSend('POST', '/red/equipos', payload);
      alGuardar();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <Dialogo titulo={esEdicion ? 'Editar equipo' : 'Nueva IP'} alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate>
        <div className="space-y-4 px-5 py-5">
          <Campo id="red-nombre" etiqueta="PC / ubicación">
            <input
              id="red-nombre"
              data-foco-inicial
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Gimnasio A"
              maxLength={120}
              autoComplete="off"
              className={CLASE_CAMPO}
            />
          </Campo>
          <Campo id="red-ip" etiqueta="IP">
            <input
              id="red-ip"
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.x"
              autoComplete="off"
              className={CLASE_CAMPO}
            />
          </Campo>
          <Campo id="red-puerta" etiqueta="Puerta de enlace">
            <input
              id="red-puerta"
              type="text"
              value={puertaEnlace}
              onChange={(e) => setPuertaEnlace(e.target.value)}
              autoComplete="off"
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
            disabled={guardando}
            className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar'}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
