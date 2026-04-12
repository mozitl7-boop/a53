"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Sala del Evento</h3>
            <p className="text-xs text-slate-300 mt-1">Evento: {eventoId}</p>
          </div>
          <div className="ml-auto">
            <Badge className="bg-blue-500/20 text-blue-200 px-3 py-1 text-xs font-semibold">
              {grid.length} filas
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
      </div>

      <div className="max-h-[50vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-950/95 p-5 shadow-lg">
        <div className="space-y-6">
          {grid.map((fila) => (
            <div key={fila.fila}>
              <h4 className="font-bold text-lg text-white mb-3">Fila: {fila.fila || "-"}</h4>
              <div className="flex flex-wrap gap-3 max-w-full">
                {fila.seats.map((s) => {
                  const isMatch =
                    !filter ||
                    `${s.asistente?.nombre || ""} ${s.asistente?.email || ""}`
                      .toLowerCase()
                      .includes(filter.toLowerCase());

                  return (
                    <div
                      key={s.asientoId}
                      className={`w-32 md:w-36 p-3 rounded-xl border shadow-md flex flex-col items-start gap-2 transition-all duration-200 ${
                        s.ocupado
                          ? "bg-red-600/20 border-red-500/80"
                          : "bg-emerald-600/20 border-emerald-500/80"
                      } ${isMatch ? "opacity-100" : "opacity-40"}`}
                      title={
                        s.asistente
                          ? `${s.asistente.nombre} <${s.asistente.email}>`
                          : "Libre"
                      }
                    >
                      <div className="text-sm font-bold text-white">
                        Asiento {s.numero_asiento}
                      </div>
                      <div className="text-xs text-slate-300">
                        Sección: {s.seccion || "-"}
                      </div>
                      <div className="text-xs">
                        {s.ocupado ? (
                          <>
                            <div className="font-semibold text-white">
                              {s.asistente?.nombre || "-"}
                            </div>
                            <div className="text-xs text-slate-300 mt-1">
                              {s.asistente?.email || ""}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-emerald-300">Libre</div>
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

      <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-5 shadow-lg">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h5 className="text-xl font-bold text-white">
              Asistentes Encontrados
            </h5>
            <p className="text-xs text-slate-300 mt-1">
              Total: {filteredAsistentes.length}
            </p>
          </div>
        </div>
        <div className="max-h-48 overflow-auto rounded-lg border border-slate-700 bg-slate-900/50 p-3">
          {filteredAsistentes.length === 0 ? (
            <p className="text-sm text-slate-300">No se encontraron coincidencias.</p>
          ) : (
            <div className="space-y-2.5">
              {filteredAsistentes.map((f) => (
                <div
                  key={f.asiento.asientoId}
                  className="py-3 px-2.5 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40 rounded transition-colors"
                >
                  <div className="text-sm font-semibold text-white">
                    Asiento {f.asiento.numero_asiento} — Fila {f.fila}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {f.asiento.asistente?.nombre || "(vacío)"} — {f.asiento.asistente?.email || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VistaSala;
