import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Articulos from './pages/Articulos.jsx';
import Inicio from './pages/Inicio.jsx';
import Proximamente from './pages/Proximamente.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Inicio />} />
        <Route path="articulos" element={<Articulos />} />
        <Route
          path="prestamos"
          element={<Proximamente titulo="Préstamos" descripcion="Registro de equipos prestados y devoluciones." />}
        />
        <Route
          path="movimientos"
          element={<Proximamente titulo="Movimientos" descripcion="Historial de ingresos y consumo de insumos." />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
