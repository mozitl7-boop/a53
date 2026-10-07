"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleAlert, LoaderCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckInPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const [nombre, setNombre] = useState("");
  const [matricula, setMatricula] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrarAsistencia = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch(`/api/asistencia/${encodeURIComponent(eventoId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, matricula }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "No se pudo registrar tu asistencia. Intenta nuevamente.");
        setStatus("idle");
        return;
      }

      setAlreadyCheckedIn(Boolean(result.alreadyCheckedIn));
      setStatus("success");
    } catch {
      setError("No hay conexión. Comprueba tu internet e intenta nuevamente.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md border-y border-slate-700 py-10 text-center">
        {status === "submitting" && (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
            <h1 className="mt-5 text-2xl font-semibold">Verificando reserva</h1>
            <p className="mt-2 text-sm text-slate-400">Un momento, estamos registrando tu asistencia.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="mt-5 text-2xl font-semibold">
              {alreadyCheckedIn ? "Tu asistencia ya estaba registrada" : "Asistencia registrada"}
            </h1>
            <p className="mt-2 text-sm text-slate-400">Puedes cerrar esta página y disfrutar del evento.</p>
          </>
        )}
        {status === "idle" && (
          <>
            <QrCode className="mx-auto h-10 w-10 text-cyan-300" />
            <h1 className="mt-5 text-2xl font-semibold">Pase de lista</h1>
            <p className="mt-2 text-sm text-slate-400">Registra tu asistencia con tu nombre y matrícula.</p>
            <form onSubmit={registrarAsistencia} className="mt-6 space-y-4 text-left">
              <label htmlFor="check-in-name" className="block text-sm font-medium text-slate-200">
                Nombre completo
              </label>
              <input
                id="check-in-name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre y apellidos"
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              <label htmlFor="check-in-matricula" className="block text-sm font-medium text-slate-200">
                Matrícula
              </label>
              <input
                id="check-in-matricula"
                type="text"
                autoComplete="off"
                required
                minLength={2}
                maxLength={40}
                value={matricula}
                onChange={(event) => setMatricula(event.target.value.toUpperCase())}
                placeholder="Tu matrícula"
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base uppercase text-white outline-none placeholder:normal-case placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              {error && (
                <p role="alert" className="flex items-start gap-2 text-sm text-rose-300">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={!nombre.trim() || !matricula.trim()}
                className="w-full bg-linear-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] text-white hover:from-[#be123c] hover:via-[#e11d48] hover:to-[#f43f5e]"
              >
                Registrar asistencia
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}