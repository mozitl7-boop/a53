import VistaSala from "@/components/vista-sala";

type Props = {
  params: Promise<{ eventoId: string }> | { eventoId: string };
};

export default async function Page({ params }: Props) {
  const { eventoId } = await params;
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">Vista Administrativa</h1>
        <p className="text-sm text-slate-300 mt-2">Gestión de asientos y asistentes del evento: <span className="font-semibold">{eventoId}</span></p>
      </div>
      <VistaSala eventoId={eventoId} />
    </div>
  );
}
