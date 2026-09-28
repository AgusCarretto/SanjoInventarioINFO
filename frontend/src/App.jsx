import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import ErrorConexion from './components/ui/ErrorConexion.jsx';
import { useApi } from './hooks/useApi.js';
import Articulos from './pages/Articulos.jsx';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Movimientos from './pages/Movimientos.jsx';
import Prestamos from './pages/Prestamos.jsx';
import Red from './pages/Red.jsx';

/** Antes que nada, ¿hay una sesión iniciada? Sin eso no se pide ni se muestra nada más. */
export default function App() {
  const sesion = useApi('/auth/me');

  if (sesion.loading) return null;
  if (sesion.error?.estado === 401 || !sesion.data?.usuario) {
    return <Login alIniciarSesion={sesion.reload} />;
  }
  if (sesion.error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4">
          <ErrorConexion onReintentar={sesion.reload} />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Inicio />} />
        <Route path="articulos" element={<Articulos />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route path="red" element={<Red />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
