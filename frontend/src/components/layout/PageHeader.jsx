export default function PageHeader({ titulo, descripcion, acciones }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-marino-900">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-prose text-sm text-slate-600">{descripcion}</p>}
      </div>
      {acciones}
    </header>
  );
}
