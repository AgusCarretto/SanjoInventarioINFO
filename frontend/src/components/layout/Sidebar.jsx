import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeftRight, HandHelping, LayoutDashboard, Menu, Package, X } from 'lucide-react';

const ITEMS = [
  { to: '/', etiqueta: 'Inicio', Icono: LayoutDashboard, end: true },
  { to: '/articulos', etiqueta: 'Artículos', Icono: Package },
  { to: '/prestamos', etiqueta: 'Préstamos', Icono: HandHelping },
  { to: '/movimientos', etiqueta: 'Movimientos', Icono: ArrowLeftRight },
];

const claseItem = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-3 rounded-lg bg-white/15 px-3 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
    : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-marino-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

function Marca() {
  return (
    <div>
      <p className="text-lg font-semibold tracking-tight text-white">Informática</p>
      <p className="text-xs leading-snug text-marino-300">Colegio San José de la Providencia</p>
    </div>
  );
}

function Navegacion({ alNavegar }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {ITEMS.map(({ to, etiqueta, Icono, end }) => (
        <NavLink key={to} to={to} end={end} className={claseItem} onClick={alNavegar}>
          <Icono className="size-5" aria-hidden="true" />
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 bg-marino-950 px-4 py-6 lg:flex">
        <Marca />
        <Navegacion />
      </aside>

      <header className="sticky top-0 z-20 bg-marino-950 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Marca />
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-lg p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {abierto ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
        {abierto && (
          <div id="menu-movil" className="mt-3 border-t border-white/10 pt-3">
            <Navegacion alNavegar={() => setAbierto(false)} />
          </div>
        )}
      </header>
    </>
  );
}
