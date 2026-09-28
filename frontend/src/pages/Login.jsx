import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { apiSend } from '../lib/api.js';
import Aviso from '../components/ui/Aviso.jsx';

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30';

/** Login simple: sin alta ni recuperación de contraseña, solo los 2 usuarios del departamento. */
export default function Login({ alIniciarSesion }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiSend('POST', '/auth/login', { usuario: usuario.trim(), password });
      alIniciarSesion();
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marino-950 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-marino-900">Sistema de Stock</p>
          <p className="text-sm text-slate-600">Departamento de Informática</p>
        </div>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-usuario" className="mb-1 block text-sm font-medium text-marino-900">
              Usuario
            </label>
            <input
              id="login-usuario"
              data-foco-inicial
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              autoFocus
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-marino-900">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={CLASE_CAMPO}
            />
          </div>
          {error && (
            <Aviso>
              <p>{error}</p>
            </Aviso>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-marino-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-marino-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <LogIn className="size-4" aria-hidden="true" />
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
