import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { apiSend } from '../../lib/api.js';
import { armarPayload, valoresIniciales } from '../../lib/articuloForm.js';
import Dialogo from '../ui/Dialogo.jsx';

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-marino-900 placeholder:text-slate-400 focus-visible:border-marino-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600/30 disabled:bg-slate-100 disabled:text-slate-500';

function Campo({ id, etiqueta, ayuda, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-marino-900">
        {etiqueta}
      </label>
      {children}
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-sm text-slate-600">
          {ayuda}
        </p>
      )}
    </div>
  );
}

/**
 * Alta (articulo = null) o edición de un artículo. Solo el nombre es obligatorio:
 * lo que se deja vacío se guarda como "sin dato".
 */
export default function FormularioArticulo({ articulo, categorias, alGuardar, alCerrar }) {
  const esEdicion = articulo !== null;
  const [valores, setValores] = useState(() => valoresIniciales(articulo));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const tipoBloqueado = esEdicion && articulo.prestados > 0;

  const cambiar = (campo) => (evento) => setValores((previos) => ({ ...previos, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    const payload = armarPayload(valores);
    if (payload.nombre === '') {
      setError('El nombre es obligatorio.');
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      if (esEdicion) await apiSend('PATCH', `/articulos/${articulo.id}`, payload);
      else await apiSend('POST', '/articulos', payload);
      alGuardar();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <Dialogo titulo={esEdicion ? 'Editar artículo' : 'Nuevo artículo'} alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate>
        <div className="space-y-4 px-5 py-5">
          <Campo id="articulo-nombre" etiqueta="Nombre (obligatorio)">
            <input
              id="articulo-nombre"
              data-foco-inicial
              type="text"
              value={valores.nombre}
              onChange={cambiar('nombre')}
              maxLength={120}
              autoComplete="off"
              className={CLASE_CAMPO}
            />
          </Campo>

          <Campo id="articulo-categoria" etiqueta="Categoría">
            <input
              id="articulo-categoria"
              type="text"
              list="categorias-existentes"
              value={valores.categoria}
              onChange={cambiar('categoria')}
              maxLength={60}
              autoComplete="off"
              className={CLASE_CAMPO}
            />
            <datalist id="categorias-existentes">
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria} />
              ))}
            </datalist>
          </Campo>

          <Campo
            id="articulo-tipo"
            etiqueta="Tipo"
            ayuda={
              tipoBloqueado
                ? 'No se puede cambiar: el artículo tiene unidades prestadas.'
                : 'Los retornables se prestan y se devuelven; los consumibles se gastan.'
            }
          >
            <select
              id="articulo-tipo"
              value={valores.tipo}
              onChange={cambiar('tipo')}
              disabled={tipoBloqueado}
              aria-describedby="articulo-tipo-ayuda"
              className={CLASE_CAMPO}
            >
              <option value="">Sin definir</option>
              <option value="consumible">Consumible (cables, pilas)</option>
              <option value="retornable">Retornable (proyectores, notebooks)</option>
            </select>
          </Campo>

          <div>
            <div className="grid grid-cols-2 gap-4">
              <Campo id="articulo-stock" etiqueta="Stock actual">
                <input
                  id="articulo-stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={valores.stockActual}
                  onChange={cambiar('stockActual')}
                  aria-describedby="ayuda-stock"
                  className={CLASE_CAMPO}
                />
              </Campo>
              <Campo id="articulo-minimo" etiqueta="Stock mínimo">
                <input
                  id="articulo-minimo"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={valores.stockMinimo}
                  onChange={cambiar('stockMinimo')}
                  aria-describedby="ayuda-stock"
                  className={CLASE_CAMPO}
                />
              </Campo>
            </div>
            <p id="ayuda-stock" className="mt-2 text-sm text-slate-600">
              Dejalos en blanco si todavía no los sabés. Sin stock actual o sin mínimo, el artículo no genera alertas.
            </p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden="true" />
              <p>{error}</p>
            </div>
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
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar artículo'}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
