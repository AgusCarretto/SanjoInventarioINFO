export interface ArticuloEjemplo {
  nombre: string;
  categoria: string;
  esRetornable: boolean;
  stockActual: number;
  stockMinimo: number;
}

export const ARTICULOS_EJEMPLO: readonly ArticuloEjemplo[] = [
  { nombre: 'Proyector Epson EB-X06', categoria: 'Equipos', esRetornable: true, stockActual: 4, stockMinimo: 2 },
  { nombre: 'Notebook Lenovo ThinkPad', categoria: 'Equipos', esRetornable: true, stockActual: 6, stockMinimo: 2 },
  { nombre: 'Parlante portátil', categoria: 'Equipos', esRetornable: true, stockActual: 1, stockMinimo: 1 },
  { nombre: 'Cable HDMI 2 m', categoria: 'Cables', esRetornable: false, stockActual: 3, stockMinimo: 5 },
  { nombre: 'Cable de red Cat6', categoria: 'Cables', esRetornable: false, stockActual: 0, stockMinimo: 10 },
  { nombre: 'Pilas AA', categoria: 'Insumos', esRetornable: false, stockActual: 12, stockMinimo: 10 },
  { nombre: 'Pilas AAA', categoria: 'Insumos', esRetornable: false, stockActual: 8, stockMinimo: 10 },
  { nombre: 'Mouse USB', categoria: 'Periféricos', esRetornable: false, stockActual: 15, stockMinimo: 5 },
  { nombre: 'Teclado USB', categoria: 'Periféricos', esRetornable: false, stockActual: 2, stockMinimo: 4 },
  { nombre: 'Pendrive 32 GB', categoria: 'Almacenamiento', esRetornable: false, stockActual: 6, stockMinimo: 3 },
];
