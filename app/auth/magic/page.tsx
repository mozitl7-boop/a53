"use client";
// Esta página procesa enlaces mágicos y no debe prerenderizarse estáticamente.
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserShort = {
  id: string;
  nombre: string;
  email: string;
  tipo_usuario: string;
};

export default function MagicLinkPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const verifyToken = async (t: string | null) => {
      if (!t) {
        if (!mounted) return;
        setError("Token no proporcionado");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/magic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: t }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (!mounted) return;
          setError(data.error || "Enlace inválido o expirado");
          setLoading(false);
          return;
        }

        if (!mounted) return;
        // Mostrar la pantalla de éxito brevemente antes de redirigir
        setLoading(false);
        setTimeout(() => {
          router.push("/");
        }, 800);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Error procesando el enlace");
        setLoading(false);
      }
    };

    // Obtener token desde window.location.search para evitar el hook useSearchParams
    try {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const t = params ? params.get("token") : null;
      setToken(t);
      verifyToken(t);
    } catch (e) {
      setError("Error leyendo parámetros de la URL");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center p-6">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-[var(--muted)] border-t-[var(--primary)] rounded-full"></div>
          </div>
          <p className="text-[var(--foreground)] font-medium">Verificando enlace...</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Por favor espera mientras procesamos tu solicitud.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="w-[380px] bg-[var(--card)] rounded-xl shadow-md p-6">
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-[var(--destructive)] mb-2">Enlace Inválido</h1>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">{error}</p>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 rounded-full text-sm font-medium hover:opacity-95"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
      <div className="w-[380px] bg-[var(--card)] rounded-xl shadow-md p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-[var(--success)] mb-2">¡Sesión iniciada!</h1>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Redirigiendo a la página principal...</p>
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-2 border-[var(--muted)] border-t-[var(--success)] rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
