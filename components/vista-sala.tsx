"use client";

import React, { useEffect, useState } from "react";

type Asiento = {
  asientoId: string;
  numero_asiento: number;
  numeroAsiento: number;
  fila: string | null;
  seccion: string | null;
  ocupado: boolean;
  registroId?: string | null;
  numero_orden?: number | null;
  asistente?: {
    id: string;
    nombre: string | null;
    email: string | null;
  } | null;
};

type Fila = {
  fila: string;
  seats: Asiento[];
};

export function VistaSala({ eventoId }: { eventoId: string }) {
  const [grid, setGrid] = useState<Fila[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/asientos/evento/${eventoId}/grid`);
        const json = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(json.error || "Error cargando grid");
          setGrid([]);
        } else {
          setGrid(json.grid || []);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Error de red");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [eventoId]);

  if (loading) return <div>Cargando sala...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!grid) return <div>No hay datos de la sala.</div>;

  const asistentesFlat: { asiento: Asiento; fila: string }[] = [];
  grid.forEach((f) =>
    f.seats.forEach((s) => asistentesFlat.push({ asiento: s, fila: f.fila }))
  );

  const filteredAsistentes = filter
    ? asistentesFlat.filter((a) =>
        `${a.asiento.asistente?.nombre || ""} ${
          a.asiento.asistente?.email || ""
        }`
          .toLowerCase()
          .includes(filter.toLowerCase())
      )
    : asistentesFlat;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-xl shadow-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-lg font-bold text-foreground">Sala del evento</h3>
          <span className="text-xs text-muted-foreground">Evento: {eventoId}</span>
          <span className="ml-auto text-xs font-semibold text-accent">{grid.length} filas</span>
        </div>

        <div className="mt-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-lg border border-primary/40 bg-[#111b31] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </div>

      <div className="max-h-[45vh] overflow-auto rounded-2xl border border-[var(--border)] bg-background p-4">
        <div className="space-y-5">
          {grid.map((fila) => (
            <div key={fila.fila}>
              <h4 className="font-semibold text-base text-foreground mb-2">Fila: {fila.fila || "-"}</h4>
              <div className="flex flex-wrap gap-2 max-w-full">
                {fila.seats.map((s) => {
                  const isMatch =
                    !filter ||
                    `${s.asistente?.nombre || ""} ${s.asistente?.email || ""}`
                      .toLowerCase()
                      .includes(filter.toLowerCase());

                  return (
                    <div
                      key={s.asientoId}
                      className={`w-28 md:w-32 p-2 rounded-xl border shadow-md flex flex-col items-start gap-1 transition-all duration-200 ${
                        s.ocupado
                          ? "bg-[#2c1015] border-red-500/80"
                          : "bg-[#0f2a23] border-emerald-500/80"
                      } ${isMatch ? "opacity-100" : "opacity-40"}`}
                      title={
                        s.asistente
                          ? `${s.asistente.nombre} <${s.asistente.email}>`
                          : "Libre"
                      }
                    >
                      <div className="text-sm font-medium">
                        Asiento {s.numero_asiento}
                      </div>
                      <div className="text-xs text-gray-600">
                        Sección: {s.seccion || "-"}
                      </div>
                      <div className="text-xs text-gray-700">
                        {s.ocupado ? (
                          <>
                            <div className="font-medium">
                              {s.asistente?.nombre || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {s.asistente?.email || ""}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-green-700">Libre</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-primary/30 bg-card/90 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-base font-semibold text-foreground">
            Resultados encontrados: {filteredAsistentes.length}
          </h5>
          <span className="text-xs text-muted-foreground">
            Solo los asistentes que coinciden con tu búsqueda
          </span>
        </div>
        <div className="max-h-40 overflow-auto rounded-lg border border-primary/40 bg-[#0b172b] p-2">
          {filteredAsistentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron coincidencias.</p>
          ) : (
            filteredAsistentes.map((f) => (
              <div
                key={f.asiento.asientoId}
                className="py-2 border-b last:border-b-0"
              >
                <div className="text-sm font-medium text-foreground">
                  Asiento {f.asiento.numero_asiento} — Fila {f.fila}
                </div>
                <div className="text-xs text-muted-foreground">
                  {f.asiento.asistente?.nombre || "(vacío)"} — {f.asiento.asistente?.email || "N/A"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default VistaSala;
