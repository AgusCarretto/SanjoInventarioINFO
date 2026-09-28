import { useState } from 'react';
import { OctagonAlert, Package, TriangleAlert } from 'lucide-react';
import ReponerArticuloModal from '../components/articulos/ReponerArticuloModal.jsx';
import UsarArticuloModal from '../components/articulos/UsarArticuloModal.jsx';
import AlertasStock from '../components/dashboard/AlertasStock.jsx';
import ReponerStockCard from '../components/dashboard/ReponerStockCard.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import UsarStockCard from '../components/dashboard/UsarStockCard.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useApi } from '../hooks/useApi.js';

export default function Inicio() {
  const alertas = useApi('/alertas/stock');
  const articulos = useApi('/articulos');
  const resumen = alertas.data?.resumen;
  const [modalUsarAbierto, setModalUsarAbierto] = useState(false);
  const [modalReponerAbierto, setModalReponerAbierto] = useState(false);

  // Usar y reponer stock pueden cambiar qué artículos están en alerta: se refresca todo al cerrar.
  const cerrarModalUsar = () => {
    setModalUsarAbierto(false);
    alertas.reload();
    articulos.reload();
  };
  const cerrarModalReponer = () => {
    setModalReponerAbierto(false);
    alertas.reload();
    articulos.reload();
  };

  return (
    <>
      <PageHeader titulo="Inicio" descripcion="Estado del stock del Departamento de Informática." />
      <div className="grid divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <StatCard etiqueta="Artículos" valor={articulos.data?.length} Icono={Package} cargando={articulos.loading} />
        <StatCard
          etiqueta="En alerta"
          valor={resumen?.total}
          Icono={TriangleAlert}
          tono={resumen?.total > 0 ? 'alerta' : 'neutro'}
          cargando={alertas.loading}
        />
        <StatCard
          etiqueta="Sin stock"
          valor={resumen?.sinStock}
          Icono={OctagonAlert}
          tono={resumen?.sinStock > 0 ? 'alerta' : 'neutro'}
          cargando={alertas.loading}
        />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <UsarStockCard onClick={() => setModalUsarAbierto(true)} />
        <ReponerStockCard onClick={() => setModalReponerAbierto(true)} />
      </div>
      <div className="mt-6">
        <AlertasStock
          datos={alertas.data}
          cargando={alertas.loading}
          error={alertas.error}
          onReintentar={alertas.reload}
        />
      </div>

      {modalUsarAbierto && <UsarArticuloModal alCerrar={cerrarModalUsar} />}
      {modalReponerAbierto && <ReponerArticuloModal alCerrar={cerrarModalReponer} />}
    </>
  );
}
