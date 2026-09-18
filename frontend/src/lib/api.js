const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Error de la API con el texto ya listo para mostrar y el código HTTP (0 = sin conexión). */
export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

/** Los mensajes de error del backend vienen en español; si no hay, un texto genérico. */
export function mensajeDeErrorApi(cuerpo, estado) {
  const mensaje = cuerpo?.message;
  if (Array.isArray(mensaje) && mensaje.length > 0) return mensaje.join('. ');
  if (typeof mensaje === 'string' && mensaje) return mensaje;
  return `El servidor respondió ${estado}`;
}

async function pedir(metodo, path, { body, signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${path}`, {
      method: metodo,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ErrorApi('No se pudo conectar con el servidor. Revisá que el backend esté en marcha.', 0);
  }
  if (respuesta.status === 204) return null;
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(mensajeDeErrorApi(cuerpo, respuesta.status), respuesta.status);
  return cuerpo;
}

export const apiGet = (path, opciones) => pedir('GET', path, opciones);

/** POST, PATCH o DELETE. `body` se envía como JSON; una respuesta 204 devuelve null. */
export const apiSend = (metodo, path, body) => pedir(metodo, path, { body });
