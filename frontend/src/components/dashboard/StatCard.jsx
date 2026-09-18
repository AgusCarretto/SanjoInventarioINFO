// Cada tarjeta es un tramo de la franja de resumen (ver Inicio.jsx). El estado lo
// dan el fondo y el ícono; el número siempre va en el color de texto principal.
const TONOS = {
  neutro: { fondo: 'bg-white', icono: 'bg-marino-50 text-marino-700' },
  alerta: { fondo: 'bg-red-50', icono: 'bg-red-100 text-red-700' },
};

export default function StatCard({ etiqueta, valor, Icono, tono = 'neutro', cargando = false }) {
  const estilo = TONOS[tono];
  return (
    <div className={`flex items-center gap-4 p-5 ${estilo.fondo}`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${estilo.icono}`}>
        <Icono className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-slate-600">{etiqueta}</p>
        <p className="text-3xl font-semibold tracking-tight text-marino-900" aria-busy={cargando}>
          {cargando ? '—' : (valor ?? '—')}
        </p>
      </div>
    </div>
  );
}
