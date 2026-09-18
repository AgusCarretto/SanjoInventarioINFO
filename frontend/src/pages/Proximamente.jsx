import { Clock } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';

export default function Proximamente({ titulo, descripcion }) {
  return (
    <>
      <PageHeader titulo={titulo} descripcion={descripcion} />
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
        <Clock className="size-6 text-marino-600" aria-hidden="true" />
        <p>Esta sección llega en la próxima entrega.</p>
      </div>
    </>
  );
}
