import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';

/**
 * Pide `path` a la API. `loading` se deriva al renderizar: el último resultado
 * guardado solo vale si corresponde a la petición actual (path + recarga).
 */
export function useApi(path) {
  const [version, setVersion] = useState(0);
  const clave = `${path}#${version}`;
  const [resultado, setResultado] = useState({ clave: null, data: null, error: null });

  useEffect(() => {
    const controlador = new AbortController();
    apiGet(path, { signal: controlador.signal })
      .then((data) => setResultado({ clave, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setResultado({ clave, data: null, error });
        }
      });
    return () => controlador.abort();
  }, [path, clave]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const vigente = resultado.clave === clave;
  return {
    data: vigente ? resultado.data : null,
    error: vigente ? resultado.error : null,
    loading: !vigente,
    reload,
  };
}
