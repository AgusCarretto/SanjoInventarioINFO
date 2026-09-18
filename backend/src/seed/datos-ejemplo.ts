export interface ArticuloEjemplo {
  nombre: string;
  /** Nombre de una categoría de sql/catalogo-inicial.sql. */
  categoria: string;
  /** Nombre de un tipo de esa categoría. */
  tipo: string;
  marca?: string;
  modelo?: string;
  esRetornable: boolean;
  stockActual: number;
  stockMinimo: number;
}

export const ARTICULOS_EJEMPLO: readonly ArticuloEjemplo[] = [
  { nombre: 'Proyector Epson EB-X06', categoria: 'Otros', tipo: 'Proyector', marca: 'Epson', modelo: 'EB-X06', esRetornable: true, stockActual: 4, stockMinimo: 2 },
  { nombre: 'Notebook Lenovo ThinkPad', categoria: 'Otros', tipo: 'Notebook', marca: 'Lenovo', modelo: 'ThinkPad', esRetornable: true, stockActual: 6, stockMinimo: 2 },
  { nombre: 'Parlante portátil', categoria: 'Periféricos', tipo: 'Parlantes', esRetornable: true, stockActual: 1, stockMinimo: 1 },
  { nombre: 'Cable HDMI 2 m', categoria: 'Otros', tipo: 'Cable de video (HDMI, VGA)', esRetornable: false, stockActual: 3, stockMinimo: 5 },
  { nombre: 'Cable de red Cat6', categoria: 'Redes', tipo: 'Cable de red', modelo: 'Cat6', esRetornable: false, stockActual: 0, stockMinimo: 10 },
  { nombre: 'Pilas AA', categoria: 'Otros', tipo: 'Pilas y baterías', modelo: 'AA', esRetornable: false, stockActual: 12, stockMinimo: 10 },
  { nombre: 'Pilas AAA', categoria: 'Otros', tipo: 'Pilas y baterías', modelo: 'AAA', esRetornable: false, stockActual: 8, stockMinimo: 10 },
  { nombre: 'Mouse USB', categoria: 'Periféricos', tipo: 'Mouse', esRetornable: false, stockActual: 15, stockMinimo: 5 },
  { nombre: 'Teclado USB', categoria: 'Periféricos', tipo: 'Teclado', esRetornable: false, stockActual: 2, stockMinimo: 4 },
  { nombre: 'Pendrive 32 GB', categoria: 'Periféricos', tipo: 'Pendrive', esRetornable: false, stockActual: 6, stockMinimo: 3 },
];
