import { NIVELES } from '../../lib/nivelEstilos.js';

/** Nivel de alerta con color, ícono y texto: nunca solo color. */
export default function NivelBadge({ nivel }) {
  const estilo = NIVELES[nivel];
  if (!estilo) return null;
  const { Icono } = estilo;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${estilo.insignia}`}>
      <Icono className="size-3.5" aria-hidden="true" />
      {estilo.etiqueta}
    </span>
  );
}
