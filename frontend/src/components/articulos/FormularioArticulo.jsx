import { useState } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { apiSend } from '../../lib/api.js';
import { armarPayload, tiposDeCategoria, valoresIniciales } from '../../lib/articuloForm.js';
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

function Aviso({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-900">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/**
 * Alta (articulo = null) o edición de un artículo. Solo el nombre es obligatorio:
 * lo que se deja vacío se guarda como "sin dato". Las listas de categoría y tipo
 * salen del catálogo de la base y se leen cada vez que se abre la ventana.
 */
export default function FormularioArticulo({ articulo, alGuardar, alCerrar }) {
  const esEdicion = articulo !== null;
  const catalogo = useApi('/catalogo');
  const [valores, setValores] = useState(() => valoresIniciales(articulo));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const usoBloqueado = esEdicion && articulo.prestados > 0;
  const tipos = tiposDeCategoria(catalogo.data, valores.categoriaId);
  const sinCategoria = valores.categoriaId === '';

  const cambiar = (campo) => (evento) => setValores((previos) => ({ ...previos, [campo]: evento.target.value }));
  // El tipo depende de la categoría: al cambiarla, el tipo elegido deja de valer.
  const cambiarCategoria = (evento) =>
    setValores((previos) => ({ ...previos, categoriaId: evento.target.value, tipoId: '' }));

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
    <Dialogo titulo={esEdicion ? 'Editar artículo' : 'Nuevo artículo'} alCerrar={alCerrar} ancho="ancho">
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

          {catalogo.error && (
            <Aviso>
              <p>No se pudieron cargar las categorías y los tipos. Podés guardar igual y completarlos después.</p>
              <button
                type="button"
                onClick={catalogo.reload}
                className="mt-1.5 inline-flex items-center gap-1.5 font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reintentar
              </button>
            </Aviso>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="articulo-categoria" etiqueta="Categoría">
              <select
                id="articulo-categoria"
                value={valores.categoriaId}
                onChange={cambiarCategoria}
                disabled={catalogo.loading}
                className={CLASE_CAMPO}
              >
                <option value="">{catalogo.loading ? 'Cargando…' : 'Sin categoría'}</option>
                {(catalogo.data?.categorias ?? []).map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo
              id="articulo-tipo"
              etiqueta="Tipo"
              ayuda={sinCategoria && !catalogo.loading ? 'Elegí primero una categoría.' : undefined}
            >
              <select
                id="articulo-tipo"
                value={valores.tipoId}
                onChange={cambiar('tipoId')}
                disabled={sinCategoria || catalogo.loading}
                aria-describedby={sinCategoria ? 'articulo-tipo-ayuda' : undefined}
                className={CLASE_CAMPO}
              >
                <option value="">Sin tipo</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="articulo-marca" etiqueta="Marca">
              <input
                id="articulo-marca"
                type="text"
                value={valores.marca}
                onChange={cambiar('marca')}
                maxLength={80}
                autoComplete="off"
                className={CLASE_CAMPO}
              />
            </Campo>
            <Campo id="articulo-modelo" etiqueta="Modelo">
              <input
                id="articulo-modelo"
                type="text"
                value={valores.modelo}
                onChange={cambiar('modelo')}
                maxLength={80}
                autoComplete="off"
                className={CLASE_CAMPO}
              />
            </Campo>
          </div>

          <Campo
            id="articulo-compatibilidad"
            etiqueta="Compatibilidad"
            ayuda="Con qué equipos o modelos funciona, por ejemplo un tóner o una fuente."
          >
            <input
              id="articulo-compatibilidad"
              type="text"
              value={valores.compatibilidad}
              onChange={cambiar('compatibilidad')}
              maxLength={255}
              autoComplete="off"
              aria-describedby="articulo-compatibilidad-ayuda"
              className={CLASE_CAMPO}
            />
          </Campo>

          <Campo
            id="articulo-uso"
            etiqueta="Uso"
            ayuda={
              usoBloqueado
                ? 'No se puede cambiar: el artículo tiene unidades prestadas.'
                : 'Los retornables se prestan y se devuelven; los consumibles se gastan.'
            }
          >
            <select
              id="articulo-uso"
              value={valores.uso}
              onChange={cambiar('uso')}
              disabled={usoBloqueado}
              aria-describedby="articulo-uso-ayuda"
              className={CLASE_CAMPO}
            >
              <option value="">Sin definir</option>
              <option value="consumible">Consumible (cables, tinta, pilas)</option>
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
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar artículo'}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
