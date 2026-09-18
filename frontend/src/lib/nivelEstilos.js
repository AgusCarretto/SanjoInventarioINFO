import { OctagonAlert, TriangleAlert } from 'lucide-react';

// Clases de Tailwind como strings literales completos: el escaneo de Tailwind
// no encuentra nombres armados por concatenación.
export const NIVELES = {
  SIN_STOCK: {
    etiqueta: 'Sin stock',
    Icono: OctagonAlert,
    insignia: 'bg-red-100 text-red-800',
    fila: 'bg-red-50',
    borde: 'border-l-4 border-red-600',
    relleno: 'bg-red-600',
    pista: 'bg-red-100',
  },
  BAJO: {
    etiqueta: 'Stock bajo',
    Icono: TriangleAlert,
    insignia: 'bg-amber-100 text-amber-900',
    fila: 'bg-amber-50',
    borde: 'border-l-4 border-amber-500',
    relleno: 'bg-amber-500',
    pista: 'bg-amber-100',
  },
};
