import { TriangleAlert } from 'lucide-react';

/** Caja de error dentro de un formulario o modal: ícono, color y texto, nunca solo color. */
export default function Aviso({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-900">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
