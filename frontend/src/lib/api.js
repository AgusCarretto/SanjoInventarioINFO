const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function apiGet(path, { signal } = {}) {
  const respuesta = await fetch(`${BASE_URL}${path}`, { signal });
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió ${respuesta.status} al pedir ${path}`);
  }
  return respuesta.json();
}
