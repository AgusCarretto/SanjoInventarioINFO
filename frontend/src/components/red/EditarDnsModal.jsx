import { useState } from 'react';
import { apiSend } from '../../lib/api.js';
import Aviso from '../ui/Aviso.jsx';
import Dialogo from '../ui/Dialogo.jsx';

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30';

/** DNS de toda la red del colegio, no por equipo: un único registro. */
export default function EditarDnsModal({ config, alGuardar, alCerrar }) {
  const [dns, setDns] = useState(config?.dns ?? '');
  const [dnsAlternativo, setDnsAlternativo] = useState(config?.dnsAlternativo ?? '');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await apiSend('PATCH', '/red/config', {
        dns: dns.trim() || null,
        dnsAlternativo: dnsAlternativo.trim() || null,
      });
      alGuardar();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <Dialogo titulo="Editar DNS de la red" alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate>
        <div className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="dns-principal" className="mb-1 block text-sm font-medium text-marino-900">
              DNS
            </label>
            <input
              id="dns-principal"
              data-foco-inicial
              type="text"
              value={dns}
              onChange={(e) => setDns(e.target.value)}
              autoComplete="off"
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="dns-alt" className="mb-1 block text-sm font-medium text-marino-900">
              DNS alternativo
            </label>
            <input
              id="dns-alt"
              type="text"
              value={dnsAlternativo}
              onChange={(e) => setDnsAlternativo(e.target.value)}
              autoComplete="off"
              className={CLASE_CAMPO}
            />
          </div>
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
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
