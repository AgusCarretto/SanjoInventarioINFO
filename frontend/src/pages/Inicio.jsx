import { OctagonAlert, Package, TriangleAlert } from 'lucide-react';
import AlertasStock from '../components/dashboard/AlertasStock.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useApi } from '../hooks/useApi.js';

export default function Inicio() {
  const alertas = useApi('/alertas/stock');
  const articulos = useApi('/articulos');
  const resumen = alertas.data?.resumen;

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
      <div className="mt-6">
        <AlertasStock
          datos={alertas.data}
          cargando={alertas.loading}
          error={alertas.error}
          onReintentar={alertas.reload}
        />
      </div>
    </>
  );
}
