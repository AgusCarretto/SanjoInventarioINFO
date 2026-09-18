import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Ventana modal sobre el <dialog> nativo (foco atrapado y cierre con Esc incluidos).
 * Existir en pantalla es estar abierta: quien la usa la monta para abrirla y la
 * desmonta en `alCerrar` para cerrarla.
 */
export default function Dialogo({ titulo, alCerrar, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo.open) dialogo.showModal();
    // El foco inicial va al elemento marcado; si no hay ninguno, al botón de cerrar.
    dialogo.querySelector('[data-foco-inicial]')?.focus();
    // Sin cleanup a propósito: al desmontarse, el <dialog> sale del DOM y del top layer.
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={alCerrar}
      aria-labelledby="titulo-dialogo"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-0 text-marino-900 backdrop:bg-marino-950/60"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <h2 id="titulo-dialogo" className="text-lg font-semibold tracking-tight">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={() => ref.current.close()}
          aria-label="Cerrar"
          className="-mr-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marino-600"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
