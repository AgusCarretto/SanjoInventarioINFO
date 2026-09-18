export default function PageHeader({ titulo, descripcion }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-marino-900">{titulo}</h1>
      {descripcion && <p className="mt-1 max-w-prose text-sm text-slate-600">{descripcion}</p>}
    </header>
  );
}
