import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Articulos from './pages/Articulos.jsx';
import Inicio from './pages/Inicio.jsx';
import Movimientos from './pages/Movimientos.jsx';
import Prestamos from './pages/Prestamos.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Inicio />} />
        <Route path="articulos" element={<Articulos />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
